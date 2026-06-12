// LAB 15·A — THE COMPOSITION (Ch 15, mechanism register).
// The catalog's finale: one mapper population, run twice on the same world
// from the same seed. Run one prints its maps to stdout and exits; run two
// persists them to the shared signal field. The chart holds both runs, the
// Walkthrough replays the recorded comparison, and the fork (gated by a
// committed prediction) re-runs both on fresh worlds, where the engine is
// honest about the one world that stalls. No mapper is ever commanded; the
// only things the reader varies are which run the chart isolates and which
// world the population lands in.
// Physics: runMapperPopulation() in src/engine/scenarios/composition.js.
// Motion: the only JS motion is the Walkthrough's Play, gated in the kit by
// usePrefersReducedMotion; everything else redraws instantly.

import { useState } from 'react';
import { Badge, Commit, LabFrame, Mark, Walkthrough, glassSlice } from '../components/kit.jsx';
import {
  MAPPER_PARAMS,
  compositionRun,
  runMapperPopulation,
} from '../engine/scenarios/composition.js';
import compositionRaw from '../engine/scenarios/composition.js?raw';

/* ── The recorded comparison (module-level: pinned seed, same forever) ──── */

const CANON_SEED = 73; // the seed the scenario tests pin
const TRACE = compositionRun(CANON_SEED);

const GLASS = [
  glassSlice(compositionRaw, 'export function runMapperPopulation', '\n}'),
  glassSlice(compositionRaw, 'function targeting(field)', '\n}'),
].join('\n\n// ── the instrument: targeting, the per-tick expected hit rate ──\n\n');

const pct = (x) => Math.round(x * 100);
const f1 = (x) => x.toFixed(1);
const qf = (node) => node.quality.toFixed(2);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Both runs of the population on one world, plus everything the UI cites. */
function buildWorld(seed) {
  const stdout = runMapperPopulation(seed, { persist: false });
  const persisted = runMapperPopulation(seed, { persist: true });
  const rawGaps = [15, 30, 45, 60].map(
    (t) => persisted.cumulative[t - 1] - stdout.cumulative[t - 1],
  );
  const byHeat = [...persisted.finalField.nodes].sort((a, b) => b.signal - a.signal);
  const byQuality = [...persisted.finalField.nodes].sort((a, b) => b.quality - a.quality);
  return {
    seed,
    stdoutTicks: stdout.perTick,
    fieldTicks: persisted.perTick,
    basePct: pct(stdout.perTick[0]),
    finishPct: pct(mean(persisted.perTick.slice(-15))),
    bankStdout: stdout.cumulative.at(-1),
    bankField: persisted.cumulative.at(-1),
    gap: persisted.cumulative.at(-1) - stdout.cumulative.at(-1),
    gaps: rawGaps,
    widening: rawGaps.every((g, i) => i === 0 || g > rawGaps[i - 1]),
    hot: byHeat[0],
    secondHot: byHeat[1],
    best: byQuality[0],
    nodes: persisted.finalField.nodes,
  };
}

// World 73 is the canonical run. 42 and 99 redraw the quality and compound
// anyway; 21 is the stall the engine hands over honestly: an early verified
// streak amplified onto mediocre ground.
const WORLDS = [CANON_SEED, 42, 99, 21].map(buildWorld);
const [CANON, W42, W99, W21] = WORLDS;
const INFRA42 = W42.nodes.find((n) => n.name === 'infra/');

const WORLD_SUMMARY = {
  [CANON.seed]:
    `Run two settled on ${CANON.hot.name} (hidden quality ${qf(CANON.hot)}) with ` +
    `${CANON.secondHot.name} (${qf(CANON.secondHot)}) beside it: this world's richest ` +
    `ground, found by nothing but persisted, verified maps.`,
  [W42.seed]:
    `Different world, different address: the heat sits on ${W42.hot.name} ` +
    `(${qf(W42.hot)}), and infra/ stays cold because this world's infra/ holds almost ` +
    `nothing (quality ${qf(INFRA42)}). Same bend: +${f1(W42.gap)}.`,
  [W99.seed]:
    `infra/ again, and the quality column says why: this world's infra/ really is rich ` +
    `(${qf(W99.hot)}). The field keeps no favorite addresses, only this world's ` +
    `verified findings.`,
  [W21.seed]:
    `The stall: ${W21.hot.name} glows at hidden quality ${qf(W21.hot)} while ` +
    `${W21.best.name} (${qf(W21.best)}) sits dark. An early verified streak, amplified; ` +
    `reinforcement outran the exploration floor, and the gap stalled at +${f1(W21.gap)}.`,
};

