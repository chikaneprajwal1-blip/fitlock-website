// Sample data shared by every page. Later this comes from Firebase.
// mode is "free", "limit" or "block". usage and limit are in minutes.
// weekMins = screen time Mon to Sun. weekReps = exercise reps Mon to Sun (Sun = today).
// reps = today's reps. bonus = extra minutes given. rewarded = reps already turned into bonus.
const defaultDevices = [
  {
    name: "Aarav's phone",
    weekMins: [95, 140, 120, 180, 110, 210, 150],
    weekReps: [20, 35, 0, 40, 25, 50, 30],
    reps: { squats: 15, pushups: 8, jacks: 7 },
    bonus: 0,
    rewarded: 0,
    apps: [
      { name: "YouTube",   mode: "limit", limit: 60, usage: 48 },
      { name: "Instagram", mode: "block", limit: 0,  usage: 35 },
      { name: "WhatsApp",  mode: "free",  limit: 0,  usage: 40 },
      { name: "Games",     mode: "limit", limit: 60, usage: 65 },
      { name: "TikTok",    mode: "block", limit: 0,  usage: 20 }
    ]
  },
  {
    name: "Diya's tablet",
    weekMins: [60, 75, 90, 85, 70, 130, 100],
    weekReps: [10, 25, 30, 15, 20, 45, 40],
    reps: { squats: 20, pushups: 10, jacks: 10 },
    bonus: 15,
    rewarded: 40,
    apps: [
      { name: "Instagram", mode: "block", limit: 0,  usage: 0 },
      { name: "Games",     mode: "limit", limit: 45, usage: 38 },
      { name: "Chrome",    mode: "free",  limit: 0,  usage: 22 }
    ]
  }
];

// The browser remembers changes using localStorage, so they survive a reload.
// If you change the sample data above, change the number in the name (3 to 4) to start fresh.
function loadDevices() {
  const saved = localStorage.getItem("fitlockDevices3");
  return saved ? JSON.parse(saved) : defaultDevices;
}

function saveDevices() {
  localStorage.setItem("fitlockDevices3", JSON.stringify(devices));
}

const devices = loadDevices();

// 90 becomes "1h 30m"
function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return m + "m";
  return m === 0 ? h + "h" : h + "h " + m + "m";
}// ---------- PAIRING CODES ----------
// Codes are stored as { "123456": "Riya's phone" }. Later this lives in Firebase.
function loadCodes() {
  const saved = localStorage.getItem("fitlockCodes");
  return saved ? JSON.parse(saved) : {};
}

function saveCodes(codes) {
  localStorage.setItem("fitlockCodes", JSON.stringify(codes));
}

// A brand-new device starts with every app free and no usage
function newDevice(name) {
  const apps = ["YouTube", "Instagram", "WhatsApp", "Games", "TikTok", "Chrome"];
  return {
    name: name,
    weekMins: [0, 0, 0, 0, 0, 0, 0],
    weekReps: [0, 0, 0, 0, 0, 0, 0],
    reps: { squats: 0, pushups: 0, jacks: 0 },
    bonus: 0,
    rewarded: 0,
    apps: apps.map(function (appName) {
      return { name: appName, mode: "free", limit: 0, usage: 0 };
    })
  };
}// ---------- EXERCISE HELPERS ----------
// Add reps to a device (used by the camera page)
function addRepsToDevice(deviceId, type, count) {
  const device = devices[deviceId];
  if (!device) return;
  device.reps[type] += count;
  device.weekReps[6] += count;   // today is the last day in the list
  saveDevices();
}

function deviceName(deviceId) {
  return devices[deviceId] ? devices[deviceId].name : "Unknown device";
}