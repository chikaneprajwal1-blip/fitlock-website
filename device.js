// Read the device number from the address, e.g. device.html?id=1
const params = new URLSearchParams(window.location.search);
const id = Number(params.get("id"));
const device = devices[id];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const content = document.getElementById("tabContent");

// ---------- SCREEN TIME TAB ----------
function showScreenTime() {
  let today = 0;
  device.apps.forEach(function (app) { today += app.usage; });

  const weekTotal = device.weekMins.reduce(function (a, b) { return a + b; }, 0);
  const average = Math.round(weekTotal / 7);
    const highest = Math.max(...device.weekMins, 1);
  const bars = device.weekMins.map(function (mins, i) {
    return `<div class="bar-col">
      <div class="bar-fill" style="height:${(mins / highest) * 100}%"></div>
      <span>${days[i]}<br>${formatTime(mins)}</span>
    </div>`;
  }).join("");

  // Most used apps first. We keep each app's position (i) so buttons edit the right one.
  const rows = device.apps
    .map(function (app, i) { return { app: app, i: i }; })
    .sort(function (a, b) { return b.app.usage - a.app.usage; })
    .map(function (item) {
      const blocked = item.app.mode === "block";
      return `<div class="app-row">
        <div><b>${item.app.name}</b><br><span class="muted">${formatTime(item.app.usage)} today</span></div>
        <div>
          <button class="btn-small ${blocked ? "" : "on"}" onclick="setMode(${item.i}, 'free')">Allow</button>
          <button class="btn-small ${blocked ? "danger" : ""}" onclick="setMode(${item.i}, 'block')">Block</button>
        </div>
      </div>`;
    }).join("");

  content.innerHTML = `
    <div class="stats">
      <div class="stat"><span class="stat-label">Today</span><span class="stat-number">${formatTime(today)}</span></div>
      <div class="stat"><span class="stat-label">Daily average</span><span class="stat-number">${formatTime(average)}</span></div>
    </div>
    <h3>Last 7 days</h3>
    <div class="box"><div class="chart">${bars}</div></div>
    <h3>Apps used today</h3>
    <div class="box">${rows}</div>
  `;
}

// Allow or block an app from the Screen time tab
function setMode(appIndex, mode) {
  device.apps[appIndex].mode = mode;
  saveDevices();
  showScreenTime();
}

// ---------- EXERCISE TAB ----------
function totalReps() {
  return device.reps.squats + device.reps.pushups + device.reps.jacks;
}

// Rule: every 10 new reps = 5 bonus minutes. Reps already rewarded are not counted again.
function suggestedBonus() {
  return Math.floor((totalReps() - device.rewarded) / 10) * 5;
}

function showExercise() {
  const weekTotal = device.weekReps.reduce(function (a, b) { return a + b; }, 0);
  const highest = Math.max(...device.weekReps, 1);
  const suggestion = suggestedBonus();

  const bars = device.weekReps.map(function (reps, i) {
    return `<div class="bar-col">
      <div class="bar-fill" style="height:${(reps / highest) * 100}%"></div>
      <span>${days[i]}<br>${reps}</span>
    </div>`;
  }).join("");

  content.innerHTML = `
    <div class="stats">
      <div class="stat"><span class="stat-label">Reps today</span><span class="stat-number">${totalReps()}</span></div>
      <div class="stat"><span class="stat-label">Reps this week</span><span class="stat-number">${weekTotal}</span></div>
      <div class="stat"><span class="stat-label">Bonus minutes given</span><span class="stat-number">${device.bonus}</span></div>
    </div>

    <h3>Reps in the last 7 days</h3>
    <div class="box"><div class="chart">${bars}</div></div>

    <h3>Today's exercises</h3>
    <div class="box">
      <div class="app-row"><span>Squats</span><b>${device.reps.squats}</b></div>
      <div class="app-row"><span>Push-ups</span><b>${device.reps.pushups}</b></div>
      <div class="app-row"><span>Jumping jacks</span><b>${device.reps.jacks}</b></div>
    </div>

    <h3>Give screen time</h3>
    <div class="box">
      <div class="give">
        <button class="btn-small primary" onclick="giveBonus(15)">+15 min</button>
        <button class="btn-small primary" onclick="giveBonus(30)">+30 min</button>
        <button class="btn-small primary" onclick="giveBonus(60)">+60 min</button>
        <button class="btn-small" onclick="resetBonus()">Reset bonus</button>
      </div>
      <button class="btn-small" ${suggestion === 0 ? "disabled" : ""} onclick="acceptSuggestion()">
        Suggested: +${suggestion} min for new reps
      </button>
      <p class="muted">Rule: 10 reps = 5 bonus minutes. The bonus is added to every app that has a time limit.</p>
    </div>
  `;
}

function giveBonus(minutes) {
  device.bonus += minutes;
  saveDevices();
  showExercise();
}

function resetBonus() {
  device.bonus = 0;
  saveDevices();
  showExercise();
}

function acceptSuggestion() {
  device.bonus += suggestedBonus();
  device.rewarded = totalReps();   // these reps now count as rewarded
  saveDevices();
  showExercise();
}

// ---------- CONTROLS TAB ----------
function showControls() {
  const rows = device.apps.map(function (app, i) {
    let stepper = "";

    // The time stepper only appears when the app is set to Limit
    if (app.mode === "limit") {
      stepper = `<span class="stepper">
        <button class="btn-small" onclick="changeLimit(${i}, -15)">−</button>
        <b>${formatTime(app.limit)}</b>
        <button class="btn-small" onclick="changeLimit(${i}, 15)">+</button>
      </span>`;
    }

    return `<div class="app-row">
      <b>${app.name}</b>
      <div class="controls">
        <span class="seg">
          <button class="seg-btn ${app.mode === "free" ? "free-on" : ""}" onclick="setAppMode(${i}, 'free')">Free</button>
          <button class="seg-btn ${app.mode === "limit" ? "limit-on" : ""}" onclick="setAppMode(${i}, 'limit')">Limit</button>
          <button class="seg-btn ${app.mode === "block" ? "block-on" : ""}" onclick="setAppMode(${i}, 'block')">Block</button>
        </span>
        ${stepper}
      </div>
    </div>`;
  }).join("");

  content.innerHTML = `
    <div class="box">${rows}</div>
    <p class="muted">A limit can be changed in 15-minute steps, from 15 minutes up to 8 hours.
    Exercise bonus on top of every limit: ${device.bonus} min.</p>
  `;
}

// Change an app to Free, Limit or Block
function setAppMode(appIndex, mode) {
  const app = device.apps[appIndex];
  app.mode = mode;
  if (mode === "limit" && app.limit < 15) {
    app.limit = 60;   // a new limit starts at 1 hour
  }
  saveDevices();
  showControls();
}

// Add or remove minutes from an app's limit
function changeLimit(appIndex, change) {
  const app = device.apps[appIndex];
  app.limit = Math.min(480, Math.max(15, app.limit + change));  // keep it between 15 and 480
  saveDevices();
  showControls();
}

// ---------- TABS ----------
function showTab(name) {
  document.querySelectorAll(".tab").forEach(function (button) {
    button.classList.toggle("on", button.dataset.tab === name);
  });

  if (name === "screen") showScreenTime();
  if (name === "exercise") showExercise();
  if (name === "controls") showControls();
}

// ---------- START THE PAGE ----------
if (!device) {
  content.textContent = "Device not found.";
} else {
  document.getElementById("deviceName").textContent = device.name;
  document.querySelectorAll(".tab").forEach(function (button) {
    button.addEventListener("click", function () { showTab(button.dataset.tab); });
  });
  showTab("screen");
}