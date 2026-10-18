"""课程表：data/schedule.json 渲染与入口。"""
from __future__ import annotations

import json
import copy
import re
from pathlib import Path

import pytest

from app import schedule as schedule_mod

REPO_ROOT = Path(__file__).resolve().parents[1]


def test_schedule_requires_login(client):
    assert client.get("/homework/schedule").status_code == 302


def test_schedule_page_shows_timetable(client, login):
    login()
    body = client.get("/homework/schedule").get_data(as_text=True)
    assert "二年级4班周课表" in body
    assert "浦东新区民办向未来外国语小学" in body
    for day in ("星期一", "星期二", "星期三", "星期四", "星期五"):
        assert day in body
    # 代表性科目与时段
    for text in (
        "外语", "唱游·音乐", "道德与法治", "校本课程（体育与健康）",
        "微运动5分钟", "升旗仪式 广播操 体育活动",
        "第一时段", "第三时段", "开展各类活动",
        "秋季社会实践考察活动",
    ):
        assert text in body, text
    # 侧栏与顶栏入口已转正（不再带「二期」占位）
    assert 'href="/homework/schedule"' in body
    assert "课程表 <span" not in body
    assert 'toast(\'二期功能\')' not in body
    # 今天列 / 当前时段高亮脚本
    assert "schedule.js" in body
    # 原始图片外链
    assert "%E5%91%A8%E8%AF%BE%E8%A1%A8.png" in body
    # 早读与放学直接显示在主课表中，覆盖五个工作日。
    table = re.search(r'<table class="sched" id="schedTable">.*?</table>', body, re.S).group(0)
    rows = re.findall(r'<tr class="kind-[^"]+".*?</tr>', table, re.S)
    assert '>早读</th>' in rows[0] and '7:40-8:10' in rows[0]
    assert 'colspan="5"' in rows[0] and '周一至周五统一早读' in rows[0]
    dismissal_index = next(i for i, row in enumerate(rows) if '>放学</th>' in row)
    assert 'data-time="16:30"' in rows[dismissal_index]
    assert 'colspan="5"' in rows[dismissal_index] and '周一至周五 16:30 放学' in rows[dismissal_index]
    assert '第一时段' in rows[dismissal_index - 1]
    assert '第二时段' in rows[dismissal_index + 1]
    # 放学行不处于课后服务的跨行单元格内，后两段服务独立合并。
    assert 'rowspan="1"' in rows[dismissal_index - 1]
    assert 'rowspan="1"' in rows[dismissal_index]
    assert 'rowspan="2"' in rows[dismissal_index + 1]


def test_schedule_dismissal(client, login):
    """放学安排整合：批次表 + 本班高亮。"""
    login()
    body = client.get("/homework/schedule").get_data(as_text=True)
    assert "菏泽路校门420放学安排" in body
    assert "周一到周四" in body
    for text in ("第一批", "4:25", "第七批", "4:31", "三1", "二4"):
        assert text in body, text
    # 本班在第五批：该行高亮、班级格高亮
    row = re.search(r'<tr class="is-ours">.*?</tr>', body, re.S)
    assert row, "第五批行应标记 is-ours"
    assert ">二4<" in row.group(0) and 'class="ours"' in row.group(0)
    assert "在第五批（已高亮）" in body


def test_schedule_json_structure():
    data = json.loads((REPO_ROOT / "data" / "schedule.json").read_text(encoding="utf-8"))
    assert len(data["days"]) == 5
    lessons = [r for r in data["rows"] if r["kind"] == "lesson"]
    assert len(lessons) == 6
    assert all(len(r["cells"]) == 5 for r in lessons)
    # 第七节为整行活动（非分科课）
    activity = [r for r in data["rows"] if r["kind"] == "activity"]
    assert len(activity) == 1 and activity[0]["label"] == "第七节"
    # 第六节周二为校本课程（体育与健康）
    six = lessons[5]
    assert six["label"] == "第六节"
    assert six["cells"][1] == "校本课程（体育与健康）"
    # 放学将课后服务分为第一时段与后两段，避免跨行单元格错位。
    service = [r for r in data["rows"] if r["kind"] == "service"]
    assert len(service) == 3 and service[0].get("label_span", 1) == 1
    assert service[1]["label"] == "课后服务" and service[1]["label_span"] == 2
    assert service[2]["label"] == ""
    assert len(data["notes"]) >= 2


