"""运维 CLI：python -m app.manage <command>

命令：
  migrate   执行未应用的 migrations/*.sql（= flask init-db）
  status    显示数据库路径、schema 版本与待应用迁移
  backup    一致性备份到指定目录（VACUUM INTO）
"""
from __future__ import annotations

import argparse
import sys

from .config import Config
from . import db as db_mod


def cmd_migrate(_args: argparse.Namespace) -> int:
    conn = db_mod.connect_db(Config.DATABASE)
    try:
        applied = db_mod.run_migrations(conn)
    finally:
        conn.close()
    if applied:
        print("已应用迁移:")
        for name in applied:
            print(f"  {name}")
    else:
        print("数据库已是最新，无待应用迁移")
    print(f"数据库: {Config.DATABASE}")
    return 0


def cmd_status(_args: argparse.Namespace) -> int:
    import os

    exists = os.path.exists(Config.DATABASE)
    print(f"数据库: {Config.DATABASE} ({'存在' if exists else '不存在，执行 migrate 创建'})")
    print(f"上传目录: {Config.UPLOAD_DIR}")
    if not exists:
        print(f"待应用迁移: {len(db_mod.migration_files())} 个（全部）")
        return 0
    conn = db_mod.connect_db(Config.DATABASE)
    try:
        print(f"schema 版本: {db_mod.schema_version(conn) or '未初始化'}")
        pending = db_mod.pending_migrations(conn)
        print(f"待应用迁移: {len(pending)} 个" + ("" if not pending else ""))
        for p in pending:
            print(f"  {p.name}")
    finally:
        conn.close()
    return 0


def cmd_backup(args: argparse.Namespace) -> int:
    import os

    if not os.path.exists(Config.DATABASE):
        print("数据库不存在，无需备份", file=sys.stderr)
        return 1
    dest = db_mod.backup_db(Config.DATABASE, args.dir)
    print(f"备份完成: {dest}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m app.manage",
        description="学习工作台数据库运维命令",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("migrate", help="执行未应用的迁移").set_defaults(func=cmd_migrate)
    sub.add_parser("status", help="显示数据库与迁移状态").set_defaults(func=cmd_status)

    p_backup = sub.add_parser("backup", help="一致性备份数据库")
    p_backup.add_argument("--dir", default="var/backups", help="备份输出目录")
    p_backup.set_defaults(func=cmd_backup)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
