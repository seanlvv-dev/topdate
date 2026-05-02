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
    relationship_expectation: str  # long_term / short_term / let_it_flow
    age: int
    age_range_min: Optional[int] = None
    age_range_max: Optional[int] = None
    graduation_year: int
    partner_graduation_year_pref: str  # no_limit / within_2 / within_1 / same
    campus_city: Optional[str] = ""
    city_preference: Optional[str] = "okay"  # not_okay / okay
    height: int
    height_range_min: Optional[int] = None
    height_range_max: Optional[int] = None
    home_province: str
    body_type: str
    prefer_body_type: str
    daily_style: str
    prefer_daily_style: str
    social_setting: int  # 1-7 slider
    prefer_social_setting: int
    love_languages: list[str]  # max 3
    ritual_importance: int
    appearance_effort: int
    prefer_appearance_effort: int
    self_traits: list[str]  # max 5
    partner_traits: list[str]  # max 5
    sleep_schedule: int
    messiness_tolerance: int
    eating_habit: int
    spice_tolerance: int
    dietary: str  # none/halal/vegetarian/vegan/other
    weekend_pref: int
    togetherness: int
    travel_style: int
    spending_style: int
    smoking: int
    accept_smoking: int
    drinking: int
    accept_drinking: int
    hobbies: list[str]
    hobby_overlap_pref: int
    meeting_frequency: str
    social_media_sharing: int
    reply_anxiety: int  # q35
    insecurity_style: int  # q36
    vulnerability: int  # q37
    opposite_sex_friend: int  # q38
    decision_making: int  # q39
    care_style: int  # q40
    intimacy_pace: int  # q41
    fight_reaction: int  # q42
    reconciliation: int  # q43
    career_drive: int  # q44a
    prefer_career_drive: int  # q44b
    post_grad_lifestyle: int  # q45
    max_distance_preference: str  # same_city / same_province / neighboring / anywhere


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
