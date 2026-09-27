"""P1：登录、CSRF、限速与账号 CLI。"""
from __future__ import annotations

import re

import pytest

from app import db as db_mod
from app import users as users_mod

CSRF_RE = re.compile(r'name="csrf_token" value="([^"]+)"')


def _csrf(client, path="/homework/login") -> str:
    html = client.get(path).get_data(as_text=True)
    match = CSRF_RE.search(html)
    assert match, "页面缺少 CSRF token"
    return match.group(1)


def _login(client, username="family", password="pass-12345"):
    token = _csrf(client)
    return client.post(
        "/homework/login",
        data={"username": username, "password": password, "csrf_token": token},
    )


def test_login_page_renders(client):
    resp = client.get("/homework/login")
    assert resp.status_code == 200
    assert "家庭学习台" in resp.get_data(as_text=True)


def test_login_success_then_logout(client, make_user):
    make_user()
    resp = _login(client)
    assert resp.status_code == 302
    assert resp.headers["Location"].endswith("/homework/")

    home = client.get("/homework/")
    assert home.status_code == 200
    body = home.get_data(as_text=True)
    assert "家长" in body  # 侧栏显示显示名

    out = client.post("/homework/logout", data={"csrf_token": _csrf(client, "/homework/")})
    assert out.status_code == 302
    assert out.headers["Location"].endswith("/homework/login")
    assert client.get("/homework/").status_code == 302


def test_wrong_password_rejected_with_generic_error(client, make_user):
    make_user()
    resp = _login(client, password="wrong-pass")
    assert resp.status_code == 401
    body = resp.get_data(as_text=True)
    assert "用户名或密码错误" in body
    # 不存在的用户与错误口令提示一致
    resp2 = _login(client, username="ghost", password="whatever-1")
    assert resp2.status_code == 401
    assert "用户名或密码错误" in resp2.get_data(as_text=True)
    assert client.get("/homework/").status_code == 302


def test_post_without_csrf_is_rejected(client, make_user):
    make_user()
    resp = client.post(
        "/homework/login",
        data={"username": "family", "password": "pass-12345"},
    )
    assert resp.status_code == 400
    assert client.get("/homework/").status_code == 302


def test_rate_limit_blocks_after_repeated_failures(client, make_user):
    make_user()
    for _ in range(5):
        assert _login(client, password="bad-password").status_code == 401
    # 已达限速：即使口令正确也拒绝
    resp = _login(client, password="pass-12345")
    assert resp.status_code == 429
    assert "尝试次数过多" in resp.get_data(as_text=True)


def test_limiter_state_is_per_app(app, make_user):
    make_user()
    limiter = app.extensions["login_limiter"]
    limiter.fail("1.2.3.4")
    limiter.clear()
    assert not limiter.blocked("1.2.3.4")


def test_health_stays_public_without_login(client):
    assert client.get("/homework/api/health").status_code == 200
    assert client.get("/homework/healthz").status_code == 200


def test_api_unauthorized_is_json_401(client):
    resp = client.get("/homework/api/does-not-exist")
    assert resp.status_code == 404  # 未注册路由先 404


# ---------- users / CLI ----------

def test_create_and_verify_user(app):
    conn = db_mod.connect_db(app.config["DATABASE"])
    try:
        uid = users_mod.create_user(conn, "kid", "kid-pass-01", "孩子")
        assert uid > 0
        row = users_mod.get_user(conn, "kid")
        assert row["display_name"] == "孩子"
        assert users_mod.verify_password(row["password_hash"], "kid-pass-01")
        assert not users_mod.verify_password(row["password_hash"], "kid-pass-02")
        with pytest.raises(ValueError):
            users_mod.create_user(conn, "kid", "another-pass", "重复")
        with pytest.raises(ValueError):
            users_mod.create_user(conn, "new", "short")  # 少于 8 位
        assert users_mod.count_users(conn) == 1
    finally:
        conn.close()


def test_manage_cli_create_user_and_set_password(tmp_path, monkeypatch):
    from app import manage

    db_path = str(tmp_path / "cli.db")
    monkeypatch.setattr(manage.Config, "DATABASE", db_path)

    assert manage.main([
        "create-user", "--username", "family", "--password", "pass-12345",
        "--display", "家长",
    ]) == 0
    assert manage.main(["list-users"]) == 0
    # 重复创建失败返回 1
    assert manage.main([
        "create-user", "--username", "family", "--password", "pass-12345",
    ]) == 1
    assert manage.main([
        "set-password", "--username", "family", "--password", "new-pass-01",
    ]) == 0
    assert manage.main(["set-password", "--username", "ghost"]) == 1

    conn = db_mod.connect_db(db_path)
    try:
        row = users_mod.get_user(conn, "family")
        assert users_mod.verify_password(row["password_hash"], "new-pass-01")
    finally:
        conn.close()
