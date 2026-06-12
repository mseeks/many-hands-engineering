// econ.js — gate, rate, budget: the economics of approval (§3.6).
//
// One steward, a fixed weekly budget of considered approvals, and a set of
// proposal classes. Each class sits above the gate (every proposal needs a
// considered approval before it commits) or below it (proposals auto-apply
// inside their autonomy envelope; a sampled fraction gets a deep review
// after the fact). The governing inequality:
//
//   gated inflow per week  ≤  budget × (1 − false-approval tolerance)
//
// When sustained inflow exceeds that line, a queue builds and exactly one of
// two pathologies emerges: rubber-stamping (the approval rate inflates while
// deep-review agreement falls) or a stall (WIP piles up at the gate). Both
// are signals, not solutions. The healthy adjustment is structural — move a
// gate — never heroics: the budget is a constant, and this module
// deliberately has no "work harder" parameter.

import { mulberry32 } from './rng.js';

// Even a sound approval draws the occasional dissent on a second look; deep
// review is an instrument with a floor of its own, not an oracle.
const DEEP_REVIEW_DISSENT = 0.02;

/** Clamp a rate into [0, 1]. */
function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/** Round to one decimal — proposal counts here are chart data, not ledgers. */
function round1(x) {
  return Math.round(x * 10) / 10;
}

/** Round to four decimals — enough to keep a 99.7% rate legible. */
function round4(x) {
  return Math.round(x * 1e4) / 1e4;
}

/**
 * A proposal class as the console sees it.
 *
 * `quality` is the true fraction of proposals a deep review would endorse.
 * `plausibility` is how approvable the work LOOKS at gate depth — it
 * defaults to `quality` (an honest signal); set it above `quality` to model
 * a hollow rate, where approvals come easy but the work doesn't survive a
 * second look.
 *
 * @typedef {{ id: string, label: string, inflow: number, quality: number,
 *   gate: 'above'|'below', sampling?: number, plausibility?: number }} EconClass
 */

/**
 * The handbook's §3.6 scenario, as the Gate Console boots it:
 * a 30-approval weekly budget with dependency patches eating 18 of it at a
 * 96% approval rate, plus the new on-call assist loop, a doc-refresh loop,
 * and one curveball.
 *
 * The curveball: quarantining a flaky test always looks right at gate depth
 * (CI goes green), so approvals run at 99.7% — but deep review endorses only
 * ~81%, because some quarantined tests were real regressions. The rate is
 * hollow, and the gate alone cannot tell you that.
 *
 * @returns {EconClass[]} a fresh array each call
 */
export function defaultClasses() {
  return [
    // sampling 0.15 ≈ the handbook's "~3 approvals a week instead of 18"
    // once this class moves below the gate: the sampled slice plus the
    // minor-version bumps that still escalate to the steward.
    {
      id: 'dep-patch',
      label: 'Dependency patches',
      inflow: 18,
      quality: 0.96,
      gate: 'above',
      sampling: 0.15,
    },
    { id: 'oncall-assist', label: 'On-call assist', inflow: 7, quality: 0.88, gate: 'above' },
    { id: 'doc-refresh', label: 'Doc refresh', inflow: 5, quality: 0.93, gate: 'above' },
    {
      id: 'flaky-quarantine',
      label: 'Flaky-test quarantine',
      inflow: 4,
      quality: 0.81,
      plausibility: 0.997,
      gate: 'above',
    },
  ];
}

/** Fill per-class defaults without touching the caller's objects. */
function withDefaults(c) {
  return {
    ...c,
    sampling: c.sampling ?? 0.1,
    plausibility: c.plausibility ?? c.quality,
  };
}

/**
 * Weekly demand for considered approvals: the full inflow of every class
 * above the gate, plus only the sampled slice of every class below it.
 */
function gatedInflowPerWeek(classes) {
  let sum = 0;
  for (const c of classes) {
    sum += c.gate === 'above' ? c.inflow : c.inflow * c.sampling;
  }
  return sum;
}

/**
 * Ⓦ MODELING CHOICE — the rubber-stamp drift function.
 *
 * Nobody has measured how fast a saturated steward's bar erodes. This is the
 * author's bet, drawn: a linear creep per saturated week, steeper the worse
 * the overload, capped well short of total blindness. The DIRECTION is the
 * handbook's claim — under sustained saturation the approval rate inflates
 * while deep-review agreement falls — but the slope and the cap are invented
 * so the divergence is visible inside a 12-week chart.
 *
 * @param {number} drift current inflation added to every approval probability
 * @param {number} overload demand ÷ careful-review capacity (> 1 when saturated)
 * @returns {number} next week's drift
 */
export function rubberStampDrift(drift, overload) {
  const creep = 0.02 + 0.03 * Math.min(1, overload - 1);
  return Math.min(0.3, drift + creep);
}

/**
 * Run the approval economy for a number of weeks.
 *
 * @param {object} opts
 * @param {EconClass[]} [opts.classes] defaults to the handbook scenario
 * @param {number} [opts.budget=30] considered approvals per week — the constant
 * @param {number} [opts.weeks=12]
 * @param {number} opts.seed
 * @param {number} [opts.tolerance=0.05] false-approval tolerance in the inequality
 * @returns {{ weeks: EconWeek[],
 *   inequality: { lhs: number, rhs: number, ok: boolean },
 *   pathology: 'rubber-stamp'|'stall'|null }}
 *
 * Each EconWeek is
 * `{ week, perClass, queue, approvalRate, deepReviewAgreement, wip,
 *    budgetSpent, upstreamFree }` where:
 * - `perClass` rows are `{ id, gated, approved, autoApplied, queued, rate,
 *   agreement }` — `gated` counts considered reviews performed this week
 *   (sampled deep reviews, for a below-gate class), `queued` is that class's
 *   standing backlog at week's end, `rate` is the gate-depth approval
 *   probability, and `agreement` is what deep review endorses of the work
 *   that lands.
 * - `queue` is the week's overflow: demand that arrived and went unreviewed.
 * - `wip` is the standing backlog at the gates — the stall pathology's stock.
 * - `approvalRate` / `deepReviewAgreement` are the divergence chart; either
 *   is null on a week with nothing to measure.
 * - `upstreamFree` is budget left for terrain work after the week's demand.
 */
