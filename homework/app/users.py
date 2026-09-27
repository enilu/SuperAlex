"""账号与口令（bcrypt）。"""
from __future__ import annotations

import sqlite3

import bcrypt

MIN_PASSWORD_LEN = 8


def hash_password(password: str) -> str:
    if len(password) < MIN_PASSWORD_LEN:
        raise ValueError(f"口令至少 {MIN_PASSWORD_LEN} 位")
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("ascii")


def verify_password(password_hash: str, password: str) -> bool:
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"), password_hash.encode("ascii")
        )
    except ValueError:  # 哈希格式损坏
        return False


def get_user(conn: sqlite3.Connection, username: str) -> sqlite3.Row | None:
    return conn.execute(
        "SELECT * FROM users WHERE username = ?", (username,)
    ).fetchone()


def count_users(conn: sqlite3.Connection) -> int:
    return conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"]


def create_user(
    conn: sqlite3.Connection,
    username: str,
    password: str,
    display_name: str = "",
) -> int:
    """创建用户；用户名重复抛 ValueError。"""
    username = username.strip()
    if not username:
        raise ValueError("用户名不能为空")
    if get_user(conn, username):
        raise ValueError(f"用户名已存在: {username}")
    cur = conn.execute(
        "INSERT INTO users(username, password_hash, display_name) VALUES (?, ?, ?)",
        (username, hash_password(password), display_name or username),
    )
    conn.commit()
    return int(cur.lastrowid)


def set_password(
    conn: sqlite3.Connection, username: str, password: str
) -> bool:
    user = get_user(conn, username)
    if not user:
        return False
    conn.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (hash_password(password), user["id"]),
    )
    conn.commit()
    return True


def list_users(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute(
        "SELECT id, username, display_name, created_at FROM users ORDER BY id"
    ).fetchall()
