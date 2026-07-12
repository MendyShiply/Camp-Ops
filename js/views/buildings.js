(function () {
  var C = window.CampOps;
  var V = window.CampOpsViews;

  function roomInput(room, field, type) {
    var value = room[field] == null ? "" : room[field];
    return "<input data-room-field=\"" + C.esc(field) + "\" data-room-id=\"" + C.esc(room.id) + "\" type=\"" + type + "\" value=\"" + C.esc(value) + "\">";
  }

  function buildingSortKey(building) {
    var text = (building.label || building.id || "").toLowerCase();
    var match = text.match(/#(\d+)/) || String(building.id || "").match(/^(\d+)/);
    var number = match ? Number(match[1]) : 9999;
    var letter = String(building.id || "").replace(/^\d+/, "") || " ";
    return number.toString().padStart(4, "0") + "-" + letter;
  }

  function roomRow(room) {
    return "<tr>" +
      "<td><strong>" + C.esc(room.name) + "</strong>" +
        "<label class=\"inline-room-field\"><span>Bunk or family</span>" + roomInput(room, "assignment", "text") + "</label></td>" +
      "<td>" + roomInput(room, "beds", "number") + "</td>" +
      "<td>" + roomInput(room, "bunkBeds", "number") + "</td>" +
      "<td>" + roomInput(room, "toilets", "number") + "</td>" +
      "<td>" + roomInput(room, "sinks", "number") + "</td>" +
      "<td>" + roomInput(room, "showers", "number") + "</td>" +
      "<td><textarea data-room-field=\"notes\" data-room-id=\"" + C.esc(room.id) + "\">" + C.esc(room.notes || "") + "</textarea></td>" +
    "</tr>";
  }

  function buildingCard(building) {
    var rooms = (C.state.rooms || []).filter(function (room) { return room.buildingId === building.id; });
    var locationIds = {};
    locationIds[building.id] = true;
    rooms.forEach(function (room) { locationIds[room.id] = true; });
    var relatedRequests = (C.state.requests || []).filter(function (request) { return locationIds[request.locationId]; });
    var relatedTasks = (C.state.tasks || []).filter(function (task) { return locationIds[task.locationId]; });
    var estCost = relatedRequests.reduce(function (sum, request) { return sum + Number(request.costEstimate || 0); }, 0) +
      relatedTasks.reduce(function (sum, task) { return sum + Number(task.costEstimate || 0); }, 0);
    var actualCost = relatedTasks.reduce(function (sum, task) { return sum + Number(task.costActual || 0); }, 0);
    var totals = rooms.reduce(function (sum, room) {
      sum.beds += Number(room.beds || 0);
      sum.bunkBeds += Number(room.bunkBeds || 0);
      sum.toilets += Number(room.toilets || 0);
      sum.sinks += Number(room.sinks || 0);
      sum.showers += Number(room.showers || 0);
      return sum;
    }, { beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0 });

    return "<section class=\"panel building-card\">" +
      "<div class=\"section-head building-head\"><div><h3>" + C.esc(building.label + " - " + building.name) + "</h3><p class=\"muted\">" + C.esc(building.type || "Building") + (building.notes ? " - " + C.esc(building.notes) : "") + "</p></div>" +
      "<button class=\"btn secondary\" data-add-room=\"" + C.esc(building.id) + "\">Add room</button></div>" +
      "<div class=\"room-summary\">" +
        "<span><strong>" + rooms.length + "</strong> spaces</span>" +
        "<span><strong>" + totals.beds + "</strong> beds</span>" +
        "<span><strong>" + totals.bunkBeds + "</strong> bunk beds</span>" +
        "<span><strong>" + totals.toilets + "</strong> toilets</span>" +
        "<span><strong>" + totals.sinks + "</strong> sinks</span>" +
        "<span><strong>" + totals.showers + "</strong> showers</span>" +
        "<span><strong>" + relatedRequests.length + "</strong> requests</span>" +
        "<span><strong>$" + estCost.toFixed(0) + "</strong> estimated</span>" +
        "<span><strong>$" + actualCost.toFixed(0) + "</strong> actual</span>" +
      "</div>" +
      "<div class=\"table-wrap room-table\"><table><thead><tr><th>Room / apartment / assignment</th><th>Beds</th><th>Bunk beds</th><th>Toilets</th><th>Sinks</th><th>Showers</th><th>Notes</th></tr></thead><tbody>" +
        (rooms.length ? rooms.map(roomRow).join("") : "<tr><td colspan=\"7\" class=\"muted\">No rooms added yet.</td></tr>") +
      "</tbody></table></div>" +
    "</section>";
  }

  V.buildings = function () {
    var buildings = (C.state.buildings || []).slice().sort(function (a, b) {
      return buildingSortKey(a).localeCompare(buildingSortKey(b));
    });
    return "<div class=\"topbar page-hero\"><div><h2>Buildings & Rooms</h2><p class=\"muted\">Track which bunk or family is in each space, plus beds and bathroom fixtures.</p></div><button class=\"btn\" id=\"new-building\">Add building</button></div>" +
      "<section class=\"building-list\">" + buildings.map(buildingCard).join("") + "</section>";
  };
})();
