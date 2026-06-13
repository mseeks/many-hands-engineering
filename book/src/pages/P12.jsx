// P12 — Six ingredients. Script vs loop is a checkable condition (§3.2–3.3).
//
// One activity: the dependency-patch loop drawn as a six-part machine — five
// stages around a ring (signal → action → verification → commit/revert →
// update) plus the authority surface as the governing hub. Click a part to
// eject it: it lifts out of the ring, the circuit breaks at that seam, and a
// commit gate asks which named pathology the next thirty days deliver. Reveal
// draws the 30-day consequence sparkline (the engine's series, same seed) and
// the pathology, named. Below, a four-specimen mini-deck (real loops, marks
// the empty slot) runs the same check on machines met in the field.
//
// Physics: runLoopWeeks() in src/engine/loopstep.js, every number read off the
// runs. Cases: the loop-kind bank in src/engine/cases.js.

import { useState } from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, Mark, Commit, Drill, ModelNotes, glassSlice } from '../components/kit.jsx';
import { runLoopWeeks } from '../engine/loopstep.js';
import { CASES } from '../engine/cases.js';
import loopstepRaw from '../engine/loopstep.js?raw';

/* ── The runs (module-level: same seeds, same stories, forever) ──────────── */

const WEEKS = 6; // six weekly cycles = the thirty working days the machine runs

// One entry per ingredient. `what` is the §3.2 table's middle column; the four
// commit options are the table's third column (the consequences), shuffled per
// part. Seeds are pinned (matching the bench) so each pull tells one story.
const PARTS = [
  {
    id: 'signal',
    label: 'signal',
    pathology: 'wrong fires',
    what: 'A trace in the terrain that fires the loop',
    consequence: 'The loop never starts, or fires on the wrong conditions',
    seed: 2,
  },
  {
    id: 'boundedAction',
    label: 'action',
    pathology: 'scope creep',
    what: 'Scoped to a specific class of change',
    consequence: 'Scope creep; blast radius exceeds the reasoning that approved it',
    seed: 9,
  },
  {
    id: 'verification',
    label: 'verify',
    pathology: 'self-approval',
    what: 'An outside reference: tests, eval, human judgment',
    consequence: 'The loop self-approves; drift; Goodhart',
    seed: 5,
  },
  {
    id: 'reversibility',
    label: 'revert',
    pathology: 'ossified mistake',
    what: 'A cheap, well-understood undo path',
    consequence: 'Mistakes ossify; stewards stop trusting the loop',
    seed: 8,
  },
  {
    id: 'signalUpdate',
    label: 'update',
    pathology: 'amnesia',
    what: 'Outcome feeds back into the terrain',
    consequence: "The next loop can't learn from this one",
    seed: 9,
  },
  {
    id: 'authoritySurface',
    label: 'authority',
    pathology: 'global flip',
    what: 'Explicit rules for when autonomy expands or contracts',
    consequence: 'Trust becomes a single global decision; fragility follows',
    seed: 17,
  },
];

const PART_OPTIONS = PARTS.map((p) => ({ id: p.id, label: p.consequence }));
const partById = (id) => PARTS.find((p) => p.id === id);

// For every part: the run with that one ingredient out, and the intact run on
// the same seed — so the only difference between the two sparklines is the pull.
const RUNS = Object.fromEntries(
  PARTS.map((p) => [
    p.id,
    {
      pulled: runLoopWeeks({ weeks: WEEKS, seed: p.seed, config: { [p.id]: false } }),
      intact: runLoopWeeks({ weeks: WEEKS, seed: p.seed }),
    },
  ]),
);

const f2 = (x) => x.toFixed(2);
const rnd = (x) => Math.round(x);

