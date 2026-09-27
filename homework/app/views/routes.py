"""页面路由。"""
from __future__ import annotations

from flask import current_app, render_template, url_for

from ..auth import login_required
from ..db import get_db, schema_version
from . import bp


@bp.get("/")
@login_required
def home():
    db_status = "ok"
    schema = None
    try:
        conn = get_db()
        conn.execute("SELECT 1").fetchone()
        schema = schema_version(conn)
    except Exception as exc:  # noqa: BLE001
        db_status = f"error: {type(exc).__name__}"

    return render_template(
        "home.html",
        env=current_app.config["ENV_NAME"],
        db_status=db_status,
        schema=schema,
        health_url=url_for("api.health"),
        active="overview",
    )


@bp.get("/healthz")
def healthz():
    """nginx / curl 用的极简探活（与 /api/health 同义，公开可访问）。"""
    from ..api.routes import health

    return health()
