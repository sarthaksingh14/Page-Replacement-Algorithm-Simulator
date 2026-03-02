/* ──────────────────────────────────────────────────────────────────
   MemOS — Page Replacement Simulator — main.js
   ────────────────────────────────────────────────────────────────── */

/* ══════════════════════════════════════════════════════════════════
   DATAVEYES-STYLE PARTICLE NETWORK BACKGROUND
   - Organic drifting nodes connected by faint lines
   - Nodes carry page numbers, pulse gently
   - Mouse proximity attracts nearby particles
   ══════════════════════════════════════════════════════════════════ */
(function initParticleNetwork() {
  const canvas = document.getElementById("particle-canvas");
  const ctx = canvas.getContext("2d");

  // Config — tuned to match Dataveyes feel
  const CFG = {
    count: 90, // number of particles
    connectDist: 160, // max px to draw a line
    baseSpeed: 0.28, // drift speed
    minR: 1.8, // min node radius
    maxR: 4.5, // max node radius
    bgColor: "#020714",
    nodeColors: [
      "rgba(0,200,255,", // cyan
      "rgba(168,85,247,", // purple
      "rgba(0,255,136,", // green
      "rgba(255,255,255,", // white
    ],
    mouseRadius: 180, // mouse attraction radius
    mouseStrength: 0.018, // how strongly mouse pulls nodes
    pulseSpeed: 0.012,
    labels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  };

  let W,
    H,
    mouse = { x: -9999, y: -9999 };
  let particles = [];
  let raf;

  // ── Particle class ───────────────────────────────────────────────
  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(init = false) {
      this.x = init ? Math.random() * W : Math.random() > 0.5 ? -10 : W + 10;
      this.y = init ? Math.random() * H : Math.random() * H;
      this.vx = (Math.random() - 0.5) * CFG.baseSpeed * 2;
      this.vy = (Math.random() - 0.5) * CFG.baseSpeed * 2;
      this.r = CFG.minR + Math.random() * (CFG.maxR - CFG.minR);
      this.baseAlpha = 0.35 + Math.random() * 0.5;
      this.alpha = this.baseAlpha;
      this.colorBase =
        CFG.nodeColors[Math.floor(Math.random() * CFG.nodeColors.length)];
      this.phase = Math.random() * Math.PI * 2; // pulse phase
      this.showLabel = Math.random() < 0.28; // ~28% show a page number
      this.label = CFG.labels[Math.floor(Math.random() * CFG.labels.length)];
    }

    update() {
      // Gentle pulse
      this.phase += CFG.pulseSpeed;
      this.alpha = this.baseAlpha + Math.sin(this.phase) * 0.12;

      // Drift
      this.x += this.vx;
      this.y += this.vy;

      // Subtle mouse attraction
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CFG.mouseRadius && dist > 0) {
        const force = (CFG.mouseRadius - dist) / CFG.mouseRadius;
        this.vx += (dx / dist) * force * CFG.mouseStrength;
        this.vy += (dy / dist) * force * CFG.mouseStrength;
      }

      // Soft speed clamp with gentle drag
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      const maxSpeed = CFG.baseSpeed * 3.5;
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }
      this.vx *= 0.999;
      this.vy *= 0.999;

      // Wrap around edges (Dataveyes-style — particles re-enter from opposite side)
      if (this.x < -20) this.x = W + 20;
      if (this.x > W + 20) this.x = -20;
      if (this.y < -20) this.y = H + 20;
      if (this.y > H + 20) this.y = -20;
    }

    draw() {
      // Outer glow
      const gradient = ctx.createRadialGradient(
        this.x,
        this.y,
        0,
        this.x,
        this.y,
        this.r * 4,
      );
      gradient.addColorStop(
        0,
        this.colorBase + (this.alpha * 0.6).toFixed(2) + ")",
      );
      gradient.addColorStop(
        0.4,
        this.colorBase + (this.alpha * 0.2).toFixed(2) + ")",
      );
      gradient.addColorStop(1, this.colorBase + "0)");
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 4, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.colorBase + this.alpha.toFixed(2) + ")";
      ctx.fill();

      // Page number label on large labeled nodes
      if (this.showLabel && this.r > 2.8) {
        ctx.save();
        ctx.globalAlpha = this.alpha * 0.65;
        ctx.fillStyle = this.colorBase + "1)";
        ctx.font = `bold ${Math.floor(this.r * 2.8)}px 'Share Tech Mono', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.label, this.x, this.y);
        ctx.restore();
      }
    }
  }

  // ── Init ─────────────────────────────────────────────────────────
  function init() {
    resize();
    particles = Array.from({ length: CFG.count }, () => new Particle());
    cancelAnimationFrame(raf);
    loop();
  }

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  // ── Render loop ───────────────────────────────────────────────────
  function loop() {
    // Dataveyes uses a very-slightly-transparent clear so trails briefly linger
    ctx.fillStyle = "rgba(2,7,20,0.18)";
    ctx.fillRect(0, 0, W, H);

    // Draw connections first
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CFG.connectDist) {
          const opacity = (1 - dist / CFG.connectDist) * 0.22;
          // Blend the two node colors for the line
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,200,255,${opacity.toFixed(3)})`;
          ctx.lineWidth = (1 - dist / CFG.connectDist) * 1.2;
          ctx.stroke();
        }
      }
    }

    // Draw and update particles
    particles.forEach((p) => {
      p.update();
      p.draw();
    });

    raf = requestAnimationFrame(loop);
  }

  // ── Events ────────────────────────────────────────────────────────
  window.addEventListener("resize", () => {
    resize();
  });

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener("mouseleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // Touch support
  window.addEventListener(
    "touchmove",
    (e) => {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    },
    { passive: true },
  );

  // Start once DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

// ── State ──────────────────────────────────────────────────────────
let simData = null; // Full simulation result from API
let currentStep = -1; // Currently displayed step index
let isPlaying = false;
let playInterval = null;
let playSpeed = 1000; // ms per step
let selectedAlgo = "fifo";
let tableVisible = true;
const API = ""; // Same origin

// ── Loader ─────────────────────────────────────────────────────────
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("loader").classList.add("hide");
  }, 1500);
  initScrollObserver();
});

