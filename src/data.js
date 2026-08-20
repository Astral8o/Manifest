export const CATS = [
  ["CAT.01", "Catering and bar", "Food service, bar packages, staffed or drop-off, dietary options."],
  ["CAT.02", "Venues and space", "Halls, warehouses, gyms, fields and outdoor sites with capacity notes."],
  ["CAT.03", "AV and staging", "Sound, screens, lighting, stages and an operator on site."],
  ["CAT.04", "Furniture and rentals", "Tables, chairs, linens, lounge sets, delivery and pickup."],
  ["CAT.05", "Photo and video", "Event coverage, headshot booths, same-day edits."],
  ["CAT.06", "Print and signage", "Banners, wayfinding, badges, table cards, floor decals."],
  ["CAT.07", "Branded merch", "Shirts, bags, bottles, lanyards and giveaway items."],
  ["CAT.08", "Logistics & Delivery", "Equipment delivery and pickup, transportation, courier services, moving event materials, setup logistics, storage and distribution."],
  ["CAT.09", "Staffing", "Registration, ushers, setup crew, bartenders, security."],
  ["CAT.10", "Entertainment & Talent", "DJs, bands, live performers, MCs, hosts, speakers, presenters, instructors and other event talent."],
  ["CAT.11", "Tents and structures", "Tents, flooring, fans, generators, fencing."],
  ["CAT.12", "Awards and Recognition", "Medals, trophies, plaques, certificates, custom recognition and engraving."],
];

export const PLANNING_REQUIREMENTS = ["Permits", "Safety", "Insurance", "Registration", "Approvals", "Timelines"];

export const EVENTS = [
  ["Corporate offsite", ["CAT.01", "CAT.02", "CAT.03", "CAT.04", "CAT.05", "CAT.08", "CAT.10"], "Staff and internal", 1],
  ["Team building day", ["CAT.01", "CAT.02", "CAT.08", "CAT.10"], "Staff and internal", 1],
  ["Christmas party", ["CAT.01", "CAT.02", "CAT.04", "CAT.05", "CAT.10"], "Staff and internal", 1],
  ["Company fete", ["CAT.01", "CAT.02", "CAT.03", "CAT.09", "CAT.10"], "Staff and internal", 0],
  ["Award ceremony", ["CAT.01", "CAT.02", "CAT.03", "CAT.05", "CAT.10"], "Staff and internal", 0],
  ["Staff training day", ["CAT.01", "CAT.02", "CAT.03", "CAT.06"], "Staff and internal", 0],
  ["Team hackathon", ["CAT.01", "CAT.02", "CAT.03", "CAT.07"], "Staff and internal", 0],
  ["Product launch", ["CAT.01", "CAT.02", "CAT.03", "CAT.05", "CAT.06", "CAT.07", "CAT.10"], "Customer facing", 1],
  ["Networking mixer", ["CAT.01", "CAT.02", "CAT.04", "CAT.05", "CAT.09"], "Customer facing", 1],
  ["Trade show booth", ["CAT.03", "CAT.04", "CAT.06", "CAT.07", "CAT.09"], "Customer facing", 1],
  ["Conference", ["CAT.01", "CAT.02", "CAT.03", "CAT.05", "CAT.06", "CAT.09"], "Customer facing", 0],
  ["Open house", ["CAT.01", "CAT.04", "CAT.06", "CAT.10"], "Customer facing", 0],
  ["Client appreciation dinner", ["CAT.01", "CAT.02", "CAT.04", "CAT.05"], "Customer facing", 0],
  ["Church harvest or fundraiser", ["CAT.01", "CAT.04", "CAT.06", "CAT.09", "CAT.11"], "Community and fundraising", 1],
  ["5K or charity run", ["CAT.06", "CAT.08", "CAT.09", "CAT.11", "CAT.12", "CAT.07"], "Community and fundraising", 1],
  ["School fair", ["CAT.01", "CAT.04", "CAT.06", "CAT.10", "CAT.11"], "Community and fundraising", 0],
  ["Graduation", ["CAT.01", "CAT.02", "CAT.03", "CAT.05", "CAT.06"], "Community and fundraising", 0],
  ["Community meeting", ["CAT.02", "CAT.03", "CAT.04", "CAT.09"], "Community and fundraising", 0],
];
export const EVENT_GROUPS = ["Staff and internal", "Customer facing", "Community and fundraising"];

