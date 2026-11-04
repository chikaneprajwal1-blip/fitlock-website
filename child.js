// Which device to show: child.html?id=1, or the first one by default
let current = Number(new URLSearchParams(window.location.search).get("id")) || 0;
if (current >= devices.length) current = 0;

// Total minutes allowed = the parent's limit + the exercise bonus
function allowedMinutes(app, device) {
  return app.limit + device.bonus;
}

// Is this app locked right now?
function isLocked(app, device) {
  if (app.mode === "block") return true;
  if (app.mode === "limit" && app.usage >= allowedMinutes(app, device)) return true;
  return false;
}

// Child taps a button: add reps (a demo for now)
function addReps(type, amount) {
  const device = devices[current];
  device.reps[type] += amount;
  device.weekReps[6] += amount;   // today is the last day in the list
  saveDevices();
  render();
}

function pickDevice(value) {
  current = Number(value);
  render();
}

function render() {
  const device = devices[current];

  // Device picker
  document.getElementById("deviceSelect").innerHTML = devices.map(function (d, i) {
    return `<option value="${i}" ${i === current ? "selected" : ""}>${d.name}</option>`;
  }).join("");

  // App list
  const appRows = device.apps.map(function (app) {
    const locked = isLocked(app, device);
    let status;

    if (app.mode === "block") {
      status = `<span class="lock-text">🔒 Blocked by your parent</span>`;
    } else if (locked) {
      status = `<span class="lock-text">🔒 Time is over for today</span>`;
    } else if (app.mode === "limit") {
      const allowed = allowedMinutes(app, device);
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

  document.getElementById("phone").innerHTML = `
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
    <p><a class="button" style="padding:8px 18px;font-size:15px" href="exercise.html?id=${current}">Count with the camera</a></p>
  `;
}

document.getElementById("deviceSelect").addEventListener("change", function (e) {
  pickDevice(e.target.value);
});

// Connect with a pairing code
document.getElementById("connectBtn").addEventListener("click", function () {
  const code = document.getElementById("codeInput").value.replace(/\D/g, "");  // keep digits only
  const codes = loadCodes();
  const message = document.getElementById("connectMsg");

  if (!codes[code]) {
    message.textContent = "Code not found. Check it and try again.";
    return;
  }

  devices.push(newDevice(codes[code]));   // add the new device
  delete codes[code];                     // a code can only be used once
  saveCodes(codes);
  saveDevices();

  current = devices.length - 1;           // show the new device
  document.getElementById("codeInput").value = "";
  message.textContent = "";
  render();
});

// If the parent changes something in another browser tab, reload to show it
window.addEventListener("storage", function () {
  window.location.reload();
});

render();