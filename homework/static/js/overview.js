/* 学习工作台 · 总览页（打卡 / 维护模式 / 复制昨日）
   依赖：window.WB = {overviewUrl, tasksUrl, bulkUrl, csrf, kind}；外壳的 toast()。 */
(function () {
  "use strict";
  var cfg = window.WB;
  var $ = function (id) { return document.getElementById(id); };

  var SUBJECT_COLORS = {
    "语文": "#d92d20", "数学": "#2563eb", "英语": "#7c3aed", "物理": "#d97706",
    "化学": "#0d9488", "生物": "#16a34a", "历史": "#9333ea", "地理": "#0891b2",
    "道法": "#ca8a04", "其他": "#64748b"
  };
  var SUBJECTS = Object.keys(SUBJECT_COLORS);

  // 默认时间段：7 天前 ~ 60 天后（快捷按钮/手动修改后覆盖）
  var state = { start: offsetDays(-7), end: offsetDays(60), data: null,
                editing: false, busy: false, statusFilter: "" };

  function fmtDate(d) {
    var p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function todayStr() { return fmtDate(new Date()); }
  function offsetDays(n) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    return fmtDate(d);
  }
  function rangeMode() { return state.start !== state.end; }
  function colorOf(name) { return SUBJECT_COLORS[name] || "#64748b"; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function cnDate(iso) {
    var parts = iso.split("-");
    return parts[1] + "月" + parts[2] + "日";
  }
  function weekdayLabel(iso) {
    var p = iso.split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return "日一二三四五六".charAt(d.getDay());
  }

  function api(url, opts) {
    opts = opts || {};
    opts.headers = Object.assign(
      { "Content-Type": "application/json", "X-CSRF-Token": cfg.csrf },
      opts.headers || {}
    );
    return fetch(url, opts).then(function (resp) {
      return resp.json().catch(function () { return null; }).then(function (body) {
        if (!resp.ok) {
          throw new Error((body && body.error) || ("请求失败 " + resp.status));
        }
        return body;
      });
    });
  }

  function taskUrl(id) { return cfg.tasksUrl + "/" + id; }

  /* ---------- 数据加载 ---------- */

  function load() {
    var url = cfg.overviewUrl + "?start=" + encodeURIComponent(state.start) +
      "&end=" + encodeURIComponent(state.end) +
      (cfg.kind ? "&kind=" + encodeURIComponent(cfg.kind) : "");
    return api(url).then(function (data) {
      state.data = data;
      if (!data.maintainable && state.editing) {
        state.editing = false;
        $("editToggle").checked = false;
        syncTools();
      }
      render();
    }).catch(function (err) { toast(err.message); });
  }

  function reloadQuiet() { load(); }

  function setRange(start, end) {
    state.start = start;
    state.end = end;
    state.editing = false;
    $("editToggle").checked = false;
    syncTools();
    load();
  }

  /* ---------- 渲染 ---------- */

  function viewRow(t) {
    var done = t.status === "done";
    return '<div class="task' + (done ? " done" : "") + '" data-id="' + t.id + '">' +
      '<span class="box"></span>' +
      '<div class="info">' +
        '<div class="title">' + esc(t.title) + "</div>" +
        '<div class="tags">' +
          (rangeMode()
            ? '<span class="tag date">' + cnDate(t.due_date) + " 周" +
              weekdayLabel(t.due_date) + "</span>"
            : "") +
          '<span class="tag subject">' + esc(t.subject) + "</span>" +
          '<span class="tag' + (t.kind === "in_school" ? "" : " extra") + '">' +
            (t.kind === "in_school" ? "校内" : "校外") + "</span>" +
          (t.resource_count
            ? '<span class="tag res" data-res="' + t.id + '">📎 ' + t.resource_count + " 个资料</span>"
            : "") +
        "</div>" +
        '<div class="est">预计 ' + t.est_minutes + " 分钟 · " + (done ? "已完成" : "待完成") +
          (t.note ? " · " + esc(t.note) : "") + "</div>" +
      "</div>" +
      '<div class="right">' + (done ? "✓ 已完成" : "完成") + "</div>" +
    "</div>";
  }

  function editRow(t) {
    var done = t.status === "done";
    var opts = SUBJECTS.map(function (s) {
      return '<option value="' + esc(s) + '"' + (s === t.subject ? " selected" : "") + ">" + esc(s) + "</option>";
    }).join("");
    if (SUBJECTS.indexOf(t.subject) < 0) {
      opts = '<option value="' + esc(t.subject) + '" selected>' + esc(t.subject) + "</option>" + opts;
    }
    return '<div class="task edit" data-id="' + t.id + '">' +
      '<div class="edit-row">' +
        '<input class="t" data-f="title" value="' + esc(t.title) + '" placeholder="作业内容">' +
        '<select data-f="subject">' + opts + "</select>" +
        '<input class="e" data-f="est_minutes" type="number" min="1" max="600" step="5" value="' +
          t.est_minutes + '" title="预计分钟">' +
        '<span class="st' + (done ? " done" : "") + '" data-toggle="1" role="button">' +
          (done ? "已完成 · 点此撤销" : "待完成") + "</span>" +
        (t.resource_count ? '<span class="st">📎 ' + t.resource_count + " 资料</span>" : "") +
        '<button class="del" type="button">删除</button>' +
      "</div>" +
    "</div>";
  }

  function render() {
    var data = state.data;
    if (!data) return;

    $("doneCount").textContent = data.done;
    $("totalCount").textContent = data.total;
    $("rate").textContent = data.rate + "%";
    $("doneStatLabel").textContent =
      data.days > 1 ? "区间确认完成" : "今日确认完成";
    $("listMeta").textContent = (data.days > 1
        ? cnDate(data.start) + "~" + cnDate(data.end) + "（" + data.days + "天）"
        : cnDate(data.end) + " " + data.weekday) +
      " · 已完成 " + data.done + "/" + data.total +
      (data.days > 1 || data.maintainable ? "" : " · 历史只读");
    $("startDate").value = data.start;
    $("endDate").value = data.end;

    $("days").innerHTML = data.series.map(function (d) {
      var isToday = d.date === todayStr();
      var wd = weekdayLabel(d.date);
      var cls = isToday ? "today"
        : ((d.total && d.done < d.total) ? " warn" : "");
      var pct = d.rate == null ? "—" : d.rate + "%";
      return '<div class="day' + cls + '" data-date="' + d.date + '"' +
        (isToday ? '' : ' title="查看该日清单"') + '>' +
        "<b>" + d.date.slice(5).replace("-", "/") + " 周" + wd + "</b>" +
        "<i>" + (d.total ? d.done + "/" + d.total + " · " + pct : "无清单") + "</i></div>";
    }).join("");
    Array.prototype.forEach.call($("days").querySelectorAll(".day"), function (el) {
      el.onclick = function () {
        setRange(el.dataset.date, el.dataset.date);
      };
    });

    var groups = data.groups || [];
    // 快速筛选计数（校内/校外页 chips，总览页无则跳过）
    if ($("sfAll")) {
      $("sfAll").textContent = data.total;
      $("sfDone").textContent = data.done;
      $("sfOpen").textContent = data.total - data.done;
    }
    var filter = state.statusFilter;
    var shown = groups.map(function (g) {
      return {
        group: g,
        items: filter
          ? g.items.filter(function (t) { return t.status === filter; })
          : g.items
      };
    }).filter(function (c) { return c.items.length > 0; });

    $("grid").innerHTML = !groups.length
      ? '<div class="empty-note">清单为空。开启「维护模式」后在学科卡片里添加作业，或点「复制昨日」。</div>'
      : shown.length ? shown.map(function (c) {
          var g = c.group;
          var rows = c.items.map(state.editing ? editRow : viewRow).join("");
          var add = state.editing
            ? '<div class="add-row"><input data-subject="' + esc(g.subject) +
              '" placeholder="＋ 添加' + esc(g.subject) + '作业，回车即建"></div>'
            : "";
          // 卡片计数保持当日全况口径，不受筛选影响
          return '<div class="subject' + (state.editing ? " editing" : "") +
            '" style="--c:' + colorOf(g.subject) + '">' +
            '<div class="subject-head"><h3>' + esc(g.subject) + "</h3>" +
            '<span class="count">' + g.done + "/" + g.items.length + "</span></div>" +
            rows + add + "</div>";
        }).join("")
      : '<div class="empty-note">当前筛选下无作业，点「全部」查看当日清单。</div>';

    if (state.editing) wireEdit(); else wireCheck();
  }

  /* ---------- 打卡视图 ---------- */

  function toggleStatus(id) {
    var task = findTask(id);
    if (!task || state.busy) return;
    state.busy = true;
    var next = task.status === "done" ? "open" : "done";
    api(taskUrl(id), { method: "PATCH", body: JSON.stringify({ status: next }) })
      .then(function () {
        toast(next === "done" ? "已记为完成" : "已撤销完成");
        return load();
      })
      .catch(function (err) { toast(err.message); })
      .then(function () { state.busy = false; });
  }

  function findTask(id) {
    var groups = (state.data && state.data.groups) || [];
    for (var i = 0; i < groups.length; i++) {
      var items = groups[i].items;
      for (var j = 0; j < items.length; j++) {
        if (items[j].id === id) return items[j];
      }
    }
    return null;
  }

  function wireCheck() {
    Array.prototype.forEach.call($("grid").querySelectorAll(".task[data-id]"), function (el) {
      el.onclick = function () { toggleStatus(+el.dataset.id); };
    });
    Array.prototype.forEach.call($("grid").querySelectorAll(".tag.res"), function (b) {
      b.onclick = function (e) { e.stopPropagation(); openRes(+b.dataset.res); };
    });
  }

  /* ---------- 维护模式 ---------- */

  function wireEdit() {
    Array.prototype.forEach.call($("grid").querySelectorAll(".task.edit"), function (el) {
      var id = +el.dataset.id;
      var titleInput = el.querySelector("[data-f=title]");
      var estInput = el.querySelector("[data-f=est_minutes]");
      var subjectSel = el.querySelector("[data-f=subject]");
      var pending = null;

      function flush() {
        if (pending) { clearTimeout(pending); pending = null; }
        var patch = {
          title: titleInput.value.trim(),
          subject: subjectSel.value,
          est_minutes: +estInput.value || 20
        };
        if (!patch.title) { toast("标题不能为空"); load(); return; }
        api(taskUrl(id), { method: "PATCH", body: JSON.stringify(patch) })
          .then(function () { toast("已保存"); return load(); })
          .catch(function (err) { toast(err.message); load(); });
      }
      function schedule() {
        if (pending) clearTimeout(pending);
        pending = setTimeout(flush, 700);
      }

      titleInput.oninput = schedule;
      estInput.onchange = flush;
      subjectSel.onchange = flush;
      titleInput.onkeydown = function (e) {
        if (e.key === "Enter") { e.preventDefault(); flush(); }
      };
      el.querySelector(".st[data-toggle]").onclick = function () { toggleStatus(id); };
      el.querySelector(".del").onclick = function () {
        if (!confirm("删除「" + (findTask(id) || {}).title + "」？")) return;
        api(taskUrl(id), { method: "DELETE" })
          .then(function () { toast("已删除该作业"); return load(); })
          .catch(function (err) { toast(err.message); });
      };
    });

    Array.prototype.forEach.call($("grid").querySelectorAll(".add-row input"), function (inp) {
      inp.onkeydown = function (e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        var title = inp.value.trim();
        if (!title) return;
        var body = {
          title: title,
          subject: inp.dataset.subject,
          kind: cfg.kind || "in_school",
          due_date: state.end
        };
        api(cfg.tasksUrl, { method: "POST", body: JSON.stringify(body) })
          .then(function () {
            toast("已添加：" + title);
            return load().then(function () {
              var again = $("grid").querySelector(
                '.add-row input[data-subject="' + (inp.dataset.subject || "").replace(/"/g, '\\"') + '"]');
              if (again) again.focus();
            });
          })
          .catch(function (err) { toast(err.message); });
      };
    });
  }

  /* ---------- 批量 ---------- */

  function bulk(mode) {
    var labels = { copy_yesterday: "复制昨日", copy_last_week: "复制上周同日", clear: "从零开始" };
    if (mode === "clear" && !confirm("清空当日全部清单？（不可撤销）")) return;
    api(cfg.bulkUrl, {
      method: "POST",
      body: JSON.stringify({ mode: mode, date: state.end })
    })
      .then(function (res) {
        var n = mode === "clear" ? res.removed : res.created;
        toast(mode === "clear" ? ("已清空 " + n + " 条，可从零录入")
          : ("已" + labels[mode] + " " + n + " 条，逐条微调即可"));
        return load();
      })
      .catch(function (err) { toast(err.message); });
  }

  /* ---------- 资料弹层 ---------- */

  function openRes(id) {
    var t = findTask(id);
    if (!t) return;
    $("rmTitle").textContent = "关联资料 · " + t.subject + " · " + t.title;
    var list = t.resources || [];
    $("rmList").innerHTML = list.length ? list.map(function (r) {
      return '<div class="mitem">' +
        '<span class="tag">' + (r.visibility === "public" ? "public" : "private") + "</span>" +
        '<div class="mt"><b>' + esc(r.title) + "</b><span>" + esc(r.size_human) + "</span></div>" +
        '<a class="open" href="' + esc(r.url) + '" target="_blank" rel="noopener">打开</a>' +
        "</div>";
    }).join("") : '<div class="empty-note">该任务暂未关联资料</div>';
    $("resModal").hidden = false;
  }
  function closeRes() { $("resModal").hidden = true; }

  /* ---------- 倒计时 ---------- */

  function tick() {
    var now = new Date();
    var p = function (n) { return String(n).padStart(2, "0"); };
    var end = new Date(now); end.setHours(21, 0, 0, 0);
    var s = Math.max(0, Math.floor((end - now) / 1000));
    $("countdown").textContent =
      Math.floor(s / 3600) + "小时 " + p(Math.floor(s % 3600 / 60)) + ":" + p(s % 60);
  }

  /* ---------- 事件 ---------- */

  function syncTools() {
    $("editTools").hidden = !state.editing;
    $("maintNote").hidden = !state.editing;
  }

  $("editToggle").onchange = function (e) {
    if (e.target.checked && state.data && !state.data.maintainable) {
      e.target.checked = false;
      toast(state.data.days > 1
        ? "时间段视图仅查看，请切回单日（今天或未来）再维护"
        : "历史日期只读，请切回今天或未来日期");
      return;
    }
    state.editing = e.target.checked;
    syncTools();
    render();
    toast(state.editing ? "已进入维护模式" : "已退出维护模式，可勾选打卡");
  };
  $("copyY").onclick = function () { bulk("copy_yesterday"); };
  $("copyW").onclick = function () { bulk("copy_last_week"); };
  $("clearAll").onclick = function () { bulk("clear"); };

  $("startDate").onchange = function (e) {
    if (!e.target.value) return;
    var s = e.target.value;
    setRange(s, s > state.end ? s : state.end);
  };
  $("endDate").onchange = function (e) {
    if (!e.target.value) return;
    var e2 = e.target.value;
    setRange(e2 < state.start ? e2 : state.start, e2);
  };
  Array.prototype.forEach.call(
    document.querySelectorAll("[data-range]"),
    function (b) {
      b.onclick = function () {
        var mode = b.dataset.range, s, e2 = todayStr();
        if (mode === "week") {
          var d = new Date();
          d.setDate(d.getDate() - (d.getDay() + 6) % 7); // 本周周一
          s = fmtDate(d);
        } else if (mode === "d7") {
          var d7 = new Date();
          d7.setDate(d7.getDate() - 6);
          s = fmtDate(d7);
        } else {
          s = e2;
        }
        setRange(s, e2);
      };
    }
  );

  $("rmClose").onclick = closeRes;
  $("resModal").onclick = function (e) { if (e.target.id === "resModal") closeRes(); };
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeRes(); });

  /* ---------- 启动 ---------- */

  // 快速筛选：全部 / 已完成 / 未完成（仅校内、校外页渲染 chips）
  var sf = $("statusFilter");
  if (sf) {
    Array.prototype.forEach.call(sf.querySelectorAll(".filter-button"), function (btn) {
      btn.onclick = function () {
        state.statusFilter = btn.dataset.status || "";
        Array.prototype.forEach.call(sf.querySelectorAll(".filter-button"), function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        render();
      };
    });
  }

  syncTools();
  tick();
  setInterval(tick, 1000);
  load();
})();
