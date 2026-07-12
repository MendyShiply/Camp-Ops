const STORAGE_KEY = "campOpsState.v1";
const CONFIG_KEY = "campOpsSupabase.v1";

const seed = {
  users: [
    { id: "u-mendy", name: "Mendy", email: "", role: "owner", team: "Operations" },
    { id: "u-malka", name: "Malka Aisenbach", email: "", role: "director", team: "Director" },
    { id: "u-jenny", name: "Jenny", email: "", role: "worker", team: "Ladies Team" },
    { id: "u-michelle", name: "Michelle", email: "", role: "worker", team: "Ladies Team" },
    { id: "u-william", name: "William", email: "", role: "worker", team: "Men's Team" },
    { id: "u-miguel", name: "Miguel", email: "", role: "worker", team: "Men's Team" },
    { id: "u-chino", name: "Chino", email: "", role: "worker", team: "Men's Team" },
    { id: "u-george", name: "George", email: "", role: "worker", team: "Men's Team" }
  ],
  locations: [
    ["10c", "10C Medical Center", "Medical"], ["10d", "10D Kiddie Camp Room", "Kiddie Camp"],
    ["10e", "10E Zal / Baking Kitchen", "Kitchen"], ["11e", "11E Smaller Kiddie Camp Room", "Kiddie Camp"],
    ["13", "13 Main Building", "Main"], ["13-basement", "13 Basement / TC Shul", "Shul"],
    ["8", "8 GYC Shul", "Shul"], ["15", "15 7th Grade Gazebo Shul", "Shul"],
    ["16", "16 4th Grade Gazebo Shul", "Shul"], ["2", "2 Home Depot", "Storage"],
    ["12", "12 Waitros Lounge / Basketball Court", "Staff"], ["11f", "11F Admin Office", "Office"],
    ["outdoor", "Outdoor Grounds / Trash Cans", "Outdoor"], ["bonfire", "Picnic Tables / Bonfire Area", "Outdoor"]
  ].map(([id, name, category]) => ({ id, name, category })),
  tasks: [
    task("t-med-am", "Morning clean before nurse hours", "10c", "Ladies Team", "8:00 AM", "9:15 AM", "high", ["Empty garbage", "Replace bag", "Wipe counters and high-touch surfaces", "Sweep or spot mop", "Restock restroom if needed"]),
    task("t-public-am", "Public areas morning reset", "13", "Men's Team", "8:00 AM", "9:30 AM", "high", ["Dining room readiness check", "TC Shul reset", "GYC Shul check", "7th Grade Shul check", "4th Grade Shul check"]),
    task("t-outdoor-am", "Outdoor trash and grounds route", "outdoor", "Men's Team", "8:00 AM", "10:00 AM", "normal", ["Empty outdoor cans", "Replace bags", "Walk benches by buildings 4, 6, 8, 9", "Check tennis courts", "Check basketball court", "Bring trash to dumpster"]),
    task("t-bunks", "Bunk rooms and bathrooms daily round", "13", "Ladies Team", "10:30 AM", "2:00 PM", "normal", ["Replenish toilet paper", "Change garbage bags", "Quick clean bathrooms", "Do not enter while campers are sleeping", "Report repairs or missing supplies"]),
    task("t-zal-mid", "Zal midday trash/spill check", "10e", "Ladies Team", "Midday", "1:30 PM", "normal", ["Change garbage if full", "Remove food garbage", "Wipe major spills only", "Reset urgent messes"]),
    task("t-kiddie-615", "Kiddie Camp rooms evening clean", "10d", "Ladies Team", "6:15 PM", "6:45 PM", "high", ["Clean 10D", "Clean 11E", "Empty garbage", "Replace bags", "Pick up toys/supplies", "Wipe surfaces", "Sweep", "Clean/restock 10D restroom"]),
    task("t-zal-close", "Zal full end-of-day clean", "10e", "Ladies Team", "8:30 PM", "9:00 PM", "high", ["Empty garbage", "Wipe counters, tables, sinks", "Sweep", "Mop if needed", "Remove leftover food", "Put supplies away"]),
    task("t-dining-close", "Final dining room reset", "13", "Men's Team", "8:30 PM", "9:00 PM", "high", ["Empty garbage", "Reset tables/chairs", "Sweep obvious messes", "Check restrooms", "Prepare for morning"])
  ],
  requests: [{ id: "r-demo", title: "Sample staff request: build shelf", requester: "Counselor", locationId: "11f", category: "Maintenance", urgency: "normal", details: "Pick up shelf from admin office, deliver to family house, and build it.", status: "pending", createdAt: new Date().toISOString(), chat: [] }],
  supplyRequests: [],
  timeEntries: []
};

