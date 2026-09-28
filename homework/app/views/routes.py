"""页面路由。"""
from __future__ import annotations

from pathlib import Path

from flask import (
    abort,
    current_app,
    redirect,
    render_template,
    request,
    send_file,
    url_for,
)

from ..auth import login_required
from ..db import get_db, schema_version
from ..library import facet_counts, facets, search_resources
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


@bp.get("/upload")
@login_required
def upload():
    """上传作业页：先上传入库，再生成任务并关联资料。"""
    from ..tasks import SUBJECTS, today_str

    return render_template(
        "upload.html",
        active="upload",
        subjects=list(SUBJECTS),
        today=today_str(),
    )


# ---------- 资料库 ----------

@bp.get("/library")
@login_required
def library():
    """资料库检索 + 管理页（还原 proto/library.html）。"""
    q = request.args.get("q", "").strip()
    subject = request.args.get("subject", "").strip()
    category = request.args.get("category", "").strip()
    kind = request.args.get("kind", "").strip()
    visibility = request.args.get("visibility", "").strip()
    page = request.args.get("page", 1, type=int)

    conn = get_db()
    data = search_resources(
        conn,
        q=q,
        subject=subject,
        category=category,
        kind=kind,
        visibility=visibility,
        page=page,
        per_page=50,
    )
    f = facets(conn)
    fc = facet_counts(
        conn,
        q=q,
        subject=subject,
        category=category,
        kind=kind,
        visibility=visibility,
    )
    stats = conn.execute(
        "SELECT COUNT(*) AS total, COALESCE(SUM(size), 0) AS bytes, "
        " SUM(CASE WHEN visibility='public' THEN 1 ELSE 0 END) AS pub, "
        " SUM(CASE WHEN visibility='private' THEN 1 ELSE 0 END) AS pri, "
        " SUM(locked) AS locked FROM resources"
    ).fetchone()
    filter_rows = _library_filter_rows(
        fc, q=q, subject=subject, category=category, kind=kind, visibility=visibility
    )
    return render_template(
        "library.html",
        data=data,
        stats={
            "total": int(stats["total"] or 0),
            "mb": (stats["bytes"] or 0) / 1048576,
            "pub": int(stats["pub"] or 0),
            "pri": int(stats["pri"] or 0),
            "locked": int(stats["locked"] or 0),
        },
        q=q,
        subject=subject,
        category=category,
        kind=kind,
        visibility=visibility,
        subjects=f["subjects"],
        categories=f["categories"],
        fc=fc,
        filter_rows=filter_rows,
        active="library",
    )


_KIND_LABELS = {"library": "存量资料", "homework": "作业上传"}
_VIS_LABELS = {"public": "public·静态直出", "private": "private·鉴权下载"}
_ROW_LABELS = {"subject": "学科", "category": "分类", "kind": "类型", "visibility": "可见性"}
_FIXED_OPTIONS = {
    "kind": _KIND_LABELS,
    "visibility": _VIS_LABELS,
}


def _library_filter_rows(fc: dict, **active) -> list[dict]:
    """按钮组筛选行（借鉴旧 index.html 的 filter-bar）：全部 + 各值带计数。"""
    rows = []
    for dim in ("subject", "category", "kind", "visibility"):
        others = {k: v for k, v in active.items() if k != dim and v}
        chips = [
            {
                "label": "全部",
                "count": fc[dim]["all"],
                "active": not active[dim],
                "href": url_for("views.library", **others),
            }
        ]

        def add(value: str, label: str) -> None:
            chips.append(
                {
                    "label": label,
                    "count": fc[dim]["counts"].get(value, 0),
                    "active": active[dim] == value,
                    "href": url_for(
                        "views.library", **{**others, dim: value}
                    ),
                }
            )

        options = _FIXED_OPTIONS.get(dim)
        if options:
            for value, label in options.items():
                add(value, label)
        else:
            for value, _n in fc[dim]["items"]:
                add(value, value)
            if active[dim] and active[dim] not in fc[dim]["counts"]:
                add(active[dim], active[dim])
        rows.append({"label": _ROW_LABELS[dim], "chips": chips})
    return rows


# ---------- 旧静态页兜底（P4 归档前保持外链可用） ----------

_LEGACY_PREFIXES = ("assets/", "data/")


@bp.get("/<path:filename>")
def legacy_static(filename: str):
    """旧静态站白名单：index.html / assets/ / data/。

    files/（900MB）永远由 nginx 直出，不经过本路由；
    其余路径一律 404，避免泄露仓库内代码。
    """
    root = Path(current_app.root_path).resolve().parent  # homework/ 仓库根
    if filename == "index.html":
        # 旧首页入口归档：一律引导到登录页（回滚模式由 nginx alias 直出旧页）
        return redirect(url_for("auth.login"))
    if not filename.startswith(_LEGACY_PREFIXES):
        abort(404)
    target = (root / filename).resolve()
    if not target.is_relative_to(root) or not target.is_file():
        abort(404)
    return send_file(target)
