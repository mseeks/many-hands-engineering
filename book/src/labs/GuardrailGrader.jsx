// GuardrailGrader.jsx — LAB 11·A, the Guardrail Grader (Ch 11, DESIGN §6.6).
//
// Six guardrails, four classes, one recorded failure storm. The schema gate
// arrives pre-graded as the worked row; the reader commits a five-axis
// report card for the other four (Commit, no reveal without it), runs the
// seeded storm, and reads predicted-vs-measured side by side. The planted
// trick is structural, not behavioral: the circuit breaker's health probe
// is served by the very service it breaks against, so it holds closed
// through the harm window and trips on the drain — captioned live, in the
// storm strip, at the moment it fails.
//
// Mechanism register: every grade is measured from the storm log by
// guardrails.js; nothing on this page asserts a number the engine did not
// record. Seed 11, deterministic forever.

import { useEffect, useState } from 'react';
import { Badge, Commit, LabFrame, Mark, glassSlice } from '../components/kit.jsx';
import { usePrefersReducedMotion } from '../shared/usePrefersReducedMotion.js';
import { gradeStorm, inventory, simulateStorm } from '../engine/guardrails.js';
import guardrailsRaw from '../engine/guardrails.js?raw';

/* ── The recorded storm (module-level: same seed, same grades, forever) ── */

const SEED = 11;
const STORM = simulateStorm(SEED);
const GRADES = gradeStorm(SEED);
const INVENTORY = inventory();
const GRADE = Object.fromEntries(GRADES.map((g) => [g.id, g]));
const TICKS = STORM.ticks;
const LAST = TICKS.length - 1;

const sumBy = (field) => TICKS.reduce((acc, k) => acc + field(k), 0);
const MALFORMED = sumBy((k) => k.malformed); // 79, all blocked at the schema
const DEFECTS = sumBy((k) => k.defects); // 42 cross the review gate
const CAUGHT = sumBy((k) => k.defectsCaught); // 1, by luck
const PROPOSALS = sumBy((k) => k.proposals);
const PEAK_X = (
  Math.max(...TICKS.filter((k) => k.inStorm).map((k) => k.load)) / STORM.historicPeak
).toFixed(1); // 3.9x: painful, nowhere near 10x
const EXCESS = GRADE['rate-limit'].axes.blastRadius.toLocaleString('en-US');
const BREAKER_TRIP = TICKS.find((k) => k.breakerOpen).t; // 40: after the storm
const MONITOR_PAGE = TICKS.find((k) => k.inStorm && k.monitorFired).t; // 23
const SPURIOUS_T = TICKS.find((k) => k.monitorFired && k.t < STORM.stormStart).t; // 12
const BLIP = STORM.blipAt; // the benign deploy wobble, ticks 9-12
const STORM_LABEL = `${STORM.stormStart}–${STORM.stormEnd - 1}`;

const GLASS = [
  glassSlice(guardrailsRaw, 'export function simulateStorm', '\n}'),
  glassSlice(guardrailsRaw, 'function gradeCircuitBreaker', '\n}'),
].join('\n\n// ── and how the planted flaw grades out ──\n\n');

/* ── The four classes, each answering its own question (§2.10) ─────────── */

const CLASS_QUESTION = {
  structural: 'Can this even happen?',
  reactive: 'Did this just happen, and should it continue?',
  dynamic: 'Is the system drifting?',
  reflective: 'Are our guardrails still working?',
};

/* ── The predictions: four report cards, committed before the storm ────── */

