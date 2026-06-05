# ⚗️ VIRTUAL-LAB — 2D Physics Simulation Platform

> A collaborative "Digital Twin" environment for university-level physics learning. Build machines, test structural integrity, and observe real-time forces in a shared, high-fidelity workspace.

## 🚀 What is VIRTUAL-LAB?

Teaching complex physics online is often limited to static videos and non-interactive text. VIRTUAL-LAB bridges the gap between theoretical equations and physical reality through **hands-on experimentation** in a browser.

Multiple users can simultaneously build physics machines, run experiments, and observe results — all in real time.

---

## ✨ Features

- **🎮 Interactive Physics Canvas** — Drag, drop, and configure physical bodies (blocks, disks, rods, wedges). Connect them with springs, ropes, hinges, and motors
- **👥 Live Multiplayer Rooms** — Create or join a room with a 6-character code. Physics state syncs across all users in real time
- **📊 Real-Time Analytics Dashboard** — Live charts for kinetic energy, potential energy, velocity, angular momentum, and total system energy
- **🔬 16 Built-in Experiments** — Pre-configured university-level simulations across 4 physics domains
- **💾 Cloud Save & Load** — Save your scenes to the cloud and restore them from any device
- **🔍 Body Inspector** — Select any body to edit mass, friction, restitution, color, body type, and more
- **⚙️ Material Presets** — Wood, Steel, Rubber, Ice, Concrete, Plastic with accurate physical properties

---

## 🧪 Experiment Domains

| Domain | Experiments |
|--------|------------|
| **Newton's Laws** | Atwood's Machine, Projectile Motion, Newton's Cradle, Elastic Collisions |
| **Oscillations & SHM** | Spring-Mass, Double Pendulum, Coupled Oscillators, Damped Oscillation |
| **Rotational Motion** | Pulley System, Rolling on Incline, Gyroscope, Gear Train |
| **Advanced Systems** | Kepler Orbits, Chaotic Pendulum, Wave Machine |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v7 |
| Physics Engine | Matter.js |
| Animations | Motion (Framer Motion) |
| Styling | CSS Utilities + Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Supabase (Auth + Database + Edge Functions) |
| Real-time | Supabase Realtime Channels |
| Build Tool | Vite 6 |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── pages/
│   │   ├── HomePage.tsx        # Landing page
│   │   └── LabPage.tsx         # Main lab shell
│   └── components/
│       ├── PhysicsCanvas.tsx   # Core physics engine + canvas
│       ├── ToolPanel.tsx       # Left sidebar — body & tool picker
│       ├── ControlPanel.tsx    # Physics parameter sliders
│       ├── AnalyticsDashboard.tsx  # Live energy charts
│       ├── SelectionInspector.tsx  # Body property editor
│       ├── ExperimentLibrary.tsx   # 16 preset experiments
│       ├── SavedExperiments.tsx    # Cloud save/load
│       ├── RoomPanel.tsx       # Multiplayer rooms + chat
│       ├── AuthModal.tsx       # Sign in / Sign up
│       ├── WelcomeScreen.tsx   # Onboarding screen
│       ├── experimentDefinitions.ts  # All 16 experiment setups
│       └── materials.ts        # Material physics presets
└── styles/
    └── virtual-lab.css         # Main stylesheet
utils/
└── supabase/
    └── client.ts               # Backend API helpers
```

---

## ⚡ Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
http://localhost:5173
```

---


## 📄 License

MIT

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