function task(id, title, locationId, assignedTeam, scheduleBlock, dueTime, priority, subtasks) {
  return { id, title, locationId, assignedTeam, scheduleBlock, dueTime, priority, status: "open", type: "recurring", subtasks, chat: [] };
}

let state = loadState();
let config = JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
let currentUserId = localStorage.getItem("campOpsCurrentUser") || "u-mendy";
let view = new URLSearchParams(location.search).has("request") ? "requestForm" : "dashboard";
let remoteLoaded = false;
const app = document.getElementById("app");

function loadState() { return { ...structuredClone(seed), ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")) }; }
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); syncSupabase(); }
function saveConfig(next) { config = next; localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); }
function me() { return state.users.find((u) => u.id === currentUserId) || state.users[0]; }
function isAdmin() { return ["owner", "director", "supervisor"].includes(me().role); }
function isOwner() { return me().role === "owner"; }
function id(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function loc(id) { return state.locations.find((l) => l.id === id)?.name || id || "No location"; }
function esc(v) { return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c])); }
function visibleTasks() { return isAdmin() ? state.tasks : state.tasks.filter((t) => t.assignedTeam === me().team || t.assignedUserId === me().id); }

function render() {
  if (!config.url || !config.anonKey) return renderSetup();
  hydrate();
  if (view === "requestForm") return renderRequestOnly();
  app.innerHTML = `<div class="mobile-top"><strong>Camp Ops</strong><select id="mobile-view">${nav().map((n) => `<option value="${n.id}" ${view === n.id ? "selected" : ""}>${n.label}</option>`).join("")}</select></div><div class="app-shell"><aside class="sidebar"><div class="brand"><div class="brand-mark">CO</div><div><h1>Camp Ops</h1><p class="muted">GYC operations</p></div></div><nav class="nav">${nav().map((n) => `<button class="${view === n.id ? "active" : ""}" data-view="${n.id}">${n.label}</button>`).join("")}</nav><div class="user-card"><strong>${me().name}</strong><p>${me().role} - ${me().team}</p><button class="btn secondary" data-view="users">Switch user</button></div></aside><main class="main">${renderView()}</main></div>`;
  bindCommon();
}

function nav() {
  const items = [{ id: "dashboard", label: "Dashboard" }, { id: "tasks", label: "Tasks" }, { id: "requests", label: "Requests" }, { id: "supplies", label: "Supplies & Tools" }, { id: "clock", label: "Clock In/Out" }, { id: "schedule", label: "Schedule" }];
  if (isAdmin()) items.push({ id: "users", label: "Users" });
  if (isOwner()) items.push({ id: "settings", label: "Settings" });
  return items;
}

function renderView() {
  if (view === "tasks") return tasksView();
  if (view === "requests") return requestsView();
  if (view === "supplies") return suppliesView();
  if (view === "clock") return clockView();
  if (view === "schedule") return scheduleView();
  if (view === "users") return usersView();
  if (view === "settings") return settingsView();
  return dashboardView();
}

function dashboardView() {
  const tasks = visibleTasks(), open = tasks.filter((t) => t.status !== "done").length, done = tasks.filter((t) => t.status === "done").length;
  return `<div class="topbar"><div><h2>Today</h2><p class="muted">${new Date().toISOString().slice(0, 10)} - ${navigator.onLine ? "Online" : "Offline"} - Supabase configured</p></div><button class="btn" data-view="tasks">Open tasks</button></div><div class="grid cols-4"><div class="stat"><span>Open tasks</span><strong>${open}</strong></div><div class="stat"><span>Completed</span><strong>${done}</strong></div><div class="stat"><span>Pending requests</span><strong>${state.requests.filter((r) => r.status === "pending").length}</strong></div><div class="stat"><span>Supply/tool needs</span><strong>${state.supplyRequests.filter((r) => !["closed", "delivered"].includes(r.status)).length}</strong></div></div><div class="grid cols-2" style="margin-top:14px"><section class="panel"><h3>High Priority</h3><div class="grid">${taskCards(tasks.filter((t) => t.priority === "high" && t.status !== "done").slice(0, 5))}</div></section><section class="panel"><h3>Needs Approval</h3>${requestRows(state.requests.filter((r) => r.status === "pending").slice(0, 5))}</section></div>`;
}

