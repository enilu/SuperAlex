"""课程表：data/schedule.json 渲染与入口。"""
from __future__ import annotations

import json
import re
from pathlib import Path

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
    # 课后服务三行合并 label
    service = [r for r in data["rows"] if r["kind"] == "service"]
    assert len(service) == 3 and service[0].get("label_span") == 3
    assert service[1]["label"] == "" and service[2]["label"] == ""
    assert len(data["notes"]) >= 2
