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
const eventsGrid = document.getElementById("eventsGrid");

// ====================== HELPERS ======================
function parseItemDate(item) {
  if (item && item.date) {
    const d = new Date(item.date);
    if (!isNaN(d)) return d;
    const n = Number(item.date);
    if (!Number.isNaN(n)) {
      const dn = new Date(n);
      if (!isNaN(dn)) return dn;
    }
  }
  if (item && item.timestamp) {
    const t = new Date(Number(item.timestamp));
    if (!isNaN(t)) return t;
  }
  return null;
}

function todayStart() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

// ====================== FETCH ANNOUNCEMENTS ======================
function fetchAnnouncements() {
  if (!announcementsContainer) return;

  const announcementsRef = ref(database, "announcements");
  onValue(
    announcementsRef,
    (snapshot) => {
      announcementsContainer.innerHTML = "";

      if (!snapshot.exists()) {
        announcementsContainer.innerHTML = `<p>No announcements yet.</p>`;
        return;
      }

      const allAnnouncements = Object.values(snapshot.val() || {});
      const today = todayStart();

      const validAnnouncements = allAnnouncements.filter((item) => {
        const d = parseItemDate(item);
        if (!d) return false;
        d.setHours(0, 0, 0, 0);
        return d >= today;
      });

      validAnnouncements.sort((a, b) => {
        const da = parseItemDate(a);
        const db = parseItemDate(b);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db - da;
      });

      if (validAnnouncements.length === 0) {
        announcementsContainer.innerHTML = `<p>No current announcements.</p>`;
        return;
      }

      validAnnouncements.forEach((item) => {
        const d = parseItemDate(item);
        const dateStr = d
          ? d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
          : "No date";

        const div = document.createElement("div");
        div.classList.add("Latest");
        div.innerHTML = `
          <p><strong>${item.title || "Untitled"}</strong></p>
          <span>${dateStr} • ${item.category || "Uncategorized"}</span>
          <p>${item.content || ""}</p>
        `;
        announcementsContainer.appendChild(div);
      });
    },
    (error) => {
      console.error("❌ Error fetching announcements:", error);
      announcementsContainer.innerHTML = `<p>Error loading announcements.</p>`;
    }
  );
}

// ====================== FETCH ARCHIVE ======================
function fetchArchive() {
  if (!archiveTableBody) return;

  const announcementsRef = ref(database, "announcements");
  onValue(
    announcementsRef,
    (snapshot) => {
      archiveTableBody.innerHTML = "";

      if (!snapshot.exists()) {
        archiveTableBody.innerHTML = `<tr><td colspan="3">No archive data available.</td></tr>`;
        return;
      }

      const allAnnouncements = Object.values(snapshot.val() || {});
      const today = todayStart();

      const pastItems = allAnnouncements.filter((item) => {
        const d = parseItemDate(item);
        if (!d) return false;
        d.setHours(0, 0, 0, 0);
        return d < today;
      });

      pastItems.sort((a, b) => {
        const da = parseItemDate(a);
        const db = parseItemDate(b);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db - da;
      });

      if (pastItems.length === 0) {
        archiveTableBody.innerHTML = `<tr><td colspan="3">No archived announcements yet.</td></tr>`;
        return;
      }

      pastItems.forEach((item) => {
        const d = parseItemDate(item);
        const dateStr = d
          ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
          : "No date";

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.title || "Untitled"}</td>
          <td>${dateStr}</td>
          <td>${item.category || "Uncategorized"}</td>
        `;
        archiveTableBody.appendChild(row);
      });
    },
    (error) => {
      console.error("❌ Error fetching archive:", error);
      archiveTableBody.innerHTML = `<tr><td colspan="3">Error loading data.</td></tr>`;
    }
  );
}

// ====================== FETCH EVENTS (Modified) ======================
function fetchEvents() {
  if (!eventsGrid) return;

  const eventsRef = ref(database, "events");
  onValue(
    eventsRef,
    (snapshot) => {
      eventsGrid.innerHTML = "";
      if (!snapshot.exists()) {
        eventsGrid.innerHTML = `<p>No events available.</p>`;
        return;
      }

      // ✅ Fetch all events (past + present)
      const allEvents = Object.values(snapshot.val() || {});

      // Sort by date (most recent first)
      allEvents.sort((a, b) => {
        const da = parseItemDate(a);
        const db = parseItemDate(b);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db - da; // descending order
      });

      if (allEvents.length === 0) {
        eventsGrid.innerHTML = `<p>No events found.</p>`;
        return;
      }

      allEvents.forEach((event) => {
        const imgSrc =
          event.image || event.imageURL || "https://via.placeholder.com/400x250?text=Event+Image";

        const date = parseItemDate(event);
        const dateStr = date
          ? date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
          : event.date || "No date";

        const card = document.createElement("div");
        card.classList.add("event-card");
        card.innerHTML = `
          <a href="#">
            <figure>
              <img src="${imgSrc}" alt="${event.description || 'Event'}" class="event-img" />
            </figure>
            <p class="event-description">${event.description || "No description"}</p>
            <span class="span">
              <ion-icon name="calendar-number-outline" class="event-icon"></ion-icon>
              ${dateStr}
            </span>
            <span class="span">
              <ion-icon name="time-outline" class="event-icon"></ion-icon>
              ${event.time || "No time"}
            </span>
          </a>
        `;
        eventsGrid.appendChild(card);
      });
    },
    (error) => {
      console.error("❌ Error fetching events:", error);
      eventsGrid.innerHTML = `<p>Error loading events.</p>`;
    }
  );
}

// ====================== INIT ======================
fetchAnnouncements();
fetchArchive();
fetchEvents();
