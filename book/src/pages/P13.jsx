// P13 — A dozen loops, one ladder. The platform grows by adding loops, not by
// making one smarter (§3.3, §3.4, §4.2).
//
// One activity, two coupled halves. Top: the bestiary wall — thirteen catalog
// loops from §3.3 as cast-colored cards in three bands (starter / middle /
// advanced). Click any card and its six-step micro-run draws in the side
// panel: trigger → bounded action → outside reference → reversal → signal
// produced → who reads it next. The micro-runs are the §3.3 skeletons drawn,
// loop by loop; the shape is the fidelity, not any vendor's pipeline.
//
// Bottom: the ladder (BET REGISTER). The staging engine's recorded run, the
// cost-of-the-nth-loop curve bending down through stages 0-6 as you step the
// Walkthrough — labeled the author's bet, drawn — with skip-Stage-0 and the
// dissent parameterization as ghost curves the reader can summon. Physics:
// src/engine/scenarios/staging.js, every number read off the runs.

import { useState } from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, Mark, Walkthrough, ModelNotes, glassSlice } from '../components/kit.jsx';
import { stagingRun, dissent, simulateStaging } from '../engine/scenarios/staging.js';
import stagingSrc from '../engine/scenarios/staging.js?raw';

/* ── The bestiary: thirteen catalog loops (§3.3), banded and cast-colored ── */

