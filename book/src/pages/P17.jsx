// P17 — Monday morning. One activity: the Skylark Data ops floor, a foreign
// terrain you have never seen, drawn as six stations over a central steward
// glyph and a twelve-pip budget meter.
//
// You arrive Monday as the new steward. Six problems are seeded in the floor
// (a mis-placed decision, an open loop, a forming spiral, a saturated budget,
// a stale trust grant, a decorative guardrail). Click a station to open its
// two or three terrain moves; spending one drains a pip, lights the station,
// and reshapes the scene under it (instruments turn the station amber-found;
// fixes turn it green). Every station, every consequence, every debrief line,
// and the Monday memo are checkride.js output at seed 22 — no logic in this
// file decides found-or-fixed; the engine does. At rest, the first move is
// pre-spent: the retention purge is read, one station lit, the floor legible.

import { useRef, useState } from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, Commit, Mark, ModelNotes, glassSlice } from '../components/kit.jsx';
import {
  MAX_ACTIONS,
  applyAction,
  availableActions,
  debrief,
  gatedInflow,
  generateCheckride,
  mondayMemo,
} from '../engine/scenarios/checkride.js';
import checkrideRaw from '../engine/scenarios/checkride.js?raw';

/* ── The terrain: same seed, same shop, same six problems, forever ─────── */

const SEED = 22;
const FRESH = generateCheckride(SEED);
const MENU = availableActions(FRESH); // sixteen labelled moves; the budget is twelve

// The engine keeps the action→problem mapping private inside its ACTIONS
// table; mirror it here once so a station can open exactly its own moves. The
// action ids are stable; instruments are listed before fixes inside a station.
const ACTION_PROBLEM = {
  'map-placement': 'misplaced-decision',
  'add-human-gate': 'misplaced-decision',
  'add-quarantine': 'misplaced-decision',
  'walk-loop-anatomy': 'open-loop',
  'add-update-block': 'open-loop',
  'chart-eval-divergence': 'forming-spiral',
  'add-outside-reference': 'forming-spiral',
  'add-decay': 'forming-spiral',
  'audit-budget': 'saturated-budget',
  'sample-deep-review': 'saturated-budget',
  'move-gate-dbt': 'saturated-budget',
  'read-trust-ledger': 'stale-trust',
  'revoke-stale-grant': 'stale-trust',
  'grade-guardrails': 'decorative-guardrail',
  'right-size-rate-limit': 'decorative-guardrail',
  'schedule-disturbance': 'decorative-guardrail',
};

// Group the engine's moves by the station (problem) each one touches.
const MOVES_BY_PROBLEM = {};
for (const m of MENU) {
  const pid = ACTION_PROBLEM[m.id];
  (MOVES_BY_PROBLEM[pid] ??= []).push(m);
}

const LHS0 = gatedInflow(FRESH.terrain.approvals);
const BUDGET_LINE =
  Math.round(FRESH.terrain.approvals.budget * (1 - FRESH.terrain.approvals.tolerance) * 10) / 10;

/* ── The six stations, in floor order ──────────────────────────────────── */

// id matches a problem id; the cast colour, glyph, and one-line tell are the
// drawing; the engine owns whether a station ends found, fixed, or dark.
const STATIONS = [
  {
    id: 'misplaced-decision',
    region: 'serving/',
    name: 'Retention purge',
    tell: 'hard-deletes raw partitions below every gate',
    color: 'var(--c-disturb)',
  },
  {
    id: 'open-loop',
    region: 'transforms/',
    name: 'Schema-drift fixer',
    tell: 'four stages, no update stage',
    color: 'var(--c-docs)',
  },
  {
    id: 'forming-spiral',
    region: 'labeling/',
    name: 'Label-quality scorer',
    tell: 'graded on labels its own loop made',
    color: 'var(--c-deppatch)',
  },
  {
    id: 'saturated-budget',
    region: 'orchestration/',
    name: 'Steward rotation',
    tell: 'gated inflow over the budget line',
    color: 'var(--c-triage)',
  },
  {
    id: 'stale-trust',
    region: 'feature-store/',
    name: 'transform-bump auto-merge',
    tell: 'a grant stamped by a judge that left',
    color: 'var(--c-backfill)',
  },
  {
    id: 'decorative-guardrail',
    region: 'ingest/',
    name: 'Ingest rate limit',
    tell: 'set at 10x a peak storms reach at 4x',
    color: 'var(--c-security)',
  },
];

