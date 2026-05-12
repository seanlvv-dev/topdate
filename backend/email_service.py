"""
邮件服务 - 发送验证码和通知邮件（异步实现）
"""
import smtplib
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_email_executor = ThreadPoolExecutor(max_workers=4)


def _send_email_sync(to_email: str, subject: str, html_content: str) -> bool:
    """同步邮件发送"""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(f"SMTP未配置，模拟发送邮件: {to_email} - {subject}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM, [to_email], msg.as_string())
        logger.info(f"邮件已发送: {to_email}")
        return True
    except Exception as e:
        logger.error(f"邮件发送失败: {to_email}, 错误: {e}")
        return False


async def _send_email(to_email: str, subject: str, html_content: str) -> bool:
    """异步邮件发送 - 使用线程池避免阻塞事件循环"""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        _email_executor, _send_email_sync, to_email, subject, html_content
    )


async def send_verification_email(email: str, code: str) -> bool:
    """发送验证码邮件"""
    verify_url = f"{settings.SITE_URL}/verify-email?email={email}&code={code}"
    html_content = f"""
    <div style="max-width:600px;margin:0 auto;font-family:'Microsoft YaHei',sans-serif;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#FF6B6B,#FF8E53);padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;">TopDate ❤️ 遇见对的人</h1>
            <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;">985高校专属交友平台</p>
        </div>
        <div style="padding:32px;">
            <h2 style="color:#333;font-size:20px;">验证你的邮箱</h2>
            <p style="color:#666;line-height:1.8;">你的验证码是：</p>
            <div style="background:#F8F9FA;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
                <span style="font-size:36px;font-weight:bold;color:#FF6B6B;letter-spacing:8px;">{code}</span>
            </div>
            <div style="text-align:center;margin:24px 0;">
                <a href="{verify_url}" style="display:inline-block;background:#FF6B6B;color:#fff;padding:14px 40px;border-radius:12px;text-decoration:none;font-size:16px;font-weight:bold;">点击验证邮箱</a>
            </div>
            <p style="color:#999;font-size:13px;text-align:center;">也可以复制链接手动打开：<br/><a href="{verify_url}" style="color:#FF6B6B;word-break:break-all;">{verify_url}</a></p>
            <p style="color:#999;font-size:13px;">验证码10分钟内有效，请勿泄露给他人。</p>
        </div>
    </div>
    """
    return await _send_email(email, "TopDate - 邮箱验证码", html_content)


async def send_match_notification(email: str, match_count: int) -> bool:
    """发送匹配通知"""
    html_content = f"""
    <div style="max-width:600px;margin:0 auto;font-family:'Microsoft YaHei',sans-serif;">
        <h2 style="color:#FF6B6B;">💕 本周匹配结果已生成！</h2>
        <p>你有 <b>{match_count}</b> 个新的潜在匹配对象。</p>
        <p>快去 TopDate 查看吧！</p>
        <a href="https://topdate.cn/matches" style="display:inline-block;background:#FF6B6B;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">查看匹配</a>
    </div>
    """
    return await _send_email(email, "TopDate - 你的本周匹配已就绪", html_content)


async def send_password_reset_email(email: str, code: str) -> bool:
    """发送密码重置验证码"""
    reset_url = f"{settings.SITE_URL}/reset-password?email={email}"
    html_content = f"""
    <div style="max-width:600px;margin:0 auto;font-family:'Microsoft YaHei',sans-serif;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#FF6B6B,#FF8E53);padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;">TopDate ❤️ 密码重置</h1>
            <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;">985高校专属交友平台</p>
        </div>
        <div style="padding:32px;">
            <h2 style="color:#333;font-size:20px;">重置你的密码</h2>
            <p style="color:#666;line-height:1.8;">你的密码重置验证码是：</p>
            <div style="background:#F8F9FA;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
                <span style="font-size:36px;font-weight:bold;color:#FF6B6B;letter-spacing:8px;">{code}</span>
            </div>
            <div style="text-align:center;margin:24px 0;">
                <a href="{reset_url}" style="display:inline-block;background:#FF6B6B;color:#fff;padding:14px 40px;border-radius:12px;text-decoration:none;font-size:16px;font-weight:bold;">去重设密码</a>
            </div>
            <p style="color:#999;font-size:13px;">验证码10分钟内有效，如果非本人操作请忽略此邮件。</p>
        </div>
    </div>
    """
    return await _send_email(email, "TopDate - 密码重置验证码", html_content)


async def send_resend_verification_email(email: str, code: str) -> bool:
    """重新发送验证码邮件"""
    return await send_verification_email(email, code)
