"""
匹配算法 - 基于相似性吸引理论与加权评分系统

核心参考文献:
- Byrne's Similarity-Attraction Model (1971)
- Optimal Distinctiveness Theory (Brewer, 1991)
- OKCupid匹配算法参考

算法流程:
1. 将每个用户的答案向量化
2. 计算用户对之间的相似度分数(0-100)
3. 加入城市/省份奖励分
4. 按分数排序，为每个用户选top N
"""
import math
from typing import Optional
from universities import (
    is_same_city, is_same_province, is_neighboring_province,
    QUOTA_PREFERENCE_MAP, get_university_by_id
)

# 各部分的权重配置
SECTION_WEIGHTS = {
    "first_impression": 0.15,   # 第一印象
    "attraction": 0.25,         # 吸引力
    "daily_life": 0.25,         # 日常生活
    "connection": 0.20,         # 情感连接
    "future": 0.15,             # 未来规划
}

# 地理位置乘法系数（替代加法加分，避免同城全部满分）
# 参考 OKCupid 的距离衰减模型：近距离 ≈ 概率×1.15，远距离 ≈ 概率×0.85
LOCATION_MULTIPLIER = {
    "same_city": 1.15,       # 同城：相似度提升15%
    "same_province": 1.08,   # 同省：提升8%
    "neighboring": 1.04,     # 邻省：提升4%
    "far": 0.92,             # 远距：微降8%
}

# 互补性权重（适中，因为研究发现相似性更重要）
COMPLEMENTARITY_WEIGHT = 0.1


def _slider_similarity(a: int, b: int, min_val: int = 1, max_val: int = 7) -> float:
    """计算滑块(1-7)的相似度，返回0-1"""
    if a is None or b is None:
        return 0.5
    diff = abs(a - b)
    max_diff = max_val - min_val
    return 1.0 - (diff / max_diff)


def _slider_complementarity(a: int, b: int, min_val: int = 1, max_val: int = 7) -> float:
    """计算互补性：如果双方在1-7量表上互补（一个偏高一个偏低），返回高分
    例如：一个喜欢照顾人(7)，一个喜欢被照顾(1)，则互补性高
    """
    if a is None or b is None:
        return 0.5
    # 互补意味着一个在高端一个在低端，距离越大越互补
    diff = abs(a - b)
    max_diff = max_val - min_val
    return diff / max_diff  # 距离越大越互补


def _categorical_similarity(a, b, allow_partial: bool = True) -> float:
    """计算类别相似度，any/都行/不限 视为通配符（总是匹配）"""
    if a is None or b is None:
        return 0.5
    wildcards = {"any", "all", "都行", "不限", "都可以", "无限制", "All good"}
    if isinstance(a, str) and a.strip() in wildcards:
        return 1.0
    if isinstance(b, str) and b.strip() in wildcards:
        return 1.0
    if a == b:
        return 1.0
    if allow_partial and isinstance(a, str) and isinstance(b, str):
        if a in b or b in a:
            return 0.5
    return 0.0


def _list_overlap(a: list, b: list) -> float:
    """计算列表重叠度 (Jaccard相似系数)"""
    if not a or not b:
        return 0.5
    set_a, set_b = set(a), set(b)
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    if union == 0:
        return 0.5
    return intersection / union


def _age_range_penalty(
    user_a_age: int, user_a_min: Optional[int], user_a_max: Optional[int],
    user_b_age: int, user_b_min: Optional[int], user_b_max: Optional[int],
) -> float:
    """检查年龄是否在对方可接受范围内"""
    a_ok = True
    b_ok = True
    if user_a_min is not None and user_a_max is not None:
        if user_b_age < user_a_min or user_b_age > user_a_max:
            a_ok = False
    if user_b_min is not None and user_b_max is not None:
        if user_a_age < user_b_min or user_a_age > user_b_max:
            b_ok = False
    if a_ok and b_ok:
        return 1.0
    elif a_ok or b_ok:
        return 0.5
    return 0.0


