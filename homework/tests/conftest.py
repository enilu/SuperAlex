from __future__ import annotations

import re

import pytest

from app import create_app
from app import db as db_mod
from app import users as users_mod

CSRF_RE = re.compile(r'name="csrf_token" value="([^"]+)"')


@pytest.fixture()
def app(tmp_path):
    application = create_app(
        {
            "TESTING": True,
            "ENV_NAME": "testing",
            "SECRET_KEY": "test-secret",
            "DATABASE": str(tmp_path / "test.db"),
            "UPLOAD_DIR": str(tmp_path / "uploads"),
            "LOGIN_RATE_LIMIT": 5,
            "LOGIN_RATE_WINDOW": 60,
        }
    )
    conn = db_mod.connect_db(application.config["DATABASE"])
    try:
        db_mod.run_migrations(conn)
    finally:
        conn.close()
    return application


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def make_user(app):
    def _create(username: str = "family", password: str = "pass-12345",
                display: str = "家长") -> int:
        conn = db_mod.connect_db(app.config["DATABASE"])
        try:
            return users_mod.create_user(conn, username, password, display)
        finally:
            conn.close()

    return _create


@pytest.fixture()
def login(client, make_user):
    """已登录的 client；每调用一次建一个新账号再登录。"""
    counter = {"n": 0}

    def _login(username: str | None = None, password: str = "pass-12345"):
        counter["n"] += 1
        username = username or f"user{counter['n']}"
        make_user(username, password, "测试家长")
        html = client.get("/homework/login").get_data(as_text=True)
        token = CSRF_RE.search(html).group(1)
        return client.post(
            "/homework/login",
            data={"username": username, "password": password, "csrf_token": token},
        )

    return _login
