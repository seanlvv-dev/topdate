"""
频率限制中间件 - 基于内存的简单实现
生产环境建议切换到 Redis
"""
import time
import logging
from collections import defaultdict
from typing import Optional
from fastapi import Request, HTTPException, status

logger = logging.getLogger(__name__)

# 窗口大小（秒）
RATE_LIMIT_WINDOW = 60

# 每个窗口的最大请求数
RATE_LIMITS: dict[str, int] = {
    "/api/auth/register": 5,       # 1分钟5次
    "/api/auth/login": 10,         # 1分钟10次
    "/api/auth/verify-email": 10,  # 1分钟10次
    "/api/auth/forgot-password": 5,
    "/api/auth/reset-password": 5,
    "/api/auth/resend-verification": 3,
}

_hits: dict[str, list[float]] = defaultdict(list)


def _cleanup_old_hits(key: str, now: float):
    """清理过期记录"""
    _hits[key] = [t for t in _hits[key] if now - t < RATE_LIMIT_WINDOW]


def check_rate_limit(path: str, client_ip: str) -> bool:
    """检查是否超过频率限制，返回 True 表示通过"""
    limit = RATE_LIMITS.get(path)
    if limit is None:
        return True
    key = f"{path}:{client_ip}"
    now = time.time()
    _cleanup_old_hits(key, now)
    if len(_hits[key]) >= limit:
        return False
    _hits[key].append(now)
    return True
