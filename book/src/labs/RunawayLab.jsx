// RunawayLab.jsx — LAB 09·A "The storm" (Ch 9 · Runaway, covers §2.9 emergent spiral).
//
// Productive failure inside rails (DESIGN §6.4), three phases on one engine:
//   A — "clear the backlog faster": two reinforcement-flavored dials, a
//       committed prediction, and a spike that most honest settings cannot
//       survive; then a committed explanation before the name.
//   B — the same storm severed from its outside reference: the handbook's
//       healthy-vs-runaway table as four live lamps, the remedy palette
//       behind a committed diagnosis (one of the book's two cognitive
//       gates, quiet "show me anyway" included), and the prominent
//       RESTART THE AGENT button — the terrain law's one exception, which
//       exists to fail: load dips one tick, the storm resumes, the button
//       greys out.
//   C — two recorded re-skins (agents citing agents; eval drift) as
//       captioned walkthroughs over the identical series. Same engine,
//       same seed, same numbers; only the nouns change.
//
// Mechanism register. Every curve is runStorm/applyRemedy output from
// src/engine/field.js, seed 9, re-simulated from tick 0 on every remedy so
// the past replays exactly. No physics in this file: lamp readings, chart
// scales, and captions are presentation over the engine's series.

import { useEffect, useState } from 'react';
import { Badge, Commit, LabFrame, Mark, Walkthrough, glassSlice } from '../components/kit.jsx';
import { usePrefersReducedMotion } from '../shared/usePrefersReducedMotion.js';
import { runStorm, applyRemedy, STORM_POLICY_DEFAULTS } from '../engine/field.js';
import fieldSrc from '../engine/field.js?raw';

/* ── The recorded runs (module-level: same seed, same series, forever) ── */

const SEED = 9;

// Phase A at rest: the shipped policy through the spike, ground truth intact.
const CANONICAL = runStorm({ seed: SEED });
// Phase B at rest: the identical storm with the outside reference severed.
const SEVERED = runStorm({ seed: SEED, outsideRef: false });

// Display mirrors of the engine's service constants (verbatim in the glass).
const CAPACITY = 50;
const SPIKE_TICKS = 3;
const SPIKE_AT = CANONICAL.config.spikeAt; // 10
const SPIKE_END = SPIKE_AT + SPIKE_TICKS; // 13

const LAST = CANONICAL.series.load.length - 1; // 59
const END_LOAD = Math.round(CANONICAL.series.load[LAST]); // 330
const END_DUE = Math.round(CANONICAL.series.amplification[LAST] * CAPACITY); // 300
const END_SUCCESS = Math.round((CAPACITY / END_LOAD) * 100); // 15%
const CROSS_TICK = CANONICAL.series.amplification.findIndex((a) => a >= 1); // 11

const GLASS = [
  glassSlice(fieldSrc, '// The service the retries hammer.', 'REMEDY_WINDOW = 40'),
  '// ── the reinforcement step, from inside the tick loop ──',
  glassSlice(fieldSrc, '// 5) Failures spawn retries', 'const amplification = due / CAPACITY;'),
  '// ── what each remedy touches (and the one that cannot work) ──',
  glassSlice(fieldSrc, 'function applyRemedyToSim', '\n}'),
  '// ── the public surface this lab calls ──',
  glassSlice(fieldSrc, 'export function runStorm', '\n}'),
  glassSlice(fieldSrc, 'export function applyRemedy', '\n}'),
].join('\n\n');

/* ── Shared readouts ───────────────────────────────────────────────────── */

function tickStatus(storm, upto) {
  const s = storm.series;
  const i = Math.max(0, Math.min(upto, s.load.length) - 1);
  const amp = s.amplification[i];
  const read =
    amp >= 1
      ? 'retry pressure above 1.0 — retries alone exceed capacity; self-feeding'
      : amp >= 0.7
        ? 'retry pressure near capacity — critical'
        : 'retry pressure low — perturbations die';
  return `tick ${i} · load ${Math.round(s.load[i])} a tick · pressure ${amp.toFixed(2)} · ${read}`;
}

/* ── The chart: load, retries due, capacity, spike band, remedy marks ──── */

const REMEDY_SHORT = {
  variety: 'variety',
  decay: 'decay',
  'outside-reference': 'outside ref',
  'tighten-trust': 'trust',
  evacuate: 'evacuate',
  'restart-agent': 'restart',
};