/* ── The toggled chart ─────────────────────────────────────────────────── */

const VIEWS = [
  { id: 'both', label: 'both runs' },
  { id: 'stdout', label: 'run one · stdout' },
  { id: 'field', label: 'run two · field' },
];

function TargetingChart({ world: w, view }) {
  const W = 440;
  const H = 210;
  const padL = 42;
  const padR = 96;
  const padT = 14;
  const padB = 30;
  const n = w.stdoutTicks.length;
  const yMax = 0.8;
  const x = (i) => padL + (i / (n - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - v / yMax) * (H - padT - padB);
  const pts = (series) => series.map((v, i) => `${x(i)},${y(v)}`).join(' ');

  const showStdout = view !== 'field';
  const showField = view !== 'stdout';
  const gapArea =
    showStdout && showField
      ? [
          ...w.fieldTicks.map((v, i) => `${x(i)},${y(v)}`),
          ...w.stdoutTicks.map((v, i) => `${x(i)},${y(v)}`).reverse(),
        ].join(' ')
      : null;

  // End labels; nudge apart when the two lines finish within label height.
  const yS = y(w.stdoutTicks.at(-1)) + 3;
  let yF = y(w.fieldTicks.at(-1)) + 3;
  if (showStdout && showField && Math.abs(yS - yF) < 12) {
    yF = yF >= yS ? yS + 12 : yS - 12;
  }

  const verb = w.finishPct >= w.basePct ? 'climbs to about' : 'slips to about';
  const ariaLabel =
    `Targeting over sixty ticks in world ${w.seed}.` +
    (showStdout
      ? ` The stdout run holds flat at ${w.basePct} percent every tick because nothing persists.`
      : '') +
    (showField
      ? ` The field run starts at the same ${w.basePct} percent and ${verb} ` +
        `${w.finishPct} percent in the last quarter.`
      : '') +
    (showStdout && showField
      ? ` Banked findings: ${f1(w.bankField)} against ${f1(w.bankStdout)}, ` +
        `a gap of ${f1(w.gap)}.`
      : '');

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {[0, 0.2, 0.4, 0.6, 0.8].map((v) => (
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
            {pct(v)}%
          </text>
        </g>
      ))}
      {[1, 30, 60].map((t) => (
        <text
          key={t}
          x={x(t - 1)}
          y={H - padB + 14}
          textAnchor="middle"
          fontSize="9"
          fill="var(--ink-faint)"
          fontFamily="var(--font-mono)"
        >
          tick {t}
        </text>
      ))}
      {gapArea ? <polygon points={gapArea} fill="var(--accent)" opacity="0.08" /> : null}
      {showStdout ? (
        <polyline
          points={pts(w.stdoutTicks)}
          fill="none"
          stroke="var(--ink-faint)"
          strokeWidth="2"
        />
      ) : null}
      {showField ? (
        <polyline points={pts(w.fieldTicks)} fill="none" stroke="var(--accent)" strokeWidth="2" />
      ) : null}
      {showStdout ? (
        <text
          x={x(n - 1) + 6}
          y={yS}
          fontSize="9.5"
          fill="var(--ink-faint)"
          fontFamily="var(--font-mono)"
        >
          maps → stdout · {pct(w.stdoutTicks.at(-1))}%
        </text>
      ) : null}
      {showField ? (
        <text
          x={x(n - 1) + 6}
          y={yF}
          fontSize="9.5"
          fill="var(--accent-ink)"
          fontFamily="var(--font-mono)"
        >
          maps → field · {pct(w.fieldTicks.at(-1))}%
        </text>
      ) : null}
    </svg>
  );
}

/* ── The fork: fresh worlds behind a committed prediction ──────────────── */

const FORK_OPTIONS = [
  { id: 'gap', label: 'the gap — persistence compounds in any world' },
  { id: 'dest', label: `the destination — the field finds ${CANON.hot.name} again` },
  { id: 'luck', label: 'not much — one good world proves little' },
];

