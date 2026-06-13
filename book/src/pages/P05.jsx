// P05 · Signals — claim: spread, decay, reinforcement decide everything.
//
// The activity IS the page: a drawn signal field. Twelve repo regions as a
// heat-tile SVG grid; four agent dots drift toward the brightest signal (no
// router anywhere — the terrain law). Three tasks, each freezing all rates but
// one slider, pre-loaded to its most representative final frame: saturate the
// field to glare (decay → 0), lock it onto a wrong-first region (reinforce
// over decay), or find the phase flip (reinforce as a dial). Dragging the one
// freed slider re-simulates from tick 0 and the scene + readouts change live.
//
// Every number rendered is computed from field.js, the same engine the grid
// draws, so the readouts cannot go stale against the physics. The agent-dot
// drift is gated by usePrefersReducedMotion; the heat tiles transition via CSS.

import React from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, ModelNotes, glassSlice } from '../components/kit.jsx';
import { usePrefersReducedMotion } from '../shared/usePrefersReducedMotion.js';
import { fieldMetrics, makeField, stepField } from '../engine/field.js';
import { mulberry32 } from '../engine/rng.js';
import fieldSrc from '../engine/field.js?raw';

const { useEffect, useMemo, useRef, useState } = React;

/* ── Engine plumbing (orchestration only; the physics is all field.js) ──── */

const SEED = 8;
const N = 12;
const HEAT_CAP = 4; // mirrors the engine's SIGNAL_CAP — see the glass

const sumSignal = (field) => field.nodes.reduce((a, n) => a + n.signal, 0);

/** Walk the field `horizon` ticks from `start`, recording every frame. */
function simulate(start, params, horizon, walkSeed) {
  const rng = mulberry32(walkSeed);
  const frames = [start];
  let f = start;
  for (let t = 0; t < horizon; t++) {
    f = stepField(f, params, rng);
    frames.push(f);
  }
  return frames;
}

/**
 * Task 2's doctored start — the exact scenario the engine's test suite pins:
 * yesterday's heat (1.5) planted on the one region CI passes 1 job in 20, with
 * eleven dim (0.005), good (0.90) regions around it. Wrong-first lock-in.
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

/* ── The three tasks ────────────────────────────────────────────────────── */
//
// Each task freezes every rate but one. The frozen set and the freed slider
// come straight from the engine defaults; the pre-loaded value is the one that
// best shows the failure (decay 0 saturates; reinforce 2.0 locks; 0.50 lights
// the field so walking down finds the flip).

const TASKS = {
  saturate: {
    chip: 'saturate it',
    knob: 'decay',
    label: 'decay',
    sub: 'fraction of all signal that fades per tick',
    min: 0,
    max: 0.2,
    step: 0.01,
    preload: 0,
    healthy: 0.1,
    frozen: { spread: 0.06, reinforce: 0.5, explore: 0.1, outsideRef: true },
    horizon: 240,
    walkSeed: SEED,
    start: () => makeField({ nodes: N, seed: SEED }),
    caption:
      'Decay is the only way signal leaves this field. Drag it toward zero and nothing forgets.',
    frozenLine: 'frozen: spread 0.06 · reinforce 0.50 · outside reference intact',
  },
  lock: {
    chip: 'lock it in',
    knob: 'reinforce',
    label: 'reinforce',
    sub: 'deposit per unit of trail already there',
    min: 0.2,
    max: 2.4,
    step: 0.05,
    preload: 2.0,
    healthy: 0.35,
    frozen: { spread: 0, decay: 0.1, explore: 0.02, outsideRef: true },
    horizon: 300,
    walkSeed: 17,
    start: wrongFirstField,
    caption:
      "Yesterday's heat sits on delivery/, where CI passes 1 job in 20. Eleven good regions sit dim around it.",
    frozenLine: 'frozen: spread 0.00 · decay 0.10 · outside reference intact',
  },
  flip: {
    chip: 'find the flip',
    knob: 'reinforce',
    label: 'reinforce · the dial',
    sub: 'walk it down one notch at a time',
    min: 0.05,
    max: 0.6,
    step: 0.01,
    preload: 0.5,
    healthy: 0.5,
    frozen: { spread: 0.06, decay: 0.15, explore: 0.1, outsideRef: true },
    horizon: 240,
    walkSeed: SEED,
    start: () => makeField({ nodes: N, seed: SEED }),
    caption:
      'Same dim start, decay frozen at 0.15. At 0.50 the field organizes. Somewhere below, it cannot.',
    frozenLine: 'frozen: spread 0.06 · decay 0.15 · outside reference intact',
  },
};

