import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

// Connect to your Firebase project
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const form = document.getElementById("loginForm");
const errorBox = document.getElementById("error");
const title = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const switchText = document.getElementById("switchText");
const switchBtn = document.getElementById("switchBtn");

let creating = false;   // false = log in, true = create account

// If the parent is already logged in, go straight to the dashboard
onAuthStateChanged(auth, function (user) {
  if (user) window.location.href = "parent.html";
});

// Switch between "Log in" and "Create an account"
switchBtn.addEventListener("click", function () {
  creating = !creating;
  errorBox.textContent = "";
  title.textContent = creating ? "Create parent account" : "Parent login";
  submitBtn.textContent = creating ? "Sign up" : "Log in";
  switchText.textContent = creating ? "Already have an account?" : "New here?";
  switchBtn.textContent = creating ? "Log in" : "Create an account";
});

// Turn Firebase error codes into simple messages
function friendlyError(code) {
  if (code === "auth/email-already-in-use") return "This email already has an account. Try logging in.";
  if (code === "auth/invalid-credential") return "Wrong email or password.";
  if (code === "auth/wrong-password") return "Wrong email or password.";
  if (code === "auth/user-not-found") return "No account with this email. Create one first.";
  if (code === "auth/weak-password") return "Password must be at least 6 characters.";
  if (code === "auth/invalid-email") return "That email address doesn't look right.";
  if (code === "auth/operation-not-allowed") return "Email login is not turned on in Firebase yet.";
  if (code === "auth/too-many-requests") return "Too many tries. Wait a few minutes and try again.";
  return "Something went wrong (" + code + ").";
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();   // stop the page from reloading

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  errorBox.textContent = "";
  submitBtn.disabled = true;

  try {
    if (creating) {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    // onAuthStateChanged above sends the parent to the dashboard
  } catch (error) {
    errorBox.textContent = friendlyError(error.code);
    submitBtn.disabled = false;
  }
});