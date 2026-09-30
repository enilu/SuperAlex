"""P2：任务 CRUD、打卡、维护模式与总览 API。"""
from __future__ import annotations

import re
from datetime import date, timedelta

from app import db as db_mod

CSRF_META_RE = re.compile(r'name="csrf-token" content="([^"]+)"')


def _today() -> str:
    return date.today().isoformat()


def _shift(days: int) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


def _csrf(client) -> str:
    html = client.get("/homework/").get_data(as_text=True)
    match = CSRF_META_RE.search(html)
    assert match, "页面缺少 csrf meta"
    return match.group(1)


def _post(client, url, data, token):
    return client.post(url, json=data, headers={"X-CSRF-Token": token})


def _patch(client, url, data, token):
    return client.patch(url, json=data, headers={"X-CSRF-Token": token})


def _make_day(client, token, count=8, due_date=None, kind="in_school"):
    """建一整天的清单，返回创建的任务列表。"""
    subjects = ["语文", "数学", "英语", "化学", "物理"]
    created = []
    for i in range(count):
        resp = _post(client, "/homework/api/tasks", {
            "title": f"作业{i + 1}",
            "subject": subjects[i % len(subjects)],
            "kind": kind,
            "due_date": due_date or _today(),
            "est_minutes": 15 + 5 * (i % 4),
        }, token)
        assert resp.status_code == 201, resp.get_json()
        created.append(resp.get_json())
    return created


def test_create_eight_tasks_and_list(client, login):
    login()
    token = _csrf(client)
    _make_day(client, token, count=8)

    resp = client.get(f"/homework/api/tasks?date={_today()}")
    payload = resp.get_json()
    assert resp.status_code == 200
    assert payload["total"] == 8

    ov = client.get(f"/homework/api/overview?date={_today()}").get_json()
    assert ov["total"] == 8
    assert ov["done"] == 0
    assert ov["rate"] == 0
    assert ov["kind_counts"]["in_school"] == 8
    assert ov["maintainable"] is True
    assert len(ov["series"]) == 7
    assert ov["series"][-1]["date"] == _today()
    assert len(ov["groups"]) >= 1


def test_validation_errors(client, login):
    login()
    token = _csrf(client)
    base = {"subject": "语文", "kind": "in_school", "due_date": _today()}

    assert _post(client, "/homework/api/tasks", {**base}, token).status_code == 400
    assert _post(client, "/homework/api/tasks",
                 {**base, "title": "x", "due_date": "2026/09/27"}, token).status_code == 400
    assert _post(client, "/homework/api/tasks",
                 {**base, "title": "x", "kind": "sleep"}, token).status_code == 400
    assert _post(client, "/homework/api/tasks",
                 {**base, "title": "x", "est_minutes": 9999}, token).status_code == 400

    # 缺 CSRF → 400
    assert client.post("/homework/api/tasks", json={**base, "title": "x"}).status_code == 400


def test_checkin_updates_stats_and_series(client, login, app):
    login()
    token = _csrf(client)
    tasks = _make_day(client, token, count=2)

    resp = _patch(client, f"/homework/api/tasks/{tasks[0]['id']}",
                  {"status": "done"}, token)
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "done"

    # 打卡流水
    conn = db_mod.connect_db(app.config["DATABASE"])
    try:
        rows = conn.execute(
            "SELECT * FROM checkins WHERE task_id = ?", (tasks[0]["id"],)
        ).fetchall()
        assert len(rows) == 1
        assert rows[0]["action"] == "done"
        assert rows[0]["actor"] == "测试家长"
    finally:
        conn.close()

    ov = client.get(f"/homework/api/overview?date={_today()}").get_json()
    assert ov["done"] == 1
    assert ov["rate"] == 50
    assert ov["series"][-1]["done"] == 1
    assert ov["series"][-1]["rate"] == 50

    # 撤销
    assert _patch(client, f"/homework/api/tasks/{tasks[0]['id']}",
                  {"status": "open"}, token).status_code == 200
    conn = db_mod.connect_db(app.config["DATABASE"])
    try:
        actions = [r["action"] for r in conn.execute(
            "SELECT action FROM checkins ORDER BY id")]
        assert actions == ["done", "reopen"]
    finally:
        conn.close()
    ov = client.get(f"/homework/api/overview?date={_today()}").get_json()
    assert ov["done"] == 0