const FORK_FEEDBACK = {
  gap: (
    <>
      Mostly, and the exception teaches more than the rule. Worlds {W42.seed} and {W99.seed} redraw
      everything and the bend comes back: +{f1(W42.gap)} and +{f1(W99.gap)} banked findings over
      their stdout twins, widening every quarter. Then world {W21.seed} stalls at +{f1(W21.gap)}: an
      early verified streak on {W21.hot.name} (hidden quality {qf(W21.hot)}) got amplified while{' '}
      {W21.best.name} ({qf(W21.best)}) sat dark, and the field went confidently mediocre.{' '}
      <strong>Reinforcement outran the exploration floor</strong>, Chapter 8's family. So what
      survives the reshuffle is the location of the dynamics, not a guaranteed payoff: run one
      cannot compound in any world, run two compounds when the field stays honest, and when it
      fails, the failure is in the terrain too. Run the worlds.
    </>
  ),
  dest: (
    <>
      Run world {W99.seed} first: the heat does settle on infra/ again, because that world's infra/
      happens to be rich (hidden quality {qf(W99.hot)}), not because the field keeps favorite
      addresses. World {W42.seed} sends the heat to {W42.hot.name} instead, and its infra/ (quality{' '}
      {qf(INFRA42)}) never warms. The destination belongs to the quality draw; what recurs is the
      bend, +{f1(W42.gap)} and +{f1(W99.gap)} over the stdout twins. World {W21.seed} is the
      caution: the destination can even be wrong. {W21.hot.name} glows at quality {qf(W21.hot)}{' '}
      while {W21.best.name} ({qf(W21.best)}) sits dark, and the gap stalls.{' '}
      <strong>The field is not a router with preferences.</strong> It amplifies whatever verified
      work lands in it, well or badly.
    </>
  ),
  luck: (
    <>
      A fair suspicion, and the fork mostly answers it against you: worlds {W42.seed} and {W99.seed}{' '}
      redraw the quality and the bend comes back, +{f1(W42.gap)} and +{f1(W99.gap)}, widening every
      quarter. You are owed partial credit anyway: world {W21.seed} stalls at +{f1(W21.gap)},
      because an early verified streak on {W21.hot.name} (hidden quality {qf(W21.hot)}) got
      amplified while {W21.best.name} ({qf(W21.best)}) sat dark. So world {CANON.seed} was not lucky
      in the way you meant: the flat line is structural in every world, and{' '}
      <strong>persistence is what makes a bend possible</strong>; but a field amplifies a mediocre
      accident as faithfully as a good find. The dynamics, good and bad, live in the terrain. Run
      the worlds.
    </>
  ),
};

const NOTES = [
  `The mappers rebuild the survey corpus's amnesiac pattern for teaching: the real fleet ran ` +
    `~50 loop scripts with zero shared signals (Ch 14's specimen). Here: twelve regions with ` +
    `hidden quality, four surveys a tick, sixty ticks.`,
  `Field physics are frozen for both runs and every forked world (spread ` +
    `${MAPPER_PARAMS.spread}, decay ${MAPPER_PARAMS.decay}, reinforce ` +
    `${MAPPER_PARAMS.reinforce}, exploration floor ${MAPPER_PARAMS.explore}), tuned so the ` +
    `bend is visible inside sixty ticks. Real terrains bend slower.`,
  `Targeting is an expected hit rate computed from the field each tick, not a sampled count: ` +
    `the flat line is exactly flat, and none of the climb is luck.`,
  `The outside reference stays on: only findings that survive CI deposit signal. Severed, ` +
    `run two would compound its own reports — Chapter 9's spiral wearing a mapper's skin, not ` +
    `compounding.`,
  `Persistence is the precondition, not a guarantee: world ${W21.seed} amplifies an early ` +
    `verified streak on ${W21.hot.name} (hidden quality ${qf(W21.hot)}) while ` +
    `${W21.best.name} (${qf(W21.best)}) sits dark, and the gap stalls at +${f1(W21.gap)}. ` +
    `Reinforcement outran the exploration floor; that failure lives in the terrain too.`,
];

/* ── The lab ───────────────────────────────────────────────────────────── */