// Each option is a five-axis profile in one breath; `measured` names the
// profile the storm log supports. The feedback never says "wrong" — it
// argues the gap axis by axis, in the framework's vocabulary.
const PREDICTIONS = [
  {
    id: 'review-gate',
    prompt:
      'First call: the review gate, running 95% approval, quality-blind. Its claim: nothing ' +
      'defective gets through. The report card?',
    options: [
      {
        id: 'claim',
        label:
          'High coverage at zero latency: every change is reviewed before merge, so most ' +
          'defects die at the gate.',
      },
      {
        id: 'stamp',
        label:
          'Near-zero coverage at zero latency: 95% approval catches defects by luck, and most ' +
          'rejections hit fine changes.',
      },
      {
        id: 'noisy',
        label:
          'Middling coverage, high false positives: it catches maybe half, rejecting good work ' +
          'along the way.',
      },
    ],
    measured: 'stamp',
    stake:
      `Committed. ${PROPOSALS} proposals cross this gate in the recorded run, ${DEFECTS} of ` +
      `them carrying defects. Coverage is measured against those ${DEFECTS}. Watch the gate's ` +
      `lane for what merges anyway.`,
    gap: {
      claim:
        `You graded the claim; the axes split it. Latency 0 was real — the gate decides at ` +
        `merge time. Coverage was not: a gate that approves 95% blind to content has no ` +
        `mechanism left for catching, so 1 in 20 is the arithmetic, and this storm rolled ` +
        `${CAUGHT} in ${DEFECTS}.`,
      stamp:
        'The storm agrees. Note which axis carried the diagnosis: not latency, which was ' +
        'perfect, but coverage measured against its own failure class.',
      noisy:
        `Right about the false positives: 0.89 measured, eight of its nine rejections spent on ` +
        `fine changes. But coverage measured 0.02, not half. A quality-blind 95% leaves nothing ` +
        `for attention to be noisy about; catching was luck, once in ${DEFECTS} chances.`,
    },
  },
  {
    id: 'rate-limit',
    prompt:
      'The rate limit, set at ten times the historic peak. Its claim: caps any surge before it ' +
      'can overwhelm the service. The report card?',
    options: [
      {
        id: 'early',
        label:
          'Good coverage, a tick or two of latency: the surge crosses the line early and gets ' +
          'clamped.',
      },
      {
        id: 'late',
        label:
          'Late but real: it fires once the storm builds toward peak, with a high blast radius ' +
          'before it bites.',
      },
      {
        id: 'never',
        label:
          'Zero coverage, null latency: real overloads hurt at 3–4x peak, so a 10x limit ' +
          'never fires.',
      },
    ],
    measured: 'never',
    stake:
      `Committed. The limit sits at ${STORM.rateLimit.toLocaleString('en-US')} requests a tick, ` +
      `ten times the historic peak of ${STORM.historicPeak}. Watch where the storm actually ` +
      `tops out.`,
    gap: {
      early:
        `It never got the chance. The storm topped out at ${PEAK_X}x the historic peak; the ` +
        `line it watches sits at 10x. Coverage 0, latency null: a threshold its own failure ` +
        `class cannot reach.`,
      late:
        `Not late — never. ${PEAK_X}x peak hurt plenty, and 10x never arrived. The blast radius ` +
        `you predicted is right in spirit (${EXCESS} excess requests served), but nothing ever ` +
        `bit.`,
      never:
        'The storm agrees: zero firings, and nothing even to false-positive on. A guardrail ' +
        'that cannot fire cannot earn its keep; it can only decorate the config.',
    },
  },
  {
    id: 'circuit-breaker',
    prompt:
      'The circuit breaker. Its claim: opens the moment the error rate degrades. Its health ' +
      'probe is served by the service it breaks against. The report card?',
    options: [
      {
        id: 'early',
        label:
          'Opens within a tick or two of the storm: low latency, most of the harm window ' +
          'isolated.',
      },
      {
        id: 'blind',
        label:
          'Holds closed through the whole storm and trips after: the probe dies with the ' +
          'service, so it reads calm exactly when it matters.',
      },
      {
        id: 'flap',
        label:
          'Opens, but flaps: it trips on the benign wobble too, paying a false-positive tax ' +
          'all run.',
      },
    ],
    measured: 'blind',
    stake:
      `Committed. Hold one line from the inventory in mind through ticks ${STORM_LABEL}: the ` +
      `health probe that feeds this breaker is served by the service it breaks against.`,
    gap: {
      early:
        `That grade needs a probe that survives the storm. This one rides the guarded service: ` +
        `when the service saturated at tick ${STORM.stormStart} the reading froze at calm, so ` +
        `latency measured 20 ticks — the exact length of the harm window.`,
      blind:
        'The storm agrees. The flaw was readable in the inventory line before a single tick ' +
        'ran: this is the structural grade, the one no amount of calm-weather passing can ' +
        'change.',
      flap:
        `It cannot flap; it cannot even see. The wobble stayed under its 0.20 threshold, and ` +
        `during the storm the probe was dark, so its one firing came at tick ${BREAKER_TRIP}, ` +
        `on the drain. False-positive rate 1.0 — after the fact, not too often.`,
    },
  },
  {
    id: 'drift-monitor',
    prompt:
      'The error-budget drift monitor: pages when the trailing four-tick burn stays above the ' +
      'bar, read from the metrics pipeline. The report card?',
    options: [
      {
        id: 'pattern',
        label:
          'High coverage a few ticks late, plus a spurious page on the wobble: pattern ' +
          'coverage, paid for in pages.',
      },
      {
        id: 'fate',
        label:
          'Blind in the storm: the pipeline saturates with the service, so it pages only after ' +
          'the drain.',
      },
      {
        id: 'instant',
        label:
          'Single-tick latency, clean pages: the burn crosses the bar and the page lands ' +
          'immediately.',
      },
    ],
    measured: 'pattern',
    stake:
      `Committed. Its window needs four straight ticks above the bar before it pages. Watch ` +
      `the wobble at ticks ${BLIP}–${BLIP + 3} as well as the storm front.`,
    gap: {
      pattern:
        'The storm agrees, tax included: one of its two episodes was the benign wobble, and ' +
        'every spurious page trains the operator who must answer the real one.',
      fate:
        `The shared fate belongs to the breaker. The monitor reads the metrics pipeline, which ` +
        `stayed up, so it paged 3 ticks into the storm and held on through the drain. Its real ` +
        `tax is the spurious page at tick ${SPURIOUS_T}.`,
      instant:
        `The window is the price of the pattern: four ticks to fill, so the page landed at ` +
        `tick ${MONITOR_PAGE}. The same window paged once on the benign wobble; single-tick ` +
        `paging would have cried wolf far more often.`,
    },
  },
];

