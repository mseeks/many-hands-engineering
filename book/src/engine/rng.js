// Seeded randomness for every engine. Determinism is a book-wide contract:
// the same seed must produce the same trace, forever, so recorded runs can be
// pinned by tests and replayed identically for every reader.

/**
 * mulberry32 — tiny, fast, seedable PRNG.
 * @param {number} seed integer seed
 * @returns {() => number} float in [0, 1)
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Inclusive integer in [min, max].
 * @param {() => number} rng
 */
export function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Pick one element. */
export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

/** Fisher–Yates into a new array; the input is never mutated. */
export function shuffle(rng, arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
