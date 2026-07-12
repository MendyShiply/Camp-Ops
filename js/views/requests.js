(function () {
  var C = window.CampOps;
  var V = window.CampOpsViews;
  V.requestForm = function () {
    var selected = new URLSearchParams(location.search).get("location") || "";
    return "<div class=\"form-grid\"><div class=\"field\"><label>Your name</label><input id=\"requester\" placeholder=\"Name\"></div><div class=\"field\"><label>Location</label>" + V.locationSelect("request-location", selected) + "</div><div class=\"field\"><label>Category</label><select id=\"request-category\"><option>Cleaning</option><option>Maintenance</option><option>Supplies</option><option>Setup / Moving</option><option>Safety</option><option>Other</option></select></div><div class=\"field\"><label>Urgency</label><select id=\"request-urgency\"><option>normal</option><option>needed today</option><option>urgent</option></select></div><div class=\"field full\"><label>Title</label><input id=\"request-title\" placeholder=\"Short description\"></div><div class=\"field full\"><label>Details</label><textarea id=\"request-details\" placeholder=\"What is needed?\"></textarea></div><button class=\"btn\" id=\"submit-request\">Submit request</button></div>";
  };
  V.requests = function () {
    return "<div class=\"topbar\"><div><h2>Requests</h2><p class=\"muted\">Staff/counselor requests wait here before becoming official tasks.</p></div><button class=\"btn\" id=\"open-request-form\">New request</button></div><section class=\"panel\">" + V.requestRows(C.state.requests) + "</section>";
  };
  V.requestRows = function (requests) {
    if (!requests.length) return "<div class=\"empty\">No requests yet.</div>";
    return "<div class=\"table-wrap\"><table><thead><tr><th>Request</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead><tbody>" + requests.map(function (request) {
      return "<tr><td><strong>" + C.esc(request.title) + "</strong><br><span class=\"muted\">" + C.esc(request.details || "") + "</span></td><td>" + C.esc(C.locationName(request.locationId)) + "</td><td><span class=\"pill warn\">" + C.esc(request.status) + "</span></td><td>" + (C.isAdmin() && request.status === "pending" ? "<button class=\"btn\" data-request-approve=\"" + request.id + "\">Approve</button> <button class=\"btn danger\" data-request-reject=\"" + request.id + "\">Reject</button>" : "") + "</td></tr>";
    }).join("") + "</tbody></table></div>";
  };
  V.requestOnly = function () {
    return "<div class=\"login-wrap\"><section class=\"login-card\"><h1>Submit Camp Request</h1><p class=\"muted\">Use this from a QR code by a bunk, kitchen, staff room, or office.</p>" + V.requestForm() + "</section></div>";
  };
})();
