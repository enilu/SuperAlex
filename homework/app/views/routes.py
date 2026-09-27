"""页面路由。"""
from __future__ import annotations

from pathlib import Path

from flask import (
    abort,
    current_app,
    render_template,
    request,
    send_file,
    url_for,
)

from ..auth import login_required
from ..db import get_db, schema_version
from ..library import facets, search_resources
from . import bp


@bp.get("/")
@login_required
def home():
    return _overview(kind="", active="overview", label="学习总览")


@bp.get("/tasks/school")
@login_required
def tasks_school():
    return _overview(kind="in_school", active="school", label="校内作业")


@bp.get("/tasks/extra")
@login_required
def tasks_extra():
    return _overview(kind="extra_school", active="extra", label="校外作业")


def _overview(kind: str, active: str, label: str):
    db_status = "ok"
    schema = None
    try:
        conn = get_db()
        conn.execute("SELECT 1").fetchone()
        schema = schema_version(conn)
    except Exception as exc:  # noqa: BLE001
        db_status = f"error: {type(exc).__name__}"

    return render_template(
        "overview.html",
        kind=kind,
        active=active,
        label=label,
        env=current_app.config["ENV_NAME"],
        db_status=db_status,
        schema=schema,
    )


@bp.get("/healthz")
def healthz():
    """nginx / curl 用的极简探活（与 /api/health 同义，公开可访问）。"""
    from ..api.routes import health

    return health()


# ---------- 资料库 ----------

@bp.get("/library")
@login_required
def library():
    """资料库检索页（原资料馆，元数据来自 SQLite）。"""
    q = request.args.get("q", "").strip()
    subject = request.args.get("subject", "").strip()
    category = request.args.get("category", "").strip()
    page = request.args.get("page", 1, type=int)

    conn = get_db()
    data = search_resources(
        conn, q=q, subject=subject, category=category, page=page, per_page=50
    )
    f = facets(conn)
    return render_template(
        "library.html",
        data=data,
        q=q,
        subject=subject,
        category=category,
        subjects=f["subjects"],
        categories=f["categories"],
        active="library",
    )


# ---------- 旧静态页兜底（P4 归档前保持外链可用） ----------

_LEGACY_PREFIXES = ("assets/", "data/")


@bp.get("/<path:filename>")
def legacy_static(filename: str):
    """旧静态站白名单：index.html / assets/ / data/。

    files/（900MB）永远由 nginx 直出，不经过本路由；
    其余路径一律 404，避免泄露仓库内代码。
    """
    root = Path(current_app.root_path).resolve().parent  # homework/ 仓库根
    if not (filename == "index.html" or filename.startswith(_LEGACY_PREFIXES)):
        abort(404)
    target = (root / filename).resolve()
    if not target.is_relative_to(root) or not target.is_file():
        abort(404)
    return send_file(target)
