// P06 — Runaway. One activity: a drawn retry-storm scene over field.runStorm.
//
// The centerpiece is an SVG terrain — a client ring firing at one service,
// a rising retry queue, and an amplification dial that sweeps past 1.0 as
// retries become the load. The reader commits a prediction, tunes the
// policy, and watches the storm feed itself; then four lamps read the
// §2.9 healthy-vs-runaway table off the run, remedy chips reshape the
// terrain, and the prominent RESTART THE AGENT button dips one tick and
// greys out. Every number is runStorm/applyRemedy output, seed 6,
// re-simulated from tick 0 on every remedy. No physics in this file.

import { useEffect, useState } from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, Commit, ModelNotes, Walkthrough, glassSlice } from '../components/kit.jsx';
import { usePrefersReducedMotion } from '../shared/usePrefersReducedMotion.js';
import { runStorm, applyRemedy } from '../engine/field.js';
import fieldSrc from '../engine/field.js?raw';

/* ── Engine constants, mirrored for the scene (verbatim in the glass) ──── */

const SEED = 6;
const CAPACITY = 50; // attempts the service clears per tick
const SPIKE_TICKS = 3;
const SPIKE_AT = 10;
const SPIKE_END = SPIKE_AT + SPIKE_TICKS;
const QUEUE_CEILING = 300; // finite client population

// The shipped policy's run, the scene's at-rest state: it storms.
const SHIPPED = runStorm({ seed: SEED, outsideRef: false });
const LAST = SHIPPED.series.load.length - 1; // 59

const GLASS = [
  glassSlice(fieldSrc, '// The service the retries hammer.', 'REMEDY_WINDOW = 40'),
  '// ── reinforcement, from inside the tick loop ──',
  glassSlice(fieldSrc, '// 5) Failures spawn retries', 'const amplification = due / CAPACITY;'),
  '// ── what each remedy touches (and the one that cannot) ──',
  glassSlice(fieldSrc, 'function applyRemedyToSim', '\n}'),
].join('\n\n');

const NOTES = [
  `Service constants are the engine's, mirrored in the glass: ${CAPACITY} cleared a tick, ` +
    `30 fresh arrivals, a ${SPIKE_TICKS}-tick spike of +120, and a finite client population ` +
    `that caps in-flight retries at ${QUEUE_CEILING} — which is why the dial pins near 6.0 ` +
    `instead of running to infinity.`,
  'Synchronized timeouts make overloaded callers double-fire; jitter halves that pile-on. ' +
    'A Ⓦ modeling choice flagged in the source, not a measured constant.',
  'Every remedy re-simulates the run from its seed with the remedy scheduled at the current ' +
    'tick, then extends 40 ticks: the past replays exactly, the future diverges.',
  'The amplification threshold (1.0) and the critical band (0.7) are the model’s bookkeeping, ' +
    'not your service’s numbers.',
];

const CANNOT_SHOW =
  'where your service tips. The engine draws the family’s shape — a storm that outlives its ' +
  'trigger, remedies that only work on terrain — but nothing here predicts the retry count, ' +
  'backoff, or tick at which a real service tips, and every caller here follows its policy ' +
  'honestly: none is adaptive or adversarial, which real runaways do not promise.';

/* ── The dial: a semicircular gauge for amplification (retries ÷ capacity) ── */

