"""API 路由。"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path

from flask import current_app, jsonify, redirect, request, send_file

from .. import tasks as tasks_mod
from .. import uploads as uploads_mod
from ..auth import csrf_protect, current_user, login_required
from ..db import get_db, schema_version
from ..library import (
    current_school_year,
    facets,
    file_url,
    normalize_year,
    search_resources,
    serialize,
)
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
    """资料检索：关键词 + 学年/学科/分类/类型筛选，分页返回。"""
    conn = get_db()
    data = search_resources(
        conn,
        q=request.args.get("q", ""),
        subject=request.args.get("subject", ""),
        category=request.args.get("category", ""),
        kind=request.args.get("kind", ""),
        visibility=request.args.get("visibility", ""),
        year=request.args.get("year", ""),
        page=request.args.get("page", 1, type=int),
        per_page=request.args.get("per_page", 50, type=int),
        sort=request.args.get("sort", ""),
    )
    data["facets"] = facets(conn)
    return jsonify(data)


@bp.post("/upload")
@login_required
@csrf_protect
def upload_files():
    """上传入库：多文件（表单字段 files），先入 resources 再由任务关联。"""
    files = [f for f in request.files.getlist("files") if f and f.filename]
    if not files:
        return _err("缺少文件（表单字段 files）", 400)
    kind = request.form.get("kind", "homework")
    if kind not in ("library", "homework"):
        return _err("kind 必须是 library/homework", 400)
    year_raw = request.form.get("year")
    if year_raw is None or not year_raw.strip():
        year = current_school_year()  # 缺省默认当前学年（兼容旧调用方）
    else:
        try:
            year = normalize_year(year_raw)
        except ValueError as exc:
            return _err(str(exc), 400)

    uid, _ = _actor()
    uploaded, deduped, errors = [], [], []
    for file in files:
        try:
            res = uploads_mod.save_upload(file, uid, kind, year=year)
        except ValueError as exc:
            errors.append({"file": file.filename, "error": str(exc)})
        else:
            (deduped if res["deduped"] else uploaded).append(res)

    if not uploaded and not deduped:
        return jsonify(ok=False, uploaded=[], deduped=[], errors=errors), 400
    return jsonify(ok=True, uploaded=uploaded, deduped=deduped, errors=errors)


@bp.get("/files/<int:resource_id>")
@login_required
def serve_file(resource_id: int):
    """private 鉴权下载/预览；public 302 到 nginx 静态 URL。"""
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM resources WHERE id = ?", (resource_id,)
    ).fetchone()
    if row is None:
        return _err("资料不存在", 404)
    if row["visibility"] == "public":
        return redirect(file_url(row))

    root = Path(current_app.config["UPLOAD_DIR"]).resolve()
    rel = Path(row["rel_path"])
    target = (rel if rel.is_absolute() else root / rel).resolve()
    if not target.is_relative_to(root) or not target.is_file():
        return _err("文件不存在", 404)  # 不泄露路径细节
    return send_file(
        target,
        mimetype=row["mime"] or None,
        as_attachment=request.args.get("dl") == "1",
        download_name=Path(row["rel_path"]).name,
    )


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
    conn = get_db()
    try:
        task = tasks_mod.create_task(conn, data, _actor()[0])
        resource_ids = data.get("resource_ids")
        if resource_ids:
            if not isinstance(resource_ids, list):
                raise ValueError("resource_ids 必须是数组")
            tasks_mod.set_resource_links(conn, task["id"], resource_ids, "set")
            task = tasks_mod.get_task(conn, task["id"])
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
    ids = data.get("resource_ids")
    if not isinstance(ids, list):
        return _err("resource_ids 必须是数组", 400)

    conn = get_db()
    if tasks_mod.get_task(conn, task_id) is None:
        return _err("任务不存在", 404)
    try:
        tasks_mod.set_resource_links(conn, task_id, ids, mode)
    except ValueError as exc:
        return _err(str(exc), 400)
    return jsonify(tasks_mod.get_task(conn, task_id))


# ---------- 资料库管理：改元数据 / 删除保护 ----------

_RESOURCE_TEXT_FIELDS = {
    "title": 200,
    "subject": 50,
    "category": 50,
    "tags": 200,
    "note": 1000,
}


@bp.patch("/resources/<int:resource_id>")
@login_required
@csrf_protect
def patch_resource(resource_id: int):
    """改名 / 学科 / 分类 / 标签 / 备注 / 学年。

    rel_path、visibility、locked、size、sha256 一律不接受：
    存量资料 locked=1 只改元数据，路径与文件保持锁定。
    学年 year：空串=清除；非空必须 YYYY-YYYY 且首尾相邻。
    """
    data = _payload()
    updates: dict = {}
    errors: list[str] = []
    for field, limit in _RESOURCE_TEXT_FIELDS.items():
        if field in data and data[field] is not None:
            value = str(data[field]).strip()
            if field == "title" and not value:
                errors.append("标题不能为空")
            elif len(value) > limit:
                errors.append(f"{field} 过长（≤{limit}）")
            else:
                updates[field] = value
    if "year" in data and data["year"] is not None:
        try:
            updates["year"] = normalize_year(str(data["year"]))
        except ValueError as exc:
            errors.append(str(exc))
    if errors:
        return _err("；".join(errors), 400)
    if not updates:
        return _err("没有可更新的字段（title/subject/category/tags/note/year）", 400)

    conn = get_db()
    row = conn.execute(
        "SELECT id FROM resources WHERE id = ?", (resource_id,)
    ).fetchone()
    if row is None:
        return _err("资料不存在", 404)

    assignments = ", ".join(f"{col} = ?" for col in updates)
    conn.execute(
        f"UPDATE resources SET {assignments}, updated_at = datetime('now') "
        "WHERE id = ?",
        [*updates.values(), resource_id],
    )
    conn.commit()
    updated = conn.execute(
        "SELECT * FROM resources WHERE id = ?", (resource_id,)
    ).fetchone()
    return jsonify(serialize(updated))


@bp.delete("/resources/<int:resource_id>")
@login_required
@csrf_protect
def delete_resource(resource_id: int):
    """删除保护：仅非 locked 的 private（本系统新上传）可删记录 + 文件。

    locked=1（存量 140 条）→ 403；public → 403（保留外链兼容）。
    """
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM resources WHERE id = ?", (resource_id,)
    ).fetchone()
    if row is None:
        return _err("资料不存在", 404)
    if row["locked"]:
        return _err("存量资料仅支持修改元数据，文件不可删除", 403)
    if row["visibility"] != "private":
        return _err("公开资料保留外链，不可删除", 403)

    root = Path(current_app.config["UPLOAD_DIR"]).resolve()
    rel = Path(row["rel_path"])
    target = (rel if rel.is_absolute() else root / rel).resolve()
    file_removed = False
    if target.is_relative_to(root) and target.is_file():
        target.unlink()
        file_removed = True

    # 解除任务关联（task_resources 无 ON DELETE CASCADE）
    conn.execute("DELETE FROM task_resources WHERE resource_id = ?", (resource_id,))
    conn.execute("DELETE FROM resources WHERE id = ?", (resource_id,))
    conn.commit()
    return jsonify(deleted=True, file_removed=file_removed, resource=serialize(row))


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
