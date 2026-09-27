"""上传入库：扩展名白名单、大小限制、随机存储名、sha256 去重。

private 文件写入 UPLOAD_DIR（生产为站点外 /var/lib/homework-workbench/uploads），
nginx 不可达；下载一律走 GET /api/files/<id> 鉴权接口。
"""
from __future__ import annotations

import hashlib
import mimetypes
import uuid
from datetime import date
from pathlib import Path

from flask import current_app

from .db import get_db
from .library import serialize

ALLOWED_EXT = {
    "jpg", "jpeg", "png", "gif", "webp", "pdf",
    "mp4", "mov", "mp3", "wav", "txt", "md", "zip",
}


def _extension(filename: str) -> str:
    ext = Path(filename or "").suffix.lstrip(".").lower()
    if ext not in ALLOWED_EXT:
        raise ValueError(
            f"不支持的扩展名 {ext or '(无)'}，允许: {', '.join(sorted(ALLOWED_EXT))}"
        )
    return ext


def save_upload(file, user_id: int | None, kind: str = "homework") -> dict:
    """把上传文件落盘并写入 resources；sha256 命中则返回既有记录。"""
    if kind not in ("library", "homework"):
        raise ValueError("kind 必须是 library/homework")
    filename = Path(file.filename or "").name  # 防路径注入
    ext = _extension(filename)

    data = file.read()
    if not data:
        raise ValueError("空文件")
    limit = int(current_app.config["MAX_CONTENT_LENGTH"])
    if len(data) > limit:
        raise ValueError(f"超过大小限制 {limit // 1048576}MB")

    sha = hashlib.sha256(data).hexdigest()
    conn = get_db()
    dup = conn.execute(
        "SELECT * FROM resources WHERE sha256 = ?", (sha,)
    ).fetchone()
    if dup:
        return {**serialize(dup), "deduped": True}

    root = Path(current_app.config["UPLOAD_DIR"])
    sub = str(date.today().year)
    target_dir = root / sub
    target_dir.mkdir(parents=True, exist_ok=True)
    stored = f"{uuid.uuid4().hex}.{ext}"
    target = (target_dir / stored).resolve()
    target.write_bytes(data)

    cur = conn.execute(
        "INSERT INTO resources(collection_id, kind, title, subject, category, "
        " tags, note, rel_path, size, mime, sha256, visibility, locked, created_by) "
        "VALUES (NULL, ?, ?, '', '', '', ?, ?, ?, ?, ?, 'private', 0, ?)",
        (
            kind,
            filename,
            "",  # note
            f"{sub}/{stored}",  # 相对 UPLOAD_DIR，跨机部署可移植
            len(data),
            mimetypes.guess_type(filename)[0] or f"application/{ext}",
            sha,
            user_id,
        ),
    )
    conn.commit()
    row = conn.execute(
        "SELECT * FROM resources WHERE id = ?", (cur.lastrowid,)
    ).fetchone()
    return {**serialize(row), "deduped": False}
