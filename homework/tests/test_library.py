"""P1.5：存量 homework.json 导入、资料库页与旧静态路径。"""
from __future__ import annotations

import json
from pathlib import Path

from app import manage
from app import db as db_mod

REPO_ROOT = Path(manage.__file__).resolve().parent.parent

FIXTURE = {
    "collections": [
        {
            "id": "c-2026-summer-g1",
            "title": "2026 一年级暑假作业",
            "year": 2026,
            "grade": "一年级",
            "semester": "暑假",
            "summary": "暑假作业集",
            "cover": "无",
            "items": [
                {
                    "id": "i-grammar",
                    "title": "英语语法练习",
                    "subject": "英语",
                    "type": "pdf",
                    "category": "语法练习",
                    "group": "语法练习",
                    "note": "已发纸质版",
                    "path": "files/library/2026/grammar.pdf",
                    "size": 123,
                },
                {
                    "id": "i-math",
                    "title": "口算题卡",
                    "subject": "数学",
                    "type": "pdf",
                    "category": "口算",
                    "group": "口算",
                    "note": "",
                    "path": "files/library/2026/math.pdf",
                    "size": 456,
                },
            ],
        }
    ]
}


def _import(tmp_path, monkeypatch, json_path, *extra) -> int:
    monkeypatch.setattr(manage.Config, "DATABASE", str(tmp_path / "imp.db"))
    return manage.main(["import-json", "--path", str(json_path), *extra])


def _counts(db_path):
    conn = db_mod.connect_db(db_path)
    try:
        cols = conn.execute("SELECT COUNT(*) AS c FROM collections").fetchone()["c"]
        res = conn.execute("SELECT COUNT(*) AS c FROM resources").fetchone()["c"]
        return cols, res
    finally:
        conn.close()


def test_import_fixture_is_idempotent(tmp_path, monkeypatch):
    src = tmp_path / "homework.json"
    src.write_text(json.dumps(FIXTURE, ensure_ascii=False), encoding="utf-8")
    db_path = str(tmp_path / "imp.db")

    assert _import(tmp_path, monkeypatch, src) == 0
    assert _counts(db_path) == (1, 2)

    conn = db_mod.connect_db(db_path)
    try:
        row = conn.execute(
            "SELECT * FROM resources WHERE legacy_id = 'i-grammar'"
        ).fetchone()
        assert row["locked"] == 1
        assert row["visibility"] == "public"
        assert row["kind"] == "library"
        assert row["mime"] == "application/pdf"
        assert row["rel_path"] == "files/library/2026/grammar.pdf"
        assert conn.execute(
            "SELECT value FROM meta WHERE key = 'import:homework_json'"
        ).fetchone()
        col = conn.execute("SELECT * FROM collections").fetchone()
        assert col["legacy_id"] == "c-2026-summer-g1"
        assert col["year"] == 2026
    finally:
        conn.close()

    # 重复导入（默认跳过、--force 幂等跳过已存在条目）
    assert _import(tmp_path, monkeypatch, src) == 0
    assert _import(tmp_path, monkeypatch, src, "--force") == 0
    assert _counts(db_path) == (1, 2)


def test_import_real_homework_json(tmp_path, monkeypatch):
    src = REPO_ROOT / "data" / "homework.json"
    payload = json.loads(src.read_text(encoding="utf-8"))
    expected = sum(len(c.get("items", [])) for c in payload["collections"])

    assert _import(tmp_path, monkeypatch, src) == 0
    db_path = str(tmp_path / "imp.db")
    cols, res = _counts(db_path)
    assert cols == len(payload["collections"])
    assert res == expected
    assert expected == 140  # 方案文档口径

    conn = db_mod.connect_db(db_path)
    try:
        bad = conn.execute(
            "SELECT COUNT(*) AS c FROM resources "
            "WHERE locked != 1 OR visibility != 'public'"
        ).fetchone()["c"]
        assert bad == 0
    finally:
        conn.close()


def test_library_page_requires_login(client):
    assert client.get("/homework/library").status_code == 302


def test_library_page_shows_results(app, client, login, tmp_path, monkeypatch):
    src = tmp_path / "homework.json"
    src.write_text(json.dumps(FIXTURE, ensure_ascii=False), encoding="utf-8")
    monkeypatch.setattr(manage.Config, "DATABASE", app.config["DATABASE"])
    assert manage.main(["import-json", "--path", str(src)]) == 0

    login()
    resp = client.get("/homework/library")
    assert resp.status_code == 200
    body = resp.get_data(as_text=True)
    assert "英语语法练习" in body
    assert "口算题卡" in body

    resp2 = client.get("/homework/library?q=口算")
    body2 = resp2.get_data(as_text=True)
    assert "口算题卡" in body2
    assert "英语语法练习" not in body2

    resp3 = client.get("/homework/library?subject=英语")
    assert "英语语法练习" in resp3.get_data(as_text=True)


def test_resources_api(client, login, app, tmp_path, monkeypatch):
    src = tmp_path / "homework.json"
    src.write_text(json.dumps(FIXTURE, ensure_ascii=False), encoding="utf-8")
    monkeypatch.setattr(manage.Config, "DATABASE", app.config["DATABASE"])
    assert manage.main(["import-json", "--path", str(src)]) == 0

    # 未登录 401
    assert client.get("/homework/api/resources").status_code == 401

    login()
    resp = client.get("/homework/api/resources?q=语法")
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["total"] == 1
    item = payload["items"][0]
    assert item["title"] == "英语语法练习"
    assert item["locked"] is True
    assert item["url"] == "/homework/files/library/2026/grammar.pdf"
    assert set(payload["facets"]["subjects"]) == {"英语", "数学"}

    all_resp = client.get("/homework/api/resources")
    assert all_resp.get_json()["total"] == 2


def test_legacy_static_paths_still_served(client):
    assert client.get("/homework/index.html").status_code == 200
    assert client.get("/homework/data/homework.json").status_code == 200

    assets = sorted(p for p in (REPO_ROOT / "assets").rglob("*") if p.is_file())
    assert assets, "旧静态 assets/ 不应为空"
    rel = assets[0].relative_to(REPO_ROOT).as_posix()
    assert client.get(f"/homework/{rel}").status_code == 200


def test_legacy_static_whitelist_blocks_repo_code(client):
    # 白名单外：仓库代码、原型、files/ 一律 404（files 由 nginx 直出）
    for path in (
        "/homework/app/config.py",
        "/homework/proto/index.html",
        "/homework/files/library/x.pdf",
        "/homework/run.py",
    ):
        assert client.get(path).status_code == 404, path
    # 目录穿越
    assert client.get("/homework/../pyproject.toml").status_code == 404
