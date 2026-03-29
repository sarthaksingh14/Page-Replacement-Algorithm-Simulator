/**
 * algorithms/fifo.js — FIFO (First In, First Out) Page Replacement Algorithm
 *
 * HOW IT WORKS:
 *   Imagine memory frames as a queue at a ticket counter.
 *   The page that arrived FIRST is the one that leaves FIRST when
 *   a new page needs to be loaded and all frames are full.
 *
 * ANALOGY:
 *   Like a playlist — the song added earliest gets removed to make
 *   room for a new one when the playlist is full.
 *
 * PROS:  Simple to understand and implement.
 * CONS:  Suffers from "Bélády's Anomaly" — adding more frames can
 *        sometimes cause MORE page faults, not fewer.
 *
 * @param {number[]} pages      - The sequence of page numbers the CPU requests
 * @param {number}   frameCount - How many memory frames are available
 * @returns {{ steps, faults, hits }} - Full step-by-step trace + summary
 */
function fifo(pages, frameCount) {
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error('Pages must be a non-empty array');
  }
  if (frameCount < 1) {
    throw new Error('Frame count must be at least 1');
  }
  // frames[] holds the pages currently in memory.
  // null means the slot is empty (not yet loaded).
  const frames = new Array(frameCount).fill(null);

  // queue[] tracks the ORDER pages were loaded so we know which is oldest.
  // When frames are full, queue.shift() gives us the page that arrived first.
  const queue = [];

  // steps[] will hold a snapshot after EVERY page reference so the
  // frontend can animate each step one by one.
  const steps = [];

  // Count how many times we had to load a page (fault) vs found it (hit).
  let faults = 0;

  // Process each page request in the sequence one at a time.
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    // Check if this page is already sitting in one of the memory frames.
    const inMemory = frames.includes(page);

    if (!inMemory) {
      // ── PAGE FAULT ── The page we need is not in memory.
      faults++;
      let replaced    = null;   // which page gets kicked out (null if empty slot used)
      let replaceIdx  = -1;     // which frame slot gets overwritten

      // Is there still an empty frame we can use without evicting anyone?
      if (queue.length < frameCount) {
        // Yes — find the first null (empty) slot and use it.
        replaceIdx = frames.indexOf(null);
      } else {
        // No empty slots — evict the OLDEST page using the queue.
        // queue.shift() removes and returns the front element (oldest page).
        const oldest  = queue.shift();
        replaceIdx    = frames.indexOf(oldest); // find which frame holds it
        replaced      = oldest;                 // remember what we evicted for the UI
      }

      // Load the new page into the chosen frame slot.
      frames[replaceIdx] = page;

      // Add the new page to the BACK of the queue (it's now the youngest).
      queue.push(page);

      // Save a snapshot of this step for the frontend to display.
      steps.push({
        step:       i + 1,          // step number (1-based)
        page,                       // the page that was requested
        frames:     [...frames],    // copy of frame state AFTER this operation
        fault:      true,           // this was a page fault
        replaced,                   // page that was evicted (or null)
        replaceIdx,                 // which frame slot changed
        hitIdx:     -1,             // no hit, so -1
      });

    } else {
      // ── PAGE HIT ── Great! The page is already in memory. No work needed.

      // Save a snapshot — nothing changed in memory, but we still record it.
      steps.push({
        step:       i + 1,
        page,
        frames:     [...frames],    // same as before
        fault:      false,          // this was a hit
        replaced:   null,
        replaceIdx: -1,
        hitIdx:     frames.indexOf(page), // which frame holds the hit page
      });
    }
  }

  // Return the full trace plus totals.
  return {
    steps,
    faults,
    hits: pages.length - faults,
  };
}

// Export so routes/simulate.js can require() this function.
module.exports = fifo;
