"""
匹配算法测试脚本 - 创建20个虚拟用户并运行匹配
复制到服务器: backend/ 目录下，执行 python test_matching.py
"""
import asyncio
import sys
sys.path.insert(0, '.')

from database import async_session
from models import User, Match, VerificationCode, StudentVerificationStatus, MatchStatus
from matching import compute_match_score
from universities import get_university_by_id, is_same_city, is_same_province
from auth import hash_password
from sqlalchemy import select, delete

# ========== 4 种性格画像模板 ==========

def profile(name, gender, prefer, university_id, social, sleep, spicy, weekend, career, ritual, sports):
    """快速生成问卷答案"""
    return {
        "name": name,
        "gender": gender,
        "prefer_gender": prefer,
        "relationship_expectation": "long_term",
        "age": 22,
        "age_range_min": 20,
        "age_range_max": 26,
        "graduation_year": 2027,
        "partner_graduation_year_pref": "no_limit",
        "height": 175 if gender == "male" else 163,
        "height_range_min": 165 if gender == "male" else 160,
        "height_range_max": 190 if gender == "male" else 185,
        "home_province": get_university_by_id(university_id)["province"],
        "body_type": "average",
        "prefer_body_type": "any",
        "daily_style": "简约休闲",
        "prefer_daily_style": "都行",
        # --- 吸引力 ---
        "social_setting": social,
        "prefer_social_setting": 4,
        "love_languages": ["高质量陪伴", "口头赞美", "肢体接触"],
        "ritual_importance": ritual,
        "appearance_effort": 5,
        "prefer_appearance_effort": 4,
        "self_traits": ["诚实坦率", "有责任心", "幽默风趣", "情绪稳定", "善于倾听"],
        "partner_traits": ["诚实坦率", "情绪稳定", "有责任心", "温柔体贴", "善于倾听"],
        # --- 日常 ---
        "sleep_schedule": sleep,
        "messiness_tolerance": 4,
        "eating_habit": 4,
        "spice_tolerance": spicy,
        "dietary": "none",
        "weekend_pref": weekend,
        "togetherness": 4,
        "travel_style": 4,
        "spending_style": 4,
        "smoking": 1,
        "accept_smoking": 4,
        "drinking": 2,
        "accept_drinking": 4,
        "hobbies": sports,
        "hobby_overlap_pref": 4,
        "meeting_frequency": "2_3_week",
        "social_media_sharing": 4,
        # --- 情感 ---
        "reply_anxiety": 4,
        "insecurity_style": 4,
        "vulnerability": 4,
        "opposite_sex_friend": 4,
        "decision_making": 4,
        "care_style": 4,
        "intimacy_pace": 4,
        "fight_reaction": 4,
        "reconciliation": 4,
        # --- 未来 ---
        "career_drive": career,
        "prefer_career_drive": 4,
        "post_grad_lifestyle": 5,
        "max_distance_preference": "anywhere",
    }

# ========== 20 个用户定义 ==========
# 格式: (昵称, 性别, 找谁, 大学ID, 社交1-7, 作息1-7, 吃辣1-7, 周末1-7, 事业1-7, 仪式1-7, 爱好列表)

