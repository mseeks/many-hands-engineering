// SignalField.jsx — LAB 08·A "The signal field" (Ch 8 · Signal physics, covers §2.1 + §2.8).
//
// Mechanism register: every frame here is the field engine's real dynamics,
// re-simulated from a pinned seed. One field, four guided tasks, each task
// freezing all but ONE knob: form a gradient (spread), saturate it to noise
// (decay → 0), lock onto a wrong-first path (reinforce, on the test suite's
// doctored field), and find the phase boundary (reinforce over frozen decay).
// Each task takes a committed prediction before its controls open. Free play
// (all four rates + the outside-reference toggle) sits last, clearly optional.
//
// Moving a knob re-simulates the whole run from tick 0 — the reader compares
// terrains; nothing here steers an agent mid-flight (the terrain law).
// Every number quoted in the feedback is computed below from the same engine
// the grid renders, so the copy cannot go stale against the physics.

import { useEffect, useMemo, useState } from 'react';
import { Badge, Commit, LabFrame, Mark, glassSlice } from '../components/kit.jsx';
import { usePrefersReducedMotion } from '../shared/usePrefersReducedMotion.js';
import { fieldMetrics, makeField, stepField } from '../engine/field.js';
import { mulberry32 } from '../engine/rng.js';
import fieldSrc from '../engine/field.js?raw';

/* ── Engine plumbing (orchestration only; the physics is all field.js) ──── */

const SEED = 8;
const N = 12;
const HEAT_CAP = 4; // mirrors the engine's SIGNAL_CAP (receptor saturation) — see the glass
const STEP_TICKS = 5;

const sumSignal = (field) => field.nodes.reduce((a, n) => a + n.signal, 0);

/** Walk the field `horizon` ticks from `start`, recording every frame. */
function simulate(start, params, horizon, walkSeed) {
  const rng = mulberry32(walkSeed);
  const frames = [start];
  const totals = [sumSignal(start)];
  let f = start;
  for (let t = 0; t < horizon; t++) {
    f = stepField(f, params, rng);
    frames.push(f);
    totals.push(sumSignal(f));
  }
  return { frames, totals };
}

/**
 * Task 3's doctored start ○ — the exact scenario the engine's test suite
 * pins: yesterday's heat (1.5) planted on the one region CI passes 1 job in
 * 20, with eleven dim (0.005), good (0.90) regions around it.
 */
function wrongFirstField() {
  const field = makeField({ nodes: N, seed: 3 });
  for (const node of field.nodes) {
    node.signal = 0.005;
    node.quality = 0.9;
  }
  field.nodes[0].signal = 1.5;
  field.nodes[0].quality = 0.05;
  return field;
}

/* ── The canonical runs, computed once (the copy quotes these) ──────────── */

const T1_FROZEN = { decay: 0.1, reinforce: 0.5, explore: 0.1, outsideRef: true };
const T1_HORIZON = 160;

const T1_END = simulate(
  makeField({ nodes: N, seed: SEED }),
  { ...T1_FROZEN, spread: 0.06 },
  T1_HORIZON,
  SEED,
).frames.at(-1);
const T1_BY_BRIGHT = [...T1_END.nodes].sort((a, b) => b.signal - a.signal);
const meanQ = (nodes) => nodes.reduce((a, n) => a + n.quality, 0) / nodes.length;
const BRIGHT4 = T1_BY_BRIGHT.slice(0, 4);
const BRIGHT_Q = meanQ(BRIGHT4).toFixed(2);
const REST_Q = meanQ(T1_BY_BRIGHT.slice(4)).toFixed(2);
const BRIGHT4_NAMES = BRIGHT4.map((n) => n.name).join(' ');
// The two honest warts in the canonical gradient: the best region the field
// never sampled, and the lucky streak decay hasn't finished burning down.
const MISSED = [...T1_BY_BRIGHT]
  .filter((n) => n.signal < 0.1)
  .sort((a, b) => b.quality - a.quality)[0];
const FALSE_FRIEND = [...T1_BY_BRIGHT]
  .filter((n) => n.signal > 0.5)
  .sort((a, b) => a.quality - b.quality)[0];
const SPREAD0_END = simulate(
  makeField({ nodes: N, seed: SEED }),
  { ...T1_FROZEN, spread: 0 },
  T1_HORIZON,
  SEED,
).frames.at(-1);
const SPREAD0_WINNER = SPREAD0_END.nodes.reduce((a, b) => (b.signal > a.signal ? b : a));
const SPREADHI_S2N = fieldMetrics(
  simulate(
    makeField({ nodes: N, seed: SEED }),
    { ...T1_FROZEN, spread: 0.3 },
    T1_HORIZON,
    SEED,
  ).frames.at(-1),
).signalToNoise.toFixed(2);

const T2_FROZEN = { spread: 0.06, reinforce: 0.5, explore: 0.1, outsideRef: true };
const T2_HORIZON = 240;

