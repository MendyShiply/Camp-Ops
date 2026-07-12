(function () {
  var C = window.CampOps;
  var V = window.CampOpsViews;
  V.tasks = function () {
    return "<div class=\"topbar\"><div><h2>Tasks</h2><p class=\"muted\">Compact list. Click a task to open subtasks and chat.</p></div>" +
      (C.isAdmin() ? "<button class=\"btn\" id=\"new-task\">New task</button>" : "") +
      "</div><section class=\"panel\"><div class=\"task-row task-row-head\"><span>Task</span><span>Team</span><span>Time</span><span>Status</span></div>" +
      "<div class=\"compact-list\">" + V.taskRows(C.visibleTasks()) + "</div></section>";
  };
  V.taskDetail = function () {
    var task = C.taskById(C.selectedTaskId);
    if (!task) return "<div class=\"topbar\"><button class=\"btn secondary\" data-view=\"tasks\">Back</button></div><div class=\"empty\">Task not found.</div>";
    var statusClass = task.status === "done" ? "ok" : task.priority === "high" ? "danger" : "warn";
    return "<div class=\"topbar\"><div><h2>" + C.esc(task.title) + "</h2><p class=\"muted\">" + C.esc(C.locationName(task.locationId)) +
      " - " + C.esc(task.scheduleBlock || "Unscheduled") + " - due " + C.esc(task.dueTime || "none") + "</p></div>" +
      "<button class=\"btn secondary\" data-view=\"tasks\">Back to tasks</button></div>" +
      "<section class=\"task-detail\"><div class=\"panel\"><div class=\"task-title\"><h3>Task details</h3><span class=\"pill " + statusClass + "\">" + C.esc(task.status.replace("_", " ")) + "</span></div>" +
      "<p class=\"muted\">Assigned to " + C.esc(task.assignedTeam || "No team") + " - Priority " + C.esc(task.priority) + "</p><h4>Subtasks / Standard</h4><ul class=\"subtasks\">" +
      (task.subtasks || []).map(function (subtask) { return "<li>" + C.esc(subtask) + "</li>"; }).join("") + "</ul>" +
      "<div class=\"actions\"><button class=\"btn secondary\" data-task-action=\"progress\" data-task-id=\"" + task.id + "\">Start</button><button class=\"btn\" data-task-action=\"done\" data-task-id=\"" + task.id + "\">Done</button><button class=\"btn secondary\" data-task-action=\"problem\" data-task-id=\"" + task.id + "\">Problem</button></div></div>" +
      "<div class=\"panel\"><h3>Task chat</h3><div class=\"chat-thread\">" + (task.chat || []).map(V.messageHtml).join("") + "</div><div class=\"form-grid\"><div class=\"field full\"><textarea id=\"chat-text\" placeholder=\"Message, question, or note...\"></textarea></div><div class=\"field\"><input id=\"chat-file\" type=\"file\" accept=\"image/*\"></div><button class=\"btn\" data-task-action=\"chat\" data-task-id=\"" + task.id + "\">Send</button></div></div></section>";
  };
})();