// Each loop is a §3.3 skeleton compressed to its six-part shape. `glyph` is a
// tiny SVG signature drawn inside the card; `run` is the recorded micro-run —
// six steps, the loop's actual trigger/verify/signal, drawn from the catalog.
const LOOPS = [
  {
    id: 'stale-doc',
    name: 'stale-doc refresh',
    band: 'starter',
    color: 'var(--c-docs)',
    one: 'Doc freshness decays with code change, resets on review.',
    run: [
      ['trigger', 'gap between last code change and last doc update crosses threshold'],
      ['action', 'rewrite the page against current code; flag sentences it could not confirm'],
      ['reference', 'a reviewer tagged from the code-ownership file reads it'],
      ['reversal', 'one revert — docs are text, undo is free'],
      ['signal', 'a freshness field that decays with code change'],
      ['read by', 'every agent that reads the page next — and the triage loop'],
    ],
  },
  {
    id: 'flaky-test',
    name: 'flaky-test',
    band: 'starter',
    color: 'var(--c-flaky)',
    one: 'Pass rate into a flaky band; one scoped fix, else quarantine.',
    run: [
      ['trigger', 'pass rate per test drops into the flaky band'],
      ['action', 'one scoped fix: seed isolation, timing, or retry-with-diagnostic'],
      ['reference', 'CI re-runs decide whether the flake is gone'],
      ['reversal', 'persists? quarantine the test, assign an owner'],
      ['signal', 'a flakiness score per test that compounds across runs'],
      ['read by', 'the patch loop — it reads flakiness before it bumps'],
    ],
  },
  {
    id: 'dead-code',
    name: 'dead-code',
    band: 'starter',
    color: 'var(--c-deadcode)',
    one: 'Cold across a window earns a deletion PR; revert is one diff.',
    run: [
      ['trigger', 'coverage + import graph + call telemetry mark a region dead'],
      ['action', 'dead across a stability window → deprecation proposal, then a deletion PR'],
      ['reference', 'a second window with no usage confirms it is cold'],
      ['reversal', 'the deletion is a single revert'],
      ['signal', 'a persistent map of cold regions'],
      ['read by', 'the refactor-candidate loop reads the map as an input'],
    ],
  },
  {
    id: 'triage',
    name: 'triage',
    band: 'middle',
    color: 'var(--c-triage)',
    one: 'Reads the whole field; produces a ranked queue, does no work.',
    run: [
      ['trigger', 'incident telemetry, fragility map, freshness scores, backlog accumulate'],
      ['action', 'a planner orders the next work — a ranked queue with rationale'],
      ['reference', 'which ranking criteria correlated with real business outcomes'],
      ['reversal', 'reorder; it commits no change of its own'],
      ['signal', 'an audit that tunes the ranker'],
      ['read by', 'every executing loop pulls its next item from the queue'],
    ],
  },
  {
    id: 'on-call',
    name: 'on-call assist',
    band: 'middle',
    color: 'var(--c-security)',
    one: 'Drafts a hypothesis and three diagnostic checks; human acts.',
    run: [
      ['trigger', 'an alert fires'],
      ['action', 'pull runbook, deploy history, dashboards, the last three similar incidents'],
      ['reference', 'the human on-call reads, corrects, and acts'],
      ['reversal', 'a draft, never an action — nothing to undo'],
      ['signal', 'alignment between agent hypothesis and actual root cause'],
      ['read by', 'the autonomy gate, as confidence to widen on narrow classes'],
    ],
  },
  {
    id: 'refactor',
    name: 'refactor-candidate',
    band: 'middle',
    color: 'var(--c-backfill)',
    one: 'Proposes a refactor plan and a prototype; a human authorizes.',
    run: [
      ['trigger', 'churn + coupling + fragility + ownership exceed a refactor-pressure threshold'],
      ['action', 'propose a plan with costs, risks, and a small prototype — not the refactor'],
      ['reference', 'a human decides whether to authorize execution'],
      ['reversal', 'the prototype is a sandbox; the plan is reversible by declining it'],
      ['signal', 'a history of where refactor pressure predicted real debt'],
      ['read by', 'the steward, weighing where architectural debt is forming'],
    ],
  },
  {
    id: 'test-backfill',
    name: 'test-backfill',
    band: 'middle',
    color: 'var(--c-deppatch)',
    one: 'Writes tests for hot, low-coverage code; marks behavioral vs spec.',
    run: [
      ['trigger', 'a region shows high churn and low coverage'],
      [
        'action',
        'write tests, marking each behavioral (locks current) or specified (locks intent)',
      ],
      ['reference', 'behavioral tests are flagged for review — they encode whatever is there'],
      ['reversal', 'tests are additive; drop the commit to undo'],
      ['signal', 'a coverage map weighted by criticality'],
      ['read by', 'the migration loop — which shards are safe to move first'],
    ],
  },
  {
    id: 'security-patch',
    name: 'security-patch',
    band: 'middle',
    color: 'var(--c-disturb)',
    one: 'CVE → matched package → patch; availability is not application.',
    run: [
      ['trigger', 'a CVE advisory matches a package in the dependency graph'],
      ['action', 'open a change per affected package: advisory, path, suggested version'],
      ['reference', 'CI; non-breaking + non-critical may auto-merge once earned, else human'],
      ['reversal', 'a version bump reverts cleanly'],
      ['signal', 'mean time from advisory to remediation, per criticality tier'],
      ['read by', 'the steward — availability of a patch is not application of one'],
    ],
  },
  {
    id: 'feature-prototype',
    name: 'feature prototype',
    band: 'advanced',
    color: 'var(--c-docs)',
    one: 'Competing builds against acceptance assertions; a human picks.',
    run: [
      ['trigger', 'a product intent: acceptance assertions plus UX sketches'],
      ['action', 'agents build competing implementations against the assertions in a sandbox'],
      ['reference', 'a human compares on feel and fit and chooses a direction'],
      ['reversal', 'sandbox builds; rejected ones are discarded, not shipped'],
      ['signal', 'a library of rejected implementations — a signal about taste'],
      ['read by', 'product judgment, now with more options prepared'],
    ],
  },
  {
    id: 'spec-adversary',
    name: 'spec-by-adversary',
    band: 'advanced',
    color: 'var(--c-flaky)',
    one: 'Subagents try to falsify each assertion; survivors are verified.',
    run: [
      ['trigger', 'a well-bounded interface, intent written as assertions'],
      ['action', 'adversarial subagents attempt to falsify each assertion against the code'],
      ['reference', 'an assertion that survives sustained attack is treated as verified'],
      ['reversal', 'one that falls triggers a human call: code wrong, or assertion wrong?'],
      ['signal', 'an executable, continuously-stressed specification'],
      ['read by', 'every loop that crosses the boundary the spec guards'],
    ],
  },
  {
    id: 'migration',
    name: 'migration',
    band: 'advanced',
    color: 'var(--c-backfill)',
    one: 'Independently-reversible shards; steward owns commit-to-next.',
    run: [
      ['trigger', 'a long-running migration — schema, framework, API deprecation'],
      [
        'action',
        'decompose into independently-reversible steps; per shard: prepare, migrate, verify',
      ],
      ['reference', 'verify each shard before the commit-to-next-step decision'],
      ['reversal', 'roll back the shard and pause — the whole point of the shape'],
      ['signal', 'migration progress as visible, resumable state'],
      ['read by', 'the steward, who owns commit-to-next; no more stalls at 40%'],
    ],
  },
  {
    id: 'capacity-routing',
    name: 'capacity-routing',
    band: 'advanced',
    color: 'var(--c-triage)',
    one: 'Routes work to the agent whose track record fits the class.',
    run: [
      ['trigger', 'incoming work arrives across task classes'],
      ['action', 'a meta-agent routes each to the agent whose record best matches the class'],
      ['reference', 'approval rates per task class set who gets more work'],
      ['reversal', 'reroute; the steward sets policy and gate thresholds'],
      ['signal', 'a per-agent specialization pattern the team can read'],
      ['read by', 'the steward, tuning routing policy and gates'],
    ],
  },
  {
    id: 'disturbance',
    name: 'disturbance',
    band: 'advanced',
    color: 'var(--c-disturb)',
    one: 'Removes things on purpose; collapse surfaces a hidden dependency.',
    run: [
      ['trigger', 'a schedule — not a bug report'],
      [
        'action',
        'fail a tool, remove relied-on context, simulate a regression, revoke a permission',
      ],
      ['reference', 'observe other loops: graceful re-adaptation versus collapse'],
      ['reversal', 'the disturbance is controlled and lifted; that is the design'],
      ['signal', 'a map of fragile assumptions and resilient ones'],
      ['read by', 'the steward, deciding where the next hardening belongs'],
    ],
  },
];

