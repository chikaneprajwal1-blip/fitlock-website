const form = document.getElementById("loginForm");
const errorBox = document.getElementById("error");

form.addEventListener("submit", function (event) {
  event.preventDefault();   // stop the page from reloading

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // Temporary check. We replace this with real Firebase login later.
  if (password.length < 6) {
    errorBox.textContent = "Password must be at least 6 characters.";
    return;
  }

  window.location.href = "parent.html";   // go to the dashboard page
});