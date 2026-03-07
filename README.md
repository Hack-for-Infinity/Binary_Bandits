🗺️ AccessMap — The Waze for Campus Accessibility

Know before you go.

A live, crowdsourced campus accessibility map that lets any student instantly report and view accessibility obstacles on campus — broken ramps, out-of-service elevators, flooded paths, and more — in real time.

🏷️ Project Title
AccessMap — Crowdsourced Campus Accessibility Navigator
Team Name: Binary Bandits
Hackathon: Infinity 2K26 — IEEE Computer Society OUCE Student Chapter

👥 Team Members
NameGitHub UsernameMd Abdullah Hyder@mdabdullahhyderSarthak Bhatnagar@sarthakbhatnagarMd Hussain Ali@mdhussainali

❓ Problem Statement
Wheelchair users and disabled students on campus have no reliable way of knowing whether a ramp is broken, an elevator is out of service, or a path is blocked by construction — until they are already stuck there, late and stranded.
Google Maps and other navigation tools do not show real-time, hyper-local accessibility conditions on a college campus. There is no crowdsourced, student-driven solution to this problem.
Who it affects: Students with mobility challenges, wheelchair users, students on crutches, or anyone with temporary injuries — anyone who depends on accessible infrastructure to attend class on time.
Why it matters: The cost of this gap is real — missed classes, physical strain, and a campus that doesn't feel inclusive to everyone.

🏗️ System Architecture / Design
┌─────────────────────────────────────────────────────┐
│                   User's Browser                    │
│                                                     │
│  index.html  ──►  app.js  ──►  Leaflet.js (Map)    │
│                      │                              │
│                      ▼                              │
│            Firebase Realtime Database               │
│          (stores & syncs all reports live)          │
│                      │                              │
│         ┌────────────┴────────────┐                 │
│         ▼                        ▼                  │
│   New pin appears          All other users          │
│   on YOUR map              see it instantly         │
└─────────────────────────────────────────────────────┘
Main Components:

index.html — Single webpage, loads all scripts and styles
style.css — Dark navy theme, responsive layout, filter bar, modal styles
app.js — All logic: map init, Firebase read/write, filters, scoring, colour blind mode
Firebase Realtime Database — Live data backend, syncs reports across all users instantly
Leaflet.js + OpenStreetMap — Free interactive map, no API key required


🛠️ Technologies Used
CategoryTechnologyFrontendHTML5, CSS3, Vanilla JavaScriptMapLeaflet.js v1.9.4 + OpenStreetMap tilesDatabaseFirebase Realtime DatabaseFirebase SDKfirebase-app-compat + firebase-database-compat v9.23.0HostingGitHub PagesStoragelocalStorage (per-device vote tracking)

⭐ Key Features

🗺️ Live Campus Map — Leaflet.js map centered on the campus, loads instantly in any phone browser
📍 Tap to Report — Click anywhere on the map to open a report form, pin drops instantly
🔴🟠🟢 Colour-Coded Pins — Red for Critical (Elevator, Entrance), Orange for Moderate (Ramp, Door, Path)
🔍 Filter Bar — 7 filter buttons to show only specific obstacle types
✅ Mark as Resolved — 3 community votes permanently removes a pin from Firebase
⏰ Auto-Expiry — Reports automatically expire after 24 hours if unconfirmed
👁️ Colour Blind Mode — Switches pin colours to Blue/Yellow for red-green colour blind users
📊 Live Accessibility Score — Campus is X% accessible right now — updates in real time
🔢 Active Report Counter — Shows total live obstacles, colour-coded by urgency


⚙️ How It Works

Student opens AccessMap in their phone browser — no app install needed
The live campus map loads with all active obstacle pins visible
Student taps anywhere on the map → report form opens with auto-filled coordinates
Student selects obstacle type (Elevator, Ramp, Door, Path, Entrance, Steep) and severity
Report is saved to Firebase Realtime Database → a coloured pin appears instantly for everyone
Other students can tap any pin, see details, and vote Mark as Resolved
After 3 votes, the pin is permanently deleted from Firebase and removed from all maps
Reports with no activity auto-expire after 24 hours to keep the map accurate
The Accessibility Score recalculates after every change: 100 - (active reports × 4)


🚀 How to Run
bash# 1. Clone the repository
git clone <repo-url>
cd AccessMap

# 2. Open directly in browser — no build step needed
# On Windows:
start index.html

# On Mac:
open index.html

# Or just drag index.html into any browser

⚠️ Note: For Firebase live sync to work, open via a local server or deploy to GitHub Pages.
The map and UI will load offline, but real-time pins require a Firebase connection.

To run :
Press the link https://hack-for-infinity.github.io/Binary_Bandits

📁 Project Structure
AccessMap/
├── index.html      # Main webpage — loads all scripts and styles
├── style.css       # Dark navy theme, responsive layout, modal, filter bar
├── app.js          # All logic: map, Firebase, filters, scoring, colour blind mode
└── README.md       # This file

🌍 Impact

Immediate — Any student can use it on day one, no signup required
Scalable — Works for any campus, just change the coordinates
Inclusive — Colour Blind Mode ensures it's accessible to all users
Zero cost — Firebase free tier + GitHub Pages = ₹0 infrastructure
