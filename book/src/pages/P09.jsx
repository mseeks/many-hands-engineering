// P09 — Guardrails. Grade a guardrail before trusting it (handbook §2.10).
//
// One activity: an immune-system scene. A central service, four guardrails
// ringed around it, each carrying its five-axis dial cluster
// (coverage / latency / blast / false-positive / recovery). The reader sets
// one predicted verdict per guardrail — the dials fill to a ghost profile —
// then runs one seeded failure storm. The storm band sweeps the scene; the
// circuit breaker's node is physically tethered to the service it guards, so
// when the storm saturates the service the tether goes dark and the node dims
// with it (the planted structural flaw, drawn). The measured needle swings in
// beside each ghost: the 95% gate reads rubber-stamp, the 10x limit
// decorative, the dependent breaker blind through the harm window. Every
// number is measured from the storm log by guardrails.js; nothing here
// asserts a grade the engine did not record. Seed 11, deterministic forever.

import { useEffect, useState } from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, Mark, ModelNotes, glassSlice } from '../components/kit.jsx';
import { usePrefersReducedMotion } from '../shared/usePrefersReducedMotion.js';
import { gradeStorm, simulateStorm } from '../engine/guardrails.js';
import guardrailsSrc from '../engine/guardrails.js?raw';

/* ── The recorded storm (module-level: same seed, same grades, forever) ── */

const SEED = 11;
const STORM = simulateStorm(SEED);
const GRADES = Object.fromEntries(gradeStorm(SEED).map((g) => [g.id, g]));
const TICKS = STORM.ticks;
const PEAK_X = (
  Math.max(...TICKS.filter((k) => k.inStorm).map((k) => k.load)) / STORM.historicPeak
).toFixed(1); // 3.9x: painful, nowhere near the 10x line
const BREAKER_TRIP = TICKS.find((k) => k.breakerOpen).t; // 40: after the storm

const GLASS = glassSlice(guardrailsSrc, 'THE PLANTED FLAW', 'breakerOpen');

/* ── The five axes, in display order. Each maps a measured value to a 0..1
 * dial fill, oriented so a fuller dial is always a better grade. ─────────── */

const AXES = [
  { key: 'coverage', label: 'cov', full: 'coverage', fill: (v) => v, unit: (v) => v.toFixed(2) },
  {
    key: 'latency',
    label: 'lat',
    full: 'latency',
    // 0 ticks (write-time) is best; null (never fired) is worst.
    fill: (v) => (v === null ? 0 : Math.max(0, 1 - v / 20)),
    unit: (v) => (v === null ? 'never' : `${v}t`),
  },
  {
    key: 'blastRadius',
    label: 'blast',
    full: 'blast radius',
    // log-scaled against the worst row, then inverted: small blast = full dial.
    fill: (v) => 1 - Math.min(1, Math.log10(v + 1) / 4),
    unit: (v) => String(v),
  },
  {
    key: 'falsePositiveRate',
    label: 'fp',
    full: 'false-positive rate',
    fill: (v) => 1 - v,
    unit: (v) => v.toFixed(2),
  },
  {
    key: 'recoveryCost',
    label: 'rec',
    full: 'recovery cost',
    fill: (v) => 1 - Math.min(1, Math.log10(v + 1) / 2),
    unit: (v) => String(v),
  },
];

const gradeColor = (fill) =>
  fill >= 0.66 ? 'var(--accent)' : fill >= 0.33 ? 'var(--amber)' : 'var(--red)';

/* ── The four guardrails the reader grades, around the service. Each carries
 * its class question, its claim, the predicted profile each verdict implies,
 * and one terse line argued from the storm. The schema gate and the game-day
 * drill sit in the fold; these four are where grading bites. ─────────────── */

