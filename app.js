// ============================================================
// FIREBASE CONFIG
// ============================================================
const firebaseConfig = {
  apiKey:            "AIzaSyBQg_-PRD8Ix0DTFLqPPUDWH0hSJLWZ0fk",
  authDomain:        "accessmap-infinity.firebaseapp.com",
  databaseURL:       "https://accessmap-infinity-default-rtdb.firebaseio.com",
  projectId:         "accessmap-infinity",
  storageBucket:     "accessmap-infinity.firebasestorage.app",
  messagingSenderId: "1035902927452",
  appId:             "1:1035902927452:web:22936174d8a7459d645c99"
};

// ============================================================
// CAMPUS COORDINATES
// ============================================================
const CAMPUS_LAT  = 17.39198;
const CAMPUS_LNG  = 78.31944;
const CAMPUS_ZOOM = 17;

// ============================================================
// OBSTACLE TYPES
// ============================================================
const SEVERITY = {
  broken_elevator:  { color: "#ef4444", emoji: "🛗", label: "Broken Elevator",          level: "critical" },
  blocked_entrance: { color: "#ef4444", emoji: "🔒", label: "Blocked Entrance",         level: "critical" },
  blocked_ramp:     { color: "#f97316", emoji: "🚧", label: "Blocked Ramp",             level: "moderate" },
  narrow_door:      { color: "#f97316", emoji: "🚪", label: "Narrow Door",              level: "moderate" },
  steep_ramp:       { color: "#f97316", emoji: "📐", label: "Steep Ramp",               level: "moderate" },
  flooded_path:     { color: "#f97316", emoji: "💧", label: "Flooded Path",             level: "moderate" }
};

// ============================================================
// APP STATE
// ============================================================
let map;
let clickedLatLng = null;
const markerObjects = {};

// ============================================================
// START
// ============================================================
window.addEventListener("load", () => {
  firebase.initializeApp(firebaseConfig);
  initMap();
  loadReports();
});

