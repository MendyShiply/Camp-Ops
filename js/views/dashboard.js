(function () {
  var C = window.CampOps;
  var V = window.CampOpsViews;
  V.dashboard = function () {
    var tasks = C.visibleTasks();
    var open = tasks.filter(function (task) { return task.status !== "done"; }).length;
    var done = tasks.filter(function (task) { return task.status === "done"; }).length;
    var pending = C.state.requests.filter(function (request) { return request.status === "pending"; }).length;
    var supplies = C.state.supplyRequests.filter(function (request) { return ["closed", "delivered"].indexOf(request.status) < 0; }).length;
    return "<div class=\"topbar\"><div><h2>Today</h2><p class=\"muted\">" + new Date().toISOString().slice(0, 10) + " - " +
      (navigator.onLine ? "Online" : "Offline") + " - Supabase configured</p></div><button class=\"btn\" data-view=\"tasks\">Open tasks</button></div>" +
      "<div class=\"grid cols-4\"><div class=\"stat\"><span>Open tasks</span><strong>" + open + "</strong></div><div class=\"stat\"><span>Completed</span><strong>" + done + "</strong></div><div class=\"stat\"><span>Pending requests</span><strong>" + pending + "</strong></div><div class=\"stat\"><span>Supply/tool needs</span><strong>" + supplies + "</strong></div></div>" +
      "<section class=\"panel\" style=\"margin-top:14px\"><h3>High Priority</h3><div class=\"compact-list\">" +
        V.taskRows(tasks.filter(function (task) { return task.priority === "high" && task.status !== "done"; }).slice(0, 8)) +
      "</div></section>";
  };
})();
