// Trace the cause — the coordination history behind Chapter 3's probe.
//
// Ten events across five loops, ending in a coordinated outcome: a zod
// version bump merged by dependency-patch, and days later a proposal from
// dead-code to remove the package entirely. The shape is real (froot,
// 2026); the events here are the teaching reconstruction of it.
//
// The point of the data is what is absent. Every causal hop is a READ or a
// WRITE of some terrain artifact — a signal, a branch, a ledger row, main
// itself. No event calls another. causalChain() walks any outcome backward
// and always terminates in a signal in the terrain.

/**
 * The five loops on stage, with the book-wide color tokens from book.css.
 * 'terrain' (the registry sync, the CI oracle) appears as an actor in the
 * event log but is not a loop: nothing fires it, it is the ground.
 */
export const loops = [
  { id: 'dep-patch', name: 'dependency-patch', color: 'var(--c-deppatch)' },
  { id: 'dead-code', name: 'dead-code', color: 'var(--c-deadcode)' },
  { id: 'flaky-test', name: 'flaky-test', color: 'var(--c-flaky)' },
  { id: 'doc-refresh', name: 'doc-refresh', color: 'var(--c-docs)' },
  { id: 'triage', name: 'triage', color: 'var(--c-triage)' },
];

/**
 * @typedef {Object} CoordEvent
 * @property {string} id
 * @property {number} day      day on the compressed ten-day clock
 * @property {string} loop     a loop id from `loops`, or 'terrain'
 * @property {{ artifact: string, wroteBy: string }[]} reads
 *   terrain artifacts this event read, each pointing at the event that
 *   wrote it. An event with no reads is a signal in the terrain: a root.
 * @property {string[]} writes terrain artifacts this event wrote
 * @property {string} caption  reader-facing book text
 */

/** @type {CoordEvent[]} */
export const events = [
  {
    id: 'sig-zod-patch',
    day: 0,
    loop: 'terrain',
    reads: [],
    writes: ['signals/deps.outdated'],
    caption:
      'The nightly registry sync writes zod 3.24.1 → 3.24.2 into the ' +
      'outdated-deps signal. No loop did this. A condition in the terrain ' +
      'became true, and the terrain now says so.',
  },
  {
    id: 'dp-open',
    day: 1,
    loop: 'dep-patch',
    reads: [{ artifact: 'signals/deps.outdated', wroteBy: 'sig-zod-patch' }],
    writes: ['repo/branch/deps-zod-3.24.2', 'repo/pr-481'],
    caption:
      'dependency-patch reads the outdated-deps signal and opens PR #481: ' +
      'one bump, lockfile only. It read the terrain. Nothing called it.',
  },
  {
    id: 'ci-pr481',
    day: 1,
    loop: 'terrain',
    reads: [{ artifact: 'repo/pr-481', wroteBy: 'dp-open' }],
    writes: ['signals/ci.status/pr-481', 'signals/ci.flakiness'],
    caption:
      'CI reads the branch and writes two things back: green on PR #481, ' +
      'and a refreshed per-test pass/fail record. The oracle is terrain ' +
      'too — it read a branch and wrote a verdict where anyone can see it.',
  },
  {
    id: 'dp-merge',
    day: 2,
    loop: 'dep-patch',
    reads: [{ artifact: 'signals/ci.status/pr-481', wroteBy: 'ci-pr481' }],
    writes: ['repo/main', 'ledger/patch-bump', 'signals/docs.freshness'],
    caption:
      'dependency-patch reads green and merges. main now carries zod ' +
      '3.24.2, the ledger gains one clean patch-bump row, and the ' +
      'doc-freshness field decays where the covered code moved.',
  },
  {
    id: 'ft-fix',
    day: 3,
    loop: 'flaky-test',
    reads: [{ artifact: 'signals/ci.flakiness', wroteBy: 'ci-pr481' }],
    writes: ['repo/pr-482'],
    caption:
      'flaky-test reads the pass/fail record the CI run refreshed: ' +
      'schema-fixture.spec has slipped into the flaky band. It opens PR ' +
      '#482 with a seed-isolation fix. It never spoke to ' +
      'dependency-patch; they share a terrain, not a channel.',
  },
  {
    id: 'graph-scan',
    day: 4,
    loop: 'dead-code',
    reads: [{ artifact: 'repo/main', wroteBy: 'dp-merge' }],
    writes: ['signals/deadness'],
    caption:
      "dead-code's nightly scan reads main — fresh after the merge — and " +
      'recomputes the deadness map. The import graph shows zero zod ' +
      "imports left; last quarter's parser rewrite orphaned the package. " +
      'The map says so, persistently, to anyone who reads it.',
  },
  {
    id: 'dc-propose',
    day: 5,
    loop: 'dead-code',
    reads: [{ artifact: 'signals/deadness', wroteBy: 'graph-scan' }],
    writes: ['repo/pr-487'],
    caption:
      'Deadness has held across the stability window, so dead-code opens ' +
      'PR #487: remove zod from the manifest entirely — the same package ' +
      'dependency-patch bumped three days ago. No call between them. The ' +
      'repo state is the bus.',
  },
  {
    id: 'dr-rewrite',
    day: 6,
    loop: 'doc-refresh',
    reads: [{ artifact: 'signals/docs.freshness', wroteBy: 'dp-merge' }],
    writes: ['repo/pr-488'],
    caption:
      'doc-refresh reads the freshness field — which the merge pushed past ' +
      'threshold on validation.md — and opens PR #488, rewriting the page ' +
      'against current code with two unconfirmable sentences flagged.',
  },
  {
    id: 'triage-rank',
    day: 7,
    loop: 'triage',
    reads: [
      { artifact: 'signals/deadness', wroteBy: 'graph-scan' },
      { artifact: 'signals/ci.flakiness', wroteBy: 'ci-pr481' },
      { artifact: 'signals/docs.freshness', wroteBy: 'dp-merge' },
    ],
    writes: ['signals/queue.ranked'],
    caption:
      'triage reads the whole field — deadness, flakiness, freshness — and ' +
      'writes a ranked queue: the zod removal first, the flaky fix second, ' +
      'the doc rewrite third. It commanded no one. It wrote a ranking into ' +
      'the terrain and stopped.',
  },
  {
    id: 'dc-removal-merge',
    day: 9,
    loop: 'dead-code',
    reads: [{ artifact: 'signals/queue.ranked', wroteBy: 'triage-rank' }],
    writes: ['repo/main', 'ledger/dead-code'],
    caption:
      'The steward works the ranked queue top-down and the zod removal ' +
      'merges. Ten events, five loops, one coordinated outcome — and every ' +
      'arrow you can trace is a read or a write of the terrain. Try to ' +
      'find the call. There is not one.',
  },
];