const GUARDS = [
  {
    id: 'review-gate',
    short: 'review gate · 95%',
    angle: -90,
    tethered: false,
    verdicts: [
      { id: 'holds', label: 'holds', profile: 0.9 },
      { id: 'stamp', label: 'rubber stamp', profile: 0.1 },
    ],
    answer: 'stamp',
    line: 'Approving 95% blind to content catches defects by luck — a stamp, not a review.',
  },
  {
    id: 'rate-limit',
    short: 'rate limit · 10x',
    angle: 0,
    tethered: false,
    verdicts: [
      { id: 'clamps', label: 'clamps the surge', profile: 0.85 },
      { id: 'decor', label: 'decorative', profile: 0.1 },
    ],
    answer: 'decor',
    line: `The storm peaked at ${PEAK_X}x; a limit set at 10x peak never fired and never could.`,
  },
  {
    id: 'circuit-breaker',
    short: 'circuit breaker',
    angle: 90,
    tethered: true,
    verdicts: [
      { id: 'isolates', label: 'isolates fast', profile: 0.85 },
      { id: 'blind', label: 'blind in the storm', profile: 0.12 },
    ],
    answer: 'blind',
    line: `Its probe rides the guarded service, so it held closed all storm and tripped at t${BREAKER_TRIP}, after.`,
  },
  {
    id: 'drift-monitor',
    short: 'drift monitor',
    angle: 180,
    tethered: false,
    verdicts: [
      { id: 'pattern', label: 'catches the pattern', profile: 0.7 },
      { id: 'shared', label: 'goes blind too', profile: 0.15 },
    ],
    answer: 'pattern',
    line: 'It reads the metrics pipeline, not the service, so it paged 3 ticks in — at the price of one spurious page.',
  },
];

/* ── The scene ─────────────────────────────────────────────────────────────
 * A viewBox-scaled immune-system diagram. The service sits at the center; four
 * guardrail nodes ring it, each with a five-segment dial bar. The breaker's
 * node is joined to the service by a thick shared-fate tether. When the storm
 * saturates the service (`down`), the tether and the breaker node dim — the
 * structural flaw made visible. Dials show the predicted ghost until the storm
 * runs, then ease to the measured fill. */

const W = 760;
const H = 440;
const CX = W / 2;
const CY = H / 2;
const RING = 150; // node distance from center
const NODE_W = 184;
const NODE_H = 78;

const rad = (deg) => (deg * Math.PI) / 180;
const nodeX = (angle) => CX + RING * Math.cos(rad(angle));
const nodeY = (angle) => CY + RING * Math.sin(rad(angle));