const T2_SAT = simulate(
  makeField({ nodes: N, seed: SEED }),
  { ...T2_FROZEN, decay: 0 },
  T2_HORIZON,
  SEED,
);
const T2_SAT_M = fieldMetrics(T2_SAT.frames.at(-1));
const SAT_TOTAL = T2_SAT.totals.at(-1).toFixed(1);
const SAT_S2N = T2_SAT_M.signalToNoise.toFixed(2);
const SAT_VARIETY = T2_SAT_M.variety.toFixed(2);
const SAT_TICK = T2_SAT.totals.findIndex((v) => v >= 47.5);
const HEALTHY_S2N = fieldMetrics(
  simulate(
    makeField({ nodes: N, seed: SEED }),
    { ...T2_FROZEN, decay: 0.1 },
    T2_HORIZON,
    SEED,
  ).frames.at(-1),
).signalToNoise.toFixed(1);

const T3_FROZEN = { spread: 0, decay: 0.1, explore: 0.02, outsideRef: true };
const T3_HORIZON = 300;
const T3_WALK_SEED = 17; // test-suite parity: same field, same walk

const T3_HOT = simulate(
  wrongFirstField(),
  { ...T3_FROZEN, reinforce: 2.0 },
  T3_HORIZON,
  T3_WALK_SEED,
);
const CAP_TICK = T3_HOT.frames.findIndex((f) => f.nodes[0].signal >= 3.99);
const T3_LOW = simulate(
  wrongFirstField(),
  { ...T3_FROZEN, reinforce: 0.35 },
  T3_HORIZON,
  T3_WALK_SEED,
);
const UNLOCK_TICK = T3_LOW.frames.findIndex((f) => !fieldMetrics(f).lockIn);
const T3_LOW_TOTAL = T3_LOW.totals.at(-1).toFixed(3);

const T4_FROZEN = { spread: 0.06, decay: 0.15, explore: 0.1, outsideRef: true };
const T4_HORIZON = 240;

const t4End = (reinforce) =>
  simulate(makeField({ nodes: N, seed: SEED }), { ...T4_FROZEN, reinforce }, T4_HORIZON, SEED);
// Scan the dial upward for the smallest notch where the field still forms.
let critDial = 0.6;
for (let k = 5; k <= 60; k++) {
  if (t4End(k / 100).totals.at(-1) > 0.5) {
    critDial = k / 100;
    break;
  }
}
const CRIT = critDial.toFixed(2);
const CRIT_BELOW = (critDial - 0.01).toFixed(2);
const T4_CRIT_RUN = t4End(critDial);
const T4_TOTAL_CRIT = T4_CRIT_RUN.totals.at(-1).toFixed(1);
const T4_GAIN_CRIT = fieldMetrics(T4_CRIT_RUN.frames.at(-1)).gain.toFixed(2);
const T4_TOTAL_BELOW = t4End(critDial - 0.01)
  .totals.at(-1)
  .toFixed(1);
const T4_TOTAL_020 = t4End(0.2).totals.at(-1).toFixed(1);
const T4_TOTAL_030 = t4End(0.3).totals.at(-1).toFixed(1);
const NOTCHES_ABOVE = Math.round((0.5 - critDial) / 0.01); // the walk from 0.50 down to the cliff

/* ── The glass ──────────────────────────────────────────────────────────── */

const GLASS = [
  glassSlice(fieldSrc, 'export function stepField', '\n}'),
  glassSlice(fieldSrc, 'function expectedGain', '\n}'),
  glassSlice(fieldSrc, 'export function fieldMetrics', '\n}'),
].join('\n\n// ── and ──\n\n');

/* ── Task definitions ───────────────────────────────────────────────────── */

const TASKS = [
  {
    id: 'gradient',
    chip: '1 · form a gradient',
    horizon: T1_HORIZON,
    walkSeed: SEED,
    start: () => makeField({ nodes: N, seed: SEED }),
    frozen: { ...T1_FROZEN },
    knob: {
      key: 'spread',
      min: 0,
      max: 0.3,
      step: 0.01,
      init: 0.06,
      label: 'spread · leak to ring neighbors per tick',
    },
    frozenLine: 'frozen — decay 0.10 · reinforce 0.50 · explore 0.10 · outside reference intact',
    yMax: 24,
    entryAtEnd: true,
    scene:
      "Tick 0: twelve regions, heat nearly even, no router anywhere. By tick 160 the field has opinions about where tomorrow's work belongs. The question is whose opinions they are.",
  },
  {
    id: 'saturate',
    chip: '2 · saturate to noise',
    horizon: T2_HORIZON,
    walkSeed: SEED,
    start: () => makeField({ nodes: N, seed: SEED }),
    frozen: { ...T2_FROZEN },
    knob: {
      key: 'decay',
      min: 0,
      max: 0.2,
      step: 0.01,
      init: 0.1,
      label: 'decay · fraction of all signal that fades per tick',
    },
    frozenLine: 'frozen — spread 0.06 · reinforce 0.50 · explore 0.10 · outside reference intact',
    yMax: 50,
    entryAtEnd: true,
    scene:
      'Decay is the only way signal leaves this field — one subtraction line in the glass. The knob in front of you goes to zero.',
  },
  {
    id: 'lockin',
    chip: '3 · wrong-first lock',
    horizon: T3_HORIZON,
    walkSeed: T3_WALK_SEED,
    start: wrongFirstField,
    frozen: { ...T3_FROZEN },
    knob: {
      key: 'reinforce',
      min: 0.2,
      max: 2.4,
      step: 0.05,
      init: 2.0,
      label: 'reinforce · deposit per unit of existing trail',
    },
    frozenLine: 'frozen — spread 0.00 · decay 0.10 · explore 0.02 · outside reference intact',
    yMax: 6,
    entryAtEnd: false,
    scene:
      "Yesterday's heat sits on delivery/ (signal 1.5), and CI passes 1 job in 20 there. The other eleven regions are good (quality 0.90) and dim (0.005). Spread is off, the exploration floor is 0.02, and reinforcement is parked at 2.0.",
  },
  {
    id: 'boundary',
    chip: '4 · phase boundary',
    horizon: T4_HORIZON,
    walkSeed: SEED,
    start: () => makeField({ nodes: N, seed: SEED }),
    frozen: { ...T4_FROZEN },
    knob: {
      key: 'reinforce',
      min: 0.05,
      max: 0.6,
      step: 0.01,
      init: 0.5,
      label: 'reinforce · the dial, one notch at a time',
    },
    frozenLine: 'frozen — spread 0.06 · decay 0.15 · explore 0.10 · outside reference intact',
    yMax: 20,
    entryAtEnd: true,
    scene:
      'Same dim start as task 1, decay frozen at 0.15. At 0.50 the field organizes. Somewhere below, it stops being able to. The dial moves in notches of 0.01.',
  },
];