export function simulateWeeks({
  classes = defaultClasses(),
  budget = 30,
  weeks = 12,
  seed,
  tolerance = 0.05,
}) {
  const rng = mulberry32(seed);
  const cs = classes.map(withDefaults);

  // The governing inequality. It is a property of the terrain — where the
  // gates sit — so it holds or fails for the whole run, not week by week.
  const lhs = round1(gatedInflowPerWeek(cs));
  const rhs = round1(budget * (1 - tolerance));
  const inequality = { lhs, rhs, ok: lhs <= rhs };

  // Careful-review capacity: the budget minus the false-approval margin.
  // The margin is what pays for saying no — rejections, re-checks.
  const capacity = budget * (1 - tolerance);

  // A sustained breach produces exactly one pathology. Which one is the
  // steward's temperament under pressure — modeled as a coin flip fixed by
  // the seed, so a given run always breaks the same way.
  const pathology = inequality.ok ? null : rng() < 0.5 ? 'rubber-stamp' : 'stall';

  const backlog = new Map(cs.map((c) => [c.id, 0]));
  let drift = 0; // rubber-stamp inflation on every approval probability
  const weekRows = [];

  for (let week = 1; week <= weeks; week++) {
    // 1. Demand for considered approvals: gated inflow plus any standing
    //    backlog, plus the sampled deep reviews owed to below-gate classes.
    const demands = cs.map((c) =>
      c.gate === 'above' ? c.inflow + backlog.get(c.id) : c.inflow * c.sampling,
    );
    const demand = demands.reduce((a, b) => a + b, 0);

    // 2. Throughput. A rubber-stamping steward "keeps up" by reviewing
    //    everything shallowly; every other steward reviews at most
    //    `capacity` and lets the rest wait. There is deliberately no
    //    overtime branch here: the budget is the constant.
    let reviewedShare;
    if (pathology === 'rubber-stamp') {
      drift = rubberStampDrift(drift, demand / capacity);
      reviewedShare = 1;
    } else {
      reviewedShare = demand > 0 ? Math.min(1, capacity / demand) : 1;
    }

    // 3. Walk the classes: approvals, auto-applies, backlog carry, and the
    //    agreement mass the triangulation panel reads.
    let gatedReviewed = 0;
    let gatedApproved = 0;
    let landed = 0;
    let agreementMass = 0;

    const perClass = cs.map((c, i) => {
      const reviewed = demands[i] * reviewedShare;
      // What a gate-depth review approves: surface plausibility, inflated
      // by any rubber-stamp drift.
      const approveProb = Math.min(1, c.plausibility + drift);
      // What a deep review endorses of the work that lands: the shallower
      // the bar that let it through, the less survives a second look.
      const landProb = c.gate === 'above' ? approveProb : 1;
      const agreement = clamp01(clamp01(c.quality / landProb) - DEEP_REVIEW_DISSENT);

      if (c.gate === 'above') {
        const approved = reviewed * approveProb;
        const queued = demands[i] - reviewed;
        backlog.set(c.id, queued);
        gatedReviewed += reviewed;
        gatedApproved += approved;
        landed += approved;
        agreementMass += approved * agreement;
        return {
          id: c.id,
          gated: round1(reviewed),
          approved: round1(approved),
          autoApplied: 0,
          queued: round1(queued),
          rate: round4(approveProb),
          agreement: round4(agreement),
        };
      }

      // Below the gate everything auto-applies; `reviewed` here is the
      // sampled deep-review slice, and `approved` the audits it endorsed.
      landed += c.inflow;
      agreementMass += c.inflow * agreement;
      return {
        id: c.id,
        gated: round1(reviewed),
        approved: round1(reviewed * agreement),
        autoApplied: round1(c.inflow),
        queued: 0,
        rate: round4(approveProb),
        agreement: round4(agreement),
      };
    });

    // 4. Week aggregates. The wobble is presentation-grade noise so flat
    //    series read as measured, not painted; it never moves a conclusion.
    const wobbleRate = (rng() - 0.5) * 0.006;
    const wobbleAgree = (rng() - 0.5) * 0.01;
    const wip = [...backlog.values()].reduce((a, b) => a + b, 0);

    weekRows.push({
      week,
      perClass,
      queue: round1(demand * (1 - reviewedShare)),
      approvalRate:
        gatedReviewed > 0 ? round4(clamp01(gatedApproved / gatedReviewed + wobbleRate)) : null,
      deepReviewAgreement:
        landed > 0 ? round4(clamp01(agreementMass / landed + wobbleAgree)) : null,
      wip: round1(wip),
      budgetSpent: round1(Math.min(demand, pathology === 'rubber-stamp' ? budget : capacity)),
      upstreamFree: round1(Math.max(0, budget - demand)),
    });
  }

  return { weeks: weekRows, inequality, pathology };
}

/**
 * Move one class's gate. Returns a new array; never mutates the input.
 * Unknown ids return an equivalent copy — moving nothing is not an error.
 *
 * @param {EconClass[]} classes
 * @param {string} id
 * @param {'above'|'below'} to
 * @returns {EconClass[]}
 */
export function moveGate(classes, id, to) {
  return classes.map((c) => (c.id === id ? { ...c, gate: to } : c));
}
