"""
Pydantic schemas - 请求/响应模型
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional, Any, List
from pydantic import BaseModel, EmailStr, Field, field_validator


# ==================== Auth ====================

class RegisterRequest(BaseModel):
    email: str
    university_id: int
    password: str = Field(min_length=6, max_length=100)
    nickname: str = Field(min_length=1, max_length=50)
    code: Optional[str] = None  # 验证码，如果提供则在注册时验证


class VerifyEmailRequest(BaseModel):
    email: str
    code: str = Field(min_length=4, max_length=6)


class SendCodeRequest(BaseModel):
    email: str
    university_id: int


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserBriefResponse"


class UserBriefResponse(BaseModel):
    id: int
    uuid: str
    email: str
    nickname: Optional[str] = None
    university_id: int
    university_name: Optional[str] = None
    verification_status: str
    survey_completed: bool
    is_admin: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ==================== Survey ====================

class SurveyAnswers(BaseModel):
    """完整问卷答案 - 所有字段"""
    gender: str
    prefer_gender: str
    relationship_expectation: str = "let_it_flow"
    age: int
    age_range_min: Optional[int] = None
    age_range_max: Optional[int] = None
    graduation_year: int
    partner_graduation_year_pref: str = "no_limit"
    campus_city: Optional[str] = ""
    city_preference: Optional[str] = "okay"
    height: int
    height_range_min: Optional[int] = None
    height_range_max: Optional[int] = None
    home_province: str = ""
    body_type: str = "average"
    prefer_body_type: str = "any"
    daily_style: str = "简约休闲"
    prefer_daily_style: str = "都行"
    social_setting: int = 4
    prefer_social_setting: int = 4
    love_languages: list[str] = []
    ritual_importance: int = 4
    appearance_effort: int = 4
    prefer_appearance_effort: int = 4
    self_traits: list[str] = []
    partner_traits: list[str] = []
    sleep_schedule: int = 4
    messiness_tolerance: int = 4
    eating_habit: int = 4
    spice_tolerance: int = 4
    dietary: str = "none"
    weekend_pref: int = 4
    togetherness: int = 4
    travel_style: int = 4
    spending_style: int = 4
    smoking: int = 1
    accept_smoking: int = 4
    drinking: int = 1
    accept_drinking: int = 4
    hobbies: list[str] = []
    hobby_overlap_pref: int = 4
    meeting_frequency: str = "2_3_week"
    social_media_sharing: int = 4
    reply_anxiety: int = 4
    insecurity_style: int = 4
    vulnerability: int = 4
    opposite_sex_friend: int = 4
    decision_making: int = 4
    care_style: int = 4
    intimacy_pace: int = 4
    fight_reaction: int = 4
    reconciliation: int = 4
    career_drive: int = 4
    prefer_career_drive: int = 4
    post_grad_lifestyle: int = 4
    max_distance_preference: str = "anywhere"


class SurveySubmitRequest(BaseModel):
    answers: SurveyAnswers


# ==================== Match ====================

class MatchCardResponse(BaseModel):
    match_id: int
    compatibility_score: float
    nickname: str
    university_name: str
    city: str
    province: str
    age: int
    gender: str
    detail_scores: dict  # 各维度分数
    status: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MatchActionRequest(BaseModel):
    match_id: int
    action: str  # "like" or "reject"


# ==================== Stats ====================

class StatsResponse(BaseModel):
    total_users: int
    total_verified_users: int
    total_survey_completed: int
    total_match_pairs: int  # 成功匹配对数
    match_success_rate: float  # 成功率百分比
    active_users_this_week: int
    top_universities: list[dict]
    total_universities: int


# ==================== User Profile ====================

class ProfileUpdateRequest(BaseModel):
    nickname: Optional[str] = None
    bio: Optional[str] = None
    photos: Optional[list[str]] = None


# ==================== Admin ====================

class AdminActionRequest(BaseModel):
    action: str  # suspend / unsuspend / delete
    target_user_id: int
    reason: str = ""


class UniversityManageRequest(BaseModel):
    name: str
    short_name: str
    province: str
    city: str
    email_domains: list[str]


# ==================== Password Reset ====================

class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=6, max_length=100)


class ResendVerificationRequest(BaseModel):
    email: str


# ==================== Report ====================

class ReportRequest(BaseModel):
    match_id: int
    reason: str = Field(min_length=1, max_length=500)


class DeleteAccountRequest(BaseModel):
    password: str


class PhotoUploadResponse(BaseModel):
    url: str
    filename: str
