// P10 — Disturbance. One activity: a drawn terrain shelf with removable
// pieces over commons.removalExperiment.
//
// The centerpiece is an SVG shelf holding three things every loop depends
// on — a tool, a context file, a signal — wired up to five loop glyphs. The
// reader lifts one piece off the shelf (its dependency lines go dead), commits
// collapse-or-adapt, then runs: the engine's 4-or-5-step story plays in a
// Walkthrough and the scene re-colors to the verdict (loops glow green when
// they re-adapt, red and a backed-up queue when they collapse). A fragility
// map fills in one row per attempt. Every verdict, every caption, and every
// number is removalExperiment output, seed 10; no logic in this file decides
// collapse — the engine does. At rest, the context removal is pre-run: the
// one collapse, fully drawn.

import { useState } from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, Commit, ModelNotes, Walkthrough, glassSlice } from '../components/kit.jsx';
import { removalExperiment } from '../engine/commons.js';
import commonsSrc from '../engine/commons.js?raw';

/* ── The three removable pieces, in shelf order ───────────────────────── */

const SEED = 10;

const PIECES = [
  {
    id: 'tool',
    label: 'repo-search',
    kind: 'tool',
    blurb: 'every loop calls it before editing',
  },
  {
    id: 'context',
    label: 'ARCHITECTURE.md',
    kind: 'context file',
    blurb: 'the module table every loop reads',
  },
  {
    id: 'signal',
    label: 'doc-freshness',
    kind: 'signal',
    blurb: 'the signal the doc loop fires on',
  },
];

// Pre-compute the three deterministic runs once. The story, the verdict, and
// every number come straight out of the engine.
const RUNS = Object.fromEntries(
  PIECES.map((p) => [p.id, removalExperiment({ target: p.id, seed: SEED })]),
);

/* ── The glass: the engine branch that decides collapse vs re-adapt ───── */

const GLASS = glassSlice(
  commonsSrc,
  'export function removalExperiment',
  'throw new Error(`unknown removal target',
);

const NOTES = [
  'Three targets, one engine call each at seed 10. The story you step is the trace it ' +
    'returns; the verdict (collapsed or re-adapted) is its boolean, not a rule in the page.',
  'Two pieces re-adapt: the tool was one way to get a capability the loops kept by other ' +
    'means; the signal was a cache of a fact the loop could recompute. One collapses: the ' +
    'context file was the only place a decision every loop made was written down.',
  'The fragility map is the point of the exercise — not whether a piece survives, but learning ' +
    'which absences the system had quietly come to depend on.',
];

const CANNOT_SHOW =
  'which of your pieces is load-bearing. These three verdicts are written into the specimen ' +
  'terrain to teach the move; your repo has its own hidden dependencies, and the only way to ' +
  'find them is to actually take things away and watch.';

/* ── The scene: five loop glyphs over a shelf of three pieces ─────────── */

const LOOPS = [0, 1, 2, 3, 4];

// Geometry, in viewBox units.
const W = 600;
const H = 322;
const SHELF_Y = 250;
const SLOT_W = 168;
const SLOT_X = (k) => 36 + k * (SLOT_W + 18);
const PIECE_Y = SHELF_Y - 66;
const LOOP_Y = 56;
const LOOP_X = (k) => 78 + k * 110;

// Which loops a piece feeds. The context file feeds every loop (the collapse);
// the others feed a representative subset — a drawing choice, labelled as such.
const FEEDS = {
  tool: [0, 1, 2, 3, 4],
  context: [0, 1, 2, 3, 4],
  signal: [3],
};

function castFor(piece, removed, run) {
  if (!removed) return 'var(--ink-faint)';
  return run.collapsed ? 'var(--c-disturb)' : 'var(--accent)';
}

