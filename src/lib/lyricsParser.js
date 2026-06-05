/**
 * lib/lyricsParser.js
 * Pure functions for parsing raw lyric text into structured data.
 */

/**
 * Splits raw text (double-newline separated) into an array of block strings.
 * @param {string} text
 * @returns {string[]}
 */
export function parseLyricsText(text) {
  if (!text) return [];
  const blocks = text.split(/\n\s*\n+/);
  return blocks.map((b) => b.trim()).filter(Boolean);
}

/**
 * Merges raw text + existing timings into a lyrics array.
 * @param {string} rawText
 * @param {number[]} timings  - existing timing values from state
 * @param {Array<{text,time}>} prevLyrics - previous lyrics array (for partial fallback)
 * @returns {Array<{text: string, time: number|null}>}
 */
export function buildLyricsFromRaw(rawText, timings = [], prevLyrics = []) {
  const blocks = parseLyricsText(rawText);
  return blocks.map((block, idx) => {
    let t = null;
    if (timings[idx] !== undefined) {
      t = timings[idx];
    } else if (prevLyrics[idx]) {
      t = prevLyrics[idx].time;
    }
    return { text: block, time: t };
  });
}

/**
 * Finds the first unsynchronised lyric index (time is null/undefined, or 0 on non-first line).
 * @param {Array<{text, time}>} lyrics
 * @returns {number}
 */
export function findFirstUnsyncedIndex(lyrics) {
  for (let i = 0; i < lyrics.length; i++) {
    const t = lyrics[i].time;
    if (t === null || t === undefined || (i > 0 && t === 0)) {
      return i;
    }
  }
  return 0;
}

/**
 * Format seconds → "m:ss" or "m:ss.cc".
 * @param {number|null} seconds
 * @param {boolean} showCentiseconds
 * @returns {string}
 */
export function formatTime(seconds, showCentiseconds = false) {
  if (seconds === null || isNaN(seconds) || seconds === undefined) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (showCentiseconds) {
    const c = Math.floor((seconds % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${c.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Parse a time string (mm:ss, mm:ss.cc, raw seconds) → number.
 * @param {string|number} val
 * @returns {number}
 */
export function parseTimeStr(val) {
  if (val === 'auto' || val === '' || val === undefined || val === null) return 0;
  const str = String(val).trim();
  if (str.toLowerCase() === 'auto') return 0;
  if (str.includes(':')) {
    const parts = str.split(':');
    const m = parseFloat(parts[0]) || 0;
    const s = parseFloat(parts[1]) || 0;
    return m * 60 + s;
  }
  return parseFloat(str) || 0;
}
