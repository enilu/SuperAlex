"""API 路由。"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from flask import current_app, jsonify, request

from .. import tasks as tasks_mod
from ..auth import csrf_protect, current_user, login_required
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


# ---------- 任务 / 打卡 / 每日清单 ----------

def _err(message: str, code: int):
    return jsonify(error=message), code


def _payload() -> dict:
    data = request.get_json(silent=True)
    if isinstance(data, dict):
        return data
    return dict(request.form)


def _actor() -> tuple[int | None, str]:
    user = current_user()
    return user["uid"], user["display_name"] or ""


def _date_arg(default: str | None = None) -> str:
    return request.args.get("date") or default or tasks_mod.today_str()


@bp.get("/overview")
@login_required
def overview():
    kind = request.args.get("kind") or None
    if kind and kind not in tasks_mod.VALID_KINDS:
        return _err("非法 kind", 400)
    try:
        return jsonify(tasks_mod.overview(get_db(), _date_arg(), kind=kind))
    except ValueError as exc:
        return _err(str(exc), 400)


@bp.get("/tasks")
@login_required
def list_tasks_api():
    kind = request.args.get("kind") or None
    if kind and kind not in tasks_mod.VALID_KINDS:
        return _err("非法 kind", 400)
    try:
        due_date = tasks_mod.check_date(_date_arg())
    except ValueError as exc:
        return _err(str(exc), 400)
    items = tasks_mod.list_tasks(get_db(), due_date, kind=kind)
    return jsonify(date=due_date, items=items, total=len(items))


@bp.post("/tasks")
@login_required
@csrf_protect
def create_task():
    data = _payload()
    due_date = data.get("due_date") or _date_arg()
    if due_date < tasks_mod.today_str():
        return _err("历史日期只读，不能新建任务", 403)
    data["due_date"] = due_date
    try:
        task = tasks_mod.create_task(get_db(), data, _actor()[0])
    except ValueError as exc:
        return _err(str(exc), 400)
    return jsonify(task), 201


@bp.post("/tasks/bulk")
@login_required
@csrf_protect
def bulk_tasks():
    """批量：连续录入 / 复制昨日 / 复制上周同日 / 从零开始。"""
    data = _payload()
    mode = data.get("mode", "create")
    due_date = data.get("date") or _date_arg()
    try:
        due_date = tasks_mod.check_date(due_date)
    except ValueError as exc:
        return _err(str(exc), 400)

    conn = get_db()
    uid, _ = _actor()

    if mode == "create":
        titles = data.get("titles") or []
        if not isinstance(titles, list) or not titles:
            return _err("titles 不能为空", 400)
        if due_date < tasks_mod.today_str():
            return _err("历史日期只读，不能新建任务", 403)
        default_kind = data.get("kind") or "in_school"
        created = []
        try:
            for entry in titles:
                if isinstance(entry, str):
                    entry = {"title": entry}
                entry = {**entry}
                entry.setdefault("subject", data.get("subject") or "其他")
                entry.setdefault("kind", entry.get("kind") or default_kind)
                entry.setdefault("est_minutes", data.get("est_minutes") or 20)
                entry["due_date"] = due_date
                created.append(tasks_mod.create_task(conn, entry, uid))
        except ValueError as exc:
            return _err(f"第 {len(created) + 1} 条失败: {exc}", 400)
        return jsonify(mode=mode, date=due_date, created=len(created), items=created)

    if mode in ("copy", "copy_yesterday", "copy_last_week"):
        if mode == "copy_yesterday":
            src = data.get("from_date") or (
                datetime.strptime(due_date, "%Y-%m-%d") - timedelta(days=1)
            ).date().isoformat()
        elif mode == "copy_last_week":
            src = data.get("from_date") or (
                datetime.strptime(due_date, "%Y-%m-%d") - timedelta(days=7)
            ).date().isoformat()
        else:
            src = data.get("from_date")
            if not src:
                return _err("copy 模式需要 from_date", 400)
        try:
            n = tasks_mod.copy_day(conn, src, due_date, uid)
        except (ValueError, PermissionError) as exc:
            return _err(str(exc), 403 if isinstance(exc, PermissionError) else 400)
        return jsonify(mode=mode, date=due_date, from_date=src, created=n)

    if mode == "clear":
        try:
            n = tasks_mod.clear_day(conn, due_date)
        except (ValueError, PermissionError) as exc:
            return _err(str(exc), 403 if isinstance(exc, PermissionError) else 400)
        return jsonify(mode=mode, date=due_date, removed=n)

    return _err(f"未知 mode: {mode}", 400)


@bp.patch("/tasks/<int:task_id>")
@login_required
@csrf_protect
def patch_task(task_id: int):
    data = _payload()
    if not data:
        return _err("请求体为空", 400)
    uid, actor = _actor()
    try:
        task = tasks_mod.update_task(get_db(), task_id, data, uid, actor)
    except PermissionError as exc:
        return _err(str(exc), 403)
    except ValueError as exc:
        return _err(str(exc), 400)
    if task is None:
        return _err("任务不存在", 404)
    return jsonify(task)


@bp.delete("/tasks/<int:task_id>")
@login_required
@csrf_protect
def delete_task(task_id: int):
    try:
        ok = tasks_mod.delete_task(get_db(), task_id)
    except PermissionError as exc:
        return _err(str(exc), 403)
    if not ok:
        return _err("任务不存在", 404)
    return jsonify(deleted=True)


@bp.post("/tasks/<int:task_id>/resources")
@login_required
@csrf_protect
def link_resources(task_id: int):
    """关联/取消关联资料（多对多）：mode=set|add|remove。"""
    data = _payload()
    mode = data.get("mode", "set")
    ids = data.get("resource_ids") or []
    if mode not in ("set", "add", "remove") or not isinstance(ids, list):
        return _err("mode 必须是 set/add/remove，且 resource_ids 为数组", 400)

    conn = get_db()
    if tasks_mod.get_task(conn, task_id) is None:
        return _err("任务不存在", 404)
    existing = {
        r["id"]
        for r in conn.execute(
            "SELECT id FROM resources WHERE id IN ({})".format(
                ",".join("?" * len(ids)) or "NULL"
            ),
            [int(i) for i in ids],
        )
    } if ids else set()
    if ids and len(existing) != len({int(i) for i in ids}):
        return _err("存在无效 resource_id", 400)

    if mode == "set":
        conn.execute("DELETE FROM task_resources WHERE task_id = ?", (task_id,))
        for rid in sorted(existing):
            conn.execute(
                "INSERT INTO task_resources(task_id, resource_id) VALUES (?, ?)",
                (task_id, rid),
            )
    elif mode == "add":
        for rid in sorted(existing):
            conn.execute(
                "INSERT OR IGNORE INTO task_resources(task_id, resource_id) VALUES (?, ?)",
                (task_id, rid),
            )
    else:
        conn.execute(
            "DELETE FROM task_resources WHERE task_id = ? AND resource_id IN ({})".format(
                ",".join("?" * len(ids))
            ),
            [task_id, *[int(i) for i in ids]],
        )
    conn.commit()
    return jsonify(tasks_mod.get_task(conn, task_id))


@bp.get("/stats")
@login_required
def stats():
    days = request.args.get("days", 7, type=int)
    days = max(1, min(90, days))
    try:
        end = tasks_mod.check_date(_date_arg())
    except ValueError as exc:
        return _err(str(exc), 400)
    return jsonify(end=end, days=days, series=tasks_mod.series(get_db(), end, days))
