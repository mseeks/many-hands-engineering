// The page registry — the book's spine, second edition.
// One page = one screen = one activity. Numbering, titles, groups, and minutes
// are contracts: pages, nav, deep links, the screenshot harness, and the smoke
// test all key off this file.

export const GROUPS = [
  { id: 'run', title: 'Run', range: [0, 2] },
  { id: 'place', title: 'Place', range: [3, 4] },
  { id: 'dynamics', title: 'Dynamics', range: [5, 11] },
  { id: 'practice', title: 'Practice', range: [12, 17] },
  { id: 'glass', title: 'The glass case', range: [18, 18] },
];

export const PAGES = [
  { n: 0, group: 'run', title: 'Read me first', minutes: 3 },
  { n: 1, group: 'run', title: 'Hello, Loop', minutes: 4 },
  { n: 2, group: 'run', title: 'Nobody calls anyone', minutes: 4 },
  { n: 3, group: 'place', title: 'The spectrum', minutes: 3 },
  { n: 4, group: 'place', title: 'Placement', minutes: 6 },
  { n: 5, group: 'dynamics', title: 'Signals', minutes: 4 },
  { n: 6, group: 'dynamics', title: 'Runaway', minutes: 5 },
  { n: 7, group: 'dynamics', title: 'Spec rot', minutes: 4 },
  { n: 8, group: 'dynamics', title: 'The commons', minutes: 4 },
  { n: 9, group: 'dynamics', title: 'Guardrails', minutes: 4 },
  { n: 10, group: 'dynamics', title: 'Disturbance', minutes: 3 },
  { n: 11, group: 'dynamics', title: 'Alive', minutes: 4 },
  { n: 12, group: 'practice', title: 'Six ingredients', minutes: 5 },
  { n: 13, group: 'practice', title: 'A dozen loops, one ladder', minutes: 4 },
  { n: 14, group: 'practice', title: 'The gate', minutes: 6 },
  { n: 15, group: 'practice', title: 'Trust', minutes: 5 },
  { n: 16, group: 'practice', title: 'The edges', minutes: 4 },
  { n: 17, group: 'practice', title: 'Monday morning', minutes: 5 },
  { n: 18, group: 'glass', title: 'The glass case', minutes: 5 },
];

export const totalMinutes = PAGES.reduce((sum, p) => sum + p.minutes, 0);

export function pageByN(n) {
  return PAGES.find((p) => p.n === n);
}

export function pagesInGroup(id) {
  return PAGES.filter((p) => p.group === id);
}
