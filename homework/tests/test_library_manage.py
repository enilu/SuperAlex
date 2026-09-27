"""P3.5：资料库管理页 —— 改元数据、删除保护、上传入库。"""
from __future__ import annotations

import io
import json
import re
from pathlib import Path

from app import db as db_mod
from app import manage

CSRF_META_RE = re.compile(r'name="csrf-token" content="([^"]+)"')

FIXTURE = {
    "collections": [
        {
            "id": "c-lib",
            "title": "资料集",
            "year": 2026,
            "grade": "二年级",
            "semester": "上学期",
            "summary": "",
            "cover": "",
            "items": [
                {"id": "leg-1", "title": "存量语法练习", "subject": "英语",
                 "type": "pdf", "category": "语法练习", "group": "语法练习",
                 "note": "纸质已发", "path": "files/library/2026/grammar.pdf",
                 "size": 1000},
            ],
        }
    ]
}
PDF = b"%PDF-1.4 \nmanage test\n%%EOF"


def _csrf(client) -> str:
    html = client.get("/homework/").get_data(as_text=True)
    match = CSRF_META_RE.search(html)
    assert match
    return match.group(1)


def _seed(app, tmp_path, monkeypatch):
    """把 fixture 导入测试库，返回存量资源 id。"""
    src = tmp_path / "homework.json"
    src.write_text(json.dumps(FIXTURE, ensure_ascii=False), encoding="utf-8")
    monkeypatch.setattr(manage.Config, "DATABASE", app.config["DATABASE"])
    assert manage.main(["import-json", "--path", str(src)]) == 0
    conn = db_mod.connect_db(app.config["DATABASE"])
    try:
        row = conn.execute(
            "SELECT * FROM resources WHERE legacy_id = 'leg-1'"
        ).fetchone()
        return row["id"]
    finally:
        conn.close()


def _upload(client, token, name="新资料.pdf", blob=PDF, kind="library"):
    resp = client.post(
        "/homework/api/upload",
        data={"files": [(io.BytesIO(blob), name)], "kind": kind},
        headers={"X-CSRF-Token": token},
        content_type="multipart/form-data",
    )
    assert resp.status_code == 200, resp.get_json()
    return resp.get_json()["uploaded"][0]


def test_patch_metadata_on_locked_resource(client, login, app, tmp_path, monkeypatch):
    login()
    token = _csrf(client)
    rid = _seed(app, tmp_path, monkeypatch)

    resp = client.patch(
        f"/homework/api/resources/{rid}",
        json={"title": "语法练习（改名）", "subject": "英语", "category": "语法",
              "tags": "复习,重点", "note": "改成新的备注"},
        headers={"X-CSRF-Token": token},
    )
    assert resp.status_code == 200, resp.get_json()
    body = resp.get_json()
    assert body["title"] == "语法练习（改名）"
    assert body["category"] == "语法"
    assert body["tags"] == "复习,重点"
    assert body["locked"] is True  # 锁定状态不受影响


def test_patch_ignores_protected_fields(client, login, app, tmp_path, monkeypatch):
    login()
    token = _csrf(client)
    rid = _seed(app, tmp_path, monkeypatch)

    conn = db_mod.connect_db(app.config["DATABASE"])
    try:
        before = conn.execute(
            "SELECT rel_path, visibility, locked FROM resources WHERE id = ?", (rid,)
        ).fetchone()
    finally:
        conn.close()

    resp = client.patch(
        f"/homework/api/resources/{rid}",
        json={"rel_path": "/etc/passwd", "visibility": "private", "locked": 0,
              "size": 1, "title": "合法改名"},
        headers={"X-CSRF-Token": token},
    )
    assert resp.status_code == 200

    conn = db_mod.connect_db(app.config["DATABASE"])
    try:
        after = conn.execute(
            "SELECT rel_path, visibility, locked, size, title "
            "FROM resources WHERE id = ?", (rid,)
        ).fetchone()
    finally:
        conn.close()
    assert after["rel_path"] == before["rel_path"]
    assert after["visibility"] == before["visibility"] == "public"
    assert after["locked"] == before["locked"] == 1
    assert after["size"] == 1000
    assert after["title"] == "合法改名"  # 保护字段之外正常更新