/* ── Axis display: five stats per row, units named per card ────────────── */

const CARD_META = {
  'schema-gate': { blastUnit: 'writes landed', recoveryUnit: 'cleanup', latNull: '—' },
  'review-gate': {
    blastUnit: 'defects merged',
    recoveryUnit: 'reverts + reviews',
    latNull: '—',
  },
  'rate-limit': { blastUnit: 'excess requests', recoveryUnit: 'elevated ticks', latNull: 'never' },
  'circuit-breaker': {
    blastUnit: 'storm ticks unisolated',
    recoveryUnit: 'resets + blocked ticks',
    latNull: '—',
  },
  'drift-monitor': {
    blastUnit: 'unflagged drift ticks',
    recoveryUnit: 'dead-end pages',
    latNull: '—',
  },
  'gameday-probe': {
    blastUnit: 'guardrails failed live',
    recoveryUnit: 'one afternoon',
    latNull: 'never ran',
  },
};

const covCls = (v) => (v >= 0.9 ? 'good' : v < 0.3 ? 'bad' : 'warn');
const fprCls = (v) => (v > 0.5 ? 'bad' : v > 0.2 ? 'warn' : 'good');
const latCls = (v) => (v === null ? 'bad' : v === 0 ? 'good' : v >= 10 ? 'bad' : 'warn');

function AxesStrip({ id, axes }) {
  const meta = CARD_META[id];
  const stats = [
    { k: 'coverage', v: axes.coverage.toFixed(2), cls: covCls(axes.coverage) },
    {
      k: 'latency',
      v: axes.latency === null ? meta.latNull : `${axes.latency}t`,
      cls: latCls(axes.latency),
    },
    { k: `blast · ${meta.blastUnit}`, v: String(axes.blastRadius), cls: '' },
    {
      k: 'false-positive',
      v: axes.falsePositiveRate.toFixed(2),
      cls: fprCls(axes.falsePositiveRate),
    },
    { k: `recovery · ${meta.recoveryUnit}`, v: String(axes.recoveryCost), cls: '' },
  ];
  return (
    <div className="mh-readout" role="group" aria-label="Measured five-axis grade">
      {stats.map((s) => (
        <div className="mh-stat" key={s.k}>
          <span className="k">{s.k}</span>
          <span className={s.cls ? `v ${s.cls}` : 'v'}>{s.v}</span>
        </div>
      ))}
    </div>
  );
}

/* ── The storm strip: weather on top, one firing lane per guardrail ────── */

