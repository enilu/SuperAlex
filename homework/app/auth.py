"""登录、会话、CSRF 与登录限速。

- 单共享账号：session 里只存 uid / username / display_name；
- 所有写操作必须带会话级 CSRF token（表单字段 csrf_token 或头 X-CSRF-Token）；
- 限速按 IP 记在进程内（生产为单 worker waitress，够用且无额外依赖）。
"""
from __future__ import annotations

import secrets
import threading
import time
from collections import deque
from functools import wraps

from flask import (
    Blueprint,
    abort,
    current_app,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

from . import users as users_mod
from .db import get_db

bp = Blueprint("auth", __name__)


# ---------- 限速 ----------

class LoginLimiter:
    """固定窗口内的失败计数：limit 次 / window 秒。"""

    def __init__(self, limit: int, window: int) -> None:
        self.limit = max(1, limit)
        self.window = max(1, window)
        self._hits: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def _prune(self, key: str, now: float) -> deque:
        hits = self._hits.setdefault(key, deque())
        while hits and now - hits[0] > self.window:
            hits.popleft()
        return hits

    def blocked(self, key: str) -> bool:
        with self._lock:
            return len(self._prune(key, time.time())) >= self.limit

    def fail(self, key: str) -> None:
        with self._lock:
            self._prune(key, time.time()).append(time.time())

    def reset(self, key: str) -> None:
        with self._lock:
            self._hits.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._hits.clear()


# ---------- CSRF ----------

def csrf_token() -> str:
    """会话级 CSRF token（模板与 API 共用）。"""
    token = session.get("csrf_token")
    if not token:
        token = secrets.token_urlsafe(32)
        session["csrf_token"] = token
    return token


def csrf_protect(view):
    """校验写请求的 CSRF token，失败返回 400。"""

    @wraps(view)
    def wrapped(*args, **kwargs):
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            supplied = (
                request.form.get("csrf_token")
                or request.headers.get("X-CSRF-Token")
                or ""
            )
            expected = session.get("csrf_token") or ""
            if not expected or not secrets.compare_digest(supplied, expected):
                abort(400, description="CSRF 校验失败，请刷新页面后重试")
        return view(*args, **kwargs)

    return wrapped


# ---------- 登录态 ----------

def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if session.get("uid"):
            return view(*args, **kwargs)
        if request.path.startswith(current_app.config["URL_PREFIX"] + "/api"):
            return jsonify(error="unauthorized"), 401
        return redirect(url_for("auth.login"))

    return wrapped


def current_user() -> dict:
    return {
        "uid": session.get("uid"),
        "username": session.get("username"),
        "display_name": session.get("display_name"),
    }


def _limiter() -> LoginLimiter:
    return current_app.extensions["login_limiter"]


# ---------- 路由 ----------

@bp.route("/login", methods=["GET", "POST"])
@csrf_protect
def login():
    error = None
    status = 200

    if request.method == "POST":
        ip = request.remote_addr or "unknown"
        limiter = _limiter()
        username = (request.form.get("username") or "").strip()
        password = request.form.get("password") or ""

        if limiter.blocked(ip):
            error = "尝试次数过多，请稍后再试"
            status = 429
        else:
            conn = get_db()
            user = users_mod.get_user(conn, username)
            if user is None or not users_mod.verify_password(
                user["password_hash"], password
            ):
                limiter.fail(ip)
                # 统一提示，不区分用户不存在还是口令错误
                error = "用户名或密码错误"
                status = 401
            else:
                limiter.reset(ip)
                session.clear()
                session["uid"] = user["id"]
                session["username"] = user["username"]
                session["display_name"] = user["display_name"]
                session["csrf_token"] = secrets.token_urlsafe(32)
                return redirect(url_for("views.home"))

    return render_template("login.html", error=error), status


@bp.post("/logout")
@csrf_protect
def logout():
    session.clear()
    return redirect(url_for("auth.login"))
