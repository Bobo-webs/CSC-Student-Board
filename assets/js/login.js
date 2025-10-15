// Import Firebase libraries
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

// The web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUEnagBuBhDISPJDSRhw-kx-227TaUIEA",
  authDomain: "cit306-group20.firebaseapp.com",
  databaseURL: "https://cit306-group20-default-rtdb.firebaseio.com",
  projectId: "cit306-group20",
  storageBucket: "cit306-group20.firebasestorage.app",
  messagingSenderId: "511217693205",
  appId: "1:511217693205:web:007c053b3f52128b3a941c",
  measurementId: "G-YJNXERNJNB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// ✅ Loading Overlay functions
const showLoading = () => {
  document.getElementById("loading-overlay").classList.add("show");
};

const hideLoading = () => {
  document.getElementById("loading-overlay").classList.remove("show");
};

// Submit button handler
const submit = document.getElementById("submit");
submit.addEventListener("click", function (event) {
  event.preventDefault();

  const emailValue = document.getElementById("email").value.trim();
  const passwordValue = document.getElementById("password").value.trim();

  if (!emailValue || !passwordValue) {
    return; // Exit early if either field is empty
  }

  showLoading(); // 🌀 Show loading overlay before Firebase auth starts

  signInWithEmailAndPassword(auth, emailValue, passwordValue)
    .then((userCredential) => {
      const user = userCredential.user;

      // Get the user's role from the database
      get(ref(database, "users/" + user.uid))
        .then((snapshot) => {
          hideLoading(); // ✅ Hide loading once data is fetched

          if (snapshot.exists()) {
            const userData = snapshot.val();
            const userRole = userData.role;

            if (userRole === "admin") {
              document.getElementById("popup-success").style.display = "block";
              setTimeout(() => {
                document.getElementById("popup-success").style.display = "none";
                window.location.href = "admin.html"; // Admin dashboard
              }, 1000);
            } else {
              setTimeout(() => {
                alert(
                  "You are not currently registered as an administrator. Please contact the school office to request admin access."
                );
              }, 0);
            }
          } else {
            console.error("No user data found");
            showPopup("Error: No user data found.");
          }
        })
        .catch((error) => {
          hideLoading();
          console.error("Error fetching user data:", error);
          showPopup("Error fetching user data: " + error.message);
        });
    })
    .catch((error) => {
      hideLoading();
      if (error.code === "auth/network-request-failed") {
        alert("Network connection interrupted");
      } else {
        document.getElementById("popup-error").style.display = "block";
        setTimeout(() => {
          document.getElementById("popup-error").style.display = "none";
          window.location.href = "login.html";
        }, 5000);
      }
    });
});

// Popup Close Buttons
document
  .getElementById("close-popup-success")
  ?.addEventListener("click", function () {
    document.getElementById("popup-success").style.display = "none";
  });

document
  .getElementById("close-popup-error")
  ?.addEventListener("click", function () {
    document.getElementById("popup-error").style.display = "none";
    window.location.href = "login.html";
  });

// Popup function
const showPopup = (message) => {
  document.getElementById("popup-error").textContent = message;
  document.getElementById("popup-error").style.display = "block";
};
