// ====================================================
// FIREBASE CONFIG — you will fill this in soon
// ====================================================
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBQg_-PRD8Ix0DTFLqPPUDWH0hSJLWZ0fk",
  authDomain: "accessmap-infinity.firebaseapp.com",
  databaseURL: "https://accessmap-infinity-default-rtdb.firebaseio.com",
  projectId: "accessmap-infinity",
  storageBucket: "accessmap-infinity.firebasestorage.app",
  messagingSenderId: "1035902927452",
  appId: "1:1035902927452:web:22936174d8a7459d645c99",
  measurementId: "G-FGXK28HW88"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ====================================================
// YOUR CAMPUS COORDINATES
// Go to google.com/maps → search your university
// Right-click on campus → copy the two numbers shown
// First number = LAT, Second number = LNG
// ====================================================
const CAMPUS_LAT  = 24.8607;   // ← replace with your lat
const CAMPUS_LNG  = 67.0011;   // ← replace with your lng
const CAMPUS_ZOOM = 17;

// ====================================================
// OBSTACLE TYPES
// ====================================================
const SEVERITY = {
  broken_elevator:  { color: "#ef4444", emoji: "🛗",  label: "Broken Elevator",   level: "critical" },
  blocked_entrance: { color: "#ef4444", emoji: "🔒",  label: "Blocked Entrance",  level: "critical" },
  blocked_ramp:     { color: "#f97316", emoji: "🚧",  label: "Blocked Ramp",      level: "moderate" },
  narrow_door:      { color: "#f97316", emoji: "🚪",  label: "Narrow Door",       level: "moderate" },
  steep_ramp:       { color: "#f97316", emoji: "📐",  label: "Steep Ramp",        level: "moderate" },
  flooded_path:     { color: "#f97316", emoji: "💧",  label: "Flooded Path",      level: "moderate" },
  resolved:         { color: "#22c55e", emoji: "✅",  label: "Resolved",          level: "resolved"  }
};

// ====================================================
// APP STATE — do not touch these
// ====================================================
let map;
let clickedLatLng = null;
const markerObjects = {};

// ====================================================
// START — runs automatically when the page loads
// ====================================================
window.addEventListener("load", () => {
  firebase.initializeApp(firebaseConfig);
  initMap();
  loadReports();
});

// ====================================================
// BUILD THE MAP
// ====================================================
function initMap() {
  map = L.map("map").setView([CAMPUS_LAT, CAMPUS_LNG], CAMPUS_ZOOM);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  map.on("click", function (e) {
    clickedLatLng = e.latlng;
    openModal(e.latlng);
  });
}

// ====================================================
// OPEN REPORT FORM
// ====================================================
function openModal(latlng) {
  document.getElementById("modal-overlay").classList.remove("hidden");
  document.getElementById("modal-coords").textContent =
    `📍 Lat: ${latlng.lat.toFixed(5)},  Lng: ${latlng.lng.toFixed(5)}`;
  document.getElementById("obstacle-desc").value = "";
  document.getElementById("obstacle-type").value = "broken_elevator";
}

// ====================================================
// CLOSE REPORT FORM
// ====================================================
function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
  clickedLatLng = null;
}

// ====================================================
// SUBMIT REPORT → saves to Firebase
// ====================================================
function submitReport() {
  if (!clickedLatLng) return;

  const type = document.getElementById("obstacle-type").value;
  const desc = document.getElementById("obstacle-desc").value.trim();

  const report = {
    type:          type,
    description:   desc || SEVERITY[type].label,
    lat:           clickedLatLng.lat,
    lng:           clickedLatLng.lng,
    timestamp:     Date.now(),
    expiresAt:     Date.now() + (24 * 60 * 60 * 1000),
    confirmations: 0
  };

  firebase.database().ref("reports").push(report);
  closeModal();
  showToast("📌 Report submitted! Everyone can see it now.");
}

// ====================================================
// LOAD ALL REPORTS from Firebase — live / real-time
// ====================================================
function loadReports() {
  const reportsRef = firebase.database().ref("reports");

  reportsRef.on("value", (snapshot) => {
    Object.values(markerObjects).forEach(m => m.remove());
    Object.keys(markerObjects).forEach(k => delete markerObjects[k]);

    const data = snapshot.val();
    let total  = 0;
    let active = 0;
    const now  = Date.now();

    if (data) {
      Object.entries(data).forEach(([key, report]) => {
        if (report.expiresAt && report.expiresAt < now) return;
        total++;
        if (report.type !== "resolved") active++;
        placeMarker(key, report);
      });
    }

    updateScore(total, active);
  });
}

// ====================================================
// PLACE A PIN ON THE MAP
// ====================================================
function placeMarker(key, report) {
  const sev = SEVERITY[report.type] || SEVERITY["blocked_ramp"];

  const icon = L.divIcon({
    className: "",
    html: `
      <div style="
        width:36px; height:36px;
        background:${sev.color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        display:flex; align-items:center; justify-content:center;
      ">
        <span style="transform:rotate(45deg); font-size:16px;">${sev.emoji}</span>
      </div>
    `,
    iconSize:    [36, 36],
    iconAnchor:  [18, 36],
    popupAnchor: [0, -36]
  });

  const timeAgo   = getTimeAgo(report.timestamp);
  const popupHTML = `
    <div style="min-width:200px;">
      <strong style="font-size:1rem; color:#60a5fa;">
        ${sev.emoji} ${sev.label}
      </strong><br/>
      <span style="color:#94a3b8; font-size:0.78rem;">⏰ ${timeAgo}</span>
      <p style="margin:8px 0; color:#e2e8f0;">${report.description}</p>
      <button
        onclick="confirmReport('${key}')"
        style="
          background:#3b82f6; color:white; border:none;
          padding:8px 14px; border-radius:6px; cursor:pointer;
          font-size:0.85rem; width:100%; margin-top:4px;
        ">
        👍 Still There! (${report.confirmations || 0})
      </button>
    </div>
  `;

  const marker = L.marker([report.lat, report.lng], { icon })
    .addTo(map)
    .bindPopup(popupHTML);

  markerObjects[key] = marker;
}

// ====================================================
// STILL THERE BUTTON
// ====================================================
function confirmReport(key) {
  const ref = firebase.database().ref(`reports/${key}`);
  ref.transaction((report) => {
    if (report) {
      report.confirmations = (report.confirmations || 0) + 1;
      report.expiresAt     = Date.now() + (12 * 60 * 60 * 1000);
    }
    return report;
  });
  showToast("👍 Confirmed! Report extended by 12 hours.");
}

// ====================================================
// ACCESSIBILITY SCORE
// ====================================================
function updateScore(total, active) {
  let score = 100;
  if (total > 0) {
    score = Math.max(0, 100 - (active * 5));
  }
  const el       = document.getElementById("score");
  el.textContent = `Campus is ${score}% accessible right now`;
  el.style.color = score > 70 ? "#34d399"
                 : score > 40 ? "#fbbf24"
                 :              "#ef4444";
}

// ====================================================
// HELPERS
// ====================================================
function getTimeAgo(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

function showToast(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.cssText = `
    position:fixed; bottom:24px; left:50%;
    transform:translateX(-50%);
    background:#1e40af; color:#fff;
    padding:12px 26px; border-radius:30px;
    font-size:0.9rem; z-index:99999;
    box-shadow:0 4px 20px rgba(0,0,0,0.4);
  `;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}