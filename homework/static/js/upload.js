/* 学习工作台 · 上传作业页（先入库、后关联）
   依赖：window.UP = {uploadUrl, tasksUrl, createTaskUrl, resourcesUrl, homeUrl, csrf}；外壳 toast()。 */
(function () {
  "use strict";
  var cfg = window.UP;
  var $ = function (id) { return document.getElementById(id); };

  var ALLOWED = ["jpg", "jpeg", "png", "gif", "webp", "pdf", "mp4", "mov",
                 "mp3", "wav", "txt", "md", "zip"];
  var MAX = 50 * 1024 * 1024;

  var files = [];                 // 待上传 File[]
  var uploaded = [];              // 本次上传入库的 resource（含 deduped）
  var checkedNew = new Set();     // 本次上传中被勾选关联的 resource id
  var selected = new Map();       // 资料库已选 id -> resource

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function fmt(b) {
    b = +b || 0;
    return b > 1048576 ? (b / 1048576).toFixed(1) + " MB"
      : Math.max(1, Math.round(b / 1024)) + " KB";
  }
  function ext(n) { return (String(n).split(".").pop() || "").toLowerCase(); }

  function api(url, opts) {
    opts = opts || {};
    opts.headers = Object.assign(
      { "X-CSRF-Token": cfg.csrf },
      opts.body && !(opts.body instanceof FormData)
        ? { "Content-Type": "application/json" } : {},
      opts.headers || {}
    );
    if (opts.body && !(opts.body instanceof FormData) && typeof opts.body !== "string") {
      opts.body = JSON.stringify(opts.body);
    }
    return fetch(url, opts).then(function (resp) {
      return resp.json().catch(function () { return null; }).then(function (body) {
        if (!resp.ok) throw new Error((body && body.error) || ("请求失败 " + resp.status));
        return body;
      });
    });
  }

  /* ---------- 文件队列 ---------- */

  function addFiles(list) {
    var skipped = 0;
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      if (ALLOWED.indexOf(ext(f.name)) < 0 || f.size > MAX) { skipped++; continue; }
      var dup = files.some(function (x) { return x.name === f.name && x.size === f.size; });
      if (!dup) files.push(f);
    }
    if (skipped) toast("已跳过 " + skipped + " 个：格式不支持或超过 50MB");
    renderQueue();
  }

  function renderQueue() {
    $("queue").innerHTML = files.map(function (f, i) {
      return '<div class="qitem">' +
        '<span class="ext">' + esc(ext(f.name)) + "</span>" +
        '<span class="fname">' + esc(f.name) + "</span>" +
        '<span class="fsize">' + fmt(f.size) + "</span>" +
        '<button class="rm" data-i="' + i + '" type="button">移除</button></div>';
    }).join("");
    Array.prototype.forEach.call($("queue").querySelectorAll(".rm"), function (b) {
      b.onclick = function () { files.splice(+b.dataset.i, 1); renderQueue(); };
    });
    var total = files.reduce(function (s, f) { return s + f.size; }, 0);
    $("totalInfo").textContent = files.length
      ? "已选 " + files.length + " 个 · 共 " + fmt(total) : "";
    renderNewRes();
    updateResPill();
  }

  function renderNewRes() {
    var box = $("newRes");
    if (!uploaded.length) {
      box.innerHTML = '<div class="placeholder" style="font-size:13px;color:var(--muted)">' +
        (files.length ? "尚未上传，点「开始上传」后在此确认关联" : "尚未选择文件") + "</div>";
      return;
    }
    box.innerHTML = uploaded.map(function (r) {
      return '<label class="pick">' +
        '<input type="checkbox" data-id="' + r.id + '"' +
          (checkedNew.has(r.id) ? " checked" : "") + ">" +
        "<span>" + esc(r.title) + (r.deduped ? "（已存在，去重）" : "") + "</span>" +
        '<span class="sz">' + r.size_human + "</span></label>";
    }).join("");
    Array.prototype.forEach.call(box.querySelectorAll("input"), function (c) {
      c.onchange = function () {
        var id = +c.dataset.id;
        c.checked ? checkedNew.add(id) : checkedNew["delete"](id);
        updateResPill();
      };
    });
  }

  function updateResPill() {
    $("resPill").textContent = (checkedNew.size + selected.size) + " 份";
  }

  function renderChips() {
    var box = $("selRes");
    if (!selected.size) {
      box.innerHTML = '<span class="placeholder">暂未选择资料库中的资料</span>';
      updateResPill();
      return;
    }
    box.innerHTML = Array.from(selected.keys()).map(function (id) {
      var r = selected.get(id);
      return '<span class="chip">' + esc(r.title) +
        ' <button data-id="' + id + '" title="移除" type="button">×</button></span>';
    }).join("");
    Array.prototype.forEach.call(box.querySelectorAll("button"), function (b) {
      b.onclick = function () { selected["delete"](+b.dataset.id); renderChips(); };
    });
    updateResPill();
  }

  /* ---------- 上传 ---------- */

  function uploadFiles() {
    if (!files.length) { toast("请先选择要上传的文件"); return; }
    var btn = $("uploadBtn");
    btn.disabled = true;
    $("bar").classList.add("show");

    var form = new FormData();
    files.forEach(function (f) { form.append("files", f); });
    form.append("kind", "homework");

    var xhr = new XMLHttpRequest();
    xhr.open("POST", cfg.uploadUrl);
    xhr.setRequestHeader("X-CSRF-Token", cfg.csrf);
    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) {
        $("barFill").style.width = Math.round(e.loaded / e.total * 100) + "%";
      }
    };
    xhr.onload = function () {
      btn.disabled = false;
      $("bar").classList.remove("show");
      $("barFill").style.width = "0";
      var body = null;
      try { body = JSON.parse(xhr.responseText); } catch (e) { /* noop */ }
      if (xhr.status < 200 || xhr.status >= 300) {
        toast((body && body.error) || ("上传失败 " + xhr.status));
        if (body && body.errors && body.errors.length) {
          toast(body.errors[0].file + "：" + body.errors[0].error);
        }
        return;
      }
      var all = (body.uploaded || []).concat(body.deduped || []);
      uploaded = all;
      checkedNew = new Set(all.map(function (r) { return r.id; }));
      if (body.errors && body.errors.length) {
        toast("部分失败：" + body.errors[0].file + "：" + body.errors[0].error);
      } else {
        toast("已上传入库 " + (body.uploaded || []).length + " 个" +
          (body.deduped && body.deduped.length ? "，去重 " + body.deduped.length + " 个" : ""));
      }
      files = [];
      renderQueue();
      renderRecent();
    };
    xhr.onerror = function () {
      btn.disabled = false;
      $("bar").classList.remove("show");
      toast("网络错误，上传失败");
    };
    xhr.send(form);
  }

  /* ---------- 资料库搜索 ---------- */

  function wireSearch() {
    var timer = null;
    $("resQ").oninput = function (e) {
      var q = e.target.value.trim();
      var hits = $("resHits");
      if (timer) clearTimeout(timer);
      if (!q) { hits.innerHTML = ""; return; }
      timer = setTimeout(function () {
        api(cfg.resourcesUrl + "?q=" + encodeURIComponent(q) + "&per_page=8")
          .then(function (data) {
            var found = data.items.filter(function (r) { return !selected.has(r.id); });
            hits.innerHTML = found.length ? found.map(function (r) {
              return '<div class="hit" data-id="' + r.id + '">' +
                "<span>" + esc(r.title) + "</span>" +
                '<span class="sz">' + esc(r.subject || "—") + " · " +
                (r.visibility === "public" ? "存量" : "私有") + " · " + r.size_human +
                "</span></div>";
            }).join("") : '<div class="hit none">没有匹配的资料</div>';
            Array.prototype.forEach.call(
              hits.querySelectorAll(".hit[data-id]"), function (h) {
                h.onclick = function () {
                  var id = +h.dataset.id;
                  var item = found.find(function (r) { return r.id === id; });
                  if (item) selected.set(id, item);
                  $("resQ").value = "";
                  hits.innerHTML = "";
                  renderChips();
                };
              });
          })
          .catch(function (err) { toast(err.message); });
      }, 250);
    };
    document.addEventListener("click", function (e) {
      if (!e.target.closest || !e.target.closest(".res-search")) $("resHits").innerHTML = "";
    });
  }

  /* ---------- 已有任务下拉 ---------- */

  function loadTasks() {
    var sel = $("fLink");
    var due = $("fDue").value;
    if (!due) return;
    api(cfg.tasksUrl + "?date=" + encodeURIComponent(due))
      .then(function (data) {
        if (!data.items.length) {
          sel.innerHTML = '<option value="">当天暂无任务，可改用「生成新任务」</option>';
          return;
        }
        sel.innerHTML = data.items.map(function (t) {
          return '<option value="' + t.id + '">' +
            esc(t.subject) + " · " + esc(t.title) + "</option>";
        }).join("");
      })
      .catch(function (err) { toast(err.message); });
  }

  /* ---------- 最近上传 ---------- */

  function renderRecent(rows) {
    var body = $("recent");
    if (rows) {
      if (!rows.length) {
        body.innerHTML = '<tr><td colspan="5" class="empty">还没有上传记录</td></tr>';
        return;
      }
      body.innerHTML = rows.map(function (r) {
        return "<tr><td>" + esc(r.title) + "</td>" +
          "<td>" + esc((r.created_at || "").slice(5, 16)) + "</td>" +
          "<td>" + r.size_human + "</td>" +
          "<td>" + (r.visibility === "private"
            ? '<span class="badge warn">私有</span>' : '<span class="badge">公开</span>') + "</td>" +
          '<td><a href="' + esc(r.url) + '" target="_blank" rel="noopener">打开</a></td></tr>';
      }).join("");
      return;
    }
    api(cfg.resourcesUrl + "?kind=homework&sort=recent&per_page=10")
      .then(function (data) { renderRecent(data.items); })
      .catch(function () { /* 静默：最近列表非关键 */ });
  }

  /* ---------- 生成任务 ---------- */

  function currentResourceIds() {
    var ids = Array.from(checkedNew);
    selected.forEach(function (_v, id) { ids.push(id); });
    return ids;
  }

  function generate() {
    var ids = currentResourceIds();
    var mode = document.querySelector("input[name=mode]:checked").value;
    if (files.length) {
      toast("还有 " + files.length + " 个文件未上传，请先「开始上传」或移除");
      return;
    }
    if (mode === "link" && !ids.length) {
      toast("请先选择要关联的资料");
      return;
    }

    var kind = document.querySelector("input[name=kind]:checked").value;
    var subject = $("fSubject").value;
    var title = $("fTitle").value.trim() ||
      (uploaded[0] ? uploaded[0].title : "") || "新作业";
    var due = $("fDue").value;
    var est = +$("fEst").value || 30;
    var note = $("fNote").value.trim();

    var req;
    if (mode === "link") {
      var taskId = $("fLink").value;
      if (!taskId) { toast("请先选择要关联的已有任务"); return; }
      req = api(cfg.tasksUrl + "/" + taskId + "/resources", {
        method: "POST",
        body: { mode: "add", resource_ids: ids }
      }).then(function () {
        toast("已把 " + ids.length + " 份资料关联到所选任务");
      });
    } else {
      req = api(cfg.createTaskUrl, {
        method: "POST",
        body: {
          title: title, subject: subject, kind: kind, due_date: due,
          est_minutes: est, note: note, resource_ids: ids
        }
      }).then(function () {
        var when = due === $("fDue").defaultValue ? "当日" : "";
        toast(ids.length
          ? "任务已进入" + when + "清单，关联 " + ids.length + " 份资料"
          : "任务已进入" + when + "清单");
      });
    }

    req.then(function () {
      uploaded = [];
      selected.clear();
      checkedNew = new Set();
      renderQueue();
      renderChips();
      setTimeout(function () { location.href = cfg.homeUrl; }, 900);
    }).catch(function (err) { toast(err.message); });
  }

  /* ---------- 事件 ---------- */

  $("drop").onclick = function () { $("fileInput").click(); };
  $("fileInput").onchange = function (e) { addFiles(e.target.files); e.target.value = ""; };
  $("drop").addEventListener("dragover", function (e) {
    e.preventDefault(); $("drop").classList.add("over");
  });
  $("drop").addEventListener("dragleave", function () {
    $("drop").classList.remove("over");
  });
  $("drop").addEventListener("drop", function (e) {
    e.preventDefault(); $("drop").classList.remove("over"); addFiles(e.dataTransfer.files);
  });
  $("clearBtn").onclick = function () { files = []; renderQueue(); };
  $("uploadBtn").onclick = uploadFiles;

  Array.prototype.forEach.call(
    document.querySelectorAll("input[name=mode]"), function (r) {
      r.onchange = function () {
        $("linkField").style.display =
          document.querySelector("input[name=mode]:checked").value === "link" ? "" : "none";
      };
    });
  $("fDue").onchange = loadTasks;
  $("genBtn").onclick = generate;

  renderQueue();
  renderChips();
  renderRecent();
  loadTasks();
  wireSearch();
})();
