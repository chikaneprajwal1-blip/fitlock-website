import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// If nobody is logged in, send them to the login page
onAuthStateChanged(auth, function (user) {
  if (!user) {
    window.location.href = "login.html";
  } else {
    document.body.classList.add("ready");   // show the page
    const who = document.getElementById("userEmail");
    if (who) who.textContent = user.email;
  }
});

// Make the Log out link work
const logout = document.getElementById("logout");
if (logout) {
  logout.addEventListener("click", async function (event) {
    event.preventDefault();
    await signOut(auth);
    window.location.href = "index.html";
  });
}