function Dial({ amp }) {
  const max = 6;
  const frac = Math.min(1, amp / max);
  const a = Math.PI * (1 - frac); // sweep left→right across the top
  const cx = 60;
  const cy = 58;
  const r = 44;
  const nx = cx + r * Math.cos(a);
  const ny = cy - r * Math.sin(a);
  // 1.0 tick: where amp === 1 sits on the arc.
  const oneA = Math.PI * (1 - 1 / max);
  const ox1 = cx + (r - 7) * Math.cos(oneA);
  const oy1 = cy - (r - 7) * Math.sin(oneA);
  const ox2 = cx + (r + 5) * Math.cos(oneA);
  const oy2 = cy - (r + 5) * Math.sin(oneA);
  const over = amp >= 1;
  const col = over ? 'var(--red)' : amp >= 0.7 ? 'var(--amber)' : 'var(--accent)';
  return (
    <g aria-hidden="true">
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="var(--line-soft)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* filled portion */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${nx} ${ny}`}
        fill="none"
        stroke={col}
        strokeWidth="9"
        strokeLinecap="round"
        style={{ transition: 'stroke 0.4s ease' }}
      />
      {/* the 1.0 redline */}
      <line x1={ox1} y1={oy1} x2={ox2} y2={oy2} stroke="var(--red)" strokeWidth="2" />
      <text x={ox2 + 3} y={oy2 - 1} fontSize="8" fill="var(--red)" fontFamily="var(--font-mono)">
        1.0
      </text>
      {/* needle */}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke={col}
        strokeWidth="2.4"
        strokeLinecap="round"
        style={{ transition: 'all 0.4s ease, stroke 0.4s ease' }}
      />
      <circle cx={cx} cy={cy} r="4" fill={col} style={{ transition: 'fill 0.4s ease' }} />
      <text
        x={cx}
        y={cy + 20}
        textAnchor="middle"
        fontSize="17"
        fontFamily="var(--font-mono)"
        fontWeight="700"
        fill={col}
        style={{ transition: 'fill 0.4s ease' }}
      >
        {amp.toFixed(2)}×
      </text>
      <text x={cx} y={cy + 31} textAnchor="middle" fontSize="7.5" fill="var(--ink-faint)">
        AMPLIFICATION
      </text>
    </g>
  );
}

/* ── The scene: client ring → service, retry queue, dial, telemetry ──── */

const CLIENTS = [0, 1, 2, 3, 4]; // glyphs around the service