// The single most legible series per pull, plus the one number the pathology
// turns on. `spark` is the consequence line; `ref` is the intact run drawn
// faint behind it; `tells` is the one-line named pathology, read off the run.
function consequenceFor(id) {
  const { pulled, intact } = RUNS[id];
  switch (id) {
    case 'signal': {
      const missed = pulled.summary.missedWeeks; // [2,4,6]
      const fired = pulled.summary.falseFires; // [1]
      return {
        unit: 'review minutes / week',
        spark: pulled.series.reviewCost,
        ref: null,
        max: 60,
        tells: `wrong fires — ${fired.length} no-op PR, ${missed.length} patch windows missed; a schedule is not a condition in the terrain`,
        stat: `${pulled.summary.totalMerged} merges, not ${intact.summary.totalMerged}`,
      };
    }
    case 'boundedAction': {
      const wk = pulled.summary.blastRadiusExceededWeek; // 5
      const end = pulled.series.scope.at(-1); // 6.05
      return {
        unit: 'diff breadth (× chartered scope)',
        spark: pulled.series.scope,
        ref: intact.series.scope,
        max: 6.5,
        limit: 4,
        tells: `scope creep — diff compounds to ${end}× by day 30, past the 4× the approval reasoned about on day ${wk * 5}`,
        stat: `every PR still merged green`,
      };
    }
    case 'verification': {
      const cross =
        pulled.summary.confidence.findIndex((c, i) => c > pulled.summary.quality[i]) + 1;
      const escaped = pulled.summary.totalDefectsEscaped; // 6
      return {
        unit: 'self-report vs true quality on main',
        spark: pulled.summary.confidence,
        ref: pulled.summary.quality,
        refLabel: 'true quality',
        sparkLabel: 'confidence',
        min: 0.3,
        max: 1,
        cross,
        tells: `self-approval — confidence crosses quality on day ${cross * 5}; ${escaped} defects ride onto main and the log stays silent`,
        stat: `${escaped} escaped defects, none logged`,
      };
    }
    case 'reversibility': {
      const wk = pulled.weeks.find((w) => w.events.some((e) => e.includes('ossified')))?.week ?? 3;
      const after = rnd(pulled.series.reviewCost.at(-1)); // 90
      return {
        unit: 'review minutes / week',
        spark: pulled.series.reviewCost,
        ref: intact.series.reviewCost,
        max: 100,
        marker: wk,
        tells: `ossified mistake — the day-${wk * 5} defect cannot come out; review doubles to ${after}m/wk and never falls`,
        stat: `trust frozen at ${f2(pulled.series.trust.at(-1))}`,
      };
    }
    case 'signalUpdate': {
      const flat = rnd(pulled.series.reviewCost.at(-1)); // 51
      const fell = rnd(intact.series.reviewCost.at(-1)); // 37
      const bill = rnd(
        pulled.series.reviewCost.reduce((a, b) => a + b, 0) -
          intact.series.reviewCost.reduce((a, b) => a + b, 0),
      );
      return {
        unit: 'review minutes / week (same seed twice)',
        spark: pulled.series.reviewCost,
        ref: intact.series.reviewCost,
        refLabel: 'closing loop',
        sparkLabel: 'no update',
        max: 60,
        tells: `amnesia — same ${pulled.summary.totalMerged} green merges, but day 30 is priced like day 1 (${flat}m vs ${fell}m): a ${bill}-minute bill, monthly`,
        stat: `trust flat at ${f2(pulled.series.trust.at(-1))}`,
      };
    }
    case 'authoritySurface': {
      const flip = pulled.summary.globalTrustFlip.week; // 4
      return {
        unit: 'mean trust across classes',
        spark: pulled.series.trust,
        ref: intact.series.trust,
        refLabel: 'per-class',
        sparkLabel: 'one switch',
        max: 0.7,
        marker: flip,
        tells: `global flip — one reverted regression on day ${flip * 5} trips the only switch there is; every class to zero, including the spotless ones`,
        stat: `3 of 3 classes zeroed`,
      };
    }
    default:
      return null;
  }
}

const CONSEQUENCE = Object.fromEntries(PARTS.map((p) => [p.id, consequenceFor(p.id)]));

/* ── The machine: six parts on a ring, drawn in a viewBox-scaled SVG ─────── */

// Five stages around an ellipse, in loop order, plus the authority hub at
// centre. Positions are hand-placed on a 760×360 board so the circuit reads
// clockwise and the labels never collide.
const W = 760;
const H = 360;
const CX = 300;
const CY = 182;
const RX = 232;
const RY = 128;

// Five stage angles, clockwise from the top (signal at 12 o'clock).
const STAGE_IDS = ['signal', 'boundedAction', 'verification', 'reversibility', 'signalUpdate'];
const NODES = STAGE_IDS.map((id, i) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
  return { id, x: CX + RX * Math.cos(a), y: CY + RY * Math.sin(a), angle: a };
});
const HUB = { id: 'authoritySurface', x: CX, y: CY };