const byId = new Map(events.map((e) => [e.id, e]));

/**
 * Walk an outcome backward through the terrain. From the given event,
 * follow every read to the event that wrote that artifact, breadth-first,
 * until only root events (signals in the terrain) remain.
 *
 * Every hop is `{ from, artifact, to, kind: 'READ' }`: `from` READ
 * `artifact`, which `to` had WRITTEN. There is no other kind of hop —
 * 'CALL' is not representable in this history, which is the chapter's
 * point.
 *
 * @param {string} eventId
 * @returns {{ hops: { from: string, artifact: string, to: string,
 *   kind: 'READ', label: string }[],
 *   terminal: { id: string, artifact: string, note: string } }}
 */
export function causalChain(eventId) {
  const start = byId.get(eventId);
  if (!start) throw new Error(`unknown event: ${eventId}`);

  const hops = [];
  const visited = new Set([start.id]);
  let frontier = [start];
  let terminal = start;
  while (frontier.length > 0) {
    const next = [];
    for (const event of frontier) {
      if (event.reads.length === 0) terminal = event; // a root: a terrain signal
      for (const read of event.reads) {
        const writer = byId.get(read.wroteBy);
        hops.push({
          from: event.id,
          artifact: read.artifact,
          to: writer.id,
          kind: 'READ',
          label: `${event.id} READ ${read.artifact} — WRITTEN by ${writer.id}`,
        });
        if (!visited.has(writer.id)) {
          visited.add(writer.id);
          next.push(writer);
        }
      }
    }
    frontier = next;
  }

  return {
    hops,
    terminal: {
      id: terminal.id,
      artifact: terminal.writes[0],
      note:
        'The chain ends here: a signal in the terrain, written by no ' +
        'loop. There was never a caller to find.',
    },
  };
}