/* ── The glass: the engine that decides found, fixed, and the memo ─────── */

const GLASS = [
  glassSlice(checkrideRaw, 'export function applyAction', '\n}'),
  glassSlice(checkrideRaw, 'export function debrief', '\n}'),
].join('\n\n// ─────────────────────────────────────────────────────────\n\n');

const NOTES = [
  `Seed ${SEED}, deterministic: the same shop, the same six problems, the same jittered ` +
    'numbers on every visit. Nothing in this page decides found-or-fixed — applyAction does.',
  'Sixteen labelled moves, twelve actions: instruments cost the same pip as fixes, because a ' +
    "steward's scarce input is considered attention, and a reading you take is a fix you don't.",
  'The debrief and the Monday memo are pure engine output assembled from your own log; the !! ' +
    'lines in the memo are the engine sanity-check naming the classic errors your twelve left.',
];

const CANNOT_SHOW =
  'your shop. Skylark’s six problems were planted to be findable inside twelve actions, and ' +
  'each station hands you labelled moves; on a real Monday nobody numbers the problems or labels ' +
  'the moves. The reading order transfers (instruments before fixes, the irreversible before the ' +
  'merely slow); the labelled floor is the fiction.';

/* ── Scene geometry, in viewBox units ──────────────────────────────────── */

const W = 640;
const H = 360;
const HUB_X = W / 2;
const HUB_Y = H / 2 - 6;

// Two rows of three stations around the hub.
const ROW_Y = [54, H - 156];
const COL_X = [70, W / 2 - 95, W - 260];
const CARD_W = 190;
const CARD_H = 92;

function stationPos(i) {
  const row = i < 3 ? 0 : 1;
  const col = i % 3;
  return { x: COL_X[col], y: ROW_Y[row], cx: COL_X[col] + CARD_W / 2, cy: ROW_Y[row] + CARD_H / 2 };
}

function stationState(problem) {
  if (problem.fixed) return 'fixed';
  if (problem.found) return 'found';
  return 'dark';
}

function stationCast(station, st, selected) {
  if (st === 'fixed') return 'var(--accent)';
  if (st === 'found') return station.color;
  return selected ? 'var(--ink-2)' : 'var(--ink-faint)';
}

/* ── The drawn floor ───────────────────────────────────────────────────── */

