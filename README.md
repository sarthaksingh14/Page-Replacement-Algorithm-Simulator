# 🧠 MemOS — Page Replacement Algorithm Simulator

A premium, animated, full-stack interactive simulator for FIFO, LRU, and Optimal page replacement algorithms.

**Stack:** Node.js + Express (backend) · HTML/CSS/JS (frontend)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
Or with auto-reload during development:
```bash
npm run dev   # requires: npm install -g nodemon
```

### 3. Open in Browser
```
http://localhost:3000
```

---

## 📁 Project Structure

```
page-replacement-simulator/
├── server.js              ← Express server + algorithm logic (FIFO, LRU, Optimal)
├── package.json
└── public/
    ├── index.html         ← Main page (hero, simulator, comparison)
    ├── css/
    │   └── style.css      ← Premium dark cyber-OS theme + animations
    └── js/
        └── main.js        ← Simulation engine, playback, API calls
```

---

## 🔌 API Endpoints

### `POST /api/simulate`
Run a single algorithm step-by-step.
```json
Request:  { "pages": [7,0,1,2,0,3], "frames": 3, "algorithm": "fifo" }
Response: { "steps": [...], "faults": 9, "hits": 3 }
```

### `POST /api/compare`
Compare all three algorithms at once.
```json
Request:  { "pages": [7,0,1,2,0,3], "frames": 3 }
Response: { "results": { "fifo": {...}, "lru": {...}, "optimal": {...} }, "winner": "optimal" }
```

---

## 🎮 Features

- ⚡ **Animated memory frames** — hit (green glow), fault (red shake), replacement (yellow swap)
- 📍 **Live page timeline** — current step highlighted, past steps color-coded
- 📊 **Live stats** — real-time fault/hit counters and hit rate %
- ▶ **Step-by-step + Auto-play** — with speed controls (0.5×, 1×, 2×)
- ⌨️ **Keyboard shortcuts** — Arrow keys to step, Space to play/pause, R to run
- 📋 **Full step trace table** — shows every frame state per step
- 📈 **Algorithm comparison** — animated cards + bar chart + winner highlight
- 🏆 **Page fault counter animation** — satisfying count-up effect

---

## 🎨 Design

- **Theme:** Dark Cyber-OS · Deep navy + cyan glow + purple accents
- **Fonts:** Orbitron (display) · Share Tech Mono (code) · Inter (body)
- **Effects:** Glassmorphism · Floating memory blocks · Grid background · Noise texture
- **Animations:** Scroll reveal · Frame shake/glow · Loading screen · Toast notifications

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `→` | Step Forward |
| `←` | Step Back |
| `Space` | Play / Pause |
| `R` | Run Simulation |

---

Built with ❤️ for LPU 2028 batch 🚀