const TASK_IDS = ['saturate', 'lock', 'flip'];

/* ── The drawn scene: a heat-tile grid with drifting agent dots ─────────── */
//
// viewBox-scaled SVG, a 4×3 ring of region tiles. Fill = signal (heat, cap 4),
// cast in the amber signal color. The brightest region wears a red ring when
// the lock-in detector trips. Four agent dots drift toward bright tiles; their
// motion is a rAF loop gated by the reduced-motion hook (reduced: dots park on
// their targets). Tiles transition their fill smoothly via CSS.

const COLS = 4;
const ROWS = 3;
const VW = 480;
const VH = 360;
const PAD = 10;
const GAP = 8;
const TW = (VW - PAD * 2 - GAP * (COLS - 1)) / COLS;
const TH = (VH - PAD * 2 - GAP * (ROWS - 1)) / ROWS;

const tileXY = (i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  return { x: PAD + col * (TW + GAP), y: PAD + row * (TH + GAP) };
};
const tileCenter = (i) => {
  const { x, y } = tileXY(i);
  return { cx: x + TW / 2, cy: y + TH / 2 };
};

/** Heat 0..1 for a region's signal. */
const heatOf = (signal) => Math.min(1, signal / HEAT_CAP);

// Hot tiles fill with the amber cast (theme-independent), so their text must be
// a dark ink to clear WCAG AA in both themes. White-on-amber fails for small
// text. The cool branch stays on the theme ink tokens.
const HOT_INK = 'rgba(20, 18, 12, 0.82)';

function FieldScene({ field, lockIn, agents, brightestId }) {
  const total = sumSignal(field);
  const brightest = field.nodes.find((n) => n.id === brightestId) ?? field.nodes[0];
  const label =
    `Signal field, tick ${field.tick}: 12 repo regions as heat tiles. Brightest ` +
    `region ${brightest.name} at ${brightest.signal.toFixed(2)} of cap 4, total ` +
    `signal ${total.toFixed(1)}. ${
      lockIn ? 'Lock-in tripped: reinforcement outran decay.' : 'No lock-in.'
    } Four agent dots drift toward the brightest regions; no router assigns them.`;
  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      role="img"
      aria-label={label}
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }}
    >
      <rect x="0" y="0" width={VW} height={VH} fill="var(--paper-3)" rx="8" />
      {field.nodes.map((n, i) => {
        const { x, y } = tileXY(i);
        const heat = heatOf(n.signal);
        const hot = heat >= 0.5;
        const locked = lockIn && n.id === brightestId;
        return (
          <g key={n.id}>
            <rect
              x={x}
              y={y}
              width={TW}
              height={TH}
              rx="5"
              fill={`color-mix(in srgb, var(--c-deppatch) ${Math.round(
                heat * 88,
              )}%, var(--paper-2))`}
              stroke={locked ? 'var(--red)' : 'var(--line-soft)'}
              strokeWidth={locked ? 2.5 : 1}
              style={{ transition: 'fill 240ms ease, stroke 240ms ease' }}
            />
            <text
              x={x + 8}
              y={y + 18}
              fontSize="12"
              fontWeight={hot ? '600' : '400'}
              fontFamily="var(--font-mono)"
              fill={hot ? HOT_INK : 'var(--ink-2)'}
              style={{ transition: 'fill 240ms ease' }}
            >
              {n.name}
            </text>
            <text
              x={x + 8}
              y={y + TH - 10}
              fontSize="15"
              fontWeight="700"
              fontFamily="var(--font-mono)"
              fill={hot ? HOT_INK : 'var(--ink)'}
              style={{ transition: 'fill 240ms ease' }}
            >
              {n.signal.toFixed(2)}
            </text>
          </g>
        );
      })}
      {agents.map((a, k) => (
        <circle
          key={k}
          cx={a.x}
          cy={a.y}
          r="5"
          fill="var(--accent)"
          stroke="var(--paper)"
          strokeWidth="1.5"
        >
          <title>agent {k + 1} following the heat</title>
        </circle>
      ))}
    </svg>
  );
}

