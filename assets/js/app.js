// ====================== IMPORTS ======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
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
const database = getDatabase(app);

// ====================== DOM TARGETS ======================
const announcementsContainer = document.querySelector("#announcements .grid");
const archiveTableBody = document.getElementById("archiveTableBody");

// ====================== FETCH ANNOUNCEMENTS ======================
function fetchAnnouncements() {
  const announcementsRef = ref(database, "announcements");

  onValue(
    announcementsRef,
    (snapshot) => {
      announcementsContainer.innerHTML = ""; // Clear previous announcements

      if (snapshot.exists()) {
        const data = snapshot.val();
        const allAnnouncements = [];

        // Loop through all user nodes under 'announcements'
        Object.values(data).forEach((userAnnouncements) => {
          Object.values(userAnnouncements).forEach((item) => {
            allAnnouncements.push(item);
          });
        });

        // Sort by latest date (if date is a readable string like "2025-10-13")
        allAnnouncements.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Render announcements
        allAnnouncements.forEach((item) => {
          const date = item.date || "No date";

          const div = document.createElement("div");
          div.classList.add("Latest");
          div.innerHTML = `
            <p><strong>${item.title || "Untitled"}</strong></p>
            <span>${date} • ${item.category || "Uncategorized"}</span>
            <p>${item.content || ""}</p>
          `;
          announcementsContainer.appendChild(div);
        });
      } else {
        announcementsContainer.innerHTML = `<p>No announcements yet.</p>`;
      }
    },
    (error) => {
      console.error("❌ Error fetching announcements:", error);
    }
  );
}

// ====================== FETCH ARCHIVE ======================
function fetchArchive() {
  const announcementsRef = ref(database, "announcements");

  onValue(
    announcementsRef,
    (snapshot) => {
      archiveTableBody.innerHTML = ""; // Clear table

      if (snapshot.exists()) {
        const data = snapshot.val();
        const allArchives = [];

        // Combine all admin announcements into one array
        Object.values(data).forEach((adminAnnouncements) => {
          Object.values(adminAnnouncements).forEach((item) => {
            allArchives.push(item);
          });
        });

        // Sort newest first using date
        allArchives.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Render into the archive table
        allArchives.forEach((item) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${item.title || "Untitled"}</td>
            <td>${item.date || "No date"}</td>
            <td>${item.category || "Uncategorized"}</td>
          `;
          archiveTableBody.appendChild(row);
        });
      } else {
        archiveTableBody.innerHTML = `
          <tr><td colspan="3">No archive data available.</td></tr>`;
      }
    },
    (error) => {
      console.error("❌ Error fetching archive:", error);
      archiveTableBody.innerHTML = `
        <tr><td colspan="3">Error loading data.</td></tr>`;
    }
  );
}

// ====================== INIT ======================
fetchAnnouncements();
fetchArchive();


// ====================== FETCH EVENTS ======================
const eventsGrid = document.getElementById("eventsGrid");

function fetchEvents() {
  const eventsRef = ref(database, "events");

  onValue(eventsRef, (snapshot) => {
    eventsGrid.innerHTML = "";
    if (snapshot.exists()) {
      const events = Object.values(snapshot.val()).sort((a, b) => new Date(a.date) - new Date(b.date));

      events.forEach((event) => {
        const card = document.createElement("div");
        card.classList.add("event-card");
        card.innerHTML = `
          <a href="#">
            <figure>
              <img src="${event.imageURL}" alt="${event.title}" class="event-img" />
            </figure>
            <h4>${event.title}</h4>
            <p>${event.description}</p>
            <span class="span">
              <ion-icon name="calendar-number-outline" class="event-icon"></ion-icon>
              ${event.date}
            </span>
            <span class="span">
              <ion-icon name="time-outline" class="event-icon"></ion-icon>
              ${event.time}
            </span>
          </a>
        `;
        eventsGrid.appendChild(card);
      });
    } else {
      eventsGrid.innerHTML = `<p>No upcoming events available.</p>`;
    }
  });
}

fetchEvents();
