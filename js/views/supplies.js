(function () {
  var C = window.CampOps;
  var V = window.CampOpsViews;
  V.supplies = function () {
    return "<div class=\"topbar\"><div><h2>Supply & Tool Requests</h2><p class=\"muted\">Purchasing requests for missing, low-stock, or damaged items.</p></div><button class=\"btn secondary\" data-view=\"inventory\">Inventory</button></div>" +
      "<div class=\"grid cols-2\"><section class=\"panel\"><h3>Request item</h3><div class=\"form-grid\">" +
      "<div class=\"field\"><label>Category</label><select id=\"supply-category\"><option>Cleaning</option><option>Tools / Hardware</option><option>Machine / Outdoor</option><option>Repair Needed</option></select></div>" +
      "<div class=\"field\"><label>Item</label><select id=\"supply-item\"><option>Toilet paper</option><option>Paper towels</option><option>Garbage bags</option><option>Mop stick</option><option>Mop head</option><option>Broom</option><option>Screws</option><option>Tools</option><option>Gas</option><option>Oil</option><option>Other</option></select></div>" +
      "<div class=\"field\"><label>Location</label>" + V.locationSelect("supply-location") + "</div>" +
      "<div class=\"field\"><label>Urgency</label><select id=\"supply-urgency\"><option>normal</option><option>needed today</option><option>emergency</option></select></div>" +
      "<div class=\"field full\"><label>Note</label><textarea id=\"supply-note\"></textarea></div><button class=\"btn\" id=\"submit-supply\">Submit request</button></div></section>" +
      "<section class=\"panel\"><h3>Open requests</h3>" + (C.state.supplyRequests.length ? C.state.supplyRequests.map(function (request) {
        return "<div class=\"task-row supply-row\"><span><strong>" + C.esc(request.item) + "</strong><small>" + C.esc(request.note || "") + "</small></span><span>" + C.esc(C.locationName(request.locationId)) + "</span><span>" + C.esc(request.urgency) + "</span>" +
          (C.isAdmin() ? "<button class=\"btn secondary\" data-close-supply=\"" + request.id + "\">Delivered</button>" : "<span class=\"pill warn\">" + C.esc(request.status) + "</span>") + "</div>";
      }).join("") : "<div class=\"empty\">No supply requests yet.</div>") + "</section></div>";
  };

  V.inventory = function () {
    var lowItems = (C.state.inventory || []).filter(function (item) {
      return Number(item.quantity || 0) <= Number(item.lowAt || 0);
    }).length;
    return "<div class=\"topbar\"><div><h2>Inventory</h2><p class=\"muted\">" + lowItems + " low-stock items. Locations show where items are actually stored.</p></div><button class=\"btn\" data-view=\"supplies\">Supply requests</button></div><section class=\"inventory-list\">" +
      (C.state.inventory || []).map(function (item) {
        var isLow = Number(item.quantity || 0) <= Number(item.lowAt || 0);
        return "<article class=\"panel inventory-card\"><div class=\"inventory-head\"><div><h3>" + C.esc(item.item) + "</h3><p class=\"muted\">" + C.esc(item.category) + " - " + C.esc(item.notes || "") + "</p></div><span class=\"pill " + (isLow ? "danger" : "ok") + "\">" + (isLow ? "low stock" : "in stock") + "</span></div>" +
          "<div class=\"detail-grid inventory-numbers\"><div><span>Current</span><input data-inventory-field=\"quantity\" data-inventory-id=\"" + item.id + "\" type=\"number\" min=\"0\" value=\"" + Number(item.quantity || 0) + "\"><strong>" + C.esc(item.unit) + "</strong></div><div><span>Request when at</span><input data-inventory-field=\"lowAt\" data-inventory-id=\"" + item.id + "\" type=\"number\" min=\"0\" value=\"" + Number(item.lowAt || 0) + "\"><strong>" + C.esc(item.unit) + "</strong></div></div>" +
          "<h4>Stored in</h4><div class=\"stored-list\">" + (item.locations || []).map(function (spot) {
            return "<div><strong>" + C.esc(C.locationName(spot.locationId)) + "</strong><span>" + Number(spot.quantity || 0) + " " + C.esc(item.unit) + "</span><small>" + C.esc(spot.note || "") + "</small></div>";
          }).join("") + "</div><div class=\"actions\"><button class=\"btn secondary\" data-reorder-inventory=\"" + item.id + "\">Create purchase request</button></div></article>";
      }).join("") + "</section>";
  };
})();