// Cell grammar, one color per meaning: accent = fired on real harm,
// amber = fired spuriously, red = harm in its own failure class landing
// unhandled that tick.
function cellState(id, k) {
  switch (id) {
    case 'schema-gate':
      return k.malformed > 0 ? 'fired' : null;
    case 'review-gate':
      if (k.defects - k.defectsCaught > 0) return 'harm';
      if (k.defectsCaught > 0) return 'fired';
      if (k.cleanRejected > 0) return 'spurious';
      return null;
    case 'rate-limit':
      if (k.limitFired) return 'fired';
      return k.inStorm ? 'harm' : null;
    case 'circuit-breaker':
      if (k.inStorm) return 'harm';
      return k.breakerOpen ? 'spurious' : null;
    case 'drift-monitor':
      if (k.inStorm) return k.monitorFired ? 'fired' : 'harm';
      if (k.monitorFired) return k.t < STORM.stormStart ? 'spurious' : 'fired';
      return null;
    default:
      return null; // the game-day lane: it never ran
  }
}

const CELL_FILL = {
  fired: 'var(--accent)',
  spurious: 'var(--amber)',
  harm: 'var(--red)',
};

const LANES = [
  { id: 'schema-gate', label: 'schema gate', annot: `all ${MALFORMED} blocked` },
  { id: 'review-gate', label: 'review gate · 95%', annot: `${CAUGHT} of ${DEFECTS} caught` },
  { id: 'rate-limit', label: 'rate limit · 10x', annot: 'never fired' },
  {
    id: 'circuit-breaker',
    label: 'circuit breaker',
    annot: `held closed · tripped t${BREAKER_TRIP}`,
    annotColor: 'var(--red)',
  },
  {
    id: 'drift-monitor',
    label: 'drift monitor',
    annot: `paged t${MONITOR_PAGE} · 1 spurious`,
  },
  { id: 'gameday-probe', label: 'game-day drill', annot: 'never ran · drill overdue' },
];

// Strip geometry (SVG user units).
const X0 = 128; // first cell's left edge
const CELL_W = 8.7; // tick pitch
const CW = 7.4; // drawn cell width
const W = 760;
const WEATHER_TOP = 16;
const WEATHER_H = 62;
const WEATHER_BASE = WEATHER_TOP + WEATHER_H;
const LANE_TOP = 96;
const LANE_H = 17;
const LANE_CELL_H = 11;
const H = LANE_TOP + LANES.length * LANE_H + 18;
const E_MAX = 0.65; // error-rate scale ceiling

const x = (t) => X0 + t * CELL_W;
const yE = (v) => WEATHER_BASE - (Math.min(v, E_MAX) / E_MAX) * WEATHER_H;