function tasksView() { return `<div class="topbar"><div><h2>Tasks</h2><p class="muted">Team work can be checked off by anyone on the assigned team.</p></div>${isAdmin() ? `<button class="btn" id="new-task">New task</button>` : ""}</div><div class="grid" id="task-list">${taskCards(visibleTasks())}</div>`; }
function taskCards(tasks) { if (!tasks.length) return `<div class="empty">Nothing here right now.</div>`; return tasks.map((t) => `<article class="task-card" data-task-id="${t.id}"><div class="task-title"><div><h4>${esc(t.title)}</h4><div class="task-meta"><span>${esc(loc(t.locationId))}</span><span>${esc(t.scheduleBlock || "Unscheduled")}</span><span>due ${esc(t.dueTime || "none")}</span></div></div><span class="pill ${t.status === "done" ? "ok" : t.priority === "high" ? "danger" : "warn"}">${esc(t.status.replace("_", " "))}</span></div><div class="task-meta"><span>Assigned: ${esc(t.assignedTeam || "No team")}</span><span>Priority: ${esc(t.priority)}</span></div><ul class="subtasks">${(t.subtasks || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ul><div class="actions"><button class="btn secondary" data-action="progress">Start</button><button class="btn" data-action="done">Done</button><button class="btn secondary" data-action="problem">Problem</button></div>${taskChat(t)}</article>`).join(""); }
function taskChat(t) { return `<div class="chat"><strong>Task chat</strong>${(t.chat || []).slice(-3).map(messageHtml).join("")}<div class="form-grid"><div class="field full"><textarea placeholder="Message, question, or note..." data-chat-text="${t.id}"></textarea></div><div class="field"><input type="file" accept="image/*" data-chat-file="${t.id}"></div><button class="btn" data-action="chat">Send</button></div></div>`; }
function messageHtml(m) { return `<div class="message"><strong>${esc(m.authorName)}</strong> <span class="muted">${new Date(m.createdAt).toLocaleString()}</span><div>${esc(m.text || "")}</div>${m.imageData ? `<img src="${m.imageData}" alt="Uploaded task photo">` : ""}</div>`; }

function requestsView() { return `<div class="topbar"><div><h2>Requests</h2><p class="muted">Staff/counselor requests wait here before becoming official tasks.</p></div><button class="btn" id="open-request-form">New request</button></div><section class="panel">${requestRows(state.requests)}</section>`; }
function requestRows(reqs) { if (!reqs.length) return `<div class="empty">No requests yet.</div>`; return `<div class="table-wrap"><table><thead><tr><th>Request</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead><tbody>${reqs.map((r) => `<tr><td><strong>${esc(r.title)}</strong><br><span class="muted">${esc(r.details || "")}</span></td><td>${esc(loc(r.locationId))}</td><td><span class="pill ${r.status === "approved" ? "ok" : r.status === "rejected" ? "danger" : "warn"}">${esc(r.status)}</span></td><td>${isAdmin() && r.status === "pending" ? `<button class="btn" data-request-approve="${r.id}">Approve</button> <button class="btn danger" data-request-reject="${r.id}">Reject</button>` : ""}</td></tr>`).join("")}</tbody></table></div>`; }
function requestForm() { const selected = new URLSearchParams(location.search).get("location") || ""; return `<div class="form-grid"><div class="field"><label>Your name</label><input id="requester" placeholder="Name"></div><div class="field"><label>Location</label>${locationSelect("request-location", selected)}</div><div class="field"><label>Category</label><select id="request-category"><option>Cleaning</option><option>Maintenance</option><option>Supplies</option><option>Setup / Moving</option><option>Safety</option><option>Other</option></select></div><div class="field"><label>Urgency</label><select id="request-urgency"><option>normal</option><option>needed today</option><option>urgent</option></select></div><div class="field full"><label>Title</label><input id="request-title" placeholder="Short description"></div><div class="field full"><label>Details</label><textarea id="request-details" placeholder="What is needed?"></textarea></div><button class="btn" id="submit-request">Submit request</button></div>`; }
function renderRequestOnly() { app.innerHTML = `<div class="login-wrap"><section class="login-card"><h1>Submit Camp Request</h1><p class="muted">Use this from a QR code by a bunk, kitchen, staff room, or office.</p>${requestForm()}</section></div>`; document.getElementById("submit-request")?.addEventListener("click", submitRequest); }