export default function CompositionLab() {
  const [view, setView] = useState('both');
  const [worldSeed, setWorldSeed] = useState(CANON_SEED);
  const [committed, setCommitted] = useState(null);

  const world = WORLDS.find((w) => w.seed === worldSeed);

  return (
    <LabFrame
      tag="LAB 15·A — THE COMPOSITION"
      register="mechanism"
      question="The same mapper population, run twice on the same world from the same seed. The only line that changes is where the maps go: printed to stdout and lost, or persisted to the shared signal field. Which run compounds, and what exactly is doing the compounding?"
      payoff={
        <>
          Run one is sixty ticks of honest, CI-verified work: targeting starts at {CANON.basePct}%
          and ends at {CANON.basePct}%, because every map dies in a scrollback and every tick starts
          blind. Run two changes one line, maps persist to the field, and targeting climbs to about{' '}
          {CANON.finishPct}% while the banked findings pull ahead {f1(CANON.bankField)} to{' '}
          {f1(CANON.bankStdout)}, a gap of +{f1(CANON.gap)} that widens every quarter of the run.
          The mappers never got smarter, and nothing routed them. No loop calls another; each reads
          the terrain and writes to it, and the coordination is in the environment, not in any
          orchestrator. Loops that read each other's signals are where compounding lives.{' '}
          <Badge
            layer="W"
            note="§3.3 — loops that read each other's signals are where compounding lives"
          />
        </>
      }
      notes={NOTES}
      cannotShow="whether your signals are worth persisting. The engine grants every verified finding a clean schema, a place to land, and readers on the other end; in a real terrain each of those is Stage 0 work, and a map persisted where no loop reads compounds exactly as much as stdout."
      glass={GLASS}
    >
      <p className="mono" style={{ fontSize: 12.5, color: 'var(--ink-faint)', margin: '0 0 12px' }}>
        <Mark
          kind="made"
          note="constructed for teaching; it rebuilds Ch 14's amnesiac-mapper observation"
        />{' '}
        one mapper population, run twice · twelve regions, hidden quality · CI the outside reference
        · the only difference between runs: where the maps go
      </p>

      <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
        Targeting · share of mapper picks landing on real findings · world {world.seed}
      </span>
      <div className="mh-chipset" role="group" aria-label="Which run the chart shows">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className="mh-chip"
            aria-pressed={view === v.id}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <TargetingChart world={world} view={view} />
      <div className="mh-readout" role="status">
        <div className="mh-stat">
          <span className="k">targeting · stdout run</span>
          <span className="v">{world.basePct}%, flat</span>
        </div>
        <div className="mh-stat">
          <span className="k">targeting · field run</span>
          <span className={world.finishPct > world.basePct ? 'v good' : 'v warn'}>
            {world.basePct}% → {world.finishPct}%
          </span>
        </div>
        <div className="mh-stat">
          <span className="k">banked · stdout vs field</span>
          <span className="v">
            {f1(world.bankStdout)} vs {f1(world.bankField)}
          </span>
        </div>
        <div className="mh-stat">
          <span className="k">the gap</span>
          <span className={world.widening ? 'v good' : 'v warn'}>
            +{f1(world.gap)} {world.widening ? '· widening' : '· stalled'}
          </span>
        </div>
      </div>
      <p className="mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)', margin: '0 0 4px' }}>
        the gap at tick 15 · 30 · 45 · 60 — {world.gaps.map((g) => `+${f1(g)}`).join(' → ')}
      </p>
      <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '4px 0 0' }}>
        {WORLD_SUMMARY[world.seed]}
      </p>

      <div style={{ marginTop: 16 }}>
        <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
          The comparison, recorded · seed {CANON_SEED}
        </span>
        <Walkthrough trace={TRACE} />
      </div>

      <div style={{ marginTop: 16 }}>
        <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
          Fork · fresh worlds, after the recorded pass
        </span>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 8px' }}>
          A fresh seed redraws the hidden quality (which regions actually hold findings) and the
          starting heat. The physics and the mappers stay frozen; both runs re-run on the new world.
        </p>
        <Commit
          prompt={`World ${CANON_SEED} is one draw. Fork the world and the quality reshuffles under the same physics. Sixty ticks out, what survives the reshuffle?`}
          options={FORK_OPTIONS}
          onReveal={setCommitted}
        >
          {(picked) => FORK_FEEDBACK[picked]}
        </Commit>
        <div className="mh-chipset" role="group" aria-label="Choose the world both runs land in">
          {WORLDS.map((w) => {
            const locked = committed === null && w.seed !== CANON_SEED;
            return (
              <button
                key={w.seed}
                type="button"
                className="mh-chip"
                aria-pressed={worldSeed === w.seed}
                disabled={locked}
                title={locked ? 'commit the prediction first' : undefined}
                onClick={() => setWorldSeed(w.seed)}
              >
                world {w.seed}
                {w.seed === CANON_SEED ? ' · canonical' : ''}
              </button>
            );
          })}
        </div>
      </div>
    </LabFrame>
  );
}
