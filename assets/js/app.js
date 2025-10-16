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

// Helper: parse item date (prefers item.date string, falls back to item.timestamp)
function parseItemDate(item) {
  // If explicit date field exists and is parseable, use it.
  if (item && item.date) {
    // Try direct Date parsing (accepts YYYY-MM-DD and other formats)
    const d = new Date(item.date);
    if (!isNaN(d)) return d;
    // try interpreting as timestamp string
    const n = Number(item.date);
    if (!Number.isNaN(n)) {
      const dn = new Date(n);
      if (!isNaN(dn)) return dn;
    }
  }

  // If timestamp field exists, use it.
  if (item && item.timestamp) {
    const t = new Date(Number(item.timestamp));
    if (!isNaN(t)) return t;
  }

  // unknown -> return null
  return null;
}

// Get today's midnight for comparison
function todayStart() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

// ====================== FETCH ANNOUNCEMENTS ======================
function fetchAnnouncements() {
  if (!announcementsContainer) return; // safe guard

  const announcementsRef = ref(database, "announcements");
  onValue(
    announcementsRef,
    (snapshot) => {
      announcementsContainer.innerHTML = ""; // Clear previous announcements

      if (!snapshot.exists()) {
        announcementsContainer.innerHTML = `<p>No announcements yet.</p>`;
        return;
      }

      // Collect all announcement items across admin nodes
      const allAnnouncements = [];
      const snapVal = snapshot.val();

      // We don't assume structure strictly; iterate keys safely
      for (const adminKey in snapVal) {
        if (!Object.prototype.hasOwnProperty.call(snapVal, adminKey)) continue;
        const adminNode = snapVal[adminKey];
        if (!adminNode) continue;

        // adminNode may be an object containing many announcements (or single)
        for (const itemKey in adminNode) {
          if (!Object.prototype.hasOwnProperty.call(adminNode, itemKey)) continue;
          const item = adminNode[itemKey];
          if (!item || typeof item !== "object") continue;
          // Annotate with source info if needed
          item._admin = adminKey;
          item._id = itemKey;
          allAnnouncements.push(item);
        }
      }

      // Filter out items that are backdated (only show items whose date >= today).
      const today = todayStart();
      const validAnnouncements = allAnnouncements.filter((item) => {
        const d = parseItemDate(item);
        if (!d) {
          // No valid date or timestamp — don't show it on the index (avoid undefined)
          return false;
        }
        // compare date part only (midnight)
        d.setHours(0, 0, 0, 0);
        return d >= today;
      });

      // Sort by date descending (newest first). If date missing we keep them last.
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

      // Render announcements preserving your markup / css classes
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
// Archive should show past announcements (date < today) — keeps everything safe in DB
function fetchArchive() {
  if (!archiveTableBody) return;

  const announcementsRef = ref(database, "announcements");
  onValue(
    announcementsRef,
    (snapshot) => {
      archiveTableBody.innerHTML = ""; // Clear table

      if (!snapshot.exists()) {
        archiveTableBody.innerHTML = `<tr><td colspan="3">No archive data available.</td></tr>`;
        return;
      }

      const allArchives = [];
      const snapVal = snapshot.val();

      for (const adminKey in snapVal) {
        if (!Object.prototype.hasOwnProperty.call(snapVal, adminKey)) continue;
        const adminNode = snapVal[adminKey];
        if (!adminNode) continue;
        for (const itemKey in adminNode) {
          if (!Object.prototype.hasOwnProperty.call(adminNode, itemKey)) continue;
          const item = adminNode[itemKey];
          if (!item || typeof item !== "object") continue;
          item._admin = adminKey;
          item._id = itemKey;
          allArchives.push(item);
        }
      }

      // Partition into past vs future based on item.date or timestamp
      const today = todayStart();
      const pastItems = allArchives.filter((item) => {
        const d = parseItemDate(item);
        if (!d) return false; // items without date we skip from archive table
        d.setHours(0, 0, 0, 0);
        return d < today;
      });

      // Sort newest-to-oldest (recent past first)
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

// ====================== FETCH EVENTS ======================
// Only show events whose date >= today (upcoming). Events stored under /events/<adminUid>/<eventId>
function fetchEvents() {
  if (!eventsGrid) return;

  const eventsRef = ref(database, "events");
  onValue(
    eventsRef,
    (snapshot) => {
      eventsGrid.innerHTML = "";
      if (!snapshot.exists()) {
        eventsGrid.innerHTML = `<p>No upcoming events available.</p>`;
        return;
      }

      const allEvents = [];
      const snapVal = snapshot.val();

      for (const adminKey in snapVal) {
        if (!Object.prototype.hasOwnProperty.call(snapVal, adminKey)) continue;
        const adminNode = snapVal[adminKey];
        if (!adminNode) continue;
        for (const eventKey in adminNode) {
          if (!Object.prototype.hasOwnProperty.call(adminNode, eventKey)) continue;
          const ev = adminNode[eventKey];
          if (!ev || typeof ev !== "object") continue;
          ev._admin = adminKey;
          ev._id = eventKey;
          allEvents.push(ev);
        }
      }

      // Filter upcoming events: date >= today
      const today = todayStart();
      const upcoming = allEvents.filter((ev) => {
        const d = parseItemDate(ev);
        if (!d) return false;
        d.setHours(0, 0, 0, 0);
        return d >= today;
      });

      // Sort ascending by date so nearest upcoming first
      upcoming.sort((a, b) => {
        const da = parseItemDate(a), db = parseItemDate(b);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da - db;
      });

      if (upcoming.length === 0) {
        eventsGrid.innerHTML = `<p>No upcoming events available.</p>`;
        return;
      }

      upcoming.forEach((event) => {
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