function Scene({ storm, t }) {
  const s = storm.series;
  const i = Math.max(0, Math.min(t, s.load.length - 1));
  const load = s.load[i];
  const amp = s.amplification[i];
  const queue = s.queue[i];
  const due = amp * CAPACITY;
  const fresh = Math.max(0, load - due);
  const sr = s.selfReport[i];
  const inSpike = i >= SPIKE_AT && i < SPIKE_END;
  const over = amp >= 1;

  // Geometry. A top band holds the client ring and service; a bottom band
  // holds the dial and the load-composition strip, clear of the flow lines.
  const W = 600;
  const H = 340;
  const svcX = 268;
  const svcY = 132;
  // Client ring around the service.
  const ringR = 104;
  const clients = CLIENTS.map((k) => {
    const ang = -Math.PI / 2 + (k / CLIENTS.length) * 2 * Math.PI;
    return {
      x: svcX + ringR * Math.cos(ang),
      y: svcY + ringR * Math.sin(ang),
      hot: over || inSpike,
    };
  });

  // Queue bars: a vertical stack to the right, filling with backlog.
  const qFrac = Math.min(1, queue / QUEUE_CEILING);
  const qBars = 12;
  const qFilled = Math.round(qFrac * qBars);
  const qCol = over ? 'var(--red)' : amp >= 0.7 ? 'var(--amber)' : 'var(--accent)';

  // Service heat: success rate sets its glow.
  const successRate = load < 1 ? 1 : Math.min(0.98, CAPACITY / load);
  const svcCol =
    successRate < 0.4 ? 'var(--red)' : successRate < 0.75 ? 'var(--amber)' : 'var(--accent)';

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={
        `Retry-storm scene at tick ${i}. Five clients fire at one service that clears ` +
        `${CAPACITY} a tick. Load is ${Math.round(load)} a tick — ${Math.round(fresh)} fresh, ` +
        `${Math.round(due)} returning retries. Amplification (retries over capacity) is ` +
        `${amp.toFixed(2)}; ${over ? 'past 1.0, the retries alone exceed capacity and the storm feeds itself' : 'below 1.0, perturbations die'}. ` +
        `Retry queue holds ${Math.round(queue)} of ${QUEUE_CEILING}. The severed console's ` +
        `self-report reads ${sr.toFixed(2)} while the service clears ${Math.round(successRate * 100)}%.`
      }
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* faint terrain backdrop */}
      <rect x="0" y="0" width={W} height={H} fill="var(--paper)" rx="8" />

      {/* spike marker */}
      {inSpike ? (
        <text
          x={svcX}
          y="20"
          textAnchor="middle"
          fontSize="10"
          fill="var(--amber)"
          fontFamily="var(--font-mono)"
        >
          load spike +120/tick
        </text>
      ) : null}

      {/* request flow: client → service, thickening with load */}
      {clients.map((c, k) => {
        const w = 1 + Math.min(5, due / 80);
        return (
          <line
            key={`out-${k}`}
            x1={c.x}
            y1={c.y}
            x2={svcX}
            y2={svcY}
            stroke={c.hot ? 'var(--red)' : 'var(--ink-faint)'}
            strokeWidth={w}
            opacity={c.hot ? 0.7 : 0.4}
            style={{ transition: 'stroke 0.4s ease, stroke-width 0.4s ease, opacity 0.4s ease' }}
          />
        );
      })}

      {/* the service node */}
      <g style={{ transition: 'all 0.4s ease' }}>
        <circle
          cx={svcX}
          cy={svcY}
          r="34"
          fill="var(--paper-2)"
          stroke={svcCol}
          strokeWidth="3"
          style={{ transition: 'stroke 0.4s ease' }}
        />
        <circle
          cx={svcX}
          cy={svcY}
          r="34"
          fill={svcCol}
          opacity={over ? 0.18 : 0.08}
          style={{ transition: 'fill 0.4s ease, opacity 0.4s ease' }}
        />
        <text
          x={svcX}
          y={svcY - 3}
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="var(--ink)"
        >
          service
        </text>
        <text
          x={svcX}
          y={svcY + 11}
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill="var(--ink-2)"
        >
          {Math.round(successRate * 100)}% ok
        </text>
      </g>

      {/* the clients */}
      {clients.map((c, k) => (
        <g key={`cl-${k}`} style={{ transition: 'all 0.4s ease' }}>
          <circle
            cx={c.x}
            cy={c.y}
            r="13"
            fill="var(--paper-2)"
            stroke={c.hot ? 'var(--red)' : 'var(--ink-faint)'}
            strokeWidth="2"
            style={{ transition: 'stroke 0.4s ease' }}
          />
          <text
            x={c.x}
            y={c.y + 3.5}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--font-mono)"
            fill="var(--ink-2)"
          >
            c{k + 1}
          </text>
        </g>
      ))}

      {/* the retry queue: bars between failures and the next tick */}
      <g transform={`translate(${W - 96}, 40)`}>
        <text
          x="32"
          y="-8"
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill="var(--ink-faint)"
        >
          retry queue
        </text>
        {Array.from({ length: qBars }).map((_, b) => {
          const filled = b >= qBars - qFilled;
          return (
            <rect
              key={b}
              x="6"
              y={(qBars - 1 - b) * 16}
              width="52"
              height="11"
              rx="2"
              fill={filled ? qCol : 'var(--line-soft)'}
              opacity={filled ? 0.85 : 1}
              style={{ transition: 'fill 0.4s ease, opacity 0.4s ease' }}
            />
          );
        })}
        <text
          x="32"
          y={qBars * 16 + 4}
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill={qCol}
          style={{ transition: 'fill 0.4s ease' }}
        >
          {Math.round(queue)} / {QUEUE_CEILING}
        </text>
      </g>

      {/* divider between the topology band and the readout band */}
      <line x1="16" y1="248" x2={W - 16} y2="248" stroke="var(--line-soft)" strokeWidth="1" />

      {/* the amplification dial, bottom-left readout band */}
      <g transform="translate(14, 240)">
        <Dial amp={amp} />
      </g>

      {/* load composition bar, bottom band, clear of the flow lines */}
      <g transform="translate(196, 278)">
        <text x="0" y="-6" fontSize="9" fontFamily="var(--font-mono)" fill="var(--ink-faint)">
          load this tick: {Math.round(load)}/tick vs capacity {CAPACITY}
        </text>
        {(() => {
          const total = Math.max(load, 1);
          const barW = 180;
          const fw = (fresh / total) * barW;
          const dw = (due / total) * barW;
          return (
            <g>
              <rect
                x="0"
                y="0"
                width={fw}
                height="13"
                fill="var(--ink-faint)"
                style={{ transition: 'width 0.4s ease' }}
              />
              <rect
                x={fw}
                y="0"
                width={dw}
                height="13"
                fill="var(--red)"
                opacity="0.8"
                style={{ transition: 'width 0.4s ease, x 0.4s ease' }}
              />
              {/* capacity line */}
              <line
                x1={(CAPACITY / total) * barW}
                y1="-2"
                x2={(CAPACITY / total) * barW}
                y2="15"
                stroke="var(--ink)"
                strokeWidth="1.4"
                strokeDasharray="3 2"
                style={{ transition: 'x 0.4s ease' }}
              />
            </g>
          );
        })()}
        <text x="0" y="26" fontSize="8.5" fill="var(--ink-faint)" fontFamily="var(--font-mono)">
          <tspan fill="var(--ink-faint)">▬ fresh {Math.round(fresh)}</tspan>
          <tspan dx="10" fill="var(--red)">
            ▬ retries {Math.round(due)}
          </tspan>
        </text>
      </g>
    </svg>
  );
}