const BANDS = [
  { id: 'starter', label: 'Starter', sub: 'high reversibility · narrow scope · clean signals' },
  { id: 'middle', label: 'Middle', sub: 'wider scope · richer signals · still reversible' },
  { id: 'advanced', label: 'Advanced', sub: 'require mature terrain' },
];

const loopById = (id) => LOOPS.find((l) => l.id === id);

/* ── A loop glyph: a tiny closed circuit, cast-colored, drawn per card ────── */

// Five dots on a ring with one arrow closing it — the loop, in miniature. The
// active card animates the token around the ring; the rest sit at rest.
function Glyph({ color, active }) {
  const cx = 22;
  const cy = 22;
  const r = 13;
  const dots = [0, 1, 2, 3, 4].map((i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  return (
    <svg viewBox="0 0 44 44" width="36" height="36" aria-hidden="true" style={{ flex: '0 0 auto' }}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeOpacity="0.35"
        strokeWidth="1.4"
      />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r="2.4" fill={color} fillOpacity={active ? 1 : 0.7} />
      ))}
      {active ? (
        <circle r="2.8" fill={color}>
          <animateMotion
            dur="2.6s"
            repeatCount="indefinite"
            path={`M ${dots[0].x} ${dots[0].y} L ${dots[1].x} ${dots[1].y} L ${dots[2].x} ${dots[2].y} L ${dots[3].x} ${dots[3].y} L ${dots[4].x} ${dots[4].y} Z`}
          />
        </circle>
      ) : null}
    </svg>
  );
}

function Card({ loop, active, onClick }) {
  return (
    <button
      type="button"
      className="mh-chip"
      aria-pressed={active}
      aria-label={`${loop.name} loop — ${loop.one}`}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        textAlign: 'left',
        padding: '8px 11px',
        width: '100%',
        borderTopColor: active ? loop.color : 'var(--line-soft)',
        borderRightColor: active ? loop.color : 'var(--line-soft)',
        borderBottomColor: active ? loop.color : 'var(--line-soft)',
        borderLeftColor: loop.color,
        borderLeftWidth: 3,
        background: active ? 'var(--paper-3)' : undefined,
      }}
    >
      <Glyph color={loop.color} active={active} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 700, fontSize: '13.5px' }}>{loop.name}</span>
        <span
          className="mono"
          style={{
            display: 'block',
            fontSize: '11px',
            color: 'var(--ink-faint)',
            lineHeight: 1.35,
          }}
        >
          {loop.one}
        </span>
      </span>
    </button>
  );
}

/* ── The micro-run panel: six steps drawn as a closing circuit ───────────── */