// One curved arrow between consecutive stage nodes (the loop closing on itself).
function ringArc(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  // Bow the chord outward, away from the hub, so the ring reads as a circuit.
  const ox = mx - CX;
  const oy = my - CY;
  const olen = Math.hypot(ox, oy) || 1;
  const bow = 26;
  const ctrlX = mx + (ox / olen) * bow;
  const ctrlY = my + (oy / olen) * bow;
  // Trim the endpoints so the arrow lands at the node rim, not its centre.
  const t = 0.16;
  const sx = from.x + dx * t;
  const sy = from.y + dy * t;
  const ex = to.x - dx * t;
  const ey = to.y - dy * t;
  return { d: `M ${sx} ${sy} Q ${ctrlX} ${ctrlY} ${ex} ${ey}`, tip: { x: ex, y: ey } };
}

function Part({ node, label, sub, color, ejected, onClick, n }) {
  const r = 50;
  // Ejected parts lift up and fade; the seat they leave stays as a dashed ghost.
  const dy = ejected ? -30 : 0;
  return (
    <g>
      {ejected ? (
        <circle
          cx={node.x}
          cy={node.y}
          r={r}
          fill="none"
          stroke="var(--red)"
          strokeOpacity="0.5"
          strokeWidth="1.4"
          strokeDasharray="4 5"
        />
      ) : null}
      <g
        role="button"
        tabIndex={0}
        aria-pressed={ejected}
        aria-label={`${label}: ${sub}. ${ejected ? 'ejected — click to seat' : 'click to eject'}`}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        style={{
          cursor: 'pointer',
          transform: `translateY(${dy}px)`,
          transition: 'transform 0.28s cubic-bezier(.4,1.3,.5,1), opacity 0.28s',
          opacity: ejected ? 0.92 : 1,
        }}
      >
        <circle
          cx={node.x}
          cy={node.y}
          r={r}
          fill={ejected ? 'var(--paper-3)' : 'var(--paper-2)'}
          stroke={ejected ? 'var(--red)' : color}
          strokeWidth={ejected ? 2.4 : 2}
          style={{ transition: 'stroke 0.28s' }}
        />
        <circle cx={node.x} cy={node.y} r={r - 7} fill="none" stroke={color} strokeOpacity="0.28" />
        <text
          x={node.x}
          y={node.y - 12}
          textAnchor="middle"
          fontSize="11"
          fontFamily="var(--font-mono)"
          fill="var(--ink-faint)"
        >
          {n}
        </text>
        <text
          x={node.x}
          y={node.y + 5}
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fontFamily="var(--font-mono)"
          fill={ejected ? 'var(--red)' : 'var(--ink)'}
        >
          {label}
        </text>
        <text
          x={node.x}
          y={node.y + 22}
          textAnchor="middle"
          fontSize="9.5"
          fontFamily="var(--font-mono)"
          fill="var(--ink-faint)"
        >
          {ejected ? 'ejected' : 'seated'}
        </text>
      </g>
    </g>
  );
}

