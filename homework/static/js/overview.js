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

  var state = { date: todayStr(), data: null, editing: false, busy: false };

  function todayStr() {
    var d = new Date(), p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
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
    var url = cfg.overviewUrl + "?date=" + encodeURIComponent(state.date) +
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

  /* ---------- 渲染 ---------- */

  function viewRow(t) {
    var done = t.status === "done";
    return '<div class="task' + (done ? " done" : "") + '" data-id="' + t.id + '">' +
      '<span class="box"></span>' +
      '<div class="info">' +
        '<div class="title">' + esc(t.title) + "</div>" +
        '<div class="tags">' +
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
    $("listMeta").textContent = cnDate(data.date) + " " + data.weekday +
      " · 已完成 " + data.done + "/" + data.total +
      (data.maintainable ? "" : " · 历史只读");
    $("viewDate").value = data.date;

    $("days").innerHTML = data.series.map(function (d) {
      var cls = d.date === todayStr() ? " today" : "";
      var pct = d.rate == null ? "—" : d.rate + "%";
      return '<div class="day' + cls + '" data-date="' + d.date + '">' +
        "<b>" + d.date.slice(5).replace("-", "/") + "</b>" +
        "<i>" + (d.total ? d.done + "/" + d.total + " · " + pct : "无清单") + "</i></div>";
    }).join("");
    Array.prototype.forEach.call($("days").querySelectorAll(".day"), function (el) {
      el.onclick = function () {
        state.date = el.dataset.date;
        state.editing = false;
        $("editToggle").checked = false;
        syncTools();
        load();
      };
    });

    var groups = data.groups || [];
    $("grid").innerHTML = groups.length ? groups.map(function (g) {
      var rows = g.items.map(state.editing ? editRow : viewRow).join("");
      var add = state.editing
        ? '<div class="add-row"><input data-subject="' + esc(g.subject) +
          '" placeholder="＋ 添加' + esc(g.subject) + '作业，回车即建"></div>'
        : "";
      return '<div class="subject' + (state.editing ? " editing" : "") +
        '" style="--c:' + colorOf(g.subject) + '">' +
        '<div class="subject-head"><h3>' + esc(g.subject) + "</h3>" +
        '<span class="count">' + g.done + "/" + g.items.length + "</span></div>" +
        rows + add + "</div>";
    }).join("") :
      '<div class="empty-note">清单为空。开启「维护模式」后在学科卡片里添加作业，或点「复制昨日」。</div>';

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
          due_date: state.date
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
      body: JSON.stringify({ mode: mode, date: state.date })
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
      toast("历史日期只读，请切回今天或未来日期");
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

  $("viewDate").onchange = function (e) {
    if (!e.target.value) return;
    state.date = e.target.value;
    state.editing = false;
    $("editToggle").checked = false;
    syncTools();
    load();
  };

  $("rmClose").onclick = closeRes;
  $("resModal").onclick = function (e) { if (e.target.id === "resModal") closeRes(); };
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeRes(); });

  /* ---------- 启动 ---------- */

  $("viewDate").value = state.date;
  syncTools();
  tick();
  setInterval(tick, 1000);
  load();
})();
