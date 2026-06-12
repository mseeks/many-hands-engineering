// Hello, Loop — the recorded runs behind Chapter 1.
//
// Three traces built on the loopstep engine: the canonical green walk, the
// close-on-red fork, and the ten-week amnesia comparison (the same loop run
// twice, once with its update stage deleted). Mechanism register: these are
// the engine's real dynamics, recorded. Captions are book text.

import { runCanonical, runLoopWeeks } from '../loopstep.js';
import { makeTrace, pushStep } from '../replay.js';

/**
 * The dependency-patch loop walked end to end on a green CI run: signal
 * fires, PR opens, CI passes, the merge lands, the ledger learns.
 * @param {number} seed
 * @returns {import('../replay.js').Trace}
 */
export function canonicalRun(seed) {
  return runCanonical(seed, { ciOutcome: 'green' });
}

/**
 * The same walk with CI red: close the PR, comment, delete the branch.
 * Reversibility working — no partial state survives a red.
 * @param {number} seed
 * @returns {import('../replay.js').Trace}
 */
export function redRun(seed) {
  return runCanonical(seed, { ciOutcome: 'red' });
}

const sum = (xs) => xs.reduce((a, b) => a + b, 0);

/**
 * Fork two: delete the `update:` block and run ten simulated weeks beside
 * the intact loop. The closing loop's review cost falls as its track record
 * accrues; the amnesiac loop re-pays week one's bill every week forever.
 * Step data carries both runs' series for the comparison chart.
 * @param {number} seed
 * @returns {import('../replay.js').Trace}
 */
export function amnesiaComparison(seed) {
  const weeks = 10;
  const closing = runLoopWeeks({ seed, weeks });
  const amnesiac = runLoopWeeks({ config: { signalUpdate: false }, seed, weeks });
  const rcClose = closing.series.reviewCost;
  const rcAmnesia = amnesiac.series.reviewCost;
  const bill = Math.round(sum(rcAmnesia) - sum(rcClose));
  const relitigated = amnesiac.weeks.filter((w) =>
    w.events.some((e) => e.includes('re-litigated')),
  ).length;

  const trace = makeTrace(seed);
  pushStep(trace, {
    label: 'two copies of one loop',
    caption:
      'Two copies of the dependency-patch loop, identical except for one ' +
      'deleted stanza: the second loop has no update stage, so outcomes ' +
      'never land anywhere. Both start with the same thin record and the ' +
      'same steward.',
    data: {
      weeks,
      closing: { config: 'all six ingredients', series: closing.series },
      amnesiac: { config: 'update: deleted', series: amnesiac.series },
    },
  });
  pushStep(trace, {
    label: 'week one — identical bills',
    caption:
      `Week one costs the steward ${rcClose[0]} review minutes on each ` +
      'side. With no track record yet, deleting the update stage changes ' +
      'nothing — the difference is not in how the loops work, it is in ' +
      'what they remember.',
    data: { week: 1, closingMinutes: rcClose[0], amnesiacMinutes: rcAmnesia[0] },
  });
  pushStep(trace, {
    label: 'week five — the curves part',
    caption:
      `By week five the closing loop's bill is down to ${rcClose[4]} ` +
      `minutes; the amnesiac loop still costs ${rcAmnesia[4]}. Watch the ` +
      'event log on the right: the same finding — is a lockfile-only diff ' +
      'safe to skim? — argued again, because last week never happened.',
    data: {
      week: 5,
      closingMinutes: rcClose[4],
      amnesiacMinutes: rcAmnesia[4],
      trust: { closing: closing.series.trust[4], amnesiac: amnesiac.series.trust[4] },
    },
  });
  pushStep(trace, {
    label: 'week ten — the amnesia bill',
    caption:
      `Ten weeks in: the closing loop's review cost fell from ${rcClose[0]} ` +
      `to ${rcClose.at(-1)} minutes as ${closing.summary.totalMerged} clean ` +
      'merges accrued to its classes. The amnesiac loop paid week-one ' +
      `prices all ten weeks and re-litigated the same finding ${relitigated} ` +
      `times. The difference — ${bill} steward minutes — is the amnesia ` +
      'bill, and it compounds for as long as you let it run.',
    data: {
      week: weeks,
      billMinutes: bill,
      relitigated,
      totals: { closing: Math.round(sum(rcClose)), amnesiac: Math.round(sum(rcAmnesia)) },
    },
  });
  return trace;
}
