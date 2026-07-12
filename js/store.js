(function () {
  var STORAGE_KEY = "campOpsState.v2";
  var OLD_STORAGE_KEY = "campOpsState.v1";
  var CONFIG_KEY = "campOpsSupabase.v1";
  var seed = window.CampOpsSeed;
  var params = new URLSearchParams(location.search);
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function migrateState(state) {
    if (state.schemaVersion === 2) return state;
    state.schemaVersion = 2;
    state.tasks = clone(seed.tasks);
    state.locations = clone(seed.locations);
    state.users = state.users && state.users.length ? state.users : clone(seed.users);
    state.requests = state.requests || [];
    state.supplyRequests = state.supplyRequests || [];
    state.timeEntries = state.timeEntries || [];
    return state;
  }
  function loadState() {
    var stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_STORAGE_KEY);
    if (!stored) return clone(seed);
    return migrateState(Object.assign(clone(seed), JSON.parse(stored)));
  }
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
    });
  }
  window.CampOps = {
    STORAGE_KEY: STORAGE_KEY,
    CONFIG_KEY: CONFIG_KEY,
    state: loadState(),
    config: JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}"),
    currentUserId: localStorage.getItem("campOpsCurrentUser") || "u-mendy",
    view: params.has("request") ? "requestForm" : "dashboard",
    selectedTaskId: null,
    remoteLoaded: false,
    esc: esc,
    uid: function (prefix) { return prefix + "-" + Date.now() + "-" + Math.random().toString(16).slice(2); },
    save: function () { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); this.syncSupabase(); },
    saveConfig: function (next) { this.config = next; localStorage.setItem(CONFIG_KEY, JSON.stringify(next)); this.remoteLoaded = false; },
    me: function () { return this.state.users.find(function (user) { return user.id === window.CampOps.currentUserId; }) || this.state.users[0]; },
    isAdmin: function () { return ["owner", "director", "supervisor"].indexOf(this.me().role) >= 0; },
    isOwner: function () { return this.me().role === "owner"; },
    locationName: function (id) { var location = this.state.locations.find(function (item) { return item.id === id; }); return location ? location.name : (id || "No location"); },
    visibleTasks: function () { var self = this; if (this.isAdmin()) return this.state.tasks; return this.state.tasks.filter(function (task) { return task.assignedTeam === self.me().team || task.assignedUserId === self.me().id; }); },
    taskById: function (id) { return this.state.tasks.find(function (task) { return task.id === id; }); },
    fileToDataUrl: function (file) { return new Promise(function (resolve, reject) { var reader = new FileReader(); reader.onload = function () { resolve(reader.result); }; reader.onerror = reject; reader.readAsDataURL(file); }); },
    syncSupabase: async function () {
      if (!this.config.url || !this.config.anonKey || !navigator.onLine) return;
      try {
        await fetch(this.config.url + "/rest/v1/app_state?on_conflict=id", {
          method: "POST",
          headers: { apikey: this.config.anonKey, Authorization: "Bearer " + this.config.anonKey, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify([{ id: "local-mvp", data: this.state, updated_at: new Date().toISOString() }])
        });
      } catch (error) { console.warn("Supabase sync failed", error); }
    },
    hydrateSupabase: async function () {
      if (this.remoteLoaded || !this.config.url || !this.config.anonKey || !navigator.onLine) return;
      this.remoteLoaded = true;
      try {
        var response = await fetch(this.config.url + "/rest/v1/app_state?id=eq.local-mvp&select=data", { headers: { apikey: this.config.anonKey, Authorization: "Bearer " + this.config.anonKey } });
        if (!response.ok) return;
        var rows = await response.json();
        if (rows && rows[0] && rows[0].data && Array.isArray(rows[0].data.tasks) && rows[0].data.tasks.length) {
          this.state = migrateState(Object.assign(clone(seed), rows[0].data));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
          window.CampOpsApp.render();
        }
      } catch (error) { console.warn("Supabase load failed", error); }
    }
  };
})();
