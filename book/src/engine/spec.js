// spec.js — the planned death spiral (handbook §2.9, the Spec Gap bench).
//
// One condition drives everything here: the spec loses contact with reality
// faster than it can be updated. Reality drifts every week. A revision budget
// says how much drift the spec team can absorb. The team keeps building
// against whatever the spec still claims, so work built on a stale assertion
// is rework — and whether that rework is *visible* is the whole game.
// Executable contracts surface it the week it happens. Integration cadence
// decides how long it hides otherwise. Big-bang integration hides it until a
// single event reveals all of it at once: the cliff.
//
// The rng feeds only the drift stream, so two runs with the same seed face
// the same reality no matter which remedies are applied. The lab's second run
// depends on this: same drift, different structure, no cliff.

import { mulberry32, randInt } from './rng.js';

/**
 * @typedef {{ week: number, valid: number, hiddenRework: number,
 *   visibleRework: number, wip: number, backlog: number }} SpecWeek
 * @typedef {{ week: number, magnitude: number }} Cliff
 */

// Work produced per week at effort 1 (feeds wip), and revealed rework redone
// per week at effort 1 (drains the backlog). Effort multiplies both — and
// only both. Modeling choice (Ⓦ): heroics move work that can be seen; they
// cannot reveal hidden rework or slow the drift.
const BUILD_PER_WEEK = 4;
const ABSORB_PER_WEEK = 3;

// A single integration revealing at least this fraction of the spec's size
// (in assertion-weeks of rework) renders as a cliff. Modeling choice (Ⓦ):
// the threshold marks "one event dominates the chart," not a real-world
// constant.
const CLIFF_FRACTION = 0.5;

// How long a stale assertion silently corrupts work before its batch is
// revealed: a full week under weekly integration (and under big-bang, every
// week until the one integration finally runs), half a week when integrating
// continuously. Executable contracts bypass the window entirely.
const EXPOSURE_WINDOW = { 'big-bang': 1, weekly: 1, continuous: 0.5 };

/**
 * Advance the spec-gap world by one week. Pure: returns a new state.
 *
 * The week, in order: reality moves; the spec team revises what its budget
 * allows; the team builds against the spec it has; integration, if due,
 * reveals everything hidden; heroics burn down the visible backlog.
 *
 * @param {object} s world state (assembled in runSpecGap)
 * @param {object} p resolved params for the run
 * @param {() => number} rng drift stream — the only consumer of randomness
 * @returns {object} next state; `reveal` is the rework surfaced by this
 *   week's integration (0 when none ran)
 */
