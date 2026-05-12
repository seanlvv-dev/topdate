"""
定时任务 - 匹配调度器
每周三、周六18:00自动执行匹配算法（一对一匹配，不重复匹配历史）
"""
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, or_
from database import async_session
from models import User, Match, MatchHistory, StudentVerificationStatus, MatchStatus
from matching import compute_match_score
from email_service import send_match_notification
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def run_matching(label="匹配"):
    """核心匹配逻辑 - 周三和周六共用"""
    logger.info(f"=== 开始执行{label}任务 ===")
    week_number = datetime.now().isocalendar()[1]

    async with async_session() as db:
        result = await db.execute(
            select(User).where(
                User.verification_status == StudentVerificationStatus.ACTIVE.value,
                User.survey_completed == True,
                User.is_active_matching == True,
            )
        )
        users = result.scalars().all()
        logger.info(f"活跃用户数: {len(users)}")

        if len(users) < 2:
            logger.info("活跃用户不足2人，跳过匹配")
            return

        # --- 构建历史排除集合（已匹配 + 已拒绝，不含过期） ---
        excluded = {u.id: set() for u in users}
        history_result = await db.execute(
            select(Match).where(
                or_(*[Match.user1_id == u.id for u in users], *[Match.user2_id == u.id for u in users]),
                Match.status.in_([MatchStatus.MATCHED.value, MatchStatus.REJECTED.value]),
            )
        )
        for m in history_result.scalars().all():
            excluded.setdefault(m.user1_id, set()).add(m.user2_id)
            excluded.setdefault(m.user2_id, set()).add(m.user1_id)

        logger.info(f"历史排除对: {sum(len(s) for s in excluded.values()) // 2}")

        # --- 本周已有匹配（避免同周重复） ---
        existing_result = await db.execute(
            select(Match).where(Match.week_number == week_number)
        )
        existing_pairs = set()
        for m in existing_result.scalars().all():
            existing_pairs.add(tuple(sorted([m.user1_id, m.user2_id])))

        # --- 收集用户数据 ---
        user_data = []
        for u in users:
            user_data.append({
                "id": u.id,
                "uuid": u.uuid,
                "email": u.email,
                "nickname": u.nickname,
                "university_id": u.university_id,
                "gender": u.gender,
                "answers": u.survey_answers or {},
            })

        # --- 计算所有候选对并排序 ---
        all_pairs = []
        for i in range(len(user_data)):
            for j in range(i + 1, len(user_data)):
                a, b = user_data[i], user_data[j]

                # 历史排除
                if b["id"] in excluded.get(a["id"], set()):
                    continue
                # 本周已有
                if tuple(sorted([a["id"], b["id"]])) in existing_pairs:
                    continue

                ua = {**a["answers"], "gender": a["gender"], "university_id": a["university_id"]}
                ub = {**b["answers"], "gender": b["gender"], "university_id": b["university_id"]}

                result = compute_match_score(ua, ub)
                if not result.get("blocked"):
                    all_pairs.append({
                        "user1_id": a["id"],
                        "user2_id": b["id"],
                        "score": result["overall_score"],
                        "detail_scores": result["detail_scores"],
                        "city_bonus": result["city_bonus"],
                    })

        # --- 一对一贪心分配：按分数降序，已分配用户跳过 ---
        all_pairs.sort(key=lambda x: x["score"], reverse=True)
        assigned_users = set()
        final_matches = []

        for p in all_pairs:
            if p["user1_id"] in assigned_users or p["user2_id"] in assigned_users:
                continue
            final_matches.append(p)
            assigned_users.add(p["user1_id"])
            assigned_users.add(p["user2_id"])

        logger.info(f"一对一匹配: {len(final_matches)} 对, 覆盖 {len(assigned_users)} 人")

        # --- 写入数据库 ---
        now = datetime.utcnow()
        reveal_time = now.replace(hour=18, minute=0, second=0, microsecond=0)
        deadline = reveal_time + timedelta(days=7)

        match_records = []
        for m in final_matches:
            match_records.append(Match(
                user1_id=m["user1_id"],
                user2_id=m["user2_id"],
                compatibility_score=m["score"],
                city_bonus=m.get("city_bonus", 0.0),
                detail_scores=m.get("detail_scores", {}),
                status=MatchStatus.PENDING.value,
                week_number=week_number,
                revealed_at=reveal_time,
                action_deadline=deadline,
                created_at=now,
            ))

        db.add_all(match_records)
        await db.commit()
        logger.info(f"已创建 {len(match_records)} 条匹配记录")

        for u in users:
            u.last_matched_at = now
        await db.commit()

        # --- 通知每个匹配到的人 ---
        for u in users:
            if u.id in assigned_users:
                await send_match_notification(u.email, 1)

        logger.info(f"=== {label}任务完成 ===\n")


async def run_tuesday_matching():
    """周二匹配"""
    await run_matching("周二匹配")


async def run_saturday_matching():
    """周六匹配"""
    await run_matching("周六匹配")


async def cleanup_expired_matches():
    """清理过期匹配"""
    async with async_session() as db:
        now = datetime.utcnow()
        result = await db.execute(
            select(Match).where(
                Match.status == MatchStatus.PENDING.value,
                Match.action_deadline < now,
            )
        )
        expired = result.scalars().all()
        for m in expired:
            m.status = MatchStatus.EXPIRED.value
            db.add(MatchHistory(
                match_id=m.id, user1_id=m.user1_id, user2_id=m.user2_id,
                result="expired", score=m.compatibility_score,
            ))
        await db.commit()
        logger.info(f"已过期 {len(expired)} 条匹配记录")
