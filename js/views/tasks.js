(function () {
  var C = window.CampOps;
  var V = window.CampOpsViews;

  V.tasks = function () {
    var blocks = ["8:00 AM", "10:30 AM", "Midday", "4:00 PM", "6:15 PM", "8:30 PM", "Unscheduled"];
    var statuses = [
      ["open", "Open"],
      ["in_progress", "In Progress"],
      ["blocked", "Blocked"],
      ["done", "Done"]
    ];
    var tasks = C.visibleTasks();
    return "<div class=\"topbar page-hero\"><div><h2>Task Board</h2><p class=\"muted\">Favro-style board: time blocks stacked vertically, status columns running side to side. Blocked means the task is waiting on supplies, approval, access, information, or help before it can be finished.</p></div>" +
      (C.isAdmin() ? "<button class=\"btn\" id=\"new-task\">New task</button>" : "") +
      "</div><section class=\"favro-board\">" + blocks.map(function (block) {
        return "<div class=\"board-lane\"><div class=\"lane-title\"><strong>" + block + "</strong><span>" + tasks.filter(function (task) { return (task.scheduleBlock || "Unscheduled") === block; }).length + " tasks</span></div><div class=\"board-columns\">" +
          statuses.map(function (status) {
            var columnTasks = tasks.filter(function (task) { return (task.scheduleBlock || "Unscheduled") === block && task.status === status[0]; });
            return "<div class=\"board-column\"><div class=\"column-head\"><span>" + status[1] + "</span><b>" + columnTasks.length + "</b></div><div class=\"board-cards\" data-drop-block=\"" + C.esc(block) + "\" data-drop-status=\"" + status[0] + "\">" +
              (columnTasks.length ? columnTasks.map(boardCard).join("") : "<div class=\"empty mini\">No cards</div>") +
            "</div></div>";
          }).join("") + "</div></div>";
      }).join("") + "</section>";
  };

  function boardCard(task) {
    var statusClass = task.status === "done" ? "ok" : task.status === "blocked" ? "danger" : task.status === "in_progress" ? "warn" : "";
    return "<button class=\"board-card\" draggable=\"true\" data-drag-task=\"" + task.id + "\" data-open-task=\"" + task.id + "\"><strong>" + C.esc(task.title) + "</strong><span>" + C.esc(C.locationName(task.locationId)) + "</span><small>" + C.esc(task.assignedTeam || "No team") + " - due " + C.esc(task.dueTime || "none") + "</small><em class=\"pill " + statusClass + "\">" + C.esc(task.priority) + "</em></button>";
  }

  V.taskDetail = function () {
    var task = C.taskById(C.selectedTaskId);
    if (!task) return "<div class=\"topbar\"><button class=\"btn secondary\" data-view=\"tasks\">Back</button></div><div class=\"empty\">Task not found.</div>";
    var statusClass = task.status === "done" ? "ok" : task.priority === "high" ? "danger" : "warn";
    return "<section class=\"work-item\"><div class=\"topbar work-item-top\"><div><h2>" + C.esc(task.title) + "</h2><p class=\"muted\">" + C.esc(C.locationName(task.locationId)) +
      " - " + C.esc(task.scheduleBlock || "Unscheduled") + " - due " + C.esc(task.dueTime || "none") + "</p></div>" +
      "<button class=\"btn secondary\" data-view=\"tasks\">Back to board</button></div>" +
      "<div class=\"task-detail full-task-detail\">" +
        "<div class=\"panel task-primary\"><div class=\"task-title\"><h3>Task details</h3><span class=\"pill " + statusClass + "\">" + C.esc(task.status.replace("_", " ")) + "</span></div>" +
          "<div class=\"detail-grid\"><div><span>Team</span><strong>" + C.esc(task.assignedTeam || "No team") + "</strong></div><div><span>Priority</span><strong>" + C.esc(task.priority) + "</strong></div><div><span>Time</span><strong>" + C.esc(task.scheduleBlock || "Unscheduled") + "</strong></div><div><span>Due</span><strong>" + C.esc(task.dueTime || "none") + "</strong></div>" +
          "<div><span>Category</span><strong>" + C.esc(task.category || task.type || "Task") + "</strong></div><div><span>Estimated cost</span><strong>$" + Number(task.costEstimate || 0).toFixed(2) + "</strong></div><div><span>Actual cost</span><input data-task-cost=\"" + C.esc(task.id) + "\" type=\"number\" min=\"0\" step=\"0.01\" value=\"" + Number(task.costActual || 0) + "\"></div></div>" +
          "<h4>Subtasks / Standard</h4><ul class=\"subtasks check-standard\">" + (task.subtasks || []).map(function (subtask) { return "<li>" + C.esc(subtask) + "</li>"; }).join("") + "</ul>" +
          "<div class=\"actions\"><button class=\"btn secondary\" data-task-action=\"progress\" data-task-id=\"" + task.id + "\">Start</button>" +
          "<button class=\"btn\" data-task-action=\"done\" data-task-id=\"" + task.id + "\">Done</button>" +
          "<button class=\"btn secondary\" data-task-action=\"problem\" data-task-id=\"" + task.id + "\">Problem</button></div></div>" +
        "<div class=\"panel task-side\"><h3>Task chat</h3><div class=\"chat-thread\">" + (task.chat || []).map(V.messageHtml).join("") +
          "</div><div class=\"form-grid chat-composer\"><div class=\"field full\"><textarea id=\"chat-text\" placeholder=\"Message, question, or note...\"></textarea></div>" +
          "<div class=\"field chat-upload\"><input id=\"chat-file\" type=\"file\" accept=\"image/*\"></div>" +
          "<button class=\"btn\" data-task-action=\"chat\" data-task-id=\"" + task.id + "\">Send</button></div></div>" +
      "</div></section>";
  };
})();
