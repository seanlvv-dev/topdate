"""
TopDate AI 服务 - AI 破冰助手
基于双方问卷（脱敏后）调用大模型，生成破冰话题与开场白。
支持任何 OpenAI 兼容接口（DeepSeek / 通义 / 智谱 / 本地 Ollama 等），在 .env 中配置。
"""
from __future__ import annotations

import json
import logging

import httpx

from config import get_settings

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    """AI 服务调用失败"""


# 允许发送给模型的问卷字段（白名单，确保邮箱/昵称等身份信息不出库）
SAFE_FIELDS = [
    "relationship_expectation",
    "graduation_year",
    "height",
    "home_province",
    "body_type",
    "daily_style",
    "social_setting",
    "love_languages",
    "ritual_importance",
    "self_traits",
    "sleep_schedule",
    "eating_habit",
    "spice_tolerance",
    "dietary",
    "weekend_pref",
    "togetherness",
    "travel_style",
    "spending_style",
    "hobbies",
    "meeting_frequency",
    "care_style",
    "career_drive",
    "post_grad_lifestyle",
]

SYSTEM_PROMPT = """你是 TopDate 校园交友平台的「AI 破冰助手」。
两位大学生通过问卷互相表达了喜欢、匹配成功。你的任务是阅读双方脱敏后的问卷，
生成自然、真诚、有分寸的破冰建议，帮助两人开启第一段对话。

要求：
1. 语气真诚、轻松、年轻化，不要油腻，不要土味情话，不开不适当的玩笑。
2. 只使用问卷中真实存在的信息，不编造任何细节；没有明显共同点时，
   从互补点或对方明确的兴趣、经历入手。
3. 不要提及"问卷""匹配分数""算法"等系统细节，也不要复述问卷里的具体数值。
4. 输出必须是严格的 JSON，不要输出 JSON 以外的任何内容。"""

USER_PROMPT_TEMPLATE = """【甲方（我）问卷摘要】
{user_a}

【乙方（对方）问卷摘要】
{user_b}

【两人匹配维度参考（0-100，键名为维度英文代号）】
{detail_scores}

请生成以下 JSON（全部使用简体中文）：
{{
  "common_ground": ["3 条两人的共同点或互补点，每条 10-25 字", "...", "..."],
  "topics": [
    {{"title": "话题名（6-12字）", "detail": "为什么聊这个、怎么开口（30-60字）"}},
    {{"title": "话题名", "detail": "..."}},
    {{"title": "话题名", "detail": "..."}}
  ],
  "opener": "一段可以直接发送的开场白（60-120字，自然真诚，从两人的共同点或对方的兴趣切入）"
}}
"""


def _summarize_answers(answers: dict) -> str:
    """把问卷答案压缩成脱敏摘要文本（只保留白名单字段）"""
    if not answers:
        return "（未填写）"
    parts = []
    for key in SAFE_FIELDS:
        if key not in answers:
            continue
        value = answers.get(key)
        if value in (None, "", [], {}):
            continue
        if isinstance(value, list):
            value = "、".join(str(v) for v in value)
        parts.append(f"{key}: {value}")
    return "\n".join(parts) if parts else "（未填写）"


async def generate_icebreaker(answers_a: dict, answers_b: dict, detail_scores: dict | None = None) -> dict:
    """调用大模型生成破冰内容。answers_a=当前用户，answers_b=对方。失败抛 AIServiceError。"""
    settings = get_settings()
    if not settings.LLM_API_KEY:
        raise AIServiceError("AI 服务未配置（缺少 LLM_API_KEY）")

    detail_scores = detail_scores or {}
    scores_text = "、".join(f"{k}: {v}" for k, v in detail_scores.items()) or "（无）"

    payload = {
        "model": settings.LLM_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": USER_PROMPT_TEMPLATE.format(
                    user_a=_summarize_answers(answers_a),
                    user_b=_summarize_answers(answers_b),
                    detail_scores=scores_text,
                ),
            },
        ],
        "temperature": 0.8,
        "max_tokens": 1200,
    }

    url = settings.LLM_API_BASE.rstrip("/") + "/chat/completions"
    headers = {"Authorization": f"Bearer {settings.LLM_API_KEY}"}

    try:
        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT) as client:
            resp = await client.post(url, json=payload, headers=headers)
    except httpx.HTTPError as exc:
        logger.warning("AI 接口请求失败: %s", exc)
        raise AIServiceError("AI 服务暂时不可用，请稍后再试") from exc

    if resp.status_code != 200:
        logger.warning("AI 接口返回 %s: %s", resp.status_code, resp.text[:300])
        raise AIServiceError("AI 服务暂时不可用，请稍后再试")

    try:
        content = resp.json()["choices"][0]["message"]["content"]
    except (KeyError, IndexError, ValueError) as exc:
        logger.warning("AI 接口响应格式异常: %s", resp.text[:300])
        raise AIServiceError("AI 返回格式异常") from exc

    return _parse_json_content(content)


def _parse_json_content(content: str) -> dict:
    """尽力从模型输出中解析 JSON（容忍 ```json 代码块包裹与前后多余文字）"""
    text = (content or "").strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end == -1:
            raise AIServiceError("AI 返回格式异常")
        try:
            data = json.loads(text[start : end + 1])
        except json.JSONDecodeError as exc:
            raise AIServiceError("AI 返回格式异常") from exc
    if not isinstance(data, dict):
        raise AIServiceError("AI 返回格式异常")
    return data
