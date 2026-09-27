"""运维 CLI：python -m app.manage <command>

命令：
  migrate       执行未应用的 migrations/*.sql（= flask init-db）
  status        显示数据库路径、schema 版本与待应用迁移
  backup        一致性备份到指定目录（VACUUM INTO）
  create-user   创建家庭账号（口令可省略则交互输入）
  set-password  重置口令
  list-users    列出账号
  import-json   导入 data/homework.json 存量资料（幂等）
"""
from __future__ import annotations

import argparse
import getpass
import json
import mimetypes
import sys
from datetime import datetime, timezone
from pathlib import Path

from .config import Config
from . import db as db_mod
from . import users as users_mod

REPO_ROOT = Path(__file__).resolve().parent.parent


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


# ---------- 存量数据导入 ----------

def cmd_import_json(args: argparse.Namespace) -> int:
    """homework.json → collections/resources（存量 140 条 locked=1、public）。

    幂等：按 legacy_id 跳过已导入条目，meta.import:homework_json 记录导入标记。
    """
    src = Path(args.path) if args.path else REPO_ROOT / "data" / "homework.json"
    if not src.exists():
        print(f"JSON 不存在: {src}", file=sys.stderr)
        return 1

    payload = json.loads(src.read_text(encoding="utf-8"))
    collections = payload.get("collections", [])

    conn = db_mod.connect_db(Config.DATABASE)
    try:
        db_mod.run_migrations(conn)
        marker = conn.execute(
            "SELECT value FROM meta WHERE key = 'import:homework_json'"
        ).fetchone()
        if marker and not args.force:
            print(f"已导入过（{marker['value']}），强制重跑请加 --force")
            return 0

        col_new = 0
        res_new = 0
        res_dup = 0
        items_total = 0
        missing = 0
        seen: set[str] = set()

        for col in collections:
            legacy = col["id"]
            row = conn.execute(
                "SELECT id FROM collections WHERE legacy_id = ?", (legacy,)
            ).fetchone()
            if row:
                col_id = row["id"]
            else:
                cur = conn.execute(
                    "INSERT INTO collections"
                    "(legacy_id, name, year, grade, semester, summary, cover) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (
                        legacy,
                        col.get("title", ""),
                        col.get("year"),
                        col.get("grade", ""),
                        col.get("semester", ""),
                        col.get("summary", ""),
                        col.get("cover", ""),
                    ),
                )
                col_id = int(cur.lastrowid)
                col_new += 1

            for item in col.get("items", []):
                items_total += 1
                item_legacy = str(item.get("id", ""))
                if item_legacy in seen or not item_legacy:
                    item_legacy = f"{legacy}#{item_legacy}"
                seen.add(item_legacy)

                if conn.execute(
                    "SELECT 1 FROM resources WHERE legacy_id = ?",
                    (item_legacy,),
                ).fetchone():
                    res_dup += 1
                    continue

                rel_path = item.get("path", "")
                mime = mimetypes.guess_type(rel_path)[0] or ""
                conn.execute(
                    "INSERT INTO resources"
                    "(legacy_id, collection_id, kind, title, subject, category, "
                    " tags, note, rel_path, size, mime, visibility, locked) "
                    "VALUES (?, ?, 'library', ?, ?, ?, '', ?, ?, ?, ?, 'public', 1)",
                    (
                        item_legacy,
                        col_id,
                        item.get("title", ""),
                        item.get("subject", ""),
                        item.get("category") or item.get("group", ""),
                        item.get("note", ""),
                        rel_path,
                        int(item.get("size") or 0),
                        mime,
                    ),
                )
                res_new += 1
                if args.verify and rel_path and not (REPO_ROOT / rel_path).is_file():
                    missing += 1

        conn.execute(
            "INSERT OR REPLACE INTO meta(key, value) VALUES (?, ?)",
            (
                "import:homework_json",
                datetime.now(timezone.utc).isoformat(timespec="seconds"),
            ),
        )
        conn.commit()
    finally:
        conn.close()

    print(
        f"集合: 新增 {col_new}/{len(collections)}；"
        f"资料: 新增 {res_new}、已存在跳过 {res_dup}（源文件共 {items_total} 条）"
    )
    if args.verify:
        print(f"文件校验: 缺失 {missing} 个（站点内 files/ 是否已同步）")
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

    p_imp = sub.add_parser("import-json", help="导入 homework.json 存量资料")
    p_imp.add_argument("--path", help="JSON 路径，默认 data/homework.json")
    p_imp.add_argument("--force", action="store_true", help="忽略导入标记强制重跑")
    p_imp.add_argument("--verify", action="store_true", help="校验 rel_path 文件是否存在")
    p_imp.set_defaults(func=cmd_import_json)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
