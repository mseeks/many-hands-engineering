// The chapter registry — the frozen spine of the book.
// Numbering, titles, acts, and minutes are contracts: chapters, nav, deep links,
// the screenshot harness, and the e2e smoke all key off this file.

export const ACTS = [
  { act: 0, title: 'The bench itself', range: [0, 0] },
  { act: 1, title: 'The argument', range: [1, 3] },
  { act: 2, title: 'The framework', range: [4, 13] },
  { act: 3, title: 'The practice', range: [14, 22] },
  { act: 4, title: 'The glass case', range: [23, 25] },
];

export const CHAPTERS = [
  { n: 0, act: 0, title: 'How to read this bench', minutes: 8, fast: true },
  { n: 1, act: 1, title: 'Hello, Loop', minutes: 10, fast: true },
  { n: 2, act: 1, title: 'The turn', minutes: 8, fast: false },
  { n: 3, act: 1, title: 'Nobody is calling anyone', minutes: 12, fast: true },
  { n: 4, act: 2, title: 'The spectrum', minutes: 8, fast: false },
  { n: 5, act: 2, title: 'Placement', minutes: 14, fast: true },
  { n: 6, act: 2, title: 'Hybrids and strata', minutes: 10, fast: false },
  { n: 7, act: 2, title: 'The commons', minutes: 8, fast: false },
  { n: 8, act: 2, title: 'Signal physics', minutes: 10, fast: false },
  { n: 9, act: 2, title: 'Runaway', minutes: 12, fast: true },
  { n: 10, act: 2, title: 'Spec rot', minutes: 10, fast: false },
  { n: 11, act: 2, title: 'Guardrails', minutes: 8, fast: false },
  { n: 12, act: 2, title: 'Entropy and disturbance', minutes: 8, fast: false },
  { n: 13, act: 2, title: 'The signature of alive', minutes: 8, fast: false },
  { n: 14, act: 3, title: 'Anatomy of a loop', minutes: 12, fast: true },
  { n: 15, act: 3, title: 'The catalog, and compounding', minutes: 10, fast: false },
  { n: 16, act: 3, title: 'The staged transition', minutes: 8, fast: false },
  { n: 17, act: 3, title: 'The steward', minutes: 8, fast: false },
  { n: 18, act: 3, title: 'Gate, rate, budget', minutes: 12, fast: true },
  { n: 19, act: 3, title: 'Trust', minutes: 12, fast: true },
  { n: 20, act: 3, title: 'Measurement, correctness, security', minutes: 10, fast: false },
  { n: 21, act: 3, title: "Where this doesn't work", minutes: 8, fast: true },
  { n: 22, act: 3, title: 'The checkride, and Monday morning', minutes: 15, fast: true },
  { n: 23, act: 4, title: 'Provenance', minutes: 8, fast: false },
  { n: 24, act: 4, title: 'The backbone, held honestly', minutes: 6, fast: false },
  { n: 25, act: 4, title: 'Open questions, the sort, and the coda', minutes: 10, fast: false },
];

export const totalMinutes = CHAPTERS.reduce((sum, ch) => sum + ch.minutes, 0);

export function chapterById(n) {
  return CHAPTERS.find((ch) => ch.n === n);
}

export function actOfChapter(n) {
  const ch = chapterById(n);
  return ch ? ch.act : 0;
}

export function chaptersInAct(act) {
  return CHAPTERS.filter((ch) => ch.act === act);
}