export const SUPPLIERS = [
  { id: "s1", code: "CAT.01", name: "Cocoa Pod Catering", city: "Port of Spain", region: "Port of Spain", desc: "Family kitchen doing seated dinners and staffed buffets since 2009. Handles vegetarian and no-pork requests without an upcharge and brings its own service ware.",
    tags: ["Staffed service", "Vegetarian and no pork", "Own service ware"], minGroup: 25, lead: 10, radius: 60, rating: "4.8 (126)", response: "Replies in ~4 hrs",
    bio: "Family-run caterer serving Port of Spain since 2009.",
    phone: "+1 868 622 0147", instagram: "@cocoapodcatering", facebook: "Cocoa Pod Catering",
    reviews: [
      { author: "Michelle A.", stars: 5, text: "Booked them for our office Christmas party, 90 people. The vegetarian plates were incredible and nobody felt like an afterthought." },
      { author: "Kern R.", stars: 4, text: "Solid buffet, showed up on time and cleaned up well. Would have liked a few more dessert options." },
      { author: "Priya S.", stars: 5, text: "Used Cocoa Pod for two events now. Consistent quality and they actually listen when you ask for changes." },
    ],
    products: [
      ["Seated dinner service", "Three courses, plated, with two servers per 25 guests.", 320, 480, "per guest", 25, 14],
      ["Drop-off buffet", "Hot trays, serving utensils, disposable ware. No staff on site.", 150, 230, "per guest", 20, 7],
      ["Coffee and pastry cart", "Two-hour morning service with a barista.", 60, 95, "per guest", 15, 5],
    ] },
  { id: "s2", code: "CAT.01", name: "Maracas Road Kitchen", city: "Chaguanas", region: "Chaguanas", desc: "Volume caterer built for church halls and school auditoriums. Straightforward local menus, large batches, clear per-guest pricing.",
    tags: ["Large groups", "Halal options", "Weekend availability"], minGroup: 60, lead: 14, radius: 70, rating: "4.6 (84)", response: "Replies in ~1 day",
    bio: "Volume caterer for churches and schools in Chaguanas.",
    phone: "+1 868 671 5528", instagram: "@maracasroadkitchen", facebook: "Maracas Road Kitchen",
    reviews: [
      { author: "Father Anthony", stars: 5, text: "Fed 200 people at our harvest fundraiser without a hitch. Portions were generous and the sorrel was a hit." },
      { author: "Denise C.", stars: 4, text: "Good value for large groups. Setup took a little longer than expected but the food made up for it." },
      { author: "Ravi M.", stars: 5, text: "Halal option was clearly labeled and separately served. Appreciated the attention to detail." },
    ],
    products: [
      ["Hot lunch buffet", "Two mains, two sides, provisions, sorrel or juice. Chafing dishes included.", 110, 165, "per guest", 60, 10],
      ["Dessert table", "Assorted cakes, sweetbread, fruit, plates and napkins.", 35, 55, "per guest", 40, 7],
      ["Bar package", "Beer, rum, mixers and two bartenders.", 6000, 11000, "flat", 1, 14],
    ] },
  { id: "s3", code: "CAT.02", name: "The Wrightson Room", city: "Port of Spain", region: "Port of Spain", desc: "Converted warehouse near the waterfront with 4,200 square feet, roll-up door load-in and house tables. Good for dinners, all-hands and small trade shows.",
    tags: ["Capacity 220", "Load-in door", "House tables included"], minGroup: 40, lead: 21, radius: 0, rating: "4.9 (58)", response: "Replies same day",
    priceOnRequest: true,
    bio: "Waterfront warehouse venue in Port of Spain.",
    phone: "+1 868 623 9016", instagram: "@thewrightsonroom", facebook: "The Wrightson Room",
    reviews: [
      { author: "Alicia F.", stars: 5, text: "Beautiful space with real character. The roll-up door made load-in for our trade show painless." },
      { author: "Simeon P.", stars: 4, text: "Great for a dinner of 150. Parking nearby is limited so plan for that." },
      { author: "Kayla D.", stars: 5, text: "Booked the full day rental for a product launch. Staff on site were helpful the whole time." },
    ],
    products: [
      ["Full day rental", "8am to 11pm, house tables and chairs, two staff on site.", 16000, 22000, "flat", 1, 21],
      ["Evening rental", "5pm to midnight, includes setup hour.", 9500, 13000, "flat", 1, 14],
      ["Load-in day", "Prior-day access for build and rehearsal.", 2600, 4000, "flat", 1, 14],
    ] },
  { id: "s4", code: "CAT.02", name: "Cipero Fieldhouse", city: "San Fernando", region: "San Fernando", desc: "Indoor hard court with bleachers, plus a paved lot for start and finish lines. Used often for runs, expos and community events.",
    tags: ["Capacity 600", "Parking for 180", "Outdoor lot"], minGroup: 100, lead: 30, radius: 0, rating: "4.5 (41)", response: "Replies in ~2 days",
    priceOnRequest: true,
    bio: "Indoor court and outdoor lot venue in San Fernando.",
    phone: "+1 868 652 3384", instagram: "@ciperofieldhouse", facebook: "Cipero Fieldhouse",
    reviews: [
      { author: "Marcus J.", stars: 5, text: "Ran our 5K start and finish from their lot. Plenty of space and the staff handled the cone layout perfectly." },
      { author: "Tricia B.", stars: 4, text: "Court held our expo fine, just get there early to beat the bleacher line for setup." },
      { author: "Odele K.", stars: 5, text: "Reliable and affordable for a community event this size." },
    ],
    products: [
      ["Court and lot, full day", "Court, restrooms and lot access from 6am.", 12000, 17500, "flat", 1, 30],
      ["Half day, court only", "Four hours with bleacher seating for 300.", 5000, 7500, "flat", 1, 21],
      ["Lot only, race staging", "Start and finish area with cone layout by staff.", 3400, 4800, "flat", 1, 21],
    ] },
  { id: "s5", code: "CAT.03", name: "Sound Base AV", city: "Port of Spain", region: "Port of Spain", desc: "Two-person crews for talks, panels and awards nights. Everything comes with an operator, so nobody on your team runs the board.",
    tags: ["Operator included", "Backup gear on site", "Hybrid streaming"], minGroup: 1, lead: 7, radius: 120, rating: "4.9 (167)", response: "Replies in ~2 hrs",
    priceOnRequest: true,
    bio: "Operator-run AV crew based in Port of Spain.",
    phone: "+1 868 625 7710", instagram: "@soundbaseav", facebook: "Sound Base AV",
    reviews: [
      { author: "Nigel S.", stars: 5, text: "Their tech ran the whole show, mics never cut out once during a three hour awards night." },
      { author: "Farah A.", stars: 5, text: "Backup gear on-site saved us when a mic pack died mid-panel. Barely missed a beat." },
      { author: "Devon L.", stars: 4, text: "Good sound, slightly pricier than others but worth it for the peace of mind." },
    ],
    products: [
      ["Speaker package", "Two speakers, two wireless mics, mixer, one tech for six hours.", 5800, 8200, "flat", 1, 7],
      ["Screen and projector", "12 foot screen, 7,000 lumen projector, cable run and confidence monitor.", 4000, 6400, "flat", 1, 7],
      ["Stage wash lighting", "Eight fixtures on truss with a basic look and one operator.", 4800, 7500, "flat", 1, 10],
    ] },
  { id: "s6", code: "CAT.04", name: "Ironwood Rentals", city: "Chaguanas", region: "Chaguanas", desc: "Tables, chairs, linens and lounge furniture with next-day delivery across the east-west corridor. Counts are confirmed at pickup, so you only pay for what you use.",
    tags: ["Next day delivery", "Linens laundered", "Flexible counts"], minGroup: 1, lead: 3, radius: 65, rating: "4.7 (203)", response: "Replies in ~5 hrs",
    bio: "Furniture and rental house covering the east-west corridor.",
    phone: "+1 868 665 2249", instagram: "@ironwoodrentals", facebook: "Ironwood Rentals",
    reviews: [
      { author: "Sonia W.", stars: 5, text: "Delivered the day before like promised, chairs were clean and counted correctly." },
      { author: "Andre H.", stars: 4, text: "Linens were nicely pressed. One table had a wobble but they swapped it fast." },
      { author: "Michelle T.", stars: 5, text: "Flexible on final counts, which saved us money when a few guests dropped." },
    ],
    products: [
      ["Round table with 8 chairs", "60 inch round, folding chairs, delivered and stacked.", 230, 290, "per set", 5, 3],
      ["Linen set", "Floor length cloth and eight napkins, pressed.", 120, 175, "per table", 5, 3],
      ["Lounge grouping", "Two sofas, two chairs, coffee table, rug.", 2600, 3500, "flat", 1, 5],
    ] },
  { id: "s7", code: "CAT.05", name: "Northside Film and Photo", city: "Port of Spain", region: "Port of Spain", desc: "Documentary event coverage and a fast headshot setup. Galleries land within three days, licensed for internal and marketing use.",
    tags: ["3 day turnaround", "Full usage rights", "Two shooters available"], minGroup: 1, lead: 5, radius: 140, rating: "4.8 (95)", response: "Replies in ~6 hrs",
    bio: "Event photography and video studio in Port of Spain.",
    phone: "+1 868 627 4482", instagram: "@northsidefilmphoto", facebook: "Northside Film and Photo",
    reviews: [
      { author: "Kwame O.", stars: 5, text: "Gallery landed in two days, way ahead of schedule. Photos captured the whole night well." },
      { author: "Renee V.", stars: 5, text: "Headshot station kept the line moving fast for 40 staff. Retouching was tasteful, not overdone." },
      { author: "Josiah B.", stars: 4, text: "Good coverage, would like a bit more candid shots next time." },
    ],
    products: [
      ["Event coverage, 4 hours", "One photographer, edited gallery in three days.", 6000, 8800, "flat", 1, 5],
      ["Headshot station", "Backdrop, lights, retouched selects for up to 40 people.", 8000, 11000, "flat", 1, 7],
      ["Same day highlights", "Fifteen edited frames delivered before you leave.", 2400, 3100, "flat", 1, 5],
    ] },
  { id: "s8", code: "CAT.06", name: "Ridgeway Print and Signs", city: "Arima", region: "Arima", desc: "Signage shop that handles wayfinding for runs and expos. Sends a proof within a day and will hold files for reprints next year.",
    tags: ["Next day proofs", "Weatherproof stock", "Files kept on file"], minGroup: 1, lead: 6, radius: 160, rating: "4.7 (152)", response: "Replies in ~3 hrs",
    bio: "Signage and print shop based in Arima.",
    phone: "+1 868 667 3390", instagram: "@ridgewayprintsigns", facebook: "Ridgeway Print and Signs",
    reviews: [
      { author: "Camille R.", stars: 5, text: "Proof came back next morning exactly as requested. Banners held up fine outdoors in the rain." },
      { author: "Terrence A.", stars: 4, text: "Badges were sorted alphabetically like they said, made registration painless." },
      { author: "Nadia F.", stars: 5, text: "Kept our files on record and reprinted the same signs a year later with zero back and forth." },
    ],
    products: [
      ["Vinyl banner, 3x8 ft", "Full colour, hemmed with grommets.", 620, 950, "each", 1, 6],
      ["Wayfinding sign set", "Ten yard signs with stakes, mixed messages.", 1400, 2000, "per set", 1, 6],
      ["Name badges", "Printed badges with lanyards, sorted alphabetically.", 14, 26, "per guest", 25, 8],
    ] },
  { id: "s9", code: "CAT.09", name: "Crossroads Event Staffing", city: "San Fernando", region: "San Fernando", desc: "Registration, ushers and setup crews booked by the shift. Staff arrive briefed, in plain black, with a lead on site for groups over six.",
    tags: ["Booked by shift", "Lead on site", "Police certificate on file"], minGroup: 2, lead: 5, radius: 80, rating: "4.6 (78)", response: "Replies in ~8 hrs",
    bio: "Event staffing agency based in San Fernando.",
    phone: "+1 868 653 8871", instagram: "@crossroadsstaffing", facebook: "Crossroads Event Staffing",
    reviews: [
      { author: "Wendy L.", stars: 5, text: "Registration staff arrived briefed and on time, badge line never backed up." },
      { author: "Curtis N.", stars: 4, text: "Setup crew worked fast. Would book again for a bigger event." },
      { author: "Aaliyah G.", stars: 5, text: "The event lead kept our schedule on track the entire night." },
    ],
    products: [
      ["Registration staff", "Check-in and badge handout, four hour minimum.", 210, 270, "per hour", 2, 5],
      ["Setup and teardown crew", "Room flips, chairs, signage placement.", 250, 320, "per hour", 3, 5],
      ["Event lead", "Runs the schedule and manages your staff on site.", 370, 460, "per hour", 1, 7],
    ] },
  { id: "s10", code: "CAT.10", name: "Sundown Sound", city: "Scarborough, Tobago", region: "Tobago", desc: "DJs and hosts who read a corporate room. Brings its own small PA, so you can skip a separate AV order for parties under 150.",
    tags: ["PA included", "Clean edits only", "Host or DJ"], minGroup: 1, lead: 12, radius: 40, rating: "4.8 (119)", response: "Replies in ~5 hrs",
    bio: "DJ and hosting duo based in Scarborough, Tobago.",
    phone: "+1 868 639 5527", instagram: "@sundownsoundtt", facebook: "Sundown Sound",
    reviews: [
      { author: "Shania P.", stars: 5, text: "DJ read the room perfectly, kept the dance floor full all night." },
      { author: "Learie D.", stars: 5, text: "Emcee ran our awards segment smoothly, kept the pace tight." },
      { author: "Vashti C.", stars: 4, text: "Good energy, PA was plenty loud for our 120 guest party." },
    ],
    products: [
      ["DJ, four hours", "Setup, PA for 150, requests taken in advance.", 5000, 7500, "flat", 1, 12],
      ["Emcee for programme", "Runs awards or auction segments, two hours.", 2700, 4000, "flat", 1, 12],
      ["Trivia and games hour", "Host, buzzers, scoring, prizes not included.", 3000, 4400, "flat", 1, 14],
    ] },
];

