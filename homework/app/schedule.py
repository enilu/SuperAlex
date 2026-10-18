"""课程表与共享材料备注；按学期、班级和具体课程格隔离。"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

SCHEDULE_PATH = Path(__file__).resolve().parent.parent / "data" / "schedule.json"
MAX_NOTE_LENGTH = 1000


def load_schedule() -> dict:
    sch = json.loads(SCHEDULE_PATH.read_text(encoding="utf-8"))
    identity = json.dumps([sch["school"], sch["title"], sch["term"]], ensure_ascii=False)
    sch["scope"] = hashlib.sha256(identity.encode("utf-8")).hexdigest()
    return sch


def notes_for(conn, scope: str) -> dict:
    rows = conn.execute(
        "SELECT lesson, day, subject, note FROM schedule_notes WHERE scope = ?", (scope,)
    ).fetchall()
    return {(r["lesson"], r["day"], r["subject"]): r["note"] for r in rows}


def save_note(conn, data: dict) -> str:
    sch = load_schedule()
    if data.get("scope") != sch["scope"]:
        raise ValueError("课程表已更新，请刷新页面后重试")
    day = data.get("day")
    lesson = data.get("lesson")
    subject = data.get("subject")
    note = data.get("note")
    if type(day) is not int or not 1 <= day <= len(sch["days"]):
        raise ValueError("无效的星期")
    row = next((r for r in sch["rows"]
                if r["kind"] == "lesson" and r["label"] == lesson), None)
    if row is None or row["cells"][day - 1] != subject:
        raise ValueError("课程不匹配，请刷新页面后重试")
    if not isinstance(note, str) or len(note) > MAX_NOTE_LENGTH:
        raise ValueError(f"备注必须为文字，最多 {MAX_NOTE_LENGTH} 字")
    note = note.strip()
    params = (sch["scope"], lesson, day, subject)
    with conn:
        if note:
            conn.execute(
                "INSERT INTO schedule_notes(scope, lesson, day, subject, note) "
                "VALUES (?, ?, ?, ?, ?) ON CONFLICT(scope, lesson, day, subject) "
                "DO UPDATE SET note = excluded.note", (*params, note),
            )
        else:
            conn.execute(
                "DELETE FROM schedule_notes WHERE scope=? AND lesson=? AND day=? AND subject=?",
                params,
            )
    return note