def test_patch_validation(client, login, app):
    login()
    token = _csrf(client)
    headers = {"X-CSRF-Token": token}
    assert client.patch("/homework/api/resources/1", json={}, headers=headers).status_code == 400
    assert client.patch("/homework/api/resources/1",
                        json={"title": "  "}, headers=headers).status_code == 400
    assert client.patch("/homework/api/resources/1",
                        json={"title": "x" * 300}, headers=headers).status_code == 400
    assert client.patch("/homework/api/resources/999999",
                        json={"title": "x"}, headers=headers).status_code == 404
    # 只传保护字段（无任何可更新字段）→ 400
    assert client.patch("/homework/api/resources/1",
                        json={"rel_path": "/x", "locked": 0},
                        headers=headers).status_code == 400
    # 未登录 401；已登录但缺 CSRF 400
    assert app.test_client().patch(
        "/homework/api/resources/1", json={"title": "x"}
    ).status_code == 401
    assert client.patch("/homework/api/resources/1",
                        json={"title": "x"}).status_code == 400


def test_delete_protection_rules(client, login, app, tmp_path, monkeypatch):
    login()
    token = _csrf(client)
    headers = {"X-CSRF-Token": token}
    locked_id = _seed(app, tmp_path, monkeypatch)
    private_item = _upload(client, token)

    # locked（存量）→ 403，记录仍在
    resp = client.delete(f"/homework/api/resources/{locked_id}", headers=headers)
    assert resp.status_code == 403
    assert "文件不可删除" in resp.get_json()["error"]

    # public（非 locked）→ 403 保留外链
    conn = db_mod.connect_db(app.config["DATABASE"])
    try:
        cur = conn.execute(
            "INSERT INTO resources(title, rel_path, visibility, locked) "
            "VALUES ('公开课', 'files/library/open.pdf', 'public', 0)"
        )
        pub_id = cur.lastrowid
        conn.commit()
    finally:
        conn.close()
    assert client.delete(f"/homework/api/resources/{pub_id}",
                         headers=headers).status_code == 403

    conn = db_mod.connect_db(app.config["DATABASE"])
    try:
        n = conn.execute("SELECT COUNT(*) AS c FROM resources").fetchone()["c"]
    finally:
        conn.close()
    assert n == 3  # locked + public + private 各 1

    # 不存在 → 404
    assert client.delete("/homework/api/resources/999999",
                         headers=headers).status_code == 404

    # locked 记录也仍然在
    conn = db_mod.connect_db(app.config["DATABASE"])
    try:
        assert conn.execute("SELECT 1 FROM resources WHERE id = ?",
                            (locked_id,)).fetchone()
    finally:
        conn.close()


def test_delete_private_removes_file_and_links(client, login, app):
    login()
    token = _csrf(client)
    headers = {"X-CSRF-Token": token}
    item = _upload(client, token, name="可删资料.pdf", blob=PDF + b"delete-me")

    # 建任务并关联
    from datetime import date

    resp = client.post(
        "/homework/api/tasks",
        json={"title": "引用任务", "subject": "英语", "kind": "in_school",
              "due_date": date.today().isoformat(),
              "resource_ids": [item["id"]]},
        headers=headers,
    )
    assert resp.status_code == 201

    root = Path(app.config["UPLOAD_DIR"])
    files_before = list(root.rglob("*.pdf"))
    assert len(files_before) == 1

    resp = client.delete(f"/homework/api/resources/{item['id']}", headers=headers)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["deleted"] is True
    assert body["file_removed"] is True

    # 文件已删、记录已删、任务关联已解除
    assert list(root.rglob("*.pdf")) == []
    conn = db_mod.connect_db(app.config["DATABASE"])
    try:
        assert conn.execute("SELECT 1 FROM resources WHERE id = ?",
                            (item["id"],)).fetchone() is None
        assert conn.execute(
            "SELECT COUNT(*) AS c FROM task_resources WHERE resource_id = ?",
            (item["id"],),
        ).fetchone()["c"] == 0
        assert conn.execute("SELECT COUNT(*) AS c FROM resources").fetchone()["c"] == 0
    finally:
        conn.close()


def test_library_manage_page_controls(client, login, app, tmp_path, monkeypatch):
    login()
    token = _csrf(client)
    rid = _seed(app, tmp_path, monkeypatch)

    body = client.get("/homework/library").get_data(as_text=True)
    assert "上传入库" in body
    assert 'data-id="%d"' % rid in body
    assert 'data-act="edit"' in body
    # 存量 locked 行不出现删除按钮
    row = re.search(r'<tr data-id="%d".*?</tr>' % rid, body, re.S)
    assert row and 'data-act="del"' not in row.group(0)
    # 还没有私有资料 → 整页 0 个删除按钮
    assert body.count('data-act="del"') == 0

    # 上传一条私有资料后，出现 1 个删除按钮
    _upload(client, token, name="新传.pdf", blob=PDF + b"ui")
    body = client.get("/homework/library").get_data(as_text=True)
    assert body.count('data-act="del"') == 1
    assert 'data-locked="1"' in body
    assert 'data-visibility="private"' in body