def compute_match_score(user_a: dict, user_b: dict) -> dict:
    """
    计算两个用户之间的匹配分数

    Args:
        user_a: 用户A的答案字典
        user_b: 用户B的答案字典

    Returns:
        dict with overall_score, detail_scores, city_bonus
    """
    # 性别筛选：如果用户A指定偏好，检查用户B性别是否符合
    if user_a.get("prefer_gender") and user_b.get("gender"):
        if user_a["prefer_gender"] != user_b["gender"]:
            return {"overall_score": 0.0, "detail_scores": {}, "city_bonus": 0.0, "blocked": True, "reason": "性别不匹配"}

    if user_b.get("prefer_gender") and user_a.get("gender"):
        if user_b["prefer_gender"] != user_a["gender"]:
            return {"overall_score": 0.0, "detail_scores": {}, "city_bonus": 0.0, "blocked": True, "reason": "性别不匹配"}

    scores = {}
    weights = {}

    # === Part 1: First Impressions ===
    s1 = 0.0
    # 关系期望 (categorical)
    s1 += _categorical_similarity(user_a.get("relationship_expectation"), user_b.get("relationship_expectation")) * 0.10
    # 年龄范围匹配
    s1 += _age_range_penalty(
        user_a.get("age"), user_a.get("age_range_min"), user_a.get("age_range_max"),
        user_b.get("age"), user_b.get("age_range_min"), user_b.get("age_range_max"),
    ) * 0.15
    # 毕业年份偏好
    grad_a = user_a.get("graduation_year")
    grad_b = user_b.get("graduation_year")
    if grad_a and grad_b:
        grad_diff = abs(grad_a - grad_b)
        grad_sim = max(0.0, 1.0 - grad_diff / 10.0)
        s1 += grad_sim * 0.10
    # 身高匹配
    a_h = user_a.get("height")
    a_hmin = user_a.get("height_range_min")
    a_hmax = user_a.get("height_range_max")
    b_h = user_b.get("height")
    b_hmin = user_b.get("height_range_min")
    b_hmax = user_b.get("height_range_max")
    height_ok = 1.0
    if a_hmin and a_hmax and b_h:
        if b_h < a_hmin or b_h > a_hmax:
            height_ok *= 0.5
    if b_hmin and b_hmax and a_h:
        if a_h < b_hmin or a_h > b_hmax:
            height_ok *= 0.5
    s1 += height_ok * 0.15
    # 家乡省份
    s1 += (1.0 if user_a.get("home_province") == user_b.get("home_province") else 0.0) * 0.05
    # 体型偏好
    s1 += _categorical_similarity(user_a.get("prefer_body_type"), user_b.get("body_type"), allow_partial=False) * 0.15
    s1 += _categorical_similarity(user_b.get("prefer_body_type"), user_a.get("body_type"), allow_partial=False) * 0.10
    # 穿搭风格
    s1 += _categorical_similarity(user_a.get("prefer_daily_style"), user_b.get("daily_style")) * 0.15

    scores["first_impression"] = s1
    weights["first_impression"] = SECTION_WEIGHTS["first_impression"]

    # === Part 2: Attraction ===
    s2 = 0.0
    # 社交风格（倾向相似）
    s2 += _slider_similarity(user_a.get("social_setting"), user_b.get("social_setting")) * 0.20
    # 爱的语言
    s2 += _list_overlap(user_a.get("love_languages", []), user_b.get("love_languages", [])) * 0.20
    # 仪式感重要性
    s2 += _slider_similarity(user_a.get("ritual_importance"), user_b.get("ritual_importance")) * 0.15
    # 外貌重视程度
    s2 += _slider_similarity(user_a.get("appearance_effort"), user_b.get("appearance_effort")) * 0.15
    # 自我特质 vs 对方看重特质
    s2 += _list_overlap(user_a.get("self_traits", []), user_b.get("partner_traits", [])) * 0.15
    s2 += _list_overlap(user_b.get("self_traits", []), user_a.get("partner_traits", [])) * 0.15

    scores["attraction"] = s2
    weights["attraction"] = SECTION_WEIGHTS["attraction"]

    # === Part 3: Daily Life ===
    s3 = 0.0
    s3 += _slider_similarity(user_a.get("sleep_schedule"), user_b.get("sleep_schedule")) * 0.10
    s3 += _slider_similarity(user_a.get("messiness_tolerance"), user_b.get("messiness_tolerance")) * 0.10
    s3 += _slider_similarity(user_a.get("eating_habit"), user_b.get("eating_habit")) * 0.08
    s3 += _slider_similarity(user_a.get("spice_tolerance"), user_b.get("spice_tolerance")) * 0.08
    s3 += _categorical_similarity(user_a.get("dietary"), user_b.get("dietary")) * 0.07
    s3 += _slider_similarity(user_a.get("weekend_pref"), user_b.get("weekend_pref")) * 0.07
    s3 += _slider_similarity(user_a.get("togetherness"), user_b.get("togetherness")) * 0.08
    s3 += _slider_similarity(user_a.get("travel_style"), user_b.get("travel_style")) * 0.07
    s3 += _slider_similarity(user_a.get("spending_style"), user_b.get("spending_style")) * 0.08
    s3 += _slider_similarity(user_a.get("smoking"), user_b.get("smoking")) * 0.05
    s3 += _slider_similarity(user_a.get("drinking"), user_b.get("drinking")) * 0.05
    s3 += _list_overlap(user_a.get("hobbies", []), user_b.get("hobbies", [])) * 0.10
    s3 += _slider_similarity(user_a.get("hobby_overlap_pref"), user_b.get("hobby_overlap_pref")) * 0.03
    s3 += _categorical_similarity(user_a.get("meeting_frequency"), user_b.get("meeting_frequency")) * 0.04

    scores["daily_life"] = s3
    weights["daily_life"] = SECTION_WEIGHTS["daily_life"]

    # === Part 4: Connection ===
    s4 = 0.0
    s4 += _slider_similarity(user_a.get("reply_anxiety"), user_b.get("reply_anxiety")) * 0.10
    s4 += _slider_similarity(user_a.get("insecurity_style"), user_b.get("insecurity_style")) * 0.10
    s4 += _slider_similarity(user_a.get("vulnerability"), user_b.get("vulnerability")) * 0.10
    s4 += _slider_similarity(user_a.get("opposite_sex_friend"), user_b.get("opposite_sex_friend")) * 0.10
    s4 += _slider_similarity(user_a.get("decision_making"), user_b.get("decision_making")) * 0.10
    s4 += _slider_similarity(user_a.get("intimacy_pace"), user_b.get("intimacy_pace")) * 0.15
    s4 += _slider_similarity(user_a.get("fight_reaction"), user_b.get("fight_reaction")) * 0.15
    s4 += _slider_similarity(user_a.get("reconciliation"), user_b.get("reconciliation")) * 0.10
    # 互补性检查：照顾/被照顾
    complement = _slider_complementarity(user_a.get("care_style"), user_b.get("care_style"))
    s4 += complement * 0.05 * (1.0 - COMPLEMENTARITY_WEIGHT) + 0.05 * COMPLEMENTARITY_WEIGHT
    s4 += _slider_similarity(user_a.get("social_media_sharing"), user_b.get("social_media_sharing")) * 0.05

    scores["connection"] = s4
    weights["connection"] = SECTION_WEIGHTS["connection"]

    # === Part 5: Future ===
    s5 = 0.0
    s5 += _slider_similarity(user_a.get("career_drive"), user_b.get("career_drive")) * 0.35
    s5 += _slider_similarity(user_a.get("prefer_career_drive"), user_b.get("prefer_career_drive")) * 0.35
    s5 += _slider_similarity(user_a.get("post_grad_lifestyle"), user_b.get("post_grad_lifestyle")) * 0.30

    scores["future"] = s5
    weights["future"] = SECTION_WEIGHTS["future"]

    # === 加权总分 ===
    total_similarity = sum(scores[k] * weights[k] for k in scores)
    total_similarity = min(1.0, max(0.0, total_similarity))

    # === 地理位置乘法系数 ===
    uni_a_id = user_a.get("university_id")
    uni_b_id = user_b.get("university_id")

    max_dist_a = user_a.get("max_distance_preference", "anywhere")
    max_dist_b = user_b.get("max_distance_preference", "anywhere")

    location_mult = LOCATION_MULTIPLIER["far"]
    if is_same_city(uni_a_id, uni_b_id):
        location_mult = LOCATION_MULTIPLIER["same_city"]
    elif is_same_province(uni_a_id, uni_b_id):
        location_mult = LOCATION_MULTIPLIER["same_province"]
    elif is_neighboring_province(uni_a_id, uni_b_id):
        location_mult = LOCATION_MULTIPLIER["neighboring"]

    # 距离偏好约束：超出用户设定的距离偏好时降权
    dist_a_level = QUOTA_PREFERENCE_MAP.get(max_dist_a, 3)
    dist_b_level = QUOTA_PREFERENCE_MAP.get(max_dist_b, 3)

    actual_level = 3
    if is_same_city(uni_a_id, uni_b_id) or is_same_province(uni_a_id, uni_b_id):
        actual_level = 1
    elif is_neighboring_province(uni_a_id, uni_b_id):
        actual_level = 2

    if actual_level > dist_a_level or actual_level > dist_b_level:
        location_mult *= 0.85  # 超出距离偏好，额外削减 15%

    # === 最终得分：乘法融合 ===
    raw_score = total_similarity * 100.0 * location_mult
    final_score = min(100.0, round(raw_score, 1))

    uni_a = get_university_by_id(uni_a_id)
    uni_b = get_university_by_id(uni_b_id)

    return {
        "overall_score": round(final_score, 1),
        "similarity_score": round(total_similarity * 100.0, 1),
        "city_bonus": 0.0,
        "detail_scores": {**{k: round(v * 100, 1) for k, v in scores.items()}, "_similarity": round(total_similarity * 100.0, 1)},
        "same_city": is_same_city(uni_a_id, uni_b_id),
        "same_province": is_same_province(uni_a_id, uni_b_id),
        "blocked": False,
        "reason": None,
    }