def _note_payload(**changes):
    return {"scope": schedule_mod.load_schedule()["scope"], "lesson": "第一节",
            "day": 3, "subject": "造型·美术", "note": "水彩笔\n剪刀、胶棒", **changes}


def _token(client):
    body = client.get("/homework/schedule").get_data(as_text=True)
    return re.search(r'name="csrf-token" content="([^"]+)"', body).group(1)


def _save(client, token, **changes):
    return client.put("/homework/api/schedule/note", json=_note_payload(**changes),
                      headers={"X-CSRF-Token": token})


def _cell(body, lesson, day):
    return re.search(r'<td data-day="' + str(day) + r'" data-lesson="' + lesson +
                     r'".*?</td>', body, re.S).group(0)


def test_material_notes_persist_independently_and_clear(client, login):
    login()
    token = _token(client)
    assert _save(client, token).status_code == 200
    assert _save(client, token, lesson="第四节", day=5, note="橡皮泥").status_code == 200
    body = client.get("/homework/schedule").get_data(as_text=True)
    assert "水彩笔\n剪刀、胶棒" in _cell(body, "第一节", 3)
    assert "橡皮泥" not in _cell(body, "第一节", 3)
    assert "橡皮泥" in _cell(body, "第四节", 5)
    assert _save(client, token, note="  彩纸  ").get_json()["note"] == "彩纸"
    assert _save(client, token, note=" \n ").get_json()["note"] == ""
    body = client.get("/homework/schedule").get_data(as_text=True)
    assert "添加备注" in _cell(body, "第一节", 3)
    assert "水彩笔" not in _cell(body, "第一节", 3) and "彩纸" not in body
    assert "橡皮泥" in _cell(body, "第四节", 5)


def test_material_notes_require_login_and_csrf(client, login):
    assert _save(client, "").status_code == 401
    login()
    assert _save(client, "").status_code == 400
    assert _save(client, "wrong-token").status_code == 400
    assert "水彩笔" not in _cell(client.get("/homework/schedule").get_data(as_text=True), "第一节", 3)


@pytest.mark.parametrize("changes", [
    {"day": 0}, {"day": 6}, {"day": True}, {"day": "3"},
    {"lesson": "早读"}, {"subject": "数学"}, {"scope": "old-term"},
    {"note": "字" * 1001}, {"note": None}, {"note": []},
])
def test_material_note_validation(client, login, changes):
    login()
    token = _token(client)
    assert _save(client, token, **changes).status_code == 400


def test_material_notes_escape_html_and_share_across_sessions(app, client, login):
    login()
    token = _token(client)
    text = '<img src=x onerror="alert(1)">'
    assert _save(client, token, note=text).status_code == 200
    # 新浏览器会话读取相同服务端备注。
    other = app.test_client()
    with client.session_transaction() as source:
        uid = source["uid"]
    with other.session_transaction() as target:
        target["uid"] = uid
    body = other.get("/homework/schedule").get_data(as_text=True)
    assert "&lt;img" in body and text not in body


def test_material_notes_do_not_follow_changed_term_or_subject(client, login, monkeypatch):
    login()
    token = _token(client)
    assert _save(client, token).status_code == 200
    original = schedule_mod.load_schedule()
    changed = {**copy.deepcopy(original), "scope": "next-term"}
    monkeypatch.setattr("app.views.routes.load_schedule", lambda: changed)
    assert "水彩笔" not in _cell(client.get("/homework/schedule").get_data(as_text=True), "第一节", 3)
    original["rows"][1]["cells"][2] = "数学"
    monkeypatch.setattr("app.views.routes.load_schedule", lambda: original)
    assert "水彩笔" not in _cell(client.get("/homework/schedule").get_data(as_text=True), "第一节", 3)


@pytest.mark.parametrize("payload", [None, [], "text"])
def test_material_notes_reject_non_object_json(client, login, payload):
    login()
    token = _token(client)
    resp = client.put("/homework/api/schedule/note", json=payload,
                      headers={"X-CSRF-Token": token})
    assert resp.status_code == 400
