/* 周课表：今天列、当前时段高亮与材料备注编辑。 */
(function () {
  "use strict";
  var day = new Date().getDay(); // 0=周日
  if (day >= 1 && day <= 5) {
    document.querySelectorAll('#schedTable [data-day="' + day + '"]').forEach(function (el) {
      el.classList.add("is-today");
    });
  }
  var now = new Date();
  var mins = now.getHours() * 60 + now.getMinutes();
  document.querySelectorAll("#schedTable tr[data-time]").forEach(function (tr) {
    var m = tr.getAttribute("data-time").match(/(\d+):(\d+)\s*[-–]\s*(\d+):(\d+)/);
    if (!m) return;
    var start = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    var end = parseInt(m[3], 10) * 60 + parseInt(m[4], 10);
    if (mins >= start && mins < end) tr.classList.add("is-now");
  });

  var cfg = window.SCHEDULE;
  var modal = document.getElementById("scheduleNoteModal");
  var form = document.getElementById("scheduleNoteForm");
  var input = document.getElementById("snNote");
  var status = document.getElementById("snStatus");
  var save = document.getElementById("snSave");
  var editing = null;
  var trigger = null;
  var saving = false;

  function close() {
    if (saving) return;
    modal.hidden = true;
    editing = null;
    if (trigger) trigger.focus();
  }

  document.querySelectorAll(".sched-edit").forEach(function (button) {
    button.onclick = function () {
      trigger = button;
      editing = button.closest("td");
      input.value = editing.querySelector(".sched-material").textContent;
      document.getElementById("snHeading").textContent =
        cfg.days[Number(editing.dataset.day) - 1] + " · " + editing.dataset.lesson +
        " · " + editing.dataset.subject;
      status.textContent = "";
      modal.hidden = false;
      input.focus();
    };
  });
  document.getElementById("snClose").onclick = close;
  document.getElementById("snCancel").onclick = close;
  modal.onclick = function (event) { if (event.target === modal) close(); };
  modal.onkeydown = function (event) {
    if (event.key === "Escape") { event.preventDefault(); close(); }
    if (event.key === "Tab") {
      var controls = Array.from(form.querySelectorAll("button, textarea")).filter(function (el) { return !el.disabled; });
      var first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  };

  form.onsubmit = function (event) {
    event.preventDefault();
    if (!editing || saving) return;
    saving = true;
    save.disabled = true;
    input.disabled = true;
    status.textContent = "保存中…";
    fetch(cfg.noteUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content
      },
      body: JSON.stringify({
        scope: cfg.scope, lesson: editing.dataset.lesson,
        day: Number(editing.dataset.day), subject: editing.dataset.subject, note: input.value
      })
    }).then(function (response) {
      return response.json().catch(function () { return null; }).then(function (body) {
        if (!response.ok) {
          if (response.status === 401) throw new Error("登录已过期，请重新登录后再保存");
          throw new Error((body && body.error) || "保存失败，请刷新页面后重试");
        }
        if (!body || typeof body.note !== "string") throw new Error("保存结果异常，请刷新页面核对");
        return body;
      });
    }).then(function (body) {
      var note = editing.querySelector(".sched-material");
      note.textContent = body.note;
      note.hidden = !body.note;
      trigger.textContent = body.note ? "编辑备注" : "添加备注";
      saving = false;
      close();
      toast(body.note ? "备注已保存" : "备注已清空");
    }).catch(function (error) {
      status.textContent = error.message;
    }).finally(function () {
      saving = false;
      save.disabled = false;
      input.disabled = false;
    });
  };
})();
