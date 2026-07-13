(function () {
  var STORAGE_KEY = "campOpsState.v2";
  var OLD_STORAGE_KEY = "campOpsState.v1";
  var CONFIG_KEY = "campOpsSupabase.v1";
  var AUTH_KEY = "campOpsAuthSession.v1";
  var CLIENT_KEY = "campOpsClientId.v1";
  var SYNC_ROW_ID = "camp-ops-main";
  var COLLECTIONS = ["users", "employees", "locations", "tasks", "requests", "supplyRequests", "inventory", "notifications", "timeEntries", "buildings", "rooms"];
  var seed = window.CampOpsSeed;
  var params = new URLSearchParams(location.search);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeSupabaseUrl(url) {
    return String(url || "").trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function clientId() {
    var id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = "client-" + Date.now() + "-" + Math.random().toString(16).slice(2);
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  }

  function stableRecord(value) {
    var copy = clone(value || {});
    delete copy._updatedAt;
    delete copy._clientId;
    return JSON.stringify(copy);
  }

  function byId(items) {
    var map = {};
    (items || []).forEach(function (item) {
      if (item && item.id) map[item.id] = item;
    });
    return map;
  }

  function ensureSyncMeta(state) {
    state.sync = state.sync || {};
    state.sync.clientId = state.sync.clientId || clientId();
    state.sync.updatedAt = state.sync.updatedAt || nowIso();
    state.tombstones = state.tombstones || {};
    COLLECTIONS.forEach(function (collection) {
      state[collection] = state[collection] || [];
      state[collection].forEach(function (item) {
        if (!item.id) item.id = collection + "-" + Date.now() + "-" + Math.random().toString(16).slice(2);
        item._updatedAt = item._updatedAt || item.updatedAt || item.createdAt || nowIso();
        item._clientId = item._clientId || state.sync.clientId;
      });
    });
    return state;
  }

  function stampChangedRecords(previous, next) {
    var stamp = nowIso();
    next.sync = next.sync || {};
    next.sync.clientId = clientId();
    next.sync.updatedAt = stamp;
    next.tombstones = next.tombstones || {};
    COLLECTIONS.forEach(function (collection) {
      var before = byId((previous || {})[collection] || []);
      (next[collection] || []).forEach(function (item) {
        if (!item.id) item.id = collection + "-" + Date.now() + "-" + Math.random().toString(16).slice(2);
        if (!item._updatedAt || !before[item.id] || stableRecord(before[item.id]) !== stableRecord(item)) {
          item._updatedAt = stamp;
          item._clientId = next.sync.clientId;
        }
      });
    });
  }

  function mergeCollection(localItems, remoteItems, tombstones) {
    var merged = {};
    (remoteItems || []).concat(localItems || []).forEach(function (item) {
      if (!item || !item.id) return;
      var deletedAt = tombstones && tombstones[item.id];
      if (deletedAt && String(deletedAt) >= String(item._updatedAt || item.updatedAt || item.createdAt || "")) return;
      var existing = merged[item.id];
      if (!existing || String(item._updatedAt || "") >= String(existing._updatedAt || "")) merged[item.id] = item;
    });
    return Object.keys(merged).map(function (id) { return merged[id]; });
  }

  async function fetchAppStateData(app, id) {
    var response = await fetch(app.config.url + "/rest/v1/app_state?id=eq." + encodeURIComponent(id) + "&select=data", {
      headers: app.authHeaders()
    });
    if (!response.ok) return null;
    var rows = await response.json();
    return rows && rows[0] && rows[0].data ? rows[0].data : null;
  }

  function notificationLink(link) {
    if (!link) return location.origin + location.pathname;
    return location.origin + location.pathname + "#" + encodeURIComponent(link);
  }

  function mergeState(localState, remoteState) {
    var local = ensureSyncMeta(migrateState(Object.assign(clone(seed), localState || {})));
    var remote = ensureSyncMeta(migrateState(Object.assign(clone(seed), remoteState || {})));
    var merged = Object.assign(clone(seed), remote, local);
    merged.sync = {
      clientId: clientId(),
      updatedAt: nowIso(),
      remoteUpdatedAt: remote.sync && remote.sync.updatedAt ? remote.sync.updatedAt : ""
    };
    merged.tombstones = Object.assign({}, remote.tombstones || {}, local.tombstones || {});
    COLLECTIONS.forEach(function (collection) {
      merged[collection] = mergeCollection(local[collection], remote[collection], merged.tombstones);
    });
    return migrateState(merged);
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
    var knownLocations = {};
    state.locations = state.locations || [];
    state.locations.forEach(function (location) {
      knownLocations[location.id] = true;
    });
    seed.locations.forEach(function (location) {
      if (!knownLocations[location.id]) state.locations.push(clone(location));
    });
    var locationNames = {};
    seed.locations.forEach(function (location) {
      locationNames[location.id] = location.name;
    });
    state.locations.forEach(function (location) {
      if (locationNames[location.id]) location.name = locationNames[location.id];
    });
    var knownBuildings = {};
    var seedBuildings = {};
    (seed.buildings || []).forEach(function (building) {
      seedBuildings[building.id] = building;
    });
    state.buildings = state.buildings || [];
    state.buildings.forEach(function (building) {
      knownBuildings[building.id] = true;
      if (seedBuildings[building.id]) {
        building.label = seedBuildings[building.id].label;
        building.name = seedBuildings[building.id].name;
        building.type = seedBuildings[building.id].type;
        building.notes = seedBuildings[building.id].notes;
      }
    });
    (seed.buildings || []).forEach(function (building) {
      if (!knownBuildings[building.id]) state.buildings.push(clone(building));
    });
    if (version < 8) {
      state.rooms = (state.rooms || []).filter(function (room) {
        return ["room-10e-zal", "room-10e-baking"].indexOf(room.id) < 0;
      });
    }
    var knownRooms = {};
    var seedRooms = {};
    (seed.rooms || []).forEach(function (room) {
      seedRooms[room.id] = room;
    });
    state.rooms = state.rooms || [];
    state.rooms.forEach(function (room) {
      knownRooms[room.id] = true;
      if (seedRooms[room.id]) {
        room.buildingId = seedRooms[room.id].buildingId;
        room.name = seedRooms[room.id].name;
        if (!room.assignment) room.assignment = seedRooms[room.id].assignment || "";
        if (!room.notes && seedRooms[room.id].notes) room.notes = seedRooms[room.id].notes;
      }
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
    state.schemaVersion = 11;
    state.users = state.users && state.users.length ? state.users : clone(seed.users);
    state.users.forEach(function (user) {
      var parts = String(user.name || "").trim().split(/\s+/);
      user.firstName = user.firstName || parts[0] || "";
      user.lastName = user.lastName || parts.slice(1).join(" ");
      user.name = (user.firstName + " " + user.lastName).trim() || user.name || user.email || "User";
      user.email = user.email || "";
      user.phone = user.phone || "";
      user.role = user.role || "worker";
      user.team = user.team || "";
    });
    state.requests = state.requests || [];
    state.requests.forEach(function (request) {
      request.category = request.category || "Other";
      request.costEstimate = Number(request.costEstimate || 0);
      request.costActual = Number(request.costActual || 0);
      request.chat = request.chat || [];
      request.taskId = request.taskId || "";
      request.status = request.status || "pending";
    });
    state.tasks = state.tasks || [];
    state.tasks.forEach(function (task) {
      task.category = task.category || "";
      task.costEstimate = Number(task.costEstimate || 0);
      task.costActual = Number(task.costActual || 0);
    });
    state.supplyRequests = state.supplyRequests || [];
    state.supplyRequests.forEach(function (request) {
      request.category = request.category || "Other";
      request.status = request.status || "requested";
      request.requestedBy = request.requestedBy || "";
      request.orderedBy = request.orderedBy || "";
      request.trackingNumber = request.trackingNumber || "";
      request.vendor = request.vendor || "";
      request.orderNote = request.orderNote || "";
      request.quantity = Number(request.quantity || request.requestQty || 1);
      request.unit = request.unit || "each";
    });
    state.inventory = state.inventory && state.inventory.length ? state.inventory : clone(seed.inventory || []);
    var seedInventory = {};
    (seed.inventory || []).forEach(function (item) { seedInventory[item.id] = item; });
    state.inventory.forEach(function (item) {
      item.item = item.item || "Inventory item";
      item.category = item.category || "Supplies";
      item.manufacturer = item.manufacturer || "";
      item.sku = item.sku || "";
      item.color = item.color || "";
      item.size = item.size || "";
      item.itemUrl = item.itemUrl || "";
      item.codes = item.codes || "";
      item.quantity = Number(item.quantity || 0);
      item.unit = item.unit || "each";
      item.packageCount = Number(item.packageCount || item.quantity || 0);
      item.packageQty = Number(item.packageQty || 1);
      item.purchaseDate = item.purchaseDate || "";
      item.purchasedBy = item.purchasedBy || "";
      item.purchaseStore = item.purchaseStore || "";
      item.lowAt = Number(item.lowAt || 0);
      item.requestQty = Number(item.requestQty || item.lowAt || 1);
      item.autoRequestTo = item.autoRequestTo || "";
      item.autoRequest = !!item.autoRequest;
      item.locations = item.locations || [];
      item.notes = item.notes || "";
    });
    (seed.inventory || []).forEach(function (item) {
      if (!state.inventory.some(function (existing) { return existing.id === item.id; })) state.inventory.push(clone(item));
    });
    state.notifications = state.notifications || [];
    state.timeEntries = state.timeEntries || [];
    return ensureSyncMeta(state);
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
    });
  }

  var loadedState = ensureSyncMeta(loadState());
  var baselineState = clone(loadedState);

  window.CampOps = {
    STORAGE_KEY: STORAGE_KEY,
    CONFIG_KEY: CONFIG_KEY,
    AUTH_KEY: AUTH_KEY,
    state: loadedState,
    config: (function () {
      var fileConfig = window.CampOpsConfig || {};
      var browserConfig = JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
      return {
        url: normalizeSupabaseUrl(browserConfig.url || fileConfig.supabaseUrl || fileConfig.url || ""),
        anonKey: browserConfig.anonKey || fileConfig.supabaseAnonKey || fileConfig.anonKey || "",
        vapidPublicKey: browserConfig.vapidPublicKey || fileConfig.vapidPublicKey || ""
      };
    })(),
    auth: JSON.parse(localStorage.getItem(AUTH_KEY) || "null"),
    currentUserId: localStorage.getItem("campOpsCurrentUser") || "u-mendy",
    view: params.has("request") ? "requestForm" : "dashboard",
    selectedTaskId: null,
    selectedRequestId: null,
    selectedInventoryId: null,
    inventoryModalOpen: false,
    inventoryAutomationId: null,
    switchUserModalOpen: false,
    inventorySearch: "",
    inventorySort: "item",
    inventorySortDir: "asc",
    inventoryColumns: ["item", "category", "manufacturer", "sku", "packageCount", "packageQty", "totalQuantity", "lowAt", "location", "actions"],
    inventoryColumnWidths: {},
    userModalOpen: false,
    remoteLoaded: false,
    esc: esc,
    uid: function (prefix) {
      return prefix + "-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    },
    save: function () {
      stampChangedRecords(baselineState, this.state);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      baselineState = clone(this.state);
      this.syncSupabase();
    },
    saveConfig: function (next) {
      this.config = {
        url: normalizeSupabaseUrl(next.url),
        anonKey: next.anonKey,
        vapidPublicKey: next.vapidPublicKey || ""
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
    sendPasswordReset: async function (email) {
      email = String(email || "").trim();
      if (!email) throw new Error("Please enter an email address.");
      var response = await fetch(this.config.url + "/auth/v1/recover", {
        method: "POST",
        headers: {
          apikey: this.config.anonKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email })
      });
      var body = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(body.msg || body.error_description || "Could not send password reset.");
      return true;
    },
    adminUserAction: async function (action, payload) {
      if (!this.config.url || !this.config.anonKey || !this.isSignedIn() || !navigator.onLine) throw new Error("Admin function is not available offline.");
      var response = await fetch(this.config.url + "/functions/v1/admin-users", {
        method: "POST",
        headers: Object.assign({}, this.authHeaders(), {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify(Object.assign({ action: action }, payload || {}))
      });
      var body = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(body.error || body.msg || "Admin user action failed.");
      return body;
    },
    sendInvite: async function (email) {
      email = String(email || "").trim();
      if (!email) throw new Error("Please enter an email address.");
      if (this.isSignedIn()) {
        try {
          await this.adminUserAction("invite", { email: email, redirectTo: location.origin });
          return true;
        } catch (error) {
          console.warn("Admin invite function failed, falling back to OTP invite", error);
        }
      }
      var response = await fetch(this.config.url + "/auth/v1/otp", {
        method: "POST",
        headers: {
          apikey: this.config.anonKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          create_user: true,
          options: { email_redirect_to: location.origin }
        })
      });
      var body = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(body.msg || body.error_description || "Could not send invite.");
      return true;
    },
    deleteAuthUserByEmail: async function (email) {
      email = String(email || "").trim();
      if (!email || !this.isSignedIn()) return false;
      try {
        await this.adminUserAction("deleteByEmail", { email: email });
        return true;
      } catch (error) {
        console.warn("Auth user delete failed", error);
        return false;
      }
    },
    enablePushNotifications: async function () {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("Push notifications are not supported on this device/browser.");
      if (!this.config.vapidPublicKey) throw new Error("Add the VAPID public key in Settings first.");
      var permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notification permission was not granted.");
      var registration = await navigator.serviceWorker.ready;
      var existing = await registration.pushManager.getSubscription();
      var subscription = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.config.vapidPublicKey)
      });
      await this.savePushSubscription(subscription);
      return true;
    },
    savePushSubscription: async function (subscription) {
      if (!this.config.url || !this.config.anonKey || !this.isSignedIn() || !navigator.onLine) return false;
      var response = await fetch(this.config.url + "/rest/v1/push_subscriptions?on_conflict=user_id,endpoint", {
        method: "POST",
        headers: Object.assign({}, this.authHeaders(), {
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates"
        }),
        body: JSON.stringify([{
          user_id: this.me().id,
          endpoint: subscription.endpoint,
          subscription: subscription.toJSON(),
          user_agent: navigator.userAgent,
          updated_at: nowIso()
        }])
      });
      if (!response.ok) throw new Error("Could not save push subscription.");
      return true;
    },
    sendPushNotification: async function (userId, title, body, link) {
      if (!this.config.url || !this.config.anonKey || !this.isSignedIn() || !navigator.onLine) return false;
      try {
        var response = await fetch(this.config.url + "/functions/v1/send-push", {
          method: "POST",
          headers: Object.assign({}, this.authHeaders(), {
            "Content-Type": "application/json"
          }),
          body: JSON.stringify({ userId: userId, title: title, body: body || "", url: notificationLink(link) })
        });
        return response.ok;
      } catch (error) {
        console.warn("Push notification failed", error);
        return false;
      }
    },
    urlBase64ToUint8Array: function (base64String) {
      var padding = "=".repeat((4 - base64String.length % 4) % 4);
      var base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
      var rawData = atob(base64);
      var outputArray = new Uint8Array(rawData.length);
      for (var i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
      return outputArray;
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
      { id: "secretary", label: "Office secretary", detail: "Can enter staff requests and view request history, without admin settings." },
      { id: "worker", label: "Employee", detail: "Assigned/team tasks, requests, supplies, clock, schedule, and building reference." },
      { id: "requester", label: "Request only", detail: "Login-required request entry without the operations dashboard." }
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
      if (role === "owner") return true;
      if (role === "director") return view !== "settings";
      if (role === "supervisor") return ["dashboard", "tasks", "taskDetail", "requests", "requestDetail", "supplies", "inventory", "clock", "schedule", "employees", "buildings"].indexOf(view) >= 0;
      if (role === "secretary") return ["dashboard", "requests", "requestDetail", "requestForm", "clock", "schedule", "buildings"].indexOf(view) >= 0;
      if (role === "worker") return ["dashboard", "tasks", "taskDetail", "requestDetail", "requestForm", "supplies", "clock", "schedule", "buildings"].indexOf(view) >= 0;
      return view === "requestForm";
    },
    locationName: function (id) {
      var location = this.state.locations.find(function (item) { return item.id === id; });
      if (location) return location.name;
      var room = (this.state.rooms || []).find(function (item) { return item.id === id; });
      if (room) {
        var building = (window.CampOps.state.buildings || []).find(function (item) { return item.id === room.buildingId; });
        return (building ? building.label + " - " : "") + room.name;
      }
      return id || "No location";
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
    requestById: function (id) {
      return this.state.requests.find(function (request) { return request.id === id; });
    },
    deleteRequest: function (requestId) {
      var request = this.requestById(requestId);
      if (!request) return false;
      var stamp = nowIso();
      this.state.tombstones = this.state.tombstones || {};
      this.state.tombstones[request.id] = stamp;
      this.state.requests = this.state.requests.filter(function (item) { return item.id !== request.id; });
      if (request.source === "staff_requests") this.deleteStaffRequest(request.id);
      this.save();
      return true;
    },
    userById: function (id) {
      return this.state.users.find(function (user) { return user.id === id; });
    },
    userByName: function (name) {
      var normalized = String(name || "").toLowerCase();
      return this.state.users.find(function (user) {
        return user.name.toLowerCase() === normalized || user.name.toLowerCase().split(/\s+/)[0] === normalized;
      });
    },
    mentionUsers: function (text) {
      var self = this;
      var found = {};
      String(text || "").replace(/@([A-Za-z][A-Za-z0-9_-]*(?:\s+[A-Za-z][A-Za-z0-9_-]*)?)/g, function (_, rawName) {
        var parts = rawName.trim().split(/\s+/);
        var candidates = [rawName.trim(), parts[0]];
        candidates.forEach(function (candidate) {
          var user = self.userByName(candidate);
          if (user) found[user.id] = user;
        });
      });
      return Object.keys(found).map(function (id) { return found[id]; });
    },
    addNotification: function (userId, title, body, link) {
      if (!userId) return;
      this.state.notifications.unshift({
        id: this.uid("n"),
        userId: userId,
        title: title,
        body: body || "",
        link: link || "",
        read: false,
        createdAt: new Date().toISOString()
      });
      this.sendPushNotification(userId, title, body, link);
    },
    addMentionNotifications: function (text, title, body, link) {
      var self = this;
      this.mentionUsers(text).forEach(function (user) {
        if (user.id !== self.me().id) self.addNotification(user.id, title, body, link);
      });
    },
    notifyRequestParticipants: function (request, title, body) {
      var self = this;
      var participantIds = {};
      (request.chat || []).forEach(function (message) {
        if (message.authorId && message.authorId !== self.me().id) participantIds[message.authorId] = true;
      });
      if (request.createdById && request.createdById !== self.me().id) participantIds[request.createdById] = true;
      Object.keys(participantIds).forEach(function (userId) {
        self.addNotification(userId, title, body, "request:" + request.id);
      });
    },
    notifyTaskParticipants: function (task, title, body) {
      var self = this;
      var participantIds = {};
      if (task.assignedUserId && task.assignedUserId !== self.me().id) participantIds[task.assignedUserId] = true;
      (task.chat || []).forEach(function (message) {
        if (message.authorId && message.authorId !== self.me().id) participantIds[message.authorId] = true;
      });
      if (task.requestId) {
        var request = self.requestById(task.requestId);
        if (request && request.createdById && request.createdById !== self.me().id) participantIds[request.createdById] = true;
      }
      Object.keys(participantIds).forEach(function (userId) {
        self.addNotification(userId, title, body, "task:" + task.id);
      });
    },
    myNotifications: function () {
      var userId = this.me().id;
      return (this.state.notifications || []).filter(function (note) { return note.userId === userId; });
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
        chat: [],
        costActual: 0,
        taskId: ""
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
        var tombstones = this.state.tombstones || {};
        var local = this.state.requests.filter(function (request) { return request.source !== "staff_requests"; });
        this.state.requests = rows.map(this.staffRequestToApp).filter(function (request) {
          return !tombstones[request.id];
        }).concat(local);
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
    deleteStaffRequest: async function (requestId) {
      if (!this.config.url || !this.config.anonKey || !this.isSignedIn() || !navigator.onLine) return;
      await fetch(this.config.url + "/rest/v1/staff_requests?id=eq." + encodeURIComponent(requestId), {
        method: "DELETE",
        headers: this.authHeaders()
      }).catch(function (error) {
        console.warn("Staff request delete failed", error);
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
        var remoteData = await fetchAppStateData(this, SYNC_ROW_ID) || await fetchAppStateData(this, "local-mvp");
        if (remoteData) {
          this.state = mergeState(this.state, remoteData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
          baselineState = clone(this.state);
        }
        await fetch(this.config.url + "/rest/v1/app_state?on_conflict=id", {
          method: "POST",
          headers: {
            apikey: this.config.anonKey,
            Authorization: this.authHeaders().Authorization,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates"
          },
          body: JSON.stringify([{ id: SYNC_ROW_ID, data: this.state, updated_at: nowIso() }])
        });
      } catch (error) {
        console.warn("Supabase sync failed", error);
      }
    },
    hydrateSupabase: async function () {
      if (this.remoteLoaded || !this.config.url || !this.config.anonKey || !navigator.onLine) return;
      this.remoteLoaded = true;
      try {
        var remoteData = await fetchAppStateData(this, SYNC_ROW_ID) || await fetchAppStateData(this, "local-mvp");
        if (remoteData && Array.isArray(remoteData.tasks) && remoteData.tasks.length) {
          this.state = mergeState(this.state, remoteData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
          baselineState = clone(this.state);
        }
        await this.loadStaffRequests();
        window.CampOpsApp.render();
      } catch (error) {
        console.warn("Supabase load failed", error);
      }
    }
  };
})();