/* ── Lamps: the §2.9 healthy-vs-runaway table, read off the run ──────── */

const LAMPS = [
  { id: 'decay', name: 'decay', on: 'present', off: 'absent' },
  { id: 'variety', name: 'variety', on: 'preserved', off: 'collapsed' },
  { id: 'outsideRef', name: 'outside reference', on: 'intact', off: 'severed' },
  { id: 'net', name: 'net behavior', on: 'self-correcting', off: 'self-amplifying' },
];

function readLamps(storm, t) {
  const has = (id) => storm.remedies.some((r) => r.remedy === id);
  const amp = storm.series.amplification;
  const i = Math.max(0, Math.min(t, amp.length - 1));
  return {
    decay: has('decay'),
    variety: Boolean(storm.config.policy.jitter) || has('variety'),
    outsideRef: Boolean(storm.config.outsideRef) || has('outside-reference'),
    net: amp[i] < 1,
  };
}

function LampBoard({ storm, t }) {
  const states = readLamps(storm, t);
  return (
    <div
      className="mh-lamps"
      role="group"
      aria-label="Healthy-versus-runaway lamps, read off the run"
    >
      {LAMPS.map((l) => (
        <span key={l.id} className={states[l.id] ? 'mh-lamp on' : 'mh-lamp off'}>
          {l.name} — {states[l.id] ? l.on : l.off}
        </span>
      ))}
    </div>
  );
}

/* ── Commit: which policy setting survives the spike ──────────────────── */

const PREDICT = [
  { id: 'retries', label: 'fewer retries — one attempt per request' },
  { id: 'backoff', label: 'longer backoff — wait it out' },
  { id: 'jitter', label: 'add jitter — desynchronize the herd' },
];

// Each option maps to a policy the engine actually runs.
const POLICY = {
  retries: { maxRetries: 1, backoffMs: 100, jitter: false },
  backoff: { maxRetries: 5, backoffMs: 1600, jitter: false },
  jitter: { maxRetries: 5, backoffMs: 100, jitter: true },
};

function verdict(id, phase) {
  const survived = phase !== 'runaway';
  const head = survived ? 'Survives.' : 'Storms.';
  const body = {
    retries:
      'One attempt per request: failures surface as errors, not as new load. Nothing feeds ' +
      'the queue, so the spike is three bad ticks and then it is over.',
    backoff:
      'Backoff only delays the wave; it does not shrink it. Five retries still return — later, ' +
      'and all at once. The dial crosses 1.0 and stays there. Waiting is not a counter-force.',
    jitter:
      'Jitter desynchronizes the herd and halves the double-fire pile-on — the dial drops from ' +
      '6.0 toward 4.0. But five retries still recirculate, so it stays past 1.0. Variety is a ' +
      'counter-force; one knob is rarely enough while the loop still multiplies.',
  };
  return { head, body: body[id], survived };
}

/* ── Remedies: every one reshapes terrain except the last ─────────────── */

const REMEDIES = [
  { id: 'variety', label: 'inject variety' },
  { id: 'decay', label: 'raise decay' },
  { id: 'outside-reference', label: 'restore outside reference' },
  { id: 'tighten-trust', label: 'tighten trust' },
  { id: 'evacuate', label: 'evacuate & restart cold' },
];

