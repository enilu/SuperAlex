"""API 路由。"""
from __future__ import annotations

from datetime import datetime, timezone

from flask import current_app, jsonify

from ..db import get_db, schema_version
from . import bp


@bp.get("/health")
def health():
    db_status = "ok"
    schema = None
    try:
        conn = get_db()
        conn.execute("SELECT 1").fetchone()
        schema = schema_version(conn)
    except Exception as exc:  # noqa: BLE001 - 健康检查需要吞掉并暴露异常类型
        db_status = f"error: {type(exc).__name__}"

    return jsonify(
        status="ok",
        app="homework-workbench",
        env=current_app.config["ENV_NAME"],
        db=db_status,
        schema=schema,
        time=datetime.now(timezone.utc).isoformat(timespec="seconds"),
    )