function StormChart({ storm, upto }) {
  const s = storm.series;
  const n = s.load.length;
  const shown = Math.max(2, Math.min(upto, n));
  const W = 560;
  const H = 190;
  const padL = 46;
  const padR = 14;
  const padT = 14;
  const padB = 26;
  const yMax = Math.max(...s.load, 100) * 1.06;
  const x = (i) => padL + (i / (n - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - v / yMax) * (H - padT - padB);
  const line = (vals) =>
    vals
      .slice(0, shown)
      .map((v, i) => `${x(i)},${y(v)}`)
      .join(' ');
  const due = s.amplification.map((a) => a * CAPACITY);
  const gridVals = [0, CAPACITY, Math.round(yMax / 2), Math.round(yMax)].filter(
    (v, i, arr) => arr.indexOf(v) === i && v <= yMax,
  );
  const remedyWord = storm.remedies.length
    ? ` Remedies applied: ${storm.remedies.map((r) => REMEDY_SHORT[r.remedy]).join(', ')}.`
    : '';
  const ariaLabel =
    `Service load over ${n} ticks. Capacity is ${CAPACITY} a tick; a demand spike runs ` +
    `ticks ${SPIKE_AT} to ${SPIKE_END - 1}. The red line is retries alone; where it crosses ` +
    `the capacity line the storm feeds itself. At the last drawn tick the load is ` +
    `${Math.round(s.load[shown - 1])} a tick and retry pressure is ` +
    `${s.amplification[shown - 1].toFixed(2)}.${remedyWord}`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* spike band */}
      <rect
        x={x(SPIKE_AT)}
        y={padT}
        width={x(SPIKE_END) - x(SPIKE_AT)}
        height={H - padT - padB}
        fill="var(--amber)"
        opacity="0.10"
      />
      {gridVals.map((v) => (
        <g key={v}>
          <line
            x1={padL}
            x2={W - padR}
            y1={y(v)}
            y2={y(v)}
            stroke={v === CAPACITY ? 'var(--ink-faint)' : 'var(--line-soft)'}
            strokeWidth="1"
            strokeDasharray={v === CAPACITY ? '5 4' : undefined}
          />
          <text
            x={padL - 6}
            y={y(v) + 3.5}
            textAnchor="end"
            fontSize="9"
            fill="var(--ink-faint)"
            fontFamily="var(--font-mono)"
          >
            {v}
          </text>
        </g>
      ))}
      <text
        x={W - padR}
        y={y(CAPACITY) - 4}
        textAnchor="end"
        fontSize="9"
        fill="var(--ink-faint)"
        fontFamily="var(--font-mono)"
      >
        capacity
      </text>
      {[0, SPIKE_AT, n - 1].map((t) => (
        <text
          key={t}
          x={x(t)}
          y={H - padB + 14}
          textAnchor={t === 0 ? 'start' : t === n - 1 ? 'end' : 'middle'}
          fontSize="9"
          fill="var(--ink-faint)"
          fontFamily="var(--font-mono)"
        >
          tick {t}
        </text>
      ))}
      {/* remedy markers */}
      {storm.remedies.map((r, k) =>
        r.at < shown ? (
          <g key={`${r.remedy}-${r.at}`}>
            <line
              x1={x(r.at)}
              x2={x(r.at)}
              y1={padT}
              y2={H - padB}
              stroke="var(--blue)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text
              x={x(r.at) + 3}
              y={padT + 9 + (k % 2) * 10}
              fontSize="8.5"
              fill="var(--blue)"
              fontFamily="var(--font-mono)"
            >
              {REMEDY_SHORT[r.remedy]}
            </text>
          </g>
        ) : null,
      )}
      <polyline points={line(s.load)} fill="none" stroke="var(--ink-2)" strokeWidth="1.8" />
      <polyline points={line(due)} fill="none" stroke="var(--red)" strokeWidth="1.8" />
      <text
        x={x(shown - 1) - 4}
        y={y(s.load[shown - 1]) - 5}
        textAnchor="end"
        fontSize="9"
        fill="var(--ink-2)"
        fontFamily="var(--font-mono)"
      >
        load
      </text>
      <text
        x={x(shown - 1) - 4}
        y={y(due[shown - 1]) + 11}
        textAnchor="end"
        fontSize="9"
        fill="var(--red)"
        fontFamily="var(--font-mono)"
      >
        retries due
      </text>
    </svg>
  );
}

/* ── The belief strip: what this console can and cannot see ────────────── */

