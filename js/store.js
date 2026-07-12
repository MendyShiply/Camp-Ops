(function () {
  var STORAGE_KEY = "campOpsState.v2";
  var OLD_STORAGE_KEY = "campOpsState.v1";
  var CONFIG_KEY = "campOpsSupabase.v1";
  var AUTH_KEY = "campOpsAuthSession.v1";
  var seed = window.CampOpsSeed;
  var params = new URLSearchParams(location.search);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeSupabaseUrl(url) {
    return String(url || "").trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  }

  function loadState() {
    var stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_STORAGE_KEY);
    if (!stored) return clone(seed);
    return migrateState(Object.assign(clone(seed), JSON.parse(stored)));
  }

  function migrateState(state) {
    var version = state.schemaVersion || 1;
    if (version < 2) {
      state.tasks = clone(seed.tasks);
      state.locations = clone(seed.locations);
    }
    if (version < 3 || !state.employees) {
      state.employees = clone(seed.employees);
    }
    if (version < 4) {
      var knownLocations = {};
      (state.locations || []).forEach(function (location) {
        knownLocations[location.id] = true;
      });
      seed.locations.forEach(function (location) {
        if (!knownLocations[location.id]) state.locations.push(clone(location));
      });
    }
    if (version < 6) {
      var locationNames = {};
      seed.locations.forEach(function (location) {
        locationNames[location.id] = location.name;
      });
      (state.locations || []).forEach(function (location) {
        if (locationNames[location.id]) location.name = locationNames[location.id];
      });
    }
    var knownBuildings = {};
    state.buildings = state.buildings || [];
    state.buildings.forEach(function (building) { knownBuildings[building.id] = true; });
    (seed.buildings || []).forEach(function (building) {
      if (!knownBuildings[building.id]) state.buildings.push(clone(building));
    });
    var knownRooms = {};
    state.rooms = state.rooms || [];
    state.rooms.forEach(function (room) {
      knownRooms[room.id] = true;
      room.assignment = room.assignment || "";
      room.beds = Number(room.beds || 0);
      room.bunkBeds = Number(room.bunkBeds || 0);
      room.toilets = Number(room.toilets || 0);
      room.sinks = Number(room.sinks || 0);
      room.showers = Number(room.showers || 0);
      room.notes = room.notes || "";
    });
    (seed.rooms || []).forEach(function (room) {
      if (!knownRooms[room.id]) state.rooms.push(clone(room));
    });
    state.schemaVersion = 6;
    state.users = state.users && state.users.length ? state.users : clone(seed.users);
    state.users.forEach(function (user) {
      user.role = user.role || "worker";
      user.team = user.team || "";
    });
    state.requests = state.requests || [];
    state.supplyRequests = state.supplyRequests || [];
    state.timeEntries = state.timeEntries || [];
    return state;
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
    });
  }

  window.CampOps = {
    STORAGE_KEY: STORAGE_KEY,
    CONFIG_KEY: CONFIG_KEY,
    AUTH_KEY: AUTH_KEY,
    state: loadState(),
    config: (function () {
      var fileConfig = window.CampOpsConfig || {};
      var browserConfig = JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
      return {
        url: normalizeSupabaseUrl(browserConfig.url || fileConfig.supabaseUrl || fileConfig.url || ""),
        anonKey: browserConfig.anonKey || fileConfig.supabaseAnonKey || fileConfig.anonKey || ""
      };
    })(),
    auth: JSON.parse(localStorage.getItem(AUTH_KEY) || "null"),
    currentUserId: localStorage.getItem("campOpsCurrentUser") || "u-mendy",
    view: params.has("request") ? "requestForm" : "dashboard",
    selectedTaskId: null,
    remoteLoaded: false,
    esc: esc,
    uid: function (prefix) {
      return prefix + "-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    },
    save: function () {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.syncSupabase();
    },
    saveConfig: function (next) {
      this.config = {
        url: normalizeSupabaseUrl(next.url),
        anonKey: next.anonKey
      };
      localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
      this.remoteLoaded = false;
    },
    authUser: function () {
      return this.auth && this.auth.user ? this.auth.user : null;
    },
    isSignedIn: function () {
      return !!(this.auth && this.auth.access_token && this.auth.user);
    },
    authHeaders: function () {
      return {
        apikey: this.config.anonKey,
        Authorization: "Bearer " + (this.auth && this.auth.access_token ? this.auth.access_token : this.config.anonKey)
      };
    },
    signIn: async function (email, password) {
      var response = await fetch(this.config.url + "/auth/v1/token?grant_type=password", {
        method: "POST",
        headers: {
          apikey: this.config.anonKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email, password: password })
      });
      var body = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(body.error_description || body.msg || "Sign in failed.");
      this.auth = body;
      localStorage.setItem(AUTH_KEY, JSON.stringify(body));
      this.applyAuthUser();
      this.remoteLoaded = false;
    },
    signOut: function () {
      this.auth = null;
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem("campOpsCurrentUser");
      this.currentUserId = "u-mendy";
    },
    applyAuthUser: function () {
      var authUser = this.authUser();
      if (!authUser || !authUser.email) return;
      var email = authUser.email.toLowerCase();
      var matched = this.state.users.find(function (user) {
        return (user.email || "").toLowerCase() === email;
      });
      var hasAnyEmail = this.state.users.some(function (user) { return !!user.email; });
      if (!matched && !hasAnyEmail) {
        matched = this.state.users.find(function (user) { return user.role === "owner"; }) || this.state.users[0];
        matched.email = authUser.email;
        matched.name = matched.name || authUser.email;
        matched.role = "owner";
        this.save();
      }
      if (matched) {
        this.currentUserId = matched.id;
        localStorage.setItem("campOpsCurrentUser", matched.id);
      }
    },
    hasAccessProfile: function () {
      var authUser = this.authUser();
      if (!authUser || !authUser.email) return false;
      var email = authUser.email.toLowerCase();
      return this.state.users.some(function (user) {
        return (user.email || "").toLowerCase() === email;
      });
    },
    me: function () {
      this.applyAuthUser();
      return this.state.users.find(function (user) { return user.id === window.CampOps.currentUserId; }) || this.state.users[0];
    },
    isAdmin: function () {
      return ["owner", "director", "supervisor"].indexOf(this.me().role) >= 0;
    },
    isOwner: function () {
      return this.me().role === "owner";
    },
    accessLevels: [
      { id: "owner", label: "Owner", detail: "Full access, settings, users, and every operations view." },
      { id: "director", label: "Director", detail: "All operations views, all tasks, approvals, and user access." },
      { id: "supervisor", label: "Supervisor", detail: "Operations views, all tasks, approvals, and employee records." },
      { id: "worker", label: "Worker", detail: "Assigned/team tasks, requests, supplies, clock, and schedule." },
      { id: "requester", label: "Request only", detail: "Can submit requests but does not use the operations dashboard." }
    ],
    roleLabel: function (role) {
      var found = this.accessLevels.find(function (level) { return level.id === role; });
      return found ? found.label : role;
    },
    canManageUsers: function () {
      return ["owner", "director"].indexOf(this.me().role) >= 0;
    },
    canAccess: function (view) {
      var role = this.me().role;
      if (view === "requestForm") return true;
      if (role === "owner") return true;
      if (role === "director") return view !== "settings";
      if (role === "supervisor") return ["dashboard", "tasks", "taskDetail", "requests", "supplies", "clock", "schedule", "employees", "buildings"].indexOf(view) >= 0;
      if (role === "worker") return ["dashboard", "tasks", "taskDetail", "requests", "supplies", "clock", "schedule", "buildings"].indexOf(view) >= 0;
      return view === "requestForm";
    },
    locationName: function (id) {
      var location = this.state.locations.find(function (item) { return item.id === id; });
      return location ? location.name : (id || "No location");
    },
    visibleTasks: function () {
      var self = this;
      if (this.isAdmin()) return this.state.tasks;
      return this.state.tasks.filter(function (task) {
        return task.assignedTeam === self.me().team || task.assignedUserId === self.me().id;
      });
    },
    taskById: function (id) {
      return this.state.tasks.find(function (task) { return task.id === id; });
    },
    staffRequestToApp: function (row) {
      return {
        id: row.id,
        source: "staff_requests",
        title: row.title,
        requester: row.requester_name || "",
        locationId: row.location_id || "",
        category: row.category || "Other",
        urgency: row.urgency || "normal",
        details: row.details || "",
        status: row.status || "pending",
        createdAt: row.created_at || new Date().toISOString(),
        chat: []
      };
    },
    loadStaffRequests: async function () {
      if (!this.config.url || !this.config.anonKey || !this.isSignedIn() || !navigator.onLine) return;
      try {
        var response = await fetch(this.config.url + "/rest/v1/staff_requests?select=*&order=created_at.desc", {
          headers: this.authHeaders()
        });
        if (!response.ok) return;
        var rows = await response.json();
        var local = this.state.requests.filter(function (request) { return request.source !== "staff_requests"; });
        this.state.requests = rows.map(this.staffRequestToApp).concat(local);
      } catch (error) {
        console.warn("Staff request load failed", error);
      }
    },
    submitPublicRequest: async function (request) {
      if (!this.config.url || !this.config.anonKey || !navigator.onLine) return false;
      var row = {
        title: request.title,
        requester_name: request.requester,
        location_id: request.locationId,
        category: request.category,
        urgency: request.urgency,
        details: request.details,
        status: "pending"
      };
      var response = await fetch(this.config.url + "/rest/v1/staff_requests", {
        method: "POST",
        headers: {
          apikey: this.config.anonKey,
          Authorization: "Bearer " + this.config.anonKey,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify(row)
      });
      if (!response.ok) throw new Error("Could not submit request.");
      return true;
    },
    updateStaffRequestStatus: async function (requestId, status) {
      if (!this.config.url || !this.config.anonKey || !this.isSignedIn() || !navigator.onLine) return;
      await fetch(this.config.url + "/rest/v1/staff_requests?id=eq." + encodeURIComponent(requestId), {
        method: "PATCH",
        headers: Object.assign({}, this.authHeaders(), {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({ status: status, updated_at: new Date().toISOString() })
      });
    },
    fileToDataUrl: function (file) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () { resolve(reader.result); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    syncSupabase: async function () {
      if (!this.config.url || !this.config.anonKey || !navigator.onLine) return;
      try {
        await fetch(this.config.url + "/rest/v1/app_state?on_conflict=id", {
          method: "POST",
          headers: {
            apikey: this.config.anonKey,
            Authorization: this.authHeaders().Authorization,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates"
          },
          body: JSON.stringify([{ id: "local-mvp", data: this.state, updated_at: new Date().toISOString() }])
        });
      } catch (error) {
        console.warn("Supabase sync failed", error);
      }
    },
    hydrateSupabase: async function () {
      if (this.remoteLoaded || !this.config.url || !this.config.anonKey || !navigator.onLine) return;
      this.remoteLoaded = true;
      try {
        var response = await fetch(this.config.url + "/rest/v1/app_state?id=eq.local-mvp&select=data", {
          headers: this.authHeaders()
        });
        if (!response.ok) return;
        var rows = await response.json();
        if (rows && rows[0] && rows[0].data && Array.isArray(rows[0].data.tasks) && rows[0].data.tasks.length) {
          this.state = migrateState(Object.assign(clone(seed), rows[0].data));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        }
        await this.loadStaffRequests();
        window.CampOpsApp.render();
      } catch (error) {
        console.warn("Supabase load failed", error);
      }
    }
  };
})();
