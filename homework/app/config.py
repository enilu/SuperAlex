"""运行配置：全部可由环境变量覆盖，生产机用 secrets.env 注入。"""
from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent          # homework/
DEFAULT_VAR_DIR = BASE_DIR / "var"                          # 本地开发数据目录（已 gitignore）


def _env(name: str, default: str) -> str:
    return os.environ.get(name, default)


class Config:
    ENV_NAME = _env("HOMEWORK_ENV", "development")

    # 会话密钥：生产从 /var/lib/homework-workbench/secrets.env 注入
    SECRET_KEY = _env("HOMEWORK_SECRET_KEY", "")

    # SQLite：本地落 homework/var/，生产落站点之外
    DATABASE = _env("HOMEWORK_DB", str(DEFAULT_VAR_DIR / "homework.db"))

    # private 上传件：生产为 /var/lib/homework-workbench/uploads
    UPLOAD_DIR = _env("HOMEWORK_UPLOAD_DIR", str(DEFAULT_VAR_DIR / "uploads"))

    # public 资料根目录（nginx 直出路径对应的本机目录）
    PUBLIC_FILES_ROOT = _env(
        "HOMEWORK_PUBLIC_FILES_ROOT", "/opt/microapp-store/site/homework/files"
    )

    MAX_CONTENT_LENGTH = int(_env("HOMEWORK_MAX_UPLOAD", str(50 * 1024 * 1024)))

    # 应用内所有路由的统一前缀：本地开发与线上 nginx 都保留 /homework
    URL_PREFIX = _env("HOMEWORK_URL_PREFIX", "/homework")

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = _env("HOMEWORK_COOKIE_SECURE", "0") == "1"

    # 登录限速：N 次 / 分钟 / IP（P1 使用）
    LOGIN_RATE_LIMIT = int(_env("HOMEWORK_LOGIN_RATE_LIMIT", "5"))
    LOGIN_RATE_WINDOW = int(_env("HOMEWORK_LOGIN_RATE_WINDOW", "60"))

    JSON_SORT_KEYS = False
