<div align="center">

# ⚗️ Virtual-Lab

### A 2D Physics Simulation Platform for University-Level Learning

> Build machines. Run experiments. Observe forces — in real time, together.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com)

</div>

---

## 📌 Overview

Teaching physics online is often limited to static videos and non-interactive text. **Virtual-Lab** bridges the gap between theoretical equations and physical reality through hands-on experimentation in a browser.

Multiple users can simultaneously build physics machines, run experiments, and observe results — all in real time, in a shared collaborative workspace.

---

## ✨ Core Features

| Feature | Description |
|---|---|
| 🎮 **Interactive Physics Canvas** | Drag, drop, and configure bodies — blocks, disks, rods, wedges. Connect with springs, ropes, hinges, and motors |
| 👥 **Live Multiplayer Rooms** | Create or join a room via 6-character code. Physics state syncs across all users in real time |
| 📊 **Real-Time Analytics** | Live charts for kinetic energy, potential energy, velocity, angular momentum, and total system energy |
| 🔬 **16 Built-in Experiments** | Pre-configured university-level simulations across 4 physics domains |
| 💾 **Cloud Save & Load** | Save scenes to the cloud and restore them from any device |
| 🔍 **Body Inspector** | Select any body to edit mass, friction, restitution, color, body type, and more |
| ⚙️ **Material Presets** | Wood, Steel, Rubber, Ice, Concrete, Plastic — with accurate physical properties |

---

## 🧪 Experiment Library

<table>
<tr>
<th>Domain</th>
<th>Experiments</th>
</tr>
<tr>
<td><b>⚖️ Newton's Laws</b></td>
<td>Atwood's Machine · Projectile Motion · Newton's Cradle · Elastic Collisions</td>
</tr>
<tr>
<td><b>〰️ Oscillations & SHM</b></td>
<td>Spring-Mass · Double Pendulum · Coupled Oscillators · Damped Oscillation</td>
</tr>
<tr>
<td><b>🔄 Rotational Motion</b></td>
<td>Pulley System · Rolling on Incline · Gyroscope · Gear Train</td>
</tr>
<tr>
<td><b>🌌 Advanced Systems</b></td>
<td>Kepler Orbits · Chaotic Pendulum · Wave Machine</td>
</tr>
</table>

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v7 |
| **Physics Engine** | Matter.js |
| **Animations** | Motion (Framer Motion) |
| **Styling** | Tailwind CSS |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Backend** | Supabase (Auth · Database · Edge Functions) |
| **Real-time** | Supabase Realtime Channels |
| **Build Tool** | Vite 6 |

---

## 📁 Project Structure

```
Virtual-Lab/
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx              # Landing page
│   │   │   └── LabPage.tsx               # Main lab shell
│   │   └── components/
│   │       ├── PhysicsCanvas.tsx          # Core physics engine + canvas
│   │       ├── ToolPanel.tsx              # Left sidebar — body & tool picker
│   │       ├── ControlPanel.tsx           # Physics parameter sliders
│   │       ├── AnalyticsDashboard.tsx     # Live energy charts
│   │       ├── SelectionInspector.tsx     # Body property editor
│   │       ├── ExperimentLibrary.tsx      # 16 preset experiments
│   │       ├── SavedExperiments.tsx       # Cloud save / load
│   │       ├── RoomPanel.tsx              # Multiplayer rooms + chat
│   │       ├── AuthModal.tsx              # Sign in / Sign up
│   │       ├── WelcomeScreen.tsx          # Onboarding screen
│   │       ├── experimentDefinitions.ts   # All 16 experiment setups
│   │       └── materials.ts               # Material physics presets
│   └── styles/
│       └── virtual-lab.css               # Main stylesheet
└── utils/
    └── supabase/
        └── client.ts                     # Backend API helpers
```

---

## ⚡ Getting Started

**Prerequisites:** Node.js 18+

```bash
# 1. Clone the repository
git clone https://github.com/urarjunrathod/Virtual-Lab.git
cd Virtual-Lab

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
