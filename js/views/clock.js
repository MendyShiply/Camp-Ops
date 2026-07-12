(function () {
  var C = window.CampOps;
  window.CampOpsViews.clock = function () {
    var open = C.state.timeEntries.find(function (entry) { return entry.userId === C.me().id && !entry.clockOut; });
    var rows = C.state.timeEntries.filter(function (entry) { return C.isAdmin() || entry.userId === C.me().id; }).slice().reverse();
    return "<div class=\"topbar\"><div><h2>Clock In/Out</h2><p class=\"muted\">Payroll uses individual clock records.</p></div><button class=\"btn " + (open ? "danger" : "") + "\" id=\"clock-toggle\">" + (open ? "Clock out" : "Clock in") + "</button></div><section class=\"panel\"><div class=\"table-wrap\"><table><thead><tr><th>Employee</th><th>Clock in</th><th>Clock out</th><th>Hours</th></tr></thead><tbody>" + rows.map(function (entry) { var person = C.state.users.find(function (user) { return user.id === entry.userId; }); var hours = entry.clockOut ? ((new Date(entry.clockOut) - new Date(entry.clockIn)) / 36e5).toFixed(2) : "open"; return "<tr><td>" + C.esc(person ? person.name : entry.userId) + "</td><td>" + new Date(entry.clockIn).toLocaleString() + "</td><td>" + (entry.clockOut ? new Date(entry.clockOut).toLocaleString() : "") + "</td><td>" + hours + "</td></tr>"; }).join("") + "</tbody></table></div></section>";
  };
})();
