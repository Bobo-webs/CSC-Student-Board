// ====================== IMPORTS ======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
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

// ====================== AUTH STATE ======================
document.addEventListener("DOMContentLoaded", () => {
  showLoadingScreen();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      checkUserRole(user.uid);
    } else {
      redirectToLogin();
    }
  });
});

function redirectToLogin() {
  window.location.href = "login.html";
}

// ====================== ROLE VALIDATION ======================
function checkUserRole(uid) {
  const dbRef = ref(database);
  get(child(dbRef, `users/${uid}/role`))
    .then((snapshot) => {
      if (snapshot.exists() && snapshot.val().includes("admin")) {
        hideLoadingScreen();
        fetchAnnouncements(uid); // Load admin announcements
      } else {
        console.warn("User is not an admin. Redirecting to login.");
        redirectToLogin();
      }
    })
    .catch((error) => {
      console.error("Error retrieving user role:", error);
      redirectToLogin();
    });
}

// ====================== ANNOUNCEMENT MANAGEMENT ======================
const announcementForm = document.getElementById("announcementForm");
const titleInput = document.getElementById("announcementTitle");
const dateInput = document.getElementById("announcementDate");
const categoryInput = document.getElementById("announcementCategory");
const contentInput = document.getElementById("announcementContent");
const announcementsTable = document.getElementById("announcementsTableBody");

// Fetch announcements
function fetchAnnouncements(adminUid) {
  const announcementsRef = ref(database, `announcements/${adminUid}`);
  onValue(announcementsRef, (snapshot) => {
    announcementsTable.innerHTML = "";
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const data = child.val();
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${data.title || "N/A"}</td>
          <td>${data.date || "N/A"}</td>
          <td>${data.category || "N/A"}</td>
          <td>${data.content || "N/A"}</td>
          <td>${new Date(data.timestamp).toLocaleString()}</td>
          <td>
            <button class="edit-ann" data-id="${child.key}">Edit</button>
            <button class="delete-ann" data-id="${child.key}">Delete</button>
          </td>
        `;
        announcementsTable.appendChild(row);
      });

      document
        .querySelectorAll(".edit-ann")
        .forEach((btn) =>
          btn.addEventListener("click", () =>
            editAnnouncement(adminUid, btn.dataset.id)
          )
        );

      document
        .querySelectorAll(".delete-ann")
        .forEach((btn) =>
          btn.addEventListener("click", () =>
            deleteAnnouncement(adminUid, btn.dataset.id)
          )
        );
    } else {
      announcementsTable.innerHTML = `
        <tr><td colspan="6" style="text-align:center;">No announcements yet.</td></tr>`;
    }
  });
}

// Add announcement
announcementForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return alert("No admin authenticated!");

  const title = titleInput.value.trim();
  const date = dateInput.value.trim();
  const category = categoryInput.value.trim();
  const content = contentInput.value.trim();
  const timestamp = Date.now();

  if (!title || !date || !category || !content) {
    alert("Please fill all fields.");
    return;
  }

  const announcementsRef = ref(database, `announcements/${user.uid}`);
  const newRef = push(announcementsRef);

  set(newRef, { title, date, category, content, timestamp })
    .then(() => {
      announcementForm.reset();
      alert("✅ Announcement added successfully!");
    })
    .catch((error) => {
      console.error("Error adding announcement:", error);
      alert("❌ Failed to add announcement.");
    });
});

// Edit announcement
function editAnnouncement(adminUid, id) {
  const annRef = ref(database, `announcements/${adminUid}/${id}`);
  get(annRef).then((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      titleInput.value = data.title;
      dateInput.value = data.date;
      categoryInput.value = data.category;
      contentInput.value = data.content;
      announcementForm.querySelector(".submit-btn").textContent =
        "Update Announcement";

      announcementForm.onsubmit = (e) => {
        e.preventDefault();
        update(annRef, {
          title: titleInput.value.trim(),
          date: dateInput.value.trim(),
          category: categoryInput.value.trim(),
          content: contentInput.value.trim(),
        })
          .then(() => {
            announcementForm.reset();
            announcementForm.querySelector(".submit-btn").textContent =
              "Add Announcement";
            announcementForm.onsubmit = defaultAnnouncementSubmit;
            alert("✅ Announcement updated!");
          })
          .catch((error) => {
            console.error("Error updating announcement:", error);
            alert("❌ Failed to update announcement.");
          });
      };
    }
  });
}

// Delete announcement
function deleteAnnouncement(adminUid, id) {
  if (confirm("Delete this announcement?")) {
    remove(ref(database, `announcements/${adminUid}/${id}`))
      .then(() => alert("🗑️ Announcement deleted."))
      .catch((error) => {
        console.error("Error deleting announcement:", error);
        alert("❌ Failed to delete announcement.");
      });
  }
}

// Default add handler (after editing)
function defaultAnnouncementSubmit(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return alert("No admin authenticated!");

  const title = titleInput.value.trim();
  const date = dateInput.value.trim();
  const category = categoryInput.value.trim();
  const content = contentInput.value.trim();
  const timestamp = Date.now();

  if (!title || !date || !category || !content) {
    alert("Please fill all fields.");
    return;
  }

  const announcementsRef = ref(database, `announcements/${user.uid}`);
  const newRef = push(announcementsRef);

  set(newRef, { title, date, category, content, timestamp })
    .then(() => {
      announcementForm.reset();
      alert("✅ Announcement added successfully!");
    })
    .catch((error) => {
      console.error("Error adding announcement:", error);
    });
}

// ====================== LOGOUT ======================
logoutButton.addEventListener("click", () => {
  confirmationPopup.style.display = "block";
});

confirmYes.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      confirmationPopup.style.display = "none";
      redirectToLogin();
    })
    .catch((error) => {
      console.error("Sign out error:", error);
    });
});

confirmNo.addEventListener("click", () => {
  confirmationPopup.style.display = "none";
});