USERS = [
    # ---- 上海(4人): 复旦(3) + 上交(4) ----
    ("小红_sh", "female", "male", 3, 6, 6, 7, 6, 7, 7, ["运动健身","旅行","美食探店"]),       # 复旦女A - 外向运动型
    ("小明_sh", "male",   "female", 3, 5, 5, 6, 5, 6, 6, ["运动健身","旅行","户外运动"]),      # 复旦男A - 相似(预期高分匹配)
    ("小丽_sh", "female", "male", 4, 2, 2, 1, 2, 3, 2, ["阅读写作","电影/剧集","看展/博物馆"]), # 上交女B - 内向文静型
    ("小强_sh", "male",   "female", 4, 2, 3, 2, 2, 3, 3, ["阅读写作","音乐","游戏"]),          # 上交男B - 相似(预期高分匹配)

    # ---- 北京(4人): 北大(1) + 清华(2) + 人大(10) + 北航(12) ----
    ("大北_m", "male",   "female", 1, 6, 7, 5, 7, 7, 6, ["编程/科技","阅读写作","音乐"]),      # 北大男 - 事业型(同城→高分)
    ("大北_f", "female", "male",   2, 5, 6, 4, 6, 6, 5, ["编程/科技","阅读写作","音乐"]),      # 清华女 - 相似(预期匹配)
    ("大文_f", "female", "male",  10, 3, 3, 3, 3, 3, 4, ["看展/博物馆","舞蹈","手工/DIY"]),    # 人大女 - 文艺型
    ("大文_m", "male",   "female", 12, 4, 3, 3, 4, 3, 4, ["看展/博物馆","摄影","动漫/二次元"]), # 北航男 - 相似(预期匹配)

    # ---- 杭州(2人): 浙大(5) - 互补型 ----
    ("杭_小涯", "male",   "female", 5, 1, 2, 1, 1, 2, 2, ["游戏","动漫/二次元","编程/科技"]),   # 浙大男 - 极度内向宅
    ("杭_小雨", "female", "male",   5, 4, 4, 4, 4, 4, 4, ["音乐","电影/剧集","阅读写作"]),       # 浙大女 - 中间型(互补→中等分数)

    # ---- 南京(3人): 南大(6) + 东南(23) - 同省不同城 ----
    ("宁_小洋", "male",   "female", 6, 5, 5, 6, 5, 5, 5, ["运动健身","美食探店","旅行"]),       # 南大男 - 与东南女相似(同省不同城)
    ("宁_小美", "female", "male",  23, 5, 4, 5, 5, 5, 5, ["运动健身","美食探店","旅行"]),       # 东南女 - 相似(同省+12→18加分)
    ("宁_小龙", "male",   "female", 6, 7, 1, 7, 7, 7, 7, ["户外运动","旅行","摄影"]),            # 南大男2 - 完全不同风格

    # ---- 成都(3人): 川大(33) + 电子科大(34) ----
    ("蓉_小川", "male",   "female", 33, 6, 6, 7, 6, 5, 6, ["美食探店","旅行","摄影"]),           # 川大男 - 与同城女相似
    ("蓉_小花", "female", "male",   33, 5, 5, 7, 5, 5, 6, ["美食探店","旅行","桌游/剧本杀"]),    # 川大女 - 相似(同城→高匹配)
    ("蓉_小电", "female", "male",   34, 3, 3, 2, 3, 7, 3, ["编程/科技","阅读写作","音乐"]),       # 电子科大女 - 不同风格(学业狂)

    # ---- 武汉(4人): 武大(27) + 华科(28) ----
    ("汉_小武", "male",   "female", 27, 5, 5, 5, 5, 5, 5, ["电影/剧集","音乐","旅行"]),          # 武大男 - 与武大女相似
    ("汉_小樱", "female", "male",   27, 4, 5, 4, 5, 5, 5, ["电影/剧集","阅读写作","音乐"]),       # 武大女 - 相似(同校→高匹配)
    ("汉_小科", "male",   "female", 28, 4, 4, 4, 4, 6, 4, ["编程/科技","阅读写作","游戏"]),       # 华科男 - 与华科女相似
    ("汉_小雅", "female", "male",   28, 4, 4, 4, 4, 6, 4, ["编程/科技","音乐","看展/博物馆"]),    # 华科女 - 相似(同校→高匹配)
]


