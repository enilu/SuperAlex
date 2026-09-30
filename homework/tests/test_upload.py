"""P3：上传入库、sha256 去重、private 鉴权下载、任务⇄资料关联。"""
from __future__ import annotations

import io
import re
from datetime import date, timedelta
from pathlib import Path

from app import db as db_mod

CSRF_META_RE = re.compile(r'name="csrf-token" content="([^"]+)"')
PDF = b"%PDF-1.4 \nfake pdf content for tests\n%%EOF"


def _csrf(client) -> str:
    html = client.get("/homework/").get_data(as_text=True)
    match = CSRF_META_RE.search(html)
    assert match, "页面缺少 csrf meta"
    return match.group(1)


def _upload(client, token, files, kind="homework", year=None):
    data = {"files": files, "kind": kind}
    if year is not None:
        data["year"] = year
    return client.post(
        "/homework/api/upload",
        data=data,
        headers={"X-CSRF-Token": token},
        content_type="multipart/form-data",
    )


def _make_task(client, token, title="带资料的任务", due=None):
    resp = client.post(
        "/homework/api/tasks",
        json={"title": title, "subject": "英语", "kind": "in_school",
              "due_date": due or date.today().isoformat()},
        headers={"X-CSRF-Token": token},
    )
    assert resp.status_code == 201, resp.get_json()
    return resp.get_json()


def test_upload_page_requires_login(client):
    assert client.get("/homework/upload").status_code == 302


def test_upload_page_renders(client, login):
    login()
    body = client.get("/homework/upload").get_data(as_text=True)
    assert 'id="drop"' in body
    assert "生成任务" in body
    assert "关联资料" in body
    assert 'id="fYear"' in body  # 学年下拉（默认当前学年）
    from app.library import current_school_year
    assert current_school_year() in body


def test_upload_private_dedupe_and_storage(client, login, app):
    login()
    token = _csrf(client)

    resp = _upload(client, token, [(io.BytesIO(PDF), "英语试卷.pdf")])
    assert resp.status_code == 200, resp.get_json()
    body = resp.get_json()
    assert body["ok"] is True
    assert len(body["uploaded"]) == 1
    item = body["uploaded"][0]
    assert item["visibility"] == "private"
    assert item["locked"] is False
    assert item["kind"] == "homework"
    assert item["url"] == f"/homework/api/files/{item['id']}"
    assert item["size"] == len(PDF)

    # 落盘位置：UPLOAD_DIR/<year>/<随机名>
    root = Path(app.config["UPLOAD_DIR"])
    stored = list(root.rglob("*.pdf"))
    assert len(stored) == 1
    assert stored[0].read_bytes() == PDF

    # 同内容再传（不同文件名）→ sha256 去重，不新增记录
    resp2 = _upload(client, token, [(io.BytesIO(PDF), "副本.pdf")])
    body2 = resp2.get_json()
    assert body2["deduped"] and body2["deduped"][0]["id"] == item["id"]
    assert not body2["uploaded"]

    conn = db_mod.connect_db(app.config["DATABASE"])
    try:
        n = conn.execute("SELECT COUNT(*) AS c FROM resources").fetchone()["c"]
        assert n == 1
        assert list(root.rglob("*.pdf")) and len(list(root.rglob("*.pdf"))) == 1
    finally:
        conn.close()


def test_upload_rejects_bad_ext_and_oversize(client, login):
    login()
    token = _csrf(client)

    resp = _upload(client, token, [(io.BytesIO(b"MZ.."), "evil.exe")])
    assert resp.status_code == 400
    assert "不支持的扩展名" in resp.get_json()["errors"][0]["error"]

    big = b"x" * (1024 * 1024 + 10)
    resp = _upload(client, token, [(io.BytesIO(big), "big.pdf")])
    assert resp.status_code == 413  # MAX_CONTENT_LENGTH


def test_upload_requires_auth_and_csrf(client, login):
    assert _upload(client, "nope", [(io.BytesIO(PDF), "a.pdf")]).status_code == 401
    login()
    token = _csrf(client)
    resp = client.post(
        "/homework/api/upload",
        data={"files": [(io.BytesIO(PDF), "a.pdf")]},
        content_type="multipart/form-data",
    )
    assert resp.status_code == 400  # 缺 CSRF


def test_private_file_download_flow(client, login, app):
    login()
    token = _csrf(client)
    item = _upload(client, token, [(io.BytesIO(PDF), "下载测试.pdf")]).get_json()["uploaded"][0]
    url = f"/homework/api/files/{item['id']}"

    assert app.test_client().get(url).status_code == 401  # 未登录（新会话）

    resp = client.get(url)
    assert resp.status_code == 200
    assert resp.data == PDF
    assert "attachment" not in (resp.headers.get("Content-Disposition") or "")

    resp = client.get(url + "?dl=1")
    assert resp.status_code == 200
    assert "attachment" in (resp.headers.get("Content-Disposition") or "")

    assert client.get("/homework/api/files/999999").status_code == 404


def test_public_resource_redirects_to_static(client, login, app):
    login()
    conn = db_mod.connect_db(app.config["DATABASE"])
    try:
        cur = conn.execute(
            "INSERT INTO resources(title, rel_path, visibility, locked) "
            "VALUES ('公开课', 'files/library/demo.pdf', 'public', 1)"
        )
        rid = cur.lastrowid
        conn.commit()
    finally:
        conn.close()

    resp = client.get(f"/homework/api/files/{rid}")
    assert resp.status_code == 302
    assert resp.headers["Location"].endswith("/homework/files/library/demo.pdf")