def test_maintenance_edit_and_delete(client, login):
    login()
    token = _csrf(client)
    task = _make_day(client, token, count=1)[0]

    resp = _patch(client, f"/homework/api/tasks/{task['id']}",
                  {"title": "改过的作业", "est_minutes": 45}, token)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["title"] == "改过的作业"
    assert body["est_minutes"] == 45

    assert _patch(client, f"/homework/api/tasks/{task['id']}",
                  {"status": "nope"}, token).status_code == 400
    assert _patch(client, "/homework/api/tasks/999999",
                  {"title": "x"}, token).status_code == 404

    assert client.delete(f"/homework/api/tasks/{task['id']}",
                         headers={"X-CSRF-Token": token}).status_code == 200
    assert client.get(f"/homework/api/tasks?date={_today()}").get_json()["total"] == 0
    assert client.delete("/homework/api/tasks/999999",
                         headers={"X-CSRF-Token": token}).status_code == 404


def test_historical_day_is_readonly(client, login, app):
    login()
    token = _csrf(client)
    yesterday = _shift(-1)

    # 直接入库一条历史任务（API 不允许在历史新建）
    conn = db_mod.connect_db(app.config["DATABASE"])
    try:
        cur = conn.execute(
            "INSERT INTO tasks(title, subject, kind, due_date) VALUES (?,?,?,?)",
            ("昨天的作业", "语文", "in_school", yesterday),
        )
        hist_id = cur.lastrowid
        conn.commit()
    finally:
        conn.close()

    assert _post(client, "/homework/api/tasks",
                 {"title": "补录", "subject": "语文", "kind": "in_school",
                  "due_date": yesterday}, token).status_code == 403

    assert _patch(client, f"/homework/api/tasks/{hist_id}",
                  {"title": "改历史"}, token).status_code == 403
    assert client.delete(f"/homework/api/tasks/{hist_id}",
                         headers={"X-CSRF-Token": token}).status_code == 403

    # 打卡（补记/撤销）不受限
    assert _patch(client, f"/homework/api/tasks/{hist_id}",
                  {"status": "done"}, token).status_code == 200

    ov = client.get(f"/homework/api/overview?date={yesterday}").get_json()
    assert ov["maintainable"] is False
    assert ov["done"] == 1


def test_bulk_create_copy_clear(client, login):
    login()
    token = _csrf(client)
    tomorrow = _shift(1)

    # 连续录入
    resp = _post(client, "/homework/api/tasks/bulk",
                 {"mode": "create", "date": _today(),
                  "titles": ["口算第5页", "读课文", {"title": "抄词组", "subject": "语文"}],
                  "kind": "in_school"}, token)
    assert resp.status_code == 200
    assert resp.get_json()["created"] == 3

    # 复制昨日 → 明天
    resp = _post(client, "/homework/api/tasks/bulk",
                 {"mode": "copy_yesterday", "date": tomorrow}, token)
    assert resp.get_json()["created"] == 3
    got = client.get(f"/homework/api/tasks?date={tomorrow}").get_json()
    assert got["total"] == 3
    assert all(t["status"] == "open" for t in got["items"])

    # 复制上周同日（源为空 → 0）
    resp = _post(client, "/homework/api/tasks/bulk",
                 {"mode": "copy_last_week", "date": tomorrow}, token)
    assert resp.get_json()["created"] == 0

    # 从零开始
    resp = _post(client, "/homework/api/tasks/bulk",
                 {"mode": "clear", "date": tomorrow}, token)
    assert resp.get_json()["removed"] == 3
    assert client.get(f"/homework/api/tasks?date={tomorrow}").get_json()["total"] == 0

    # 历史日期禁止批量写入
    assert _post(client, "/homework/api/tasks/bulk",
                 {"mode": "copy_yesterday", "date": _shift(-1)}, token).status_code == 403
    assert _post(client, "/homework/api/tasks/bulk",
                 {"mode": "clear", "date": _shift(-1)}, token).status_code == 403
    assert _post(client, "/homework/api/tasks/bulk",
                 {"mode": "delete-everything", "date": _today()}, token).status_code == 400


def test_kind_filter_and_task_pages(client, login):
    login()
    token = _csrf(client)
    _make_day(client, token, count=3, kind="in_school")
    _make_day(client, token, count=2, kind="extra_school")

    ov = client.get(f"/homework/api/overview?date={_today()}&kind=in_school").get_json()
    assert ov["total"] == 3
    ov2 = client.get(f"/homework/api/overview?date={_today()}&kind=extra_school").get_json()
    assert ov2["total"] == 2

    for path in ("/homework/", "/homework/tasks/school", "/homework/tasks/extra"):
        resp = client.get(path)
        assert resp.status_code == 200, path
        body = resp.get_data(as_text=True)
        assert 'id="grid"' in body
        assert "维护模式" in body

    # 页面导航态
    assert "school" in client.get("/homework/tasks/school").get_data(as_text=True)
    assert client.get("/homework/api/overview?kind=bad").status_code == 400