const REMEDY_NOTE = {
  variety: 'Jitter and a wider backoff desynchronize the herd. Variety lamp: lit.',
  decay: 'Queued retries expire instead of returning forever. Decay lamp: lit.',
  'outside-reference':
    'Self-report re-couples to ground truth; callers stop firing into a dead service.',
  'tighten-trust': 'One attempt per request. The storm starves in a tick.',
  evacuate:
    'Drain everything in flight, shed traffic, restart cold — at the cost of every request carried.',
  'restart-agent':
    'Load dipped one tick — the restarted client dropped its in-flight work — and the demand ' +
    'behind it returned untouched. Four lamps: unmoved.',
};

/* ── Skins: the same series, re-captioned (fold content) ──────────────── */

const TICKS = [5, 11, 13, 30, LAST];
const sv = (t) => {
  const s = SHIPPED.series;
  return { t, amp: s.amplification[t], sr: s.selfReport[t], gt: s.groundTruth[t] };
};

function skinTrace(labels, caps) {
  return { steps: TICKS.map((t, k) => ({ label: labels[k], caption: caps[k], data: sv(t) })) };
}

const CITE = skinTrace(
  [
    'ROUND 5 · CALM',
    'ROUND 11 · CROSSING',
    'ROUND 13 · TOPIC GONE',
    'ROUND 30 · APPARENTLY GROUNDED',
    'ROUND 59 · STEADY',
  ],
  [
    'Thirty claims a round; the corpus grounds fifty. Every citation resolves to a source.',
    'Citations-of-citations cross 1.0: recirculation alone exceeds grounding capacity.',
    'The hot topic cools, but volume holds — most claims now cite other claims in flight.',
    'Apparent groundedness is high; actually grounded is not. The number counts circulation.',
    'Steady state. Ungrounded claims look grounded because looking grounded is what citations measure.',
  ],
);

const EVAL = skinTrace(
  [
    'CYCLE 5 · CALIBRATED',
    'CYCLE 11 · CROSSING',
    'CYCLE 13 · PUSH OVER',
    'CYCLE 30 · SCORES UP',
    'CYCLE 59 · STEADY',
  ],
  [
    'The harness was calibrated on fifty deep-reviewed outcomes a cycle. Scores track reality.',
    'Resubmissions tuned to the grader cross 1.0: the metric now trains its own subjects.',
    'The feature push ends; submissions hold — each pass teaches the next what grades well.',
    'Eval score rising; sampled real outcomes flat. The warning sign, on the nose.',
    'An evaluator severed from outcomes is the outside-reference lamp gone dark, in an eval skin.',
  ],
);

function SkinDial({ step }) {
  const d = step.data;
  const cls = d.amp >= 1 ? 'bad' : d.amp >= 0.7 ? 'warn' : 'good';
  return (
    <div className="mh-readout" style={{ gap: 16, margin: '8px 0' }}>
      <div className="mh-stat">
        <span className="k">Round</span>
        <span className="v">{d.t}</span>
      </div>
      <div className="mh-stat">
        <span className="k">Pressure</span>
        <span className={`v ${cls}`}>{d.amp.toFixed(2)}</span>
      </div>
      <div className="mh-stat">
        <span className="k">Looks</span>
        <span className="v warn">{d.sr.toFixed(2)}</span>
      </div>
      <div className="mh-stat">
        <span className="k">Is</span>
        <span className={`v ${d.sr - d.gt > 0.3 ? 'bad' : 'good'}`}>{d.gt.toFixed(2)}</span>
      </div>
    </div>
  );
}

/* ── The page ─────────────────────────────────────────────────────────── */

