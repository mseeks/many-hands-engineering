// The Triage Deck — Chapter 13's perceptual-learning instrument.
//
// Ten deterministic health-panel traces: the five gauges of §2.12 (variety,
// flow, escalations, signal-outcome correlation, commons cleanliness)
// animating over a compressed fortnight. Two cards per signature —
// healthy, emergent-runaway-forming, planned-stall, hybrid-theatre,
// over-stabilized — across deliberately varied surfaces, each with a
// one-line mechanism tell the feedback argues from. The signature is
// readable at a glance long before it is provable; that is the steward's
// actual working condition.
//
// All gauges read 0..1, higher = healthier reading on that axis
// (escalations is a rate: healthy is low-but-nonzero). Seeded jitter only;
// the shapes are the content.

import { mulberry32, shuffle } from '../rng.js';

export const TRIAGE_LABELS = [
  'healthy',
  'emergent-runaway-forming',
  'planned-stall',
  'hybrid-theatre',
  'over-stabilized',
];

/** Gauge metadata for the panel, in display order. */
export const GAUGES = [
  { id: 'variety', name: 'variety', note: 'different hands solving similar problems differently' },
  { id: 'flow', name: 'flow', note: 'arrivals and completions matching over the window' },
  { id: 'escalations', name: 'escalations', note: 'humans called — rare but real is healthy' },
  {
    id: 'signalOutcome',
    name: 'signal-outcome',
    note: 'internal signals tracking external reality',
  },
  { id: 'commons', name: 'commons', note: 'stale signals pruned, cruft retired' },
];

const DAYS = 14;
const round3 = (x) => Math.round(x * 1000) / 1000;
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** A 14-day series: shape(u) over u in [0,1], plus seeded jitter. */
function series(rng, shape, jitter = 0.03) {
  const out = [];
  for (let d = 0; d < DAYS; d++) {
    const u = d / (DAYS - 1);
    out.push(round3(clamp01(shape(u, d) + (rng() - 0.5) * 2 * jitter)));
  }
  return out;
}

// One generator per signature. Each takes its own rng stream so the two
// cards of a label differ in texture but share the mechanism.
const SIGNATURES = {
  healthy: (rng) => ({
    // Outliers exist, flow holds, somebody still gets paged occasionally.
    variety: series(rng, () => 0.62),
    flow: series(rng, () => 0.72),
    escalations: series(rng, (u, d) => (d % 5 === 3 ? 0.24 : 0.12), 0.02),
    signalOutcome: series(rng, () => 0.85),
    commons: series(rng, () => 0.78),
  }),
  'emergent-runaway-forming': (rng) => ({
    // Throughput holds (rises, even) while variety collapses, the humans
    // stop being called, and internal signals part company with outcomes.
    variety: series(rng, (u) => 0.55 - 0.38 * u),
    flow: series(rng, (u) => 0.65 + 0.22 * u),
    escalations: series(rng, (u) => Math.max(0, 0.15 - 0.32 * u), 0.012),
    signalOutcome: series(rng, (u) => 0.8 - 0.34 * u),
    commons: series(rng, (u) => 0.75 - 0.3 * u),
  }),
  'planned-stall': (rng) => ({
    // WIP piles up: completion sags while everything escalates for judgment.
    variety: series(rng, () => 0.27),
    flow: series(rng, (u) => 0.7 - 0.45 * u),
    escalations: series(rng, (u) => 0.1 + 0.35 * u, 0.02),
    signalOutcome: series(rng, () => 0.7),
    commons: series(rng, (u) => 0.7 - 0.14 * u),
  }),
  'hybrid-theatre': (rng) => ({
    // Every gauge nominal and motionless. Live systems wobble; reports
    // flatline. Only the signal-outcome line drifts, slowly, down.
    variety: series(rng, () => 0.5, 0.006),
    flow: series(rng, () => 0.6, 0.006),
    escalations: series(rng, () => 0.08, 0.005),
    signalOutcome: series(rng, (u) => 0.75 - 0.12 * u, 0.006),
    commons: series(rng, () => 0.7, 0.006),
  }),
  'over-stabilized': (rng) => ({
    // Spotless and rigid. The day-8 disturbance leaves a dent that never
    // re-rounds: stability spent the budget adaptation needed.
    variety: series(rng, (u) => 0.15 - 0.1 * u, 0.012),
    flow: series(rng, (u, d) => (d < 8 ? 0.62 : 0.36), 0.015),
    escalations: series(rng, () => 0.02, 0.008),
    signalOutcome: series(rng, (u, d) => (d < 8 ? 0.8 : 0.58), 0.015),
    commons: series(rng, () => 0.97, 0.008),
  }),
};

