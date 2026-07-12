(function () {
  function task(id, title, locationId, assignedTeam, scheduleBlock, dueTime, priority, subtasks) {
    return {
      id,
      title,
      locationId,
      assignedTeam,
      scheduleBlock,
      dueTime,
      priority,
      status: "open",
      type: "recurring",
      subtasks,
      chat: []
    };
  }

  window.CampOpsSeed = {
    schemaVersion: 5,
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
    teams: ["Ladies Team", "Men's Team", "Operations", "Director"],
    employees: [
      { id: "emp-jenny", userId: "u-jenny", displayName: "Jenny", firstName: "Jenny", lastName: "", team: "Ladies Team", role: "Worker", payRate: "", email: "", phone: "", idPhoto: "", notes: "" },
      { id: "emp-michelle", userId: "u-michelle", displayName: "Michelle", firstName: "Michelle", lastName: "", team: "Ladies Team", role: "Worker", payRate: "", email: "", phone: "", idPhoto: "", notes: "" },
      { id: "emp-william", userId: "u-william", displayName: "William", firstName: "William", lastName: "", team: "Men's Team", role: "Worker", payRate: "", email: "", phone: "", idPhoto: "", notes: "" },
      { id: "emp-miguel", userId: "u-miguel", displayName: "Miguel", firstName: "Miguel", lastName: "", team: "Men's Team", role: "Worker", payRate: "", email: "", phone: "", idPhoto: "", notes: "" },
      { id: "emp-chino", userId: "u-chino", displayName: "Chino", firstName: "Chino", lastName: "", team: "Men's Team", role: "Worker", payRate: "", email: "", phone: "", idPhoto: "", notes: "" },
      { id: "emp-george", userId: "u-george", displayName: "George", firstName: "George", lastName: "", team: "Men's Team", role: "Worker", payRate: "", email: "", phone: "", idPhoto: "", notes: "" }
    ],
    locations: [
      ["10c", "10C Medical Center", "Medical"],
      ["10d", "10D Kiddie Camp Room", "Kiddie Camp"],
      ["10e", "10E Zal / Baking Kitchen", "Kitchen"],
      ["11e", "11E Smaller Kiddie Camp Room", "Kiddie Camp"],
      ["13", "13 Main Building", "Main"],
      ["13-basement", "13 Basement / TC Shul", "Shul"],
      ["13-basement-right-laundry", "13 Basement Right Laundry Room", "Laundry"],
      ["13-basement-left-laundry", "13 Basement Left Laundry Room", "Laundry"],
      ["13-basement-cleaning-supplies", "13 Basement Cleaning Supply Storage", "Supplies"],
      ["13-kitchen-storage", "13 Kitchen Storage Room / Fridges & Freezers", "Kitchen"],
      ["8", "8 GYC Shul", "Shul"],
      ["15", "15 7th Grade Gazebo Shul", "Shul"],
      ["16", "16 4th Grade Gazebo Shul", "Shul"],
      ["2", "2 Home Depot", "Storage"],
      ["container-main-rear", "40 ft Storage Container Behind Main Building", "Storage"],
      ["container-garage-dumpsters", "40 ft Storage Container by Home Depot Dumpsters", "Storage"],
      ["12", "12 Waitros Lounge / Basketball Court", "Staff"],
      ["11f", "11F Admin Office", "Office"],
      ["outdoor", "Outdoor Grounds / Trash Cans", "Outdoor"],
      ["bonfire", "Picnic Tables / Bonfire Area", "Outdoor"]
    ].map(function (item) {
      return { id: item[0], name: item[1], category: item[2] };
    }),
    tasks: [
      task("t-med-am", "Medical Center morning clean", "10c", "Ladies Team", "8:00 AM", "9:15 AM", "high", ["Empty garbage", "Replace bag", "Wipe counters and high-touch surfaces", "Sweep or spot mop", "Restock restroom if needed"]),
      task("t-dining-ready", "Dining room readiness check", "13", "Men's Team", "8:00 AM", "9:30 AM", "high", ["Reset tables/chairs", "Check garbage", "Check dining room restrooms", "Report anything blocking breakfast"]),
      task("t-tc-shul-am", "TC Shul morning reset", "13-basement", "Men's Team", "8:00 AM", "9:30 AM", "high", ["Reset seating", "Pick up garbage", "Empty nearby trash", "Check restroom/supplies if applicable"]),
      task("t-gyc-shul-am", "GYC Shul morning check", "8", "Men's Team", "8:00 AM", "10:00 AM", "normal", ["Pick up garbage", "Reset area", "Empty trash cans nearby"]),
      task("t-7th-shul-am", "7th Grade Shul morning check", "15", "Men's Team", "8:00 AM", "10:00 AM", "normal", ["Pick up garbage", "Reset benches/chairs", "Empty trash cans nearby"]),
      task("t-4th-shul-am", "4th Grade Shul morning check", "16", "Men's Team", "8:00 AM", "10:00 AM", "normal", ["Pick up garbage", "Reset area", "Empty trash cans nearby"]),
      task("t-outdoor-cans-am", "Outdoor trash cans morning route", "outdoor", "Men's Team", "8:00 AM", "10:00 AM", "normal", ["Empty outdoor cans", "Replace bags", "Bring trash to dumpster"]),
      task("t-benches-am", "Benches and chair clusters check", "outdoor", "Men's Team", "8:00 AM", "10:00 AM", "normal", ["Walk benches by buildings 4, 6, 8, and 9", "Pick up garbage", "Reset chairs if moved"]),
      task("t-courts-am", "Courts morning trash check", "outdoor", "Men's Team", "8:00 AM", "10:00 AM", "normal", ["Check tennis courts", "Check basketball court near 12", "Empty nearby trash"]),
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
})();
