(function () {
  var C = window.CampOps;
  window.CampOpsViews.schedule = function () {
    var blocks = ["8:00 AM", "10:30 AM", "Midday", "4:00 PM", "6:15 PM", "8:30 PM", "Unscheduled"];
    return "<div class=\"topbar\"><div><h2>Schedule</h2><p class=\"muted\">Move tasks by changing their schedule block.</p></div></div><div class=\"grid cols-3\">" + blocks.map(function (block) { var tasks = C.state.tasks.filter(function (task) { return (task.scheduleBlock || "Unscheduled") === block; }); return "<section class=\"panel\"><h3>" + block + "</h3><div class=\"grid\">" + (tasks.length ? tasks.map(function (task) { return "<div class=\"schedule-item\"><strong>" + C.esc(task.title) + "</strong><span class=\"muted\">" + C.esc(C.locationName(task.locationId)) + "</span>" + (C.isAdmin() ? "<select data-move-task=\"" + task.id + "\">" + blocks.map(function (option) { return "<option " + (option === block ? "selected" : "") + ">" + option + "</option>"; }).join("") + "</select>" : "") + "</div>"; }).join("") : "<div class=\"empty\">No tasks</div>") + "</div></section>"; }).join("") + "</div>";
  };
})();
