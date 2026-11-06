import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, setDoc, deleteDoc, query, where, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------- LOGIN ----------
// Runs onReady(user) when a parent is logged in. Otherwise goes to the login page.
export function requireParent(onReady) {
  onAuthStateChanged(auth, function (user) {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    document.body.classList.add("ready");
    const who = document.getElementById("userEmail");
    if (who) who.textContent = user.email;
    onReady(user);
  });
}

const logoutLink = document.getElementById("logout");
if (logoutLink) {
  logoutLink.addEventListener("click", async function (event) {
    event.preventDefault();
    await signOut(auth);
    window.location.href = "index.html";
  });
}

// ---------- SMALL HELPERS ----------
// 90 becomes "1h 30m"
export function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return m + "m";
  return m === 0 ? h + "h" : h + "h " + m + "m";
}

function showError(error) {
  console.error(error);
  alert("Database problem: " + (error.code || error.message));
}

// A brand-new device starts with every app free and no usage
export function newDevice(name, ownerId) {
  const apps = ["YouTube", "Instagram", "WhatsApp", "Games", "TikTok", "Chrome"];
  return {
    ownerId: ownerId,
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
}

// Two demo devices with sample numbers (for presentations)
export async function addSampleDevices(ownerId) {
  const samples = [
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

  try {
    for (const sample of samples) {
      await setDoc(doc(collection(db, "devices")), { ...sample, ownerId: ownerId });
    }
  } catch (error) {
    showError(error);
  }
}

// ---------- DEVICES ----------
// Calls callback(list) now and every time this parent's devices change
export function watchMyDevices(ownerId, callback) {
  const q = query(collection(db, "devices"), where("ownerId", "==", ownerId));
  return onSnapshot(q, function (snapshot) {
    const list = snapshot.docs.map(function (d) { return { id: d.id, ...d.data() }; });
    list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    callback(list);
  }, showError);
}

// Calls callback(device) now and every time this one device changes (null if it doesn't exist)
export function watchDevice(id, callback) {
  return onSnapshot(doc(db, "devices", id), function (snap) {
    callback(snap.exists() ? snap.data() : null);
  }, showError);
}

export async function saveDevice(id, device) {
  try {
    await setDoc(doc(db, "devices", id), device);
  } catch (error) {
    showError(error);
  }
}

// ---------- PAIRING ----------
export async function createPairing(ownerId, name) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await setDoc(doc(db, "pairings", code), { ownerId: ownerId, name: name, createdAt: Date.now() });
  return code;
}

// Returns the new device's id, or null if the code is wrong or too old
export async function connectWithCode(code) {
  const ref = doc(db, "pairings", code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const pairing = snap.data();
  if (Date.now() - pairing.createdAt > 15 * 60 * 1000) {   // codes last 15 minutes
    await deleteDoc(ref);
    return null;
  }

  const deviceRef = doc(collection(db, "devices"));
  await setDoc(deviceRef, newDevice(pairing.name, pairing.ownerId));
  await deleteDoc(ref);   // a code works only once
  return deviceRef.id;
}// ---------- EXERCISE ----------
// Add reps to a device's totals (used by the camera page)
export async function addRepsToDevice(id, type, count) {
  try {
    const ref = doc(db, "devices", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    data.reps[type] += count;
    data.weekReps[6] += count;   // today is the last day in the list
    await setDoc(ref, data);
  } catch (error) {
    showError(error);
  }
}

export async function getDeviceName(id) {
  try {
    const snap = await getDoc(doc(db, "devices", id));
    return snap.exists() ? snap.data().name : "Unknown device";
  } catch (error) {
    return "Unknown device";
  }
}