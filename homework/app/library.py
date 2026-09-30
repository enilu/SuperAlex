"""资料库检索与序列化（页面与 API 共用）。"""
from __future__ import annotations

import re
import sqlite3
from datetime import date
from pathlib import PurePosixPath

from flask import current_app

YEAR_RE = re.compile(r"^\d{4}-\d{4}$")


def normalize_year(value) -> str:
    """校验学年：空串=未设置；非空必须 YYYY-YYYY 且首尾相邻。"""
    v = (value or "").strip()
    if not v:
        return ""
    if not YEAR_RE.fullmatch(v):
        raise ValueError("学年格式应为 YYYY-YYYY，如 2026-2027")
    start, end = int(v[:4]), int(v[5:])
    if end != start + 1:
        raise ValueError("学年首尾需相邻，如 2026-2027")
    return v


def current_school_year(today: date | None = None) -> str:
    """9 月及以后为当年起学年，否则为上一年起学年（2026-09-30 → 2026-2027）。"""
    d = today or date.today()
    return f"{d.year}-{d.year + 1}" if d.month >= 9 else f"{d.year - 1}-{d.year}"


def year_from_path(rel_path: str) -> str:
    """从 files/library/YYYY-YYYY/... 路径解析学年，无法解析返回空串。"""
    parts = PurePosixPath(rel_path or "").parts
    if len(parts) >= 3 and parts[0] == "files" and parts[1] == "library":
        try:
            return normalize_year(parts[2])
        except ValueError:
            return ""
    return ""


def human_size(num: int) -> str:
    num = int(num or 0)
    step = 1024.0
    for unit in ("B", "KB", "MB", "GB"):
        if num < step:
            return f"{num:.0f} {unit}" if unit == "B" else f"{num:.1f} {unit}"
        num /= step
    return f"{num:.1f} TB"


def file_url(row: sqlite3.Row | dict) -> str:
    """public → nginx 静态直出；private → P3 的鉴权下载接口。"""
    prefix = current_app.config["URL_PREFIX"]
    if row["visibility"] == "public":
        # rel_path 形如 files/library/...，相对站点根
        return f"{prefix}/{PurePosixPath(row['rel_path'])}"
    return f"{prefix}/api/files/{row['id']}"


def serialize(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "subject": row["subject"],
        "category": row["category"],
        "tags": row["tags"],
        "note": row["note"],
        "kind": row["kind"],
        "visibility": row["visibility"],
        "locked": bool(row["locked"]),
        "size": row["size"],
        "size_human": human_size(row["size"]),
        "url": file_url(row),
        "rel_path": row["rel_path"],
        "collection_id": row["collection_id"],
        "created_at": row["created_at"],
        "legacy_id": row["legacy_id"] if "legacy_id" in row.keys() else None,
        "year": row["year"] if "year" in row.keys() else "",
    }


def _conditions(
    q: str = "",
    subject: str = "",
    category: str = "",
    kind: str = "",
    visibility: str = "",
    year: str = "",
    skip: str = "",
) -> tuple[list[str], list]:
    """WHERE 条件与参数；skip 用于分面计数时忽略某一维自身条件。"""
    conds: list[str] = []
    params: list = []
    q = (q or "").strip()
    if q:
        like = f"%{q}%"
        conds.append(
            "(r.title LIKE ? OR r.note LIKE ? OR r.category LIKE ? "
            "OR r.tags LIKE ? OR r.subject LIKE ?)"
        )
        params += [like] * 5
    for column, value in (
        ("subject", subject),
        ("category", category),
        ("kind", kind),
        ("visibility", visibility),
        ("year", year),
    ):
        if value and column != skip:
            conds.append(f"r.{column} = ?")
            params.append(value)
    return conds, params


def _clause(conds: list[str]) -> str:
    return f"WHERE {' AND '.join(conds)}" if conds else ""


def search_resources(
    conn: sqlite3.Connection,
    q: str = "",
    subject: str = "",
    category: str = "",
    kind: str = "",
    visibility: str = "",
    year: str = "",
    page: int = 1,
    per_page: int = 50,
    sort: str = "",
) -> dict:
    conds, params = _conditions(
        q=q, subject=subject, category=category, kind=kind,
        visibility=visibility, year=year,
    )
    clause = _clause(conds)

    total = conn.execute(
        f"SELECT COUNT(*) AS c FROM resources r {clause}", params
    ).fetchone()["c"]

    page = max(1, int(page or 1))
    per_page = max(1, min(200, int(per_page or 50)))
    offset = (page - 1) * per_page
    order = (
        "ORDER BY r.created_at DESC, r.id DESC"
        if sort == "recent"
        else "ORDER BY r.collection_id, r.id"
    )
    rows = conn.execute(
        f"""
        SELECT r.*, c.name AS collection_name
          FROM resources r
          LEFT JOIN collections c ON c.id = r.collection_id
          {clause}
         {order}
         LIMIT ? OFFSET ?
        """,
        [*params, per_page, offset],
    ).fetchall()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": max(1, (total + per_page - 1) // per_page),
        "items": [serialize(row) for row in rows],
    }


def facets(conn: sqlite3.Connection) -> dict:
    def values(column: str) -> list[str]:
        rows = conn.execute(
            f"SELECT DISTINCT {column} AS v FROM resources "
            f"WHERE {column} != '' ORDER BY v"
        ).fetchall()
        return [row["v"] for row in rows]

    return {
        "subjects": values("subject"),
        "categories": values("category"),
        "years": [
            row["v"]
            for row in conn.execute(
                "SELECT DISTINCT year AS v FROM resources "
                "WHERE year != '' ORDER BY v DESC"
            )
        ],
        "current_year": current_school_year(),
        "collections": [
            {"id": row["id"], "name": row["name"]}
            for row in conn.execute(
                "SELECT id, name FROM collections ORDER BY id"
            )
        ],
    }


def facet_counts(
    conn: sqlite3.Connection,
    q: str = "",
    subject: str = "",
    category: str = "",
    kind: str = "",
    visibility: str = "",
    year: str = "",
) -> dict:
    """五维分面计数（供按钮组筛选）：某维计数时带上其它维条件、忽略自身。"""
    dims = {
        "year": year,
        "subject": subject,
        "category": category,
        "kind": kind,
        "visibility": visibility,
    }
    out: dict[str, dict] = {}
    for dim, active in dims.items():
        conds, params = _conditions(
            q=q, skip=dim, **{k: v for k, v in dims.items() if k != dim}
        )
        conds.append(f"r.{dim} != ''")
        order = "DESC" if dim == "year" else "ASC"  # 学年新学年在前
        rows = conn.execute(
            f"SELECT r.{dim} AS v, COUNT(*) AS n FROM resources r "
            f"{_clause(conds)} GROUP BY r.{dim} ORDER BY r.{dim} {order}",
            params,
        ).fetchall()
        items = [(row["v"], int(row["n"])) for row in rows]
        out[dim] = {
            "items": items,
            "counts": {v: n for v, n in items},
            "all": sum(n for _, n in items),
            "active": active,
        }
    return out
