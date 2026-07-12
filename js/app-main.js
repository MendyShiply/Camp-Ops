(function () {
  var C = window.CampOps;
  var V = window.CampOpsViews;
  var app = document.getElementById("app");

  function nav() {
    var items = [
      ["dashboard", "Dashboard"],
      ["tasks", "Tasks"],
      ["requests", "Requests"],
      ["supplies", "Supplies & Tools"],
      ["clock", "Clock In/Out"],
      ["schedule", "Schedule"],
      ["employees", "Employees"],
      ["buildings", "Buildings"]
    ];
    if (C.canManageUsers()) items.push(["users", "Users"]);
    if (C.isOwner()) items.push(["settings", "Settings"]);
    return items.filter(function (item) { return C.canAccess(item[0]); });
  }

  function renderView() {
    if (!C.canAccess(C.view)) C.view = C.me().role === "requester" ? "requestForm" : "dashboard";
    if (C.view === "tasks") return V.tasks();
    if (C.view === "taskDetail") return V.taskDetail();
    if (C.view === "requests") return V.requests();
    if (C.view === "supplies") return V.supplies();
    if (C.view === "clock") return V.clock();
    if (C.view === "schedule") return V.schedule();
    if (C.view === "employees") return V.employees();
    if (C.view === "buildings") return V.buildings();
    if (C.view === "users") return V.users();
    if (C.view === "settings") return V.settings();
    return V.dashboard();
  }

  function render() {
    if (!C.config.url || !C.config.anonKey) {
      app.innerHTML = V.setup();
      bind();
      return;
    }

    if (!C.isSignedIn()) {
      app.innerHTML = V.login();
      bind();
      return;
    }

    C.applyAuthUser();
    if (!C.hasAccessProfile()) {
      app.innerHTML = V.noAccess();
      bind();
      return;
    }

    C.hydrateSupabase();
    if (!C.canAccess(C.view)) C.view = C.me().role === "requester" ? "requestForm" : "dashboard";

    app.innerHTML = "<div class=\"mobile-top\"><strong>Camp Ops</strong><select id=\"mobile-view\">" +
      nav().map(function (item) { return "<option value=\"" + item[0] + "\" " + (C.view === item[0] ? "selected" : "") + ">" + item[1] + "</option>"; }).join("") +
      "</select></div><div class=\"app-shell\"><aside class=\"sidebar\"><div class=\"brand\"><div class=\"brand-mark\">CO</div><div><h1>Camp Ops</h1><p class=\"muted\">CGI Chai</p></div></div><nav class=\"nav\">" +
      nav().map(function (item) { return "<button class=\"" + (C.view === item[0] ? "active" : "") + "\" data-view=\"" + item[0] + "\">" + item[1] + "</button>"; }).join("") +
      "</nav><div class=\"user-card\"><strong>" + C.esc(C.me().name) + "</strong><p>" + C.esc(C.roleLabel(C.me().role)) + " - " + C.esc(C.me().team) + "</p>" +
      (C.canManageUsers() ? "<button class=\"btn secondary\" data-view=\"users\">Users</button>" : "") + "<button class=\"btn secondary\" id=\"logout\">Sign out</button></div></aside><main class=\"main\">" +
      renderView() + "</main></div>";
    bind();
  }

  function bind() {
    document.querySelectorAll("[data-view]").forEach(function (button) {
      button.addEventListener("click", function () {
        C.view = button.dataset.view;
        render();
      });
    });
    var mobileView = document.getElementById("mobile-view");
    if (mobileView) mobileView.addEventListener("change", function (event) {
      C.view = event.target.value;
      render();
    });
    document.querySelectorAll("[data-open-task]").forEach(function (button) {
      button.addEventListener("click", function () {
        C.selectedTaskId = button.dataset.openTask;
        C.view = "taskDetail";
        render();
      });
    });
    document.querySelectorAll("[data-drag-task]").forEach(function (card) {
      card.addEventListener("dragstart", function (event) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", card.dataset.dragTask);
        card.classList.add("dragging");
      });
      card.addEventListener("dragend", function () {
        card.classList.remove("dragging");
        document.querySelectorAll(".board-cards.drag-over").forEach(function (target) {
          target.classList.remove("drag-over");
        });
      });
    });
    document.querySelectorAll("[data-drop-status]").forEach(function (target) {
      target.addEventListener("dragover", function (event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        target.classList.add("drag-over");
      });
      target.addEventListener("dragleave", function () {
        target.classList.remove("drag-over");
      });
      target.addEventListener("drop", function (event) {
        event.preventDefault();
        moveTaskFromDrop(event.dataTransfer.getData("text/plain"), target.dataset.dropBlock, target.dataset.dropStatus);
      });
    });
    document.querySelectorAll("[data-task-action]").forEach(function (button) {
      button.addEventListener("click", function () { handleTaskAction(button); });
    });
    document.querySelectorAll("[data-task-cost]").forEach(function (input) {
      input.addEventListener("change", function () {
        var task = C.taskById(input.dataset.taskCost);
        if (!task) return;
        task.costActual = Math.max(0, Number(input.value || 0));
        C.save();
        render();
      });
    });
    var newTask = document.getElementById("new-task");
    if (newTask) newTask.addEventListener("click", createTask);
    var newEmployee = document.getElementById("new-employee");
    if (newEmployee) newEmployee.addEventListener("click", createEmployee);
    var newBuilding = document.getElementById("new-building");
    if (newBuilding) newBuilding.addEventListener("click", createBuilding);
    document.querySelectorAll("[data-add-room]").forEach(function (button) {
      button.addEventListener("click", function () { createRoom(button.dataset.addRoom); });
    });
    document.querySelectorAll("[data-room-field]").forEach(function (input) {
      input.addEventListener("change", function () { updateRoomField(input); });
    });
    var newUser = document.getElementById("new-user");
    if (newUser) newUser.addEventListener("click", createUser);
    var loginSubmit = document.getElementById("login-submit");
    if (loginSubmit) loginSubmit.addEventListener("click", login);
    var loginPassword = document.getElementById("login-password");
    if (loginPassword) loginPassword.addEventListener("keydown", function (event) {
      if (event.key === "Enter") login();
    });
    var logout = document.getElementById("logout");
    if (logout) logout.addEventListener("click", function () {
      C.signOut();
      C.view = "dashboard";
      render();
    });
    var openRequestForm = document.getElementById("open-request-form");
    if (openRequestForm) openRequestForm.addEventListener("click", function () {
      document.querySelector(".main").innerHTML = "<div class=\"topbar\"><h2>New request</h2></div><section class=\"panel\">" + V.requestForm() + "</section>";
      bind();
    });
    var submitRequest = document.getElementById("submit-request");
    if (submitRequest) submitRequest.addEventListener("click", createRequest);
    document.querySelectorAll("[data-request-approve]").forEach(function (button) {
      button.addEventListener("click", function () { approveRequest(button.dataset.requestApprove); });
    });
    document.querySelectorAll("[data-request-reject]").forEach(function (button) {
      button.addEventListener("click", async function () {
        var request = C.state.requests.find(function (item) { return item.id === button.dataset.requestReject; });
        request.status = "rejected";
        if (request.source === "staff_requests") await C.updateStaffRequestStatus(request.id, "rejected");
        C.save();
        render();
      });
    });
    var submitSupply = document.getElementById("submit-supply");
    if (submitSupply) submitSupply.addEventListener("click", createSupplyRequest);
    document.querySelectorAll("[data-close-supply]").forEach(function (button) {
      button.addEventListener("click", function () {
        var request = C.state.supplyRequests.find(function (item) { return item.id === button.dataset.closeSupply; });
        request.status = "delivered";
        C.save();
        render();
      });
    });
    var clockToggle = document.getElementById("clock-toggle");
    if (clockToggle) clockToggle.addEventListener("click", toggleClock);
    document.querySelectorAll("[data-move-task]").forEach(function (select) {
      select.addEventListener("change", function () {
        C.taskById(select.dataset.moveTask).scheduleBlock = select.value;
        C.save();
        render();
      });
    });
    document.querySelectorAll("[data-user]").forEach(function (button) {
      button.addEventListener("click", function () {
        C.currentUserId = button.dataset.user;
        localStorage.setItem("campOpsCurrentUser", C.currentUserId);
        C.view = "dashboard";
        render();
      });
    });
    document.querySelectorAll("[data-user-role]").forEach(function (select) {
      select.addEventListener("change", function () {
        var user = C.state.users.find(function (item) { return item.id === select.dataset.userRole; });
        if (!user) return;
        if (user.id === C.me().id && select.value !== "owner" && C.isOwner()) {
          if (!confirm("Change your own owner access?")) {
            select.value = user.role;
            return;
          }
        }
        user.role = select.value;
        C.save();
        render();
      });
    });
    var saveConfig = document.getElementById("save-config");
    if (saveConfig) saveConfig.addEventListener("click", function () {
      C.saveConfig({
        url: document.getElementById("supabase-url").value.trim().replace(/\/$/, ""),
        anonKey: document.getElementById("supabase-key").value.trim()
      });
      C.hydrateSupabase();
      render();
    });
    var resetLocal = document.getElementById("reset-local");
    if (resetLocal) resetLocal.addEventListener("click", function () {
      if (!confirm("Reset local demo data in this browser?")) return;
      localStorage.removeItem(C.STORAGE_KEY);
      location.reload();
    });
  }

  function moveTaskFromDrop(taskId, scheduleBlock, status) {
    var task = C.taskById(taskId);
    if (!task) return;
    task.scheduleBlock = scheduleBlock;
    task.status = status;
    if (status === "done") {
      task.completedBy = C.me().id;
      task.completedAt = new Date().toISOString();
    } else {
      delete task.completedBy;
      delete task.completedAt;
    }
    C.save();
    render();
  }

  async function handleTaskAction(button) {
    var task = C.taskById(button.dataset.taskId);
    if (!task) return;
    var action = button.dataset.taskAction;
    if (action === "progress") task.status = "in_progress";
    if (action === "problem") task.status = "blocked";
    if (action === "done") {
      task.status = "done";
      task.completedBy = C.me().id;
      task.completedAt = new Date().toISOString();
    }
    if (action === "chat") {
      var file = document.getElementById("chat-file").files[0];
      var text = document.getElementById("chat-text").value.trim();
      var imageData = file ? await C.fileToDataUrl(file) : "";
      if (!text && !imageData) return;
      task.chat.push({ id: C.uid("m"), authorId: C.me().id, authorName: C.me().name, text: text, imageData: imageData, createdAt: new Date().toISOString() });
    }
    C.save();
    render();
  }

  function createTask() {
    var title = prompt("Task title?");
    if (!title) return;
    C.state.tasks.unshift({ id: C.uid("t"), title: title, locationId: "outdoor", assignedTeam: "Men's Team", status: "open", priority: "normal", scheduleBlock: "Unscheduled", type: "one-time", subtasks: [], chat: [] });
    C.save();
    render();
  }

  function createEmployee() {
    var name = prompt("Employee display name?");
    if (!name) return;
    C.state.employees.push({ id: C.uid("emp"), userId: "", displayName: name, firstName: name, lastName: "", team: "", role: "Worker", payRate: "", email: "", phone: "", idPhoto: "", notes: "" });
    C.save();
    render();
  }

  function createBuilding() {
    var label = prompt("Building label? Example: Building #14");
    if (!label) return;
    var name = prompt("Building or house name?");
    if (!name) return;
    C.state.buildings.push({ id: C.uid("bldg"), label: label, name: name, type: "Building", notes: "" });
    C.save();
    render();
  }

  function createRoom(buildingId) {
    var name = prompt("Room or space name?");
    if (!name) return;
    C.state.rooms.push({ id: C.uid("room"), buildingId: buildingId, name: name, assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" });
    C.save();
    render();
  }

  function updateRoomField(input) {
    var room = (C.state.rooms || []).find(function (item) { return item.id === input.dataset.roomId; });
    if (!room) return;
    var field = input.dataset.roomField;
    if (["beds", "bunkBeds", "toilets", "sinks", "showers"].indexOf(field) >= 0) room[field] = Math.max(0, Number(input.value || 0));
    else room[field] = input.value;
    C.save();
    render();
  }

  function createUser() {
    var name = prompt("User display name?");
    if (!name) return;
    var email = prompt("Login email? This must match their Supabase Auth email.");
    if (!email) return;
      var role = prompt("Access level: owner, director, supervisor, secretary, employee, or requester", "employee") || "employee";
      role = role.toLowerCase().trim();
      if (role === "employee") role = "worker";
    if (!C.accessLevels.some(function (level) { return level.id === role; })) role = "worker";
    var team = prompt("Team?", role === "director" ? "Director" : "") || "";
    C.state.users.push({ id: C.uid("u"), name: name, email: email.trim(), role: role, team: team });
    C.save();
    render();
  }

  async function login() {
    var email = document.getElementById("login-email").value.trim();
    var password = document.getElementById("login-password").value;
    if (!email || !password) return alert("Please enter email and password.");
    try {
      await C.signIn(email, password);
      if (!C.canAccess(C.view)) C.view = C.me().role === "requester" ? "requestForm" : "dashboard";
      await C.hydrateSupabase();
      render();
    } catch (error) {
      alert(error.message || "Sign in failed.");
    }
  }

  async function createRequest() {
    var request = {
      id: C.uid("r"),
      title: document.getElementById("request-title").value.trim(),
      requester: document.getElementById("requester").value.trim() || C.me().name,
      locationId: document.getElementById("request-location").value,
      category: document.getElementById("request-category").value,
      urgency: document.getElementById("request-urgency").value,
      costEstimate: Number(document.getElementById("request-cost-estimate").value || 0),
      details: document.getElementById("request-details").value.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
      chat: []
    };
    if (!request.title) return alert("Please add a title.");
    if (C.view === "requestForm" && !C.isSignedIn()) {
      try {
        var submitted = await C.submitPublicRequest(request);
        if (!submitted) {
          C.state.requests.unshift(request);
          C.save();
        }
        alert("Request submitted.");
        render();
      } catch (error) {
        alert(error.message || "Could not submit request.");
      }
      return;
    }
    C.state.requests.unshift(request);
    C.save();
    alert("Request submitted.");
    if (C.view === "requestForm") render();
    else {
      C.view = "requests";
      render();
    }
  }

  async function approveRequest(requestId) {
    var request = C.state.requests.find(function (item) { return item.id === requestId; });
    request.status = "approved";
    if (request.source === "staff_requests") await C.updateStaffRequestStatus(request.id, "approved");
    C.state.tasks.unshift({
      id: C.uid("t"),
      title: request.title,
      locationId: request.locationId,
      assignedTeam: request.category === "Cleaning" ? "Ladies Team" : "Men's Team",
      status: "open",
      priority: request.urgency === "urgent" ? "high" : "normal",
      scheduleBlock: "Unscheduled",
      type: "request",
      requestId: request.id,
      category: request.category,
      costEstimate: Number(request.costEstimate || 0),
      costActual: 0,
      subtasks: [request.details].filter(Boolean),
      chat: [{ id: C.uid("m"), authorName: request.requester, text: request.details, createdAt: request.createdAt }]
    });
    C.save();
    render();
  }

  function createSupplyRequest() {
    C.state.supplyRequests.unshift({
      id: C.uid("s"),
      category: document.getElementById("supply-category").value,
      item: document.getElementById("supply-item").value,
      locationId: document.getElementById("supply-location").value,
      urgency: document.getElementById("supply-urgency").value,
      note: document.getElementById("supply-note").value.trim(),
      status: "requested",
      requestedBy: C.me().id,
      createdAt: new Date().toISOString()
    });
    C.save();
    render();
  }

  function toggleClock() {
    var open = C.state.timeEntries.find(function (entry) { return entry.userId === C.me().id && !entry.clockOut; });
    if (open) open.clockOut = new Date().toISOString();
    else C.state.timeEntries.push({ id: C.uid("time"), userId: C.me().id, clockIn: new Date().toISOString(), clockOut: null });
    C.save();
    render();
  }

  window.CampOpsApp = { render: render };
  if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("./sw.js").catch(function () {});
  render();
})();
