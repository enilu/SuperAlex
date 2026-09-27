"""SQLite 连接与迁移辅助。

设计要点：
- WAL + foreign_keys，单文件存储；
- 迁移按 `migrations/*.sql` 文件名顺序执行，已执行记录写入 meta 表；
- 同一套函数既服务 Flask CLI / teardown，也服务 `python -m app.manage` 独立运行。
"""
from __future__ import annotations

import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, g, current_app

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"


def connect_db(path: str) -> sqlite3.Connection:
    """打开数据库连接（目录不存在时自动创建）。"""
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def get_db() -> sqlite3.Connection:
    """请求内单例连接（Flask g）。"""
    if "db" not in g:
        g.db = connect_db(current_app.config["DATABASE"])
    return g.db


def close_db(_exc: BaseException | None = None) -> None:
    conn = g.pop("db", None)
    if conn is not None:
        conn.close()


def init_app(app: Flask) -> None:
    app.teardown_appcontext(close_db)

    @app.cli.command("init-db")
    def init_db_command() -> None:
        """创建/升级数据库结构到最新迁移。"""
        conn = connect_db(app.config["DATABASE"])
        try:
            applied = run_migrations(conn)
            print("已应用迁移:" if applied else "数据库已是最新，无待应用迁移:")
            for name in applied:
                print(f"  {name}")
        finally:
            conn.close()


# ---------- 迁移 ----------

def migration_files() -> list[Path]:
    if not MIGRATIONS_DIR.exists():
        return []
    return sorted(p for p in MIGRATIONS_DIR.glob("*.sql"))


def _applied_names(conn: sqlite3.Connection) -> set[str]:
    has_meta = conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='meta'"
    ).fetchone()
    if not has_meta:
        return set()
    rows = conn.execute("SELECT key FROM meta WHERE key LIKE 'migration:%'").fetchall()
    return {r["key"].split(":", 1)[1] for r in rows}


def pending_migrations(conn: sqlite3.Connection) -> list[Path]:
    done = _applied_names(conn)
    return [p for p in migration_files() if p.name not in done]


def run_migrations(conn: sqlite3.Connection) -> list[str]:
    """按顺序执行未应用的迁移，返回本次应用的文件名。"""
    applied: list[str] = []
    for path in pending_migrations(conn):
        sql = path.read_text(encoding="utf-8")
        conn.executescript(sql)
        now = datetime.now(timezone.utc).isoformat(timespec="seconds")
        conn.execute(
            "INSERT OR REPLACE INTO meta(key, value) VALUES (?, ?)",
            (f"migration:{path.name}", now),
        )
        conn.commit()
        applied.append(path.name)
    return applied


def schema_version(conn: sqlite3.Connection) -> str | None:
    done = _applied_names(conn)
    return max(done) if done else None


# ---------- 备份 ----------

def backup_db(src: str, dest_dir: str) -> Path:
    """在线一致性备份（sqlite3 .backup 语义用 VACUUM INTO 实现）。"""
    dest_dir_p = Path(dest_dir)
    dest_dir_p.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    dest = dest_dir_p / f"homework-{stamp}.db"
    conn = connect_db(src)
    try:
        conn.execute("VACUUM INTO ?", (str(dest),))
    finally:
        conn.close()
    return dest


def copy_legacy_backup(src: str, dest_dir: str) -> Path:
    """简单文件级备份（WAL 已 checkpoint 场景可用作兜底）。"""
    dest_dir_p = Path(dest_dir)
    dest_dir_p.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    dest = dest_dir_p / f"homework-{stamp}.db"
    shutil.copy2(src, dest)
    return dest
