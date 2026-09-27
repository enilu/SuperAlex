"""任务 CRUD、打卡与每日清单维护（总览 API 的业务层）。

口径（方案 §6、§11）：
- 当日清单 = due_date 指定日期且 status in (open, done)；
- 打卡 = PATCH status：done/open，流水写 checkins，actor 取当前显示名；
- 仅今天与未来日期可维护（新建/编辑/删除/复制/清空），历史只读保护统计；
- 打卡本身不设日期限制（家长可补记/撤销）。
"""
from __future__ import annotations

import re
import sqlite3
from datetime import date, datetime, timedelta

VALID_KINDS = ("in_school", "extra_school")
VALID_STATUS = ("open", "done", "cancelled")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
SUBJECTS = ("语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "道法", "其他")


def today_str() -> str:
    return date.today().isoformat()


def check_date(value: str) -> str:
    value = (value or "").strip()
    if not DATE_RE.match(value):
        raise ValueError(f"日期格式应为 YYYY-MM-DD: {value!r}")
    datetime.strptime(value, "%Y-%m-%d")  # 校验真实存在
    return value


def _clean(data: dict, partial: bool = False) -> dict:
    out: dict = {}
    errors: list[str] = []

    def want(field: str) -> bool:
        return field in data and (not partial or data[field] is not None)

    if want("title"):
        title = str(data["title"]).strip()
        if not title:
            errors.append("标题不能为空")
        if len(title) > 200:
            errors.append("标题过长")
        out["title"] = title
    if want("subject"):
        out["subject"] = str(data["subject"]).strip() or "其他"
    if want("kind"):
        kind = str(data["kind"]).strip()
        if kind not in VALID_KINDS:
            errors.append(f"kind 必须是 {VALID_KINDS}")
        out["kind"] = kind
    if want("due_date"):
        try:
            out["due_date"] = check_date(str(data["due_date"]))
        except ValueError as exc:
            errors.append(str(exc))
    if want("est_minutes"):
        try:
            est = int(data["est_minutes"])
            if not 1 <= est <= 600:
                raise ValueError
            out["est_minutes"] = est
        except (TypeError, ValueError):
            errors.append("预计时长应为 1-600 分钟")
    if want("note"):
        out["note"] = str(data["note"])[:1000]
    if want("status"):
        status = str(data["status"]).strip()
        if status not in VALID_STATUS:
            errors.append(f"status 必须是 {VALID_STATUS}")
        out["status"] = status
    if want("sort_order"):
        try:
            out["sort_order"] = int(data["sort_order"])
        except (TypeError, ValueError):
            errors.append("sort_order 必须是整数")

    if errors:
        raise ValueError("；".join(errors))
    return out


def _row(conn: sqlite3.Connection, task_id: int) -> sqlite3.Row | None:
    return conn.execute(
        "SELECT t.*, COALESCE((SELECT COUNT(*) FROM task_resources tr "
        "  WHERE tr.task_id = t.id), 0) AS res_count "
        "FROM tasks t WHERE t.id = ?",
        (task_id,),
    ).fetchone()


def serialize(conn: sqlite3.Connection, row: sqlite3.Row) -> dict:
    from .library import file_url  # 局部导入避免环

    resources = [
        {
            "id": r["id"],
            "title": r["title"],
            "visibility": r["visibility"],
            "url": file_url(r),
            "size_human": (lambda n: f"{n / 1048576:.1f} MB" if n >= 1048576
                           else f"{n / 1024:.0f} KB" if n >= 1024 else f"{n} B")(r["size"]),
        }
        for r in conn.execute(
            "SELECT r.* FROM task_resources tr JOIN resources r ON r.id = tr.resource_id "
            "WHERE tr.task_id = ? ORDER BY r.id",
            (row["id"],),
        )
    ]
    return {
        "id": row["id"],
        "title": row["title"],
        "subject": row["subject"],
        "kind": row["kind"],
        "due_date": row["due_date"],
        "est_minutes": row["est_minutes"],
        "note": row["note"],
        "status": row["status"],
        "sort_order": row["sort_order"],
        "created_at": row["created_at"],
        "completed_at": row["completed_at"],
        "resources": resources,
        "resource_count": len(resources),
    }


# ---------- CRUD ----------

def create_task(conn: sqlite3.Connection, data: dict, user_id: int | None) -> dict:
    fields = _clean(data)
    for required in ("title", "subject", "kind", "due_date"):
        if required not in fields:
            raise ValueError(f"缺少必填字段: {required}")
    cur = conn.execute(
        "INSERT INTO tasks(title, subject, kind, due_date, est_minutes, note, "
        " status, sort_order, created_by) "
        "VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)",
        (
            fields["title"],
            fields.get("subject", "其他"),
            fields["kind"],
            fields["due_date"],
            fields.get("est_minutes", 20),
            fields.get("note", ""),
            fields.get("sort_order", 0),
            user_id,
        ),
    )
    conn.commit()
    return serialize(conn, _row(conn, int(cur.lastrowid)))


def list_tasks(
    conn: sqlite3.Connection,
    due_date: str,
    kind: str | None = None,
    include_cancelled: bool = False,
) -> list[dict]:
    where = ["due_date = ?"]
    params: list = [due_date]
    if kind:
        where.append("kind = ?")
        params.append(kind)
    if not include_cancelled:
        where.append("status != 'cancelled'")
    rows = conn.execute(
        f"SELECT * FROM tasks WHERE {' AND '.join(where)} "
        "ORDER BY status, sort_order, id",
        params,
    ).fetchall()
    return [serialize(conn, row) for row in rows]


def get_task(conn: sqlite3.Connection, task_id: int) -> dict | None:
    row = _row(conn, task_id)
    return serialize(conn, row) if row else None


def _record_checkin(
    conn: sqlite3.Connection, task_id: int, action: str, actor: str
) -> None:
    conn.execute(
        "INSERT INTO checkins(task_id, action, actor) VALUES (?, ?, ?)",
        (task_id, action, actor or ""),
    )


def update_task(
    conn: sqlite3.Connection,
    task_id: int,
    patch: dict,
    user_id: int | None = None,
    actor: str = "",
) -> dict | None:
    row = _row(conn, task_id)
    if row is None:
        return None

    fields = _clean(patch, partial=True)
    if not fields:
        raise ValueError("没有可更新的字段")

    # 维护窗口：历史日期只允许打卡（status），其余字段 403
    touches_content = {"title", "subject", "kind", "due_date", "est_minutes",
                       "note", "sort_order"} & set(fields)
    if touches_content and row["due_date"] < today_str():
        raise PermissionError("历史日期清单只读，请到当天维护")

    if fields.get("status") and fields["status"] != row["status"]:
        new_status = fields["status"]
        if new_status == "done":
            conn.execute(
                "UPDATE tasks SET status='done', completed_at=datetime('now'), "
                " completed_by=? WHERE id=?",
                (user_id, task_id),
            )
            _record_checkin(conn, task_id, "done", actor)
        elif new_status == "open":
            conn.execute(
                "UPDATE tasks SET status='open', completed_at=NULL, "
                " completed_by=NULL WHERE id=?",
                (task_id,),
            )
            _record_checkin(conn, task_id, "reopen", actor)
        else:  # cancelled 不由打卡触发
            conn.execute("UPDATE tasks SET status=? WHERE id=?", (new_status, task_id))
        fields.pop("status")

    if fields:
        assignments = ", ".join(f"{col} = ?" for col in fields)
        conn.execute(
            f"UPDATE tasks SET {assignments} WHERE id = ?",
            [*fields.values(), task_id],
        )
    conn.commit()
    return serialize(conn, _row(conn, task_id))


def delete_task(conn: sqlite3.Connection, task_id: int) -> bool:
    row = _row(conn, task_id)
    if row is None:
        return False
    if row["due_date"] < today_str():
        raise PermissionError("历史日期清单只读，请到当天维护")
    conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    return True


# ---------- 批量：复制 / 清空 / 连续录入 ----------

def copy_day(
    conn: sqlite3.Connection,
    src_date: str,
    dst_date: str,
    user_id: int | None = None,
) -> int:
    """把 src_date 的清单复制到 dst_date（状态重置为 open）。"""
    src_date = check_date(src_date)
    dst_date = check_date(dst_date)
    if dst_date < today_str():
        raise PermissionError("只能维护今天与未来日期")
    rows = conn.execute(
        "SELECT title, subject, kind, est_minutes, note, sort_order FROM tasks "
        "WHERE due_date = ? AND status != 'cancelled' ORDER BY sort_order, id",
        (src_date,),
    ).fetchall()
    for row in rows:
        conn.execute(
            "INSERT INTO tasks(title, subject, kind, due_date, est_minutes, note, "
            " status, sort_order, created_by) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)",
            (
                row["title"], row["subject"], row["kind"], dst_date,
                row["est_minutes"], row["note"], row["sort_order"], user_id,
            ),
        )
    conn.commit()
    return len(rows)


def clear_day(conn: sqlite3.Connection, due_date: str) -> int:
    """从零开始：删除当日全部清单（级联清理关联与流水）。"""
    due_date = check_date(due_date)
    if due_date < today_str():
        raise PermissionError("只能维护今天与未来日期")
    cur = conn.execute(
        "DELETE FROM tasks WHERE due_date = ? AND status != 'cancelled'", (due_date,)
    )
    conn.commit()
    return cur.rowcount


# ---------- 任务 ⇄ 资料（多对多） ----------

def set_resource_links(
    conn: sqlite3.Connection,
    task_id: int,
    resource_ids: list,
    mode: str = "set",
) -> None:
    """关联资料：mode=set（覆盖）| add（追加）| remove（移除）。"""
    if mode not in ("set", "add", "remove"):
        raise ValueError("mode 必须是 set/add/remove")
    try:
        ids = sorted({int(i) for i in resource_ids})
    except (TypeError, ValueError):
        raise ValueError("resource_ids 必须是整数数组") from None

    if ids and mode != "remove":
        placeholders = ",".join("?" * len(ids))
        found = {
            r["id"]
            for r in conn.execute(
                f"SELECT id FROM resources WHERE id IN ({placeholders})", ids
            )
        }
        missing = set(ids) - found
        if missing:
            raise ValueError(f"无效 resource_id: {sorted(missing)}")

    if mode == "set":
        conn.execute("DELETE FROM task_resources WHERE task_id = ?", (task_id,))
        for rid in ids:
            conn.execute(
                "INSERT INTO task_resources(task_id, resource_id) VALUES (?, ?)",
                (task_id, rid),
            )
    elif mode == "add":
        for rid in ids:
            conn.execute(
                "INSERT OR IGNORE INTO task_resources(task_id, resource_id) VALUES (?, ?)",
                (task_id, rid),
            )
    else:
        if ids:
            placeholders = ",".join("?" * len(ids))
            conn.execute(
                f"DELETE FROM task_resources WHERE task_id = ? "
                f"AND resource_id IN ({placeholders})",
                [task_id, *ids],
            )
    conn.commit()


# ---------- 总览统计 ----------

def series(conn: sqlite3.Connection, end_date: str, days: int = 7) -> list[dict]:
    """最近 N 天（含 end_date）每日 total/done/rate。"""
    end = datetime.strptime(check_date(end_date), "%Y-%m-%d").date()
    out: list[dict] = []
    for i in range(days - 1, -1, -1):
        day = (end - timedelta(days=i)).isoformat()
        row = conn.execute(
            "SELECT COUNT(*) AS total, "
            " SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) AS done "
            " FROM tasks WHERE due_date = ? AND status IN ('open','done')",
            (day,),
        ).fetchone()
        total = int(row["total"] or 0)
        done = int(row["done"] or 0)
        out.append(
            {
                "date": day,
                "total": total,
                "done": done,
                "rate": round(done * 100 / total) if total else None,
            }
        )
    return out


def overview(
    conn: sqlite3.Connection, due_date: str, kind: str | None = None
) -> dict:
    due_date = check_date(due_date)
    tasks = list_tasks(conn, due_date, kind=kind)
    total = len(tasks)
    done = sum(1 for t in tasks if t["status"] == "done")

    groups: dict[str, list[dict]] = {}
    for task in tasks:  # list_tasks 已按 status 排序，done 组内置后
        groups.setdefault(task["subject"], []).append(task)

    kind_counts = {
        "in_school": sum(1 for t in tasks if t["kind"] == "in_school"),
        "extra_school": sum(1 for t in tasks if t["kind"] == "extra_school"),
    }
    dt = datetime.strptime(due_date, "%Y-%m-%d")
    return {
        "date": due_date,
        "weekday": "星期" + "一二三四五六日"[dt.weekday()],
        "total": total,
        "done": done,
        "rate": round(done * 100 / total) if total else 0,
        "kind_counts": kind_counts,
        "groups": [
            {"subject": name, "items": items,
             "done": sum(1 for t in items if t["status"] == "done")}
            for name, items in groups.items()
        ],
        "series": series(conn, due_date, 7),
        "maintainable": due_date >= today_str(),
    }
