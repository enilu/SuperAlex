"""运维 CLI：python -m app.manage <command>

命令：
  migrate       执行未应用的 migrations/*.sql（= flask init-db）
  status        显示数据库路径、schema 版本与待应用迁移
  backup        一致性备份到指定目录（VACUUM INTO）
  create-user   创建家庭账号（口令可省略则交互输入）
  set-password  重置口令
  list-users    列出账号
"""
from __future__ import annotations

import argparse
import getpass
import sys

from .config import Config
from . import db as db_mod
from . import users as users_mod


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


# ---------- 账号 ----------

def _resolve_password(args: argparse.Namespace) -> str:
    if getattr(args, "password", None):
        return args.password
    pw = getpass.getpass("口令: ")
    if not pw:
        print("口令不能为空", file=sys.stderr)
        raise SystemExit(2)
    pw2 = getpass.getpass("再次输入: ")
    if pw != pw2:
        print("两次输入不一致", file=sys.stderr)
        raise SystemExit(2)
    return pw


def cmd_create_user(args: argparse.Namespace) -> int:
    conn = db_mod.connect_db(Config.DATABASE)
    try:
        db_mod.run_migrations(conn)  # 确保 users 表存在
        if users_mod.get_user(conn, args.username.strip()):
            print(f"创建失败: 用户名已存在: {args.username}", file=sys.stderr)
            return 1
        password = _resolve_password(args)
        uid = users_mod.create_user(conn, args.username, password, args.display or "")
    except ValueError as exc:
        print(f"创建失败: {exc}", file=sys.stderr)
        return 1
    finally:
        conn.close()
    print(f"已创建用户 #{uid}: {args.username}")
    return 0


def cmd_set_password(args: argparse.Namespace) -> int:
    conn = db_mod.connect_db(Config.DATABASE)
    try:
        if not users_mod.get_user(conn, args.username):
            print(f"用户不存在: {args.username}", file=sys.stderr)
            return 1
        password = _resolve_password(args)
        users_mod.set_password(conn, args.username, password)
    except ValueError as exc:
        print(f"修改失败: {exc}", file=sys.stderr)
        return 1
    finally:
        conn.close()
    print(f"已重置口令: {args.username}")
    return 0


def cmd_list_users(_args: argparse.Namespace) -> int:
    conn = db_mod.connect_db(Config.DATABASE)
    try:
        rows = users_mod.list_users(conn)
    finally:
        conn.close()
    if not rows:
        print("尚无用户，先执行 create-user")
        return 0
    for row in rows:
        print(f"#{row['id']}  {row['username']}  ({row['display_name']})  {row['created_at']}")
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

    p_user = sub.add_parser("create-user", help="创建家庭账号")
    p_user.add_argument("--username", required=True)
    p_user.add_argument("--password", help="省略则交互输入")
    p_user.add_argument("--display", help="显示名，如：家长 / 孩子")
    p_user.set_defaults(func=cmd_create_user)

    p_pw = sub.add_parser("set-password", help="重置口令")
    p_pw.add_argument("--username", required=True)
    p_pw.add_argument("--password", help="省略则交互输入")
    p_pw.set_defaults(func=cmd_set_password)

    sub.add_parser("list-users", help="列出账号").set_defaults(func=cmd_list_users)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