def test_status_filter_chips(client, login):
    """校内/校外页提供已完成/未完成快速筛选，总览页不提供。"""
    login()

    for path in ("/homework/tasks/school", "/homework/tasks/extra"):
        body = client.get(path).get_data(as_text=True)
        assert 'id="statusFilter"' in body, path
        assert 'data-status="done"' in body, path
        assert 'data-status="open"' in body, path
        assert "overview.js?v=20260930-p2" in body, path

    home = client.get("/homework/").get_data(as_text=True)
    assert 'id="statusFilter"' not in home


def test_overview_range(client, login):
    """时间段查询：聚合、日期升序、兼容旧字段与维护口径。"""
    login()
    token = _csrf(client)
    _post(client, "/homework/api/tasks", {
        "title": "当天作业", "subject": "语文", "kind": "in_school",
        "due_date": _today(),
    }, token)
    _post(client, "/homework/api/tasks", {
        "title": "明日作业", "subject": "数学", "kind": "in_school",
        "due_date": _shift(1),
    }, token)
    _post(client, "/homework/api/tasks", {
        "title": "后日校外", "subject": "英语", "kind": "extra_school",
        "due_date": _shift(2),
    }, token)

    ov = client.get(
        f"/homework/api/overview?start={_today()}&end={_shift(2)}&kind=in_school"
    ).get_json()
    assert ov["start"] == _today()
    assert ov["end"] == _shift(2)
    assert ov["date"] == _shift(2)      # 旧字段兼容（= end）
    assert ov["days"] == 3
    assert ov["total"] == 2             # kind 过滤在区间内生效
    assert ov["maintainable"] is False  # 多日不可维护
    dates = [t["due_date"] for g in ov["groups"] for t in g["items"]]
    assert dates == [_today(), _shift(1)]  # 日期升序

    # 不限 kind 的全量区间
    ov_all = client.get(
        f"/homework/api/overview?start={_today()}&end={_shift(2)}"
    ).get_json()
    assert ov_all["total"] == 3
    assert ov_all["kind_counts"] == {"in_school": 2, "extra_school": 1}

    # 起=止（今天）仍是单日可维护
    single = client.get(
        f"/homework/api/overview?start={_today()}&end={_today()}"
    ).get_json()
    assert single["days"] == 1
    assert single["maintainable"] is True


def test_overview_range_validation(client, login):
    """区间边界：起止顺序、格式、跨度上限、旧参数兼容。"""
    login()

    # 起始晚于结束 → 400
    resp = client.get(f"/homework/api/overview?start={_shift(1)}&end={_today()}")
    assert resp.status_code == 400
    assert "起始日期" in resp.get_json()["error"]

    # 非法日期 → 400
    assert client.get(
        "/homework/api/overview?start=2026-13-99&end=2026-12-01"
    ).status_code == 400

    # 跨度 > 92 天 → 400
    resp = client.get(f"/homework/api/overview?start={_shift(-100)}&end={_today()}")
    assert resp.status_code == 400
    assert "92" in resp.get_json()["error"]

    # 旧 ?date= 单日调用完全兼容
    ov = client.get(f"/homework/api/overview?date={_today()}").get_json()
    assert ov["start"] == ov["end"] == _today()
    assert ov["days"] == 1

    # 只给一端自动对齐为单日
    ov = client.get(f"/homework/api/overview?start={_today()}").get_json()
    assert ov["start"] == ov["end"] == _today()


def test_range_picker_pages(client, login):
    """三个总览类页面均提供时间段双输入与快捷按钮。"""
    login()
    for path in ("/homework/", "/homework/tasks/school", "/homework/tasks/extra"):
        body = client.get(path).get_data(as_text=True)
        assert 'id="startDate"' in body, path
        assert 'id="endDate"' in body, path
        assert 'data-range="week"' in body, path
        assert "overview.js?v=20260930-p2" in body, path
    assert 'id="viewDate"' not in client.get("/homework/").get_data(as_text=True)


def test_api_requires_auth(client):
    assert client.get("/homework/api/overview").status_code == 401
    assert client.get("/homework/api/tasks").status_code == 401
    assert client.get("/homework/api/stats").status_code == 401
    assert client.post("/homework/api/tasks", json={}).status_code == 401


def test_stats_endpoint(client, login):
    login()
    token = _csrf(client)
    _make_day(client, token, count=4)

    resp = client.get(f"/homework/api/stats?days=7&date={_today()}")
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["days"] == 7
    assert len(payload["series"]) == 7
    assert payload["series"][-1]["total"] == 4

    assert client.get("/homework/api/stats?days=0").status_code == 200  # 被夹到 1
    assert client.get("/homework/api/stats?date=bad").status_code == 400