/* ── Live readouts, named in framework words ────────────────────────────── */

function Readouts({ metrics, total }) {
  const s2nClass =
    metrics.signalToNoise < 0.3 ? 'bad' : metrics.signalToNoise < 1 ? 'warn' : 'good';
  const gainWord = metrics.gain < 0.95 ? 'dying' : metrics.gain <= 1.05 ? 'marginal' : 'diverging';
  // With decay near zero the gain divides by ~0 and blows up; show a ceiling
  // rather than a nine-digit number. The word carries the meaning.
  const gainText = metrics.gain > 99 ? '>99' : metrics.gain.toFixed(2);
  return (
    <div className="mh-readout" aria-live="polite">
      <div className="mh-stat">
        <span className="k">Variety</span>
        <span className="v">{metrics.variety.toFixed(2)}</span>
      </div>
      <div className="mh-stat">
        <span className="k">Signal-to-noise</span>
        <span className={`v ${s2nClass}`}>{metrics.signalToNoise.toFixed(2)}</span>
      </div>
      <div className="mh-stat">
        <span className="k">Lock-in</span>
        <span className={metrics.lockIn ? 'v bad' : 'v good'} style={{ fontSize: 13 }}>
          {metrics.lockIn ? 'reinforcement outran decay' : 'clear'}
        </span>
      </div>
      <div className="mh-stat">
        <span className="k">Loop gain</span>
        <span className="v" style={{ fontSize: 14 }}>
          {gainText} · {gainWord}
        </span>
      </div>
      <div className="mh-stat">
        <span className="k">Total signal</span>
        <span className="v">{total.toFixed(1)}</span>
      </div>
    </div>
  );
}

/* ── The glass (constitution: glass law) ────────────────────────────────── */

const GLASS = [
  glassSlice(fieldSrc, 'export function stepField', '\n}'),
  glassSlice(fieldSrc, 'export function fieldMetrics', '\n}'),
].join('\n\n// ── and ──\n\n');

/* ── The page ───────────────────────────────────────────────────────────── */

