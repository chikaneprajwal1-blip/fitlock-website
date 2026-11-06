import { watchDevice, saveDevice, connectWithCode, formatTime } from "./store.js";

// Which device is this phone? From the address (child.html?id=...) or from what it remembered.
let id = new URLSearchParams(window.location.search).get("id");
try {
  if (id) localStorage.setItem("fitlockChildDevice", id);
  else id = localStorage.getItem("fitlockChildDevice");
} catch (e) {}

let device = null;
let stopWatching = null;

// Total minutes allowed = the parent's limit + the exercise bonus
function allowedMinutes(app) {
  return app.limit + device.bonus;
}

// Is this app locked right now?
function isLocked(app) {
  if (app.mode === "block") return true;
  if (app.mode === "limit" && app.usage >= allowedMinutes(app)) return true;
  return false;
}

// Demo buttons: add reps without the camera
function addReps(type, amount) {
  device.reps[type] += amount;
  device.weekReps[6] += amount;   // today is the last day in the list
  saveDevice(id, device);
  render();
}
window.addReps = addReps;

function render() {
  const phone = document.getElementById("phone");

  if (!device) {
    phone.innerHTML = `<p class="muted">This phone is not connected yet. Enter the code from your parent below.</p>`;
    return;
  }

  const appRows = device.apps.map(function (app) {
    const locked = isLocked(app);
    let status;

    if (app.mode === "block") {
      status = `<span class="lock-text">🔒 Blocked by your parent</span>`;
    } else if (locked) {
      status = `<span class="lock-text">🔒 Time is over for today</span>`;
    } else if (app.mode === "limit") {
      const allowed = allowedMinutes(app);
      const left = allowed - app.usage;
      const percent = Math.min(100, (app.usage / allowed) * 100);
      status = `<span class="muted">${formatTime(left)} left</span>
        <div class="progress"><div class="${percent > 80 ? "warn" : ""}" style="width:${percent}%"></div></div>`;
    } else {
      status = `<span class="muted">No limit</span>`;
    }

    return `<div class="app-row ${locked ? "locked" : ""}">
      <div><b>${app.name}</b><br>${status}</div>
    </div>`;
  }).join("");

  const total = device.reps.squats + device.reps.pushups + device.reps.jacks;

  phone.innerHTML = `
    <p class="muted" style="margin-top:0">${device.name}</p>
    <b>Apps</b>
    <div>${appRows}</div>

    <h3>Exercise</h3>
    <div class="stats">
      <div class="stat"><span class="stat-label">Reps today</span><span class="stat-number">${total}</span></div>
      <div class="stat"><span class="stat-label">Bonus minutes</span><span class="stat-number">${device.bonus}</span></div>
    </div>

    <p class="muted">Count reps (demo buttons add 10 reps):</p>
    <button class="btn-small primary" onclick="addReps('squats', 10)">Squats +10</button>
    <button class="btn-small primary" onclick="addReps('pushups', 10)">Push-ups +10</button>
    <button class="btn-small primary" onclick="addReps('jacks', 10)">Jacks +10</button>
    <p><a class="button" style="padding:8px 18px;font-size:15px" href="exercise.html?id=${id}">Count with the camera</a></p>
  `;
}

// Start listening to this device. The screen updates by itself when the parent changes something.
function start() {
  if (stopWatching) stopWatching();
  if (!id) {
    device = null;
    render();
    return;
  }
  stopWatching = watchDevice(id, function (data) {
    device = data;
    render();
  });
}

// Connect with a pairing code
document.getElementById("connectBtn").addEventListener("click", async function () {
  const code = document.getElementById("codeInput").value.replace(/\D/g, "");  // keep digits only
  const message = document.getElementById("connectMsg");
  const button = document.getElementById("connectBtn");

  message.textContent = "";
  button.disabled = true;

  try {
    const newId = await connectWithCode(code);
    if (!newId) {
      message.textContent = "Code not found or too old. Ask your parent for a new one.";
    } else {
      id = newId;
      try { localStorage.setItem("fitlockChildDevice", id); } catch (e) {}
      document.getElementById("codeInput").value = "";
      start();
    }
  } catch (error) {
    message.textContent = "Could not connect (" + (error.code || error.message) + ").";
  }

  button.disabled = false;
});

start();