// ── Smooth scroll helper ───────────────────────────────────────────
function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({
    behavior: "smooth",
  });
}

// ── Scroll Reveal ──────────────────────────────────────────────────
function initScrollObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("show");
        }
      });
    },
    { threshold: 0.15 },
  );

  document
    .querySelectorAll(".fade-el, .algo-card, .compare-card")
    .forEach((el) => {
      observer.observe(el);
    });
}

// ── Algorithm Selection ────────────────────────────────────────────
function selectAlgo(algo) {
  selectedAlgo = algo;
  document
    .querySelectorAll(".algo-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById(`btn-${algo}`)?.classList.add("active");
}

// ── Frame slider ───────────────────────────────────────────────────
function updateFrameVal() {
  document.getElementById("frameVal").textContent =
    document.getElementById("frameSlider").value;
}

// ── Parse page input ───────────────────────────────────────────────
function parsePages() {
  const raw = document.getElementById("pageInput").value.trim();
  const pages = raw
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => !isNaN(n) && n >= 0);
  return pages;
}

// ── Run Simulation ─────────────────────────────────────────────────
async function runSimulation() {
  const pages = parsePages();
  const frames = parseInt(document.getElementById("frameSlider").value);

  if (pages.length < 2) {
    showToast("⚠ Please enter at least 2 page numbers");
    return;
  }
  if (pages.length > 30) {
    showToast("⚠ Max 30 pages allowed");
    return;
  }

  // Reset UI
  resetSim(false);
  showToast(`🚀 Running ${selectedAlgo.toUpperCase()} simulation...`);

  try {
    const res = await fetch(`${API}/api/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pages, frames, algorithm: selectedAlgo }),
    });

    if (!res.ok) {
      const err = await res.json();
      showToast(`❌ ${err.error}`);
      return;
    }

    simData = await res.json();
    currentStep = -1;

    buildTimeline(simData.pages);
    buildFrameBoxes(frames);
    buildTable(simData, frames);

    document.getElementById("totalSteps").textContent = simData.steps.length;
    document.getElementById("playbackCtrl").style.display = "flex";
    document.getElementById("statusBar").style.display = "flex";
    document.getElementById("tablePanel").style.display = "block";

    // Auto-play
    startAutoPlay();
  } catch (e) {
    showToast("❌ Server error. Is the Node.js server running?");
    console.error(e);
  }
}

// ── Build Timeline ─────────────────────────────────────────────────
function buildTimeline(pages) {
  const track = document.getElementById("timelineTrack");
  track.innerHTML = "";
  pages.forEach((p, i) => {
    const el = document.createElement("div");
    el.className = "timeline-item";
    el.id = `tl-${i}`;
    el.innerHTML = `${p}<div class="step-dot"></div>`;
    track.appendChild(el);
  });
}

// ── Build Memory Frames ────────────────────────────────────────────
function buildFrameBoxes(count) {
  const row = document.getElementById("framesRow");
  row.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const box = document.createElement("div");
    box.className = "frame-box frame-empty";
    box.id = `frame-${i}`;
    box.innerHTML = `
      <div class="frame-num">F${i + 1}</div>
      <div class="frame-val">—</div>
    `;
    row.appendChild(box);
  }
}

// ── Build Step Table ───────────────────────────────────────────────
function buildTable(data, frameCount) {
  // Set frame column headers
  const headers = document.getElementById("tableFrameHeaders");
  let hHTML = "";
  for (let i = 0; i < frameCount; i++) hHTML += `</th><th>F${i + 1}`;
  headers.innerHTML = hHTML;

  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  data.steps.forEach((step, idx) => {
    const tr = document.createElement("tr");
    tr.id = `row-${idx}`;

    let frameCells = "";
    for (let i = 0; i < frameCount; i++) {
      const val = step.frames[i];
      const isHit = !step.fault && step.hitIdx === i;
      const isFault = step.fault && step.replaceIdx === i;
      frameCells += `<td style="${isHit ? "color:var(--green);" : isFault ? "color:var(--red);" : ""}">${val ?? "—"}</td>`;
    }

    tr.innerHTML = `
      <td style="color:var(--text-muted)">${step.step}</td>
      <td class="cell-page">${step.page}</td>
      ${frameCells}
      <td class="${step.fault ? "cell-fault" : "cell-hit"}">${step.fault ? "✗ FAULT" : "✓ HIT"}</td>
      <td style="color:var(--text-dim)">${step.replaced ?? "—"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Show Step ──────────────────────────────────────────────────────
function showStep(idx) {
  if (!simData || idx < 0 || idx >= simData.steps.length) return;
  currentStep = idx;

  const step = simData.steps[idx];

  // Update step counter
  document.getElementById("stepNum").textContent = idx + 1;

  // Update live stats (accumulate up to current step)
  let faults = 0,
    hits = 0;
  for (let i = 0; i <= idx; i++) {
    if (simData.steps[i].fault) faults++;
    else hits++;
  }
  const total = idx + 1;
  document.getElementById("liveFaults").textContent = faults;
  document.getElementById("liveHits").textContent = hits;
  document.getElementById("liveEff").textContent =
    ((hits / total) * 100).toFixed(0) + "%";

  // Update timeline
  document.querySelectorAll(".timeline-item").forEach((el, i) => {
    el.classList.remove("current", "hit", "fault", "done");
    if (i < idx) {
      const s = simData.steps[i];
      el.classList.add("done", s.fault ? "fault" : "hit");
    } else if (i === idx) {
      el.classList.add("current");
      el.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  });

  // Update frame boxes
  const frameCount = simData.frameCount;
  for (let i = 0; i < frameCount; i++) {
    const box = document.getElementById(`frame-${i}`);
    if (!box) continue;
    box.classList.remove("hit", "fault", "replaced", "frame-empty");
    const val = step.frames[i];
    box.querySelector(".frame-val").textContent = val ?? "—";

    if (val === null) {
      box.classList.add("frame-empty");
    } else if (!step.fault && step.hitIdx === i) {
      box.classList.add("hit");
    } else if (step.fault && step.replaceIdx === i) {
      if (step.replaced !== null) {
        box.classList.add("replaced");
      } else {
        box.classList.add("fault");
      }
    }
  }

  // Status bar
  const sb = document.getElementById("statusBar");
  if (step.fault) {
    sb.innerHTML = `
      <div class="status-chip chip-fault"><span class="chip-action">💥</span> PAGE FAULT — Page ${step.page} not in memory</div>
      ${step.replaced !== null ? `<div class="status-chip chip-info"><span class="chip-action">🔁</span> Replaced page ${step.replaced} → ${step.page}</div>` : `<div class="status-chip chip-info"><span class="chip-action">✚</span> Loaded page ${step.page} into empty frame</div>`}
    `;
  } else {
    sb.innerHTML = `
      <div class="status-chip chip-hit"><span class="chip-action">✅</span> PAGE HIT — Page ${step.page} found in Frame ${step.hitIdx + 1}</div>
    `;
  }

  // Highlight table row
  document
    .querySelectorAll("tbody tr")
    .forEach((r) => r.classList.remove("row-active"));
  const row = document.getElementById(`row-${idx}`);
  if (row) {
    row.classList.add("row-active");
    row.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

// ── Playback Controls ──────────────────────────────────────────────
function stepForward() {
  if (!simData) return;
  stopAutoPlay();
  showStep(Math.min(currentStep + 1, simData.steps.length - 1));
}

function stepBack() {
  if (!simData) return;
  stopAutoPlay();
  showStep(Math.max(currentStep - 1, 0));
}

function togglePlay() {
  if (isPlaying) stopAutoPlay();
  else startAutoPlay();
}

function startAutoPlay() {
  if (!simData) return;
  isPlaying = true;
  document.getElementById("playPauseBtn").textContent = "⏸";
  document.getElementById("playPauseBtn").classList.add("active");

  // If at end, restart
  if (currentStep >= simData.steps.length - 1) currentStep = -1;

  playInterval = setInterval(() => {
    if (currentStep >= simData.steps.length - 1) {
      stopAutoPlay();
      showToast(
        `✅ Simulation complete! ${simData.faults} page faults, ${simData.hits} hits`,
      );
      return;
    }
    showStep(currentStep + 1);
  }, playSpeed);
}

function stopAutoPlay() {
  isPlaying = false;
  clearInterval(playInterval);
  document.getElementById("playPauseBtn").textContent = "▶";
  document.getElementById("playPauseBtn").classList.remove("active");
}

function setSpeed(ms) {
  playSpeed = ms;
  document
    .querySelectorAll(".speed-btn")
    .forEach((b) => b.classList.remove("active"));
  const map = { 2000: "0.5×", 1000: "1×", 400: "2×" };
  document.querySelectorAll(".speed-btn").forEach((b) => {
    if (b.textContent === map[ms]) b.classList.add("active");
  });
  if (isPlaying) {
    stopAutoPlay();
    startAutoPlay();
  }
}

function resetSim(clearData = true) {
  stopAutoPlay();
  if (clearData) simData = null;
  currentStep = -1;
  document.getElementById("stepNum").textContent = "0";
  document.getElementById("totalSteps").textContent = "0";
  document.getElementById("liveFaults").textContent = "—";
  document.getElementById("liveHits").textContent = "—";
  document.getElementById("liveEff").textContent = "—";
  document.getElementById("framesRow").innerHTML = `
    <div class="welcome-state">
      <div class="welcome-icon">💾</div>
      <h3>Memory frames will appear here</h3>
      <p>Enter a page sequence and hit Run Simulation</p>
    </div>`;
  document.getElementById("statusBar").style.display = "none";
  document.getElementById("playbackCtrl").style.display = "none";
  document.getElementById("tablePanel").style.display = "none";
  document.getElementById("timelineTrack").innerHTML = `
    <div class="timeline-item" style="color:var(--text-muted);font-size:12px;width:auto;padding:0 16px;">
      Configure & run simulation to see the timeline
    </div>`;
}

function toggleTable() {
  tableVisible = !tableVisible;
  const tbody =
    document.getElementById("tableBody").parentElement.parentElement;
  tbody.style.display = tableVisible ? "block" : "none";
}

// ── Run Comparison ─────────────────────────────────────────────────
async function runComparison() {
  const pages = parsePages();
  const frames = parseInt(document.getElementById("frameSlider").value);

  if (pages.length < 2) {
    showToast("⚠ Please enter at least 2 page numbers");
    return;
  }

  showToast("📊 Comparing all algorithms...");
  scrollTo("#comparison");

  try {
    const res = await fetch(`${API}/api/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pages, frames }),
    });

    const data = await res.json();
    renderComparison(data, pages.length);
  } catch (e) {
    showToast("❌ Server error. Is the Node.js server running?");
    console.error(e);
  }
}

// ── Render Comparison ──────────────────────────────────────────────
function renderComparison(data, total) {
  const grid = document.getElementById("compareGrid");
  grid.innerHTML = "";

  const algos = [
    {
      key: "fifo",
      name: "FIFO",
      icon: "📦",
      color: "var(--cyan)",
      barColor: "#00c8ff",
    },
    {
      key: "lru",
      name: "LRU",
      icon: "🔁",
      color: "var(--purple)",
      barColor: "#a855f7",
    },
    {
      key: "optimal",
      name: "Optimal",
      icon: "🎯",
      color: "var(--green)",
      barColor: "#00ff88",
    },
  ];

  const maxFaults = Math.max(...algos.map((a) => data.results[a.key].faults));

  algos.forEach((a, i) => {
    const r = data.results[a.key];
    const isWinner = a.key === data.winner;
    const card = document.createElement("div");
    card.className = `compare-card fade-el ${isWinner ? "winner" : ""}`;
    card.style.transitionDelay = `${i * 0.1}s`;

    card.innerHTML = `
      ${isWinner ? `<div class="winner-badge">🏆 BEST ALGORITHM</div>` : '<div style="height:28px"></div>'}
      <div class="card-algo-name" style="color:${a.color}">${a.icon} ${a.name}</div>
      <div class="card-faults-big" style="color:${a.color}" id="ctr-${a.key}">0</div>
      <div class="card-fault-label">Page Faults</div>
      <div class="card-bar">
        <div class="card-bar-fill" id="bar-${a.key}" style="background:${a.barColor}"></div>
      </div>
      <div class="card-stats">
        <div class="mini-stat">
          <span class="val" style="color:var(--green)">${r.hits}</span>
          <span class="lbl">Hits</span>
        </div>
        <div class="mini-stat">
          <span class="val" style="color:var(--cyan)">${r.efficiency}%</span>
          <span class="lbl">Hit Rate</span>
        </div>
        <div class="mini-stat">
          <span class="val" style="color:var(--text-dim)">${total}</span>
          <span class="lbl">Total</span>
        </div>
      </div>
    `;
    grid.appendChild(card);

    // Animate after append
    setTimeout(
      () => {
        card.classList.add("show");
        // Counter animation
        animateCounter(`ctr-${a.key}`, r.faults, 50);
        // Bar fill
        setTimeout(() => {
          document.getElementById(`bar-${a.key}`).style.width =
            `${(r.faults / maxFaults) * 100}%`;
          document.getElementById(`bar-${a.key}`).textContent = r.faults;
        }, 300);
      },
      100 + i * 150,
    );
  });

  // Bar chart
  renderBarChart(data, algos, maxFaults);

  showToast(
    `🏆 Winner: ${data.winner.toUpperCase()} with ${data.results[data.winner].faults} faults!`,
  );
}

function renderBarChart(data, algos, maxFaults) {
  const bc = document.getElementById("barChart");
  bc.style.display = "block";
  const chartBars = document.getElementById("chartBars");
  chartBars.innerHTML = "";

  algos.forEach((a, i) => {
    const r = data.results[a.key];
    const row = document.createElement("div");
    row.className = "chart-bar-row";
    row.innerHTML = `
      <div class="chart-bar-name">${a.name}</div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" id="cb-${a.key}" style="background:${a.barColor};width:0"></div>
      </div>
    `;
    chartBars.appendChild(row);

    setTimeout(
      () => {
        document.getElementById(`cb-${a.key}`).style.width =
          `${(r.faults / maxFaults) * 100}%`;
        document.getElementById(`cb-${a.key}`).textContent =
          `${r.faults} faults`;
      },
      400 + i * 150,
    );
  });
}

// ── Counter Animation ──────────────────────────────────────────────
function animateCounter(id, target, delay = 30) {
  let current = 0;
  const el = document.getElementById(id);
  if (!el) return;
  const step = Math.max(1, Math.ceil(target / 20));
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(interval);
  }, delay);
}

// ── Toast Notification ─────────────────────────────────────────────
let toastTimeout;
function showToast(msg, duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), duration);
}

// ── Keyboard shortcuts ─────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  switch (e.key) {
    case "ArrowRight":
      stepForward();
      break;
    case "ArrowLeft":
      stepBack();
      break;
    case " ":
      e.preventDefault();
      togglePlay();
      break;
    case "r":
    case "R":
      runSimulation();
      break;
  }
});