const TASK_BY_ID = Object.fromEntries(TASKS.map((t) => [t.id, t]));

const SANDBOX_TASK = {
  id: 'sandbox',
  horizon: 240,
  walkSeed: SEED,
  start: () => makeField({ nodes: N, seed: SEED }),
  yMax: 50,
};

/* ── Commit prompts, options, and argued feedback ───────────────────────── */

const COMMITS = {
  gradient: {
    prompt:
      'Reset this field to tick 0 and run 160 ticks at the frozen rates. Nobody assigns anything. What ranks the twelve regions?',
    options: [
      { id: 'luck', label: 'Early luck — whichever regions caught the first picks stay bright' },
      {
        id: 'truth',
        label: 'Hidden quality — work that survives CI becomes heat; decay prunes the rest',
      },
      { id: 'planner', label: 'Nothing durable — without a router, near-even stays near-even' },
    ],
    feedback: {
      luck: (
        <>
          Half right, and the half matters. Luck holds seats on this board: {FALSE_FRIEND.name}{' '}
          passes almost nothing (quality {FALSE_FRIEND.quality.toFixed(2)}) and still ends warm at{' '}
          {FALSE_FRIEND.signal.toFixed(2)}, while {MISSED.name} — the best region on the field,
          quality {MISSED.quality.toFixed(2)} — sits dark at {MISSED.signal.toFixed(2)} because the
          four workers almost never wandered there. But the bright four still average {BRIGHT_Q}{' '}
          quality against {REST_Q} for the rest, because decay at 0.10 prunes most lucky streaks
          before reinforcement can compound them. Quality loads the dice through the outside
          reference; the picks still roll them.
        </>
      ),
      truth: (
        <>
          The engine mostly agrees: the bright four ({BRIGHT4_NAMES}) average {BRIGHT_Q} quality;
          the dark eight average {REST_Q}. The mechanism is three lines of the glass — a deposit
          lands only when work holds up under CI (probability: the region's hidden quality), it
          scales with the trail already there, and decay takes 10% of everything each tick. Two
          honest warts before you trust any gradient: {MISSED.name} (quality{' '}
          {MISSED.quality.toFixed(2)}) is dark because the field never sampled it, and{' '}
          {FALSE_FRIEND.name} (quality {FALSE_FRIEND.quality.toFixed(2)}) is warm on a streak decay
          hasn't finished burning down. A gradient is a record of sampled outcomes, not an audit of
          the terrain.
        </>
      ),
      planner: (
        <>
          Run it and trace any bright tile backward, the Chapter 3 way: every hop is a READ of heat
          or a WRITE of a deposit, and there is no router anywhere in the glass. The ranking arrives
          regardless — bright four at {BRIGHT_Q} mean quality, the rest at {REST_Q} — because
          near-even is unstable here. Work that holds up gets reinforced, reinforcement biases the
          next pick, and the loop closes through the terrain. The field will rank regions whether or
          not anyone is driving; the rates decide how well.
        </>
      ),
    },
    direction: (
      <>
        Run it from tick 0, then work the one freed knob. At spread 0, neighbors inherit nothing and
        the field collapses onto {SPREAD0_WINNER.name} — the lock-in detector trips. At 0.30 the
        gradient blurs toward even (signal-to-noise {SPREADHI_S2N}). The gradient lives between
        those two failures, and the terrain is what holds it there.
      </>
    ),
  },
  saturate: {
    prompt:
      'Freeze everything else, drag decay to zero, and run 240 ticks. The field never forgets anything. What does it know at the end?',
    options: [
      { id: 'sharper', label: 'Sharper — more signal means a crisper ranking' },
      {
        id: 'noise',
        label: 'Uniform glare — everything climbs to the cap; the ranking disappears',
      },
      { id: 'lock', label: 'Lock-in — the early leader compounds and takes the field' },
    ],
    feedback: {
      sharper: (
        <>
          More signal arrived; less information survived. Watch the number the workers actually
          navigate by, signal-to-noise — (max − mean) / mean: it falls from about {HEALTHY_S2N} at
          decay 0.10 to {SAT_S2N} as every region, wrong ones included, drifts up to the receptor
          cap of 4. Total signal ends at {SAT_TOTAL}: twelve regions times the cap, a field that
          says everything everywhere is excellent, which is to say nothing. The contrast was the
          information, and decay was what paid for contrast.
        </>
      ),
      noise: (
        <>
          That is what the engine draws. By tick ~{SAT_TICK} total signal sits at {SAT_TOTAL}{' '}
          (twelve regions × the cap of 4), variety reads {SAT_VARIETY}, and signal-to-noise reads{' '}
          {SAT_S2N}. The handbook's line runs verbatim here: decay too slow and signals saturate
          into noise. The cap is receptor saturation — past 4, brighter tells no one anything — so a
          field that never forgets converges on uniform, maximal, useless confidence.
        </>
      ),
      lock: (
        <>
          Lock-in is the opposite failure with the same root. A lock needs concentration — one
          region holding over 60% of all signal — which takes reinforcement outrunning decay on one
          trail while decay still drains the others. Kill decay and nothing drains: the leader hits
          the cap first and then waits while every other region climbs to the same ceiling. The
          detector reads share, and a twelfth each is no lock at all. You traded a sharp lie for
          total fog; both start with losing decay.
        </>
      ),
    },
    direction: (
      <>
        Drag decay to 0.00 and run. Watch signal-to-noise on the way up, then walk decay back to
        0.10 and watch the field become legible again. Forgetting is not a defect of the field; it
        is what the field's legibility is made of.
      </>
    ),
  },
  lockin: {
    prompt: 'Run 300 ticks at reinforcement 2.0. Who owns the field at the end?',
    options: [
      {
        id: 'truth',
        label: 'CI burns it down — 19 of 20 deposits refused, the heat drains, truth re-ranks',
      },
      {
        id: 'lie',
        label: 'The lie holds — the few deposits that land scale with the heat already there',
      },
      {
        id: 'parity',
        label: 'It washes out — the wrong region fades to the level of the good ones',
      },
    ],
    feedback: {
      truth: (
        <>
          CI did everything you hired it to do — 19 deposits in 20 refused — and still lost, because
          the outside reference gates deposits; it cannot reclaim heat. Only decay reclaims heat.
          The one success in twenty deposits 2.0 × the trail already there, so delivery/ takes in
          about 4 picks × 0.05 × 2.0 = 0.40 per unit of signal per tick against decay's 0.10 out:
          reinforcement outran decay, fourfold, with the oracle intact the whole time. delivery/
          pins the cap at tick {CAP_TICK} and the detector never unlatches.
        </>
      ),
      lie: (
        <>
          That is the run. By tick {CAP_TICK} delivery/ is pinned at the cap, and the lock-in
          detector stays tripped through tick 300 with the whole diagnosis in its reading:
          reinforcement outran decay. The arithmetic: deposits scale with existing trail, so
          delivery/ takes in about 4 picks × 0.05 × 2.0 = 0.40 per unit of signal per tick against
          0.10 of decay, while the good regions' deposits scale with 0.005 — they never get to bid.
          First heat plus a hot dial beats truth, with CI watching.
        </>
      ),
      parity: (
        <>
          Parity would need the leader to fall while the others rise, and both rates hang off the
          same dial. At 2.0 the leader's inflow (~0.40 per unit of signal per tick) beats decay's
          0.10, so it rises to the cap; the good regions' deposits scale with their 0.005 of trail,
          under an exploration floor of 0.02, so they cannot grow into the gap. This terrain has two
          attractors — locked and dark — and parity is the unstable ridge between them.
        </>
      ),
    },
    direction: (
      <>
        Run it at 2.0 and watch the detector trip. Then hunt down the dial for where the lock
        breaks: at 0.35 the detector unlatches near tick {UNLOCK_TICK} — and nothing takes the field
        back. Total signal {T3_LOW_TOTAL}: dark. On this terrain (no spread, floor at 0.02), weaker
        reinforcement breaks the lock but never re-ranks the field. Re-ranking takes variety, and
        Chapter 9 hands you that palette.
      </>
    ),
  },
  boundary: {
    prompt:
      'Walk the dial down from 0.50 toward 0.05, re-running as you go. What do you meet on the way down?',
    options: [
      { id: 'smooth', label: 'Proportional dimming — half the reinforcement, half the glow' },
      {
        id: 'cliff',
        label: 'A cliff — little changes until one notch, past which the field cannot form',
      },
      {
        id: 'flicker',
        label: 'Flicker — near the bottom it alternates between organized and dark',
      },
    ],
    feedback: {
      smooth: (
        <>
          Proportional is the planner's read of a self-reinforcing system. The engine: end-of-run
          total at 0.30 is {T4_TOTAL_030}, at 0.20 it's {T4_TOTAL_020}, at {CRIT} it's{' '}
          {T4_TOTAL_CRIT} — {NOTCHES_ABOVE} notches that bought almost nothing — and at {CRIT_BELOW}{' '}
          it is {T4_TOTAL_BELOW}. The dial is not a dimmer; it sets the loop gain, expected
          reinforcement in over decay out. Above 1 perturbations grow until the cap catches them;
          below 1 they die. Positive feedback produces phase transitions, so crossing the line is a
          regime change, not a dimming.
        </>
      ),
      cliff: (
        <>
          Found it the engine's way. On this terrain the boundary sits between {CRIT_BELOW} and{' '}
          {CRIT}: at {CRIT} the field organizes (total {T4_TOTAL_CRIT}, gain ending {T4_GAIN_CRIT});
          one notch down, every perturbation dies (total {T4_TOTAL_BELOW}, gain under 1 all the way
          to dark). Below the critical value perturbations die; above it they grow until saturation
          catches them. Discontinuity is the default in self-reinforcing systems — one more notch,
          one more agent, can change everything.
        </>
      ),
      flicker: (
        <>
          Not here: pinned seed, pinned dial, so the same notch draws the same field forever, and
          what flips at {CRIT} is a threshold, not noise. But your instinct is pointing at something
          real that this bench cannot show: a live terrain near its critical value does flicker,
          because demand and luck wobble the effective gain back and forth across the line. The
          model notes own that gap. What this run gives you is smaller and solid: the line exists,
          and it is one notch wide.
        </>
      ),
    },
    direction: (
      <>
        Park the playhead on the last tick with the scrubber, then walk the dial down one notch at a
        time and watch total signal and the gain readout. Find the notch where the field stops being
        possible.
      </>
    ),
  },
};

/* ── Presentation pieces ────────────────────────────────────────────────── */

function FieldGrid({ field, lockIn, showTruth }) {
  const total = sumSignal(field);
  const brightest = field.nodes.reduce((a, b) => (b.signal > a.signal ? b : a));
  const summary =
    `Signal field at tick ${field.tick}: brightest region ${brightest.name} at ` +
    `${brightest.signal.toFixed(2)} of cap 4, total signal ${total.toFixed(1)}, ` +
    (lockIn ? 'lock-in tripped — reinforcement outran decay.' : 'no lock-in.') +
    (showTruth ? '' : ' Ground-truth bars hidden: the outside reference is severed.');
  return (
    <div role="img" aria-label={summary} style={{ margin: '10px 0 4px' }}>
      <div
        aria-hidden="true"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(82px, 1fr))',
          gap: 5,
        }}
      >
        {field.nodes.map((n) => {
          const heat = Math.min(1, n.signal / HEAT_CAP);
          const hot = heat >= 0.5;
          const locked = lockIn && n.id === brightest.id;
          return (
            <div
              key={n.id}
              style={{
                borderRadius: 3,
                border: '1px solid var(--line-soft)',
                boxShadow: locked ? 'inset 0 0 0 2px var(--red)' : 'none',
                background: `color-mix(in srgb, var(--amber) ${Math.round(heat * 72)}%, var(--paper-3))`,
                padding: '7px 8px 6px',
                display: 'grid',
                gap: 2,
              }}
            >
              <span
                className="mono"
                style={{ fontSize: 10, color: hot ? 'var(--paper)' : 'var(--ink-faint)' }}
              >
                {n.name}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: hot ? 'var(--paper)' : 'var(--ink)',
                }}
              >
                {n.signal.toFixed(2)}
              </span>
              {showTruth ? (
                <span
                  style={{
                    display: 'block',
                    height: 3,
                    borderRadius: 2,
                    background: 'var(--line-soft)',
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      height: '100%',
                      width: `${Math.round(n.quality * 100)}%`,
                      background: 'var(--accent)',
                    }}
                  />
                </span>
              ) : (
                <span style={{ display: 'block', height: 3 }} />
              )}
            </div>
          );
        })}
      </div>
      <p
        className="mono"
        style={{ fontSize: '10.5px', color: 'var(--ink-faint)', margin: '6px 0 0' }}
      >
        tile fill — signal (heat, cap 4) · green underbar — hidden ground truth (CI pass rate)
        {showTruth ? '' : ' · severed: bars hidden'} · spread leaks to ring neighbors in tile order,
        wrapping
      </p>
    </div>
  );
}

