/* 周课表：今天列 + 当前时段高亮。 */
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
})();