function Floor({ state, selectedId }) {
  const probById = Object.fromEntries(state.problems.map((p) => [p.id, p]));
  const spent = state.actionsTaken.length;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={
        `Skylark Data ops floor: six stations around a central steward. ` +
        STATIONS.map((s) => {
          const st = stationState(probById[s.id]);
          return `${s.name} ${st === 'dark' ? 'unread' : st}`;
        }).join('; ') +
        `. ${spent} of ${MAX_ACTIONS} steward actions spent.`
      }
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <rect x="0" y="0" width={W} height={H} fill="var(--paper)" rx="8" />
      <text
        x="16"
        y="22"
        fontSize="10"
        fontFamily="var(--font-mono)"
        letterSpacing="0.14em"
        fill="var(--ink-faint)"
      >
        SKYLARK DATA · 9 PEOPLE · YOU ARRIVE MONDAY AS THE NEW STEWARD
      </text>

      {/* wires: each station to the steward hub */}
      {STATIONS.map((s, i) => {
        const p = probById[s.id];
        const st = stationState(p);
        const pos = stationPos(i);
        const live = st !== 'dark';
        const col =
          st === 'fixed' ? 'var(--accent)' : st === 'found' ? s.color : 'var(--line-soft)';
        return (
          <line
            key={`wire-${s.id}`}
            x1={pos.cx}
            y1={pos.cy}
            x2={HUB_X}
            y2={HUB_Y}
            stroke={col}
            strokeWidth={live ? 1.8 : 1.1}
            strokeDasharray={st === 'found' ? '5 4' : undefined}
            opacity={live ? 0.7 : 0.4}
            style={{ transition: 'stroke 0.45s ease, opacity 0.45s ease' }}
          />
        );
      })}

      {/* the steward hub: a small human glyph, the only judgment on the floor */}
      <g style={{ transition: 'all 0.4s ease' }} aria-hidden="true">
        <circle
          cx={HUB_X}
          cy={HUB_Y}
          r="26"
          fill="var(--paper-2)"
          stroke="var(--line)"
          strokeWidth="1.4"
        />
        <circle
          cx={HUB_X}
          cy={HUB_Y - 7}
          r="6.5"
          fill="none"
          stroke="var(--ink-2)"
          strokeWidth="2"
        />
        <path
          d={`M ${HUB_X - 10} ${HUB_Y + 12} a 10 9 0 0 1 20 0`}
          fill="none"
          stroke="var(--ink-2)"
          strokeWidth="2"
        />
        <text
          x={HUB_X}
          y={HUB_Y + 40}
          textAnchor="middle"
          fontSize="8.5"
          fontFamily="var(--font-mono)"
          letterSpacing="0.1em"
          fill="var(--ink-faint)"
        >
          steward
        </text>
      </g>

      {/* the six stations */}
      {STATIONS.map((s, i) => {
        const p = probById[s.id];
        const st = stationState(p);
        const pos = stationPos(i);
        const selected = selectedId === s.id;
        const cast = stationCast(s, st, selected);
        const fill =
          st === 'fixed'
            ? 'var(--accent-soft)'
            : st === 'found'
              ? 'var(--paper-3)'
              : 'var(--paper-2)';
        return (
          <g key={s.id} transform={`translate(${pos.x}, ${pos.y})`}>
            {/* selection halo, so the open station reads at a glance */}
            {selected ? (
              <rect
                x="-5"
                y="-5"
                width={CARD_W + 10}
                height={CARD_H + 10}
                rx="11"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.6"
                strokeDasharray="4 4"
                opacity="0.85"
              />
            ) : null}
            <rect
              x="0"
              y="0"
              width={CARD_W}
              height={CARD_H}
              rx="9"
              fill={fill}
              stroke={cast}
              strokeWidth={st === 'dark' ? 1.4 : 2.2}
              style={{ transition: 'stroke 0.45s ease, fill 0.45s ease, stroke-width 0.45s ease' }}
            />
            {/* status spine */}
            <rect
              x="0"
              y="0"
              width="5"
              height={CARD_H}
              rx="2.5"
              fill={cast}
              opacity={st === 'dark' ? 0.45 : 0.95}
              style={{ transition: 'fill 0.45s ease, opacity 0.45s ease' }}
            />
            <text
              x="16"
              y="20"
              fontSize="8"
              fontFamily="var(--font-mono)"
              letterSpacing="0.1em"
              fill="var(--ink-faint)"
            >
              {s.region}
            </text>
            <text x="16" y="40" fontSize="13" fontWeight="700" fill="var(--ink)">
              {s.name}
            </text>
            <text x="16" y="59" fontSize="9.5" fontFamily="var(--font-mono)" fill="var(--ink-2)">
              {s.tell}
            </text>
            {/* the status word, the one place the engine verdict shows on the card */}
            <text
              x="16"
              y="80"
              fontSize="9"
              fontFamily="var(--font-mono)"
              letterSpacing="0.12em"
              fontWeight="700"
              fill={st === 'dark' ? 'var(--ink-faint)' : cast}
              style={{ transition: 'fill 0.45s ease' }}
            >
              {st === 'fixed' ? '● RESHAPED' : st === 'found' ? '◉ FOUND' : '○ UNREAD'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── The twelve-pip budget meter ───────────────────────────────────────── */

function BudgetMeter({ spent }) {
  const remaining = MAX_ACTIONS - spent;
  return (
    <div
      className="mh-controls"
      role="img"
      aria-label={`Steward budget: ${spent} of ${MAX_ACTIONS} actions spent, ${remaining} remain`}
      style={{ marginTop: 12, alignItems: 'center' }}
    >
      <span className="mh-kicker">Budget</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: MAX_ACTIONS }, (_, i) => (
          <span
            key={i}
            style={{
              width: 18,
              height: 9,
              borderRadius: 2,
              background: i < spent ? 'var(--line)' : 'var(--accent)',
              opacity: i < spent ? 0.55 : 0.9,
              transition: 'background 0.3s ease, opacity 0.3s ease',
            }}
          />
        ))}
      </div>
      <span className="mh-kicker" aria-live="polite">
        {remaining} of {MAX_ACTIONS} remain
      </span>
    </div>
  );
}

/* ── The open station's moves: only this station's, never the whole menu ── */

function StationMoves({ station, state, exhausted, onTake }) {
  const moves = MOVES_BY_PROBLEM[station.id] ?? [];
  return (
    <div className="mh-commit" role="group" aria-label={`${station.name} — terrain moves`}>
      <span className="mh-kicker">
        {station.region} · {station.name} — spend a pip
      </span>
      <p style={{ margin: '4px 0 10px', fontSize: '13.5px', color: 'var(--ink-2)' }}>
        {station.tell}. Read it or reshape it — each move costs one of your twelve.
      </p>
      <div className="mh-chipset" role="group" aria-label="Moves on this station">
        {moves.map((m) => {
          const taken = state.actionsTaken.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              className="mh-chip"
              aria-pressed={taken}
              disabled={taken || exhausted}
              title={taken ? 'already spent' : exhausted ? 'the twelve are spent' : m.kind}
              onClick={() => onTake(m.id)}
              style={{ opacity: taken ? 0.55 : undefined }}
            >
              <span
                className="mh-kicker"
                style={{ marginRight: 6, color: taken ? 'var(--ink-faint)' : 'var(--accent-ink)' }}
              >
                {taken ? '✓' : m.kind}
              </span>
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── The debrief and memo (assembled by the engine from the reader's log) ─ */

function memoAnswers(state) {
  const terrain = state.terrain;
  const taken = state.actionsTaken;
  const misplaced = state.problems.find((p) => p.id === 'misplaced-decision');
  const quarantined = taken.includes('add-quarantine');
  const fixer = terrain.loops.find((l) => l.id === 'drift-fixer');

  const placements = [];
  if (misplaced.found) {
    placements.push({
      decision: 'raw-partition retention purges',
      quadrant: quarantined ? 'emergent-explore' : 'danger',
    });
  }
  if (taken.includes('move-gate-dbt')) {
    placements.push({ decision: 'dbt model patch refreshes', quadrant: 'emergent-spec' });
  }

  const irreversibles = [];
  if (misplaced.found && !quarantined) {
    irreversibles.push('raw-partition retention purges: a dropped partition cannot be recalled');
  }

  return {
    team: 'Skylark Data',
    placements,
    firstLoop: {
      name: 'schema-drift fixer',
      signal: fixer.stages.signal,
      boundedAction: fixer.stages.action,
      verification: fixer.stages.verification,
      reversibility: fixer.stages.commitRevert,
      signalUpdate: fixer.stages.update ?? '',
      authoritySurface: 'merge on green, scoped to the staging models; everything else proposes',
    },
    gates: terrain.approvals.classes.map((c) => ({
      cls: c.label,
      inflow: c.inflow,
      rate: c.rate,
      gate: c.gate,
      sampling: c.sampling,
    })),
    budget: terrain.approvals.budget,
    tolerance: terrain.approvals.tolerance,
    irreversibles,
    disturbances: terrain.disturbances.schedule,
  };
}

function DebriefSection({ s }) {
  return (
    <div
      style={{
        border: '1px solid var(--line-soft)',
        borderLeft: `3px solid ${s.found ? 'var(--accent)' : 'var(--red)'}`,
        borderRadius: 4,
        background: 'var(--paper)',
        padding: '10px 14px 6px',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'baseline',
          flexWrap: 'wrap',
          marginBottom: 6,
        }}
      >
        <strong style={{ fontSize: '14.5px' }}>{s.problem}</strong>
        <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>
          {s.where}
        </span>
        <span className="mh-kicker" style={{ color: s.found ? 'var(--accent-ink)' : 'var(--red)' }}>
          {s.found ? 'found' : 'never found'}
        </span>
      </div>
      <p style={{ margin: '0 0 5px', fontSize: '13px', lineHeight: 1.5, color: 'var(--ink-2)' }}>
        <span className="mh-kicker" style={{ display: 'block', marginBottom: 1 }}>
          what you did
        </span>
        {s.readerDid}
      </p>
      <p style={{ margin: '0 0 5px', fontSize: '13px', lineHeight: 1.5, color: 'var(--ink-2)' }}>
        <span className="mh-kicker" style={{ display: 'block', marginBottom: 1 }}>
          what it caused
        </span>
        {s.whatItCaused}
      </p>
      <p style={{ margin: '0 0 5px', fontSize: '13px', lineHeight: 1.5, color: 'var(--ink-2)' }}>
        <span className="mh-kicker" style={{ display: 'block', marginBottom: 1 }}>
          what the handbook says
        </span>
        {s.handbookSays}
      </p>
    </div>
  );
}

/* ── The page ──────────────────────────────────────────────────────────── */

// At rest the first reading is pre-spent: one station lit, the floor legible.
const REST = applyAction(FRESH, 'map-placement');

export default function P17() {
  const [state, setState] = useState(REST);
  const [selectedId, setSelectedId] = useState('misplaced-decision');
  const [ended, setEnded] = useState(false);
  const [copied, setCopied] = useState(false);
  const memoRef = useRef(null);

  const spent = state.actionsTaken.length;
  const exhausted = spent >= MAX_ACTIONS;
  const station = STATIONS.find((s) => s.id === selectedId) ?? null;
  const foundCount = state.problems.filter((p) => p.found).length;
  const report = ended ? debrief(state) : null;
  const memoText = ended ? mondayMemo(memoAnswers(state)) : '';
  const lastLog = state.log[state.log.length - 1] ?? null;

  const take = (id) => {
    if (ended) return;
    setState((s) => {
      if (s.actionsTaken.length >= MAX_ACTIONS || s.actionsTaken.includes(id)) return s;
      return applyAction(s, id);
    });
  };

  const endRide = () => {
    if (spent > 0) setEnded(true);
  };

  const copyMemo = async () => {
    try {
      await navigator.clipboard.writeText(memoText);
      setCopied(true);
    } catch {
      memoRef.current?.select();
    }
  };

  return (
    <Page n={17} claim="Pick one small loop and close it; the first loop is the template.">
      <Activity wide>
        <Floor state={state} selectedId={selectedId} />
        <BudgetMeter spent={spent} />

        {/* the one interaction: pick a station to open its moves */}
        <div
          className="mh-controls"
          role="group"
          aria-label="Walk the floor: open a station"
          style={{ marginTop: 10 }}
        >
          <span className="mh-kicker">Open a station</span>
          {STATIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="mh-chip"
              aria-pressed={selectedId === s.id}
              onClick={() => setSelectedId(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>

        {station && !ended ? (
          <StationMoves station={station} state={state} exhausted={exhausted} onTake={take} />
        ) : null}

        {lastLog ? (
          <p
            className="mono"
            data-testid="last-caused"
            style={{
              margin: '10px 0 0',
              fontSize: '12px',
              lineHeight: 1.5,
              color: 'var(--ink-2)',
              borderLeft: '3px solid var(--accent)',
              paddingLeft: 10,
            }}
          >
            <strong>{lastLog.label}.</strong> {lastLog.caused}
          </p>
        ) : null}

        {!ended ? (
          <Commit
            prompt={`${spent} of ${MAX_ACTIONS} pips spent. End the checkride and read the debrief assembled from your log?`}
            options={[{ id: 'end', label: 'End the checkride · write the debrief' }]}
            onReveal={endRide}
          >
            <p style={{ margin: 0 }}>
              The debrief reads only what your log holds. Problems you never opened say so plainly,
              and the Monday memo assembles below.
            </p>
          </Commit>
        ) : null}

        {ended && report ? (
          <>
            <span className="mh-kicker" style={{ display: 'block', margin: '16px 0 8px' }}>
              The debrief · your {spent} action{spent === 1 ? '' : 's'} touched {foundCount} of the
              six · read the red first
            </span>
            <div style={{ display: 'grid', gap: 8 }}>
              {report.sections.map((s) => (
                <DebriefSection key={s.problem} s={s} />
              ))}
            </div>

            <span className="mh-kicker" style={{ display: 'block', margin: '16px 0 6px' }}>
              The Monday memo · copyable, carryable · the !! lines are the engine’s sanity-check
            </span>
            <textarea
              ref={memoRef}
              readOnly
              value={memoText}
              data-testid="memo"
              rows={Math.min(memoText.split('\n').length + 1, 38)}
              aria-label="The Monday-morning memo, plain text"
              onFocus={(e) => e.target.select()}
              style={{
                width: '100%',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                lineHeight: 1.55,
                color: 'var(--ink)',
                background: 'var(--paper)',
                border: '1px solid var(--line-soft)',
                borderRadius: 4,
                padding: '10px 12px',
                resize: 'vertical',
              }}
            />
            <div className="mh-controls" role="group" aria-label="Copy the memo">
              <button type="button" className="mh-btn mh-btn-primary" onClick={copyMemo}>
                {copied ? 'Copied' : 'Copy the memo'}
              </button>
              <span className="mh-kicker">
                same seed, same six · a different twelve is a different memo
              </span>
            </div>
          </>
        ) : null}

        <ModelNotes register="mechanism" notes={NOTES} cannotShow={CANNOT_SHOW} glass={GLASS} />
      </Activity>

      <Seen>
        Twelve pips against sixteen labelled moves: every reading you take is a fix you don’t. The
        retention purge reads irreversible, gated inflow ({LHS0}/wk) runs past the budget line (
        {BUDGET_LINE}), and a grant stamped by a judge that left nine weeks ago still auto-merges.
      </Seen>

      <Takeaway>
        Pick one small loop you can fully instrument, test, and reverse — dependency patches are the
        canonical starter — and close it end-to-end. The point of the first loop isn’t the loop;
        it’s the template, and the platform grows by adding loops, not by making one smarter.
      </Takeaway>

      <Deeper title="Start here">
        <p style={{ margin: '0 0 10px' }}>
          The handbook’s counsel for a team that asks <em>what do we do first</em>, verbatim.{' '}
          <Badge layer="W" note="§3.11 — Monday morning" />{' '}
          <Mark kind="real" note="the handbook’s own words, §3.11" />
        </p>
        <blockquote
          style={{
            margin: '0 0 12px',
            paddingLeft: 12,
            borderLeft: '3px solid var(--line)',
            color: 'var(--ink-2)',
            fontSize: '14px',
            lineHeight: 1.6,
          }}
        >
          <p style={{ margin: '0 0 10px' }}>
            When a team reads this and asks <em>what do we do first</em>, the answer is almost
            always the same:{' '}
            <strong>pick one small closed loop and make it work end-to-end.</strong> Not the most
            interesting loop. Not the highest-ROI loop. The one you can fully instrument, test, and
            control within a short cycle. Dependency patches are the canonical starter: clean
            signals, clean reactions, cheap reversal, and humans generally dislike doing them.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            The point of the first loop isn’t the loop. It’s the template. Once one works
            end-to-end, the second is dramatically cheaper, the third cheaper still, and by the
            fifth the team has a pattern they apply almost mechanically.{' '}
            <strong>
              The platform grows by adding loops, not by making any single loop smarter.
            </strong>
          </p>
          <p style={{ margin: 0 }}>
            A team with one working loop and confidence it can replicate the pattern is further
            along than a team with elaborate architecture and no working loop. Start there.
          </p>
        </blockquote>
        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--ink-2)' }}>
          <strong>What the memo carries.</strong> Placement map, first-loop spec with all six
          ingredients, a gate table that checks its own inequality, an irreversibles list, and a
          disturbance schedule. The engine’s <code>mondayMemo()</code> formats your worksheet
          answers and prints a <code>!!</code> line for every classic error left in place: a
          danger-quadrant placement, a blank loop ingredient, an irreversible class below a gate, a
          failing inequality, an empty disturbance calendar.
        </p>
      </Deeper>
    </Page>
  );
}
