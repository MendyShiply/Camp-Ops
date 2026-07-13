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
    return "<div class=\"topbar\"><div><h2>Inventory</h2><p class=\"muted\">" + lowItems + " low-stock items. Search, sort, update quantities, and create purchasing requests from the sheet.</p></div><div class=\"actions\"><button class=\"btn\" id=\"new-inventory-item\">Add product</button><button class=\"btn secondary\" data-view=\"supplies\">Supply requests</button></div></div>" +
      "<section class=\"panel inventory-toolbar\"><div class=\"field\"><label>Search inventory</label><input id=\"inventory-search\" value=\"" + C.esc(C.inventorySearch || "") + "\" placeholder=\"Product, SKU, manufacturer, code, location...\"></div><button class=\"btn secondary\" data-inventory-sort=\"item\">A-Z</button><button class=\"btn secondary\" data-inventory-sort=\"quantity\">Qty</button><button class=\"btn secondary\" data-inventory-sort=\"location\">Location</button></section>" +
      "<section class=\"panel inventory-sheet\">" + inventoryTable() + "</section>" +
      inventoryDetail() + (C.inventoryModalOpen ? inventoryModal() : "");
  };

  function inventoryTable() {
    var items = filteredInventory();
    var columns = C.inventoryColumns || ["item", "manufacturer", "sku", "quantity", "lowAt", "location", "color", "size", "actions"];
    return "<div class=\"table-wrap\"><table class=\"inventory-table\"><thead><tr>" + columns.map(function (column, index) {
      return "<th><div class=\"inventory-th\"><button class=\"th-label\" data-inventory-sort=\"" + column + "\">" + C.esc(columnLabel(column)) + "</button><span><button class=\"mini-icon\" data-inventory-column-move=\"" + column + "\" data-direction=\"left\" " + (index === 0 ? "disabled" : "") + ">‹</button><button class=\"mini-icon\" data-inventory-column-move=\"" + column + "\" data-direction=\"right\" " + (index === columns.length - 1 ? "disabled" : "") + ">›</button></span></div></th>";
    }).join("") + "</tr></thead><tbody>" + (items.length ? items.map(function (item) {
      return "<tr data-open-inventory=\"" + item.id + "\">" + columns.map(function (column) {
        return "<td>" + inventoryCell(item, column) + "</td>";
      }).join("") + "</tr>";
    }).join("") : "<tr><td colspan=\"" + columns.length + "\"><div class=\"empty\">No inventory items match that search.</div></td></tr>") + "</tbody></table></div>";
  }

  function filteredInventory() {
    var query = String(C.inventorySearch || "").toLowerCase();
    var items = (C.state.inventory || []).filter(function (item) {
      if (!query) return true;
      return [item.item, item.category, item.manufacturer, item.sku, item.color, item.size, item.codes, item.notes, locationSummary(item)].join(" ").toLowerCase().indexOf(query) >= 0;
    });
    var sort = C.inventorySort || "item";
    var dir = C.inventorySortDir === "desc" ? -1 : 1;
    return items.sort(function (a, b) {
      var av = sort === "quantity" || sort === "lowAt" ? Number(a[sort] || 0) : String(sort === "location" ? locationSummary(a) : a[sort] || "").toLowerCase();
      var bv = sort === "quantity" || sort === "lowAt" ? Number(b[sort] || 0) : String(sort === "location" ? locationSummary(b) : b[sort] || "").toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }

  function columnLabel(column) {
    return { item: "Product", manufacturer: "Manufacturer", sku: "SKU", quantity: "Qty", lowAt: "Low at", location: "Location", color: "Color", size: "Size", actions: "Request" }[column] || column;
  }

  function locationSummary(item) {
    return (item.locations || []).map(function (spot) { return C.locationName(spot.locationId); }).join(", ");
  }

  function inventoryCell(item, column) {
    var isLow = Number(item.quantity || 0) <= Number(item.lowAt || 0);
    if (column === "item") return "<strong>" + C.esc(item.item) + "</strong><small>" + C.esc(item.category || "") + "</small>";
    if (column === "manufacturer") return C.esc(item.manufacturer || "");
    if (column === "sku") return "<code>" + C.esc(item.sku || "") + "</code>";
    if (column === "quantity") return "<input class=\"inline-number\" data-inventory-field=\"quantity\" data-inventory-id=\"" + item.id + "\" type=\"number\" min=\"0\" value=\"" + Number(item.quantity || 0) + "\"><small>" + C.esc(item.unit || "each") + "</small>";
    if (column === "lowAt") return "<input class=\"inline-number\" data-inventory-field=\"lowAt\" data-inventory-id=\"" + item.id + "\" type=\"number\" min=\"0\" value=\"" + Number(item.lowAt || 0) + "\"><span class=\"pill " + (isLow ? "danger" : "ok") + "\">" + (isLow ? "low" : "ok") + "</span>";
    if (column === "location") return C.esc(locationSummary(item));
    if (column === "color") return C.esc(item.color || "");
    if (column === "size") return C.esc(item.size || "");
    if (column === "actions") return "<div class=\"row-actions\"><button class=\"btn secondary\" data-reorder-inventory=\"" + item.id + "\">Request more</button><button class=\"btn secondary " + (item.autoRequest ? "active-toggle" : "") + "\" data-toggle-inventory-auto=\"" + item.id + "\">Automate</button></div>";
    return "";
  }

  function inventoryDetail() {
    var item = (C.state.inventory || []).find(function (entry) { return entry.id === C.selectedInventoryId; });
    if (!item) return "";
    return "<section class=\"panel inventory-detail\"><div class=\"topbar\"><div><h3>" + C.esc(item.item) + "</h3><p class=\"muted\">" + C.esc(item.manufacturer || "No manufacturer") + " - " + C.esc(item.sku || "No SKU") + "</p></div><button class=\"btn secondary\" data-close-inventory-detail=\"true\">Close</button></div>" +
      "<div class=\"detail-grid\"><div><span>Manufacturer</span><input data-inventory-field=\"manufacturer\" data-inventory-id=\"" + item.id + "\" value=\"" + C.esc(item.manufacturer || "") + "\"></div><div><span>SKU</span><input data-inventory-field=\"sku\" data-inventory-id=\"" + item.id + "\" value=\"" + C.esc(item.sku || "") + "\"></div><div><span>Color</span><input data-inventory-field=\"color\" data-inventory-id=\"" + item.id + "\" value=\"" + C.esc(item.color || "") + "\"></div><div><span>Size</span><input data-inventory-field=\"size\" data-inventory-id=\"" + item.id + "\" value=\"" + C.esc(item.size || "") + "\"></div><div><span>Request qty</span><input data-inventory-field=\"requestQty\" data-inventory-id=\"" + item.id + "\" type=\"number\" min=\"0\" value=\"" + Number(item.requestQty || 0) + "\"></div><div><span>Item link</span><input data-inventory-field=\"itemUrl\" data-inventory-id=\"" + item.id + "\" value=\"" + C.esc(item.itemUrl || "") + "\"></div><div><span>Codes</span><input data-inventory-field=\"codes\" data-inventory-id=\"" + item.id + "\" value=\"" + C.esc(item.codes || "") + "\"></div><div><span>Auto request</span><strong>" + (item.autoRequest ? "On" : "Off") + "</strong></div></div>" +
      (item.itemUrl ? "<p><a href=\"" + C.esc(item.itemUrl) + "\" target=\"_blank\" rel=\"noopener\">Open product link</a></p>" : "") +
      "<h4>Stored in</h4><div class=\"stored-list\">" + (item.locations || []).map(function (spot) { return "<div><strong>" + C.esc(C.locationName(spot.locationId)) + "</strong><span>" + Number(spot.quantity || 0) + " " + C.esc(item.unit) + "</span><small>" + C.esc(spot.note || "") + "</small></div>"; }).join("") + "</div><div class=\"actions\"><button class=\"btn\" data-reorder-inventory=\"" + item.id + "\">Request more</button></div></section>";
  }

  function inventoryModal() {
    return "<div class=\"modal-backdrop\"><section class=\"panel modal-card wide-modal\"><div class=\"topbar\"><div><h2>Add product</h2><p class=\"muted\">Create a new inventory row with purchasing and location details.</p></div><button class=\"btn secondary\" id=\"cancel-inventory-modal\">Cancel</button></div>" +
      "<div class=\"form-grid\"><div class=\"field\"><label>Product name</label><input id=\"inventory-new-item\" placeholder=\"Toilet paper\"></div>" +
      "<div class=\"field\"><label>Category</label><select id=\"inventory-new-category\"><option>Cleaning</option><option>Tools / Hardware</option><option>Machine / Outdoor</option><option>Kitchen</option><option>Office</option><option>Other</option></select></div>" +
      "<div class=\"field\"><label>Manufacturer</label><input id=\"inventory-new-manufacturer\"></div>" +
      "<div class=\"field\"><label>SKU</label><input id=\"inventory-new-sku\"></div>" +
      "<div class=\"field\"><label>Color</label><input id=\"inventory-new-color\"></div>" +
      "<div class=\"field\"><label>Size</label><input id=\"inventory-new-size\"></div>" +
      "<div class=\"field\"><label>Qty</label><input id=\"inventory-new-quantity\" type=\"number\" min=\"0\" value=\"0\"></div>" +
      "<div class=\"field\"><label>Unit</label><input id=\"inventory-new-unit\" placeholder=\"cases, boxes, each\"></div>" +
      "<div class=\"field\"><label>Low at</label><input id=\"inventory-new-low-at\" type=\"number\" min=\"0\" value=\"0\"></div>" +
      "<div class=\"field\"><label>Request qty</label><input id=\"inventory-new-request-qty\" type=\"number\" min=\"0\" value=\"1\"></div>" +
      "<div class=\"field full\"><label>Stored location</label>" + V.locationSelect("inventory-new-location") + "</div>" +
      "<div class=\"field full\"><label>Product link</label><input id=\"inventory-new-url\" placeholder=\"https://...\"></div>" +
      "<div class=\"field\"><label>Codes / tags</label><input id=\"inventory-new-codes\" placeholder=\"janitorial, bathrooms\"></div>" +
      "<label class=\"check-field\"><input id=\"inventory-new-auto\" type=\"checkbox\"> Auto request when low</label>" +
      "<div class=\"field full\"><label>Notes</label><textarea id=\"inventory-new-notes\"></textarea></div>" +
      "<div class=\"actions full\"><button class=\"btn\" id=\"save-inventory-item\">Save product</button><button class=\"btn secondary\" id=\"cancel-inventory-modal-2\">Cancel</button></div></div></section></div>";
  }
})();
