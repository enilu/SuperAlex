"""API 路由。"""
from __future__ import annotations

from datetime import datetime, timezone

from flask import current_app, jsonify, request

from ..auth import login_required
from ..db import get_db, schema_version
from ..library import facets, search_resources
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


@bp.get("/resources")
@login_required
def list_resources():
    """资料检索：关键词 + 学科/分类/类型筛选，分页返回。"""
    conn = get_db()
    data = search_resources(
        conn,
        q=request.args.get("q", ""),
        subject=request.args.get("subject", ""),
        category=request.args.get("category", ""),
        kind=request.args.get("kind", ""),
        page=request.args.get("page", 1, type=int),
        per_page=request.args.get("per_page", 50, type=int),
    )
    data["facets"] = facets(conn)
    return jsonify(data)