function Scene({ removedId, run }) {
  const removed = removedId !== null;
  const collapsed = removed && run.collapsed;
  const verdictCol = collapsed ? 'var(--c-disturb)' : 'var(--accent)';
  const fedLoops = removed ? FEEDS[removedId] : [];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={
        removed
          ? `Removal scene: the ${run.affected} has been lifted off the shelf. ` +
            `The loops that depended on it ${
              collapsed
                ? 'collapsed — placements went wrong and the review queue backed up'
                : 're-adapted — they found another way and kept merging'
            }. Verdict: ${collapsed ? 'collapse, a hidden dependency' : 're-adapted, not load-bearing'}.`
          : 'Removal scene at rest: five loops draw from a shelf of three shared pieces — a tool, a context file, a signal. Nothing removed yet.'
      }
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <rect x="0" y="0" width={W} height={H} fill="var(--paper)" rx="8" />

      {/* dependency wires: shelf piece → the loops it feeds */}
      {PIECES.map((p, k) => {
        const gone = removedId === p.id;
        return FEEDS[p.id].map((li) => {
          const x1 = SLOT_X(k) + SLOT_W / 2;
          const x2 = LOOP_X(li);
          return (
            <line
              key={`w-${p.id}-${li}`}
              x1={x1}
              y1={PIECE_Y}
              x2={x2}
              y2={LOOP_Y + 18}
              stroke={gone ? verdictCol : 'var(--line-soft)'}
              strokeWidth={gone ? 1.6 : 1.2}
              strokeDasharray={gone ? '4 4' : undefined}
              opacity={gone ? 0.7 : 0.5}
              style={{ transition: 'stroke 0.4s ease, opacity 0.4s ease' }}
            />
          );
        });
      })}

      {/* the five loop glyphs */}
      {LOOPS.map((li) => {
        const fed = fedLoops.includes(li);
        const col = fed ? verdictCol : 'var(--ink-faint)';
        const x = LOOP_X(li);
        return (
          <g key={`loop-${li}`} style={{ transition: 'all 0.4s ease' }}>
            <circle
              cx={x}
              cy={LOOP_Y}
              r="18"
              fill="var(--paper-2)"
              stroke={col}
              strokeWidth={fed ? 2.6 : 1.6}
              style={{ transition: 'stroke 0.4s ease, stroke-width 0.4s ease' }}
            />
            {/* a small recirculating arc, the loop mark */}
            <path
              d={`M ${x - 8} ${LOOP_Y - 5} A 9 9 0 1 1 ${x - 8} ${LOOP_Y + 6}`}
              fill="none"
              stroke={col}
              strokeWidth="1.8"
              style={{ transition: 'stroke 0.4s ease' }}
            />
            <path
              d={`M ${x - 11} ${LOOP_Y + 6} l 3 -3 l 3 4 z`}
              fill={col}
              style={{ transition: 'fill 0.4s ease' }}
            />
            <text
              x={x}
              y={LOOP_Y + 32}
              textAnchor="middle"
              fontSize="8.5"
              fontFamily="var(--font-mono)"
              fill="var(--ink-faint)"
            >
              loop {li + 1}
            </text>
          </g>
        );
      })}

      {/* collapse-only: the review queue backing up under the loops */}
      {collapsed ? (
        <g aria-hidden="true">
          <text
            x={W / 2}
            y={LOOP_Y + 56}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--font-mono)"
            fill="var(--c-disturb)"
          >
            review queue {run.story[2]?.data?.queueDepth ?? ''} deep, not draining
          </text>
          {Array.from({ length: run.story[2]?.data?.queueDepth ?? 0 }).map((_, b) => (
            <rect
              key={b}
              x={W / 2 - 70 + b * 10}
              y={LOOP_Y + 62}
              width="7"
              height="10"
              rx="1.5"
              fill="var(--c-disturb)"
              opacity="0.8"
            />
          ))}
        </g>
      ) : null}

      {/* the shelf plank */}
      <rect x="20" y={SHELF_Y} width={W - 40} height="9" rx="3" fill="var(--paper-3)" />
      <rect x="20" y={SHELF_Y} width={W - 40} height="2.5" rx="1.5" fill="var(--line-soft)" />

      {/* the three pieces sitting on (or lifted off) the shelf */}
      {PIECES.map((p, k) => {
        const gone = removedId === p.id;
        const x = SLOT_X(k);
        const lift = gone ? -26 : 0; // lifted clear of the shelf
        const col = castFor(p, gone, run);
        return (
          <g
            key={`piece-${p.id}`}
            transform={`translate(${x}, ${PIECE_Y + lift})`}
            style={{ transition: 'transform 0.45s cubic-bezier(.2,.8,.2,1)' }}
          >
            {/* empty slot outline left behind when lifted */}
            {gone ? (
              <rect
                x="0"
                y={-lift}
                width={SLOT_W}
                height="52"
                rx="7"
                fill="none"
                stroke={col}
                strokeWidth="1.4"
                strokeDasharray="5 5"
                opacity="0.6"
              />
            ) : null}
            <rect
              x="0"
              y="0"
              width={SLOT_W}
              height="52"
              rx="7"
              fill="var(--paper-2)"
              stroke={col}
              strokeWidth={gone ? 2.4 : 1.6}
              style={{ transition: 'stroke 0.4s ease, stroke-width 0.4s ease' }}
            />
            <rect
              x="0"
              y="0"
              width="5"
              height="52"
              rx="2.5"
              fill={col}
              opacity={gone ? 0.9 : 0.5}
              style={{ transition: 'fill 0.4s ease, opacity 0.4s ease' }}
            />
            <text
              x="16"
              y="20"
              fontSize="8"
              fontFamily="var(--font-mono)"
              fill="var(--ink-faint)"
              letterSpacing="0.08em"
            >
              {p.kind.toUpperCase()}
            </text>
            <text x="16" y="37" fontSize="12.5" fontWeight="700" fill="var(--ink)">
              {p.label}
            </text>
          </g>
        );
      })}

      {/* verdict stamp, once a run exists */}
      {removed ? (
        <g aria-hidden="true">
          <text
            x={W / 2}
            y={H - 8}
            textAnchor="middle"
            fontSize="11"
            fontFamily="var(--font-mono)"
            fontWeight="700"
            fill={verdictCol}
            style={{ transition: 'fill 0.4s ease' }}
          >
            {collapsed ? 'COLLAPSE — hidden dependency found' : 'RE-ADAPTED — not load-bearing'}
          </text>
        </g>
      ) : (
        <text
          x={W / 2}
          y={H - 8}
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill="var(--ink-faint)"
        >
          lift a piece off the shelf
        </text>
      )}
    </svg>
  );
}

