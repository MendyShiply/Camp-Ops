(function () {
  var C = window.CampOps;
  var V = window.CampOpsViews;
  V.dashboard = function () {
    var tasks = C.visibleTasks();
    var open = tasks.filter(function (task) { return task.status !== "done"; }).length;
    var done = tasks.filter(function (task) { return task.status === "done"; }).length;
    var blocked = tasks.filter(function (task) { return task.status === "blocked"; }).length;
    var progress = tasks.filter(function (task) { return task.status === "in_progress"; }).length;
    var pending = C.state.requests.filter(function (request) { return request.status === "pending"; }).length;
    var supplies = C.state.supplyRequests.filter(function (request) { return ["closed", "delivered"].indexOf(request.status) < 0; }).length;
    var notifications = C.myNotifications().slice(0, 4);
    var activeUserIds = {};
    C.state.timeEntries.filter(function (entry) { return !entry.clockOut; }).forEach(function (entry) {
      activeUserIds[entry.userId] = true;
    });
    var loggedIn = Object.keys(activeUserIds).length;
    var employeesTotal = Math.max((C.state.employees || []).length, 1);
    var loggedInDeg = Math.round(loggedIn / employeesTotal * 360);
    var mens = tasks.filter(function (task) { return task.assignedTeam === "Men's Team" && task.status !== "done"; }).length;
    var ladies = tasks.filter(function (task) { return task.assignedTeam === "Ladies Team" && task.status !== "done"; }).length;
    var otherTeam = tasks.filter(function (task) { return ["Men's Team", "Ladies Team"].indexOf(task.assignedTeam) < 0 && task.status !== "done"; }).length;
    var teamTotal = Math.max(mens + ladies + otherTeam, 1);
    var mensDeg = Math.round(mens / teamTotal * 360);
    var ladiesDeg = mensDeg + Math.round(ladies / teamTotal * 360);
    var approvedRequests = C.state.requests.filter(function (request) { return request.status === "approved"; }).length;
    var closedRequests = C.state.requests.filter(function (request) { return ["rejected", "closed", "done"].indexOf(request.status) >= 0; }).length;
    var requestTotal = Math.max(C.state.requests.length, 1);
    var pendingDeg = Math.round(pending / requestTotal * 360);
    var approvedDeg = pendingDeg + Math.round(approvedRequests / requestTotal * 360);
    var requestedSupplies = C.state.supplyRequests.filter(function (request) { return request.status === "requested"; }).length;
    var deliveredSupplies = C.state.supplyRequests.filter(function (request) { return request.status === "delivered"; }).length;
    var supplyTotal = Math.max(C.state.supplyRequests.length, 1);
    var requestedSupplyDeg = Math.round(requestedSupplies / supplyTotal * 360);
    var total = Math.max(tasks.length, 1);
    var doneDeg = Math.round(done / total * 360);
    var progressDeg = doneDeg + Math.round(progress / total * 360);
    var blockedDeg = progressDeg + Math.round(blocked / total * 360);

    return "<div class=\"topbar page-hero\"><div><h2>Operations Dashboard</h2><p class=\"muted\">" + new Date().toISOString().slice(0, 10) + " - " +
      (navigator.onLine ? "Online" : "Offline") + " - Supabase configured</p></div></div>" +
      "<section class=\"dashboard-grid\">" +
        "<div class=\"panel chart-panel\"><div class=\"donut\" style=\"--done:" + doneDeg + "deg; --progress:" + progressDeg + "deg; --blocked:" + blockedDeg + "deg\"><div class=\"donut-label\"><strong>" + done + "/" + tasks.length + "</strong><span>complete</span></div></div><div><h3>Task Mix</h3><p class=\"muted\">Live breakdown of today's operational work.</p><div class=\"legend\"><span><i class=\"ok-dot\"></i>Done " + done + "</span><span><i class=\"progress-dot\"></i>In progress " + progress + "</span><span><i class=\"blocked-dot\"></i>Blocked " + blocked + "</span><span><i class=\"open-dot\"></i>Open " + open + "</span></div></div></div>" +
        "<div class=\"metric-stack\"><div class=\"stat\"><span>Open tasks</span><strong>" + open + "</strong></div><div class=\"stat\"><span>Pending requests</span><strong>" + pending + "</strong></div><div class=\"stat\"><span>Supply/tool needs</span><strong>" + supplies + "</strong></div></div>" +
      "</section>" +
      "<section class=\"mini-chart-grid\">" +
        "<div class=\"panel mini-chart\"><div class=\"mini-donut two\" style=\"--a:" + loggedInDeg + "deg\"><strong>" + loggedIn + "</strong></div><h3>Employees Clocked In</h3><p class=\"muted\">" + loggedIn + " of " + (C.state.employees || []).length + " employee profiles are currently active.</p></div>" +
        "<div class=\"panel mini-chart\"><div class=\"mini-donut three\" style=\"--a:" + mensDeg + "deg; --b:" + ladiesDeg + "deg\"><strong>" + (mens + ladies + otherTeam) + "</strong></div><h3>Open Work By Team</h3><div class=\"legend compact\"><span><i class=\"blue-dot\"></i>Men " + mens + "</span><span><i class=\"accent-dot\"></i>Ladies " + ladies + "</span><span><i class=\"open-dot\"></i>Other " + otherTeam + "</span></div></div>" +
        "<div class=\"panel mini-chart\"><div class=\"mini-donut three\" style=\"--a:" + pendingDeg + "deg; --b:" + approvedDeg + "deg\"><strong>" + C.state.requests.length + "</strong></div><h3>Staff Requests</h3><div class=\"legend compact\"><span><i class=\"warn-dot\"></i>Pending " + pending + "</span><span><i class=\"ok-dot\"></i>Approved " + approvedRequests + "</span><span><i class=\"open-dot\"></i>Closed " + closedRequests + "</span></div></div>" +
        "<div class=\"panel mini-chart\"><div class=\"mini-donut two\" style=\"--a:" + requestedSupplyDeg + "deg\"><strong>" + C.state.supplyRequests.length + "</strong></div><h3>Supply Flow</h3><div class=\"legend compact\"><span><i class=\"warn-dot\"></i>Requested " + requestedSupplies + "</span><span><i class=\"ok-dot\"></i>Delivered " + deliveredSupplies + "</span></div></div>" +
      "</section>" +
      "<section class=\"panel notifications-panel\"><h3>Notifications</h3>" +
        (notifications.length ? notifications.map(function (note) {
          return "<div class=\"notification-row\"><strong>" + C.esc(note.title) + "</strong><span>" + C.esc(note.body || "") + "</span><small>" + new Date(note.createdAt).toLocaleString() + "</small></div>";
        }).join("") : "<div class=\"empty\">No notifications yet.</div>") +
      "</section>" +
      "<section class=\"panel board-preview\"><h3>High Priority</h3><div class=\"compact-list\">" +
        V.taskRows(tasks.filter(function (task) { return task.priority === "high" && task.status !== "done"; }).slice(0, 8)) +
      "</div></section>";
  };
})();
