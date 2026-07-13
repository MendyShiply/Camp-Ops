(function () {
  var C = window.CampOps;
  var V = window.CampOpsViews;

  V.supplies = function () {
    var statuses = [
      ["requested", "Requested"],
      ["ordered", "Ordered"],
      ["shipped", "Shipped / In transit"],
      ["delivered", "Delivered"]
    ];
    return "<div class=\"topbar\"><div><h2>Supply & Tool Requests</h2><p class=\"muted\">Purchasing requests move from requested to ordered, shipped, and delivered.</p></div><button class=\"btn secondary\" data-view=\"inventory\">Inventory</button></div>" +
      "<section class=\"panel supply-entry\"><h3>Request item</h3><div class=\"form-grid\">" +
      "<div class=\"field\"><label>Category</label><select id=\"supply-category\"><option>Cleaning</option><option>Tools / Hardware</option><option>Machine / Outdoor</option><option>Kitchen</option><option>Office</option><option>Repair Needed</option><option>Other</option></select></div>" +
      "<div class=\"field\"><label>Item</label><input id=\"supply-item\" placeholder=\"Milwaukee drill, toilet paper, mop head...\"></div>" +
      "<div class=\"field\"><label>Quantity</label><input id=\"supply-quantity\" type=\"number\" min=\"1\" value=\"1\"></div>" +
      "<div class=\"field\"><label>Unit</label><input id=\"supply-unit\" placeholder=\"each, cases, boxes\"></div>" +
      "<div class=\"field\"><label>Location</label>" + V.locationSelect("supply-location") + "</div>" +
      "<div class=\"field\"><label>Urgency</label><select id=\"supply-urgency\"><option>normal</option><option>needed today</option><option>emergency</option></select></div>" +
      "<div class=\"field full\"><label>Note</label><textarea id=\"supply-note\"></textarea></div><button class=\"btn\" id=\"submit-supply\">Submit request</button></div></section>" +
      "<section class=\"favro-board purchase-board\"><div class=\"board-lane\"><div class=\"lane-title\"><strong>Purchasing flow</strong><span>" + (C.state.supplyRequests || []).length + " requests</span></div><div class=\"board-columns\">" + statuses.map(function (status) {
        var cards = (C.state.supplyRequests || []).filter(function (request) { return (request.status || "requested") === status[0]; });
        return "<div class=\"board-column\"><div class=\"column-head\"><span>" + status[1] + "</span><b>" + cards.length + "</b></div><div class=\"board-cards\" data-drop-supply-status=\"" + status[0] + "\">" +
          (cards.length ? cards.map(supplyCard).join("") : "<div class=\"empty mini\">Nothing here.</div>") +
        "</div></div>";
      }).join("") + "</div></div></section>";
  };

  function supplyCard(request) {
    var requestedBy = C.userById(request.requestedBy);
    var orderedBy = C.userById(request.orderedBy);
    return "<article class=\"board-card supply-card\" draggable=\"true\" data-drag-supply=\"" + request.id + "\">" +
      "<strong>" + C.esc(request.item) + "</strong><span>" + Number(request.quantity || 1) + " " + C.esc(request.unit || "each") + " - " + C.esc(C.locationName(request.locationId)) + "</span>" +
      "<small>" + C.esc(request.note || request.orderNote || "No note yet") + "</small>" +
      "<div class=\"card-meta\"><em class=\"pill warn\">" + C.esc(request.urgency || "normal") + "</em><span>" + C.esc(requestedBy ? requestedBy.name : "Requested") + "</span></div>" +
      "<div class=\"supply-card-fields\"><label>Vendor<input data-supply-field=\"vendor\" data-supply-id=\"" + request.id + "\" value=\"" + C.esc(request.vendor || "") + "\"></label><label>Tracking<input data-supply-field=\"trackingNumber\" data-supply-id=\"" + request.id + "\" value=\"" + C.esc(request.trackingNumber || "") + "\"></label></div>" +
      "<div class=\"actions\">" +
        (request.status !== "ordered" ? "<button class=\"btn secondary\" data-supply-status=\"" + request.id + "\" data-status=\"ordered\">Ordered</button>" : "") +
        (request.status !== "shipped" ? "<button class=\"btn secondary\" data-supply-status=\"" + request.id + "\" data-status=\"shipped\">Shipped</button>" : "") +
        (request.status !== "delivered" ? "<button class=\"btn secondary\" data-supply-status=\"" + request.id + "\" data-status=\"delivered\">Delivered</button>" : "") +
      "</div>" +
      (orderedBy ? "<small>Ordered by " + C.esc(orderedBy.name) + "</small>" : "") +
    "</article>";
  }

  V.inventory = function () {
    var lowItems = (C.state.inventory || []).filter(function (item) {
      return Number(totalQuantity(item)) <= Number(item.lowAt || 0);
    }).length;
    return "<div class=\"topbar\"><div><h2>Inventory</h2><p class=\"muted\">" + lowItems + " low-stock items. Search, sort, resize columns, reorder headers, and create purchase requests.</p></div><div class=\"actions\"><button class=\"btn\" id=\"new-inventory-item\">Add product</button><button class=\"btn secondary\" data-view=\"supplies\">Supply requests</button></div></div>" +
      "<section class=\"panel inventory-toolbar\"><div class=\"field\"><label>Search inventory</label><input id=\"inventory-search\" value=\"" + C.esc(C.inventorySearch || "") + "\" placeholder=\"Product, category, SKU, manufacturer, code, location...\"></div><button class=\"btn secondary\" data-inventory-sort=\"item\">A-Z</button><button class=\"btn secondary\" data-inventory-sort=\"totalQuantity\">Total qty</button><button class=\"btn secondary\" data-inventory-sort=\"location\">Location</button></section>" +
      "<section class=\"panel inventory-sheet\">" + inventoryTable() + "</section>" +
      inventoryDetail() + (C.inventoryModalOpen ? inventoryModal() : "") + (C.inventoryAutomationId ? automationModal() : "");
  };

  function inventoryTable() {
    var items = filteredInventory();
    var columns = C.inventoryColumns || ["item", "category", "manufacturer", "sku", "packageCount", "packageQty", "totalQuantity", "lowAt", "location", "actions"];
    return "<div class=\"table-wrap\"><table class=\"inventory-table\"><thead><tr>" + columns.map(function (column) {
      var width = Number((C.inventoryColumnWidths || {})[column] || defaultWidth(column));
      return "<th draggable=\"true\" data-inventory-column=\"" + column + "\" style=\"width:" + width + "px;min-width:" + Math.max(92, width) + "px\"><div class=\"inventory-th\"><button class=\"th-label\" data-inventory-sort=\"" + column + "\">" + C.esc(columnLabel(column)) + "</button><span class=\"column-grip\" data-resize-inventory-column=\"" + column + "\"></span></div></th>";
    }).join("") + "</tr></thead><tbody>" + (items.length ? items.map(function (item) {
      return "<tr data-open-inventory=\"" + item.id + "\">" + columns.map(function (column) {
        var width = Number((C.inventoryColumnWidths || {})[column] || defaultWidth(column));
        return "<td style=\"width:" + width + "px;min-width:" + Math.max(92, width) + "px\">" + inventoryCell(item, column) + "</td>";
      }).join("") + "</tr>";
    }).join("") : "<tr><td colspan=\"" + columns.length + "\"><div class=\"empty\">No inventory items match that search.</div></td></tr>") + "</tbody></table></div>";
  }

  function filteredInventory() {
    var query = String(C.inventorySearch || "").toLowerCase();
    var items = (C.state.inventory || []).filter(function (item) {
      if (!query) return true;
      return [item.item, item.category, item.manufacturer, item.sku, item.color, item.size, item.codes, item.notes, item.purchaseStore, locationSummary(item)].join(" ").toLowerCase().indexOf(query) >= 0;
    });
    var sort = C.inventorySort || "item";
    var dir = C.inventorySortDir === "desc" ? -1 : 1;
    return items.sort(function (a, b) {
      var numeric = ["quantity", "packageCount", "packageQty", "totalQuantity", "lowAt"].indexOf(sort) >= 0;
      var av = numeric ? Number(sort === "totalQuantity" ? totalQuantity(a) : a[sort] || 0) : String(sort === "location" ? locationSummary(a) : a[sort] || "").toLowerCase();
      var bv = numeric ? Number(sort === "totalQuantity" ? totalQuantity(b) : b[sort] || 0) : String(sort === "location" ? locationSummary(b) : b[sort] || "").toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }

  function defaultWidth(column) {
    return { item: 210, category: 150, manufacturer: 170, sku: 130, packageCount: 120, packageQty: 120, totalQuantity: 120, lowAt: 120, location: 240, actions: 210 }[column] || 140;
  }

  function columnLabel(column) {
    return { item: "Product", category: "Category", manufacturer: "Manufacturer", sku: "SKU", packageCount: "Cases / packs", packageQty: "Each per pack", totalQuantity: "Total qty", quantity: "Qty", lowAt: "Low at", location: "Location", color: "Color", size: "Size", purchaseDate: "Purchased", purchaseStore: "Store", actions: "Request" }[column] || column;
  }

  function totalQuantity(item) {
    return Number(item.packageCount || item.quantity || 0) * Math.max(1, Number(item.packageQty || 1));
  }

  function locationSummary(item) {
    return (item.locations || []).map(function (spot) { return C.locationName(spot.locationId); }).join(", ");
  }

  function inventoryCell(item, column) {
    var isLow = Number(totalQuantity(item)) <= Number(item.lowAt || 0);
    if (column === "item") return "<strong>" + C.esc(item.item) + "</strong><small>" + C.esc(item.category || "") + "</small>";
    if (column === "category") return C.esc(item.category || "");
    if (column === "manufacturer") return C.esc(item.manufacturer || "");
    if (column === "sku") return "<code>" + C.esc(item.sku || "") + "</code>";
    if (column === "packageCount") return "<input class=\"inline-number\" data-inventory-field=\"packageCount\" data-inventory-id=\"" + item.id + "\" type=\"number\" min=\"0\" value=\"" + Number(item.packageCount || item.quantity || 0) + "\"><small>" + C.esc(item.unit || "packs") + "</small>";
    if (column === "packageQty") return "<input class=\"inline-number\" data-inventory-field=\"packageQty\" data-inventory-id=\"" + item.id + "\" type=\"number\" min=\"1\" value=\"" + Math.max(1, Number(item.packageQty || 1)) + "\"><small>each</small>";
    if (column === "totalQuantity") return "<strong>" + totalQuantity(item) + "</strong><small>calculated</small>";
    if (column === "quantity") return "<input class=\"inline-number\" data-inventory-field=\"quantity\" data-inventory-id=\"" + item.id + "\" type=\"number\" min=\"0\" value=\"" + Number(item.quantity || 0) + "\"><small>" + C.esc(item.unit || "each") + "</small>";
    if (column === "lowAt") return "<input class=\"inline-number\" data-inventory-field=\"lowAt\" data-inventory-id=\"" + item.id + "\" type=\"number\" min=\"0\" value=\"" + Number(item.lowAt || 0) + "\"><span class=\"pill " + (isLow ? "danger" : "ok") + "\">" + (isLow ? "low" : "ok") + "</span>";
    if (column === "location") return C.esc(locationSummary(item));
    if (column === "color") return C.esc(item.color || "");
    if (column === "size") return C.esc(item.size || "");
    if (column === "purchaseDate") return C.esc(item.purchaseDate || "");
    if (column === "purchaseStore") return C.esc(item.purchaseStore || "");
    if (column === "actions") return "<div class=\"row-actions\"><button class=\"btn secondary\" data-reorder-inventory=\"" + item.id + "\">Request more</button><button class=\"btn secondary " + (item.autoRequest ? "active-toggle" : "") + "\" data-open-inventory-automation=\"" + item.id + "\">Automate</button></div>";
    return "";
  }

  function inventoryDetail() {
    var item = (C.state.inventory || []).find(function (entry) { return entry.id === C.selectedInventoryId; });
    if (!item) return "";
    return "<section class=\"panel inventory-detail\"><div class=\"topbar\"><div><h3>" + C.esc(item.item) + "</h3><p class=\"muted\">" + C.esc(item.manufacturer || "No manufacturer") + " - " + C.esc(item.sku || "No SKU") + "</p></div><button class=\"btn secondary\" data-close-inventory-detail=\"true\">Close</button></div>" +
      "<div class=\"detail-grid\"><div><span>Category</span><input data-inventory-field=\"category\" data-inventory-id=\"" + item.id + "\" value=\"" + C.esc(item.category || "") + "\"></div><div><span>Manufacturer</span><input data-inventory-field=\"manufacturer\" data-inventory-id=\"" + item.id + "\" value=\"" + C.esc(item.manufacturer || "") + "\"></div><div><span>SKU</span><input data-inventory-field=\"sku\" data-inventory-id=\"" + item.id + "\" value=\"" + C.esc(item.sku || "") + "\"></div><div><span>Color</span><input data-inventory-field=\"color\" data-inventory-id=\"" + item.id + "\" value=\"" + C.esc(item.color || "") + "\"></div><div><span>Size</span><input data-inventory-field=\"size\" data-inventory-id=\"" + item.id + "\" value=\"" + C.esc(item.size || "") + "\"></div><div><span>Cases / packs</span><input data-inventory-field=\"packageCount\" data-inventory-id=\"" + item.id + "\" type=\"number\" min=\"0\" value=\"" + Number(item.packageCount || item.quantity || 0) + "\"></div><div><span>Each per pack</span><input data-inventory-field=\"packageQty\" data-inventory-id=\"" + item.id + "\" type=\"number\" min=\"1\" value=\"" + Math.max(1, Number(item.packageQty || 1)) + "\"></div><div><span>Total qty</span><strong>" + totalQuantity(item) + "</strong></div><div><span>Request qty</span><input data-inventory-field=\"requestQty\" data-inventory-id=\"" + item.id + "\" type=\"number\" min=\"0\" value=\"" + Number(item.requestQty || 0) + "\"></div><div><span>Purchased date</span><input data-inventory-field=\"purchaseDate\" data-inventory-id=\"" + item.id + "\" type=\"date\" value=\"" + C.esc(item.purchaseDate || "") + "\"></div><div><span>Purchased by</span><input data-inventory-field=\"purchasedBy\" data-inventory-id=\"" + item.id + "\" value=\"" + C.esc(item.purchasedBy || "") + "\"></div><div><span>Store</span><input data-inventory-field=\"purchaseStore\" data-inventory-id=\"" + item.id + "\" value=\"" + C.esc(item.purchaseStore || "") + "\"></div><div><span>Item link</span><input data-inventory-field=\"itemUrl\" data-inventory-id=\"" + item.id + "\" value=\"" + C.esc(item.itemUrl || "") + "\"></div><div><span>Codes</span><input data-inventory-field=\"codes\" data-inventory-id=\"" + item.id + "\" value=\"" + C.esc(item.codes || "") + "\"></div><div><span>Auto request</span><strong>" + (item.autoRequest ? "On" : "Off") + "</strong></div></div>" +
      (item.itemUrl ? "<p><a href=\"" + C.esc(item.itemUrl) + "\" target=\"_blank\" rel=\"noopener\">Open product link</a></p>" : "") +
      "<h4>Stored in</h4><div class=\"stored-list\">" + (item.locations || []).map(function (spot) { return "<div><strong>" + C.esc(C.locationName(spot.locationId)) + "</strong><span>" + Number(spot.quantity || 0) + " " + C.esc(item.unit) + "</span><small>" + C.esc(spot.note || "") + "</small></div>"; }).join("") + "</div><div class=\"actions\"><button class=\"btn\" data-reorder-inventory=\"" + item.id + "\">Request more</button><button class=\"btn secondary\" data-open-inventory-automation=\"" + item.id + "\">Automation settings</button></div></section>";
  }

  function inventoryModal() {
    return "<div class=\"modal-backdrop\"><section class=\"panel modal-card wide-modal\"><div class=\"topbar\"><div><h2>Add product</h2><p class=\"muted\">Create a new inventory row with purchasing and location details.</p></div><button class=\"btn secondary\" id=\"cancel-inventory-modal\">Cancel</button></div>" +
      "<div class=\"form-grid\"><div class=\"field\"><label>Product name</label><input id=\"inventory-new-item\" placeholder=\"Milwaukee drill\"></div>" +
      "<div class=\"field\"><label>Category</label><select id=\"inventory-new-category\"><option>Cleaning</option><option>Tools / Hardware</option><option>Machine / Outdoor</option><option>Kitchen</option><option>Office</option><option>Other</option></select></div>" +
      "<div class=\"field\"><label>Manufacturer</label><input id=\"inventory-new-manufacturer\"></div><div class=\"field\"><label>SKU</label><input id=\"inventory-new-sku\"></div><div class=\"field\"><label>Color</label><input id=\"inventory-new-color\"></div><div class=\"field\"><label>Size</label><input id=\"inventory-new-size\"></div>" +
      "<div class=\"field\"><label>Cases / packs</label><input id=\"inventory-new-package-count\" type=\"number\" min=\"0\" value=\"0\"></div><div class=\"field\"><label>Each per pack</label><input id=\"inventory-new-package-qty\" type=\"number\" min=\"1\" value=\"1\"></div><div class=\"field\"><label>Unit</label><input id=\"inventory-new-unit\" placeholder=\"cases, boxes, each\"></div><div class=\"field\"><label>Low at total qty</label><input id=\"inventory-new-low-at\" type=\"number\" min=\"0\" value=\"0\"></div>" +
      "<div class=\"field\"><label>Request qty</label><input id=\"inventory-new-request-qty\" type=\"number\" min=\"0\" value=\"1\"></div><div class=\"field\"><label>Purchased date</label><input id=\"inventory-new-purchase-date\" type=\"date\"></div><div class=\"field\"><label>Purchased by</label><input id=\"inventory-new-purchased-by\"></div><div class=\"field\"><label>Store</label><input id=\"inventory-new-purchase-store\"></div>" +
      "<div class=\"field full\"><label>Stored location</label>" + V.locationSelect("inventory-new-location") + "</div><div class=\"field full\"><label>Product link</label><input id=\"inventory-new-url\" placeholder=\"https://...\"></div><div class=\"field\"><label>Codes / tags</label><input id=\"inventory-new-codes\" placeholder=\"janitorial, bathrooms\"></div><label class=\"check-field\"><input id=\"inventory-new-auto\" type=\"checkbox\"> Auto request when low</label><div class=\"field full\"><label>Notes</label><textarea id=\"inventory-new-notes\"></textarea></div><div class=\"actions full\"><button class=\"btn\" id=\"save-inventory-item\">Save product</button><button class=\"btn secondary\" id=\"cancel-inventory-modal-2\">Cancel</button></div></div></section></div>";
  }

  function automationModal() {
    var item = (C.state.inventory || []).find(function (entry) { return entry.id === C.inventoryAutomationId; });
    if (!item) return "";
    return "<div class=\"modal-backdrop\"><section class=\"panel modal-card\"><div class=\"topbar\"><div><h2>Automation</h2><p class=\"muted\">" + C.esc(item.item) + "</p></div><button class=\"btn secondary\" id=\"cancel-inventory-automation\">Cancel</button></div><div class=\"form-grid\">" +
      "<label class=\"check-field full\"><input id=\"automation-enabled\" type=\"checkbox\" " + (item.autoRequest ? "checked" : "") + "> Create a supply request when total qty is low</label>" +
      "<div class=\"field\"><label>Low at total qty</label><input id=\"automation-low-at\" type=\"number\" min=\"0\" value=\"" + Number(item.lowAt || 0) + "\"></div><div class=\"field\"><label>Request qty</label><input id=\"automation-request-qty\" type=\"number\" min=\"1\" value=\"" + Number(item.requestQty || 1) + "\"></div>" +
      "<div class=\"field full\"><label>Request from</label><select id=\"automation-user\">" + userOptions(item.autoRequestTo) + "</select></div>" +
      "<div class=\"actions full\"><button class=\"btn\" id=\"save-inventory-automation\">Save automation</button><button class=\"btn secondary\" id=\"cancel-inventory-automation-2\">Cancel</button></div></div></section></div>";
  }

  function userOptions(selectedId) {
    return (C.state.users || []).map(function (user) {
      return "<option value=\"" + user.id + "\" " + (user.id === selectedId ? "selected" : "") + ">" + C.esc(user.name) + "</option>";
    }).join("");
  }
})();
