(function () {
  var C = window.CampOps;
  window.CampOpsViews = {
    locationSelect: function (id, selected) {
      selected = selected || "";
      return "<select id=\"" + id + "\">" + C.state.locations.map(function (location) {
        return "<option value=\"" + location.id + "\" " + (location.id === selected ? "selected" : "") + ">" + C.esc(location.name) + "</option>";
      }).join("") + "</select>";
    },
    taskRows: function (tasks) {
      if (!tasks.length) return "<div class=\"empty\">Nothing here right now.</div>";
      return tasks.map(function (task) {
        var statusClass = task.status === "done" ? "ok" : task.priority === "high" ? "danger" : "warn";
        return "<button class=\"task-row\" data-open-task=\"" + task.id + "\">" +
          "<span><strong>" + C.esc(task.title) + "</strong><small>" + C.esc(C.locationName(task.locationId)) + "</small></span>" +
          "<span>" + C.esc(task.assignedTeam || "No team") + "</span>" +
          "<span>" + C.esc(task.scheduleBlock || "Unscheduled") + "</span>" +
          "<span class=\"pill " + statusClass + "\">" + C.esc(task.status.replace("_", " ")) + "</span>" +
        "</button>";
      }).join("");
    },
    messageHtml: function (message) {
      return "<div class=\"message\"><strong>" + C.esc(message.authorName) + "</strong> " +
        "<span class=\"muted\">" + new Date(message.createdAt).toLocaleString() + "</span>" +
        "<div>" + C.esc(message.text || "") + "</div>" +
        (message.imageData ? "<img src=\"" + message.imageData + "\" alt=\"Uploaded task photo\">" : "") +
      "</div>";
    }
  };
})();
