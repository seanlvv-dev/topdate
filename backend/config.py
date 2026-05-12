from __future__ import annotations
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "TopDate"
    SECRET_KEY: str = "change-this-to-a-random-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    DATABASE_URL: str = "sqlite+aiosqlite:///./topdate.db"
    REDIS_URL: str = "redis://localhost:6379/0"

    SMTP_HOST: str = "smtp.example.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@topdate.cn"

    MATCHING_CRON_DAY: int = 2  # Wednesday (0=Monday, ..., 6=Sunday)
    MATCHING_CRON_HOUR: int = 17  # 17:50 提前十分钟跑
    MATCHING_CRON_MINUTE: int = 50
    MATCHING_SATURDAY_HOUR: int = 17
    MATCHING_SATURDAY_MINUTE: int = 50
    TOP_MATCHES_PER_USER: int = 1
    SITE_URL: str = "http://111.229.36.34:3000"

    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