function stepWeek(s, p, rng) {
  const week = s.week + 1;

  // 1 — Reality moves. Drift events invalidate 1–3 assertions each,
  // regardless of anything the team does. The draws are unconditional, so
  // the same seed means the same reality under every configuration.
  let drifted = 0;
  const events = Math.floor(p.driftPerWeek) + (rng() < p.driftPerWeek % 1 ? 1 : 0);
  for (let e = 0; e < events; e++) drifted += randInt(rng, 1, 3);
  const newlyStale = Math.min(drifted, s.valid);
  let valid = s.valid - newlyStale;
  let staleHidden = s.staleHidden + newlyStale;
  let staleKnown = s.staleKnown;

  // 2 — The spec team absorbs what it can: revisionBudget assertions per
  // week brought back in line with reality, known gaps first. The spiral
  // condition lives on this line: drift per week > revisions per week.
  let budget = p.revisionBudget;
  const fixedKnown = Math.min(budget, staleKnown);
  staleKnown -= fixedKnown;
  budget -= fixedKnown;
  const fixedHidden = Math.min(budget, staleHidden);
  staleHidden -= fixedHidden;
  valid += fixedKnown + fixedHidden;

  // 3 — The team builds against the spec it has. Every still-hidden stale
  // assertion corrupts the work that touches it this week: one
  // assertion-week of rework each. An executable contract fails the moment
  // that work runs, so the rework lands visible and the assertion is known
  // from then on. Without contracts it lands hidden — and the same
  // assertion will corrupt next week's work too.
  const wipPeak = s.wip + BUILD_PER_WEEK * p.effort;
  let { hiddenRework, visibleRework, backlog } = s;
  if (p.contracts) {
    visibleRework += staleHidden;
    backlog += staleHidden;
    staleKnown += staleHidden;
    staleHidden = 0;
  } else {
    hiddenRework += staleHidden * EXPOSURE_WINDOW[p.cadence];
  }

  // 4 — Integration, when this week has one, reveals the gap: all hidden
  // rework surfaces at once, and the stale assertions behind it are finally
  // known. Under big-bang cadence this block runs exactly once, on the last
  // week — everything above happened out of sight until now.
  const integrates = p.cadence === 'big-bang' ? week === p.weeks : true;
  let reveal = 0;
  if (integrates) {
    reveal = hiddenRework;
    visibleRework += reveal;
    backlog += reveal;
    staleKnown += staleHidden;
    staleHidden = 0;
    hiddenRework = 0;
  }

  // 5 — Heroics burn down the backlog of *visible* rework. This is the only
  // other place effort enters: it redoes what is known to be wrong, faster.
  // It cannot reveal what is hidden and cannot slow the drift, so the cliff
  // (a product of detection latency, not throughput) never feels it.
  backlog = Math.max(0, backlog - ABSORB_PER_WEEK * p.effort);

  // wip is reported at its pre-integration peak — the work in flight this
  // week — then integration consumes it.
  const wip = integrates ? 0 : wipPeak;
  return {
    week,
    valid,
    staleHidden,
    staleKnown,
    hiddenRework,
    visibleRework,
    wip,
    wipPeak,
    backlog,
    reveal,
  };
}

/**
 * Run the planned-spiral world and report what a reader could chart.
 *
 * @param {object} [opts]
 * @param {number} [opts.assertions=24] size of the spec
 * @param {number} [opts.driftPerWeek=1.5] mean drift events per week; each
 *   event invalidates 1–3 assertions
 * @param {'big-bang'|'weekly'|'continuous'} [opts.cadence='big-bang']
 *   integration cadence — how often hidden rework is revealed
 * @param {number} [opts.revisionBudget=1] assertions the spec team can bring
 *   back in line with reality per week
 * @param {boolean} [opts.contracts=false] executable contracts: rework
 *   surfaces the week it happens instead of waiting for integration
 * @param {number} [opts.effort=1] worker effort multiplier. Present,
 *   accepted, and useless against the cliff — see stepWeek, stages 3 and 5.
 * @param {number} [opts.weeks=16] weeks to simulate
 * @param {number} [opts.seed=1]
 * @returns {{ weeks: SpecWeek[], cliff: Cliff | null }} weekly rows, plus the
 *   first integration event large enough to render as a cliff (null when
 *   rework never piled up unseen)
 */
export function runSpecGap({
  assertions = 24,
  driftPerWeek = 1.5,
  cadence = 'big-bang',
  revisionBudget = 1,
  contracts = false,
  effort = 1,
  weeks = 16,
  seed = 1,
} = {}) {
  if (!(cadence in EXPOSURE_WINDOW)) {
    throw new TypeError(`runSpecGap: unknown cadence "${cadence}"`);
  }
  const rng = mulberry32(seed);
  const p = { driftPerWeek, cadence, revisionBudget, contracts, effort, weeks };
  let s = {
    week: 0,
    valid: assertions,
    staleHidden: 0,
    staleKnown: 0,
    hiddenRework: 0,
    visibleRework: 0,
    wip: 0,
    wipPeak: 0,
    backlog: 0,
    reveal: 0,
  };
  const rows = [];
  let cliff = null;
  for (let w = 1; w <= weeks; w++) {
    s = stepWeek(s, p, rng);
    rows.push({
      week: s.week,
      valid: s.valid,
      hiddenRework: s.hiddenRework,
      visibleRework: s.visibleRework,
      wip: s.wipPeak,
      backlog: s.backlog,
    });
    if (cliff === null && s.reveal >= CLIFF_FRACTION * assertions) {
      cliff = { week: s.week, magnitude: s.reveal };
    }
  }
  return { weeks: rows, cliff };
}