export default function P05() {
  const reduced = usePrefersReducedMotion();
  const [taskId, setTaskId] = useState('flip');
  const [knobs, setKnobs] = useState(() =>
    Object.fromEntries(TASK_IDS.map((id) => [id, TASKS[id].preload])),
  );

  const task = TASKS[taskId];
  const knob = knobs[taskId];

  // Re-simulate from tick 0 whenever the task or its freed knob changes. We
  // render the final frame: the most representative state, pre-loaded at rest.
  const frame = useMemo(() => {
    const frames = simulate(
      task.start(),
      { ...task.frozen, [task.knob]: knob },
      task.horizon,
      task.walkSeed,
    );
    return frames[frames.length - 1];
  }, [task, knob]);

  const metrics = fieldMetrics(frame);
  const total = sumSignal(frame);
  const brightestId = useMemo(
    () => frame.nodes.reduce((a, b) => (b.signal > a.signal ? b : a)).id,
    [frame],
  );

  // Agent targets: the four brightest regions draw the four workers. (A weighted
  // pick lives in the engine; here we draw the strongest pull, which is what a
  // reader sees the dots doing.)
  const targets = useMemo(() => {
    const byBright = [...frame.nodes].sort((a, b) => b.signal - a.signal);
    return [0, 1, 2, 3].map((k) => {
      const node = byBright[k] ?? byBright[0];
      const i = frame.nodes.findIndex((n) => n.id === node.id);
      return tileCenter(i);
    });
  }, [frame]);

  // Agent dots drift toward their targets (rAF, reduced-motion gated). Under
  // reduced motion the dots snap to targets and hold.
  const [agents, setAgents] = useState(() => targets.map((t) => ({ x: t.cx, y: t.cy })));
  const targetsRef = useRef(targets);
  targetsRef.current = targets;
  const rafRef = useRef(0);

  useEffect(() => {
    if (reduced) {
      setAgents(targetsRef.current.map((t) => ({ x: t.cx, y: t.cy })));
      return undefined;
    }
    const tick = () => {
      setAgents((prev) =>
        prev.map((a, k) => {
          const t = targetsRef.current[k] ?? targetsRef.current[0];
          // Ease toward the target; a small idle wobble keeps the field alive.
          const wob = Math.sin(Date.now() / 400 + k * 1.7) * 3;
          return {
            x: a.x + (t.cx + wob - a.x) * 0.06,
            y: a.y + (t.cy - wob - a.y) * 0.06,
          };
        }),
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reduced]);

  const atHealthy = Math.abs(knob - task.healthy) < task.step / 2;

  return (
    <Page n={5} claim="Spread, decay, reinforcement — three rates decide everything.">
      <Activity>
        <div className="mh-controls" role="group" aria-label="Tasks">
          <span className="mh-kicker">Task</span>
          <div className="mh-chipset">
            {TASK_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className="mh-chip"
                aria-pressed={taskId === id}
                onClick={() => setTaskId(id)}
              >
                {TASKS[id].chip}
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '8px 0 12px' }}>
          {task.caption}
        </p>

        <FieldScene
          field={frame}
          lockIn={metrics.lockIn}
          agents={agents}
          brightestId={brightestId}
        />

        <p
          className="mono"
          style={{ fontSize: '10.5px', color: 'var(--ink-faint)', margin: '6px 0 0' }}
        >
          green dots = agents following the heat; no router assigns them
        </p>

        <Readouts metrics={metrics} total={total} />

        <div className="mh-controls" role="group" aria-label="The one freed rate">
          <div className="mh-slider" style={{ flex: '1 1 280px', maxWidth: 420 }}>
            <label htmlFor="p05-knob">
              <span>
                {task.label} · <span style={{ color: 'var(--ink-faint)' }}>{task.sub}</span>
              </span>
              <span className="mono">{knob.toFixed(2)}</span>
            </label>
            <input
              id="p05-knob"
              type="range"
              min={task.min}
              max={task.max}
              step={task.step}
              value={knob}
              onChange={(e) => setKnobs((k) => ({ ...k, [taskId]: Number(e.target.value) }))}
              aria-valuetext={knob.toFixed(2)}
            />
          </div>
          <button
            type="button"
            className="mh-btn"
            onClick={() => setKnobs((k) => ({ ...k, [taskId]: task.healthy }))}
            disabled={atHealthy}
            aria-label={`Reset ${task.label} to its healthy value`}
          >
            healthy
          </button>
        </div>
        <p className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-faint)', margin: 0 }}>
          {task.frozenLine} · the other rates are locked; one terrain change at a time
        </p>

        <ModelNotes
          register="mechanism"
          notes={[
            'Twelve regions on a ring; spread leaks each tile to its two reading-order neighbors, wrapping. Real repo graphs are not rings — the ring keeps adjacency small and honest.',
            'Every readout is computed from field.js, the same engine the grid draws, on a pinned seed. The agent dots draw the strongest pull; the weighted pick lives in the glass.',
            "The lock task's start is constructed for teaching ○: yesterday's heat on a region CI passes 1 job in 20 — the exact field the engine's tests pin.",
          ]}
          cannotShow="where your terrain's critical values sit. The flip, the cap at 4, the lock are properties of these constants and this seed — shapes, not thresholds a real fleet could read off."
          glass={GLASS}
        />
      </Activity>

      <Seen>
        Nobody assigned the work; the four agents follow heat, and the heat is whatever survived
        decay. Slip one rate and the same field saturates into glare, locks onto a wrong-first
        region, or goes dark — no router involved.
      </Seen>

      <Takeaway>
        Three rates set the terrain: <strong>spread</strong> moves signal, <strong>decay</strong>{' '}
        forgets it, <strong>reinforcement</strong> compounds it. Tune them, not the agents.
      </Takeaway>

      <Deeper title="The four forces (§2.1)">
        <p>
          Most of what goes right or wrong in a many-hands system shows up as one of four forces.
          Underneath them is <strong>entropy</strong>: the second-law drift from order toward noise
          unless work is invested. Decay, drift, and eventually runaway are how entropy presents
          itself in software.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
              <td style={{ padding: '6px 10px 6px 0', fontWeight: 600 }}>Reinforcement</td>
              <td style={{ padding: '6px 0' }}>a signal strengthens with use.</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
              <td style={{ padding: '6px 10px 6px 0', fontWeight: 600 }}>Decay</td>
              <td style={{ padding: '6px 0' }}>a signal weakens with time.</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
              <td style={{ padding: '6px 10px 6px 0', fontWeight: 600 }}>Runaway</td>
              <td style={{ padding: '6px 0' }}>
                reinforcement without counter-force. The death spiral.
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 10px 6px 0', fontWeight: 600 }}>Drift</td>
              <td style={{ padding: '6px 0' }}>
                slow divergence between what the system measures and what the world rewards.
              </td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: 10 }}>
          A <strong>signal</strong> is a decaying piece of metadata in the terrain that biases the
          next action: test status, a staleness marker, telemetry, a confidence score. The artifact
          is not the signal; the signal is what the artifact tells the next actor. Industry analog:
          the pheromone of stigmergy.
        </p>
        <p>
          And coordination cost is topological (§2.8): direct messaging among N agents needs N²
          channels; shared-environment coordination needs N. That is why colonies scale and
          tightly-coupled meshes degrade. Combinatorial, not ideological. <Badge layer="E" />
        </p>
      </Deeper>

      <Deeper title="Real math, informal bridge (§4.3)">
        <p>
          The results this field borrows are real mathematics. In the framework they function as
          analogies and design intuitions, <em>not</em> predictive models a team can compute
          against. The bridge from the math to a specific operational decision in your platform is
          currently informal — these are the substrate of why the framework's instincts hold up, not
          equations to solve. <Badge layer="M" note="organizing metaphor backed by real results" />
        </p>
        <ul style={{ margin: '0 0 0.6em', paddingLeft: 18 }}>
          <li>
            <strong>Reaction–diffusion / Keller–Segel.</strong> Without sufficient decay,
            self-reinforcing aggregation produces finite-time blow-up. The mathematical form of
            runaway — what the <em>saturate it</em> task walks you into.
          </li>
          <li>
            <strong>Bifurcation.</strong> Self-reinforcing dynamics change qualitatively at a
            critical threshold; below it perturbations die, above it they grow. The flip the{' '}
            <em>find the flip</em> task hunts is one notch wide, not a dimmer.
          </li>
          <li>
            <strong>ACO convergence (Gutjahr; Stützle–Dorigo).</strong> Reinforcement systems
            converge to the optimum <em>only</em> with a positive lower bound preserving
            exploration. The floor is not decorative; that is why the lock holds when explore drops
            to 0.02.
          </li>
        </ul>
        <p style={{ margin: 0 }}>
          So treat the cliff at one value, the cap at 4, the lock tick as shapes, not thresholds.
          The dynamics are real; where they sit on your terrain is not a number this bench can hand
          you.
        </p>
      </Deeper>
    </Page>
  );
}