function StormStrip({ t }) {
  const breakerLaneTop = LANE_TOP + 3 * LANE_H;
  const errorPoints = TICKS.slice(0, t + 1)
    .map((k) => `${(x(k.t) + CW / 2).toFixed(1)},${yE(k.errorRate).toFixed(1)}`)
    .join(' ');
  const ariaLabel =
    `One recorded failure storm, sixty ticks, harm at ticks ${STORM_LABEL}, one firing lane ` +
    `per guardrail. The schema gate blocks all ${MALFORMED} malformed writes at write time. ` +
    `The review gate catches ${CAUGHT} of ${DEFECTS} defects. The rate limit never fires: the ` +
    `storm peaks at ${PEAK_X} times the historic peak, far under its 10x threshold. The ` +
    `circuit breaker holds closed through every storm tick, because its health probe is served ` +
    `by the saturated service, and trips only at tick ${BREAKER_TRIP}, after the storm. The ` +
    `drift monitor pages from tick ${MONITOR_PAGE} through the drain, plus one spurious page ` +
    `at tick ${SPURIOUS_T} on a benign deploy wobble. The game-day lane is empty: the drill ` +
    `never ran.`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel}
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        background: 'var(--paper)',
        border: '1px solid var(--line-soft)',
        borderRadius: 4,
      }}
    >
      {/* The storm band and the benign wobble, shaded across every lane */}
      <rect
        x={x(STORM.stormStart)}
        y={WEATHER_TOP - 6}
        width={(STORM.stormEnd - STORM.stormStart) * CELL_W}
        height={H - WEATHER_TOP - 8}
        fill="var(--red)"
        opacity="0.07"
      />
      <rect
        x={x(BLIP)}
        y={WEATHER_TOP - 6}
        width={4 * CELL_W}
        height={WEATHER_H + 6}
        fill="var(--amber)"
        opacity="0.09"
      />
      <text
        x={x(STORM.stormStart) + ((STORM.stormEnd - STORM.stormStart) * CELL_W) / 2}
        y={WEATHER_TOP - 9}
        textAnchor="middle"
        fontSize="8.5"
        fill="var(--red)"
        opacity="0.85"
        fontFamily="var(--font-mono)"
      >
        storm · ticks {STORM_LABEL}
      </text>
      <text
        x={x(BLIP) + 2 * CELL_W}
        y={WEATHER_TOP + 8}
        textAnchor="middle"
        fontSize="8.5"
        fill="var(--amber)"
        fontFamily="var(--font-mono)"
      >
        wobble
      </text>

      {/* Weather: the service's true error rate, with both thresholds */}
      <text
        x={X0 - 6}
        y={WEATHER_TOP + WEATHER_H / 2}
        textAnchor="end"
        fontSize="9"
        fill="var(--ink-2)"
        fontFamily="var(--font-mono)"
      >
        error rate
      </text>
      {[
        { v: 0.2, color: 'var(--red)', label: 'breaker 0.20' },
        { v: 0.1, color: 'var(--amber)', label: 'monitor 0.10' },
      ].map((th) => (
        <g key={th.v}>
          <line
            x1={X0}
            x2={x(LAST) + CW}
            y1={yE(th.v)}
            y2={yE(th.v)}
            stroke={th.color}
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.55"
          />
          <text
            x={x(LAST) + CW + 6}
            y={yE(th.v) + 3}
            fontSize="8.5"
            fill={th.color}
            fontFamily="var(--font-mono)"
          >
            {th.label}
          </text>
        </g>
      ))}
      <polyline
        points={errorPoints}
        fill="none"
        stroke="var(--ink-2)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Playhead */}
      <line
        x1={x(t) + CW}
        x2={x(t) + CW}
        y1={WEATHER_TOP - 6}
        y2={LANE_TOP + LANES.length * LANE_H - 4}
        stroke="var(--accent)"
        strokeWidth="1"
        opacity="0.55"
      />

      {/* One lane per guardrail */}
      {LANES.map((lane, i) => {
        const top = LANE_TOP + i * LANE_H;
        return (
          <g key={lane.id}>
            <text
              x={X0 - 6}
              y={top + 9}
              textAnchor="end"
              fontSize="9"
              fill="var(--ink-2)"
              fontFamily="var(--font-mono)"
            >
              {lane.label}
            </text>
            {TICKS.map((k) => {
              const state = cellState(lane.id, k);
              const seen = k.t <= t;
              return (
                <rect
                  key={k.t}
                  x={x(k.t)}
                  y={top}
                  width={CW}
                  height={LANE_CELL_H}
                  rx="1"
                  fill={seen && state ? CELL_FILL[state] : 'var(--line-soft)'}
                  opacity={seen && state ? 0.9 : 0.4}
                />
              );
            })}
            {t === LAST ? (
              <text
                x={x(LAST) + CW + 6}
                y={top + 9}
                fontSize="8.5"
                fill={lane.annotColor ?? 'var(--ink-faint)'}
                fontFamily="var(--font-mono)"
              >
                {lane.annot}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* The planted flaw, captioned where it fails */}
      {t >= STORM.stormStart + 8 ? (
        <text
          x={x(STORM.stormStart) + ((STORM.stormEnd - STORM.stormStart) * CELL_W) / 2}
          y={breakerLaneTop - 2.5}
          textAnchor="middle"
          fontSize="8.5"
          fill="var(--red)"
          fontFamily="var(--font-mono)"
        >
          held closed · probe dark
        </text>
      ) : null}

      {/* Tick axis */}
      {[0, STORM.stormStart, STORM.stormEnd, LAST].map((tk) => (
        <text
          key={tk}
          x={x(tk) + CW / 2}
          y={H - 4}
          textAnchor="middle"
          fontSize="8.5"
          fill="var(--ink-faint)"
          fontFamily="var(--font-mono)"
        >
          t{tk}
        </text>
      ))}
    </svg>
  );
}

/* ── Phase captions: the storm narrated at the playhead ────────────────── */

function phaseCaption(t) {
  if (t >= STORM.stormEnd + 2)
    return (
      `Sixty ticks, recorded. The schema gate blocked all ${MALFORMED} malformed writes. The ` +
      `95% gate caught ${CAUGHT} of ${DEFECTS} defects. The 10x limit never fired. The breaker ` +
      `held closed through the whole storm and tripped at tick ${BREAKER_TRIP}, after it. The ` +
      `monitor paged at tick ${MONITOR_PAGE}, and once on a wobble.`
    );
  if (t >= STORM.stormEnd)
    return (
      `The storm passes and the backlog drains. The probe comes back with the service, reads ` +
      `the drain, and the breaker finally trips: tick ${BREAKER_TRIP}, its only firing of the ` +
      `run, after the harm is over.`
    );
  if (t >= MONITOR_PAGE)
    return (
      `Deep storm. The drift monitor reads the metrics pipeline, which is still up, so it ` +
      `paged at tick ${MONITOR_PAGE} and stays on it. The breaker still reads calm: its probe ` +
      `is served by the saturated service. It holds closed.`
    );
  if (t >= STORM.stormStart)
    return (
      `Tick ${STORM.stormStart}: the storm. Load runs ${PEAK_X}x the historic peak, enough to ` +
      `saturate the service and nowhere near a limit set at 10x. The service takes the ` +
      `breaker's health probe down with it; the last reading was calm, so the breaker holds ` +
      `closed.`
    );
  if (t >= BLIP + 4)
    return (
      `Calm again. One page triaged to nothing. Every claim in the inventory is still ` +
      `untested; the storm lands at tick ${STORM.stormStart}.`
    );
  if (t >= BLIP + 3)
    return (
      `The wobble fills the monitor's four-tick window and it pages: tick ${SPURIOUS_T}. ` +
      `Benign, this time. The page triages to nothing, and triaging it cost someone attention.`
    );
  if (t >= BLIP)
    return (
      `A deploy settles: a benign error wobble, ticks ${BLIP}–${BLIP + 3}. Over the ` +
      `monitor's 0.10 bar, under the breaker's 0.20 threshold.`
    );
  return (
    `Calm weather. Load idles under the historic peak of ${STORM.historicPeak}; the error ` +
    `rate sits under 0.04. The storm lands at tick ${STORM.stormStart}.`
  );
}

/* ── Predicted vs measured: one card per graded row ────────────────────── */

function GradeCard({ id, picked }) {
  const inv = INVENTORY.find((g) => g.id === id);
  const grade = GRADE[id];
  const prediction = PREDICTIONS.find((p) => p.id === id);
  const pickedLabel = prediction?.options.find((o) => o.id === picked)?.label;
  return (
    <div
      style={{
        border: '1px solid var(--line-soft)',
        borderRadius: 4,
        background: 'var(--paper)',
        padding: '12px 14px',
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <strong style={{ fontSize: '15px' }}>{inv.name}</strong>
        <span className="mh-kicker" title={CLASS_QUESTION[inv.cls]}>
          {inv.cls}
        </span>
      </div>
      {pickedLabel ? (
        <p
          className="mono"
          style={{ margin: '6px 0 2px', fontSize: '12px', color: 'var(--amber)' }}
        >
          your call · {pickedLabel}
        </p>
      ) : (
        <p
          className="mono"
          style={{ margin: '6px 0 2px', fontSize: '12px', color: 'var(--ink-faint)' }}
        >
          no prediction asked · graded against the table itself
        </p>
      )}
      <AxesStrip id={id} axes={grade.axes} />
      <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--ink-2)' }}>
        <span className="mh-kicker" style={{ display: 'block', marginBottom: 2 }}>
          the storm's argument
        </span>
        {grade.verdict}
      </p>
      {prediction && picked ? (
        <div className="mh-feedback" style={{ marginTop: 8 }}>
          {prediction.gap[picked]}
        </div>
      ) : null}
    </div>
  );
}

/* ── The lab ───────────────────────────────────────────────────────────── */

const SectionKicker = ({ children }) => (
  <span className="mh-kicker" style={{ display: 'block', margin: '18px 0 8px' }}>
    {children}
  </span>
);

export default function GuardrailGrader() {
  const reduced = usePrefersReducedMotion();
  // Legible at rest: the strip mounts on the storm's final, fully-graded frame.
  const [t, setT] = useState(LAST);
  const [playing, setPlaying] = useState(false);
  const [picks, setPicks] = useState({});
  const [graded, setGraded] = useState(false);

  const committedCount = PREDICTIONS.filter((p) => picks[p.id]).length;
  const allCommitted = committedCount === PREDICTIONS.length;

  useEffect(() => {
    if (!playing) return undefined;
    if (t >= LAST) {
      setPlaying(false);
      setGraded(true); // the sweep only starts once all four calls are in
      return undefined;
    }
    const timer = setTimeout(() => setT((v) => Math.min(LAST, v + 1)), 110);
    return () => clearTimeout(timer);
  }, [playing, t]);

  const runStorm = () => {
    if (!allCommitted) return;
    if (reduced) {
      // Reduced motion: no sweep; land on the final frame and grade.
      setT(LAST);
      setGraded(true);
      return;
    }
    setT(0);
    setPlaying(true);
  };
  const step = () => {
    setPlaying(false);
    setT((v) => Math.min(LAST, v + 1));
  };
  const reset = () => {
    setPlaying(false);
    setT(0);
  };

  return (
    <LabFrame
      tag="LAB 11·A — THE GUARDRAIL GRADER"
      register="mechanism"
      question="Six guardrails stand between this terrain and a bad week, each with a story about what it stops. Call each one's five-axis grade before the storm runs; then let one recorded storm grade them back. How many are doing what their claim says?"
      payoff={
        <>
          Grading reveals guardrails doing less than they appear to.{' '}
          <Badge layer="W" note="§2.10 — the grading exercise, run against one recorded storm" /> In
          this storm the review gate running 95% approval caught {CAUGHT} of {DEFECTS} seeded
          defects: a rubber stamp. The rate limit set at 10x peak never fired against a storm that
          hurt at {PEAK_X}x: decorative. And the circuit breaker whose health probe rides the
          service it guards held closed through all 20 storm ticks, tripping at tick {BREAKER_TRIP}{' '}
          on the drain: blind exactly when it mattered, because a guardrail must not depend on the
          thing it guards. The rows that held were the schema gate ({MALFORMED} malformed writes
          dead at write time) and the drift monitor (paging 3 ticks in, at the price of one spurious
          page). The gap between claimed and measured is the chapter.
        </>
      }
      notes={[
        `Same seed, same storm, forever: seed ${SEED}, sixty ticks, harm at ticks ${STORM_LABEL}, replayed from a recorded log. The grader measures the log; it never re-rolls the dice.`,
        'Tuned constants set the shapes: the storm runs 3-4x the historic peak (real overloads hurt long before 10x), the breaker trips above a 0.20 error rate, the monitor pages on four straight ticks above 0.10, and the gate approves 95% regardless of content. Real storms and real reviewers are messier on every axis.',
        'The review gate is modeled as a quality-blind coin, the rubber-stamp claim in its purest form. It says nothing about what attentive review catches; the steward chapter takes up the reviewer.',
        'Axis units vary by row and are named on each card: blast radius counts merged defects for the gate, excess requests for the limit, unisolated ticks for the breaker. Each guardrail is graded against its own failure class, never against another row.',
        'Which broken guardrails a game day would have caught (the decorative limit and the blind breaker, not the stamp) is a modeling choice Ⓦ: a drill rehearses structure and configuration, not reviewer attention.',
      ]}
      cannotShow="your guardrails' grades. The constants here were chosen so the failure modes are findable in one sitting; nothing predicts a real breaker's threshold, a real limit's ceiling, or a real gate's catch rate. The five axes transfer. The numbers do not. Grading your own inventory against your own storms is the exercise."
      glass={GLASS}
    >
      {/* 1 · the inventory: what each guardrail claims */}
      <SectionKicker>
        1 · The inventory · what each guardrail claims{' '}
        <Mark kind="made" note="composite terrain; the claims are typical, not quoted" />
      </SectionKicker>
      <table className="mh-table" style={{ margin: '0 0 6px' }}>
        <thead>
          <tr>
            <th>Guardrail</th>
            <th>Class</th>
            <th>The claim</th>
          </tr>
        </thead>
        <tbody>
          {INVENTORY.map((g) => (
            <tr key={g.id}>
              <td style={{ color: 'var(--ink)' }}>{g.name}</td>
              <td>
                <span className="mono" title={CLASS_QUESTION[g.cls]} style={{ cursor: 'help' }}>
                  {g.cls}
                </span>
              </td>
              <td>{g.claimed}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 2 · the worked row: what a five-axis grade looks like */}
      <SectionKicker>2 · The worked row · the schema gate, graded for you</SectionKicker>
      <div
        style={{
          border: '1px solid var(--line-soft)',
          borderRadius: 4,
          background: 'var(--paper)',
          padding: '12px 14px',
        }}
      >
        <AxesStrip id="schema-gate" axes={GRADE['schema-gate'].axes} />
        <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--ink-2)' }}>
          {GRADE['schema-gate'].verdict}
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '13.5px', color: 'var(--ink)' }}>
          That is a grade where the claim survives measurement. Now call the next four yourself,
          before the storm calls them for you.
        </p>
      </div>

      {/* 3 · the four committed report cards */}
      <SectionKicker>
        3 · Your calls · five axes each, committed before the storm runs
      </SectionKicker>
      {PREDICTIONS.map((p) => (
        <Commit
          key={p.id}
          prompt={p.prompt}
          options={p.options}
          onReveal={(id) => setPicks((prev) => ({ ...prev, [p.id]: id }))}
        >
          {() => p.stake}
        </Commit>
      ))}

      {/* 4 · the storm */}
      <SectionKicker>
        4 · The storm · seed {SEED} · 60 ticks · harm at {STORM_LABEL}
      </SectionKicker>
      <div
        className="mono"
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          fontSize: '11px',
          color: 'var(--ink-2)',
          margin: '0 0 8px',
        }}
        aria-hidden="true"
      >
        {[
          { fill: CELL_FILL.fired, label: 'fired, on real harm' },
          { fill: CELL_FILL.spurious, label: 'fired, spurious' },
          { fill: CELL_FILL.harm, label: 'harm in its class, unhandled' },
        ].map((s) => (
          <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: s.fill,
                opacity: 0.9,
                display: 'inline-block',
              }}
            />
            {s.label}
          </span>
        ))}
      </div>
      <StormStrip t={t} />
      <p
        className="mono"
        aria-live="polite"
        style={{
          fontSize: '12.5px',
          lineHeight: 1.6,
          color: 'var(--ink-2)',
          margin: '8px 0 0',
          minHeight: '4.8em',
        }}
      >
        {phaseCaption(t)}
      </p>
      <div className="mh-controls" role="group" aria-label="Storm controls: run, step, reset">
        <button
          type="button"
          className="mh-btn mh-btn-primary"
          onClick={runStorm}
          disabled={!allCommitted || playing}
          title={allCommitted ? undefined : 'Commit all four report cards first'}
          aria-label={graded ? 'Run the recorded storm again' : 'Run the recorded storm'}
        >
          {graded ? 'Run it again' : 'Run the storm'}
        </button>
        <button
          type="button"
          className="mh-btn"
          onClick={step}
          disabled={playing || t >= LAST}
          aria-label="Step one tick forward"
        >
          Step
        </button>
        <button
          type="button"
          className="mh-btn"
          onClick={reset}
          disabled={playing || t === 0}
          aria-label="Reset the strip to tick zero"
        >
          Reset
        </button>
        <span className="mh-kicker" aria-live="polite">
          {allCommitted
            ? `tick ${t} of ${LAST}`
            : `${committedCount} of ${PREDICTIONS.length} calls committed · the grader unlocks at ${PREDICTIONS.length}`}
        </span>
      </div>

      {/* 5 · predicted vs measured, side by side */}
      {graded ? (
        <>
          <SectionKicker>5 · Predicted vs measured · your call beside the log</SectionKicker>
          <div style={{ display: 'grid', gap: 12 }}>
            {PREDICTIONS.map((p) => (
              <GradeCard key={p.id} id={p.id} picked={picks[p.id]} />
            ))}
            <GradeCard id="gameday-probe" picked={null} />
          </div>
          <p style={{ margin: '12px 0 0', fontSize: '14.5px', color: 'var(--ink-2)' }}>
            Three rows failed live; a one-afternoon rehearsal would have caught two of them first.
            The grade you can trust is the one measured against a storm, and the cheapest storm is
            the one you schedule.
          </p>
        </>
      ) : null}
    </LabFrame>
  );
}
