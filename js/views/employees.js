(function () {
  var C = window.CampOps;

  window.CampOpsViews.employees = function () {
    return "<div class=\"topbar page-hero\"><div><h2>Employees</h2><p class=\"muted\">Separate from login users. This is for payroll, rates, IDs, and employee records.</p></div>" +
      (C.isAdmin() ? "<button class=\"btn\" id=\"new-employee\">Add employee</button>" : "") + "</div>" +
      "<section class=\"employee-grid\">" + C.state.employees.map(employeeCard).join("") + "</section>";
  };

  function employeeCard(employee) {
    var initials = (employee.displayName || "?").split(" ").map(function (part) { return part[0]; }).join("").slice(0, 2);
    return "<article class=\"employee-card\"><div class=\"employee-photo\">" + (employee.idPhoto ? "<img src=\"" + employee.idPhoto + "\" alt=\"ID photo for " + C.esc(employee.displayName) + "\">" : "<span>" + C.esc(initials) + "</span>") + "</div>" +
      "<div><h3>" + C.esc(employee.displayName) + "</h3><p class=\"muted\">" + C.esc(employee.role || "Worker") + " - " + C.esc(employee.team || "") + "</p></div>" +
      "<dl><div><dt>Pay rate</dt><dd>" + C.esc(employee.payRate || "Not set") + "</dd></div><div><dt>Email</dt><dd>" + C.esc(employee.email || "Not set") + "</dd></div><div><dt>Phone</dt><dd>" + C.esc(employee.phone || "Not set") + "</dd></div></dl>" +
      "<p>" + C.esc(employee.notes || "") + "</p></article>";
  }
})();