def test_private_path_traversal_blocked(client, login, app):
    login()
    conn = db_mod.connect_db(app.config["DATABASE"])
    try:
        cur = conn.execute(
            "INSERT INTO resources(title, rel_path, visibility) "
            "VALUES ('越权', ?, 'private')",
            (str(Path(app.config['UPLOAD_DIR']).parent / 'outside.txt'),),
        )
        rid = cur.lastrowid
        conn.commit()
    finally:
        conn.close()
    # 上传目录之外的绝对路径 → 404（不泄露）
    assert client.get(f"/homework/api/files/{rid}").status_code == 404

    conn = db_mod.connect_db(app.config["DATABASE"])
    try:
        conn.execute(
            "UPDATE resources SET rel_path = ? WHERE id = ?",
            ("../../etc/passwd", rid),
        )
        conn.commit()
    finally:
        conn.close()
    assert client.get(f"/homework/api/files/{rid}").status_code == 404


def test_task_with_resource_ids_and_overview_preview(client, login):
    login()
    token = _csrf(client)
    item = _upload(client, token, [(io.BytesIO(PDF), "预览.pdf")]).get_json()["uploaded"][0]

    resp = client.post(
        "/homework/api/tasks",
        json={"title": "上传即关联", "subject": "英语", "kind": "in_school",
              "due_date": date.today().isoformat(),
              "resource_ids": [item["id"]]},
        headers={"X-CSRF-Token": token},
    )
    assert resp.status_code == 201
    task = resp.get_json()
    assert task["resource_count"] == 1
    assert task["resources"][0]["url"] == f"/homework/api/files/{item['id']}"

    # 总览清单能看到 📎 角标数据
    ov = client.get("/homework/api/overview").get_json()
    assert any(t["resource_count"] == 1
               for g in ov["groups"] for t in g["items"])

    # 无效 id → 400
    resp = client.post(
        "/homework/api/tasks",
        json={"title": "x", "subject": "英语", "kind": "in_school",
              "due_date": date.today().isoformat(), "resource_ids": [424242]},
        headers={"X-CSRF-Token": token},
    )
    assert resp.status_code == 400


def test_link_endpoint_modes(client, login):
    login()
    token = _csrf(client)
    headers = {"X-CSRF-Token": token}
    r1 = _upload(client, token, [(io.BytesIO(PDF + b"1"), "a.pdf")]).get_json()["uploaded"][0]
    r2 = _upload(client, token, [(io.BytesIO(PDF + b"2"), "b.pdf")]).get_json()["uploaded"][0]
    task = _make_task(client, token)

    def link(payload):
        return client.post(f"/homework/api/tasks/{task['id']}/resources",
                           json=payload, headers=headers)

    assert link({"mode": "add", "resource_ids": [r1["id"]]}).status_code == 200
    assert link({"mode": "add", "resource_ids": [r1["id"]]}).get_json()["resource_count"] == 1  # 幂等
    body = link({"mode": "set", "resource_ids": [r1["id"], r2["id"]]}).get_json()
    assert body["resource_count"] == 2
    body = link({"mode": "remove", "resource_ids": [r1["id"]]}).get_json()
    assert body["resource_count"] == 1
    assert body["resources"][0]["id"] == r2["id"]

    assert link({"mode": "nope", "resource_ids": [1]}).status_code == 400
    assert link({"mode": "set", "resource_ids": "1"}).status_code == 400
    assert link({"mode": "set", "resource_ids": [999999]}).status_code == 400
    assert client.post("/homework/api/tasks/999999/resources",
                       json={"mode": "set", "resource_ids": []},
                       headers=headers).status_code == 404


def test_recent_uploads_sort(client, login):
    login()
    token = _csrf(client)
    first = _upload(client, token, [(io.BytesIO(PDF + b"a"), "1.pdf")]).get_json()["uploaded"][0]
    second = _upload(client, token, [(io.BytesIO(PDF + b"b"), "2.pdf")]).get_json()["uploaded"][0]

    resp = client.get("/homework/api/resources?kind=homework&sort=recent")
    items = resp.get_json()["items"]
    assert [i["id"] for i in items[:2]] == [second["id"], first["id"]]


def test_upload_library_kind(client, login):
    login()
    token = _csrf(client)
    item = _upload(client, token, [(io.BytesIO(PDF + b"lib"), "资料.pdf")],
                   kind="library").get_json()["uploaded"][0]
    assert item["kind"] == "library"

    resp = _upload(client, token, [(io.BytesIO(b"x"), "bad.kind")], kind="nope")
    assert resp.status_code == 400


def test_upload_year_default_and_validation(client, login, app):
    login()
    token = _csrf(client)
    from app.library import current_school_year

    # 不传学年 → 默认当前学年
    item = _upload(client, token,
                   [(io.BytesIO(PDF + b"def"), "默认学年.pdf")]).get_json()["uploaded"][0]
    assert item["year"] == current_school_year()

    # 显式指定合法学年
    item2 = _upload(client, token, [(io.BytesIO(PDF + b"fix"), "指定学年.pdf")],
                    year="2025-2026").get_json()["uploaded"][0]
    assert item2["year"] == "2025-2026"

    # 非相邻 / 格式错误 → 400，且不入库
    resp = _upload(client, token, [(io.BytesIO(PDF + b"bad1"), "bad1.pdf")],
                   year="2026-2028")
    assert resp.status_code == 400
    assert "相邻" in resp.get_json()["error"]
    resp = _upload(client, token, [(io.BytesIO(PDF + b"bad2"), "bad2.pdf")],
                   year="abc")
    assert resp.status_code == 400
    assert "YYYY-YYYY" in resp.get_json()["error"]

    conn = db_mod.connect_db(app.config["DATABASE"])
    try:
        n = conn.execute("SELECT COUNT(*) AS c FROM resources").fetchone()["c"]
    finally:
        conn.close()
    assert n == 2