function Readouts({ metrics, total, maxSignal }) {
  const residue = metrics.lockIn && total < 0.05;
  const capHeld = metrics.gain > 1.05 && maxSignal >= 3.95;
  const gainWord =
    metrics.gain < 0.95
      ? 'dying'
      : metrics.gain <= 1.05
        ? 'marginal'
        : capHeld
          ? 'diverging · cap-held'
          : 'diverging';
  const s2nClass =
    metrics.signalToNoise < 0.3 ? 'bad' : metrics.signalToNoise < 1 ? 'warn' : 'good';
  return (
    <div className="mh-readout">
      <div className="mh-stat">
        <span className="k">Variety index</span>
        <span className="v">{metrics.variety.toFixed(2)}</span>
      </div>
      <div className="mh-stat">
        <span className="k">Signal-to-noise</span>
        <span className={`v ${s2nClass}`}>{metrics.signalToNoise.toFixed(2)}</span>
      </div>
      <div className="mh-stat">
        <span className="k">Lock-in detector</span>
        <span className={metrics.lockIn ? 'v bad' : 'v good'} style={{ fontSize: 13 }}>
          {metrics.lockIn
            ? `reinforcement outran decay${residue ? ' · on residue (dark field)' : ''}`
            : 'clear'}
        </span>
      </div>
      <div className="mh-stat">
        <span className="k">Loop gain · pre-cap</span>
        <span className="v" style={{ fontSize: 13 }}>
          {metrics.gain.toFixed(2)} · {gainWord}
        </span>
      </div>
      <div className="mh-stat">
        <span className="k">Total signal</span>
        <span className="v">{total.toFixed(1)}</span>
      </div>
    </div>
  );
}

