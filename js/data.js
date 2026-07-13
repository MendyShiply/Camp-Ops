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
    schemaVersion: 11,
    users: [
      { id: "u-mendy", firstName: "Mendy", lastName: "", name: "Mendy", email: "", phone: "", role: "owner", team: "Operations" },
      { id: "u-malka", firstName: "Malka", lastName: "Aisenbach", name: "Malka Aisenbach", email: "", phone: "", role: "director", team: "Director" },
      { id: "u-jenny", firstName: "Jenny", lastName: "", name: "Jenny", email: "", phone: "", role: "worker", team: "Ladies Team" },
      { id: "u-michelle", firstName: "Michelle", lastName: "", name: "Michelle", email: "", phone: "", role: "worker", team: "Ladies Team" },
      { id: "u-william", firstName: "William", lastName: "", name: "William", email: "", phone: "", role: "worker", team: "Men's Team" },
      { id: "u-miguel", firstName: "Miguel", lastName: "", name: "Miguel", email: "", phone: "", role: "worker", team: "Men's Team" },
      { id: "u-chino", firstName: "Chino", lastName: "", name: "Chino", email: "", phone: "", role: "worker", team: "Men's Team" },
      { id: "u-george", firstName: "George", lastName: "", name: "George", email: "", phone: "", role: "worker", team: "Men's Team" }
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
      ["10e", "Building #10 - Room E - Zal / Baking", "Kitchen"],
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
        chat: [],
        costActual: 0,
        taskId: ""
      }
    ],
    supplyRequests: [],
    inventory: [
      {
        id: "inv-toilet-paper",
        item: "Toilet paper",
        category: "Cleaning",
        manufacturer: "Bulk paper supplier",
        sku: "TP-CASE-12",
        color: "White",
        size: "Case of 12 rolls",
        itemUrl: "",
        codes: "restroom-paper",
        quantity: 52,
        unit: "cases of 12",
        packageCount: 52,
        packageQty: 12,
        purchaseDate: "",
        purchasedBy: "",
        purchaseStore: "Bulk paper supplier",
        lowAt: 12,
        requestQty: 24,
        autoRequestTo: "u-malka",
        autoRequest: true,
        locations: [
          { locationId: "container-main-rear", quantity: 50, note: "40 ft container behind the main building" },
          { locationId: "13-basement-cleaning-supplies", quantity: 2, note: "Basement by cleaning supplies" }
        ],
        notes: "Used for bunks, bathrooms, and main building restock."
      },
      {
        id: "inv-garbage-bags",
        item: "Garbage bags",
        category: "Cleaning",
        manufacturer: "Bulk janitorial supplier",
        sku: "GB-BOX",
        color: "Black",
        size: "Contractor / large can liners",
        itemUrl: "",
        codes: "trash-route",
        quantity: 18,
        unit: "boxes",
        packageCount: 18,
        packageQty: 1,
        purchaseDate: "",
        purchasedBy: "",
        purchaseStore: "Bulk janitorial supplier",
        lowAt: 8,
        requestQty: 12,
        autoRequestTo: "",
        autoRequest: false,
        locations: [
          { locationId: "13-basement-cleaning-supplies", quantity: 8, note: "Daily cleaning supply shelf" },
          { locationId: "container-main-rear", quantity: 10, note: "Bulk storage" }
        ],
        notes: ""
      },
      {
        id: "inv-milwaukee-drill",
        item: "Milwaukee drill",
        category: "Tools / Hardware",
        manufacturer: "Milwaukee",
        sku: "DRILL-M18",
        color: "Red / black",
        size: "M18 cordless drill",
        itemUrl: "",
        codes: "home-depot-garage, cordless-tool",
        quantity: 1,
        unit: "each",
        packageCount: 1,
        packageQty: 1,
        purchaseDate: "",
        purchasedBy: "",
        purchaseStore: "Home Depot",
        lowAt: 1,
        requestQty: 1,
        autoRequestTo: "",
        autoRequest: false,
        locations: [
          { locationId: "2", quantity: 1, note: "Home Depot garage" }
        ],
        notes: "Specific tool record. Add purchase date, buyer, store, and link once confirmed."
      }
    ],
    notifications: [],
    timeEntries: [],
    buildings: [
      { id: "13", label: "Building #13", name: "Main Building", type: "Building", notes: "Dining room, TC Shul basement, laundry rooms, kitchen storage, and main operations spaces." },
      { id: "10c", label: "Building #10C", name: "Medical Center", type: "Building", notes: "" },
      { id: "10d", label: "Building #10D", name: "Kiddie Camp Room", type: "Building", notes: "" },
      { id: "10e", label: "Building #10", name: "Room E - Zal / Baking", type: "Building", notes: "" },
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
      { id: "room-10e-zal-baking", buildingId: "10e", name: "Room E - Zal / Baking", assignment: "", beds: 0, bunkBeds: 0, toilets: 0, sinks: 0, showers: 0, notes: "" },
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

  var seed = window.CampOpsSeed;

  function addLocation(id, name, category) {
    if (!seed.locations.some(function (item) { return item.id === id; })) {
      seed.locations.push({ id: id, name: name, category: category });
    }
  }

  function addBuilding(id, label, name, type, notes) {
    if (!seed.buildings.some(function (item) { return item.id === id; })) {
      seed.buildings.push({ id: id, label: label, name: name, type: type || "Building", notes: notes || "" });
    }
  }

  function addRoom(id, buildingId, name, assignment, notes) {
    if (!seed.rooms.some(function (item) { return item.id === id; })) {
      seed.rooms.push({
        id: id,
        buildingId: buildingId,
        name: name,
        assignment: assignment || "",
        beds: 0,
        bunkBeds: 0,
        toilets: 0,
        sinks: 0,
        showers: 0,
        notes: notes || ""
      });
    }
  }

  [
    ["1a", "Building #1", "Room A - Mendy House", "House", "Mendy house."],
    ["1b", "Building #1", "Room B - Mendy House", "House", "Mendy house."],
    ["3a", "Building #3", "Room A - Aisenbach House", "House", "Aisenbach house."],
    ["3b", "Building #3", "Room B - Junik House", "House", "Junik house."],
    ["4a", "Building #4", "Room A - House / Bunk House", "House", ""],
    ["4b", "Building #4", "Room B - Teen 8", "House", ""],
    ["4c", "Building #4", "Room C - House / Bunk House", "House", ""],
    ["4d", "Building #4", "Room D - House / Bunk House", "House", ""],
    ["4e", "Building #4", "Room E - Teen 7", "House", ""],
    ["5a", "Building #5", "Room A - Teen 3", "House", ""],
    ["5b", "Building #5", "Room B - Teen 4", "House", ""],
    ["6a", "Building #6", "Room A - Teen 1", "House", ""],
    ["6b", "Building #6", "Room B - Teen 2", "House", ""],
    ["7a", "Building #7", "Room A - Teen 6", "House", ""],
    ["7b", "Building #7", "Room B - Teen 5", "House", ""],
    ["9a", "Building #9", "Room A - Bunk Alef", "Bunk House", ""],
    ["9b", "Building #9", "Room B - Lifeguards", "Staff", ""],
    ["9c", "Building #9", "Room C - Bunk Yud Alef", "Bunk House", ""],
    ["9d", "Building #9", "Room D - Bunk Yud Daled", "Bunk House", ""],
    ["9e", "Building #9", "Room E - 7th Staff", "Staff", ""],
    ["9f", "Building #9", "Room F - Bathrooms", "Bathrooms", ""],
    ["9g", "Building #9", "Room G - Bunk Yud Gimmel", "Bunk House", ""],
    ["9h", "Building #9", "Room H - Bunk Beis", "Bunk House", ""],
    ["9i", "Building #9", "Room I - Bunk Yud Beis", "Bunk House", ""],
    ["9j", "Building #9", "Room J - KCC", "Program", ""],
    ["10a", "Building #10", "Room A - Bunk / House", "House", ""],
    ["10b", "Building #10", "Room B - Bunk / House", "House", ""],
    ["10c", "Building #10", "Room C - Medical Center", "Building", ""],
    ["10d", "Building #10", "Room D - Kiddie Camp", "Building", ""],
    ["10e", "Building #10", "Room E - Zal / Baking", "Building", ""],
    ["11a", "Building #11", "Apartment A - House / Bunk House", "House", ""],
    ["11b", "Building #11", "Apartment B - House / Bunk House", "House", ""],
    ["11c", "Building #11", "Apartment C - Pruss Family", "House", "Two-floor apartment."],
    ["11d", "Building #11", "Apartment D - House / Bunk House", "House", ""]
  ].forEach(function (item) {
    addLocation(item[0], item[1] + " - " + item[2], item[3]);
    addBuilding(item[0], item[1], item[2], item[3], item[4]);
    addRoom("room-" + item[0] + "-main", item[0], item[2], "", "");
  });

  [
    ["room-13-fl1-dining", "Floor 1 - Dining Room", "", ""],
    ["room-13-fl1-kitchen", "Floor 1 - Kitchen", "", ""],
    ["room-13-fl1-headstaff-offices", "Floor 1 - Headstaff Offices", "Headstaff", ""],
    ["room-13-fl2-headstaff-4b", "Floor 2 - Headstaff", "4B", ""],
    ["room-13-fl2-counselors-3b", "Floor 2 - Counselors", "3B", ""],
    ["room-13-fl2-bunk-hei-6b", "Floor 2 - Bunk Hei", "6B", ""],
    ["room-13-fl2-bunk-daled-7b-8b-9b", "Floor 2 - Bunk Daled", "7B, 8B, 9B", ""],
    ["room-13-fl2-bunk-gimmel-12b", "Floor 2 - Bunk Gimmel", "12B", ""],
    ["room-13-fl2-bunk-vov-2b-1b", "Floor 2 - Bunk Vov", "2B, 1B", "Map notes also mention 10B and 11B as possible spaces."],
    ["room-13-fl2-10b-11b", "Floor 2 - 10B / 11B possible rooms", "", "Needs final confirmation."],
    ["room-13-fl3-counselors-4c", "Floor 3 - Counselors", "4C", ""],
    ["room-13-fl3-bunk-tes-5c-6c", "Floor 3 - Bunk Tes", "5C, 6C", ""],
    ["room-13-fl3-bunk-ches-7c-8c", "Floor 3 - Bunk Ches", "7C, 8C", ""],
    ["room-13-fl3-bunk-zayin-12c-11c-10c", "Floor 3 - Bunk Zayin", "12C, 11C, 10C", ""],
    ["room-13-fl3-bunk-yud-1c-2c", "Floor 3 - Bunk Yud", "1C, 2C", "2C was marked with a question mark on the map."],
    ["room-13-fl3-headstaff-2c", "Floor 3 - Headstaff", "2C", ""],
    ["room-13-fl3-9c-possible", "Floor 3 - 9C possible room", "", "Needs final confirmation."],
    ["room-13-basement-canteen", "Basement - Canteen", "", ""],
    ["room-13-basement-gyc-counselors-lounge", "Basement - CGI Chai Counselors Lounge", "", ""]
  ].forEach(function (item) {
    addRoom(item[0], "13", item[1], item[2], item[3]);
  });
})();
