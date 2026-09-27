"""页面蓝图：url_prefix = /homework。

static 挂在蓝图下，使静态资源统一为 /homework/static/...，
本地开发与线上 nginx（保留 /homework 前缀）行为一致。
"""
from pathlib import Path

from flask import Blueprint

_STATIC = Path(__file__).resolve().parent.parent.parent / "static"

bp = Blueprint(
    "views",
    __name__,
    static_folder=str(_STATIC),
    static_url_path="/static",
)

from . import routes  # noqa: E402,F401  注册路由