function suppliesView() { return `<div class="topbar"><div><h2>Supply & Tool Requests</h2><p class="muted">Cleaning supplies, hardware, gas, oil, tools, and repair needs.</p></div></div><div class="grid cols-2"><section class="panel"><h3>Request item</h3><div class="form-grid"><div class="field"><label>Category</label><select id="supply-category"><option>Cleaning</option><option>Tools / Hardware</option><option>Machine / Outdoor</option><option>Repair Needed</option></select></div><div class="field"><label>Item</label><select id="supply-item"><option>Toilet paper</option><option>Paper towels</option><option>Garbage bags</option><option>Mop stick</option><option>Mop head</option><option>Broom</option><option>Screws</option><option>Tools</option><option>Gas</option><option>Oil</option><option>Other</option></select></div><div class="field"><label>Location</label>${locationSelect("supply-location")}</div><div class="field"><label>Urgency</label><select id="supply-urgency"><option>normal</option><option>needed today</option><option>emergency</option></select></div><div class="field full"><label>Note</label><textarea id="supply-note"></textarea></div><button class="btn" id="submit-supply">Submit request</button></div></section><section class="panel"><h3>Open requests</h3>${state.supplyRequests.length ? `<div class="grid">${state.supplyRequests.map((r) => `<div class="task-card"><div class="task-title"><h4>${esc(r.item)}</h4><span class="pill warn">${esc(r.status)}</span></div><div class="task-meta">${esc(r.category)} - ${esc(loc(r.locationId))} - ${esc(r.urgency)}</div><p>${esc(r.note || "")}</p>${isAdmin() ? `<button class="btn secondary" data-close-supply="${r.id}">Mark delivered/closed</button>` : ""}</div>`).join("")}</div>` : `<div class="empty">No supply requests yet.</div>`}</section></div>`; }

