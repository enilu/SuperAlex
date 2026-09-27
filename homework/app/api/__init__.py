"""JSON API 蓝图：url_prefix = /homework/api。"""
from flask import Blueprint

bp = Blueprint("api", __name__)

from . import routes  # noqa: E402,F401  注册路由
