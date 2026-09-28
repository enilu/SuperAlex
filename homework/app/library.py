"""资料库检索与序列化（页面与 API 共用）。"""
from __future__ import annotations

import sqlite3
from pathlib import PurePosixPath

from flask import current_app


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
    }


def _conditions(
    q: str = "",
    subject: str = "",
    category: str = "",
    kind: str = "",
    visibility: str = "",
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
    page: int = 1,
    per_page: int = 50,
    sort: str = "",
) -> dict:
    conds, params = _conditions(
        q=q, subject=subject, category=category, kind=kind, visibility=visibility
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
) -> dict:
    """四维分面计数（供按钮组筛选）：某维计数时带上其它维条件、忽略自身。"""
    dims = {
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
        rows = conn.execute(
            f"SELECT r.{dim} AS v, COUNT(*) AS n FROM resources r "
            f"{_clause(conds)} GROUP BY r.{dim} ORDER BY r.{dim}",
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
