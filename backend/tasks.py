"""
定时任务 - 匹配调度器
每周三18:00自动执行匹配算法
"""
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, and_, or_
from database import async_session, engine
from models import User, Match, MatchHistory, StudentVerificationStatus, MatchStatus
from matching import compute_match_score
from email_service import send_match_notification
from config import get_settings
from universities import get_university_by_id

logger = logging.getLogger(__name__)
settings = get_settings()


async def run_weekly_matching():
    """执行每周匹配任务"""
    logger.info("=== 开始执行每周匹配任务 ===")
    week_number = datetime.now().isocalendar()[1]

    async with async_session() as db:
        # 获取所有活跃用户（已验证且完成问卷）
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

        # 获取本周已匹配的用户对（避免重复）
        existing_result = await db.execute(
            select(Match).where(Match.week_number == week_number)
        )
        existing_matches = existing_result.scalars().all()
        existing_pairs = set()
        for m in existing_matches:
            pair = tuple(sorted([m.user1_id, m.user2_id]))
            existing_pairs.add(pair)

        # 为每个用户计算候选匹配
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

        all_matches = []
        for i in range(len(user_data)):
            candidates = []
            for j in range(len(user_data)):
                if i == j:
                    continue
                # 检查是否已在本周匹配
                pair = tuple(sorted([user_data[i]["id"], user_data[j]["id"]]))
                if pair in existing_pairs:
                    continue

                # 合并答案和基本属性
                ua = {
                    **user_data[i]["answers"],
                    "gender": user_data[i]["gender"],
                    "university_id": user_data[i]["university_id"],
                }
                ub = {
                    **user_data[j]["answers"],
                    "gender": user_data[j]["gender"],
                    "university_id": user_data[j]["university_id"],
                }

                result = compute_match_score(ua, ub)
                if not result.get("blocked"):
                    candidates.append({
                        "user2_id": user_data[j]["id"],
                        "score": result["overall_score"],
                        "detail_scores": result["detail_scores"],
                        "city_bonus": result["city_bonus"],
                    })

            # 排序取top N
            candidates.sort(key=lambda x: x["score"], reverse=True)
            top_candidates = candidates[:settings.TOP_MATCHES_PER_USER]

            for c in top_candidates:
                all_matches.append({
                    "user1_id": user_data[i]["id"],
                    "user2_id": c["user2_id"],
                    "score": c["score"],
                    "city_bonus": c["city_bonus"],
                    "detail_scores": c["detail_scores"],
                })

        # 去重：每个pair只保留分数最高的方向
        pair_scores = {}
        for m in all_matches:
            pair = tuple(sorted([m["user1_id"], m["user2_id"]]))
            if pair not in pair_scores or m["score"] > pair_scores[pair]["score"]:
                pair_scores[pair] = m

        # 插入匹配记录
        now = datetime.utcnow()
        reveal_time = now.replace(hour=18, minute=0, second=0, microsecond=0)
        deadline = reveal_time + timedelta(days=7)

        match_records = []
        for pair, m in pair_scores.items():
            match_records.append(Match(
                user1_id=pair[0],
                user2_id=pair[1],
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

        # 更新用户最后匹配时间
        for u in users:
            u.last_matched_at = now
        await db.commit()

        # 发送邮件通知
        from collections import defaultdict
        user_match_counts = defaultdict(int)
        for pair, m in pair_scores.items():
            user_match_counts[pair[0]] += 1
            user_match_counts[pair[1]] += 1

        for u in users:
            count = user_match_counts.get(u.id, 0)
            if count > 0:
                await send_match_notification(u.email, count)

        logger.info("=== 本周匹配任务完成 ===")


async def cleanup_expired_matches():
    """清理过期匹配（下周三18:00后仍未操作的匹配自动过期）"""
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
            # 记录到历史
            db.add(MatchHistory(
                match_id=m.id,
                user1_id=m.user1_id,
                user2_id=m.user2_id,
                result="expired",
                score=m.compatibility_score,
            ))
        await db.commit()
        logger.info(f"已过期 {len(expired)} 条匹配记录")
