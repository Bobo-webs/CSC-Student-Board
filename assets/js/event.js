// ====================== IMPORTS ======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import {
    getDatabase,
    ref,
    get,
    child,
    onValue,
    update,
    remove,
    push,
    set,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

// ====================== FIREBASE CONFIG ======================
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

// ====================== INITIALIZE ======================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// ====================== DOM ELEMENTS ======================
const logoutButton = document.getElementById("logoutButton");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");
const confirmationPopup = document.getElementById("confirmationPopup");
const loadingScreen = document.getElementById("loading-overlay");
const dashboardContent = document.getElementById("dashboard-content");
const popupOverlay = document.getElementById("popupOverlay");

const eventForm = document.getElementById("eventForm");
const eventDescriptionInput = document.getElementById("eventDescription");
const eventDateInput = document.getElementById("eventDate");
const eventTimeInput = document.getElementById("eventTime");
const eventImageInput = document.getElementById("eventImage");
const eventsTable = document.getElementById("eventsTableBody");

let editingEventId = null; // Track edit

// ====================== LOADING HANDLER ======================
function showLoadingScreen() {
    loadingScreen.style.display = "flex";
    setTimeout(() => (loadingScreen.style.opacity = "1"), 10);
    dashboardContent.style.display = "none";
}

function hideLoadingScreen() {
    loadingScreen.style.opacity = "0";
    setTimeout(() => {
        loadingScreen.style.display = "none";
        dashboardContent.style.display = "block";
    }, 500);
}

// ====================== AUTH & ROLE ======================
document.addEventListener("DOMContentLoaded", () => {
    showLoadingScreen();
    onAuthStateChanged(auth, (user) => {
        if (user) checkUserRole(user.uid);
        else redirectToLogin();
    });
});

function redirectToLogin() {
    window.location.href = "login.html";
}

function checkUserRole(uid) {
    get(child(ref(database), `users/${uid}/role`))
        .then(snapshot => {
            if (snapshot.exists() && snapshot.val().includes("admin")) {
                hideLoadingScreen();
                fetchEvents(uid);
            } else redirectToLogin();
        })
        .catch(err => {
            console.error("Error checking role:", err);
            redirectToLogin();
        });
}

// ====================== EVENT MANAGEMENT ======================

// Convert image file to Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) return resolve("");
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = err => reject(err);
        reader.readAsDataURL(file);
    });
}

// Add / Update Event
eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("No admin authenticated!");

    const description = eventDescriptionInput.value.trim();
    const date = eventDateInput.value;
    const time = eventTimeInput.value;
    const file = eventImageInput.files[0];

    if (!description || !date || !time) return alert("Please fill all required fields.");

    let imageData = "";
    try {
        imageData = await fileToBase64(file);
    } catch (err) {
        console.error("Error reading image file:", err);
        alert("❌ Failed to read image.");
        return;
    }

    const eventsRef = ref(database, `events/${user.uid}`);
    try {
        if (editingEventId) {
            await update(ref(database, `events/${user.uid}/${editingEventId}`), { description, date, time, image: imageData });
            alert("✅ Event updated!");
        } else {
            const newEventRef = push(eventsRef);
            await set(newEventRef, { description, date, time, image: imageData });
            alert("✅ Event added!");
        }

        eventForm.reset();
        editingEventId = null;
        eventForm.querySelector(".submit-btn").textContent = "Add Event +";
        fetchEvents(user.uid);

    } catch (err) {
        console.error("Error saving event:", err);
        alert("❌ Failed to save event.");
    }
});

// Fetch Events
function fetchEvents(adminUid) {
    onValue(ref(database, `events/${adminUid}`), snapshot => {
        eventsTable.innerHTML = "";
        if (!snapshot.exists()) {
            eventsTable.innerHTML = `<tr><td colspan="5" style="text-align:center;">No events yet.</td></tr>`;
            return;
        }

        snapshot.forEach(child => {
            const data = child.val();
            const row = document.createElement("tr");
            row.innerHTML = `
        <td>${data.description || "N/A"}</td>
        <td>${data.date || "N/A"}</td>
        <td>${data.time || "N/A"}</td>
        <td>${data.image ? `<img src="${data.image}" style="width:80px;border-radius:6px;">` : "No Image"}</td>
        <td>
          <button class="edit-event" data-id="${child.key}">Edit</button>
          <button class="delete-event" data-id="${child.key}">Delete</button>
        </td>
      `;
            eventsTable.appendChild(row);
        });

        document.querySelectorAll(".edit-event").forEach(btn => btn.onclick = () => startEditEvent(adminUid, btn.dataset.id));
        document.querySelectorAll(".delete-event").forEach(btn => btn.onclick = () => deleteEvent(adminUid, btn.dataset.id));
    });
}

// Start editing event
function startEditEvent(adminUid, id) {
    get(ref(database, `events/${adminUid}/${id}`)).then(snapshot => {
        if (!snapshot.exists()) return;
        const data = snapshot.val();
        eventDescriptionInput.value = data.description;
        eventDateInput.value = data.date;
        eventTimeInput.value = data.time;
        editingEventId = id;
        eventForm.querySelector(".submit-btn").textContent = "Update Event";
    });
}

// Delete Event
function deleteEvent(adminUid, id) {
    if (!confirm("Delete this event?")) return;
    remove(ref(database, `events/${adminUid}/${id}`))
        .then(() => fetchEvents(adminUid))
        .catch(err => {
            console.error("Error deleting event:", err);
            alert("❌ Failed to delete event.");
        });
}

// ====================== LOGOUT POPUP ======================
function showPopup() {
    confirmationPopup.classList.add("show");
    popupOverlay.classList.add("show");
}

function hidePopup() {
    confirmationPopup.classList.remove("show");
    popupOverlay.classList.remove("show");
}

logoutButton.addEventListener("click", showPopup);
confirmYes.addEventListener("click", () => {
    signOut(auth).then(() => {
        hidePopup();
        redirectToLogin();
    }).catch(console.error);
});
confirmNo.addEventListener("click", hidePopup);
popupOverlay.addEventListener("click", hidePopup);