function Machine({ pulled, onToggle }) {
  // The hub governs every stage: faint spokes from centre to each node.
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="group"
      aria-label="The dependency-patch loop as a six-part machine: five stages on a ring around the authority hub. Click any part to eject it and break the circuit."
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* spokes: the authority surface governs each stage */}
      {NODES.map((node) => (
        <line
          key={`spoke-${node.id}`}
          x1={HUB.x}
          y1={HUB.y}
          x2={node.x}
          y2={node.y}
          stroke="var(--c-flaky)"
          strokeOpacity={pulled.authoritySurface ? 0.18 : 0.05}
          strokeWidth="1"
          strokeDasharray="2 4"
        />
      ))}

      {/* the ring: one arrow per consecutive stage, closing the loop */}
      {NODES.map((node, i) => {
        const to = NODES[(i + 1) % NODES.length];
        const { d, tip } = ringArc(node, to);
        // The seam breaks if either node it joins has been ejected.
        const broken = pulled[node.id] || pulled[to.id];
        return (
          <g key={`arc-${node.id}`}>
            <path
              d={d}
              fill="none"
              stroke={broken ? 'var(--red)' : 'var(--accent)'}
              strokeOpacity={broken ? 0.85 : 0.85}
              strokeWidth={broken ? 2 : 2.4}
              strokeDasharray={broken ? '5 6' : undefined}
              style={{ transition: 'stroke 0.28s' }}
            />
            {!broken ? (
              <circle cx={tip.x} cy={tip.y} r="3.6" fill="var(--accent)" />
            ) : (
              <text
                x={tip.x}
                y={tip.y - 6}
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                fill="var(--red)"
                fontFamily="var(--font-mono)"
              >
                ✕
              </text>
            )}
          </g>
        );
      })}

      {/* the hub: the authority surface, itself ejectable */}
      <g>
        {pulled.authoritySurface ? (
          <circle
            cx={HUB.x}
            cy={HUB.y}
            r="40"
            fill="none"
            stroke="var(--red)"
            strokeOpacity="0.5"
            strokeWidth="1.4"
            strokeDasharray="4 5"
          />
        ) : null}
        <g
          role="button"
          tabIndex={0}
          aria-pressed={pulled.authoritySurface}
          aria-label={`authority surface: ${PARTS[5].what}. ${
            pulled.authoritySurface ? 'ejected — one global switch remains' : 'click to eject'
          }`}
          onClick={() => onToggle('authoritySurface')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle('authoritySurface');
            }
          }}
          style={{
            cursor: 'pointer',
            transition: 'opacity 0.28s',
            opacity: pulled.authoritySurface ? 0.92 : 1,
          }}
        >
          <circle
            cx={HUB.x}
            cy={HUB.y}
            r="40"
            fill="var(--paper-2)"
            stroke={pulled.authoritySurface ? 'var(--red)' : 'var(--c-flaky)'}
            strokeWidth={pulled.authoritySurface ? 2.4 : 2}
            style={{ transition: 'stroke 0.28s' }}
          />
          <text
            x={HUB.x}
            y={HUB.y - 9}
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill="var(--ink-faint)"
          >
            6 · per-class
          </text>
          <text
            x={HUB.x}
            y={HUB.y + 7}
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fontFamily="var(--font-mono)"
            fill={pulled.authoritySurface ? 'var(--red)' : 'var(--ink)'}
          >
            authority
          </text>
          <text
            x={HUB.x}
            y={HUB.y + 23}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--font-mono)"
            fill="var(--ink-faint)"
          >
            {pulled.authoritySurface ? 'one global switch' : 'governs the ring'}
          </text>
        </g>
      </g>

      {/* the five stage parts */}
      {NODES.map((node, i) => {
        const part = partById(node.id);
        return (
          <Part
            key={node.id}
            node={node}
            n={i + 1}
            label={part.label}
            sub={part.what}
            color="var(--c-deppatch)"
            ejected={pulled[node.id]}
            onClick={() => onToggle(node.id)}
          />
        );
      })}

      {/* the panel header on the right: which part is out, named */}
      <text
        x={W - 8}
        y={26}
        textAnchor="end"
        fontSize="11"
        fontFamily="var(--font-mono)"
        fill="var(--ink-faint)"
      >
        dependency-patch loop
      </text>
    </svg>
  );
}

/* ── The consequence sparkline (engine series, drawn once a call commits) ── */

