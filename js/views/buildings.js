(function () {
  var C = window.CampOps;

  function buildingSortKey(building) {
    var text = (building.label || building.id || "").toLowerCase();
    var match = text.match(/#(\d+)/) || String(building.id || "").match(/^(\d+)/);
    var number = match ? Number(match[1]) : 9999;
    var letter = String(building.id || "").replace(/^\d+/, "") || " ";
    return number.toString().padStart(4, "0") + "-" + letter;
  }

  function buildingById(id) {
    return (C.state.buildings || []).find(function (building) { return building.id === id; }) || { id: id, label: "No building", name: "", type: "", notes: "" };
  }

  function buildingNumber(building) {
    var text = String(building.label || building.id || "");
    var match = text.match(/#\s*(\d+)/) || String(building.id || "").match(/^(\d+)/);
    return match ? match[1] : text.replace(/^Building\s*#?\s*/i, "");
  }

  function apartmentLetter(building) {
    var id = String(building.id || "");
    var match = id.match(/^\d+([A-Za-z]+)$/);
    if (match) return match[1].toUpperCase();
    var label = String(building.label || "");
    match = label.match(/#\s*\d+\s*([A-Za-z]+)$/);
    return match ? match[1].toUpperCase() : "";
  }

  function roomInput(room, field, type) {
    var value = room[field] == null ? "" : room[field];
    return "<input data-room-field=\"" + C.esc(field) + "\" data-room-id=\"" + C.esc(room.id) + "\" type=\"" + type + "\" value=\"" + C.esc(value) + "\">";
  }

  function rowSearchText(row) {
    return [
      row.building.label,
      row.building.name,
      row.building.notes,
      apartmentLetter(row.building),
      row.room.name,
      row.room.assignment,
      row.room.notes
    ].join(" ").toLowerCase();
  }

  function allRows() {
    var rooms = (C.state.rooms || []).map(function (room) {
      return { kind: "room", building: buildingById(room.buildingId), room: room };
    });
    var used = {};
    rooms.forEach(function (row) { used[row.building.id] = true; });
    (C.state.buildings || []).forEach(function (building) {
      if (!used[building.id]) {
        rooms.push({
          kind: "building",
          building: building,
          room: { id: "empty-" + building.id, buildingId: building.id, name: "", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" }
        });
      }
    });
    return rooms;
  }

  function filteredRows() {
    var query = String(C.buildingSearch || "").toLowerCase();
    var sort = C.buildingSort || "building";
    var dir = C.buildingSortDir === "desc" ? -1 : 1;
    return allRows().filter(function (row) {
      return !query || rowSearchText(row).indexOf(query) >= 0;
    }).sort(function (a, b) {
      var numeric = ["beds", "bunkBeds", "toilets", "sinks", "showers"].indexOf(sort) >= 0;
      var av = numeric ? Number(a.room[sort] || 0) : sortValue(a, sort);
      var bv = numeric ? Number(b.room[sort] || 0) : sortValue(b, sort);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return buildingSortKey(a.building).localeCompare(buildingSortKey(b.building));
    });
  }

  function sortValue(row, sort) {
    if (sort === "building") return buildingSortKey(row.building);
    if (sort === "name") return String(row.room.name || "").toLowerCase();
    if (sort === "assignment") return String(row.room.assignment || "").toLowerCase();
    if (sort === "apartment") return apartmentLetter(row.building).toLowerCase();
    return String(row.room.notes || row.building.notes || "").toLowerCase();
  }

  function totals(rows) {
    return rows.reduce(function (sum, row) {
      if (row.kind !== "room") return sum;
      sum.rooms += 1;
      sum.beds += Number(row.room.beds || 0);
      sum.bunkBeds += Number(row.room.bunkBeds || 0);
      sum.toilets += Number(row.room.toilets || 0);
      sum.sinks += Number(row.room.sinks || 0);
      sum.showers += Number(row.room.showers || 0);
      return sum;
    }, { rooms: 0, beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0 });
  }

  function header(column, label) {
    return "<th><button class=\"th-label\" data-building-sort=\"" + column + "\">" + C.esc(label) + "</button></th>";
  }

  function rowHtml(row) {
    var building = row.building;
    var room = row.room;
    var isEmpty = row.kind !== "room";
    return "<tr>" +
      "<td><strong>" + C.esc(buildingNumber(building)) + "</strong></td>" +
      "<td>" + C.esc(apartmentLetter(building)) + "</td>" +
      "<td><strong>" + C.esc(building.name || "") + "</strong></td>" +
      "<td>" + (isEmpty ? "<span class=\"muted\">No rooms yet</span>" : "<strong>" + C.esc(room.name) + "</strong>") + "</td>" +
      "<td>" + (isEmpty ? "" : roomInput(room, "assignment", "text")) + "</td>" +
      "<td>" + (isEmpty ? "" : roomInput(room, "beds", "number")) + "</td>" +
      "<td>" + (isEmpty ? "" : roomInput(room, "bunkBeds", "number")) + "</td>" +
      "<td>" + (isEmpty ? "" : roomInput(room, "toilets", "number")) + "</td>" +
      "<td>" + (isEmpty ? "" : roomInput(room, "sinks", "number")) + "</td>" +
      "<td>" + (isEmpty ? "" : roomInput(room, "showers", "number")) + "</td>" +
      "<td>" + (isEmpty ? C.esc(building.notes || "") : "<textarea data-room-field=\"notes\" data-room-id=\"" + C.esc(room.id) + "\">" + C.esc(room.notes || "") + "</textarea>") + "</td>" +
      "<td><button class=\"btn secondary\" data-add-room=\"" + C.esc(building.id) + "\">Add room</button></td>" +
    "</tr>";
  }

  window.CampOpsViews.buildings = function () {
    var rows = filteredRows();
    var sum = totals(rows);
    return "<div class=\"topbar page-hero\"><div><h2>Buildings & Rooms</h2><p class=\"muted\">Spreadsheet view for houses, apartments, rooms, beds, bathrooms, assignments, and notes.</p></div><button class=\"btn\" id=\"new-building\">Add building</button></div>" +
      "<section class=\"panel inventory-toolbar building-toolbar\"><div class=\"field\"><label>Search buildings</label><input id=\"building-search\" value=\"" + C.esc(C.buildingSearch || "") + "\" placeholder=\"Building, apartment, house, room, family, bunk, note...\"></div><button class=\"btn secondary\" data-building-sort=\"building\">A-Z</button><button class=\"btn secondary\" data-building-sort=\"beds\">Beds</button><button class=\"btn secondary\" data-building-sort=\"assignment\">Bunk / family</button></section>" +
      "<section class=\"room-summary building-summary\">" +
        "<span><strong>" + (C.state.buildings || []).length + "</strong> buildings</span>" +
        "<span><strong>" + sum.rooms + "</strong> rooms / spaces</span>" +
        "<span><strong>" + sum.beds + "</strong> beds</span>" +
        "<span><strong>" + sum.bunkBeds + "</strong> bunk beds</span>" +
        "<span><strong>" + sum.toilets + "</strong> toilets</span>" +
        "<span><strong>" + sum.sinks + "</strong> sinks</span>" +
        "<span><strong>" + sum.showers + "</strong> showers</span>" +
      "</section>" +
      "<section class=\"panel inventory-sheet building-sheet\"><div class=\"table-wrap\"><table class=\"inventory-table building-table\"><thead><tr>" +
        header("building", "Building #") +
        header("apartment", "Apartment / building") +
        header("name", "House / building name") +
        header("name", "Room / space") +
        header("assignment", "Bunk / family") +
        header("beds", "Beds") +
        header("bunkBeds", "Bunk beds") +
        header("toilets", "Toilets") +
        header("sinks", "Sinks") +
        header("showers", "Showers") +
        header("notes", "Notes") +
        "<th>Action</th>" +
      "</tr></thead><tbody>" + (rows.length ? rows.map(rowHtml).join("") : "<tr><td colspan=\"12\"><div class=\"empty\">No buildings or rooms match that search.</div></td></tr>") + "</tbody></table></div></section>";
  };
})();