// The selected loop's six parts on a vertical rail, the current step lit, the
// loop closing from "read by" back up to "trigger" with a faint return arc.
function MicroRun({ loop, step, onStep }) {
  const parts = loop.run;
  const last = parts.length - 1;
  const W = 360;
  const rowH = 48;
  const H = parts.length * rowH + 18;
  const railX = 26;
  const y = (i) => 22 + i * rowH;

  return (
    <div>
      <div className="mh-controls" style={{ marginBottom: 6 }}>
        <button
          type="button"
          className="mh-btn"
          onClick={() => onStep(Math.max(0, step - 1))}
          disabled={step === 0}
          aria-label="Previous part of the loop"
        >
          Prev
        </button>
        <button
          type="button"
          className="mh-btn"
          onClick={() => onStep(Math.min(last, step + 1))}
          disabled={step === last}
          aria-label="Next part of the loop"
        >
          Next
        </button>
        <button
          type="button"
          className="mh-btn"
          onClick={() => onStep(0)}
          disabled={step === 0}
          aria-label="Reset the micro-run to the trigger"
        >
          Reset
        </button>
        <span className="mh-kicker" aria-live="polite">
          {parts[step][0]} · {step + 1} of {parts.length}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${loop.name} loop, six parts. Now showing ${parts[step][0]}: ${parts[step][1]}.`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* the return arc: read by → trigger, closing the loop */}
        <path
          d={`M ${railX} ${y(last)} C ${railX - 16} ${y(last)}, ${railX - 16} ${y(0)}, ${railX} ${y(0)}`}
          fill="none"
          stroke={loop.color}
          strokeOpacity="0.4"
          strokeWidth="1.4"
          strokeDasharray="3 4"
        />
        <path
          d={`M ${railX} ${y(0)} l -4 5 m 4 -5 l 4 5`}
          fill="none"
          stroke={loop.color}
          strokeOpacity="0.4"
          strokeWidth="1.4"
        />
        {/* the rail spine */}
        <line
          x1={railX}
          y1={y(0)}
          x2={railX}
          y2={y(last)}
          stroke="var(--line-soft)"
          strokeWidth="2"
        />
        {parts.map((p, i) => {
          const on = i === step;
          const done = i < step;
          return (
            <g
              key={p[0]}
              role="button"
              tabIndex={0}
              aria-label={`${p[0]}: ${p[1]}`}
              onClick={() => onStep(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onStep(i);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={railX}
                cy={y(i)}
                r={on ? 8 : 5.5}
                fill={on || done ? loop.color : 'var(--paper-2)'}
                fillOpacity={done ? 0.5 : 1}
                stroke={loop.color}
                strokeWidth="2"
                style={{ transition: 'r 0.2s, fill-opacity 0.2s' }}
              />
              <text
                x={railX + 22}
                y={y(i) - 4}
                fontSize="11"
                fontFamily="var(--font-mono)"
                fontWeight={on ? 700 : 600}
                fill={on ? loop.color : 'var(--ink-faint)'}
                style={{ transition: 'fill 0.2s' }}
              >
                {p[0]}
              </text>
              <text
                x={railX + 22}
                y={y(i) + 11}
                fontSize="11.5"
                fill={on ? 'var(--ink)' : 'var(--ink-2)'}
                opacity={on ? 1 : 0.62}
                style={{ transition: 'opacity 0.2s, fill 0.2s' }}
              >
                {p[1].length > 58 ? p[1].slice(0, 57) + '…' : p[1]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── The ladder: the staging engine's cost-of-the-nth-loop curve ─────────── */

const LADDER_SEED = 11; // the book's canonical staging seed
const BET_TRACE = stagingRun(LADDER_SEED);
const DISSENT_TRACE = dissent(LADDER_SEED);

const BET = BET_TRACE.steps.at(-1).data; // { rows, costs, events }
const SKIP_RUN = simulateStaging(LADDER_SEED, { skipStage0: true });
const DIS = DISSENT_TRACE.steps.at(-1).data; // { skip, staged }

const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
const fmt2 = (v) => (Math.round(v * 100) / 100).toFixed(2);
const finalCum = (run) => run.rows.at(-1).cumYield;

const COST_FIRST = BET.costs[0]; // 10 steward-days, loop one
const COST_LAST = BET.costs.at(-1); // ~3.4, loop twelve
const SKIP_COSTS = SKIP_RUN.costs;
const DIS_COSTS = DIS.skip.costs;

// Stage arrivals, placed on the loop-count axis: each event lands above the
// loop closed by that week. Stage 0 sits at the origin (no loops shipped yet);
// the rest dedupe per loop index, keeping the highest stage that arrived there.
const STAGE_MARKS = (() => {
  const byLoop = new Map();
  let stage0Loops = 1;
  for (const e of BET.events) {
    const m = e.label.match(/^stage (\d)/);
    if (!m) continue;
    const stage = Number(m[1]);
    const loops = BET.rows[e.week - 1]?.loops ?? 0;
    if (stage === 0) {
      stage0Loops = Math.max(1, loops);
      continue;
    }
    const li = Math.max(1, Math.min(BET.costs.length, loops || 1));
    byLoop.set(li, Math.max(byLoop.get(li) ?? 0, stage));
  }
  // Stage 0/1 both sit at loop 1 in this seed; show "0-1" there.
  const marks = [...byLoop.entries()].map(([loop, stage]) => ({
    loop,
    tag: loop === stage0Loops && stage <= 1 ? '0-1' : String(stage),
  }));
  return marks.sort((a, b) => a.loop - b.loop);
})();

// Which loop index each step's caption reaches, so the curve reveals stepwise.
const STEP_REACH = [1, 5, 8, 12, 12];

function niceMax(v) {
  for (const s of [10, 20, 50]) if (v <= s) return s;
  return Math.ceil(v / 50) * 50;
}

// The cost of the nth loop. Bet curve solid; ghosts (skip / dissent) dashed
// when summoned. `reveal` clips the bet curve to the steps walked so far.
function LadderChart({ reveal, ghost }) {
  const W = 560;
  const H = 256;
  const padL = 42;
  const padR = 16;
  const padT = 38;
  const padB = 34;
  const n = BET.costs.length; // 12
  const yMax = niceMax(Math.max(...BET.costs, ...SKIP_COSTS));
  const x = (i) => padL + ((i - 1) / (n - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - v / yMax) * (H - padT - padB);
  const stepX = [1, 4, 8, 12];
  const betShown = BET.costs.slice(0, reveal);

  const series = [];
  if (ghost === 'skip') {
    series.push({ name: 'stage 0 skipped', costs: SKIP_COSTS, color: 'var(--amber)' });
  }
  if (ghost === 'dissent') {
    series.push({
      name: 'dissent: 3 loops, strong conventions',
      costs: DIS_COSTS,
      color: 'var(--c-disturb)',
    });
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`The cost of the nth loop: bending from ${fmt(COST_FIRST)} steward-days for loop one toward ${fmt(COST_LAST)} for loop twelve, as terrain instrumentation gets reused. Stage arrivals marked along the top.`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {[0, yMax / 2, yMax].map((v) => (
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
            fontSize="9.5"
            fill="var(--ink-faint)"
            fontFamily="var(--font-mono)"
          >
            {v}
          </text>
        </g>
      ))}
      {stepX.map((t) => (
        <text
          key={t}
          x={x(t)}
          y={H - padB + 15}
          textAnchor="middle"
          fontSize="9.5"
          fill="var(--ink-faint)"
          fontFamily="var(--font-mono)"
        >
          {t === 1 ? 'loop 1' : `loop ${t}`}
        </text>
      ))}
      <text
        x={padL}
        y={H - 5}
        textAnchor="start"
        fontSize="9.5"
        fill="var(--ink-faint)"
        fontFamily="var(--font-mono)"
      >
        steward-days to close loop n · stages 0-6 along the top
      </text>

      {/* stage arrivals on the loop-count axis: a caret + the stage number */}
      {STAGE_MARKS.map((m) => (
        <g key={m.loop}>
          <line
            x1={x(m.loop)}
            x2={x(m.loop)}
            y1={padT - 6}
            y2={y(BET.costs[m.loop - 1])}
            stroke="var(--line-soft)"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
          <text
            x={x(m.loop)}
            y={padT - 12}
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill="var(--accent-ink)"
            fontFamily="var(--font-mono)"
          >
            {m.tag}
          </text>
        </g>
      ))}
      <text
        x={padL - 2}
        y={padT - 24}
        textAnchor="start"
        fontSize="8.5"
        fill="var(--ink-faint)"
        fontFamily="var(--font-mono)"
      >
        stage:
      </text>

      {/* ghost curves, dashed, drawn behind the bet */}
      {series.map((s) => (
        <g key={s.name}>
          <polyline
            points={s.costs.map((c, i) => `${x(i + 1)},${y(c)}`).join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeDasharray="5 4"
            strokeOpacity="0.85"
          />
          <circle cx={x(s.costs.length)} cy={y(s.costs.at(-1))} r="3" fill={s.color} />
        </g>
      ))}

      {/* the bet curve, revealed stepwise */}
      {betShown.length > 1 ? (
        <polyline
          points={betShown.map((c, i) => `${x(i + 1)},${y(c)}`).join(' ')}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.6"
          style={{ transition: 'all 0.3s' }}
        />
      ) : null}
      {betShown.map((c, i) => (
        <circle
          key={i}
          cx={x(i + 1)}
          cy={y(c)}
          r={i === betShown.length - 1 ? 4 : 2.4}
          fill="var(--accent)"
        />
      ))}
      {betShown.length ? (
        <text
          x={x(betShown.length) + (betShown.length > 8 ? -10 : 10)}
          y={y(betShown.at(-1)) + (betShown.length > 8 ? 20 : betShown.length > 1 ? -9 : 18)}
          textAnchor={betShown.length > 8 ? 'end' : 'start'}
          fontSize="11"
          fontWeight="700"
          fill="var(--accent-ink)"
          fontFamily="var(--font-mono)"
        >
          {fmt(betShown.at(-1))} d
        </text>
      ) : null}
    </svg>
  );
}

const GLASS = glassSlice(
  stagingSrc,
  'Cost of closing loop n',
  'return { rows, costs, legibility, events };\n}',
);

/* ── The catalog one-liners, by band (the §3.3 fold table) ──────────────── */

const CATALOG = BANDS.map((b) => ({
  ...b,
  loops: LOOPS.filter((l) => l.band === b.id),
}));

/* ── The page ────────────────────────────────────────────────────────────── */

export default function P13() {
  // The bestiary's selection; dependency-patch's heirs default to the first
  // starter so the page is legible at rest with a real micro-run pre-loaded.
  const [pickedId, setPickedId] = useState('flaky-test');
  const [microStep, setMicroStep] = useState(0);
  const picked = loopById(pickedId);

  const select = (id) => {
    setPickedId(id);
    setMicroStep(0);
  };

  // The ladder Walkthrough drives the curve reveal; a separate toggle summons
  // a ghost (skip Stage 0 / dissent) without re-running anything.
  const [ghost, setGhost] = useState(null);

  return (
    <Page n={13} claim="The platform grows by adding loops, not by making one smarter.">
      <Activity wide>
        {/* ── the bestiary wall + the micro-run panel ─────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
            gap: 18,
            alignItems: 'start',
          }}
        >
          <div role="group" aria-label="The bestiary: thirteen catalog loops in three bands">
            {BANDS.map((band) => (
              <div key={band.id} style={{ marginBottom: 12 }}>
                <div
                  className="mh-kicker"
                  style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}
                >
                  <span>{band.label}</span>
                  <span
                    style={{
                      fontWeight: 400,
                      textTransform: 'none',
                      letterSpacing: 0,
                      color: 'var(--ink-faint)',
                    }}
                  >
                    {band.sub}
                  </span>
                </div>
                <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                  {LOOPS.filter((l) => l.band === band.id).map((loop) => (
                    <Card
                      key={loop.id}
                      loop={loop}
                      active={loop.id === pickedId}
                      onClick={() => select(loop.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              position: 'sticky',
              top: 12,
              borderWidth: '1px 1px 1px 3px',
              borderStyle: 'solid',
              borderColor: `var(--line-soft) var(--line-soft) var(--line-soft) ${picked.color}`,
              borderRadius: 8,
              background: 'var(--paper)',
              padding: '12px 14px',
            }}
          >
            <span className="mh-kicker" style={{ display: 'block', color: picked.color }}>
              {picked.name} · the loop, recorded
            </span>
            <MicroRun loop={picked} step={microStep} onStep={setMicroStep} />
            <p
              className="mono"
              style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ink-faint)' }}
            >
              <Mark
                kind="made"
                note="the §3.3 catalog skeleton drawn — the shape is the fidelity, not any pipeline"
              />{' '}
              same six parts as every other loop · only the cast color changes
            </p>
          </div>
        </div>

        {/* ── the ladder: the cost of the nth loop, bet register ──────── */}
        <div style={{ marginTop: 22, borderTop: '1px solid var(--line-soft)', paddingTop: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <span className="mh-kicker">
              The ladder · the cost of the nth loop{' '}
              <span style={{ color: 'var(--accent-ink)', textTransform: 'none', letterSpacing: 0 }}>
                the author&apos;s bet, drawn
              </span>{' '}
              <Badge
                layer="W"
                note="§3.4's staging table is a principled proposal, not a measured law; §4.5 says so"
              />
            </span>
            <div className="mh-controls" role="group" aria-label="Summon a ghost curve">
              <span className="mh-kicker">vs</span>
              <button
                type="button"
                className="mh-chip"
                aria-pressed={ghost === null}
                onClick={() => setGhost(null)}
              >
                none
              </button>
              <button
                type="button"
                className="mh-chip"
                aria-pressed={ghost === 'skip'}
                onClick={() => setGhost('skip')}
              >
                skip Stage 0
              </button>
              <button
                type="button"
                className="mh-chip"
                aria-pressed={ghost === 'dissent'}
                onClick={() => setGhost('dissent')}
              >
                dissent
              </button>
            </div>
          </div>

          {/* The full bet curve, drawn at rest so the payoff lands on load.
              The stage-by-stage replay lives in the fold below, where the
              same chart reveals stepwise. */}
          <LadderChart reveal={12} ghost={ghost} />

          <div className="mh-readout" data-testid="ladder-readout" style={{ marginTop: 4 }}>
            <Stat
              k="loop 1 → loop 12 (bet)"
              v={`${fmt(COST_FIRST)} → ${fmt(COST_LAST)} d`}
              cls="good"
            />
            {ghost === 'skip' ? (
              <Stat
                k="skip stage 0"
                v={`${fmt(SKIP_COSTS[0])} → ${fmt(SKIP_COSTS.at(-1))} d`}
                cls="bad"
              />
            ) : null}
            {ghost === 'dissent' ? (
              <Stat k="dissent · legibility by habit" v={fmt2(DIS.skip.legibility)} cls="warn" />
            ) : null}
            {ghost === null ? (
              <Stat k="verified @ wk 48" v={fmt(finalCum({ rows: BET.rows }))} />
            ) : null}
          </div>
        </div>

        <ModelNotes
          register="bet"
          notes={[
            "Bet register: simulateStaging is a worked model of §3.4's staging table, not a system you can falsify here. One number — terrain legibility, 0.25 bare, 0.9 after four weeks of Stage 0 — sets how much of each new loop's build cost is reusable instrumentation. The curve is the author's bet, drawn.",
            'The thirteen micro-runs are the §3.3 catalog skeletons, drawn. They are deterministic by construction (no engine, no RNG): the trigger, the bounded action, the outside reference, the reversal, the signal produced, and who reads it next, straight from the handbook. The shape is the fidelity, not any orchestrator or vendor.',
            'The two ghost curves come from the same engine on the same seed: skip Stage 0 (legibility never rises, so the curve barely bends) and the dissent parameterization (three loops, conventions at 0.9 — Stage 0 has little left to buy). Both are the bet drawn where it loses.',
          ]}
          cannotShow="where any of these numbers fall on your platform — the engine draws shapes, not thresholds. The field evidence behind the staging order is N=1, feasibility evidence, not at-scale proof; §4.5 lists the rest as open."
          glass={GLASS}
        />
      </Activity>

      <Seen>
        Thirteen loops, one six-part shape — only the cast color changes. Add loops and the cost of
        the next one bends down as each reuses the terrain the last one left; skip Stage 0 and the
        curve barely moves.
      </Seen>

      <Takeaway>
        Capacity is a count of simple loops, not the depth of one — a dozen that compound beat one
        that is clever, and the ladder is what makes the dozen cheap.
      </Takeaway>

      <Deeper title="Stage by stage (§3.4)">
        <p style={{ margin: '0 0 10px', fontSize: '14px', color: 'var(--ink-2)' }}>
          The same bet, walked. Step the recorded run and the curve reveals one stretch at a time —
          Stage 0&apos;s instrumentation weeks, the first loops closing, coordination arriving, then
          the autonomy drill. The ghost toggle above carries into the replay.
        </p>
        <Walkthrough
          trace={BET_TRACE}
          renderStep={(stepObj) => {
            const idx = BET_TRACE.steps.indexOf(stepObj);
            return <LadderChart reveal={STEP_REACH[idx] ?? 12} ghost={ghost} />;
          }}
        />
      </Deeper>

      <Deeper title="The catalog, in full (§3.3)">
        <p style={{ margin: '0 0 10px', fontSize: '14px', color: 'var(--ink-2)' }}>
          The skeletons are intentionally independent of any orchestrator, model, or pipeline. Each
          recurs across mature platforms; the fidelity is in the shape. The dependency-patch loop is
          the canonical starter described in §3.2 and lives across pages 01 and 12; the thirteen
          below are §3.3&apos;s catalog. No loop calls another — each reads the terrain and writes
          to it.
        </p>
        {CATALOG.map((band) => (
          <div key={band.id} style={{ marginBottom: 12 }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700 }}>
              {band.label}
              <span style={{ fontWeight: 400, fontSize: '13px', color: 'var(--ink-faint)' }}>
                {' '}
                — {band.sub}
              </span>
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: '14px' }}>
              {band.loops.map((l) => (
                <li key={l.id} style={{ marginBottom: 3 }}>
                  <span style={{ color: l.color, fontWeight: 700 }}>{l.name}.</span> {l.one}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p style={{ margin: '10px 0 0', fontSize: '13.5px', color: 'var(--ink-2)' }}>
          <strong>How loops compose.</strong> Individual loops are useful; loops that read each
          other&apos;s signals are where compounding lives. The dead-code loop produces a map of
          cold regions; the refactor-candidate loop reads it; the test-backfill loop avoids cold
          regions and prioritizes hot-but-fragile ones; the migration loop reads coverage from
          test-backfill to pick safe shards. Each loop is simple; the field of signals they
          collectively maintain is rich.
        </p>
      </Deeper>

      <Deeper title="Harness engineering, the 2026 chronology (§4.2)">
        <p style={{ margin: '0 0 10px', fontSize: '14px', color: 'var(--ink-2)' }}>
          A related discipline converged in early 2026 under the name <em>harness engineering</em>.
          It focuses on the per-agent execution environment — tools, context architecture, custom
          linters, garbage-collection loops. A harness is a critical layer of terrain: the per-agent
          layer, which maps directly onto Stage 0 of the ladder above. Excellent harnesses with no
          shared terrain produce reliable per-agent work that fails to compound.
        </p>
        <ul
          style={{ margin: '0 0 10px', paddingLeft: 18, fontSize: '13.5px', color: 'var(--ink-2)' }}
        >
          <li>
            <strong>Feb 5.</strong> Hashimoto&apos;s originating definition: engineer a solution so
            the agent never makes that mistake again.
          </li>
          <li>
            <strong>Feb 11.</strong> OpenAI ships ~1M lines of production code with no human-typed
            source; frames it as designing environments, feedback loops, and control systems.
          </li>
          <li>
            <strong>Feb 17.</strong> Böckeler (Thoughtworks) names the convergence and the gap:
            maintainability is addressed, functional correctness is not.
          </li>
          <li>
            <strong>Mar 2.</strong> Stripe documents an evaluation harness for coding agents.
          </li>
          <li>
            <strong>Mar 12.</strong> HumanLayer publishes on harness configuration.
          </li>
          <li>
            <strong>Mar 24.</strong> Anthropic publishes design notes for long-running application
            harnesses.
          </li>
          <li>
            <strong>Apr 2.</strong> Böckeler&apos;s fuller framework: guides, sensors, harness
            templates.
          </li>
        </ul>
        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--ink-2)' }}>
          Convergent, not competing. Where harness engineering is more developed, this framework
          defers to it; where Many Hands extends — multi-agent coordination, the commons, the trust
          economy, the steward&apos;s role, placement — it builds on the harness layer rather than
          replacing it.
        </p>
      </Deeper>

      <Deeper title="froot, before and after">
        <p style={{ margin: '0 0 10px', fontSize: '14px', color: 'var(--ink-2)' }}>
          The same shape, run for real{' '}
          <Mark
            kind="real"
            note="N=1: one fleet, ~7 small repos, ~30 PRs, a local judge model — feasibility evidence, not at-scale proof"
          />
          . froot started as one leashed dependency-patch loop and grew by replication, not by
          deepening. The cells are the recorded fleet, not the engine.
        </p>
        <div className="mono" style={{ fontSize: '13px', overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 460 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--ink-faint)' }}>
                <th style={{ padding: '4px 10px 4px 0' }} />
                <th style={{ padding: '4px 10px' }}>Before · one loop</th>
                <th style={{ padding: '4px 10px' }}>After · a small fleet</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['loops running', '1 (dependency-patch)', '4 (patch · docs · flaky · dead-code)'],
                [
                  'signals in the terrain',
                  'patch metadata only',
                  'freshness · flakiness · deadness maps',
                ],
                ['cross-loop reads', 'none', 'patch reads flakiness before it bumps'],
                [
                  'per-loop build cost',
                  'hand-rolled each time',
                  'reused instrumentation — bends down',
                ],
                [
                  'steward action',
                  'review every PR',
                  'considered yes on the classes that earned it',
                ],
              ].map((row) => (
                <tr key={row[0]} style={{ borderTop: '1px solid var(--line-soft)' }}>
                  <td style={{ padding: '5px 10px 5px 0', color: 'var(--ink-faint)' }}>{row[0]}</td>
                  <td style={{ padding: '5px 10px', color: 'var(--ink-2)' }}>{row[1]}</td>
                  <td style={{ padding: '5px 10px', color: 'var(--accent-ink)' }}>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: '12.5px', color: 'var(--ink-faint)' }}>
          Covers §3.3, §3.4, §4.2. The fleet is the feasibility specimen behind the ladder&apos;s
          shape, not proof of its numbers.
        </p>
      </Deeper>
    </Page>
  );
}

/* ── A tiny stat cell (matches the book's readout grammar) ───────────────── */

function Stat({ k, v, cls }) {
  return (
    <div className="mh-stat">
      <span className="k">{k}</span>
      <span className={cls ? `v ${cls}` : 'v'}>{v}</span>
    </div>
  );
}