export const LOCATIONS = ["All areas", "Port of Spain", "San Fernando", "Chaguanas", "Arima", "Tobago"];
export const GROUPS = [["Any size", 0], ["Under 40", 40], ["40 to 100", 100], ["100+", 1000]];

export const FIELDS = {
  "CAT.01": [
    { k: "style", label: "Serving style", type: "choice", options: ["Buffet", "Plated", "Drop-off"] },
    { k: "diet", label: "Dietary plates", type: "text", ph: "e.g. 6 vegetarian, 2 no pork" },
    { k: "window", label: "Service window", type: "text", ph: "e.g. food out by 7pm" },
  ],
  "CAT.02": [
    { k: "setup", label: "Setup style", type: "choice", options: ["Rounds", "Theatre", "Standing"] },
    { k: "access", label: "Access needed from", type: "text", ph: "e.g. 10am for build" },
  ],
  "CAT.03": [
    { k: "power", label: "Power at venue", type: "choice", options: ["Yes", "No", "Not sure"] },
    { k: "presenters", label: "Presenters and mics", type: "text", ph: "e.g. 3 speakers, 1 roving mic" },
  ],
  "CAT.04": [
    { k: "delivery", label: "Delivery", type: "text", ph: "e.g. Friday before, morning" },
    { k: "pickup", label: "Pickup", type: "text", ph: "e.g. Sunday after 10am" },
    { k: "placement", label: "Placement", type: "text", ph: "e.g. 8 rounds in the hall, 2 outside" },
  ],
  "CAT.05": [
    { k: "coverage", label: "Coverage window", type: "text", ph: "e.g. 5pm to 9pm, arrivals and awards" },
    { k: "deliver", label: "Deliverables", type: "choice", options: ["Gallery", "Gallery and video", "Prints too"] },
  ],
  "CAT.06": [
    { k: "artwork", label: "Artwork", type: "choice", options: ["Ready to print", "Need design help"] },
    { k: "copy", label: "Text on the piece", type: "text", ph: "e.g. Harvest Fair 2026, arrow left" },
  ],
  "CAT.09": [
    { k: "shift", label: "Shift start", type: "text", ph: "e.g. 3pm, one hour before doors" },
    { k: "hours", label: "Hours per person", type: "text", ph: "e.g. 6" },
    { k: "uniform", label: "Dress", type: "choice", options: ["Plain black", "Branded shirt", "Formal"] },
  ],
  "CAT.10": [
    { k: "set", label: "Set length", type: "text", ph: "e.g. two 90 minute sets" },
    { k: "style", label: "Music or format", type: "text", ph: "e.g. soca and classics, no explicit" },
    { k: "stage", label: "Stage and power", type: "choice", options: ["We provide", "You provide", "Not sure"] },
  ],
};

export const TIERS = [
  ["Under TT$10,000", "Usually one or two items, up to about 50 guests", 500],
  ["TT$10,000 to 50,000", "A few suppliers, roughly 50 to 200 guests", 1500],
  ["TT$50,000 to 150,000", "Most categories covered, 200 to 500 guests", 4000],
  ["Over TT$150,000", "Full event build, 500 guests or more", 8000],
];

export const FIELDS_DEFAULT = [{ k: "notes", label: "Anything specific to this item", type: "text", ph: "Sizes, colours, timing" }];

export function money(n) {
  return "TT$" + n.toLocaleString("en-US");
}
