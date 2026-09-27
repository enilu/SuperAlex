/* 学习工作台 · 资料库管理页（上传入库 / 编辑元数据 / 删除保护）
   依赖：window.LIB = {uploadUrl, resourceUrlBase, csrf}；外壳 toast()。 */
(function () {
  "use strict";
  var cfg = window.LIB;
  var $ = function (id) { return document.getElementById(id); };

  function api(url, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ "X-CSRF-Token": cfg.csrf }, opts.headers || {});
    if (opts.body && !(opts.body instanceof FormData)) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(opts.body);
    }
    return fetch(url, opts).then(function (resp) {
      return resp.json().catch(function () { return null; }).then(function (body) {
        if (!resp.ok) throw new Error((body && body.error) || ("请求失败 " + resp.status));
        return body;
      });
    });
  }

  /* ---------- 上传入库（kind=library） ---------- */

  $("libUploadBtn").onclick = function () { $("libUploadInput").click(); };
  $("libUploadInput").onchange = function (e) {
    var files = e.target.files;
    if (!files.length) return;
    var form = new FormData();
    for (var i = 0; i < files.length; i++) form.append("files", files[i]);
    form.append("kind", "library");

    $("libUploadBtn").disabled = true;
    toast("上传中…");
    api(cfg.uploadUrl, { method: "POST", body: form })
      .then(function (res) {
        var ok = (res.uploaded || []).length + (res.deduped || []).length;
        var msg = "已入库 " + (res.uploaded || []).length + " 个" +
          (res.deduped && res.deduped.length ? "，去重 " + res.deduped.length + " 个" : "");
        if (res.errors && res.errors.length) {
          msg += "；失败 " + res.errors.length + " 个（" + res.errors[0].error + "）";
        }
        toast(ok ? msg : "上传失败");
        if (ok) setTimeout(function () { location.reload(); }, 800);
        else $("libUploadBtn").disabled = false;
      })
      .catch(function (err) {
        $("libUploadBtn").disabled = false;
        toast(err.message);
      });
    e.target.value = "";
  };

  /* ---------- 编辑元数据 ---------- */

  var editingId = null;
  var editingLocked = false;

  function openEdit(tr) {
    editingId = +tr.dataset.id;
    editingLocked = tr.dataset.locked === "1";
    $("emHeading").textContent = "编辑 · " + tr.dataset.title;
    $("emTitle").value = tr.dataset.title || "";
    $("emSubject").value = tr.dataset.subject || "";
    $("emCategory").value = tr.dataset.category || "";
    $("emTags").value = tr.dataset.tags || "";
    $("emNote").value = tr.dataset.note || "";
    $("emPath").value = tr.dataset.path || "";
    $("emLockNote").hidden = !editingLocked;
    $("emStatus").textContent = "";
    $("editModal").hidden = false;
    $("emTitle").focus();
  }

  function closeEdit() {
    $("editModal").hidden = true;
    editingId = null;
    editingLocked = false;
  }

  function saveEdit() {
    if (!editingId) return;
    var payload = {
      title: $("emTitle").value.trim(),
      subject: $("emSubject").value.trim(),
      category: $("emCategory").value.trim(),
      tags: $("emTags").value.trim(),
      note: $("emNote").value.trim()
    };
    $("emStatus").textContent = "保存中…";
    api(cfg.resourceUrlBase + "/" + editingId, { method: "PATCH", body: payload })
      .then(function () {
        toast(editingLocked ? "已更新元数据（文件与路径未动）" : "已保存");
        closeEdit();
        setTimeout(function () { location.reload(); }, 500);
      })
      .catch(function (err) {
        $("emStatus").textContent = "";
        toast(err.message);
      });
  }

  $("emClose").onclick = closeEdit;
  $("emCancel").onclick = closeEdit;
  $("emSave").onclick = saveEdit;
  $("emTitle").onkeydown = function (e) { if (e.key === "Enter") saveEdit(); };
  $("editModal").onclick = function (e) { if (e.target.id === "editModal") closeEdit(); };
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !$("editModal").hidden) closeEdit();
  });

  /* ---------- 删除（仅 private 未锁定） ---------- */

  function doDelete(tr) {
    var id = +tr.dataset.id;
    var title = tr.dataset.title;
    if (!confirm("删除「" + title + "」？\n记录与文件都会删除，且会从关联任务中移除；此操作不可撤销。")) {
      return;
    }
    api(cfg.resourceUrlBase + "/" + id, { method: "DELETE" })
      .then(function (res) {
        toast(res.file_removed ? "已删除资料与文件" : "已删除记录");
        setTimeout(function () { location.reload(); }, 500);
      })
      .catch(function (err) { toast(err.message); });
  }

  /* ---------- 行内事件 ---------- */

  var table = $("libTable");
  if (table) {
    table.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("[data-act]") : null;
      if (!btn) return;
      e.preventDefault();
      var tr = btn.closest("tr");
      if (!tr) return;
      if (btn.dataset.act === "edit") openEdit(tr);
      else if (btn.dataset.act === "del") doDelete(tr);
    });
  }
})();
