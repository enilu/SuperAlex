"""P0 冒烟：页面、健康检查、迁移与静态资源。"""
from __future__ import annotations

from app import db as db_mod


def test_health_returns_ok(client):
    resp = client.get("/homework/api/health")
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["status"] == "ok"
    assert payload["app"] == "homework-workbench"
    assert payload["db"] == "ok"


def test_home_page_renders(client):
    resp = client.get("/homework/")
    assert resp.status_code == 200
    html = resp.get_data(as_text=True)
    assert "学习总览" in html
    assert "P0 骨架已就绪" in html


def test_home_redirects_to_health(client):
    resp = client.get("/homework/healthz", follow_redirects=True)
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "ok"


def test_static_css_served_under_prefix(client):
    resp = client.get("/homework/static/css/app.css")
    assert resp.status_code == 200
    assert "--accent" in resp.get_data(as_text=True)


def test_unknown_route_returns_404(client):
    assert client.get("/homework/nope").status_code == 404


def test_migrations_create_schema(tmp_path):
    db_path = tmp_path / "schema.db"
    conn = db_mod.connect_db(str(db_path))
    try:
        applied = db_mod.run_migrations(conn)
        assert applied == ["001_init.sql"]
        tables = {
            row["name"]
            for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
        }
        assert {"users", "tasks", "collections", "resources",
                "task_resources", "checkins", "meta"} <= tables
        assert db_mod.schema_version(conn) == "001_init.sql"
        # 幂等：重复执行不再应用
        assert db_mod.run_migrations(conn) == []
    finally:
        conn.close()


def test_task_resource_relation_enforced(tmp_path):
    db_path = tmp_path / "rel.db"
    conn = db_mod.connect_db(str(db_path))
    try:
        db_mod.run_migrations(conn)
        conn.execute(
            "INSERT INTO tasks(title, subject, kind, due_date) VALUES (?,?,?,?)",
            ("预习第2课", "语文", "in_school", "2026-09-27"),
        )
        conn.execute(
            "INSERT INTO resources(title, rel_path, visibility) VALUES (?,?,?)",
            ("单词表.pdf", "files/library/x.pdf", "public"),
        )
        conn.execute(
            "INSERT INTO task_resources(task_id, resource_id) VALUES (1, 1)"
        )
        conn.commit()
        row = conn.execute(
            "SELECT t.title, r.title AS res FROM task_resources tr "
            "JOIN tasks t ON t.id=tr.task_id JOIN resources r ON r.id=tr.resource_id"
        ).fetchone()
        assert row["title"] == "预习第2课"
        assert row["res"] == "单词表.pdf"
        # 删除任务后关联级联清理
        conn.execute("DELETE FROM tasks WHERE id=1")
        conn.commit()
        assert conn.execute("SELECT COUNT(*) c FROM task_resources").fetchone()["c"] == 0
    finally:
        conn.close()