function Sparkline({ totals, playhead, yMax }) {
  const W = 320;
  const H = 44;
  const n = totals.length;
  const x = (i) => (i / (n - 1)) * W;
  const y = (v) => H - 4 - Math.min(1, v / yMax) * (H - 8);
  const points = totals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const i = Math.min(playhead, n - 1);
  const label =
    `Total signal over the run: starts at ${totals[0].toFixed(1)}, ` +
    `ends at ${totals[n - 1].toFixed(1)}, on a scale to ${yMax}.`;
  return (
    <figure style={{ margin: '4px 0 0' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <line x1="0" x2={W} y1={y(0)} y2={y(0)} stroke="var(--line-soft)" strokeWidth="1" />
        <polyline points={points} fill="none" stroke="var(--blue)" strokeWidth="1.5" />
        <line x1={x(i)} x2={x(i)} y1="2" y2={H - 2} stroke="var(--ink-faint)" strokeWidth="1" />
        <circle cx={x(i)} cy={y(totals[i])} r="2.5" fill="var(--blue)" />
      </svg>
      <figcaption className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-faint)' }}>
        total signal over the run · playhead at tick {i}
      </figcaption>
    </figure>
  );
}

function KnobSlider({ id, label, min, max, step, value, disabled, onChange, lockedNote }) {
  return (
    <div className="mh-slider" style={{ flex: '1 1 240px', maxWidth: 360 }}>
      <label htmlFor={id}>
        <span>{label}</span>
        <span className={disabled ? 'locked' : undefined}>
          {disabled ? `${lockedNote} · ${value.toFixed(2)}` : value.toFixed(2)}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${value.toFixed(2)}`}
      />
    </div>
  );
}

/* ── Frame copy ─────────────────────────────────────────────────────────── */

const QUESTION =
  'Four workers a tick follow the heat across twelve repo regions. Three rates — spread, decay, ' +
  'reinforcement — decide what the field knows. Which rate slipping turns a working gradient into ' +
  'glare, a lie, or a dead field?';

const PAYOFF = (
  <>
    Three rates determine everything. Balanced (spread 0.06, decay 0.10, reinforcement 0.50), twelve
    dim regions sort themselves into a working gradient with no router anywhere: the bright four
    average {BRIGHT_Q} CI pass rate against {REST_Q} for the rest. Kill decay and the field
    saturates into noise — all twelve regions pinned at the cap by tick ~{SAT_TICK}, signal-to-noise{' '}
    {SAT_S2N}. Put reinforcement 2.0 over decay 0.10 and a region that CI fails 19 times in 20 owns
    the field from tick {CAP_TICK} on: reinforcement outran decay. And between the dead field and
    the lit one there is no ramp — on this terrain the flip sits between {CRIT_BELOW} and {CRIT},
    one notch wide.{' '}
    <Badge
      layer="E"
      note="the saturation and divergence results are real mathematics (reaction–diffusion, branching processes); the bridge from this toy field to a repo terrain is informal — Act V holds the math honestly"
    />{' '}
    The dynamics are real; where the thresholds sit on your terrain is not a number this bench can
    give you.
  </>
);

const NOTES = [
  "Twelve regions on a ring: spread leaks each region's signal to the two tiles beside it in reading order, wrapping at the ends. Real repo graphs are not rings; the ring keeps adjacency small and honest.",
  'Tuned constants, chosen so each regime is findable in minutes: four workers a tick, deposits scale with the trail already there, receptor cap at 4, seed 8 throughout. Nothing was measured from a real fleet.',
  "Task 3's start is constructed for teaching: yesterday's heat (1.5) planted on a region CI passes 1 job in 20 — the exact field, walk seed included, that the engine's test suite pins.",
  'Hidden quality is one fixed number per region, read only through the outside reference. CI here is an oracle with no queue, no flakes, and no cost; Chapter 18 prices the real one.',
  "The loop-gain readout is pre-cap: expected reinforcement inflow over decay outflow, measured on the field as it stands. A lit field holding steady while gain reads above 1 is being held by receptor saturation, not by balance — the engine's defaults live there on purpose.",
  'Moving a knob re-simulates the run from tick 0 on the same seed: you compare terrains; you never steer one mid-flight. No control here commands a worker.',
];

const CANNOT_SHOW =
  "where your terrain's critical values sit. The cliff at " +
  CRIT +
  ', the cap at 4, the lock at tick ' +
  CAP_TICK +
  ' are properties of these constants and this seed — shapes, not thresholds. No bench in this ' +
  "book predicts a real system's critical values, and a live field near its boundary wobbles " +
  'with demand and luck in ways a pinned seed cannot.';

/* ── The lab ────────────────────────────────────────────────────────────── */

export default function SignalField() {
  const reduced = usePrefersReducedMotion();
  const [taskId, setTaskId] = useState('gradient');
  const [knobs, setKnobs] = useState(() =>
    Object.fromEntries(TASKS.map((t) => [t.id, t.knob.init])),
  );
  const [commits, setCommits] = useState({
    gradient: null,
    saturate: null,
    lockin: null,
    boundary: null,
  });
  const [playhead, setPlayhead] = useState(TASK_BY_ID.gradient.horizon);
  const [playing, setPlaying] = useState(false);
  const [sandbox, setSandbox] = useState({
    spread: 0.06,
    decay: 0.1,
    reinforce: 0.5,
    explore: 0.1,
    outsideRef: true,
  });
  const [sandboxOpen, setSandboxOpen] = useState(false);

  const isSandbox = taskId === 'sandbox';
  const task = isSandbox ? SANDBOX_TASK : TASK_BY_ID[taskId];
  const knobValue = isSandbox ? null : knobs[taskId];
  const committed = isSandbox || commits[taskId] !== null;
  const allCommitted = Object.values(commits).every((c) => c !== null);

  const run = useMemo(() => {
    if (isSandbox) {
      return simulate(SANDBOX_TASK.start(), sandbox, SANDBOX_TASK.horizon, SANDBOX_TASK.walkSeed);
    }
    const t = TASK_BY_ID[taskId];
    return simulate(t.start(), { ...t.frozen, [t.knob.key]: knobValue }, t.horizon, t.walkSeed);
  }, [isSandbox, taskId, knobValue, sandbox]);

  const horizon = task.horizon;
  const idx = Math.min(playhead, horizon);
  const frame = run.frames[idx];
  const metrics = fieldMetrics(frame);
  const total = run.totals[idx];
  const showTruth = isSandbox ? sandbox.outsideRef : true;

  useEffect(() => {
    if (!playing) return undefined;
    if (playhead >= horizon) {
      setPlaying(false);
      return undefined;
    }
    const beat = Math.max(2, Math.round(horizon / 110));
    const t = setTimeout(() => setPlayhead((p) => Math.min(horizon, p + beat)), 50);
    return () => clearTimeout(t);
  }, [playing, playhead, horizon]);

  const switchTask = (id) => {
    setPlaying(false);
    setTaskId(id);
    const next = id === 'sandbox' ? SANDBOX_TASK : TASK_BY_ID[id];
    setPlayhead(id === 'sandbox' || next.entryAtEnd ? next.horizon : 0);
  };

  const runOrPause = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (reduced) {
      // Reduced motion: Run lands on the final frame in one discrete step.
      setPlayhead(horizon);
      return;
    }
    if (playhead >= horizon) setPlayhead(0);
    setPlaying(true);
  };

  const commitSpec = isSandbox ? null : COMMITS[taskId];
  const picked = isSandbox ? null : commits[taskId];
  const pickedLabel =
    picked !== null && commitSpec ? commitSpec.options.find((o) => o.id === picked)?.label : null;

  return (
    <LabFrame
      tag="LAB 08·A — THE SIGNAL FIELD"
      register="mechanism"
      question={QUESTION}
      payoff={PAYOFF}
      notes={NOTES}
      cannotShow={CANNOT_SHOW}
      glass={GLASS}
    >
      <div className="mh-controls" role="group" aria-label="Guided tasks">
        <span className="mh-kicker">Tasks</span>
        <div className="mh-chipset">
          {TASKS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="mh-chip"
              aria-pressed={taskId === t.id}
              onClick={() => switchTask(t.id)}
            >
              {t.chip}
              {commits[t.id] !== null ? ' ✓' : ''}
            </button>
          ))}
          <button
            type="button"
            className="mh-chip"
            aria-pressed={isSandbox}
            disabled={!allCommitted && !sandboxOpen}
            onClick={() => switchTask('sandbox')}
            title={allCommitted || sandboxOpen ? undefined : 'Opens after the four guided tasks'}
          >
            free play
          </button>
          {!allCommitted && !sandboxOpen ? (
            <button
              type="button"
              onClick={() => setSandboxOpen(true)}
              className="mono"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '10.5px',
                letterSpacing: '0.08em',
                color: 'var(--ink-faint)',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              free play opens after the guided tasks — open it anyway
            </button>
          ) : null}
        </div>
      </div>

      {!isSandbox ? (
        <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '8px 0' }}>
          {task.scene}
          {taskId === 'lockin' ? (
            <>
              {' '}
              <Mark kind="made" note="doctored start, mirrored from the engine's test suite" />
            </>
          ) : null}
        </p>
      ) : (
        <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '8px 0' }}>
          Free play, clearly optional: all four rates, plus the outside reference. The guided pass
          is the lesson; this is the bench after hours.
        </p>
      )}

      <FieldGrid field={frame} lockIn={metrics.lockIn} showTruth={showTruth} />
      <Readouts
        metrics={metrics}
        total={total}
        maxSignal={Math.max(...frame.nodes.map((n) => n.signal))}
      />
      <Sparkline totals={run.totals} playhead={idx} yMax={task.yMax} />

      <div
        className="mh-controls"
        role="group"
        aria-label="Bench controls: Step, Run, Reset, playhead"
      >
        <button
          type="button"
          className="mh-btn"
          onClick={() => setPlayhead((p) => Math.min(horizon, p + STEP_TICKS))}
          disabled={!committed || playing || idx >= horizon}
          aria-label="Step five ticks forward"
        >
          Step
        </button>
        <button
          type="button"
          className="mh-btn mh-btn-primary"
          onClick={runOrPause}
          disabled={!committed}
          aria-pressed={playing}
          aria-label={playing ? 'Pause the run' : 'Run to the end of the window'}
        >
          {playing ? 'Pause' : 'Run'}
        </button>
        <button
          type="button"
          className="mh-btn"
          onClick={() => {
            setPlaying(false);
            setPlayhead(0);
          }}
          disabled={!committed || idx === 0}
          aria-label="Reset to tick zero"
        >
          Reset
        </button>
        <div className="mh-slider" style={{ flex: '1 1 200px', maxWidth: 320 }}>
          <label htmlFor="sf-playhead">
            <span>playhead</span>
            <span>
              tick {idx} of {horizon}
            </span>
          </label>
          <input
            id="sf-playhead"
            type="range"
            min="0"
            max={horizon}
            step="1"
            value={idx}
            disabled={!committed}
            onChange={(e) => setPlayhead(Number(e.target.value))}
            aria-valuetext={`tick ${idx} of ${horizon}`}
          />
        </div>
      </div>

      {!isSandbox ? (
        <div className="mh-controls" role="group" aria-label="The one freed knob">
          <KnobSlider
            id={`sf-knob-${taskId}`}
            label={task.knob.label}
            min={task.knob.min}
            max={task.knob.max}
            step={task.knob.step}
            value={knobValue}
            disabled={!committed}
            lockedNote="commit first"
            onChange={(v) => setKnobs((k) => ({ ...k, [taskId]: v }))}
          />
          <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-faint)' }}>
            {task.frozenLine}
          </span>
        </div>
      ) : (
        <>
          <div className="mh-controls" role="group" aria-label="Free play: all four rates">
            <KnobSlider
              id="sf-sb-spread"
              label="spread"
              min={0}
              max={0.3}
              step={0.01}
              value={sandbox.spread}
              disabled={false}
              onChange={(v) => setSandbox((s) => ({ ...s, spread: v }))}
            />
            <KnobSlider
              id="sf-sb-decay"
              label="decay"
              min={0}
              max={0.3}
              step={0.01}
              value={sandbox.decay}
              disabled={false}
              onChange={(v) => setSandbox((s) => ({ ...s, decay: v }))}
            />
            <KnobSlider
              id="sf-sb-reinforce"
              label="reinforce"
              min={0.05}
              max={2.4}
              step={0.05}
              value={sandbox.reinforce}
              disabled={false}
              onChange={(v) => setSandbox((s) => ({ ...s, reinforce: v }))}
            />
            <KnobSlider
              id="sf-sb-explore"
              label="explore · the floor"
              min={0}
              max={0.4}
              step={0.02}
              value={sandbox.explore}
              disabled={false}
              onChange={(v) => setSandbox((s) => ({ ...s, explore: v }))}
            />
            <button
              type="button"
              className="mh-chip"
              aria-pressed={!sandbox.outsideRef}
              onClick={() => setSandbox((s) => ({ ...s, outsideRef: !s.outsideRef }))}
            >
              {sandbox.outsideRef ? 'sever the outside reference' : 'restore the outside reference'}
            </button>
          </div>
          {!sandbox.outsideRef ? (
            <p
              style={{
                fontStyle: 'italic',
                fontSize: '14px',
                color: 'var(--ink-2)',
                margin: '8px 0',
              }}
            >
              Outside reference severed: every claimed success now deposits, so the field is
              reinforcing its own reports. The truth bars are gone because nothing in the field can
              read them anymore — neither can you. That blindness is the point; Chapter 9 runs it as
              a storm.
            </p>
          ) : null}
        </>
      )}

      {!isSandbox && picked === null ? (
        <Commit
          prompt={commitSpec.prompt}
          options={commitSpec.options}
          onReveal={(id) => setCommits((c) => ({ ...c, [taskId]: id }))}
        >
          {(id) => commitSpec.feedback[id]}
        </Commit>
      ) : null}

      {!isSandbox && picked !== null ? (
        <div className="mh-feedback">
          <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
            You predicted · {pickedLabel}
          </span>
          <p style={{ margin: '0 0 8px' }}>{commitSpec.feedback[picked]}</p>
          <p style={{ margin: 0, fontStyle: 'italic' }}>{commitSpec.direction}</p>
        </div>
      ) : null}
    </LabFrame>
  );
}