async def main():
    print("=" * 80)
    print("TopDate 匹配算法测试 - 20个虚拟用户")
    print("=" * 80)

    async with async_session() as db:
        # ------- 清空旧测试数据 -------
        print("\n[1/4] 清空旧测试数据...")
        test_emails = [f"test_{i}@topdate.test" for i in range(1, 21)]
        for e in test_emails:
            await db.execute(delete(VerificationCode).where(VerificationCode.email == e))
            await db.execute(delete(Match).where(Match.user1_id.in_(
                select(User.id).where(User.email == e)
            )))
            await db.execute(delete(User).where(User.email == e))
        await db.commit()

        # ------- 创建20个用户 -------
        print("[2/4] 创建20个虚拟用户...")
        users = []
        for i, (name, gender, prefer, uni_id, social, sleep, spicy, weekend, career, ritual, sports) in enumerate(USERS):
            email = f"test_{i+1}@topdate.test"
            answers = profile(name, gender, prefer, uni_id, social, sleep, spicy, weekend, career, ritual, sports)
            user = User(
                email=email,
                nickname=name,
                university_id=uni_id,
                gender=gender,
                prefer_gender=prefer,
                age=22,
                hashed_password=hash_password("test123"),
                verification_status=StudentVerificationStatus.ACTIVE.value,
                survey_completed=True,
                survey_answers=answers,
                is_active_matching=True,
            )
            db.add(user)
            users.append((user, answers))
        await db.flush()
        await db.commit()
        print(f"  已创建 {len(users)} 个用户")

        # ------- 用匹配逻辑计算所有配对 -------
        print("[3/4] 计算所有配对分数...")
        all_pairs = []
        for i in range(len(users)):
            for j in range(i + 1, len(users)):
                ui, ai = users[i]
                uj, aj = users[j]
                ua = {**ai, "gender": ui.gender, "university_id": ui.university_id}
                ub = {**aj, "gender": uj.gender, "university_id": uj.university_id}
                result = compute_match_score(ua, ub)
                if not result.get("blocked"):
                    all_pairs.append({
                        "user1": ui, "user2": uj,
                        "score": result["overall_score"],
                        "similarity": result.get("similarity_score", 0),
                        "city_bonus": result.get("city_bonus", 0),
                        "details": result.get("detail_scores", {}),
                        "same_city": result.get("same_city", False),
                        "same_province": result.get("same_province", False),
                    })

        # 按分数降序 + 一对一贪心分配
        all_pairs.sort(key=lambda x: x["score"], reverse=True)
        assigned = set()
        final_matches = []
        for p in all_pairs:
            if p["user1"].id in assigned or p["user2"].id in assigned:
                continue
            final_matches.append(p)
            assigned.add(p["user1"].id)
            assigned.add(p["user2"].id)

        print(f"  共生成 {len(all_pairs)} 个候选对，最终 {len(final_matches)} 个匹配\n")

        # ------- 输出 -------
        print("=" * 80)
        print("【表1】匹配结果（一对一贪心）")
        print("=" * 80)
        for i, m in enumerate(final_matches):
            u1, u2 = m["user1"], m["user2"]
            uni1 = get_university_by_id(u1.university_id)
            uni2 = get_university_by_id(u2.university_id)
            tag = ""
            if m["same_city"]: tag = "🏙️ 同城"
            elif m["same_province"]: tag = "🏠 同省"
            print(f"\n#{i+1}  {u1.nickname}({uni1['short_name']}-{uni1['city']})  ♥  {u2.nickname}({uni2['short_name']}-{uni2['city']})  {tag}")
            print(f"    总分 {m['score']}%  =  相似 {m['similarity']}%  +  地理加分 {m['city_bonus']}")
            det = m["details"]
            print(f"    维度: 第一印象{det.get('first_impression',0):.0f}% | 吸引力{det.get('attraction',0):.0f}% | 日常{det.get('daily_life',0):.0f}% | 情感{det.get('connection',0):.0f}% | 未来{det.get('future',0):.0f}%")

        print("\n" + "=" * 80)
        print("【表2】所有用户的问卷关键差异")
        print("=" * 80)
        for u, ans in users:
            uni = get_university_by_id(u.university_id)
            print(f"\n{u.nickname}({u.gender} | {uni['short_name']}-{uni['city']})")
            print(f"  社交:{ans['social_setting']} | 作息:{ans['sleep_schedule']}(1夜猫~7早起) | 吃辣:{ans['spice_tolerance']}(1不碰~7无辣不欢)")
            print(f"  周末:{ans['weekend_pref']}(1校园~7进城) | 事业:{ans['career_drive']}(1享受~7拼搏) | 仪式感:{ans['ritual_importance']}")
            print(f"  爱好: {', '.join(ans['hobbies'][:3])}")

        print("\n" + "=" * 80)
        print("【表3】未匹配到的人")
        print("=" * 80)
        matched_ids = set()
        for m in final_matches:
            matched_ids.add(m["user1"].id)
            matched_ids.add(m["user2"].id)
        unmatched = [u for u, _ in users if u.id not in matched_ids]
        if unmatched:
            for u in unmatched:
                uni = get_university_by_id(u.university_id)
                print(f"  {u.nickname}({uni['short_name']}) - 本轮未配对到合适的人")
        else:
            print("  全部配对成功！")

    print("\n完成。")

asyncio.run(main())
