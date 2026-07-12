(function () {
  var C = window.CampOps;
  var V = window.CampOpsViews;
  var app = document.getElementById("app");
  function nav() {
    var items = [["dashboard", "Dashboard"], ["tasks", "Tasks"], ["requests", "Requests"], ["supplies", "Supplies & Tools"], ["clock", "Clock In/Out"], ["schedule", "Schedule"]];
    if (C.isAdmin()) items.push(["users", "Users"]);
    if (C.isOwner()) items.push(["settings", "Settings"]);
    return items;
  }
  function renderView() {
    if (C.view === "tasks") return V.tasks();
    if (C.view === "taskDetail") return V.taskDetail();
    if (C.view === "requests") return V.requests();
    if (C.view === "supplies") return V.supplies();
    if (C.view === "clock") return V.clock();
    if (C.view === "schedule") return V.schedule();
    if (C.view === "users") return V.users();
    if (C.view === "settings") return V.settings();
    return V.dashboard();
  }
  function render() {
    if (!C.config.url || !C.config.anonKey) { app.innerHTML = V.setup(); bind(); return; }
    C.hydrateSupabase();
    if (C.view === "requestForm") { app.innerHTML = V.requestOnly(); bind(); return; }
    app.innerHTML = "<div class=\"mobile-top\"><strong>Camp Ops</strong><select id=\"mobile-view\">" + nav().map(function (item) { return "<option value=\"" + item[0] + "\" " + (C.view === item[0] ? "selected" : "") + ">" + item[1] + "</option>"; }).join("") + "</select></div><div class=\"app-shell\"><aside class=\"sidebar\"><div class=\"brand\"><div class=\"brand-mark\">CO</div><div><h1>Camp Ops</h1><p class=\"muted\">GYC operations</p></div></div><nav class=\"nav\">" + nav().map(function (item) { return "<button class=\"" + (C.view === item[0] ? "active" : "") + "\" data-view=\"" + item[0] + "\">" + item[1] + "</button>"; }).join("") + "</nav><div class=\"user-card\"><strong>" + C.esc(C.me().name) + "</strong><p>" + C.esc(C.me().role) + " - " + C.esc(C.me().team) + "</p><button class=\"btn secondary\" data-view=\"users\">Switch user</button></div></aside><main class=\"main\">" + renderView() + "</main></div>";
    bind();
  }
  function bind() {
    document.querySelectorAll("[data-view]").forEach(function (button) { button.addEventListener("click", function () { C.view = button.dataset.view; render(); }); });
    var mobileView = document.getElementById("mobile-view");
    if (mobileView) mobileView.addEventListener("change", function (event) { C.view = event.target.value; render(); });
    document.querySelectorAll("[data-open-task]").forEach(function (button) { button.addEventListener("click", function () { C.selectedTaskId = button.dataset.openTask; C.view = "taskDetail"; render(); }); });
    document.querySelectorAll("[data-task-action]").forEach(function (button) { button.addEventListener("click", function () { handleTaskAction(button); }); });
    var newTask = document.getElementById("new-task"); if (newTask) newTask.addEventListener("click", createTask);
    var openRequestForm = document.getElementById("open-request-form"); if (openRequestForm) openRequestForm.addEventListener("click", function () { document.querySelector(".main").innerHTML = "<div class=\"topbar\"><h2>New request</h2></div><section class=\"panel\">" + V.requestForm() + "</section>"; bind(); });
    var submitRequest = document.getElementById("submit-request"); if (submitRequest) submitRequest.addEventListener("click", createRequest);
    document.querySelectorAll("[data-request-approve]").forEach(function (button) { button.addEventListener("click", function () { approveRequest(button.dataset.requestApprove); }); });
    document.querySelectorAll("[data-request-reject]").forEach(function (button) { button.addEventListener("click", function () { var request = C.state.requests.find(function (item) { return item.id === button.dataset.requestReject; }); request.status = "rejected"; C.save(); render(); }); });
    var submitSupply = document.getElementById("submit-supply"); if (submitSupply) submitSupply.addEventListener("click", createSupplyRequest);
    document.querySelectorAll("[data-close-supply]").forEach(function (button) { button.addEventListener("click", function () { var request = C.state.supplyRequests.find(function (item) { return item.id === button.dataset.closeSupply; }); request.status = "delivered"; C.save(); render(); }); });
    var clockToggle = document.getElementById("clock-toggle"); if (clockToggle) clockToggle.addEventListener("click", toggleClock);
    document.querySelectorAll("[data-move-task]").forEach(function (select) { select.addEventListener("change", function () { C.taskById(select.dataset.moveTask).scheduleBlock = select.value; C.save(); render(); }); });
    document.querySelectorAll("[data-user]").forEach(function (button) { button.addEventListener("click", function () { C.currentUserId = button.dataset.user; localStorage.setItem("campOpsCurrentUser", C.currentUserId); C.view = "dashboard"; render(); }); });
    var saveConfig = document.getElementById("save-config"); if (saveConfig) saveConfig.addEventListener("click", function () { C.saveConfig({ url: document.getElementById("supabase-url").value.trim().replace(/\/$/, ""), anonKey: document.getElementById("supabase-key").value.trim() }); C.hydrateSupabase(); render(); });
    var resetLocal = document.getElementById("reset-local"); if (resetLocal) resetLocal.addEventListener("click", function () { if (!confirm("Reset local demo data in this browser?")) return; localStorage.removeItem(C.STORAGE_KEY); location.reload(); });
  }
  async function handleTaskAction(button) {
    var task = C.taskById(button.dataset.taskId); if (!task) return;
    var action = button.dataset.taskAction;
    if (action === "progress") task.status = "in_progress";
    if (action === "problem") task.status = "blocked";
    if (action === "done") { task.status = "done"; task.completedBy = C.me().id; task.completedAt = new Date().toISOString(); }
    if (action === "chat") { var file = document.getElementById("chat-file").files[0]; var text = document.getElementById("chat-text").value.trim(); var imageData = file ? await C.fileToDataUrl(file) : ""; if (!text && !imageData) return; task.chat.push({ id: C.uid("m"), authorId: C.me().id, authorName: C.me().name, text: text, imageData: imageData, createdAt: new Date().toISOString() }); }
    C.save(); render();
  }
  function createTask() { var title = prompt("Task title?"); if (!title) return; C.state.tasks.unshift({ id: C.uid("t"), title: title, locationId: "outdoor", assignedTeam: "Men's Team", status: "open", priority: "normal", scheduleBlock: "Unscheduled", type: "one-time", subtasks: [], chat: [] }); C.save(); render(); }
  function createRequest() { var request = { id: C.uid("r"), title: document.getElementById("request-title").value.trim(), requester: document.getElementById("requester").value.trim() || C.me().name, locationId: document.getElementById("request-location").value, category: document.getElementById("request-category").value, urgency: document.getElementById("request-urgency").value, details: document.getElementById("request-details").value.trim(), status: "pending", createdAt: new Date().toISOString(), chat: [] }; if (!request.title) return alert("Please add a title."); C.state.requests.unshift(request); C.save(); alert("Request submitted."); if (C.view === "requestForm") render(); else { C.view = "requests"; render(); } }
  function approveRequest(requestId) { var request = C.state.requests.find(function (item) { return item.id === requestId; }); request.status = "approved"; C.state.tasks.unshift({ id: C.uid("t"), title: request.title, locationId: request.locationId, assignedTeam: request.category === "Cleaning" ? "Ladies Team" : "Men's Team", status: "open", priority: request.urgency === "urgent" ? "high" : "normal", scheduleBlock: "Unscheduled", type: "request", requestId: request.id, subtasks: [request.details].filter(Boolean), chat: [{ id: C.uid("m"), authorName: request.requester, text: request.details, createdAt: request.createdAt }] }); C.save(); render(); }
  function createSupplyRequest() { C.state.supplyRequests.unshift({ id: C.uid("s"), category: document.getElementById("supply-category").value, item: document.getElementById("supply-item").value, locationId: document.getElementById("supply-location").value, urgency: document.getElementById("supply-urgency").value, note: document.getElementById("supply-note").value.trim(), status: "requested", requestedBy: C.me().id, createdAt: new Date().toISOString() }); C.save(); render(); }
  function toggleClock() { var open = C.state.timeEntries.find(function (entry) { return entry.userId === C.me().id && !entry.clockOut; }); if (open) open.clockOut = new Date().toISOString(); else C.state.timeEntries.push({ id: C.uid("time"), userId: C.me().id, clockIn: new Date().toISOString(), clockOut: null }); C.save(); render(); }
  window.CampOpsApp = { render: render };
  if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("./sw.js").catch(function () {});
  render();
})();
