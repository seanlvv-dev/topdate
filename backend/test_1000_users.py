"""
生成 1000 个虚拟测试用户并填充随机问卷
执行: python test_1000_users.py
清理: DELETE FROM users WHERE email LIKE '%@fake.test';
"""
import asyncio
import random
import sys
sys.path.insert(0, '.')

from database import async_session
from models import User, StudentVerificationStatus
from auth import hash_password
from universities import UNIVERSITIES

# 分布权重：北京/上海/武汉等高校聚集地更多用户
CITY_WEIGHTS = {}
for i, u in enumerate(UNIVERSITIES):
    if u["city"] in ["北京", "上海"]:
        CITY_WEIGHTS[u["id"]] = 5
    elif u["city"] in ["武汉", "南京", "杭州", "广州", "成都", "西安"]:
        CITY_WEIGHTS[u["id"]] = 3
    else:
        CITY_WEIGHTS[u["id"]] = 2

def random_profile(gender, uni_id, nickname):
    """生成随机问卷答案"""
    uni = next(u for u in UNIVERSITIES if u["id"] == uni_id)
    prefer = "female" if gender == "male" else "male"
    return {
        "gender": gender,
        "prefer_gender": prefer,
        "relationship_expectation": random.choice(["long_term", "short_term", "let_it_flow"]),
        "age": random.randint(19, 28),
        "age_range_min": random.randint(18, 22),
        "age_range_max": random.randint(23, 32),
        "graduation_year": random.randint(2026, 2030),
        "partner_graduation_year_pref": random.choice(["no_limit", "within_2", "within_1", "same"]),
        "height": random.randint(165, 186) if gender == "male" else random.randint(155, 172),
        "height_range_min": random.randint(155, 170) if gender == "male" else random.randint(168, 178),
        "height_range_max": random.randint(175, 195) if gender == "male" else random.randint(180, 195),
        "home_province": uni["province"],
        "body_type": random.choice(["slim", "average", "slightly_chubby", "athletic"]),
        "prefer_body_type": random.choice(["slim", "average", "slightly_chubby", "athletic", "any"]),
        "daily_style": random.choice(["运动休闲", "简约休闲", "精致时尚", "优雅知性", "舒适为主", "极简主义", "街头潮流", "文艺复古", "复古风"]),
        "prefer_daily_style": random.choice(["运动休闲", "简约休闲", "精致时尚", "优雅知性", "舒适为主", "极简主义", "街头潮流", "文艺复古", "复古风", "都行"]),
        # 吸引力
        "social_setting": random.randint(1, 7),
        "prefer_social_setting": random.randint(1, 7),
        "love_languages": random.sample(["口头赞美", "高质量陪伴", "贴心礼物", "服务行动", "肢体接触", "被记住的细节", "低谷时的情感支持", "一起尝试新事物", "规划未来"], k=random.randint(2, 3)),
        "ritual_importance": random.randint(1, 7),
        "appearance_effort": random.randint(1, 7),
        "prefer_appearance_effort": random.randint(1, 7),
        "self_traits": random.sample(["善于表达爱", "情绪稳定", "善于倾听", "尊重边界", "有责任心", "温柔体贴", "诚实坦率", "幽默风趣", "有主见", "成长型思维", "思维敏锐", "能力突出", "忠诚专一"], k=random.randint(3, 5)),
        "partner_traits": random.sample(["善于表达爱", "情绪稳定", "善于倾听", "尊重边界", "有责任心", "温柔体贴", "诚实坦率", "幽默风趣", "有主见", "成长型思维", "思维敏锐", "能力突出", "忠诚专一"], k=random.randint(3, 5)),
        # 日常
        "sleep_schedule": random.randint(1, 7),
        "messiness_tolerance": random.randint(1, 7),
        "eating_habit": random.randint(1, 7),
        "spice_tolerance": random.randint(1, 7),
        "dietary": random.choice(["none", "none", "none", "none", "halal", "vegetarian"]),
        "weekend_pref": random.randint(1, 7),
        "togetherness": random.randint(1, 7),
        "travel_style": random.randint(1, 7),
        "spending_style": random.randint(1, 7),
        "smoking": random.choices([1, 2, 3, 4], weights=[7, 2, 1, 0])[0],
        "accept_smoking": random.randint(1, 7),
        "drinking": random.choices([1, 2, 3, 4, 5], weights=[4, 3, 2, 1, 0])[0],
        "accept_drinking": random.randint(1, 7),
        "hobbies": random.sample(["运动健身", "阅读写作", "音乐", "电影/剧集", "美食探店", "旅行", "摄影", "游戏", "桌游/剧本杀", "看展/博物馆", "舞蹈", "手工/DIY", "户外运动", "编程/科技", "动漫/二次元", "宠物"], k=random.randint(2, 5)),
        "hobby_overlap_pref": random.randint(1, 7),
        "meeting_frequency": random.choice(["daily", "2_3_week", "1_week", "biweekly"]),
        "social_media_sharing": random.randint(1, 7),
        # 情感
        "reply_anxiety": random.randint(1, 7),
        "insecurity_style": random.randint(1, 7),
        "vulnerability": random.randint(1, 7),
        "opposite_sex_friend": random.randint(1, 7),
        "decision_making": random.randint(1, 7),
        "care_style": random.randint(1, 7),
        "intimacy_pace": random.randint(1, 7),
        "fight_reaction": random.randint(1, 7),
        "reconciliation": random.randint(1, 7),
        # 未来
        "career_drive": random.randint(1, 7),
        "prefer_career_drive": random.randint(1, 7),
        "post_grad_lifestyle": random.randint(1, 7),
        "max_distance_preference": random.choice(["same_city", "same_province", "neighboring", "anywhere"]),
    }

_names = [
    "星辰", "微风", "暖阳", "秋水", "冬雪", "春华", "夏雨", "晨曦", "暮光", "远山",
    "流云", "清风", "明月", "繁星", "彩虹", "霜叶", "海风", "落日", "朝阳", "北极",
    "小鹿", "麋鹿", "白鸽", "海豚", "企鹅", "狐狸", "熊猫", "考拉", "松鼠", "蝴蝶",
]

async def main():
    print("生成 1000 个虚拟用户...")
    uni_ids = list(CITY_WEIGHTS.keys())
    weights = [CITY_WEIGHTS[u] for u in uni_ids]

    async with async_session() as db:
        for i in range(1, 1001):
            uni_id = random.choices(uni_ids, weights=weights, k=1)[0]
            gender = "male" if i % 2 == 0 else "female"
            name = f"虚拟{random.choice(_names)}{i:04d}"
            answers = random_profile(gender, uni_id, name)
            user = User(
                email=f"test_{i:04d}@fake.test",
                nickname=name[:20],
                university_id=uni_id,
                gender=gender,
                prefer_gender=answers["prefer_gender"],
                age=answers["age"],
                hashed_password=hash_password("fake123"),
                verification_status=StudentVerificationStatus.ACTIVE.value,
                survey_completed=True,
                survey_answers=answers,
                is_active_matching=True,
            )
            db.add(user)
            if i % 100 == 0:
                await db.flush()
                print(f"  {i}/1000...")
        await db.commit()
    print("完成！1000 个用户已创建。")
    print("清理命令：DELETE FROM users WHERE email LIKE '%@fake.test'; DELETE FROM matches WHERE user1_id IN (SELECT id FROM users WHERE email LIKE '%@fake.test') OR user2_id IN (SELECT id FROM users WHERE email LIKE '%@fake.test');")

asyncio.run(main())