function clockView() { const open = state.timeEntries.find((e) => e.userId === me().id && !e.clockOut); const rows = state.timeEntries.filter((e) => isAdmin() || e.userId === me().id).slice().reverse(); return `<div class="topbar"><div><h2>Clock In/Out</h2><p class="muted">Payroll uses individual clock records.</p></div><button class="btn ${open ? "danger" : ""}" id="clock-toggle">${open ? "Clock out" : "Clock in"}</button></div><section class="panel"><div class="table-wrap"><table><thead><tr><th>Employee</th><th>Clock in</th><th>Clock out</th><th>Hours</th></tr></thead><tbody>${rows.map((e) => { const u = state.users.find((x) => x.id === e.userId); const h = e.clockOut ? ((new Date(e.clockOut) - new Date(e.clockIn)) / 36e5).toFixed(2) : "open"; return `<tr><td>${esc(u?.name || e.userId)}</td><td>${new Date(e.clockIn).toLocaleString()}</td><td>${e.clockOut ? new Date(e.clockOut).toLocaleString() : ""}</td><td>${h}</td></tr>`; }).join("")}</tbody></table></div></section>`; }
function scheduleView() { const blocks = ["8:00 AM", "10:30 AM", "Midday", "4:00 PM", "6:15 PM", "8:30 PM", "Unscheduled"]; return `<div class="topbar"><div><h2>Schedule</h2><p class="muted">Move tasks by changing their schedule block.</p></div></div><div class="grid cols-3">${blocks.map((b) => `<section class="panel"><h3>${b}</h3><div class="grid">${state.tasks.filter((t) => (t.scheduleBlock || "Unscheduled") === b).map((t) => `<div class="task-card"><strong>${esc(t.title)}</strong><span class="muted">${esc(loc(t.locationId))}</span>${isAdmin() ? `<select data-move-task="${t.id}">${blocks.map((x) => `<option ${x === b ? "selected" : ""}>${x}</option>`).join("")}</select>` : ""}</div>`).join("") || `<div class="empty">No tasks</div>`}</div></section>`).join("")}</div>`; }
function usersView() { return `<div class="topbar"><div><h2>Users</h2><p class="muted">Switch user for this prototype.</p></div></div><section class="panel"><div class="grid cols-3">${state.users.map((u) => `<button class="task-card" data-user="${u.id}"><strong>${esc(u.name)}</strong><span class="muted">${esc(u.role)} - ${esc(u.team)}</span><span>${esc(u.email || "No email yet")}</span></button>`).join("")}</div></section>`; }
function settingsView() { return `<div class="topbar"><div><h2>Settings</h2><p class="muted">Supabase connection is stored in this browser only.</p></div></div><section class="panel">${setupForm(true)}</section>`; }
function renderSetup() { app.innerHTML = `<div class="login-wrap"><section class="login-card"><div class="brand"><div class="brand-mark">CO</div><div><h1>Camp Ops Setup</h1><p class="muted">Paste your Supabase project URL and anon key to start using the app.</p></div></div>${setupForm(false)}</section></div>`; bindSetup(); }
function setupForm(reset) { return `<div class="form-grid" style="margin-top:16px"><div class="field full"><label>Supabase URL</label><input id="supabase-url" placeholder="https://your-project.supabase.co" value="${esc(config.url || "")}"></div><div class="field full"><label>Supabase anon key</label><input id="supabase-key" placeholder="ey..." value="${esc(config.anonKey || "")}"></div><button class="btn" id="save-config">Save connection</button>${reset ? `<button class="btn secondary" id="reset-local">Reset local demo data</button>` : ""}</div><p class="muted">Run <strong>supabase-schema.sql</strong> in Supabase first. Passwords are not stored by this prototype.</p>`; }
function locationSelect(id, selected = "") { return `<select id="${id}">${state.locations.map((l) => `<option value="${l.id}" ${l.id === selected ? "selected" : ""}>${esc(l.name)}</option>`).join("")}</select>`; }

