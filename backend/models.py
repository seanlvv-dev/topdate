"""
数据库模型定义
"""
import uuid
import enum
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Date, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from database import Base


def gen_uuid() -> str:
    return uuid.uuid4().hex


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"


class MatchPreference(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    BOTH = "both"


class StudentVerificationStatus(str, enum.Enum):
    PENDING = "pending"       # 刚注册，未验证邮箱
    VERIFIED = "verified"     # 邮箱已验证
    ACTIVE = "active"         # 已完成问卷，正常使用中
    SUSPENDED = "suspended"   # 被管理员封禁
    INACTIVE = "inactive"     # 不活跃


class MatchStatus(str, enum.Enum):
    PENDING = "pending"           # 已匹配但未操作
    LIKED = "liked"               # 已点击喜欢，等待对方
    REJECTED = "rejected"         # 已拒绝
    MATCHED = "matched"           # 双向匹配成功
    EXPIRED = "expired"           # 超时未操作


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String(32), default=gen_uuid, unique=True, index=True)

    email = Column(String(255), unique=True, nullable=False, index=True)
    nickname = Column(String(100))
    university_id = Column(Integer, nullable=False)

    gender = Column(String(10))            # male / female
    prefer_gender = Column(String(10))     # male / female
    age = Column(Integer)
    verification_status = Column(String(20), default=StudentVerificationStatus.PENDING.value)
    verification_code = Column(String(6))
    verification_code_expires = Column(DateTime)

    hashed_password = Column(String(255))

    survey_completed = Column(Boolean, default=False)
    survey_answers = Column(JSON, default=dict)
    survey_score_normalized = Column(Float, default=0.0)  # 归一化匹配向量

    bio = Column(Text, default="")
    photos = Column(JSON, default=list)  # [url1, url2, url3]

    city_preference = Column(String(20), default="anywhere")  # same_city/same_province/neighboring/anywhere

    is_admin = Column(Boolean, default=False)
    is_active_matching = Column(Boolean, default=True)  # 是否参与本周匹配
    department = Column(String(100), default="")  # 院系

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_matched_at = Column(DateTime)

    # relationships
    matches_as_user1 = relationship("Match", foreign_keys="Match.user1_id", back_populates="user1")
    matches_as_user2 = relationship("Match", foreign_keys="Match.user2_id", back_populates="user2")


class VerificationCode(Base):
    __tablename__ = "verification_codes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(6), nullable=False)
    purpose = Column(String(20), default="register")  # register / login / reset
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    compatibility_score = Column(Float, default=0.0)  # 0-100
    city_bonus = Column(Float, default=0.0)
    detail_scores = Column(JSON, default=dict)  # 各维度详细分数

    status = Column(String(20), default=MatchStatus.PENDING.value)
    user1_action = Column(String(20))  # liked / rejected / null
    user2_action = Column(String(20))

    week_number = Column(Integer)  # 2024年第几周

    created_at = Column(DateTime, default=datetime.utcnow)
    revealed_at = Column(DateTime)  # 周三18:00
    action_deadline = Column(DateTime)  # 操作截止时间（下周三18:00前）

    user1 = relationship("User", foreign_keys=[user1_id], back_populates="matches_as_user1")
    user2 = relationship("User", foreign_keys=[user2_id], back_populates="matches_as_user2")


class MatchHistory(Base):
    """已完成的匹配记录（历史档案，用于统计数据）"""
    __tablename__ = "match_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(Integer, index=True)
    user1_id = Column(Integer, nullable=False)
    user2_id = Column(Integer, nullable=False)
    result = Column(String(20))  # matched / rejected / expired
    score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


class AdminLog(Base):
    __tablename__ = "admin_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    admin_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(100))
    target_user_id = Column(Integer, nullable=True)
    detail = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
