(function () {
  var C = window.CampOps;
  window.CampOpsViews.users = function () {
    return "<div class=\"topbar\"><div><h2>Users</h2><p class=\"muted\">Choose who someone is and what parts of Camp Ops they can access. Login accounts are created in Supabase Authentication, then matched here by email.</p></div><button class=\"btn\" id=\"new-user\">Add user</button></div>" +
      "<section class=\"access-grid\">" + C.accessLevels.map(function (level) {
        return "<div class=\"access-card\"><strong>" + C.esc(level.label) + "</strong><span>" + C.esc(level.detail) + "</span></div>";
      }).join("") + "</section><section class=\"panel\"><div class=\"grid cols-3\">" +
      C.state.users.map(function (user) {
        return "<div class=\"user-switch\"><button class=\"user-pick\" data-user=\"" + user.id + "\"><strong>" + C.esc(user.name) + "</strong><span>" + C.esc(C.roleLabel(user.role)) + " - " + C.esc(user.team) + "</span><small>" + C.esc(user.email || "No email yet") + "</small></button>" +
          "<label>Access level<select data-user-role=\"" + user.id + "\">" + C.accessLevels.map(function (level) {
            var disabled = !C.isOwner() && level.id === "owner" ? " disabled" : "";
            return "<option value=\"" + level.id + "\" " + (user.role === level.id ? "selected" : "") + disabled + ">" + C.esc(level.label) + "</option>";
          }).join("") + "</select></label></div>";
      }).join("") + "</div></section>";
  };

  window.CampOpsViews.settings = function () {
    return "<div class=\"topbar\"><div><h2>Settings</h2><p class=\"muted\">For production, put these values in js/config.js so nobody has to enter them on the live link.</p></div></div><section class=\"panel\">" +
      window.CampOpsViews.setupForm(true) + "</section>";
  };

  window.CampOpsViews.setupForm = function (showReset) {
    return "<div class=\"form-grid\" style=\"margin-top:16px\"><div class=\"field full\"><label>Supabase URL</label><input id=\"supabase-url\" placeholder=\"https://your-project.supabase.co\" value=\"" + C.esc(C.config.url || "") + "\"></div>" +
      "<div class=\"field full\"><label>Supabase anon key</label><input id=\"supabase-key\" placeholder=\"ey...\" value=\"" + C.esc(C.config.anonKey || "") + "\"></div>" +
      "<button class=\"btn\" id=\"save-config\">Save connection</button>" + (showReset ? "<button class=\"btn secondary\" id=\"reset-local\">Reset local demo data</button>" : "") + "</div>" +
      "<p class=\"muted\">Run <strong>supabase-schema.sql</strong> in Supabase first. Passwords are handled by Supabase Auth, never by Camp Ops.</p>";
  };

  window.CampOpsViews.setup = function () {
    return "<div class=\"login-wrap\"><section class=\"login-card\"><div class=\"brand\"><div class=\"brand-mark\">CO</div><div><h1>Camp Ops Setup</h1><p class=\"muted\">Paste your Supabase project URL and anon key to start using the app.</p></div></div>" +
      window.CampOpsViews.setupForm(false) + "</section></div>";
  };

  window.CampOpsViews.login = function () {
    return "<div class=\"login-wrap\"><section class=\"login-card\"><div class=\"brand\"><div class=\"brand-mark\">CO</div><div><h1>Camp Ops Login</h1><p class=\"muted\">Sign in with the email and password created for you in Supabase.</p></div></div>" +
      "<div class=\"form-grid\" style=\"margin-top:16px\"><div class=\"field full\"><label>Email</label><input id=\"login-email\" type=\"email\" autocomplete=\"username\" placeholder=\"you@example.com\"></div>" +
      "<div class=\"field full\"><label>Password</label><input id=\"login-password\" type=\"password\" autocomplete=\"current-password\" placeholder=\"Password\"></div>" +
      "<button class=\"btn\" id=\"login-submit\">Sign in</button></div><p class=\"muted\">The first successful login becomes Owner if no user emails exist yet.</p></section></div>";
  };

  window.CampOpsViews.noAccess = function () {
    var email = C.authUser() && C.authUser().email ? C.authUser().email : "this login";
    return "<div class=\"login-wrap\"><section class=\"login-card\"><h1>No Camp Ops access</h1><p class=\"muted\">" + C.esc(email) + " signed in successfully, but there is no Camp Ops user record with that email yet. Ask an Owner or Director to add this email on the Users page.</p><button class=\"btn secondary\" id=\"logout\">Sign out</button></section></div>";
  };
})();
