"""
TopDate 后端主应用 - FastAPI
"""
from __future__ import annotations
import os
import uuid
import shutil
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Depends, HTTPException, status, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, cast, Integer
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import get_settings
from database import get_db, init_db, engine, Base
from models import (
    User, VerificationCode, Match, MatchHistory, AdminLog,
    StudentVerificationStatus, MatchStatus, Gender,
)
from schemas import (
    RegisterRequest, VerifyEmailRequest, SendCodeRequest,
    LoginRequest, TokenResponse,
    UserBriefResponse, SurveyAnswers, SurveySubmitRequest,
    MatchCardResponse, MatchActionRequest, StatsResponse,
    ProfileUpdateRequest, AdminActionRequest, UniversityManageRequest,
    ForgotPasswordRequest, ResetPasswordRequest, ResendVerificationRequest,
    ReportRequest, DeleteAccountRequest, PhotoUploadResponse, ChangePasswordRequest,
)
from auth import (
    hash_password, verify_password, create_access_token,
    create_verification_code, get_current_user, get_admin_user,
)
from email_service import (
    send_verification_email, send_password_reset_email, send_resend_verification_email,
)
from universities import (
    UNIVERSITIES, get_university_by_id, get_university_by_email,
    is_same_city, is_same_province,
)
from matching import compute_match_score
from tasks import run_tuesday_matching, run_saturday_matching, cleanup_expired_matches
from rate_limiter import check_rate_limit

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()
scheduler = AsyncIOScheduler()