// Two surfaces per signature — the Kellman recipe: vary everything except
// the mechanism. Dep bumps deliberately absent.
const CARD_SPECS = [
  {
    id: 'healthy-release-train',
    label: 'healthy',
    surface: 'a mobile release-train platform, six loops, two stewards',
    tell: 'outliers present, flow steady, and somebody still gets paged on day 9; wobble is what alive looks like',
  },
  {
    id: 'healthy-eval-fleet',
    label: 'healthy',
    surface: 'an eval-harness fleet grading model candidates nightly',
    tell: 'escalations rare but real, and eval verdicts still match the sampled human reads',
  },
  {
    id: 'runaway-summary-fleet',
    label: 'emergent-runaway-forming',
    surface: 'a doc-summary fleet that has begun citing its own summaries',
    tell: 'escalations went to zero while throughput held; silence is not health',
  },
  {
    id: 'runaway-ingest',
    label: 'emergent-runaway-forming',
    surface: 'a data-ingest mesh with retry-on-failure at every hop',
    tell: 'variety collapsing while flow rises: every hand converging on the same hot path is reinforcement, not consensus',
  },
  {
    id: 'stall-schema-migration',
    label: 'planned-stall',
    surface: 'a big-bang schema migration, four teams gated on one sign-off',
    tell: 'arrivals kept their pace while completions sagged; the queue is the message',
  },
  {
    id: 'stall-release-office',
    label: 'planned-stall',
    surface: 'a quarterly release program office with a frozen spec',
    tell: 'escalations tripled because nothing fits the plan anymore; the spec is updating slower than reality',
  },
  {
    id: 'theatre-signoff-platform',
    label: 'hybrid-theatre',
    surface: 'a platform with weekly architecture sign-off over async agent merges',
    tell: 'every gauge nominal and motionless for a fortnight; live systems wobble, reports flatline',
  },
  {
    id: 'theatre-feature-store',
    label: 'hybrid-theatre',
    surface: 'a "spec-first" ML feature store whose decision log is all exceptions',
    tell: 'the panel agrees with the org chart, not the decision log — and the signal-outcome line is quietly leaking',
  },
  {
    id: 'stable-payments-core',
    label: 'over-stabilized',
    surface: 'a payments core frozen behind maximum stabilizers',
    tell: 'the day-8 disturbance left a dent that never re-rounded; stability spent the budget adaptation needed',
  },
  {
    id: 'stable-iac-estate',
    label: 'over-stabilized',
    surface: 'a locked-down IaC estate where every change needs three approvals',
    tell: 'a spotless commons and zero escalations with variety on the floor: nothing is learning here',
  },
];

/**
 * Deal the deck: ten cards, two per signature, gauges over a compressed
 * fortnight, in a seed-shuffled order. Deterministic: same seed, same
 * deal, forever.
 * @param {number} seed
 * @returns {{ id: string, label: string, surface: string, days: number,
 *   gauges: { variety: number[], flow: number[], escalations: number[],
 *   signalOutcome: number[], commons: number[] }, tell: string }[]}
 */
export function triageDeck(seed) {
  const cards = CARD_SPECS.map((spec, i) => ({
    id: spec.id,
    label: spec.label,
    surface: spec.surface,
    days: DAYS,
    gauges: SIGNATURES[spec.label](mulberry32(seed * 97 + i * 13 + 1)),
    tell: spec.tell,
  }));
  return shuffle(mulberry32(seed), cards);
}
