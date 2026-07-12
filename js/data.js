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
    schemaVersion: 6,
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
      ["10c", "Building #10C - Medical Center", "Medical"],
      ["10d", "Building #10D - Kiddie Camp Room", "Kiddie Camp"],
      ["10e", "Building #10E - Zal / Baking Kitchen", "Kitchen"],
      ["11e", "Building #11E - Smaller Kiddie Camp Room", "Kiddie Camp"],
      ["13", "Building #13 - Main Building", "Main"],
      ["13-basement", "Building #13 - Basement / TC Shul", "Shul"],
      ["13-basement-right-laundry", "Building #13 - Basement Right Laundry Room", "Laundry"],
      ["13-basement-left-laundry", "Building #13 - Basement Left Laundry Room", "Laundry"],
      ["13-basement-cleaning-supplies", "Building #13 - Basement Cleaning Supply Storage", "Supplies"],
      ["13-kitchen-storage", "Building #13 - Kitchen Storage Room / Fridges & Freezers", "Kitchen"],
      ["8", "Building #8 - CGI Chai Shul", "Shul"],
      ["15", "Building #15 - 7th Grade Gazebo Shul", "Shul"],
      ["16", "Building #16 - 4th Grade Gazebo Shul", "Shul"],
      ["2", "Building #2 - Home Depot", "Storage"],
      ["container-main-rear", "40 ft Storage Container Behind Main Building", "Storage"],
      ["container-garage-dumpsters", "40 ft Storage Container by Home Depot Dumpsters", "Storage"],
      ["12", "Building #12 - Waitros Lounge / Basketball Court", "Staff"],
      ["11f", "Building #11F - Admin Office", "Office"],
      ["outdoor", "Outdoor Grounds / Trash Cans", "Outdoor"],
      ["bonfire", "Picnic Tables / Bonfire Area", "Outdoor"]
    ].map(function (item) {
      return { id: item[0], name: item[1], category: item[2] };
    }),
    tasks: [
      task("t-med-am", "Medical Center morning clean", "10c", "Ladies Team", "8:00 AM", "9:15 AM", "high", [
        "Empty garbage", "Replace bag", "Wipe counters and high-touch surfaces", "Sweep or spot mop", "Restock restroom if needed"
      ]),
      task("t-dining-ready", "Dining room readiness check", "13", "Men's Team", "8:00 AM", "9:30 AM", "high", [
        "Reset tables/chairs", "Check garbage", "Check dining room restrooms", "Report anything blocking breakfast"
      ]),
      task("t-tc-shul-am", "TC Shul morning reset", "13-basement", "Men's Team", "8:00 AM", "9:30 AM", "high", [
        "Reset seating", "Pick up garbage", "Empty nearby trash", "Check restroom/supplies if applicable"
      ]),
      task("t-gyc-shul-am", "GYC Shul morning check", "8", "Men's Team", "8:00 AM", "10:00 AM", "normal", [
        "Pick up garbage", "Reset area", "Empty trash cans nearby"
      ]),
      task("t-7th-shul-am", "7th Grade Shul morning check", "15", "Men's Team", "8:00 AM", "10:00 AM", "normal", [
        "Pick up garbage", "Reset benches/chairs", "Empty trash cans nearby"
      ]),
      task("t-4th-shul-am", "4th Grade Shul morning check", "16", "Men's Team", "8:00 AM", "10:00 AM", "normal", [
        "Pick up garbage", "Reset area", "Empty trash cans nearby"
      ]),
      task("t-outdoor-cans-am", "Outdoor trash cans morning route", "outdoor", "Men's Team", "8:00 AM", "10:00 AM", "normal", [
        "Empty outdoor cans", "Replace bags", "Bring trash to dumpster"
      ]),
      task("t-benches-am", "Benches and chair clusters check", "outdoor", "Men's Team", "8:00 AM", "10:00 AM", "normal", [
        "Walk benches by buildings 4, 6, 8, and 9", "Pick up garbage", "Reset chairs if moved"
      ]),
      task("t-courts-am", "Courts morning trash check", "outdoor", "Men's Team", "8:00 AM", "10:00 AM", "normal", [
        "Check tennis courts", "Check basketball court near 12", "Empty nearby trash"
      ]),
      task("t-bunks", "Bunk rooms and bathrooms daily round", "13", "Ladies Team", "10:30 AM", "2:00 PM", "normal", [
        "Replenish toilet paper", "Change garbage bags", "Quick clean bathrooms", "Do not enter while campers are sleeping", "Report repairs or missing supplies"
      ]),
      task("t-zal-mid", "Zal midday trash/spill check", "10e", "Ladies Team", "Midday", "1:30 PM", "normal", [
        "Change garbage if full", "Remove food garbage", "Wipe major spills only", "Reset urgent messes"
      ]),
      task("t-kiddie-615", "Kiddie Camp rooms evening clean", "10d", "Ladies Team", "6:15 PM", "6:45 PM", "high", [
        "Clean 10D", "Clean 11E", "Empty garbage", "Replace bags", "Pick up toys/supplies", "Wipe surfaces", "Sweep", "Clean/restock 10D restroom"
      ]),
      task("t-zal-close", "Zal full end-of-day clean", "10e", "Ladies Team", "8:30 PM", "9:00 PM", "high", [
        "Empty garbage", "Wipe counters, tables, sinks", "Sweep", "Mop if needed", "Remove leftover food", "Put supplies away"
      ]),
      task("t-dining-close", "Final dining room reset", "13", "Men's Team", "8:30 PM", "9:00 PM", "high", [
        "Empty garbage", "Reset tables/chairs", "Sweep obvious messes", "Check restrooms", "Prepare for morning"
      ])
    ],
    requests: [
      {
        id: "r-demo",
        title: "Sample staff request: build shelf",
        requester: "Counselor",
        locationId: "11f",
        category: "Maintenance",
        urgency: "normal",
        details: "Pick up shelf from admin office, deliver to family house, and build it.",
        status: "pending",
        createdAt: new Date().toISOString(),
        chat: []
      }
    ],
    supplyRequests: [],
    timeEntries: [],
    buildings: [
      { id: "13", label: "Building #13", name: "Main Building", type: "Building", notes: "Dining room, TC Shul basement, laundry rooms, kitchen storage, and main operations spaces." },
      { id: "10c", label: "Building #10C", name: "Medical Center", type: "Building", notes: "" },
      { id: "10d", label: "Building #10D", name: "Kiddie Camp Room", type: "Building", notes: "" },
      { id: "10e", label: "Building #10E", name: "Zal / Baking Kitchen", type: "Building", notes: "" },
      { id: "11e", label: "Building #11E", name: "Smaller Kiddie Camp Room", type: "Building", notes: "" },
      { id: "11f", label: "Building #11F", name: "Admin Office", type: "Building", notes: "" },
      { id: "12", label: "Building #12", name: "Waitros Lounge / Basketball Court", type: "Building", notes: "" },
      { id: "8", label: "Building #8", name: "CGI Chai Shul", type: "Building", notes: "" },
      { id: "15", label: "Building #15", name: "7th Grade Gazebo Shul", type: "Building", notes: "" },
      { id: "16", label: "Building #16", name: "4th Grade Gazebo Shul", type: "Building", notes: "" },
      { id: "2", label: "Building #2", name: "Home Depot", type: "Building", notes: "Garage / storage building near front-load dumpsters." },
      { id: "container-main-rear", label: "Container", name: "40 ft Storage Container Behind Main Building", type: "Storage", notes: "Cleaning supplies and kitchen supplies." },
      { id: "container-garage-dumpsters", label: "Container", name: "40 ft Storage Container by Home Depot Dumpsters", type: "Storage", notes: "Near the two front-load trash bins by Building #2." }
    ],
    rooms: [
      { id: "room-13-dining", buildingId: "13", name: "Dining Room", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "Main dining room setup and cleaning route." },
      { id: "room-13-tc-shul", buildingId: "13", name: "Basement / TC Shul", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" },
      { id: "room-13-right-laundry", buildingId: "13", name: "Basement Right Laundry Room", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" },
      { id: "room-13-left-laundry", buildingId: "13", name: "Basement Left Laundry Room", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" },
      { id: "room-13-cleaning-storage", buildingId: "13", name: "Basement Cleaning Supply Storage", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "Cleaners and paper goods stored near the laundry rooms." },
      { id: "room-13-kitchen-storage", buildingId: "13", name: "Kitchen Storage Room", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "3 fridges plus chest freezers lining the walls." },
      { id: "room-10c-main", buildingId: "10c", name: "Medical Center Main Room", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" },
      { id: "room-10d-main", buildingId: "10d", name: "Kiddie Camp Room", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" },
      { id: "room-10e-zal", buildingId: "10e", name: "Zal", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" },
      { id: "room-10e-baking", buildingId: "10e", name: "Baking Kitchen", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" },
      { id: "room-11e-main", buildingId: "11e", name: "Smaller Kiddie Camp Room", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" },
      { id: "room-11f-office", buildingId: "11f", name: "Admin Office", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" },
      { id: "room-12-lounge", buildingId: "12", name: "Waitros Lounge", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" },
      { id: "room-8-shul", buildingId: "8", name: "CGI Chai Shul", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" },
      { id: "room-15-shul", buildingId: "15", name: "7th Grade Gazebo Shul", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" },
      { id: "room-16-shul", buildingId: "16", name: "4th Grade Gazebo Shul", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" },
      { id: "room-2-garage", buildingId: "2", name: "Garage / Home Depot Storage", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" },
      { id: "room-container-main-rear", buildingId: "container-main-rear", name: "Storage Container Interior", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "Cleaning supplies and kitchen supplies." },
      { id: "room-container-garage-dumpsters", buildingId: "container-garage-dumpsters", name: "Storage Container Interior", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" }
    ]
  };
})();
