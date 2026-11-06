import { requireParent, watchMyDevices, createPairing, addSampleDevices, formatTime } from "./store.js";

const list = document.getElementById("deviceList");

// Draw the counters and a card for each device
function draw(devices) {
  let blockedCount = 0;
  let limitCount = 0;

  devices.forEach(function (device) {
    device.apps.forEach(function (app) {
      if (app.mode === "block") blockedCount++;
      if (app.mode === "limit") limitCount++;
    });
  });

  document.getElementById("countDevices").textContent = devices.length;
  document.getElementById("countBlocked").textContent = blockedCount;
  document.getElementById("countLimits").textContent = limitCount;

  if (devices.length === 0) {
    list.innerHTML = `<p class="muted">No devices yet. Create a pairing code below, or add sample devices.</p>`;
    return;
  }

  list.innerHTML = devices.map(function (device) {
    let totalUsage = 0;
    let tags = "";

    device.apps.forEach(function (app) {
      totalUsage += app.usage;
      if (app.mode === "block") {
        tags += `<span class="tag">${app.name} blocked</span>`;
      }
    });

    return `
      <a class="device-card" href="device.html?id=${device.id}">
        <b>${device.name}</b>
        <p>Screen time today: ${formatTime(totalUsage)}</p>
        <div>${tags || "No apps blocked"}</div>
      </a>`;
  }).join("");
}

requireParent(function (user) {
  // The list updates by itself whenever the database changes
  watchMyDevices(user.uid, draw);

  document.getElementById("createCode").addEventListener("click", async function () {
    const name = document.getElementById("childName").value.trim() || "New device";
    const code = await createPairing(user.uid, name);

    document.getElementById("codeResult").innerHTML = `
      <p>Enter this code on the child's device:</p>
      <div class="code">${code.slice(0, 3)} ${code.slice(3)}</div>
      <p class="muted">The code works once and lasts 15 minutes. Open child.html and tap Connect.</p>
    `;
    document.getElementById("childName").value = "";
  });

  document.getElementById("addSamples").addEventListener("click", function () {
    addSampleDevices(user.uid);
  });
});