function Sparkline({ data }) {
  const sw = 440;
  const sh = 150;
  const padL = 40;
  const padR = 14;
  const padT = 16;
  const padB = 26;
  const yMin = data.min ?? 0;
  const yMax = data.max;
  const x = (i) => padL + (i / (WEEKS - 1)) * (sw - padL - padR);
  const y = (v) => padT + (1 - (v - yMin) / (yMax - yMin)) * (sh - padT - padB);
  const path = (vals) => vals.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const ticks = [yMin, (yMin + yMax) / 2, yMax];

  return (
    <figure style={{ margin: '4px 0 0' }}>
      <div
        className="mono"
        style={{
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          fontSize: '10.5px',
          color: 'var(--ink-faint)',
          marginBottom: 2,
        }}
      >
        <span style={{ color: 'var(--red)' }}>━ {data.sparkLabel ?? 'consequence'}</span>
        {data.ref ? (
          <span style={{ color: 'var(--accent)' }}>━ {data.refLabel ?? 'with the part'}</span>
        ) : null}
        {data.limit ? <span style={{ color: 'var(--amber)' }}>┅ approval reasoning</span> : null}
      </div>
      <svg
        viewBox={`0 0 ${sw} ${sh}`}
        role="img"
        aria-label={`Thirty-day consequence sparkline: ${data.unit}. ${data.tells}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              x2={sw - padR}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--line-soft)"
              strokeWidth="1"
            />
            <text
              x={padL - 6}
              y={y(t) + 3.2}
              textAnchor="end"
              fontSize="9"
              fill="var(--ink-faint)"
              fontFamily="var(--font-mono)"
            >
              {Number.isInteger(t) ? t : t.toFixed(t < 1 ? 2 : 0)}
            </text>
          </g>
        ))}
        {[1, 3, 5].map((wk) => (
          <text
            key={wk}
            x={x(wk - 1)}
            y={sh - padB + 14}
            textAnchor="middle"
            fontSize="9"
            fill="var(--ink-faint)"
            fontFamily="var(--font-mono)"
          >
            day {wk * 5}
          </text>
        ))}
        {data.limit ? (
          <line
            x1={padL}
            x2={sw - padR}
            y1={y(data.limit)}
            y2={y(data.limit)}
            stroke="var(--amber)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ) : null}
        {data.marker ? (
          <line
            x1={x(data.marker - 1)}
            x2={x(data.marker - 1)}
            y1={padT}
            y2={sh - padB}
            stroke="var(--red)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ) : null}
        {data.cross ? (
          <line
            x1={x(data.cross - 1)}
            x2={x(data.cross - 1)}
            y1={padT}
            y2={sh - padB}
            stroke="var(--red)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ) : null}
        {data.ref ? (
          <polyline
            points={path(data.ref)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.8"
            strokeOpacity="0.7"
          />
        ) : null}
        <polyline points={path(data.spark)} fill="none" stroke="var(--red)" strokeWidth="2.4" />
        {data.spark.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={i === WEEKS - 1 ? 3.2 : 2} fill="var(--red)" />
        ))}
      </svg>
      <figcaption
        className="mono"
        style={{ fontSize: '10.5px', color: 'var(--ink-faint)', margin: '2px 0 0' }}
      >
        {data.unit}
      </figcaption>
    </figure>
  );
}

/* ── The specimen deck (loop-kind cases, fixed order, the empty slot) ────── */

// Four real loops from the bank: the leashed bumper (a script with manners),
// the stdout mapper (amnesia), the game-tick loop (no signal of its own), the
// contested ack-as-oracle. The boundary case opens; the contested one closes.
const SPECIMEN_IDS = ['lp-04', 'lp-01', 'lp-05', 'lp-03'];
const SPECIMENS = SPECIMEN_IDS.map((id) => CASES.find((c) => c.id === id));

const GLASS = glassSlice(loopstepRaw, 'function stepWeek(state, config, rng)', '\n}');

/* ── The page ────────────────────────────────────────────────────────────── */

export default function P12() {
  // pulled: which parts are ejected. One at a time tells one story; the gate
  // and sparkline track the single most-recently ejected part.
  const [pulled, setPulled] = useState({});
  const [active, setActive] = useState(null); // the part the panel reads
  const [call, setCall] = useState({}); // committed prediction per part

  const toggle = (id) => {
    setPulled((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      return next;
    });
    setActive((cur) => {
      // Ejecting makes a part active; seating it clears the panel.
      if (pulled[id]) return cur === id ? null : cur;
      return id;
    });
  };

  const part = active ? partById(active) : null;
  const committed = active ? call[active] : null;
  const data = active && committed ? CONSEQUENCE[active] : null;

  const commit = (picked) => setCall((prev) => ({ ...prev, [active]: picked }));

  return (
    <Page
      n={12}
      claim="Script vs loop is a checkable condition; the missing slot predicts the failure."
    >
      <Activity wide>
        <Machine pulled={pulled} onToggle={toggle} />

        {!part ? (
          <p
            className="mono"
            style={{
              fontSize: '12.5px',
              color: 'var(--ink-faint)',
              textAlign: 'center',
              margin: '4px 0 0',
            }}
          >
            <Mark kind="made" note="Ch 1's machine, six parts; the runs are the engine's" /> all six
            seated, the loop closes · eject any part to break the circuit
          </p>
        ) : !committed ? (
          <Commit
            key={active}
            prompt={`The ${part.label} part is out; the other five still run. The §3.2 table gives each absence a name — which failure do the next thirty days deliver?`}
            options={PART_OPTIONS}
            onReveal={commit}
          >
            {(picked) => (
              <p style={{ margin: 0 }}>
                {picked === active ? (
                  <>
                    Called. <strong>{part.consequence}</strong> Run it: the sparkline below is the
                    engine&apos;s, same seed, the part removed.
                  </>
                ) : (
                  <>
                    A real row of the table — but this seam is the{' '}
                    <span className="mono">{part.label}</span> part, and §3.2 names its absence{' '}
                    <strong>{part.consequence.toLowerCase()}</strong>
                  </>
                )}
              </p>
            )}
          </Commit>
        ) : (
          <div className="mh-feedback" data-testid="consequence" style={{ marginTop: 10 }}>
            <span className="mh-kicker" style={{ display: 'block', marginBottom: 4 }}>
              Thirty days · seed {part.seed} · {part.label} ejected
            </span>
            <Sparkline data={data} />
            <p style={{ margin: '8px 0 0' }}>
              <span
                className="mono"
                style={{
                  display: 'inline-block',
                  padding: '1px 7px',
                  borderRadius: 3,
                  background: 'var(--red-soft)',
                  color: 'var(--red)',
                  fontWeight: 700,
                  fontSize: '12px',
                  marginRight: 8,
                }}
              >
                {part.pathology}
              </span>
              {data.tells.replace(/^[a-z- ]+— /, '')}
            </p>
            <p
              className="mono"
              style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--ink-2)' }}
            >
              {data.stat}.
            </p>
            <div className="mh-controls" style={{ marginTop: 10 }}>
              <button type="button" className="mh-btn" onClick={() => toggle(active)}>
                Seat the {part.label} part back
              </button>
            </div>
          </div>
        )}

        <ModelNotes
          register="mechanism"
          notes={[
            '"Thirty days" is six weekly cycles of the engine: this loop fires weekly, so a month of run time is six runs (runLoopWeeks, weeks: 6).',
            'Seeds are pinned per part (signal 2, action 9, verify 5, revert 8, update 9, authority 17) so each pull draws the same shape every time; re-rolling the seed moves the dates, not the shape.',
            'Each eject removes exactly one part while five stay healthy — that isolation is the instrument, not a claim about how loops fail in the field, where they are usually short more than one and the pathologies compound.',
          ]}
          cannotShow="what several missing parts do together, and these are not your constants — the engine draws each failure's shape, not its size in your repo."
          glass={GLASS}
        />
      </Activity>

      <Seen>
        Six parts, six different failures, each named by the table before you ejected anything. Five
        of these machines hum for weeks before the missing part bites — incompleteness is a stage,
        not a sin.
      </Seen>

      <Takeaway>
        A loop missing any of the six ingredients isn&apos;t a loop yet — it&apos;s a script looking
        for a home, and which slot is empty predicts exactly how it fails.
      </Takeaway>

      <Deeper title="Field specimens: run the check on real loops">
        <p style={{ margin: '0 0 10px' }}>
          The same six-slot check, on machines met in the field <Mark kind="real" />: a team that
          calls it a loop, a record that mostly behaves. Which slot is empty, and does the empty
          slot predict the failure already in the evidence? One case is contested, and says so once
          you commit.
        </p>
        <Drill cases={SPECIMENS} title="Specimen diagnosis" />
        <p style={{ margin: '14px 0 6px', fontWeight: 600 }}>
          The boundary, stated <Badge layer="W" note="§3.2–3.3 — the six-ingredient condition" />
        </p>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink-2)' }}>
          A loop is healthy when all six ingredients exist, are bounded in time and scope, and{' '}
          <em>close</em> — the outcome feeds back as a signal the next loop can read. The
          dependency-patch loop has all six: signal (patch available, changelog clean), bounded
          action (one bump, lockfile only), verification (CI), reversibility (git revert), signal
          update (CI result feeds the track record), authority surface (auto-merge eligibility by
          class and record). Loops that don&apos;t close aren&apos;t loops; they&apos;re
          fire-and-forget scripts that accumulate debt.
        </p>
        <p style={{ margin: '12px 0 0', fontSize: '12.5px', color: 'var(--ink-faint)' }}>
          The deck is anonymized and composited from the corpus: surfaces renamed, identifying
          detail invented, the failure shapes as found. Covers §3.2–3.3 boundary.
        </p>
      </Deeper>
    </Page>
  );
}