function BeliefStrip({ storm, upto }) {
  const s = storm.series;
  const n = s.selfReport.length;
  const shown = Math.max(2, Math.min(upto, n));
  const W = 560;
  const H = 86;
  const padL = 46;
  const padR = 14;
  const padT = 10;
  const padB = 16;
  const x = (i) => padL + (i / (n - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - v) * (H - padT - padB);
  const restore = storm.remedies.find((r) => r.remedy === 'outside-reference');
  const gtFrom = storm.config.outsideRef ? 0 : restore ? restore.at : -1;
  const srPts = s.selfReport
    .slice(0, shown)
    .map((v, i) => `${x(i)},${y(v)}`)
    .join(' ');
  const gtPts =
    gtFrom >= 0 && shown > gtFrom + 1
      ? s.groundTruth
          .slice(gtFrom, shown)
          .map((v, i) => `${x(gtFrom + i)},${y(v)}`)
          .join(' ')
      : null;
  const ariaLabel =
    gtFrom >= 0
      ? `Belief strip: the system's self-report against ground truth, visible from tick ` +
        `${gtFrom}. At the last drawn tick self-report reads ` +
        `${s.selfReport[shown - 1].toFixed(2)} and ground truth reads ` +
        `${s.groundTruth[shown - 1].toFixed(2)}.`
      : `Belief strip: self-report only. The outside reference is severed, so ground truth ` +
        `is not on this console. Self-report reads ${s.selfReport[shown - 1].toFixed(2)} ` +
        `at the last drawn tick.`;
  return (
    <figure style={{ margin: '6px 0 0' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={ariaLabel}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--line-soft)"
              strokeWidth="1"
            />
            <text
              x={padL - 6}
              y={y(v) + 3.5}
              textAnchor="end"
              fontSize="9"
              fill="var(--ink-faint)"
              fontFamily="var(--font-mono)"
            >
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        {gtPts ? (
          <polyline points={gtPts} fill="none" stroke="var(--accent)" strokeWidth="1.8" />
        ) : null}
        <polyline points={srPts} fill="none" stroke="var(--amber)" strokeWidth="1.8" />
        <text
          x={x(shown - 1) - 4}
          y={y(storm.series.selfReport[shown - 1]) - 5}
          textAnchor="end"
          fontSize="9"
          fill="var(--amber)"
          fontFamily="var(--font-mono)"
        >
          self-report
        </text>
        {gtPts ? (
          <text
            x={x(shown - 1) - 4}
            y={y(storm.series.groundTruth[shown - 1]) + 11}
            textAnchor="end"
            fontSize="9"
            fill="var(--accent-ink)"
            fontFamily="var(--font-mono)"
          >
            ground truth
          </text>
        ) : null}
      </svg>
      <figcaption style={{ fontSize: '12.5px', color: 'var(--ink-2)', margin: '4px 0 0' }}>
        {gtFrom > 0
          ? `Ground truth re-coupled at tick ${gtFrom}: the first honest number this console ` +
            `has shown since the spike.`
          : gtFrom === 0
            ? 'Self-report tracks ground truth: the outside reference is intact.'
            : 'The green line is missing on purpose. The outside reference is severed; this ' +
              'console has only the system’s report on itself, and that number rises ' +
              'with activity.'}
      </figcaption>
    </figure>
  );
}

/* ── The lamp board: the healthy-vs-runaway table, wired to the run ────── */

const LAMPS = [
  { id: 'decay', name: 'decay', on: 'present', off: 'absent' },
  { id: 'variety', name: 'variety', on: 'preserved', off: 'collapsed' },
  { id: 'outsideRef', name: 'outside reference', on: 'intact', off: 'severed' },
  { id: 'net', name: 'net behavior', on: 'self-correcting', off: 'self-amplifying' },
];

// Lamp readings derived from the run's record: the three property lamps from
// the terrain (policy + remedies applied), the outcome lamp from retry
// pressure at the reveal point, using the engine's own 1.0 threshold.
function readLamps(storm, upto) {
  const has = (id) => storm.remedies.some((r) => r.remedy === id);
  const amp = storm.series.amplification;
  const i = Math.max(0, Math.min(upto, amp.length) - 1);
  return {
    decay: has('decay'),
    variety: Boolean(storm.config.policy.jitter) || has('variety'),
    outsideRef: Boolean(storm.config.outsideRef) || has('outside-reference'),
    net: amp[i] < 1,
  };
}

function LampBoard({ storm, upto }) {
  const states = readLamps(storm, upto);
  return (
    <div className="mh-lamps" role="group" aria-label="Healthy-versus-runaway lamp board">
      {LAMPS.map((l) => (
        <span key={l.id} className={states[l.id] ? 'mh-lamp on' : 'mh-lamp off'}>
          {l.name} — {states[l.id] ? l.on : l.off}
        </span>
      ))}
    </div>
  );
}

/* ── Phase A: argued feedback, computed from the run on the chart ──────── */

const PREDICT_OPTIONS = [
  { id: 'clears', label: 'Clears the backlog faster — that is what the dials are for' },
  { id: 'rides', label: 'Takes a rough three ticks, then settles back' },
  { id: 'storms', label: 'Storms — the retries become the load' },
];

const OPENERS = {
  clears: {
    runaway: 'The dials read as throughput. The engine read them as gain.',
    critical: 'Faster, briefly — then the spike showed you what the dials were really set to.',
    stable: 'Clearing faster was never on the table; what you bought is survival.',
  },
  rides: {
    runaway: 'It rode into the spike fine. It never rode out.',
    critical: 'Called: a rough passage, then quiet.',
    stable: 'Quieter than a ride — nothing ever came back to ride out.',
  },
  storms: {
    runaway: 'Storm called. Now read which dial did it.',
    critical: 'Close — it flared like a storm and then died, which is the more interesting run.',
    stable: 'No storm: with one attempt per request there is nothing to feed.',
  },
};

function argueOutcome(run) {
  const s = run.series;
  const n = s.load.length;
  const mr = run.config.policy.maxRetries;
  const finalLoad = Math.round(s.load[n - 1]);
  const finalDue = Math.round(s.amplification[n - 1] * CAPACITY);
  const cross = s.amplification.findIndex((a) => a >= 1);
  const peak = Math.max(...s.amplification);
  const retainPct = Math.round((1 - 1 / mr) * 100);
  if (run.phase === 'runaway') {
    return (
      `Retry pressure crossed 1.0 at tick ${cross}: from there, retries alone exceed the ` +
      `service's ${CAPACITY}-a-tick capacity and the spike stops mattering. At tick ${n - 1} ` +
      `the load is ${finalLoad} a tick — 30 fresh, ${finalDue} returning. At ${mr} retries ` +
      `per request, ${retainPct}% of failures come back as load, and synchronized timeouts ` +
      `double-fire on top. Every dial on this console multiplies the comeback; nothing on it ` +
      `drains. The pressure pins at ${peak.toFixed(1)} because the engine caps in-flight ` +
      `retries at 300 — a finite client population, not an equilibrium.`
    );
  }
  if (run.phase === 'critical') {
    const crossed = cross >= 0;
    return (
      `Retry pressure ${
        crossed
          ? `crossed 1.0 during the spike (peak ${peak.toFixed(1)})`
          : `peaked at ${peak.toFixed(1)}`
      } and then fell back through it: at ${mr} retries per request, ${retainPct}% of ` +
      `failures return, and once the spike's double-fire pressure passes, the loop's gain ` +
      `sits below one — perturbations die instead of growing. One more retry per failure and ` +
      `the identical spike never ends. That boundary is a phase transition, not a margin.`
    );
  }
  return (
    `One attempt per request: failures surface as errors instead of returning as load, so ` +
    `the spike is three bad ticks and then it is over — dropped requests, honest red, no ` +
    `storm. Note what the other dial never bought: at three or more retries, every backoff ` +
    `on this console storms. Backoff delays the wave; only refusing to multiply it drains ` +
    `it. Whether your callers can eat those errors is a real question, and it is a terrain ` +
    `question too.`
  );
}

const EXPLAIN_OPTIONS = [
  { id: 'backlog', label: "The spike's backlog, still draining through" },
  { id: 'degraded', label: 'Spike damage — the service got slower and never recovered' },
  { id: 'retries', label: 'Retries — the policy is manufacturing the load it is retrying' },
];

const EXPLAIN_FEEDBACK = {
  backlog:
    `A backlog drains: queue down, load down, every tick a little better. This queue has ` +
    `been pinned at its 300-in-flight cap since tick ${SPIKE_END}, and the load has not ` +
    `moved. Count the composition instead: 30 of the ${END_LOAD} are fresh demand, back to ` +
    `normal the moment the spike ended, and ${END_DUE} are retries of failures that were ` +
    `themselves mostly retries. The spike seeded it; the policy sustains it. Reinforcement ` +
    `without counter-force does not drain, because whatever drained it would have to be a ` +
    `different mechanism from the one feeding it — and this terrain has none.`,
  degraded:
    `The service in this engine cannot degrade: capacity is the constant ${CAPACITY}, in ` +
    `the glass below. Success collapsed because the denominator exploded — ${CAPACITY} ` +
    `cleared out of ${END_LOAD} offered is ${END_SUCCESS}%. A healthy service, drowning ` +
    `anyway. That is worth keeping: a runaway needs no broken component. ${END_DUE} of the ` +
    `arrivals are the retry policy's own output, fed back to it as input.`,
  retries:
    `Count it and it closes: 30 fresh — demand has been back to normal since tick ` +
    `${SPIKE_END} — plus ${END_DUE} returning retries makes ${END_LOAD}. Failures spawn ` +
    `retries; retries overload the service; overload fails them again. The policy is the ` +
    `load's author and its victim at once.`,
};

/* ── Phase B: diagnosis gate and remedy palette ────────────────────────── */

const DIAGNOSIS_OPTIONS = [
  { id: 'agent', label: 'A bad agent — find the client that went rogue, restart it' },
  { id: 'capacity', label: 'An under-provisioned service — add capacity' },
  { id: 'terrain', label: 'A terrain problem — reinforcement with no counter-force anywhere' },
];

const DIAGNOSIS_FEEDBACK = {
  agent:
    'Every caller here runs the same shipped policy; there is no rogue to find. The big ' +
    'red button below is ungated — press it and watch what one tick of dip buys when the ' +
    'demand behind the restarted agent comes straight back. Then read the lamps again: ' +
    'decay, variety, and the outside reference are properties of the terrain. No agent ' +
    'owns any of them.',
  capacity:
    'Provisioning answers a demand problem, and demand has been 30 a tick since tick 13. ' +
    `You would be buying capacity to absorb load the policy is manufacturing — and the ` +
    'lamps would not move: nothing decays, every caller stays synchronized, and the ' +
    'console still grades itself. The storm scales to whatever you provision, because its ' +
    'input is its own output.',
  terrain:
    'That is what the lamps have been saying: decay absent, variety collapsed, outside ' +
    'reference severed, net behavior self-amplifying. None of the four names an agent. ' +
    'The palette below holds the whole remedy family for this spiral — every one of them ' +
    'reshapes terrain.',
};

const REMEDY_PALETTE = [
  { id: 'variety', label: 'inject variety', sub: 'jitter the retries, widen the backoff' },
  { id: 'decay', label: 'raise decay', sub: 'queued retries expire instead of returning' },
  {
    id: 'outside-reference',
    label: 'restore the outside reference',
    sub: 're-couple self-report to ground truth',
  },
  { id: 'tighten-trust', label: 'tighten the trust model', sub: 'no blind re-tries' },
  { id: 'evacuate', label: 'evacuate & restart cold', sub: 'drain everything, shed traffic' },
];

const REMEDY_NOTES = {
  variety:
    'Jitter desynchronizes the herd and widens the backoff: the retry wave stops landing ' +
    'as a wall. Variety lamp: preserved. Watch the red line die within a few ticks.',
  decay:
    'Queued retries now expire instead of returning forever. Signal that fades cannot ' +
    'pile up — the decay lamp is the same lamp that keeps Chapter 8’s field from ' +
    'saturating.',
  'outside-reference':
    'The console re-couples to ground truth: the belief strip shows its first honest ' +
    'number in fifty ticks, and informed callers stop double-firing into a dead service.',
  'tighten-trust':
    'One attempt per request: blind re-trust removed. The storm starves in a tick. ' +
    'Failures now surface as errors — visible, honest, and bounded.',
  evacuate:
    'Drain everything in flight, shed three ticks of traffic, restart cold. It works, and ' +
    'it costs you every request you were carrying. The handbook reserves this one for ' +
    'severe cases.',
  'restart-agent':
    'Load dipped for exactly one tick — the restarted client dropped its in-flight work — ' +
    'and the demand behind that work returned untouched. Four lamps: unmoved.',
};

/* ── Phase C: the same series, re-captioned ────────────────────────────── */

const DIAL_TICKS = [5, 10, 11, 13, 30, 59];

const sv = (t) => {
  const s = SEVERED.series;
  return {
    tick: t,
    load: Math.round(s.load[t]),
    amp: s.amplification[t],
    sr: s.selfReport[t],
    gt: s.groundTruth[t],
  };
};

function reskinTrace(labels, captions, selfLabel, truthLabel) {
  return {
    seed: SEED,
    steps: DIAL_TICKS.map((t, k) => ({
      label: labels[k],
      caption: captions[k],
      data: { ...sv(t), selfLabel, truthLabel },
    })),
  };
}

const CITE_TRACE = reskinTrace(
  [
    'ROUND 5 · CALM',
    'ROUND 10 · A HOT TOPIC',
    'ROUND 11 · CROSSING',
    'ROUND 13 · TOPIC GONE',
    'ROUND 30 · WELL-GROUNDED, APPARENTLY',
    'ROUND 59 · STEADY STATE',
  ],
  [
    `Thirty claims drafted a round; the corpus can ground fifty. Every citation resolves ` +
      `to a primary source. Actually-grounded share: ${sv(5).gt.toFixed(2)}.`,
    `A hot topic lands: ${sv(10).load} claims this round against fifty grounding checks. ` +
      `Most go out unchecked — and each unchecked claim is citable by the next agent that ` +
      `needs support.`,
    `Recirculation crosses 1.0: citations of citations alone exceed all grounding ` +
      `capacity. From here the loop no longer needs the hot topic.`,
    `The topic cools; fresh claims fall back to thirty a round. Volume does not fall: ` +
      `${sv(13).load} claims in flight, ${Math.round(sv(13).amp * CAPACITY)} of them ` +
      `citing other claims in flight.`,
    `Seventeen rounds later. Apparent groundedness ${sv(30).sr.toFixed(2)} — every claim ` +
      `cites something. Actually grounded: ${sv(30).gt.toFixed(2)}. The confidence number ` +
      `measures circulation, not sources.`,
    `Steady state. This dial reads exactly like Phase B's because it is Phase B's run: ` +
      `same engine, same seed, same series. Ungrounded claims look well-grounded because ` +
      `looking grounded is what citation counts measure.`,
  ],
  'apparent groundedness',
  'actually grounded',
);

const EVAL_TRACE = reskinTrace(
  [
    'CYCLE 5 · CALIBRATED',
    'CYCLE 10 · FEATURE PUSH',
    'CYCLE 11 · CROSSING',
    'CYCLE 13 · PUSH OVER',
    'CYCLE 30 · SCORES UP',
    'CYCLE 59 · STEADY STATE',
  ],
  [
    `The eval harness was calibrated on fifty deep-reviewed outcomes a cycle. Thirty ` +
      `submissions arrive; scores track real outcomes at ${sv(5).gt.toFixed(2)}.`,
    `A feature push: ${sv(10).load} submissions. Past fifty, the harness grades on ` +
      `surface features — and the fleet learns which features grade well.`,
    `Resubmissions tuned to the grader cross 1.0: rework optimized for the evaluator ` +
      `alone exceeds what deep review can check. The metric is now training its subjects.`,
    `The push ends; fresh work falls back to thirty a cycle. Submissions hold at ` +
      `${sv(13).load}: each pass through the grader teaches the next resubmission what ` +
      `the grader rewards.`,
    `Eval score ${sv(30).sr.toFixed(2)} and rising; sampled real outcomes ` +
      `${sv(30).gt.toFixed(2)}. The handbook's warning sign, on the nose: eval scores ` +
      `diverging from real outcomes.`,
    `Same dial, same tick, same engine. An evaluator severed from outcomes is the ` +
      `outside-reference lamp gone dark, wearing an eval skin.`,
  ],
  'eval score',
  'sampled real outcomes',
);

function PhaseDial({ step }) {
  const d = step.data;
  const read = d.amp >= 1 ? 'runaway' : d.amp >= 0.7 ? 'critical' : 'stable';
  const cls = d.amp >= 1 ? 'bad' : d.amp >= 0.7 ? 'warn' : 'good';
  const diverged = d.sr - d.gt > 0.3;
  return (
    <div
      className="mh-readout"
      role="group"
      aria-label={
        `Phase dial at tick ${d.tick}: pressure ${d.amp.toFixed(2)}, ${read}; ` +
        `${d.selfLabel} ${d.sr.toFixed(2)}; ${d.truthLabel} ${d.gt.toFixed(2)}.`
      }
      style={{
        border: '1px solid var(--line-soft)',
        borderRadius: 3,
        padding: '8px 12px',
        background: 'var(--paper)',
      }}
    >
      <div className="mh-stat">
        <span className="k">Tick</span>
        <span className="v">{d.tick}</span>
      </div>
      <div className="mh-stat">
        <span className="k">Pressure</span>
        <span className={`v ${cls}`}>{d.amp.toFixed(2)}</span>
      </div>
      <div className="mh-stat">
        <span className="k">Dial</span>
        <span className={`v ${cls}`}>{read}</span>
      </div>
      <div className="mh-stat">
        <span className="k">{d.selfLabel}</span>
        <span className="v warn">{d.sr.toFixed(2)}</span>
      </div>
      <div className="mh-stat">
        <span className="k">{d.truthLabel}</span>
        <span className={`v ${diverged ? 'bad' : 'good'}`}>{d.gt.toFixed(2)}</span>
      </div>
    </div>
  );
}

/* ── Small shared chrome ───────────────────────────────────────────────── */

function PhaseHead({ first, title, children }) {
  return (
    <div
      style={{
        margin: first ? '4px 0 6px' : '24px 0 6px',
        borderTop: first ? 'none' : '1px solid var(--line-soft)',
        paddingTop: first ? 0 : 16,
      }}
    >
      <span className="mh-kicker" style={{ color: 'var(--accent-ink)' }}>
        {title}
      </span>
      <p style={{ margin: '4px 0 0', fontSize: '14.5px', color: 'var(--ink-2)' }}>{children}</p>
    </div>
  );
}

const quietLinkStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontSize: '10.5px',
  letterSpacing: '0.08em',
  color: 'var(--ink-faint)',
  textDecoration: 'underline',
  cursor: 'pointer',
};

/* ── The lab ───────────────────────────────────────────────────────────── */

const PAYOFF = (
  <>
    Most settings storm. With three or more retries per request, every backoff on this console
    crosses retry pressure 1.0 during the spike and never comes back down: at tick {LAST} the load
    is {END_LOAD} a tick against a {CAPACITY}-a-tick service that never degraded — 30 fresh,{' '}
    {END_DUE} manufactured by the policy out of its own failures. That is emergent runaway,
    reinforcement without counter-force, and every remedy that drains it reshapes terrain: variety,
    decay, the outside reference, the trust model, evacuation. Restarting the agent dips the load
    for exactly one tick. One parameter family under every runaway you will ever see — it wears
    retries here, citations and eval scores in Phase C — and the remedy family is short and always
    terrain-shaped.{' '}
    <Badge
      layer="W"
      note="§2.9: the emergent death spiral, its healthy-vs-runaway table, and its remedy family are the handbook's working principles, run live here"
    />
  </>
);

const NOTES = [
  `Service constants are the engine's, mirrored in the glass: capacity ${CAPACITY} attempts a ` +
    `tick, 30 fresh arrivals, a ${SPIKE_TICKS}-tick spike of +120, and a finite client ` +
    `population capping in-flight retries at 300 — which is why retry pressure pins at 6.0 ` +
    `instead of diverging to infinity.`,
  'Synchronized timeouts make overloaded callers double-fire, and jitter halves that pile-on: ' +
    'a Ⓦ modeling choice, flagged in the engine source, not a measured constant.',
  'The severed console’s confidence is an authored shape: self-report rises 0.012 per ' +
    'unit of retry pressure and never falls while severed. Real dashboards lie with more ' +
    'variety.',
  'Every remedy re-simulates the run from its seed with the remedy scheduled at the current ' +
    'end, then extends 40 ticks: the past replays exactly, the future diverges.',
  `Phase C's two runs are not new simulations: identical seed, identical series, re-captioned. ` +
    `Only the nouns change — that is the claim, made literally.`,
  'Phase thresholds (pressure 1.0; critical at 0.7) are the model’s bookkeeping, not ' +
    'your service’s numbers.',
];

const CANNOT_SHOW =
  'where your system’s threshold sits. The engine draws the family’s shape — gain ' +
  'above one, a storm that outlives its trigger, remedies that only work on terrain — but ' +
  'nothing here predicts the retry count, backoff, or tick at which a real service tips. And ' +
  'every caller in it follows its policy honestly: no client here is adaptive or adversarial, ' +
  'which real runaways do not promise.';

export default function RunawayLab() {
  const reduced = usePrefersReducedMotion();

  /* Phase A state. Legible at rest: the shipped policy's storm, fully drawn. */
  const [mr, setMr] = useState(STORM_POLICY_DEFAULTS.maxRetries);
  const [bo, setBo] = useState(STORM_POLICY_DEFAULTS.backoffMs);
  const [aStorm, setAStorm] = useState(CANONICAL);
  const aLen = aStorm.series.load.length;
  const [aUpto, setAUpto] = useState(CANONICAL.series.load.length);
  const [predicted, setPredicted] = useState(null);

  /* Phase B state. Legible at rest: the severed storm, lamps dark. */
  const [bStorm, setBStorm] = useState(SEVERED);
  const bLen = bStorm.series.load.length;
  const [bUpto, setBUpto] = useState(SEVERED.series.load.length);
  const [diagnosed, setDiagnosed] = useState(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [restartUsed, setRestartUsed] = useState(false);

  // One sweep effect per chart: reveal ticks until the drawn run catches up.
  useEffect(() => {
    if (aUpto >= aLen) return undefined;
    const t = setTimeout(() => setAUpto((u) => Math.min(aLen, u + 2)), 28);
    return () => clearTimeout(t);
  }, [aUpto, aLen]);
  useEffect(() => {
    if (bUpto >= bLen) return undefined;
    const t = setTimeout(() => setBUpto((u) => Math.min(bLen, u + 2)), 28);
    return () => clearTimeout(t);
  }, [bUpto, bLen]);

  const aSweeping = aUpto < aLen;
  const bSweeping = bUpto < bLen;

  const fireA = (policy) => {
    const next = runStorm({
      policy: policy ?? { maxRetries: mr, backoffMs: bo },
      seed: SEED,
    });
    setAStorm(next);
    setAUpto(reduced ? next.series.load.length : 2);
  };

  const applyB = (remedy) => {
    const next = applyRemedy(bStorm, remedy);
    setBStorm(next);
    setBUpto(reduced ? next.series.load.length : bStorm.series.load.length);
    if (remedy === 'restart-agent') setRestartUsed(true);
  };

  const resetB = () => {
    setBStorm(SEVERED);
    setBUpto(SEVERED.series.load.length);
  };

  const appliedB = bStorm.remedies.map((r) => r.remedy);
  const paletteOpen = diagnosed !== null || gateOpen;
  const predictedLabel = PREDICT_OPTIONS.find((o) => o.id === predicted)?.label;

  return (
    <LabFrame
      tag="LAB 09·A — THE STORM"
      register="mechanism"
      question={
        `Your retry policy meets a three-tick spike at tick ${SPIKE_AT}. Which dial settings ` +
        `survive it — and when one doesn't, what exactly is still arriving at tick ${LAST}, ` +
        `long after the spike is gone?`
      }
      payoff={PAYOFF}
      notes={NOTES}
      cannotShow={CANNOT_SHOW}
      glass={GLASS}
    >
      {/* ════ Phase A ════ */}
      <PhaseHead first title="Phase A — clear the backlog faster">
        The console{' '}
        <Mark kind="made" note="constructed for teaching; the dynamics are the engine's" /> opened
        on the shipped policy's run: {STORM_POLICY_DEFAULTS.maxRetries} retries per request,{' '}
        {STORM_POLICY_DEFAULTS.backoffMs} ms backoff, no jitter, no breaker. It stormed. You get the
        two dials the policy has. Re-tune them, commit a prediction, and run the same spike.
      </PhaseHead>

      <StormChart storm={aStorm} upto={aUpto} />
      <p
        className="mono"
        aria-live="polite"
        style={{ fontSize: '11.5px', color: 'var(--ink-faint)', margin: '4px 0 10px' }}
      >
        {aSweeping ? 'running…' : tickStatus(aStorm, aLen)}
      </p>

      <div className="mh-controls" role="group" aria-label="Retry policy dials">
        <div className="mh-slider" style={{ flex: '1 1 200px', maxWidth: 280 }}>
          <label htmlFor="rw-retries">
            <span>max retries per request</span>
            <span>{mr}</span>
          </label>
          <input
            id="rw-retries"
            type="range"
            min="1"
            max="8"
            step="1"
            value={mr}
            onChange={(e) => setMr(Number(e.target.value))}
            aria-valuetext={`${mr} retries per request`}
          />
        </div>
        <div className="mh-slider" style={{ flex: '1 1 200px', maxWidth: 280 }}>
          <label htmlFor="rw-backoff">
            <span>backoff between attempts</span>
            <span>{bo} ms</span>
          </label>
          <input
            id="rw-backoff"
            type="range"
            min="100"
            max="1600"
            step="100"
            value={bo}
            onChange={(e) => setBo(Number(e.target.value))}
            aria-valuetext={`${bo} milliseconds of backoff`}
          />
        </div>
      </div>

      {predicted === null ? (
        <Commit
          prompt={
            `Dials set: ${mr} ${mr === 1 ? 'attempt' : 'retries'} × ${bo} ms. A ` +
            `${SPIKE_TICKS}-tick spike of +120 requests a tick lands at tick ${SPIKE_AT}, on ` +
            `top of 30 a tick of steady demand, against ${CAPACITY} a tick of capacity. What ` +
            `does your policy do when it hits?`
          }
          options={PREDICT_OPTIONS}
          onReveal={(id) => {
            setPredicted(id);
            fireA();
          }}
        >
          {(picked) => (
            <>
              <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
                you predicted · {PREDICT_OPTIONS.find((o) => o.id === picked)?.label}
              </span>
              <p style={{ margin: 0 }}>
                <strong>{OPENERS[picked][aStorm.phase]}</strong> {argueOutcome(aStorm)}
              </p>
            </>
          )}
        </Commit>
      ) : (
        <>
          <div className="mh-feedback">
            <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
              you predicted · {predictedLabel} — the chart shows your latest run
            </span>
            <p style={{ margin: 0 }}>
              <strong>{OPENERS[predicted][aStorm.phase]}</strong> {argueOutcome(aStorm)}
            </p>
          </div>
          <div className="mh-controls" role="group" aria-label="Sandbox: re-run the spike">
            <button
              type="button"
              className="mh-btn mh-btn-primary"
              onClick={() => fireA()}
              disabled={aSweeping}
              aria-label="Run the spike against the current dial settings"
            >
              Run the spike
            </button>
            <button
              type="button"
              className="mh-chip"
              onClick={() => {
                setMr(STORM_POLICY_DEFAULTS.maxRetries);
                setBo(STORM_POLICY_DEFAULTS.backoffMs);
                fireA({
                  maxRetries: STORM_POLICY_DEFAULTS.maxRetries,
                  backoffMs: STORM_POLICY_DEFAULTS.backoffMs,
                });
              }}
              disabled={aSweeping}
              aria-label="Put the shipped policy back on the chart: 5 retries, 100 milliseconds"
            >
              the shipped policy (5 × 100 ms)
            </button>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>
              sandbox · the committed argument above follows the chart
            </span>
          </div>
        </>
      )}

      {predicted !== null ? (
        <Commit
          prompt={
            `Back to the shipped run this bench opened with. Retry pressure crossed 1.0 at ` +
            `tick ${CROSS_TICK}, one tick into the spike; the spike itself lasted ` +
            `${SPIKE_TICKS} ticks and ended at tick ${SPIKE_END}. ` +
            `${LAST - SPIKE_END} ticks later the load is still ${END_LOAD} a tick against a ` +
            `${CAPACITY}-a-tick service — success holding at ${END_SUCCESS}%. Capacity never ` +
            `changed. What is that load made of?`
          }
          options={EXPLAIN_OPTIONS}
        >
          {(picked) => (
            <>
              <p style={{ marginTop: 0 }}>{EXPLAIN_FEEDBACK[picked]}</p>
              <p style={{ marginBottom: 0 }}>
                <strong>This has a name: emergent runaway</strong>{' '}
                <Badge
                  layer="W"
                  note="§2.9 — the emergent death spiral; a reinforcing signal without counter-force"
                />{' '}
                — a reinforcing signal without counter-force. The handbook lists the skins it wears:
                retry storms, agents citing each other until ungrounded claims look well-grounded,
                recommendation loops narrowing onto local optima, evaluators drifting toward surface
                features. Phase C runs two of those skins on this exact engine. First: the same
                storm with its outside reference severed, four lamps, and the levers that work.
              </p>
            </>
          )}
        </Commit>
      ) : null}

      {/* ════ Phase B ════ */}
      <PhaseHead title="Phase B — read the lamps, then touch the terrain">
        The same storm, re-run with one honest difference: this console's success number is the
        system's own report. The engine logged the cut as its first event — read the feed. The
        handbook's healthy-vs-runaway table{' '}
        <Badge layer="W" note="§2.9: decay, variety, outside reference, net behavior" /> is wired to
        the run as four lamps. Remedies apply at the current tick; everything before replays
        exactly.
      </PhaseHead>

      <StormChart storm={bStorm} upto={bUpto} />
      <BeliefStrip storm={bStorm} upto={bUpto} />
      <p
        className="mono"
        aria-live="polite"
        style={{ fontSize: '11.5px', color: 'var(--ink-faint)', margin: '4px 0 8px' }}
      >
        {bSweeping ? 'running…' : tickStatus(bStorm, bLen)}
      </p>

      <LampBoard storm={bStorm} upto={bUpto} />

      <div style={{ margin: '14px 0' }}>
        <button
          type="button"
          className="mh-btn mh-btn-danger"
          style={{ fontSize: '13px', letterSpacing: '0.16em', padding: '12px 26px' }}
          onClick={() => applyB('restart-agent')}
          disabled={restartUsed || bSweeping}
          aria-label="Restart the agent. This is the agent lever, and it is about to fail."
        >
          RESTART THE AGENT
        </button>
        {restartUsed ? (
          <>
            <p
              style={{
                fontStyle: 'italic',
                color: 'var(--ink)',
                margin: '8px 0 0',
                fontSize: '15px',
              }}
            >
              The problem is in the terrain, not in any individual agent.
            </p>
            <p
              className="mono"
              style={{ fontSize: '11px', color: 'var(--ink-faint)', margin: '4px 0 0' }}
            >
              {REMEDY_NOTES['restart-agent']}
            </p>
          </>
        ) : (
          <p
            className="mono"
            style={{ fontSize: '11px', color: 'var(--ink-faint)', margin: '6px 0 0' }}
          >
            the one lever this book never gives you. here it is. it works once, on one tick.
          </p>
        )}
      </div>

      {diagnosed === null ? (
        <Commit
          prompt="Four lamps, all dark. Commit a diagnosis before the remedy palette opens: what kind of problem is this?"
          options={DIAGNOSIS_OPTIONS}
          onReveal={setDiagnosed}
        >
          {(picked) => <p style={{ margin: 0 }}>{DIAGNOSIS_FEEDBACK[picked]}</p>}
        </Commit>
      ) : (
        <div className="mh-feedback">
          <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
            your diagnosis · {DIAGNOSIS_OPTIONS.find((o) => o.id === diagnosed)?.label}
          </span>
          <p style={{ margin: 0 }}>{DIAGNOSIS_FEEDBACK[diagnosed]}</p>
        </div>
      )}

      <div className="mh-controls" role="group" aria-label="The remedy palette, all terrain-shaped">
        <span className="mh-kicker">Remedy palette</span>
        {REMEDY_PALETTE.map((r) => (
          <button
            key={r.id}
            type="button"
            className="mh-chip"
            onClick={() => applyB(r.id)}
            disabled={!paletteOpen || appliedB.includes(r.id) || bSweeping}
            title={paletteOpen ? r.sub : 'commit a diagnosis first'}
            aria-label={`${r.label} — ${r.sub}`}
            aria-pressed={appliedB.includes(r.id)}
          >
            {r.label}
          </button>
        ))}
        {!paletteOpen ? (
          <button
            type="button"
            onClick={() => setGateOpen(true)}
            className="mono"
            style={quietLinkStyle}
          >
            the palette opens on a committed diagnosis — show me anyway
          </button>
        ) : null}
        <button
          type="button"
          className="mh-btn"
          onClick={resetB}
          disabled={bSweeping || bStorm === SEVERED}
          aria-label="Reset the storm to tick zero, severed, no remedies applied"
        >
          Reset the storm
        </button>
      </div>

      {bStorm.remedies.length ? (
        <ul style={{ margin: '8px 0', paddingLeft: 18, fontSize: '13.5px', color: 'var(--ink-2)' }}>
          {bStorm.remedies.map((r) => (
            <li key={`${r.remedy}-${r.at}`} style={{ margin: '4px 0' }}>
              <strong>
                {REMEDY_PALETTE.find((p) => p.id === r.remedy)?.label ?? 'restart the agent'}
              </strong>{' '}
              at tick {r.at} — {REMEDY_NOTES[r.remedy]}
            </li>
          ))}
        </ul>
      ) : null}

      <div
        className="mh-artifact"
        role="log"
        aria-label="Engine event feed for the severed storm"
        style={{ padding: '8px 12px', maxHeight: 150, overflowY: 'auto' }}
      >
        {bStorm.events.map((e, i) => (
          <div key={i} style={{ padding: '1px 0', color: 'var(--ink-2)' }}>
            {e}
          </div>
        ))}
      </div>

      {/* ════ Phase C ════ */}
      <PhaseHead title="Phase C — the same engine, two more skins">
        Nothing below is a new simulation. Both runs are the Phase B series, seed {SEED},
        re-captioned; the dials are identical because the dynamics are identical. Step either one
        and read the dial against the captions.
      </PhaseHead>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 14,
          margin: '12px 0',
        }}
      >
        <div>
          <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
            Re-skin 1 · agents citing agents
          </span>
          <Walkthrough trace={CITE_TRACE} renderStep={(step) => <PhaseDial step={step} />} />
        </div>
        <div>
          <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
            Re-skin 2 · eval drift
          </span>
          <Walkthrough trace={EVAL_TRACE} renderStep={(step) => <PhaseDial step={step} />} />
        </div>
      </div>

      <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '10px 0 0' }}>
        One parameter family under every runaway you will ever see. The nouns change; the lamp board
        does not.
      </p>
    </LabFrame>
  );
}