// ============================================================
// BUILD THE MAP
// ============================================================
function initMap() {
  map = L.map("map", {
    center: [CAMPUS_LAT, CAMPUS_LNG],
    zoom: CAMPUS_ZOOM
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  map.on("click", function (e) {
    clickedLatLng = e.latlng;
    openModal(e.latlng);
  });
}

// ============================================================
// OPEN REPORT FORM
// ============================================================
function openModal(latlng) {
  document.getElementById("modal-overlay").classList.remove("hidden");
  document.getElementById("modal-coords").textContent =
    "📍 Lat: " + latlng.lat.toFixed(5) + ",  Lng: " + latlng.lng.toFixed(5);
  document.getElementById("obstacle-desc").value = "";
  document.getElementById("obstacle-type").value = "broken_elevator";
}

// ============================================================
// CLOSE REPORT FORM
// ============================================================
function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
  clickedLatLng = null;
}

// ============================================================
// SUBMIT REPORT
// ============================================================
function submitReport() {
  if (!clickedLatLng) return;

  var type = document.getElementById("obstacle-type").value;
  var desc = document.getElementById("obstacle-desc").value.trim();

  var report = {
    type:          type,
    description:   desc || SEVERITY[type].label,
    lat:           clickedLatLng.lat,
    lng:           clickedLatLng.lng,
    timestamp:     Date.now(),
    expiresAt:     Date.now() + (24 * 60 * 60 * 1000),
    resolvedVotes: 0
  };

  firebase.database().ref("reports").push(report);
  closeModal();
  showToast("📌 Report submitted! Everyone can see it now.");
}

// ============================================================
// LOAD REPORTS — real time
// ============================================================
function loadReports() {
  var reportsRef = firebase.database().ref("reports");

  reportsRef.on("value", function(snapshot) {

    // Remove all existing markers from map
    Object.keys(markerObjects).forEach(function(k) {
      markerObjects[k].remove();
      delete markerObjects[k];
    });

    var data  = snapshot.val();
    var total = 0;
    var active = 0;
    var now   = Date.now();

    if (data) {
      Object.keys(data).forEach(function(key) {
        var report = data[key];

        // Skip expired reports
        if (report.expiresAt && report.expiresAt < now) return;

        total++;
        active++;
        placeMarker(key, report);
      });
    }

    updateScore(total, active);
  });
}

// ============================================================
// PLACE A PIN ON THE MAP
// ============================================================
function placeMarker(key, report) {
  var sev = SEVERITY[report.type] || SEVERITY["blocked_ramp"];
  var votes = report.resolvedVotes || 0;

  var icon = L.divIcon({
    className: "",
    html:
      '<div style="' +
        'width:36px; height:36px;' +
        'background:' + sev.color + ';' +
        'border-radius: 50% 50% 50% 0;' +
        'transform: rotate(-45deg);' +
        'border: 3px solid white;' +
        'box-shadow: 0 2px 8px rgba(0,0,0,0.5);' +
        'display:flex; align-items:center; justify-content:center;' +
      '">' +
        '<span style="transform:rotate(45deg); font-size:16px;">' + sev.emoji + '</span>' +
      '</div>',
    iconSize:    [36, 36],
    iconAnchor:  [18, 36],
    popupAnchor: [0, -36]
  });

  var timeAgo = getTimeAgo(report.timestamp);
  var remaining = 3 - votes;

  var popupHTML =
    '<div style="min-width:210px; font-family:sans-serif;">' +

      '<strong style="font-size:1rem; color:#60a5fa;">' +
        sev.emoji + ' ' + sev.label +
      '</strong><br/>' +

      '<span style="color:#94a3b8; font-size:0.78rem;">⏰ ' + timeAgo + '</span>' +

      '<p style="margin:8px 0; color:#e2e8f0;">' + report.description + '</p>' +

      '<div style="' +
        'background:#0f172a; border-radius:6px;' +
        'padding:6px 10px; margin-bottom:10px;' +
        'font-size:0.8rem; color:#94a3b8; text-align:center;' +
      '">' +
        '🗳️ ' + votes + '/3 people marked this resolved' +
        (remaining > 0
          ? ' — <span style="color:#fbbf24;">' + remaining + ' more needed</span>'
          : '') +
      '</div>' +

      '<button ' +
        'onclick="markResolved(\'' + key + '\')" ' +
        'style="' +
          'background:#22c55e; color:white; border:none;' +
          'padding:10px 14px; border-radius:6px; cursor:pointer;' +
          'font-size:0.9rem; width:100%; font-weight:bold;' +
        '">' +
        '✅ Mark as Resolved (' + votes + '/3)' +
      '</button>' +

    '</div>';

  var marker = L.marker([report.lat, report.lng], { icon: icon })
    .addTo(map)
    .bindPopup(popupHTML);

  markerObjects[key] = marker;
}

// ============================================================
// MARK AS RESOLVED — removes pin when 3 people vote
// ============================================================
function markResolved(key) {
  var ref = firebase.database().ref("reports/" + key);

  ref.transaction(function(report) {
    if (report) {
      report.resolvedVotes = (report.resolvedVotes || 0) + 1;
    }
    return report;
  }, function(error, committed, snapshot) {
    if (error) {
      showToast("❌ Something went wrong. Try again.");
      return;
    }
    if (committed && snapshot && snapshot.exists()) {
      var votes = snapshot.val().resolvedVotes;
      if (votes >= 3) {
        // 3 votes reached — delete the report from Firebase
        firebase.database().ref("reports/" + key).remove();
        showToast("✅ Problem resolved! Pin removed for everyone.");
      } else {
        var remaining = 3 - votes;
        showToast("👍 Marked! " + remaining + " more person(s) needed to remove pin.");
      }
    }
  });
}

// ============================================================
// ACCESSIBILITY SCORE
// ============================================================
function updateScore(total, active) {
  var score = 100;
  if (total > 0) {
    score = Math.max(0, 100 - (active * 4));
  }
  var el = document.getElementById("score");
  el.textContent = "Campus is " + score + "% accessible right now";
  el.style.color = score > 70 ? "#34d399" : score > 40 ? "#fbbf24" : "#ef4444";
}

// ============================================================
// HELPERS
// ============================================================
function getTimeAgo(ts) {
  var mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return mins + " min ago";
  var hrs = Math.floor(mins / 60);
  if (hrs < 24)  return hrs + " hr ago";
  return Math.floor(hrs / 24) + " days ago";
}

function showToast(msg) {
  var t = document.createElement("div");
  t.textContent = msg;
  t.style.cssText =
    "position:fixed; bottom:24px; left:50%;" +
    "transform:translateX(-50%);" +
    "background:#1e40af; color:#fff;" +
    "padding:12px 26px; border-radius:30px;" +
    "font-size:0.9rem; z-index:99999;" +
    "box-shadow:0 4px 20px rgba(0,0,0,0.4);";
  document.body.appendChild(t);
  setTimeout(function() { t.remove(); }, 4000);
}
