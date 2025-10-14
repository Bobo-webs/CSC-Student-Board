import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUEnagBuBhDISPJDSRhw-kx-227TaUIEA",
  authDomain: "cit306-group20.firebaseapp.com",
  databaseURL: "https://cit306-group20-default-rtdb.firebaseio.com",
  projectId: "cit306-group20",
  storageBucket: "cit306-group20.firebasestorage.app",
  messagingSenderId: "511217693205",
  appId: "1:511217693205:web:007c053b3f52128b3a941c",
  measurementId: "G-YJNXERNJNB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOM Elements
const form = document.getElementById("form");
const firstname = document.getElementById("firstname");
const lastname = document.getElementById("lastname");
const email = document.getElementById("email");
const password = document.getElementById("password");
const password2 = document.getElementById("password2");
const submit = document.getElementById("submit");
const popup = document.getElementById("popup");
const errorPopup = document.getElementById("error-popup");
const popupMessage = document.getElementById("popup-message");
const errorMessage = document.getElementById("error-message");

// Form validation
const setError = (element, message) => {
  const inputControl = element.parentElement;
  const errorDisplay = inputControl.querySelector(".error");
  errorDisplay.innerText = message;
  inputControl.classList.add("error");
  inputControl.classList.remove("success");
};

const setSuccess = (element) => {
  const inputControl = element.parentElement;
  const errorDisplay = inputControl.querySelector(".error");
  errorDisplay.innerText = "";
  inputControl.classList.add("success");
  inputControl.classList.remove("error");
};

const isValidEmail = (email) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

const isValidUsername = (username) => {
  const re = /^[a-zA-Z][a-zA-Z0-9._]{1,15}$/;
  return re.test(username);
};

const validateInputs = async () => {
  const firstnameValue = firstname.value.trim();
  const lastnameValue = lastname.value.trim();
  const emailValue = email.value.trim();
  const passwordValue = password.value.trim();
  const password2Value = password2.value.trim();

  let isValid = true;

  if (firstnameValue === "") {
    setError(firstname, "Username is required");
    isValid = false;
  } else if (!isValidUsername(firstnameValue)) {
    setError(
      firstname,
      "3-16 chars, begin with a letter. Contain: letters, numbers underscores and periods."
    );
    isValid = false;
  } else {
    setSuccess(firstname);
  }

  if (lastnameValue === "") {
    setError(lastname, "Full name is required");
    isValid = false;
  } else {
    setSuccess(lastname);
  }

  if (emailValue === "") {
    setError(email, "Email is required");
    isValid = false;
  } else if (!isValidEmail(emailValue)) {
    setError(email, "Provide a valid email address");
    isValid = false;
  } else {
    setSuccess(email);
  }

  if (passwordValue === "") {
    setError(password, "Password is required");
    isValid = false;
  } else if (passwordValue.length < 8) {
    setError(password, "Password must be at least 8 characters.");
    isValid = false;
  } else {
    setSuccess(password);
  }

  if (password2Value === "") {
    setError(password2, "Please confirm your password");
    isValid = false;
  } else if (password2Value !== passwordValue) {
    setError(password2, "Passwords don't match");
    isValid = false;
  } else {
    setSuccess(password2);
  }

  return isValid;
};

// Add event listener to form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const isValid = await validateInputs();
  if (isValid) {
    // Proceed with form submission
  }
});

// Popup functions
const showPopup = (message) => {
  popupMessage.textContent = message;
  popup.classList.add("show");
};

const showError = (message) => {
  errorMessage.textContent = message;
  errorPopup.classList.add("show");
};

const closePopup = () => {
  const dangerPopup = document.querySelector(".danger-popup");
  if (dangerPopup) {
    dangerPopup.classList.add("hidden");
  }
};

// Attach the closePopup function to the close button
document.querySelector(".close").addEventListener("click", closePopup);

// Danger Popup functions
const showDangerPopup = (message) => {
  const dangerMessage = document.getElementById("danger-message");
  dangerMessage.textContent = message;
  const dangerPopup = document.getElementById("danger-popup");
  dangerPopup.classList.add("show");

  // Auto-hide the popup after 5 seconds
  setTimeout(() => {
    dangerPopup.classList.remove("show");
  }, 10000);
};

// Modify the existing submit event listener to show the danger popup
submit.addEventListener("click", async (event) => {
  event.preventDefault();

  if (await validateInputs()) {
    const emailValue = email.value.trim();
    const firstnameValue = firstname.value.trim();
    const lastnameValue = lastname.value.trim();
    const passwordValue = password.value.trim();

    createUserWithEmailAndPassword(auth, emailValue, passwordValue)
      .then((userCredential) => {
        const user = userCredential.user;

        // Store user data in Realtime Database
        set(ref(database, "users/" + user.uid), {
          firstname: firstnameValue,
          lastname: lastnameValue,
          email: emailValue,
          role: "user",
          balance: 0,
          investments: 0,
          deposits: 0,
          referrals: 0,
        })
          .then(() => {
            showPopup("Account Created Successfully.");
            setTimeout(() => {
              window.location.href = "login.html";
            }, 5000);
          })
          .catch((error) => {
            console.error("Error writing user data:", error);
            showError("Error writing user data.");
          });
      })
      .catch((error) => {
        if (error.code === "auth/email-already-in-use") {
          showDangerPopup("This email has already been taken.");
        } else {
          console.error("Error creating user:", error);
          showDangerPopup("" + error.message);
          setTimeout(() => {
            window.location.href = "register.html";
          }, 5000);
        }
      });
  }
});