function DialBar({ x, y, fills, axesValues, measured }) {
  // Five segments left to right; height encodes fill, color encodes grade.
  // When measured, each segment carries its raw axis value as a tooltip.
  const seg = 30;
  const gap = 4;
  const maxH = 30;
  return (
    <g transform={`translate(${x},${y})`}>
      {AXES.map((axis, i) => {
        const f = fills[i];
        const h = Math.max(2, f * maxH);
        const col = measured ? gradeColor(f) : 'var(--ink-faint)';
        return (
          <g key={axis.key} transform={`translate(${i * (seg + gap)},0)`}>
            {measured ? <title>{`${axis.full}: ${axis.unit(axesValues[i])}`}</title> : null}
            <rect x="0" y={-maxH} width={seg} height={maxH} rx="2" fill="var(--line-soft)" />
            <rect
              x="0"
              y={-h}
              width={seg}
              height={h}
              rx="2"
              fill={col}
              opacity={measured ? 0.92 : 0.42}
              style={{ transition: 'height 0.5s ease, y 0.5s ease, fill 0.5s ease' }}
            />
            <text
              x={seg / 2}
              y={9}
              textAnchor="middle"
              fontSize="8.5"
              fill="var(--ink-faint)"
              fontFamily="var(--font-mono)"
            >
              {axis.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function GuardNode({ guard, predicted, measured, down }) {
  const x = nodeX(guard.angle);
  const y = nodeY(guard.angle);
  const grade = GRADES[guard.id];
  const axesValues = AXES.map((a) => grade.axes[a.key]);
  const measuredFills = AXES.map((a) => a.fill(grade.axes[a.key]));
  const predProfile = guard.verdicts.find((v) => v.id === predicted)?.profile;
  const ghostFills = AXES.map(() => predProfile ?? 0);
  const fills = measured ? measuredFills : ghostFills;
  // The breaker dims when its tether goes dark with the service.
  const dark = guard.tethered && down;
  const stroke = measured
    ? gradeColor(measuredFills.reduce((a, b) => a + b, 0) / 5)
    : 'var(--line-soft)';
  return (
    <g opacity={dark ? 0.32 : 1} style={{ transition: 'opacity 0.4s' }}>
      <rect
        x={x - NODE_W / 2}
        y={y - NODE_H / 2}
        width={NODE_W}
        height={NODE_H}
        rx="8"
        fill="var(--paper-2)"
        stroke={stroke}
        strokeWidth={measured ? 1.6 : 1}
        style={{ transition: 'stroke 0.5s' }}
      />
      <text
        x={x}
        y={y - NODE_H / 2 + 16}
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fill="var(--ink)"
        fontFamily="var(--font-mono)"
      >
        {guard.short}
      </text>
      <DialBar
        x={x - 84}
        y={y + NODE_H / 2 - 9}
        fills={fills}
        axesValues={axesValues}
        measured={measured}
      />
      {dark ? (
        <text
          x={x}
          y={y - NODE_H / 2 - 5}
          textAnchor="middle"
          fontSize="9"
          fill="var(--red)"
          fontFamily="var(--font-mono)"
        >
          probe dark · shared fate
        </text>
      ) : null}
    </g>
  );
}

function Scene({ phase, predictions, measured }) {
  const down = phase === 'storm'; // service saturated during the harm window
  const breaker = GUARDS.find((g) => g.tethered);
  const bx = nodeX(breaker.angle);
  const by = nodeY(breaker.angle);
  const aria =
    'An immune-system diagram: a central service ringed by four guardrails, each showing a ' +
    'five-axis grade. The circuit breaker is tethered to the service it guards. ' +
    (measured
      ? `Graded against one storm: the review gate scores ${GRADES[
          'review-gate'
        ].axes.coverage.toFixed(
          2,
        )} coverage (rubber stamp), the 10x rate limit never fires against a ${PEAK_X}x storm ` +
        `(decorative), the tethered breaker holds closed through the harm window and trips at ` +
        `tick ${BREAKER_TRIP} (blind), and the drift monitor pages three ticks in.`
      : 'Set a predicted verdict for each, then run the storm to grade them.');
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={aria}
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        background: 'var(--paper)',
        border: '1px solid var(--line-soft)',
        borderRadius: 6,
      }}
    >
      {/* the storm wash over the whole scene during the harm window */}
      <rect
        x="0"
        y="0"
        width={W}
        height={H}
        fill="var(--red)"
        opacity={down ? 0.06 : 0}
        style={{ transition: 'opacity 0.4s' }}
      />

      {/* links: every guardrail watches the service. The breaker's is a thick
          shared-fate tether that carries the service's health probe. */}
      {GUARDS.map((g) => {
        const gx = nodeX(g.angle);
        const gy = nodeY(g.angle);
        if (g.tethered) return null;
        return (
          <line
            key={g.id}
            x1={CX}
            y1={CY}
            x2={gx}
            y2={gy}
            stroke="var(--line-soft)"
            strokeWidth="1.5"
            strokeDasharray="3 4"
          />
        );
      })}
      <line
        x1={CX}
        y1={CY}
        x2={bx}
        y2={by}
        stroke={down ? 'var(--red)' : 'var(--blue)'}
        strokeWidth="5"
        strokeOpacity={down ? 0.3 : 0.6}
        style={{ transition: 'stroke 0.4s, stroke-opacity 0.4s' }}
      />
      <text
        x={(CX + bx) / 2 + 8}
        y={(CY + by) / 2 - 6}
        fontSize="8.5"
        fill={down ? 'var(--red)' : 'var(--blue)'}
        fontFamily="var(--font-mono)"
      >
        health probe
      </text>

      {/* the service at the center */}
      <circle
        cx={CX}
        cy={CY}
        r="40"
        fill={down ? 'var(--red-soft)' : 'var(--paper-3)'}
        stroke={down ? 'var(--red)' : 'var(--line-soft)'}
        strokeWidth="2"
        style={{ transition: 'fill 0.4s, stroke 0.4s' }}
      />
      <text
        x={CX}
        y={CY - 2}
        textAnchor="middle"
        fontSize="12"
        fontWeight="600"
        fill="var(--ink)"
        fontFamily="var(--font-mono)"
      >
        service
      </text>
      <text
        x={CX}
        y={CY + 13}
        textAnchor="middle"
        fontSize="8.5"
        fill={down ? 'var(--red)' : 'var(--ink-faint)'}
        fontFamily="var(--font-mono)"
        style={{ transition: 'fill 0.4s' }}
      >
        {down ? `saturated · ${PEAK_X}x peak` : 'nominal'}
      </text>

      {/* the four guardrail nodes, dials and all */}
      {GUARDS.map((g) => (
        <GuardNode
          key={g.id}
          guard={g}
          predicted={predictions[g.id]}
          measured={measured}
          down={down}
        />
      ))}
    </svg>
  );
}

/* ── The page ──────────────────────────────────────────────────────────── */

export default function P09() {
  const reduced = usePrefersReducedMotion();
  // Commit before reveal: mount on the predict frame so the reader grades each
  // guardrail first, then the storm swings the measured dials in beside the
  // predictions. Showing the verdicts at rest would spoil the page's surprise.
  const [predictions, setPredictions] = useState({});
  const [phase, setPhase] = useState('predict'); // 'predict' | 'storm' | 'graded'
  const [measured, setMeasured] = useState(false);

  const committed = GUARDS.filter((g) => predictions[g.id]).length;
  const allIn = committed === GUARDS.length;

  // The storm animation: a brief saturated 'storm' frame, then the dials ease
  // to their measured fills. Under reduced motion we skip straight to graded.
  useEffect(() => {
    if (phase !== 'storm') return undefined;
    const t = setTimeout(() => {
      setPhase('graded');
      setMeasured(true);
    }, 900);
    return () => clearTimeout(t);
  }, [phase]);

  const predict = (gid, vid) => {
    if (predictions[gid]) return; // commitment is final, per the constitution
    setPredictions((p) => ({ ...p, [gid]: vid }));
  };

  const runStorm = () => {
    if (!allIn) return;
    setMeasured(false);
    if (reduced) {
      setPhase('graded');
      setMeasured(true);
      return;
    }
    setPhase('storm');
  };

  const reset = () => {
    setPredictions({});
    setPhase('predict');
    setMeasured(false);
  };

  return (
    <Page n={9} claim="Grade a guardrail before trusting it; most do less than they appear to.">
      <Activity wide>
        <Scene phase={phase} predictions={predictions} measured={measured} />
        <p
          className="mono"
          style={{
            margin: '6px 0 0',
            fontSize: 11,
            color: 'var(--ink-faint)',
            textAlign: 'center',
          }}
          aria-hidden="true"
        >
          each node&apos;s five dials, left to right: cov · lat · blast · fp · rec — fuller is a
          better grade
        </p>

        {phase === 'graded' ? (
          <div className="mh-readout" role="status" aria-live="polite" style={{ marginTop: 14 }}>
            {GUARDS.map((g) => {
              // The verdict is the measured grade. Color it against the
              // reader's call: green if they predicted it, red if they
              // predicted the other verdict, neutral if they made no call.
              const pick = predictions[g.id];
              const tone = !pick ? '' : pick === g.answer ? 'good' : 'bad';
              return (
                <div className="mh-stat" key={g.id} style={{ minWidth: 150 }}>
                  <span className="k">{g.short}</span>
                  <span className={tone ? `v ${tone}` : 'v'} style={{ fontSize: 14 }}>
                    {g.verdicts.find((v) => v.id === g.answer).label}
                  </span>
                  <span
                    style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.45, marginTop: 2 }}
                  >
                    {g.line}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ marginTop: 14, display: 'grid', gap: 8 }} role="group">
            {GUARDS.map((g) => (
              <div
                key={g.id}
                style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 12, color: 'var(--ink-2)', minWidth: 130 }}
                >
                  {g.short}
                </span>
                <div className="mh-chipset" role="group" aria-label={g.short}>
                  {g.verdicts.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="mh-chip"
                      aria-pressed={predictions[g.id] === v.id}
                      disabled={Boolean(predictions[g.id]) && predictions[g.id] !== v.id}
                      onClick={() => predict(g.id, v.id)}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          className="mh-controls"
          role="group"
          aria-label="Storm controls"
          style={{ marginTop: 14 }}
        >
          <button
            type="button"
            className="mh-btn mh-btn-primary"
            onClick={runStorm}
            disabled={!allIn || phase === 'storm'}
            title={allIn ? undefined : 'Predict all four verdicts first'}
            data-testid="run-storm"
          >
            {phase === 'graded' ? 'Run it again' : 'Run the storm'}
          </button>
          <button
            type="button"
            className="mh-btn"
            onClick={reset}
            disabled={phase === 'storm'}
            data-testid="reset"
          >
            Reset
          </button>
          <span className="mh-kicker" aria-live="polite">
            {phase === 'graded'
              ? 'measured · seed 11'
              : `${committed} of ${GUARDS.length} predicted`}
          </span>
        </div>

        <ModelNotes
          register="mechanism"
          notes={[
            `Same seed, same grades, forever: seed ${SEED}, sixty ticks, harm at ticks 20-39, replayed from a recorded log. The grader measures the log; it never re-rolls the dice.`,
            'The dials are oriented so a fuller bar is always a better grade, across mixed units; blast and recovery are log-scaled to fit on one face. The fills are a display mapping, not engine output. The numbers underneath are.',
            'The review gate is modeled as a quality-blind coin, the rubber-stamp claim in its purest form. The breaker dims because its health probe is served by the saturated service, the planted structural flaw.',
          ]}
          cannotShow="your guardrails' grades. The constants were chosen so the failure modes are findable in one sitting; nothing here predicts a real breaker's threshold or a real gate's catch rate. The five axes transfer; the numbers do not."
          glass={GLASS}
        />
      </Activity>

      <Seen>
        Four guardrails, one storm. The 95% gate caught defects by luck, the 10x limit never fired
        against a {PEAK_X}x storm, and the breaker tethered to the service it guards went blind the
        moment it mattered. Only the monitor, reading a pipeline outside the blast, held.
      </Seen>

      <Takeaway>
        A guardrail&apos;s claim is not its grade. Measure coverage, latency, blast, false-positive,
        and recovery against a real storm, and a reactive guardrail must never depend on the thing
        it guards.
      </Takeaway>

      <Deeper title="Four classes, four questions (§2.10)">
        <p>
          Guardrails are load-bearing design work, not add-ons. They fall into four classes, each
          answering a different question. A mature platform has guardrails at all four layers.
        </p>
        <table className="mh-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>The question</th>
              <th>Examples</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Structural</strong>
              </td>
              <td>Can this even happen?</td>
              <td>
                Schema validation at write time, capability scoping, sandboxing, type systems.
              </td>
            </tr>
            <tr>
              <td>
                <strong>Reactive</strong>
              </td>
              <td>Did this just happen, and should it continue?</td>
              <td>Rate limits, circuit breakers, backpressure, content filters, test gates.</td>
            </tr>
            <tr>
              <td>
                <strong>Dynamic</strong>
              </td>
              <td>Is the system drifting?</td>
              <td>Approval rates, error-budget burn, eval drift, canary analysis.</td>
            </tr>
            <tr>
              <td>
                <strong>Reflective</strong>
              </td>
              <td>Are our guardrails still working?</td>
              <td>Postmortems, chaos engineering, meta-evals. The most important class.</td>
            </tr>
          </tbody>
        </table>
        <p>
          <strong>Reactive&apos;s iron rule:</strong> a reactive guardrail must not depend on the
          thing it&apos;s guarding. A circuit breaker that relies on the service it breaks against
          isn&apos;t a circuit breaker — exactly the breaker drawn above, whose probe rides the
          service and goes dark with it.
        </p>
        <p style={{ margin: '14px 0 6px', fontWeight: 600 }}>Grade each guardrail on five axes</p>
        <table className="mh-table">
          <thead>
            <tr>
              <th>Axis</th>
              <th>Question</th>
              <th>Red flag</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Coverage</td>
              <td>What fraction of the failure class does it catch?</td>
              <td>Less than you thought</td>
            </tr>
            <tr>
              <td>Latency</td>
              <td>Time from trigger to firing</td>
              <td>Slower than the harm rate</td>
            </tr>
            <tr>
              <td>Blast radius</td>
              <td>Damage done by the time it fires</td>
              <td>Your real cost</td>
            </tr>
            <tr>
              <td>False-positive rate</td>
              <td>Fraction of spurious firings</td>
              <td>Trains operators to ignore it</td>
            </tr>
            <tr>
              <td>Recovery cost</td>
              <td>Work to return to a good state</td>
              <td>Can exceed the failure cost</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: 12 }}>
          Grading tends to reveal that many guardrails do less than they appear to. A review gate
          with a 95% approval rate is rubber-stamping. A rate limit set at ten times peak is
          decorative. The exercise forces the question of whether each guardrail earns its keep.
        </p>
        <p style={{ margin: '12px 0 0', color: 'var(--ink-2)' }}>
          Guardrails are subject to the dynamics they guard{' '}
          <Badge layer="W" note="§2.10 — guardrails are fractal" />. They can run away (a retry
          policy causing the overload it guarded against), Goodhart (an eval used as a gate gets
          optimized against), atrophy, or become theatre. The defenses are the same four dynamics:
          add decay (rotate evals), add variety (multiple independent guards for critical failures),
          add reflection (measure guardrail effectiveness), and add escape valves (a guardrail that
          can&apos;t be overridden will be overridden destructively).
        </p>
        <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--ink-faint)' }}>
          The two honest rows sit off the scene: the <strong>schema gate</strong>{' '}
          <Mark kind="made" note="composite terrain; the claim is typical, not quoted" /> blocks
          every malformed write at write time (coverage 1.0, recovery 0) because it guards one
          narrow, fully specified failure class. The <strong>game-day drill</strong> is the
          reflective row — graded against the other guardrails, it would have caught the decorative
          limit and the blind breaker in a cheap rehearsal, but it ran 70 days ago. Without it, the
          rest of the table decays silently. Covers §2.10.
        </p>
      </Deeper>
    </Page>
  );
}