function bindCommon() {
  document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => { view = b.dataset.view; render(); }));
  document.getElementById("mobile-view")?.addEventListener("change", (e) => { view = e.target.value; render(); });
  document.querySelectorAll("[data-action]").forEach((b) => b.addEventListener("click", () => handleTaskAction(b)));
  document.getElementById("new-task")?.addEventListener("click", newTask);
  document.getElementById("open-request-form")?.addEventListener("click", () => { document.querySelector(".main").innerHTML = `<div class="topbar"><h2>New request</h2></div><section class="panel">${requestForm()}</section>`; document.getElementById("submit-request").addEventListener("click", submitRequest); });
  document.querySelectorAll("[data-request-approve]").forEach((b) => b.addEventListener("click", () => approveRequest(b.dataset.requestApprove)));
  document.querySelectorAll("[data-request-reject]").forEach((b) => b.addEventListener("click", () => { state.requests.find((r) => r.id === b.dataset.requestReject).status = "rejected"; saveState(); render(); }));
  document.getElementById("submit-supply")?.addEventListener("click", submitSupply);
  document.querySelectorAll("[data-close-supply]").forEach((b) => b.addEventListener("click", () => { state.supplyRequests.find((r) => r.id === b.dataset.closeSupply).status = "delivered"; saveState(); render(); }));
  document.getElementById("clock-toggle")?.addEventListener("click", toggleClock);
  document.querySelectorAll("[data-move-task]").forEach((s) => s.addEventListener("change", () => { state.tasks.find((t) => t.id === s.dataset.moveTask).scheduleBlock = s.value; saveState(); render(); }));
  document.querySelectorAll("[data-user]").forEach((b) => b.addEventListener("click", () => { currentUserId = b.dataset.user; localStorage.setItem("campOpsCurrentUser", currentUserId); view = "dashboard"; render(); }));
  bindSetup();
}
function bindSetup() { document.getElementById("save-config")?.addEventListener("click", () => { saveConfig({ url: document.getElementById("supabase-url").value.trim().replace(/\/$/, ""), anonKey: document.getElementById("supabase-key").value.trim() }); remoteLoaded = false; hydrate(); render(); }); document.getElementById("reset-local")?.addEventListener("click", () => { if (confirm("Reset local demo data?")) { localStorage.removeItem(STORAGE_KEY); state = loadState(); render(); } }); }
function newTask() { const title = prompt("Task title?"); if (!title) return; state.tasks.unshift({ id: id("t"), title, locationId: "outdoor", assignedTeam: "Men's Team", status: "open", priority: "normal", scheduleBlock: "Unscheduled", type: "one-time", subtasks: [], chat: [] }); saveState(); render(); }
async function handleTaskAction(button) { const taskId = button.closest("[data-task-id]")?.dataset.taskId; const t = state.tasks.find((x) => x.id === taskId); if (!t) return; const a = button.dataset.action; if (a === "done") { t.status = "done"; t.completedBy = me().id; t.completedAt = new Date().toISOString(); } if (a === "progress") t.status = "in_progress"; if (a === "problem") t.status = "blocked"; if (a === "chat") return addChat(t); saveState(); render(); }
async function addChat(t) { const text = document.querySelector(`[data-chat-text="${t.id}"]`).value.trim(); const file = document.querySelector(`[data-chat-file="${t.id}"]`)?.files?.[0]; const imageData = file ? await fileToDataUrl(file) : ""; if (!text && !imageData) return; t.chat ||= []; t.chat.push({ id: id("m"), authorId: me().id, authorName: me().name, text, imageData, createdAt: new Date().toISOString() }); saveState(); render(); }
function submitRequest() { const req = { id: id("r"), title: document.getElementById("request-title").value.trim(), requester: document.getElementById("requester").value.trim() || me().name, locationId: document.getElementById("request-location").value, category: document.getElementById("request-category").value, urgency: document.getElementById("request-urgency").value, details: document.getElementById("request-details").value.trim(), status: "pending", createdAt: new Date().toISOString(), chat: [] }; if (!req.title) return alert("Please add a title."); state.requests.unshift(req); saveState(); alert("Request submitted."); view === "requestForm" ? renderRequestOnly() : (view = "requests", render()); }
function approveRequest(reqId) { const r = state.requests.find((x) => x.id === reqId); r.status = "approved"; state.tasks.unshift({ id: id("t"), title: r.title, locationId: r.locationId, assignedTeam: r.category === "Cleaning" ? "Ladies Team" : "Men's Team", status: "open", priority: r.urgency === "urgent" ? "high" : "normal", scheduleBlock: "Unscheduled", type: "request", requestId: r.id, subtasks: [r.details].filter(Boolean), chat: [{ id: id("m"), authorName: r.requester, text: r.details, createdAt: r.createdAt }] }); saveState(); render(); }
function submitSupply() { state.supplyRequests.unshift({ id: id("s"), category: document.getElementById("supply-category").value, item: document.getElementById("supply-item").value, locationId: document.getElementById("supply-location").value, urgency: document.getElementById("supply-urgency").value, note: document.getElementById("supply-note").value.trim(), status: "requested", requestedBy: me().id, createdAt: new Date().toISOString() }); saveState(); render(); }
function toggleClock() { const open = state.timeEntries.find((e) => e.userId === me().id && !e.clockOut); open ? open.clockOut = new Date().toISOString() : state.timeEntries.push({ id: id("time"), userId: me().id, clockIn: new Date().toISOString(), clockOut: null }); saveState(); render(); }
function fileToDataUrl(file) { return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); }); }
async function syncSupabase() { if (!config.url || !config.anonKey || !navigator.onLine) return; await fetch(`${config.url}/rest/v1/app_state?on_conflict=id`, { method: "POST", headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" }, body: JSON.stringify([{ id: "local-mvp", data: state, updated_at: new Date().toISOString() }]) }).catch(console.warn); }
async function hydrate() { if (remoteLoaded || !config.url || !config.anonKey || !navigator.onLine) return; remoteLoaded = true; try { const res = await fetch(`${config.url}/rest/v1/app_state?id=eq.local-mvp&select=data`, { headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}` } }); const rows = await res.json(); if (rows?.[0]?.data?.tasks?.length) { state = { ...structuredClone(seed), ...rows[0].data }; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); render(); } } catch (e) { console.warn(e); } }
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("./sw.js").catch(() => {});
render();