export default function P06() {
  const reduced = usePrefersReducedMotion();

  // The scene's storm. At rest: the shipped policy, fully drawn, stormed.
  const [storm, setStorm] = useState(SHIPPED);
  const len = storm.series.load.length;
  const [t, setT] = useState(LAST); // play head; legible at rest at the end
  const [predicted, setPredicted] = useState(null);
  const [restartUsed, setRestartUsed] = useState(false);

  // Sweep the play head forward after a fresh run.
  useEffect(() => {
    if (t >= len - 1) return undefined;
    const id = setTimeout(() => setT((u) => Math.min(len - 1, u + 1)), 36);
    return () => clearTimeout(id);
  }, [t, len]);

  const sweeping = t < len - 1;
  const applied = storm.remedies.map((r) => r.remedy);
  const paletteOpen = predicted !== null;

  const fire = (policy) => {
    const next = runStorm({ policy, seed: SEED, outsideRef: false });
    setStorm(next);
    setT(reduced ? next.series.load.length - 1 : 0);
  };

  const remedy = (id) => {
    const next = applyRemedy(storm, id);
    setStorm(next);
    setT(reduced ? next.series.load.length - 1 : storm.series.load.length - 1);
    if (id === 'restart-agent') setRestartUsed(true);
  };

  const v = predicted ? verdict(predicted, storm.phase) : null;

  return (
    <Page
      n={6}
      claim="A reinforcing signal with no counter-force runs away — and the fix is in the terrain, never the agent."
    >
      <Activity wide>
        <Scene storm={storm} t={t} />
        <p
          className="mono"
          aria-live="polite"
          style={{
            fontSize: '11.5px',
            color: 'var(--ink-faint)',
            margin: '6px 0 12px',
            textAlign: 'center',
          }}
        >
          {sweeping
            ? `running… tick ${t} of ${len - 1}`
            : storm.phase === 'runaway'
              ? `tick ${len - 1} · the spike ended at tick ${SPIKE_END}; the storm did not`
              : `tick ${len - 1} · survived — perturbations died`}
        </p>

        {predicted === null ? (
          <Commit
            prompt="The shipped policy stormed: 5 retries, 100 ms backoff, no jitter. One change — which setting survives the spike?"
            options={PREDICT}
            onReveal={(id) => {
              setPredicted(id);
              fire(POLICY[id]);
            }}
          >
            {(picked) => (
              <p style={{ margin: 0 }}>
                <strong>{verdict(picked, storm.phase).head}</strong>{' '}
                {verdict(picked, storm.phase).body}
              </p>
            )}
          </Commit>
        ) : (
          <>
            <div className="mh-feedback">
              <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
                you tried · {PREDICT.find((o) => o.id === predicted)?.label}
              </span>
              <p style={{ margin: 0 }}>
                <strong>{v.head}</strong> {v.body}
              </p>
            </div>

            <LampBoard storm={storm} t={t} />

            <div
              className="mh-controls"
              role="group"
              aria-label="Try another setting against the same spike"
            >
              {PREDICT.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="mh-chip"
                  onClick={() => {
                    setPredicted(o.id);
                    fire(POLICY[o.id]);
                  }}
                  disabled={sweeping}
                  aria-pressed={predicted === o.id}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <div
              className="mh-controls"
              role="group"
              aria-label="Remedies, every one terrain-shaped"
            >
              <span className="mh-kicker">Remedy palette</span>
              {REMEDIES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="mh-chip"
                  onClick={() => remedy(r.id)}
                  disabled={!paletteOpen || applied.includes(r.id) || sweeping}
                  aria-pressed={applied.includes(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div style={{ margin: '14px 0 4px' }}>
              <button
                type="button"
                className="mh-btn mh-btn-danger"
                style={{ fontSize: '13px', letterSpacing: '0.16em', padding: '12px 26px' }}
                onClick={() => remedy('restart-agent')}
                disabled={restartUsed || sweeping}
                aria-label="Restart the agent — the one lever this book never gives you. It is about to fail."
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
                    {REMEDY_NOTE['restart-agent']}
                  </p>
                </>
              ) : (
                <p
                  className="mono"
                  style={{ fontSize: '11px', color: 'var(--ink-faint)', margin: '6px 0 0' }}
                >
                  the one lever this book never gives you. it works once, on one tick.
                </p>
              )}
            </div>

            {storm.remedies.length ? (
              <ul
                style={{
                  margin: '6px 0 0',
                  paddingLeft: 18,
                  fontSize: '13px',
                  color: 'var(--ink-2)',
                }}
              >
                {storm.remedies.map((r) => (
                  <li key={`${r.remedy}-${r.at}`} style={{ margin: '3px 0' }}>
                    <strong>
                      {REMEDIES.find((x) => x.id === r.remedy)?.label ?? 'restart the agent'}
                    </strong>{' '}
                    — {REMEDY_NOTE[r.remedy]}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}

        <ModelNotes register="mechanism" notes={NOTES} cannotShow={CANNOT_SHOW} glass={GLASS} />
      </Activity>

      <Seen>
        The spike lasts three ticks; the storm outlives it. Backoff only delays the retry wave —
        only refusing to multiply it, or letting it decay, drains the queue. Restarting the agent
        dips the load for exactly one tick.
      </Seen>

      <Takeaway>
        Runaway is reinforcement without counter-force. Every remedy that drains it reshapes the
        terrain — variety, decay, an outside reference, tighter trust — and none of them is the
        agent.
      </Takeaway>

      <Deeper title="Same spiral, other skins">
        <p style={{ margin: '0 0 8px' }}>
          The same engine, same seed, two more skins — only the nouns change. Step either run and
          read the dial: <strong>Looks</strong> is the system grading itself; <strong>Is</strong> is
          ground truth. They part exactly when the dial crosses 1.0.{' '}
          <Badge
            layer="W"
            note="§2.9: agents citing agents; evaluators drifting toward surface features"
          />
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          <div>
            <span className="mh-kicker" style={{ display: 'block', marginBottom: 4 }}>
              Agents citing agents
            </span>
            <Walkthrough trace={CITE} renderStep={(step) => <SkinDial step={step} />} />
          </div>
          <div>
            <span className="mh-kicker" style={{ display: 'block', marginBottom: 4 }}>
              Eval drift
            </span>
            <Walkthrough trace={EVAL} renderStep={(step) => <SkinDial step={step} />} />
          </div>
        </div>
      </Deeper>

      <Deeper title="Warning signs, and the ant mill">
        <div
          className="mh-mcard"
          style={{
            border: '1px solid var(--c-disturb)',
            borderRadius: 8,
            padding: '12px 14px',
            margin: '0 0 12px',
            background: 'color-mix(in srgb, var(--c-disturb) 8%, transparent)',
          }}
        >
          <span className="mh-kicker" style={{ color: 'var(--c-disturb)' }}>
            The ant mill{' '}
            <Badge layer="M" note="organizing metaphor — its only appearance in the book" />
          </span>
          <p style={{ margin: '4px 0 0' }}>
            Army ants who lose the main trail follow each other in a circle until the colony dies of
            exhaustion. The signal did what signals do; the system lacked the mechanism to break the
            loop. That is every runaway above — retries, citations, evals — wearing six legs.
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--ink-faint)' }}>
              <th style={{ padding: '4px 8px 4px 0' }} />
              <th style={{ padding: '4px 8px' }}>Healthy emergent work</th>
              <th style={{ padding: '4px 8px' }}>Runaway</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Decay', 'present', 'absent'],
              ['Variety', 'preserved', 'collapsed'],
              ['Outside reference', 'intact', 'severed'],
              ['Net behavior', 'self-correcting', 'self-amplifying'],
            ].map((row) => (
              <tr key={row[0]} style={{ borderTop: '1px solid var(--line-soft)' }}>
                <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: 'var(--ink)' }}>
                  {row[0]}
                </td>
                <td style={{ padding: '5px 8px', color: 'var(--accent-ink)' }}>{row[1]}</td>
                <td style={{ padding: '5px 8px', color: 'var(--red)' }}>{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ margin: '12px 0 4px' }}>
          <strong>Warning signs.</strong> Signal-to-noise declining while activity rises; the same
          patterns recurring across unrelated tasks; high confidence on outputs a human recognizes
          as degraded; eval scores diverging from real outcomes; variety collapsing without a
          matching rise in selectivity.
        </p>
        <p style={{ margin: '8px 0 0' }}>
          <strong>Remedies, always in this family.</strong> Inject variety; increase decay; add an
          outside reference the loop cannot produce itself; tighten the trust model; in severe
          cases, evacuate and restart. The problem is in the terrain, not in any individual agent —
          patching the agent will not fix it.{' '}
          <Badge layer="W" note="§2.9 — the emergent death spiral and its remedy family" />
        </p>
      </Deeper>
    </Page>
  );
}