# 上传目录配置
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期"""
    await init_db()
    # 设置每周二18:00 + 每周六18:00的定时任务
    scheduler.add_job(
        run_tuesday_matching,
        "cron",
        day_of_week="tue",
        hour=settings.MATCHING_CRON_HOUR,
        minute=settings.MATCHING_CRON_MINUTE,
        id="tuesday_matching",
        replace_existing=True,
    )
    scheduler.add_job(
        run_saturday_matching,
        "cron",
        day_of_week="sat",
        hour=settings.MATCHING_SATURDAY_HOUR,
        minute=settings.MATCHING_SATURDAY_MINUTE,
        id="saturday_matching",
        replace_existing=True,
    )
    scheduler.add_job(
        cleanup_expired_matches,
        "cron",
        day_of_week="tue",
        hour=19, minute=0,
        id="cleanup_tuesday",
        replace_existing=True,
    )
    scheduler.add_job(
        cleanup_expired_matches,
        "cron",
        day_of_week="sat",
        hour=19, minute=0,
        id="cleanup_saturday",
        replace_existing=True,
    )
    # ===== 测试用：周二10:30匹配（正式上线前删除下行） =====
    scheduler.add_job(
        run_wednesday_matching,
        "cron",
        day_of_week="tue",
        hour=10, minute=30,
        id="test_tuesday_matching",
        replace_existing=True,
    )
    # ===== 测试结束 =====
    scheduler.start()
    logger.info("定时任务调度器已启动")
    yield
    scheduler.shutdown()


app = FastAPI(
    title="TopDate API",
    version="1.0.0",
    description="985高校专属交友匹配平台",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件 - 上传的照片
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


# ==================== 工具函数 ====================

def _get_university_name(uid: int) -> str:
    u = get_university_by_id(uid)
    return u["name"] if u else "未知"


def _user_to_brief(user: User) -> dict:
    return {
        "id": user.id,
        "uuid": user.uuid,
        "email": user.email,
        "nickname": user.nickname,
        "university_id": user.university_id,
        "university_name": _get_university_name(user.university_id),
        "verification_status": user.verification_status,
        "survey_completed": user.survey_completed,
        "is_admin": user.is_admin,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


# ==================== 认证相关 API ====================

@app.post("/api/auth/send-code", response_model=dict)
async def send_verification_code(req: SendCodeRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """发送验证码（注册前先验证邮箱）"""
    if not check_rate_limit("/api/auth/send-code", request.client.host):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后再试")

    uni = get_university_by_id(req.university_id)
    if not uni:
        raise HTTPException(status_code=400, detail="无效的大学ID")

    matched_uni = get_university_by_email(req.email)
    if not matched_uni or matched_uni["id"] != req.university_id:
        raise HTTPException(
            status_code=400,
            detail=f"请使用{uni['name']}的官方邮箱注册（支持域名：{', '.join(uni['email_domains'])}）",
        )

    # 检查邮箱是否已注册
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="该邮箱已被注册")

    code = create_verification_code()
    expires = datetime.utcnow() + timedelta(minutes=10)

    vc = VerificationCode(email=req.email, code=code, purpose="register", expires_at=expires)
    db.add(vc)
    await db.commit()

    email_sent = await send_verification_email(req.email, code)
    if not email_sent:
        return {"message": "验证码已生成", "verification_code": code}
    return {"message": "验证码已发送至你的邮箱"}


@app.post("/api/auth/register", response_model=dict)
async def register(req: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """用户注册"""
    if not check_rate_limit("/api/auth/register", request.client.host):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后再试")

    uni = get_university_by_id(req.university_id)
    if not uni:
        raise HTTPException(status_code=400, detail="无效的大学ID")

    matched_uni = get_university_by_email(req.email)
    if not matched_uni or matched_uni["id"] != req.university_id:
        raise HTTPException(
            status_code=400,
            detail=f"请使用{uni['name']}的官方邮箱注册（支持域名：{', '.join(uni['email_domains'])}）",
        )

    # 检查邮箱是否已注册
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="该邮箱已被注册")

    # 如果提供了验证码，先验证
    verified = False
    if req.code:
        vc_result = await db.execute(
            select(VerificationCode).where(
                VerificationCode.email == req.email,
                VerificationCode.code == req.code,
                VerificationCode.purpose == "register",
                VerificationCode.used == False,
                VerificationCode.expires_at > datetime.utcnow(),
            ).order_by(VerificationCode.created_at.desc())
        )
        vc = vc_result.scalar_one_or_none()
        if not vc:
            raise HTTPException(status_code=400, detail="验证码无效或已过期")
        vc.used = True
        verified = True

    # 检查昵称是否重复
    existing_nick = await db.execute(select(User).where(User.nickname == req.nickname))
    if existing_nick.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="该昵称已被使用")

    # 创建用户
    user = User(
        email=req.email,
        nickname=req.nickname,
        university_id=req.university_id,
        department=req.department or "",
        hashed_password=hash_password(req.password),
        verification_status=StudentVerificationStatus.VERIFIED.value if verified else StudentVerificationStatus.PENDING.value,
    )
    db.add(user)
    await db.flush()

    # 如果未验证，发送验证码
    code = None
    if not verified:
        code = create_verification_code()
        expires = datetime.utcnow() + timedelta(minutes=10)
        vc = VerificationCode(email=req.email, code=code, purpose="register", expires_at=expires)
        db.add(vc)

    await db.commit()

    access_token = create_access_token(data={"sub": str(user.id)})
    resp = {"message": "注册成功！", "user": _user_to_brief(user), "access_token": access_token}
    if not verified and code:
        email_sent = await send_verification_email(req.email, code)
        if not email_sent:
            resp["verification_code"] = code
            resp["message"] = "注册成功！邮件发送暂不可用，验证码：" + code
    if verified:
        resp["message"] = "注册成功！邮箱已验证，请完成问卷"

    return resp


@app.post("/api/auth/verify-email", response_model=dict)
async def verify_email(req: VerifyEmailRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """验证邮箱（POST方式，输入验证码）"""
    if not check_rate_limit("/api/auth/verify-email", request.client.host):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后再试")
    result = await db.execute(
        select(VerificationCode).where(
            VerificationCode.email == req.email,
            VerificationCode.code == req.code,
            VerificationCode.used == False,
            VerificationCode.expires_at > datetime.utcnow(),
        ).order_by(VerificationCode.created_at.desc())
    )
    vc = result.scalar_one_or_none()

    if not vc:
        raise HTTPException(status_code=400, detail="验证码无效或已过期")

    vc.used = True

    user_result = await db.execute(select(User).where(User.email == req.email))
    user = user_result.scalar_one_or_none()
    if user:
        user.verification_status = StudentVerificationStatus.VERIFIED.value

    await db.commit()

    return {"message": "邮箱验证成功！请继续完成问卷以激活账号"}


@app.get("/api/auth/verify-email-link", response_model=dict)
async def verify_email_link(email: str, code: str, db: AsyncSession = Depends(get_db)):
    """验证邮箱（GET方式，邮件链接一键验证）"""
    result = await db.execute(
        select(VerificationCode).where(
            VerificationCode.email == email,
            VerificationCode.code == code,
            VerificationCode.used == False,
            VerificationCode.expires_at > datetime.utcnow(),
        ).order_by(VerificationCode.created_at.desc())
    )
    vc = result.scalar_one_or_none()

    if not vc:
        raise HTTPException(status_code=400, detail="验证链接无效或已过期")

    vc.used = True

    user_result = await db.execute(select(User).where(User.email == email))
    user = user_result.scalar_one_or_none()
    if user:
        user.verification_status = StudentVerificationStatus.VERIFIED.value

    await db.commit()
    return {"message": "邮箱验证成功！请继续完成问卷以激活账号"}


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(req: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """用户登录"""
    if not check_rate_limit("/api/auth/login", request.client.host):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后再试")
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")

    if user.verification_status == StudentVerificationStatus.SUSPENDED.value:
        raise HTTPException(status_code=403, detail="你的账号已被冻结")

    is_pending = user.verification_status == StudentVerificationStatus.PENDING.value

    access_token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(
        access_token=access_token,
        user=UserBriefResponse(**_user_to_brief(user)),
    )


@app.get("/api/auth/me", response_model=UserBriefResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return UserBriefResponse(**_user_to_brief(current_user))


@app.post("/api/auth/change-password", response_model=dict)
async def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """修改密码"""
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="当前密码错误")
    current_user.hashed_password = hash_password(req.new_password)
    await db.commit()
    return {"message": "密码修改成功"}


@app.post("/api/auth/forgot-password", response_model=dict)
async def forgot_password(req: ForgotPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """忘记密码 - 发送重置验证码"""
    if not check_rate_limit("/api/auth/forgot-password", request.client.host):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后再试")

    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="该邮箱未注册")

    code = create_verification_code()
    expires = datetime.utcnow() + timedelta(minutes=10)

    vc = VerificationCode(email=req.email, code=code, purpose="reset", expires_at=expires)
    db.add(vc)
    await db.commit()

    await send_password_reset_email(req.email, code)

    return {"message": "密码重置验证码已发送至你的邮箱"}


@app.post("/api/auth/reset-password", response_model=dict)
async def reset_password(req: ResetPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """重置密码"""
    if not check_rate_limit("/api/auth/reset-password", request.client.host):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后再试")

    result = await db.execute(
        select(VerificationCode).where(
            VerificationCode.email == req.email,
            VerificationCode.code == req.code,
            VerificationCode.purpose == "reset",
            VerificationCode.used == False,
            VerificationCode.expires_at > datetime.utcnow(),
        ).order_by(VerificationCode.created_at.desc())
    )
    vc = result.scalar_one_or_none()

    if not vc:
        raise HTTPException(status_code=400, detail="验证码无效或已过期")

    vc.used = True

    user_result = await db.execute(select(User).where(User.email == req.email))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    user.hashed_password = hash_password(req.new_password)
    await db.commit()

    return {"message": "密码重置成功！请使用新密码登录"}


@app.post("/api/auth/resend-verification", response_model=dict)
async def resend_verification(req: ResendVerificationRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """重新发送验证码"""
    if not check_rate_limit("/api/auth/resend-verification", request.client.host):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后再试")

    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="该邮箱未注册")

    code = create_verification_code()
    expires = datetime.utcnow() + timedelta(minutes=10)

    vc = VerificationCode(email=req.email, code=code, purpose="register", expires_at=expires)
    db.add(vc)
    await db.commit()

    email_sent = await send_verification_email(req.email, code)
    if not email_sent:
        return {"message": "验证码已重新发送", "verification_code": code}
    return {"message": "验证码已重新发送至你的邮箱"}


# ==================== 大学信息 API ====================

@app.get("/api/universities")
async def list_universities():
    """获取所有985大学列表"""
    return [
        {
            "id": u["id"],
            "name": u["name"],
            "short_name": u["short_name"],
            "province": u["province"],
            "city": u["city"],
            "email_domains": u["email_domains"],
            "region": u["region"],
        }
        for u in UNIVERSITIES
    ]


@app.get("/api/universities/{university_id}", response_model=dict)
async def get_university(university_id: int):
    """获取单个大学信息"""
    uni = get_university_by_id(university_id)
    if not uni:
        raise HTTPException(status_code=404, detail="大学不存在")
    return uni


# ==================== 问卷 API ====================

@app.post("/api/survey/submit", response_model=dict)
async def submit_survey(
    req: SurveySubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """提交问卷"""
    if current_user.verification_status == StudentVerificationStatus.PENDING.value:
        raise HTTPException(status_code=403, detail="请先完成邮箱验证")

    answers = req.answers.model_dump()
    current_user.survey_answers = answers
    current_user.gender = answers.get("gender")
    current_user.prefer_gender = answers.get("prefer_gender")
    current_user.age = answers.get("age")
    current_user.city_preference = answers.get("max_distance_preference") or "anywhere"
    current_user.survey_completed = True

    if current_user.verification_status == StudentVerificationStatus.VERIFIED.value:
        current_user.verification_status = StudentVerificationStatus.ACTIVE.value

    await db.commit()

    return {
        "message": "问卷提交成功！你的账号现已完全激活",
        "survey_completed": True,
    }


@app.get("/api/survey/my-answers", response_model=dict)
async def get_my_answers(current_user: User = Depends(get_current_user)):
    """获取当前用户的问卷答案"""
    if not current_user.survey_completed:
        raise HTTPException(status_code=404, detail="你尚未完成问卷")
    return {
        "survey_completed": True,
        "answers": current_user.survey_answers,
    }


@app.post("/api/survey/save-draft", response_model=dict)
async def save_draft(draft: dict, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """暂存问卷草稿（不校验完整性）"""
    current_user.draft_answers = draft
    await db.commit()
    return {"message": "草稿已保存"}


@app.get("/api/survey/load-draft", response_model=dict)
async def load_draft(current_user: User = Depends(get_current_user)):
    """加载暂存的草稿"""
    return {
        "draft": current_user.draft_answers or {},
    }


@app.get("/api/survey/questions", response_model=dict)
async def get_survey_questions():
    """获取问卷问题列表（前端渲染用）"""
    return QUESTIONS_CONFIG


# ==================== 匹配 API ====================

@app.get("/api/matches")
async def get_my_matches(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取当前用户的匹配列表"""
    if not current_user.survey_completed:
        raise HTTPException(status_code=403, detail="请先完成问卷")

    result = await db.execute(
        select(Match).where(
            or_(Match.user1_id == current_user.id, Match.user2_id == current_user.id),
            Match.status.in_([MatchStatus.PENDING.value, MatchStatus.LIKED.value, MatchStatus.MATCHED.value, MatchStatus.REJECTED.value, MatchStatus.EXPIRED.value]),
        ).order_by(Match.compatibility_score.desc())
    )
    matches = result.scalars().all()

    match_list = []
    for m in matches:
        is_user1 = m.user1_id == current_user.id
        other_id = m.user2_id if is_user1 else m.user1_id
        other_result = await db.execute(select(User).where(User.id == other_id))
        other = other_result.scalar_one_or_none()
        if not other:
            continue

        uni = get_university_by_id(other.university_id)
        my_uni = get_university_by_id(current_user.university_id)
        my_action = m.user1_action if is_user1 else m.user2_action

        match_item = {
            "match_id": m.id,
            "compatibility_score": m.compatibility_score,
            "detail_scores": m.detail_scores or {},
            "city_bonus": m.city_bonus,
            "status": m.status,
            "my_action": my_action,
            "same_city": is_same_city(current_user.university_id, other.university_id) if uni else False,
            "same_province": is_same_province(current_user.university_id, other.university_id) if uni else False,
            "user": {
                "nickname": other.nickname,
                "university_name": uni["name"] if uni else "未知",
                "city": uni["city"] if uni else "未知",
                "province": uni["province"] if uni else "未知",
                "age": other.age,
                "gender": other.gender,
                "bio": other.bio,
                "email": other.email if m.status == MatchStatus.MATCHED.value else None,
            },
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        match_list.append(match_item)

    return match_list


@app.post("/api/matches/action", response_model=dict)
async def match_action(
    req: MatchActionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """对匹配进行操作（喜欢/拒绝）"""
    result = await db.execute(select(Match).where(Match.id == req.match_id))
    match = result.scalar_one_or_none()

    if not match:
        raise HTTPException(status_code=404, detail="匹配记录不存在")

    if current_user.id not in (match.user1_id, match.user2_id):
        raise HTTPException(status_code=403, detail="无权操作此匹配")

    if match.status not in (MatchStatus.PENDING.value, MatchStatus.LIKED.value):
        raise HTTPException(status_code=400, detail="当前状态不允许操作")

    is_user1 = current_user.id == match.user1_id

    if req.action == "like":
        if is_user1:
            match.user1_action = "liked"
        else:
            match.user2_action = "liked"

        # 检查是否双向喜欢
        if match.user1_action == "liked" and match.user2_action == "liked":
            match.status = MatchStatus.MATCHED.value
            # 记录到历史
            db.add(MatchHistory(
                match_id=match.id,
                user1_id=match.user1_id,
                user2_id=match.user2_id,
                result="matched",
                score=match.compatibility_score,
            ))
            await db.commit()

            # 获取双方邮箱信息
            user1 = await db.execute(select(User).where(User.id == match.user1_id))
            user2 = await db.execute(select(User).where(User.id == match.user2_id))
            u1 = user1.scalar_one()
            u2 = user2.scalar_one()

            return {
                "status": "matched",
                "message": "🎉 恭喜！双向匹配成功！",
                "contact": {
                    "email": u2.email if is_user1 else u1.email,
                    "nickname": u2.nickname if is_user1 else u1.nickname,
                },
            }
        else:
            match.status = MatchStatus.LIKED.value
            await db.commit()
            return {"status": "liked", "message": "已表达喜欢，等待对方回应"}
    elif req.action == "reject":
        if is_user1:
            match.user1_action = "rejected"
        else:
            match.user2_action = "rejected"
        match.status = MatchStatus.REJECTED.value
        db.add(MatchHistory(
            match_id=match.id,
            user1_id=match.user1_id,
            user2_id=match.user2_id,
            result="rejected",
            score=match.compatibility_score,
        ))
        await db.commit()
        return {"status": "rejected", "message": "已拒绝"}
    else:
        raise HTTPException(status_code=400, detail="无效操作，只支持 like 或 reject")


@app.post("/api/matches/report", response_model=dict)
async def report_match(
    req: ReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """举报匹配的用户"""
    result = await db.execute(select(Match).where(Match.id == req.match_id))
    match = result.scalar_one_or_none()

    if not match:
        raise HTTPException(status_code=404, detail="匹配记录不存在")

    if current_user.id not in (match.user1_id, match.user2_id):
        raise HTTPException(status_code=403, detail="无权操作此匹配")

    other_id = match.user2_id if current_user.id == match.user1_id else match.user1_id
    log = AdminLog(admin_id=current_user.id, action="report", target_user_id=other_id, detail=req.reason)
    db.add(log)
    await db.commit()

    return {"message": "举报已提交，管理员将进行审核"}


# ==================== 用户资料 API ====================

@app.get("/api/profile", response_model=dict)
async def get_profile(current_user: User = Depends(get_current_user)):
    """获取个人资料"""
    uni = get_university_by_id(current_user.university_id)
    return {
        **_user_to_brief(current_user),
        "bio": current_user.bio,
        "photos": current_user.photos or [],
        "university_name": uni["name"] if uni else "",
        "province": uni["province"] if uni else "",
        "city": uni["city"] if uni else "",
        "survey_answers": current_user.survey_answers,
        "last_matched_at": current_user.last_matched_at.isoformat() if current_user.last_matched_at else None,
    }


@app.put("/api/profile", response_model=dict)
async def update_profile(
    req: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新个人资料"""
    if req.nickname is not None:
        existing = await db.execute(
            select(User).where(User.nickname == req.nickname, User.id != current_user.id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="该昵称已被使用")
        current_user.nickname = req.nickname
    if req.bio is not None:
        current_user.bio = req.bio
    if req.photos is not None:
        if len(req.photos) > 3:
            raise HTTPException(status_code=400, detail="最多上传3张照片")
        current_user.photos = req.photos

    await db.commit()
    return {"message": "资料更新成功"}


@app.post("/api/profile/upload-photo", response_model=PhotoUploadResponse)
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """上传照片"""
    ext = Path(file.filename or "image.jpg").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"不支持的文件格式，仅支持: {', '.join(ALLOWED_EXTENSIONS)}")

    contents = await file.read()
    if len(contents) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=400, detail="照片大小不能超过5MB")

    photos = current_user.photos or []
    if len(photos) >= 3:
        raise HTTPException(status_code=400, detail="最多上传3张照片，请先删除旧照片")

    filename = f"{current_user.uuid}_{len(photos)}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        f.write(contents)

    url = f"/uploads/{filename}"
    photos.append(url)
    current_user.photos = photos
    await db.commit()

    return PhotoUploadResponse(url=url, filename=filename)


@app.delete("/api/profile/photo")
async def delete_photo(
    url: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除照片"""
    photos = current_user.photos or []
    if url not in photos:
        raise HTTPException(status_code=404, detail="照片不存在")

    photos.remove(url)
    current_user.photos = photos

    file_path = UPLOAD_DIR / Path(url).name
    if file_path.exists():
        file_path.unlink()

    await db.commit()
    return {"message": "照片已删除", "photos": photos}


@app.post("/api/account/delete", response_model=dict)
async def delete_account(
    req: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """用户自行删除账号"""
    if not verify_password(req.password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="密码错误")

    await db.delete(current_user)
    await db.commit()
    return {"message": "账号已删除"}


# ==================== 统计 API ====================

@app.get("/api/stats", response_model=StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """获取平台统计数据"""
    # 总注册用户
    total = await db.scalar(select(func.count(User.id)))

    # 已验证用户
    verified = await db.scalar(
        select(func.count(User.id)).where(
            User.verification_status.in_([StudentVerificationStatus.VERIFIED.value, StudentVerificationStatus.ACTIVE.value])
        )
    )

    # 完成问卷用户
    surveyed = await db.scalar(
        select(func.count(User.id)).where(User.survey_completed == True)
    )

    # 成功匹配对数
    matched_pairs = await db.scalar(
        select(func.count(MatchHistory.id)).where(MatchHistory.result == "matched")
    )
    # 总匹配尝试数
    total_attempts = await db.scalar(select(func.count(MatchHistory.id)))

    # 匹配成功率
    success_rate = (matched_pairs / max(total_attempts, 1)) * 100 if total_attempts else 0.0

    # 本周活跃用户（最近7天有操作的）
    week_ago = datetime.utcnow() - timedelta(days=7)
    active_week = await db.scalar(
        select(func.count(User.id)).where(User.updated_at >= week_ago)
    )

    # 各大学注册人数Top
    uni_counts = {}
    result = await db.execute(select(User.university_id, func.count(User.id)).group_by(User.university_id))
    for uid, count in result:
        uni = get_university_by_id(uid)
        uni_counts[uid] = {
            "university_name": uni["name"] if uni else f"大学#{uid}",
            "province": uni["province"] if uni else "",
            "count": count,
        }

    top_unis = sorted(uni_counts.values(), key=lambda x: x["count"], reverse=True)[:10]
    total_unis = len(set(uni_counts.keys()))

    return StatsResponse(
        total_users=total or 0,
        total_verified_users=verified or 0,
        total_survey_completed=surveyed or 0,
        total_match_pairs=matched_pairs or 0,
        match_success_rate=round(success_rate, 1),
        active_users_this_week=active_week or 0,
        top_universities=top_unis,
        total_universities=total_unis,
    )


# ==================== 管理员 API ====================

@app.get("/api/admin/users")
async def list_users(
    page: int = 1,
    search: str = "",
    status: str = "",
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """管理员查看用户列表"""
    query = select(User)
    if search:
        query = query.where(
            or_(User.email.contains(search), User.nickname.contains(search))
        )
    if status:
        query = query.where(User.verification_status == status)

    query = query.offset((page - 1) * 20).limit(20)
    result = await db.execute(query)
    users = result.scalars().all()

    return [_user_to_brief(u) for u in users]


@app.post("/api/admin/users/action", response_model=dict)
async def admin_user_action(
    req: AdminActionRequest,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """管理员操作：封禁/解封/删除用户"""
    result = await db.execute(select(User).where(User.id == req.target_user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    log = AdminLog(admin_id=admin.id, action=req.action, target_user_id=req.target_user_id, detail=req.reason)

    if req.action == "suspend":
        user.verification_status = StudentVerificationStatus.SUSPENDED.value
    elif req.action == "unsuspend":
        user.verification_status = StudentVerificationStatus.ACTIVE.value
    elif req.action == "delete":
        await db.delete(user)
        log.detail = "用户已删除: " + (req.reason or "")
        db.add(log)
        await db.commit()
        return {"message": "用户已删除"}
    else:
        raise HTTPException(status_code=400, detail="无效操作")

    db.add(log)
    await db.commit()
    return {"message": f"操作 {req.action} 已完成"}


@app.get("/api/admin/logs", response_model=list[dict])
async def get_admin_logs(
    page: int = 1,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """查看管理日志"""
    result = await db.execute(
        select(AdminLog).order_by(AdminLog.created_at.desc()).offset((page - 1) * 30).limit(30)
    )
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "admin_id": log.admin_id,
            "action": log.action,
            "target_user_id": log.target_user_id,
            "detail": log.detail,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]


@app.get("/api/admin/stats/detail", response_model=dict)
async def get_admin_detail_stats(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """管理员查看详细统计"""
    stats = await get_stats(db)

    # 按周统计匹配数
    weekly_matches = await db.execute(
        select(MatchHistory.created_at, func.count()).group_by(
            cast(func.strftime("%Y-%W", MatchHistory.created_at), Integer)
        ).order_by(MatchHistory.created_at.desc()).limit(12)
    )

    # 性别比例
    male_count = await db.scalar(
        select(func.count(User.id)).where(User.gender == "male", User.survey_completed == True)
    )
    female_count = await db.scalar(
        select(func.count(User.id)).where(User.gender == "female", User.survey_completed == True)
    )

    return {
        "overview": stats.model_dump(),
        "gender_ratio": {
            "male": male_count or 0,
            "female": female_count or 0,
            "ratio": f"{male_count}/{female_count}" if female_count else "N/A",
        },
    }


# ==================== 匹配算法调试 API ====================

@app.post("/api/matching/test", response_model=dict)
async def test_matching(
    user_a_answers: SurveyAnswers,
    user_b_answers: SurveyAnswers,
    university_a_id: int,
    university_b_id: int,
):
    """测试匹配算法 - 查看两个用户之间的匹配分数"""
    ua = {**user_a_answers.model_dump(), "university_id": university_a_id}
    ub = {**user_b_answers.model_dump(), "university_id": university_b_id}
    result = compute_match_score(ua, ub)
    return result


# ==================== 健康检查 ====================

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "time": datetime.now().isoformat()}


# ==================== 问卷配置（前端渲染用） ====================

QUESTIONS_CONFIG = {
    "sections": [
        {
            "id": "first_impression",
            "title": "第一部分：第一印象",
            "subtitle": "基本信息与第一眼偏好",
            "description": "请填写你的基本信息，这些信息将帮助我们了解你的基本画像",
            "questions": [
                {"id": "gender", "type": "radio", "label": "我的性别", "required": True,
                 "options": [{"value": "male", "label": "男"}, {"value": "female", "label": "女"}]},
                {"id": "prefer_gender", "type": "radio", "label": "我希望匹配", "required": True,
                 "options": [{"value": "male", "label": "男生"}, {"value": "female", "label": "女生"}]},
                {"id": "relationship_expectation", "type": "radio", "label": "对这段关系的期望", "required": True,
                 "options": [{"value": "long_term", "label": "长期认真伴侣"}, {"value": "short_term", "label": "短期恋爱"}, {"value": "let_it_flow", "label": "顺其自然"}]},
                {"id": "age", "type": "slider", "label": "我的年龄", "min": 18, "max": 40, "step": 1, "required": True},
                {"id": "age_range_min", "type": "slider", "label": "可接受对方最小年龄", "min": 18, "max": 40, "step": 1},
                {"id": "age_range_max", "type": "slider", "label": "可接受对方最大年龄", "min": 18, "max": 40, "step": 1},
                {"id": "graduation_year", "type": "slider", "label": "我的预计毕业年份", "min": 2010, "max": 2040, "step": 1, "required": True},
                {"id": "partner_graduation_year_pref", "type": "radio", "label": "对方毕业年份要求",
                 "options": [{"value": "no_limit", "label": "不限"}, {"value": "within_2", "label": "前后2年内"}, {"value": "within_1", "label": "前后1年内"}, {"value": "same", "label": "同届"}]},
                {"id": "home_province", "type": "select", "label": "我的家乡",
                 "options": ["北京", "上海", "天津", "重庆", "河北", "山西", "辽宁", "吉林", "黑龙江", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南", "广东", "海南", "四川", "贵州", "云南", "陕西", "甘肃", "青海", "台湾", "内蒙古", "广西", "西藏", "宁夏", "新疆", "香港", "澳门", "海外"]},
                {"id": "height", "type": "slider", "label": "我的身高(cm)", "min": 140, "max": 210, "step": 1, "required": True},
                {"id": "height_range_min", "type": "slider", "label": "可接受对方最低身高(cm)", "min": 140, "max": 210, "step": 1},
                {"id": "height_range_max", "type": "slider", "label": "可接受对方最高身高(cm)", "min": 140, "max": 210, "step": 1},
                {"id": "body_type", "type": "radio", "label": "我的体型",
                 "options": [{"value": "slim", "label": "偏瘦"}, {"value": "average", "label": "匀称"}, {"value": "slightly_chubby", "label": "微胖"}, {"value": "athletic", "label": "运动健美"}]},
                {"id": "prefer_body_type", "type": "radio", "label": "偏好对方体型",
                 "options": [{"value": "slim", "label": "偏瘦"}, {"value": "average", "label": "匀称"}, {"value": "slightly_chubby", "label": "微胖"}, {"value": "athletic", "label": "运动健美"}, {"value": "any", "label": "都可以"}]},
                {"id": "daily_style", "type": "select", "label": "我的日常穿搭风格",
                 "options": ["运动休闲", "简约休闲", "精致时尚", "优雅知性", "舒适为主", "极简主义", "街头潮流", "文艺复古", "复古风"]},
                {"id": "prefer_daily_style", "type": "select", "label": "偏好对方穿搭风格",
                 "options": ["运动休闲", "简约休闲", "精致时尚", "优雅知性", "舒适为主", "极简主义", "街头潮流", "文艺复古", "复古风", "都行"]},
            ],
        },
        {
            "id": "attraction",
            "title": "第二部分：吸引力",
            "subtitle": "心动瞬间与个人特质",
            "description": "什么让你心动？什么特质让你着迷？",
            "questions": [
                {"id": "social_setting", "type": "slider", "label": "在社交场合中，我偏", "min": 1, "max": 7, "min_label": "外向开朗", "max_label": "内向安静"},
                {"id": "prefer_social_setting", "type": "slider", "label": "我希望对方偏", "min": 1, "max": 7, "min_label": "更外向", "max_label": "更内向"},
                {"id": "love_languages", "type": "checkbox", "label": "让我感到被爱的方式（最多选3项）", "max_select": 3,
                 "options": ["口头赞美", "高质量陪伴", "贴心礼物", "服务行动", "肢体接触", "被记住的细节", "低谷时的情感支持", "一起尝试新事物", "规划未来"]},
                {"id": "ritual_importance", "type": "slider", "label": "纪念日/节日的仪式感对我来说", "min": 1, "max": 7, "min_label": "不重要", "max_label": "非常重要"},
                {"id": "appearance_effort", "type": "slider", "label": "我对外貌/穿着的重视程度", "min": 1, "max": 7, "min_label": "不重视", "max_label": "生活品质重要"},
                {"id": "prefer_appearance_effort", "type": "slider", "label": "对方重视外貌对我", "min": 1, "max": 7, "min_label": "不重要", "max_label": "很重要"},
                {"id": "self_traits", "type": "checkbox", "label": "我希望自己具备的特质（最多选5项）", "max_select": 5,
                 "options": ["善于表达爱", "情绪稳定", "善于倾听", "尊重边界", "有责任心", "温柔体贴", "诚实坦率", "幽默风趣", "有主见", "成长型思维", "思维敏锐", "能力突出", "忠诚专一"]},
                {"id": "partner_traits", "type": "checkbox", "label": "我看重对方的特质（最多选5项）", "max_select": 5,
                 "options": ["善于表达爱", "情绪稳定", "善于倾听", "尊重边界", "有责任心", "温柔体贴", "诚实坦率", "幽默风趣", "有主见", "成长型思维", "思维敏锐", "能力突出", "忠诚专一"]},
            ],
        },
        {
            "id": "daily_life",
            "title": "第三部分：日常生活",
            "subtitle": "生活习惯与兴趣爱好",
            "description": "了解彼此的生活节奏和兴趣偏好",
            "questions": [
                {"id": "sleep_schedule", "type": "slider", "label": "我的作息习惯", "min": 1, "max": 7, "min_label": "夜猫子", "max_label": "早起鸟"},
                {"id": "messiness_tolerance", "type": "slider", "label": "如果对方有点邋遢", "min": 1, "max": 7, "min_label": "无法忍受", "max_label": "完全OK"},
                {"id": "eating_habit", "type": "slider", "label": "校园饮食方式", "min": 1, "max": 7, "min_label": "以食堂为主", "max_label": "外卖/外食为主"},
                {"id": "spice_tolerance", "type": "slider", "label": "吃辣程度", "min": 1, "max": 7, "min_label": "一点不沾", "max_label": "无辣不欢"},
                {"id": "dietary", "type": "radio", "label": "饮食限制", "options": [{"value": "none", "label": "无"}, {"value": "halal", "label": "清真"}, {"value": "vegetarian", "label": "素食"}, {"value": "vegan", "label": "纯素"}, {"value": "other", "label": "其他"}]},
                {"id": "weekend_pref", "type": "slider", "label": "周末约会偏好", "min": 1, "max": 7, "min_label": "校园附近", "max_label": "进城转转"},
                {"id": "togetherness", "type": "slider", "label": "相处模式", "min": 1, "max": 7, "min_label": "各有空间", "max_label": "时刻在一起"},
                {"id": "travel_style", "type": "slider", "label": "出行风格", "min": 1, "max": 7, "min_label": "周密计划", "max_label": "随性而行"},
                {"id": "spending_style", "type": "slider", "label": "消费风格", "min": 1, "max": 7, "min_label": "精打细算", "max_label": "体验至上"},
                {"id": "smoking", "type": "slider", "label": "我吸烟的频率", "min": 1, "max": 7, "min_label": "从不", "max_label": "经常"},
                {"id": "accept_smoking", "type": "slider", "label": "接受对方吸烟", "min": 1, "max": 7, "min_label": "难以接受", "max_label": "完全可以"},
                {"id": "drinking", "type": "slider", "label": "我饮酒的频率", "min": 1, "max": 7, "min_label": "从不", "max_label": "经常"},
                {"id": "accept_drinking", "type": "slider", "label": "接受对方饮酒", "min": 1, "max": 7, "min_label": "难以接受", "max_label": "一起小酌"},
                {"id": "hobbies", "type": "checkbox", "label": "核心爱好（多选）",
                 "options": ["运动健身", "阅读写作", "音乐", "电影/剧集", "美食探店", "旅行", "摄影", "游戏", "桌游/剧本杀", "看展/博物馆", "舞蹈", "手工/DIY", "户外运动", "编程/科技", "动漫/二次元", "宠物"]},
                {"id": "hobby_overlap_pref", "type": "slider", "label": "爱好重合度", "min": 1, "max": 7, "min_label": "不同也OK", "max_label": "重合越多越好"},
                {"id": "meeting_frequency", "type": "radio", "label": "期望见面频率",
                 "options": [{"value": "daily", "label": "几乎每天"}, {"value": "2_3_week", "label": "每周2-3次"}, {"value": "1_week", "label": "每周1次"}, {"value": "biweekly", "label": "两周1次或更少"}]},
                {"id": "social_media_sharing", "type": "slider", "label": "在社交平台分享恋情", "min": 1, "max": 7, "min_label": "私密不公开", "max_label": "乐意分享"},
            ],
        },
        {
            "id": "connection",
            "title": "第四部分：情感连接",
            "subtitle": "情感风格与沟通模式",
            "description": "了解彼此处理情绪和亲密关系的方式",
            "questions": [
                {"id": "reply_anxiety", "type": "slider", "label": "对方几小时不回消息", "min": 1, "max": 7, "min_label": "无所谓", "max_label": "焦虑刷手机"},
                {"id": "insecurity_style", "type": "slider", "label": "感到不安全感时", "min": 1, "max": 7, "min_label": "藏起来", "max_label": "反复确认"},
                {"id": "vulnerability", "type": "slider", "label": "展示脆弱面", "min": 1, "max": 7, "min_label": "很难", "max_label": "很自然"},
                {"id": "opposite_sex_friend", "type": "slider", "label": "对方有亲密异性朋友", "min": 1, "max": 7, "min_label": "不太喜欢", "max_label": "完全信任"},
                {"id": "decision_making", "type": "slider", "label": "做决策时", "min": 1, "max": 7, "min_label": "随对方", "max_label": "我来主导"},
                {"id": "care_style", "type": "slider", "label": "在关系中我倾向于", "min": 1, "max": 7, "min_label": "被照顾", "max_label": "照顾对方"},
                {"id": "intimacy_pace", "type": "slider", "label": "肢体亲密的节奏", "min": 1, "max": 7, "min_label": "顺其自然", "max_label": "慢慢来"},
                {"id": "fight_reaction", "type": "slider", "label": "吵架后第一反应", "min": 1, "max": 7, "min_label": "冷静一下", "max_label": "马上解决"},
                {"id": "reconciliation", "type": "slider", "label": "和好方式", "min": 1, "max": 7, "min_label": "等对方来", "max_label": "我来主动"},
            ],
        },
        {
            "id": "future",
            "title": "第五部分：未来愿景",
            "subtitle": "价值观与人生方向",
            "description": "你对未来的规划和期待是什么？",
            "questions": [
                {"id": "career_drive", "type": "slider", "label": "我的学业/事业追求", "min": 1, "max": 7, "min_label": "享受生活，健康第一", "max_label": "追求卓越"},
                {"id": "prefer_career_drive", "type": "slider", "label": "希望对方", "min": 1, "max": 7, "min_label": "松弛自在", "max_label": "上进拼搏"},
                {"id": "post_grad_lifestyle", "type": "slider", "label": "毕业后生活方式", "min": 1, "max": 7, "min_label": "回家乡，慢生活", "max_label": "留大城市，闯一闯"},
            ],
        },
    ],
    "distance_preference": {
        "id": "max_distance_preference",
        "type": "radio",
        "label": "你愿意匹配多远的人？",
        "options": [
            {"value": "same_city", "label": "仅同城"},
            {"value": "same_province", "label": "同省即可"},
            {"value": "neighboring", "label": "邻省也能接受"},
            {"value": "anywhere", "label": "距离不是问题"},
        ],
    },
}
