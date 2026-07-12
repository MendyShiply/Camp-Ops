(function () {
  var C = window.CampOps;
  var V = window.CampOpsViews;

  V.requestForm = function () {
    var selected = new URLSearchParams(location.search).get("location") || "";
    return "<div class=\"form-grid\">" +
      "<div class=\"field\"><label>Your name</label><input id=\"requester\" placeholder=\"Name\"></div>" +
      "<div class=\"field\"><label>Location</label>" + V.locationSelect("request-location", selected) + "</div>" +
      "<div class=\"field\"><label>Category</label><select id=\"request-category\"><option>Cleaning</option><option>Maintenance</option><option>Supplies</option><option>Setup / Moving</option><option>Safety</option><option>Other</option></select></div>" +
      "<div class=\"field\"><label>Urgency</label><select id=\"request-urgency\"><option>normal</option><option>needed today</option><option>urgent</option></select></div>" +
      "<div class=\"field\"><label>Estimated cost</label><input id=\"request-cost-estimate\" type=\"number\" min=\"0\" step=\"0.01\" placeholder=\"0.00\"></div>" +
      "<div class=\"field full\"><label>Title</label><input id=\"request-title\" placeholder=\"Short description\"></div>" +
      "<div class=\"field full\"><label>Details</label><textarea id=\"request-details\" placeholder=\"What is needed?\"></textarea></div>" +
      "<button class=\"btn\" id=\"submit-request\">Submit request</button></div>";
  };

  V.requests = function () {
    return "<div class=\"topbar\"><div><h2>Requests</h2><p class=\"muted\">Employee requests wait here before becoming official tasks.</p></div>" +
      "<button class=\"btn\" id=\"open-request-form\">New request</button></div><section class=\"panel share-panel\"><div><h3>Request entry</h3><p class=\"muted\">Anyone with Camp Ops access can submit a request while signed in.</p></div><button class=\"btn secondary\" data-view=\"requestForm\">Open request form</button></section><section class=\"panel\">" + V.requestRows(C.state.requests) + "</section>";
  };

  V.requestRows = function (requests) {
    if (!requests.length) return "<div class=\"empty\">No requests yet.</div>";
    return "<div class=\"request-card-list\">" +
      requests.map(function (request) {
        var statusClass = request.status === "complete" ? "ok" : request.status === "rejected" ? "danger" : request.status === "approved" ? "ok" : "warn";
        return "<button class=\"request-card\" data-open-request=\"" + request.id + "\"><span><strong>" + C.esc(request.title) + "</strong><small>" + C.esc(request.details || "No details yet") + "</small></span><span>" + C.esc(C.locationName(request.locationId)) + "</span><span>" + C.esc(request.category || "Other") + "</span><span class=\"pill " + statusClass + "\">" + C.esc(request.status) + "</span></button>";
      }).join("") + "</div>";
  };

  V.requestDetail = function () {
    var request = C.requestById(C.selectedRequestId);
    if (!request) return "<div class=\"topbar\"><button class=\"btn secondary\" data-view=\"requests\">Back</button></div><div class=\"empty\">Request not found.</div>";
    var statusClass = request.status === "complete" ? "ok" : request.status === "rejected" ? "danger" : request.status === "approved" ? "ok" : "warn";
    return "<section class=\"work-item\"><div class=\"topbar work-item-top\"><div><h2>" + C.esc(request.title) + "</h2><p class=\"muted\">" + C.esc(C.locationName(request.locationId)) + " - " + C.esc(request.category || "Other") + " - " + C.esc(request.urgency || "normal") + "</p></div><button class=\"btn secondary\" data-view=\"requests\">Back to requests</button></div>" +
      "<div class=\"task-detail full-task-detail\"><div class=\"panel task-primary\"><div class=\"task-title\"><h3>Request details</h3><span class=\"pill " + statusClass + "\">" + C.esc(request.status) + "</span></div>" +
        "<div class=\"detail-grid\"><div><span>Requester</span><strong>" + C.esc(request.requester || "Unknown") + "</strong></div><div><span>Category</span><strong>" + C.esc(request.category || "Other") + "</strong></div><div><span>Urgency</span><strong>" + C.esc(request.urgency || "normal") + "</strong></div><div><span>Created</span><strong>" + new Date(request.createdAt).toLocaleDateString() + "</strong></div></div>" +
        "<h4>Request</h4><p>" + C.esc(request.details || "No details yet.") + "</p>" +
        "<details class=\"cost-panel\"><summary>Cost and purchasing</summary><div class=\"detail-grid\"><div><span>Estimated cost</span><strong>$" + Number(request.costEstimate || 0).toFixed(2) + "</strong></div><div><span>Actual cost</span><strong>$" + Number(request.costActual || 0).toFixed(2) + "</strong></div></div></details>" +
        "<div class=\"actions\">" +
          (C.isAdmin() && request.status === "pending" ? "<button class=\"btn\" data-request-action=\"approve\" data-request-id=\"" + request.id + "\">Approve</button><button class=\"btn danger\" data-request-action=\"reject\" data-request-id=\"" + request.id + "\">Reject</button>" : "") +
          (C.isAdmin() && request.status !== "rejected" && !request.taskId ? "<button class=\"btn\" data-request-action=\"task\" data-request-id=\"" + request.id + "\">Create task</button>" : "") +
          (request.taskId ? "<button class=\"btn secondary\" data-open-task=\"" + request.taskId + "\">Open task</button>" : "") +
        "</div></div>" +
        "<div class=\"panel task-side\"><h3>Request conversation</h3><div class=\"chat-thread\">" + (request.chat || []).map(V.messageHtml).join("") + "</div><div class=\"form-grid chat-composer\"><div class=\"field full\"><textarea id=\"request-chat-text\" placeholder=\"Message, @mention, question, or note...\"></textarea></div><div class=\"field chat-upload\"><input id=\"request-chat-file\" type=\"file\" accept=\"image/*,.pdf,.doc,.docx\"></div><button class=\"btn\" data-request-action=\"chat\" data-request-id=\"" + request.id + "\">Send</button></div></div>" +
      "</div></section>";
  };

  V.requestOnly = function () {
    return "<div class=\"login-wrap\"><section class=\"login-card\"><h1>Submit Camp Request</h1><p class=\"muted\">Use this from a QR code by a bunk, kitchen, staff room, or office.</p>" +
      V.requestForm() + "</section></div>";
  };
})();