/* ── The fragility map: one row per piece, filled as runs land ────────── */

function FragilityMap({ done }) {
  return (
    <div
      className="mh-lamps"
      role="group"
      aria-label="Fragility map — what each removal revealed"
      style={{ marginTop: 14 }}
    >
      {PIECES.map((p) => {
        const run = done[p.id];
        const state = !run ? 'off' : run.collapsed ? 'warn' : 'on';
        const verdict = !run ? 'untested' : run.collapsed ? 'load-bearing' : 'replaceable';
        return (
          <span key={p.id} className={`mh-lamp ${state}`}>
            {p.label} — {verdict}
          </span>
        );
      })}
    </div>
  );
}

/* ── The page ─────────────────────────────────────────────────────────── */

export default function P10() {
  // At rest: the context removal is pre-run — the one collapse, fully drawn.
  const REST = 'context';
  const [removedId, setRemovedId] = useState(REST);
  const [predicted, setPredicted] = useState('collapse'); // matched to REST
  const [done, setDone] = useState({ [REST]: RUNS[REST] });

  const run = removedId ? RUNS[removedId] : null;
  const piece = PIECES.find((p) => p.id === removedId);

  // Lift a piece: reset the commitment, keep the fragility map.
  const lift = (id) => {
    if (id === removedId) return;
    setRemovedId(id);
    setPredicted(null);
  };

  // Commit a prediction, then record the run on the fragility map.
  const commit = (id) => {
    setPredicted(id);
    setDone((d) => (removedId ? { ...d, [removedId]: RUNS[removedId] } : d));
  };

  const verdictRight = run ? (predicted === 'collapse') === run.collapsed : null;

  return (
    <Page n={10} claim="Remove things on purpose; subtraction reveals what addition concealed.">
      <Activity wide>
        <Scene removedId={removedId} run={run} />

        <div
          className="mh-controls"
          role="group"
          aria-label="Lift a piece off the shelf"
          style={{ marginTop: 12 }}
        >
          <span className="mh-kicker">Lift one off the shelf</span>
          {PIECES.map((p) => (
            <button
              key={p.id}
              type="button"
              className="mh-chip"
              aria-pressed={removedId === p.id}
              onClick={() => lift(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {removedId && predicted === null ? (
          <Commit
            prompt={`You lifted ${piece.label} — ${piece.blurb}. Run the week: collapse, or re-adapt?`}
            options={[
              { id: 'collapse', label: 'collapse — a hidden dependency' },
              { id: 'adapt', label: 're-adapt — not load-bearing' },
            ]}
            onReveal={commit}
          >
            {(picked) => (
              <p style={{ margin: 0 }}>
                <strong>
                  {(picked === 'collapse') === run.collapsed ? 'You called it.' : 'Other way.'}
                </strong>{' '}
                {run.note}
              </p>
            )}
          </Commit>
        ) : null}

        {removedId && predicted !== null ? (
          <>
            <div className="mh-feedback" role="status">
              <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
                you called {predicted === 'collapse' ? 'collapse' : 're-adapt'} ·{' '}
                {verdictRight ? 'matched' : 'the other way'}
              </span>
              <p style={{ margin: 0 }}>{run.note}</p>
            </div>

            <span className="mh-kicker" style={{ display: 'block', margin: '14px 0 4px' }}>
              The week, as it ran
            </span>
            <Walkthrough
              trace={{ steps: run.story }}
              renderStep={(step) => (
                <p
                  className="mono"
                  style={{
                    margin: '4px 0',
                    fontSize: '12px',
                    color: run.collapsed ? 'var(--c-disturb)' : 'var(--accent-ink)',
                  }}
                >
                  {step.label} →{' '}
                  {Object.entries(step.data)
                    .filter(([k]) => k !== 'target')
                    .map(([k, val]) => `${k}: ${val}`)
                    .join('  ·  ') || '—'}
                </p>
              )}
            />
          </>
        ) : null}

        <FragilityMap done={done} />

        <ModelNotes register="mechanism" notes={NOTES} cannotShow={CANNOT_SHOW} glass={GLASS} />
      </Activity>

      <Seen>
        Two pieces re-adapted: the tool was one route to a capability the loops kept, the signal a
        cache of a fact they could recompute. One collapsed — the context file was the only place a
        decision every loop made was written down.
      </Seen>

      <Takeaway>
        Take something away on purpose and watch. Collapse names a hidden dependency to harden;
        graceful re-adaptation proves the dependency was never load-bearing. Either way, you learned
        what the system actually rests on.
      </Takeaway>

      <Deeper title="The cadence">
        <p style={{ margin: '0 0 8px' }}>
          Adversarial pressure is a recurring practice with its own pace layer, not a one-time
          exercise. <Badge layer="W" note="§2.11 — the work against entropy" />
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--ink-faint)' }}>
              <th style={{ padding: '4px 8px 4px 0' }}>Cadence</th>
              <th style={{ padding: '4px 8px' }}>The disturbance</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                'Daily',
                'small disturbances built into normal operation: retry jitter, cache misses, eval shuffling',
              ],
              [
                'Weekly',
                'deliberate fault injection in non-critical paths; mutation tests on recent changes',
              ],
              [
                'Monthly',
                'chaos game days; full red-team passes against new agent classes; trust-grant staleness reviews',
              ],
              [
                'Quarterly',
                'removal experiments: take away a context source, a tool, a heuristic, and observe what breaks',
              ],
            ].map((row) => (
              <tr key={row[0]} style={{ borderTop: '1px solid var(--line-soft)' }}>
                <td
                  style={{
                    padding: '5px 8px 5px 0',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {row[0]}
                </td>
                <td style={{ padding: '5px 8px', color: 'var(--ink-2)' }}>{row[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ margin: '12px 0 0' }}>
          <strong>The over-stabilization warning.</strong> The healthy posture is equilibrium under
          disturbance — a system that holds its shape because it can absorb a challenge and re-form,
          not because nothing challenges it. Entropy fought too well becomes its own pathology: a
          system over-stabilized into rigidity loses the capacity to adapt to what comes next. The
          work is the maintenance of <em>responsive</em> order, not the elimination of disorder.{' '}
          <Badge layer="W" note="§2.11 — equilibrium under disturbance" />
        </p>
      </Deeper>
    </Page>
  );
}
