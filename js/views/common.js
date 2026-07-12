(function () {
  var C = window.CampOps;
  window.CampOpsViews = {
    locationSelect: function (id, selected) {
      selected = selected || "";
      function sortKey(item) {
        var text = String(item.name || item.label || item.id || "").toLowerCase();
        var match = text.match(/#(\d+)/) || String(item.id || "").match(/^(\d+)/);
        var number = match ? Number(match[1]) : 9999;
        var letter = String(item.id || "").replace(/^\d+/, "") || " ";
        return number.toString().padStart(4, "0") + "-" + letter + "-" + text;
      }
      var locationOptions = C.state.locations.slice().sort(function (a, b) {
        return sortKey(a).localeCompare(sortKey(b));
      }).map(function (location) {
        return "<option value=\"" + location.id + "\" " + (location.id === selected ? "selected" : "") + ">" + C.esc(location.name) + "</option>";
      }).join("");
      var roomOptions = (C.state.rooms || []).slice().sort(function (a, b) {
        return sortKey({ id: a.buildingId, name: C.locationName(a.id) }).localeCompare(sortKey({ id: b.buildingId, name: C.locationName(b.id) }));
      }).map(function (room) {
        return "<option value=\"" + room.id + "\" " + (room.id === selected ? "selected" : "") + ">" + C.esc(C.locationName(room.id)) + "</option>";
      }).join("");
      return "<select id=\"" + id + "\"><optgroup label=\"Buildings and main spaces\">" + locationOptions + "</optgroup><optgroup label=\"Rooms and specific spaces\">" + roomOptions + "</optgroup></select>";
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
      var isImage = String(message.imageData || "").indexOf("data:image/") === 0;
      return "<div class=\"message\"><strong>" + C.esc(message.authorName) + "</strong> " +
        "<span class=\"muted\">" + new Date(message.createdAt).toLocaleString() + "</span>" +
        "<div>" + C.esc(message.text || "") + "</div>" +
        (message.imageData && isImage ? "<img src=\"" + message.imageData + "\" alt=\"Uploaded photo\">" : "") +
        (message.imageData && !isImage ? "<a class=\"attachment-link\" href=\"" + message.imageData + "\" download>Download attachment</a>" : "") +
      "</div>";
    }
  };
})();
