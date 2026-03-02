const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── FIFO Algorithm ───────────────────────────────────────────────────────────
function fifo(pages, frameCount) {
  const frames = new Array(frameCount).fill(null);
  const queue = [];
  const steps = [];
  let faults = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const framesCopy = [...frames];
    const inMemory = frames.includes(page);

    if (!inMemory) {
      faults++;
      let replaced = null;
      let replaceIdx = -1;

      if (queue.length < frameCount) {
        // Find first empty slot
        replaceIdx = frames.indexOf(null);
      } else {
        // Replace oldest
        const oldest = queue.shift();
        replaceIdx = frames.indexOf(oldest);
        replaced = oldest;
      }

      frames[replaceIdx] = page;
      queue.push(page);

      steps.push({
        step: i + 1,
        page,
        frames: [...frames],
        fault: true,
        replaced,
        replaceIdx,
        hitIdx: -1
      });
    } else {
      steps.push({
        step: i + 1,
        page,
        frames: [...frames],
        fault: false,
        replaced: null,
        replaceIdx: -1,
        hitIdx: frames.indexOf(page)
      });
    }
  }

  return { steps, faults, hits: pages.length - faults };
}

// ─── LRU Algorithm ────────────────────────────────────────────────────────────
function lru(pages, frameCount) {
  const frames = new Array(frameCount).fill(null);
  const lastUsed = new Map(); // page -> last used index
  const steps = [];
  let faults = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const inMemory = frames.includes(page);

    if (!inMemory) {
      faults++;
      let replaced = null;
      let replaceIdx = -1;

      const emptyIdx = frames.indexOf(null);
      if (emptyIdx !== -1) {
        replaceIdx = emptyIdx;
      } else {
        // Find least recently used page in frames
        let lruTime = Infinity;
        for (let j = 0; j < frames.length; j++) {
          const t = lastUsed.get(frames[j]) ?? -1;
          if (t < lruTime) {
            lruTime = t;
            replaceIdx = j;
          }
        }
        replaced = frames[replaceIdx];
      }

      frames[replaceIdx] = page;

      steps.push({
        step: i + 1,
        page,
        frames: [...frames],
        fault: true,
        replaced,
        replaceIdx,
        hitIdx: -1
      });
    } else {
      steps.push({
        step: i + 1,
        page,
        frames: [...frames],
        fault: false,
        replaced: null,
        replaceIdx: -1,
        hitIdx: frames.indexOf(page)
      });
    }

    lastUsed.set(page, i);
  }

  return { steps, faults, hits: pages.length - faults };
}

// ─── Optimal Algorithm ────────────────────────────────────────────────────────
function optimal(pages, frameCount) {
  const frames = new Array(frameCount).fill(null);
  const steps = [];
  let faults = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const inMemory = frames.includes(page);

    if (!inMemory) {
      faults++;
      let replaced = null;
      let replaceIdx = -1;

      const emptyIdx = frames.indexOf(null);
      if (emptyIdx !== -1) {
        replaceIdx = emptyIdx;
      } else {
        // Find page used farthest in future
        let farthest = -1;
        for (let j = 0; j < frames.length; j++) {
          const nextUse = pages.indexOf(frames[j], i + 1);
          if (nextUse === -1) {
            replaceIdx = j;
            break;
          }
          if (nextUse > farthest) {
            farthest = nextUse;
            replaceIdx = j;
          }
        }
        replaced = frames[replaceIdx];
      }

      frames[replaceIdx] = page;

      steps.push({
        step: i + 1,
        page,
        frames: [...frames],
        fault: true,
        replaced,
        replaceIdx,
        hitIdx: -1
      });
    } else {
      steps.push({
        step: i + 1,
        page,
        frames: [...frames],
        fault: false,
        replaced: null,
        replaceIdx: -1,
        hitIdx: frames.indexOf(page)
      });
    }
  }

  return { steps, faults, hits: pages.length - faults };
}

// ─── API Routes ───────────────────────────────────────────────────────────────

// Simulate single algorithm
app.post('/api/simulate', (req, res) => {
  const { pages, frames, algorithm } = req.body;

  if (!pages || !Array.isArray(pages) || !frames || frames < 1 || frames > 8) {
    return res.status(400).json({ error: 'Invalid input: pages must be an array, frames 1-8' });
  }

  if (pages.length < 1 || pages.length > 30) {
    return res.status(400).json({ error: 'Page sequence must be 1-30 pages' });
  }

  let result;
  switch (algorithm) {
    case 'fifo': result = fifo(pages, frames); break;
    case 'lru': result = lru(pages, frames); break;
    case 'optimal': result = optimal(pages, frames); break;
    default: return res.status(400).json({ error: 'Unknown algorithm' });
  }

  res.json({ algorithm, frameCount: frames, pages, ...result });
});

// Compare all algorithms
app.post('/api/compare', (req, res) => {
  const { pages, frames } = req.body;

  if (!pages || !Array.isArray(pages) || !frames) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const fifoResult = fifo(pages, frames);
  const lruResult = lru(pages, frames);
  const optimalResult = optimal(pages, frames);

  const results = {
    fifo: { faults: fifoResult.faults, hits: fifoResult.hits, efficiency: ((fifoResult.hits / pages.length) * 100).toFixed(1) },
    lru:  { faults: lruResult.faults,  hits: lruResult.hits,  efficiency: ((lruResult.hits  / pages.length) * 100).toFixed(1) },
    optimal: { faults: optimalResult.faults, hits: optimalResult.hits, efficiency: ((optimalResult.hits / pages.length) * 100).toFixed(1) }
  };

  // Find winner (fewest faults)
  const minFaults = Math.min(fifoResult.faults, lruResult.faults, optimalResult.faults);
  const winner = Object.entries(results).find(([, v]) => v.faults === minFaults)[0];

  res.json({ results, winner, total: pages.length, frames });
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Page Replacement Simulator running at http://localhost:${PORT}\n`);
});
