// Count the totals
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

// Draw a card for each device. "index" is the device's position in the list.
const list = document.getElementById("deviceList");

devices.forEach(function (device, index) {
  let totalUsage = 0;
  let tags = "";

  device.apps.forEach(function (app) {
    totalUsage += app.usage;
    if (app.mode === "block") {
      tags += `<span class="tag">${app.name} blocked</span>`;
    }
  });

  list.innerHTML += `
    <a class="device-card" href="device.html?id=${index}">
      <b>${device.name}</b>
      <p>Screen time today: ${formatTime(totalUsage)}</p>
      <div>${tags || "No apps blocked"}</div>
    </a>
  `;
});// Create a 6-digit pairing code
document.getElementById("createCode").addEventListener("click", function () {
  const name = document.getElementById("childName").value.trim() || "New device";
  const code = String(Math.floor(100000 + Math.random() * 900000));

  const codes = loadCodes();
  codes[code] = name;
  saveCodes(codes);

  document.getElementById("codeResult").innerHTML = `
    <p>Enter this code on the child's device:</p>
    <div class="code">${code.slice(0, 3)} ${code.slice(3)}</div>
    <p class="muted">Open child.html and tap Connect.</p>
  `;
  document.getElementById("childName").value = "";
});

// If a child connects in another tab, reload to show the new device
window.addEventListener("storage", function () {
  window.location.reload();
});