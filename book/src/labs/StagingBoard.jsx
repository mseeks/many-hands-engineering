// StagingBoard.jsx — LAB 16·A "The staging board" (Ch 16 · The staged
// transition, covers §3.4). BET REGISTER, deliberately.
//
// Four captioned recorded runs of the same engine on the same seed: the
// author's bet run straight (stages 0-6 advancing, the cost-of-the-nth-loop
// curve bending down), the two ways teams break the order (skip Stage 0;
// broaden Stage 1 before replicating it), and — prominently — the model
// dissent: the parameterization where the bet fails. Bet-register boards are
// recorded runs, never free experiments; the only controls here are the
// steppers and one reading toggle on the skip board (yield vs activity),
// which changes what you read, not what ran. Every payoff caption carries
// the standing sentence: this curve is the author's bet, drawn. The physics
// is src/engine/scenarios/staging.js, sliced verbatim into the glass below.

import { useState } from 'react';
import { Badge, LabFrame, Walkthrough, glassSlice } from '../components/kit.jsx';
import {
  broadenStageOne,
  dissent,
  skipStageZero,
  stagingRun,
} from '../engine/scenarios/staging.js';
import stagingSrc from '../engine/scenarios/staging.js?raw';

const SEED = 11; // the book's canonical seed; tests/scenarios.test.js pins these runs

const GLASS = glassSlice(
  stagingSrc,
  'Cost of closing loop n',
  'return { rows, costs, legibility, events };\n}',
);

/* ── The recorded runs (computed once; deterministic from the seed) ────── */

const BET_TRACE = stagingRun(SEED);
const SKIP_TRACE = skipStageZero(SEED);
const BROAD_TRACE = broadenStageOne(SEED);
const DISSENT_TRACE = dissent(SEED);

// Each builder banks its full runs in the final step's data; the boards draw
// from there, so a chart and its captions can never disagree.
const BET = BET_TRACE.steps.at(-1).data; // { rows, costs, events }
const SKIP = SKIP_TRACE.steps.at(-1).data; // { skip, staged, aheadUntil }
const BROAD = BROAD_TRACE.steps.at(-1).data; // { broad, staged, crossing }
const DIS = DISSENT_TRACE.steps.at(-1).data; // { skip, staged }

const round1 = (x) => Math.round(x * 10) / 10;
const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
const fmt2 = (v) => (Math.round(v * 100) / 100).toFixed(2);
const finalCum = (run) => run.rows.at(-1).cumYield;
const meanPrs = (run) => round1(run.rows.reduce((a, r) => a + r.prs, 0) / run.rows.length);

const COST_FIRST = BET.costs[0]; // 10 steward-days for loop one
const COST_LAST = BET.costs.at(-1); // 3.38 for loop twelve
const BET_FINAL = finalCum({ rows: BET.rows }); // 922.9
const BET_HALF = BET.rows[Math.floor(BET.rows.length / 2) - 1].cumYield;
const SECOND_HALF = round1(BET_FINAL - BET_HALF); // 773.6 of it lands late
const SKIP_PRS = meanPrs(SKIP.skip); // 22.2 — more activity, not less
const STAGED_PRS = meanPrs(SKIP.staged); // 21.6

// Stage arrivals for the bet chart's top ticks; events sharing a week merge
// ('4·5' at week 20), and the re-earn event renders as a check.
const STAGE_MARKS = (() => {
  const byWeek = new Map();
  for (const e of BET.events) {
    const m = e.label.match(/^stage (\d)/);
    const tag = m ? m[1] : '✓';
    byWeek.set(e.week, byWeek.has(e.week) ? `${byWeek.get(e.week)}·${tag}` : tag);
  }
  return [...byWeek.entries()].map(([week, tag]) => ({ week, tag }));
})();

/* ── Per-step focus: which part of each board the current caption reads ── */

const BET_FOCUS = [
  { band: [1, 4] }, // stage 0: instrumentation lands, nothing ships
  { band: [5, 13], cost: true }, // stages 1-2: read the cost panel
  { band: [14, 20] }, // stages 3-4: coordination, then a planner
  { marker: { week: 40, label: 'wk 40 · judge swap' } }, // stages 5-6
  {}, // the payoff: the whole board
];

const SKIP_FOCUS = [
  { band: [1, 14] }, // the head start: a quarter of simply winning
  { cost: true }, // the ghost: activity agrees, the cost curve does not
  { marker: { week: SKIP.aheadUntil, label: `wk ${SKIP.aheadUntil} · last week ahead` } },
];

const BROAD_MARKER = { week: BROAD.crossing, label: `wk ${BROAD.crossing} · the crossing` };
const BROAD_FOCUS = [
  { band: [1, BROAD.crossing] },
  { marker: BROAD_MARKER },
  { marker: BROAD_MARKER },
];

const DISSENT_FOCUS = [{ params: true }, {}, {}];

/* ── Charts (no physics here: rows in, lines out) ───────────────────────── */

function niceMax(v) {
  for (const s of [10, 20, 50, 100, 200, 500, 1000]) if (v <= s) return s;
  return Math.ceil(v / 500) * 500;
}

// Weekly series over the run window. series: [{ name, rows, key, color,
// dash?, width? }]. band shades a week range; marks tick stage arrivals
// along the top; marker drops one labeled vertical.
function WeekChart({ series, band, bandColor, marks, marker, summary, caption }) {
  const W = 420;
  const H = 215;
  const padL = 44;
  const padR = 14;
  const padT = 22;
  const padB = 30;
  const n = series[0].rows.length;
  let max = 1;
  for (const s of series) for (const r of s.rows) max = Math.max(max, r[s.key]);
  const yMax = niceMax(max);
  const x = (wk) => padL + ((wk - 1) / (n - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - v / yMax) * (H - padT - padB);
  const ticks = [1, Math.round(n / 4), Math.round(n / 2), Math.round((3 * n) / 4), n];
  return (
    <figure style={{ margin: 0, flex: '1 1 260px', minWidth: 0 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={summary}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {band ? (
          <rect
            x={x(band[0])}
            y={padT}
            width={Math.max(2, x(band[1]) - x(band[0]))}
            height={H - padT - padB}
            fill={bandColor ?? 'var(--amber-soft)'}
          />
        ) : null}
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
              fontSize="9"
              fill="var(--ink-faint)"
              fontFamily="var(--font-mono)"
            >
              {v}
            </text>
          </g>
        ))}
        {ticks.map((wk) => (
          <text
            key={wk}
            x={x(wk)}
            y={H - padB + 14}
            textAnchor="middle"
            fontSize="9"
            fill="var(--ink-faint)"
            fontFamily="var(--font-mono)"
          >
            wk {wk}
          </text>
        ))}
        {(marks ?? []).map((m) => (
          <g key={m.week}>
            <line
              x1={x(m.week)}
              x2={x(m.week)}
              y1={padT + 6}
              y2={H - padB}
              stroke="var(--line-soft)"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
            <text
              x={x(m.week)}
              y={padT - 3}
              textAnchor="middle"
              fontSize="8.5"
              fill="var(--ink-faint)"
              fontFamily="var(--font-mono)"
            >
              {m.tag}
            </text>
          </g>
        ))}
        {marker ? (
          <g>
            <line
              x1={x(marker.week)}
              x2={x(marker.week)}
              y1={padT}
              y2={H - padB}
              stroke="var(--amber)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <text
              x={x(marker.week) + (marker.week > n / 2 ? -5 : 5)}
              y={padT + 10}
              textAnchor={marker.week > n / 2 ? 'end' : 'start'}
              fontSize="9"
              fill="var(--amber)"
              fontFamily="var(--font-mono)"
            >
              {marker.label}
            </text>
          </g>
        ) : null}
        {series.map((s) => (
          <g key={s.name}>
            <polyline
              points={s.rows.map((r) => `${x(r.week)},${y(r[s.key])}`).join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth={s.width ?? 2}
              strokeDasharray={s.dash ? '5 4' : undefined}
            />
            <circle cx={x(s.rows.at(-1).week)} cy={y(s.rows.at(-1)[s.key])} r="3" fill={s.color} />
          </g>
        ))}
      </svg>
      <figcaption style={{ fontSize: '12.5px', color: 'var(--ink-2)', margin: '6px 0 0' }}>
        {caption}
      </figcaption>
    </figure>
  );
}

// Cost of the nth loop. series: [{ name, costs, color, dash? }].
function CostChart({ series, emphasized, summary, caption }) {
  const W = 300;
  const H = 215;
  const padL = 36;
  const padR = 12;
  const padT = 22;
  const padB = 30;
  const n = Math.max(...series.map((s) => s.costs.length));
  let max = 1;
  for (const s of series) for (const c of s.costs) max = Math.max(max, c);
  const yMax = niceMax(max);
  const x = (i) => padL + (n === 1 ? 0 : ((i - 1) / (n - 1)) * (W - padL - padR));
  const y = (v) => padT + (1 - v / yMax) * (H - padT - padB);
  const ticks = [1, 4, 8, 12].filter((t) => t <= n);
  return (
    <figure
      style={{
        margin: 0,
        flex: '1 1 200px',
        minWidth: 0,
        border: `1px solid ${emphasized ? 'var(--amber)' : 'transparent'}`,
        borderRadius: 3,
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={summary}
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
              fontSize="9"
              fill="var(--ink-faint)"
              fontFamily="var(--font-mono)"
            >
              {v}
            </text>
          </g>
        ))}
        {ticks.map((t) => (
          <text
            key={t}
            x={x(t)}
            y={H - padB + 14}
            textAnchor="middle"
            fontSize="9"
            fill="var(--ink-faint)"
            fontFamily="var(--font-mono)"
          >
            {t === 1 ? 'loop 1' : t}
          </text>
        ))}
        <text
          x={W - padR}
          y={padT - 3}
          textAnchor="end"
          fontSize="8.5"
          fill="var(--ink-faint)"
          fontFamily="var(--font-mono)"
        >
          steward-days to close loop n
        </text>
        {series.map((s) => (
          <g key={s.name}>
            <polyline
              points={s.costs.map((c, i) => `${x(i + 1)},${y(c)}`).join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeDasharray={s.dash ? '5 4' : undefined}
            />
            {s.costs.map((c, i) => (
              <circle key={i} cx={x(i + 1)} cy={y(c)} r="2" fill={s.color} />
            ))}
          </g>
        ))}
      </svg>
      <figcaption style={{ fontSize: '12.5px', color: 'var(--ink-2)', margin: '6px 0 0' }}>
        {caption}
      </figcaption>
    </figure>
  );
}

function Stat({ k, v, cls }) {
  return (
    <div className="mh-stat">
      <span className="k">{k}</span>
      <span className={cls ? `v ${cls}` : 'v'}>{v}</span>
    </div>
  );
}

function BoardHead({ no, title, children }) {
  return (
    <div style={{ margin: '20px 0 6px' }}>
      <span className="mh-kicker" style={{ display: 'block' }}>
        Run {no} · {title}
      </span>
      {children ? (
        <p style={{ margin: '4px 0 0', fontSize: '14.5px', color: 'var(--ink-2)' }}>{children}</p>
      ) : null}
    </div>
  );
}

/* ── The four boards ────────────────────────────────────────────────────── */

function BetBoard({ focus }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      <WeekChart
        series={[{ name: 'staged', rows: BET.rows, key: 'cumYield', color: 'var(--accent)' }]}
        band={focus.band}
        bandColor="var(--accent-soft)"
        marks={STAGE_MARKS}
        marker={focus.marker}
        summary={`Cumulative verified improvements over 48 weeks, reaching ${fmt(BET_FINAL)}; stage arrivals at weeks ${STAGE_MARKS.map((m) => m.week).join(', ')}.`}
        caption="Cumulative verified improvements, weeks 1-48. Top ticks are stage arrivals 0-6; ✓ is autonomy re-earned after the week-40 judge swap."
      />
      <CostChart
        series={[{ name: 'staged', costs: BET.costs, color: 'var(--accent)' }]}
        emphasized={focus.cost}
        summary={`Steward-days to close each loop, bending from ${fmt(COST_FIRST)} for loop one down to ${fmt(COST_LAST)} for loop twelve.`}
        caption={`The cost of the nth loop: ${fmt(COST_FIRST)} steward-days down to ${fmt(COST_LAST)}, because each new loop reuses the signals the terrain already carries.`}
      />
    </div>
  );
}

function SkipBoard({ metric, focus }) {
  const yieldView = metric === 'cumYield';
  return (
    <div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <WeekChart
          series={[
            {
              name: 'staged twin',
              rows: SKIP.staged.rows,
              key: metric,
              color: 'var(--accent)',
            },
            {
              name: 'stage 0 skipped',
              rows: SKIP.skip.rows,
              key: metric,
              color: 'var(--amber)',
              dash: true,
            },
          ]}
          band={focus.band}
          marker={focus.marker}
          summary={
            yieldView
              ? `Cumulative verified yield over 48 weeks: the skip run leads until week ${SKIP.aheadUntil}, then finishes at ${fmt(finalCum(SKIP.skip))} against the staged twin's ${fmt(finalCum(SKIP.staged))}.`
              : `PRs opened per week over 48 weeks: the two arms track each other, averaging ${fmt(SKIP_PRS)} for the skip run against ${fmt(STAGED_PRS)} for the staged twin.`
          }
          caption={
            yieldView
              ? 'Verified yield, cumulative, both arms on the same noise. Dashed amber skipped Stage 0; solid green staged it.'
              : 'Activity: PRs opened per week. The gauges agree — that is the ghost.'
          }
        />
        <CostChart
          series={[
            { name: 'staged twin', costs: SKIP.staged.costs, color: 'var(--accent)' },
            { name: 'stage 0 skipped', costs: SKIP.skip.costs, color: 'var(--amber)', dash: true },
          ]}
          emphasized={focus.cost}
          summary={`Steward-days per loop: the skip run's curve barely bends, ${fmt(SKIP.skip.costs[0])} down to ${fmt(SKIP.skip.costs.at(-1))}, against the staged twin's ${fmt(COST_FIRST)} down to ${fmt(COST_LAST)}.`}
          caption={`Without legible terrain the cost curve barely bends: ${fmt(SKIP.skip.costs[0])} to ${fmt(SKIP.skip.costs.at(-1))} steward-days, every loop hand-rolling its own parsing.`}
        />
      </div>
      <div className="mh-readout">
        <Stat k="PRs / week" v={`${fmt(SKIP_PRS)} vs ${fmt(STAGED_PRS)}`} cls="warn" />
        <Stat
          k="loop cost, 1st → 12th"
          v={`${fmt(SKIP.skip.costs[0])} → ${fmt(SKIP.skip.costs.at(-1))} vs ${fmt(COST_FIRST)} → ${fmt(COST_LAST)}`}
        />
        <Stat
          k="verified @ wk 48"
          v={`${fmt(finalCum(SKIP.skip))} vs ${fmt(finalCum(SKIP.staged))}`}
          cls="bad"
        />
      </div>
    </div>
  );
}

function BroadBoard({ focus }) {
  return (
    <div>
      <WeekChart
        series={[
          {
            name: 'a dozen simple loops',
            rows: BROAD.staged.rows,
            key: 'cumYield',
            color: 'var(--accent)',
          },
          {
            name: 'one sophisticated loop',
            rows: BROAD.broad.rows,
            key: 'cumYield',
            color: 'var(--amber)',
            dash: true,
          },
        ]}
        band={focus.band}
        marker={focus.marker}
        summary={`Cumulative verified yield: the replicating run crosses the sophisticated loop at week ${BROAD.crossing} and finishes at ${fmt(finalCum(BROAD.staged))} against ${fmt(finalCum(BROAD.broad))}.`}
        caption="Verified yield, cumulative. Dashed amber pours the build budget into one loop's depth; solid green replicates the template instead."
      />
      <div className="mh-readout">
        <Stat
          k="loops @ wk 48"
          v={`${BROAD.broad.rows.at(-1).loops} vs ${BROAD.staged.rows.at(-1).loops}`}
        />
        <Stat k="the crossing" v={`week ${BROAD.crossing}`} cls="warn" />
        <Stat
          k="verified @ wk 48"
          v={`${fmt(finalCum(BROAD.broad))} vs ${fmt(finalCum(BROAD.staged))}`}
          cls="bad"
        />
      </div>
    </div>
  );
}

function DissentBoard({ focus }) {
  return (
    <div>
      <div
        className="mh-readout"
        style={
          focus.params
            ? { outline: '1px solid var(--amber)', outlineOffset: 4, borderRadius: 3 }
            : undefined
        }
      >
        <Stat k="loops, capped" v="3" />
        <Stat k="conventions" v="0.9" />
        <Stat
          k="legibility by habit"
          v={`${fmt2(DIS.skip.legibility)} vs ${fmt2(DIS.staged.legibility)} staged`}
        />
        <Stat
          k="verified @ wk 40"
          v={`${fmt(finalCum(DIS.skip))} vs ${fmt(finalCum(DIS.staged))}`}
          cls="warn"
        />
      </div>
      <WeekChart
        series={[
          {
            name: 'staged',
            rows: DIS.staged.rows,
            key: 'cumYield',
            color: 'var(--accent)',
            width: 2.5,
          },
          {
            name: 'stage 0 skipped',
            rows: DIS.skip.rows,
            key: 'cumYield',
            color: 'var(--amber)',
            dash: true,
          },
        ]}
        summary={`Cumulative verified yield over 40 weeks: the skip run finishes at ${fmt(finalCum(DIS.skip))} against the staged twin's ${fmt(finalCum(DIS.staged))}; the lines overlap for the whole window.`}
        caption="Forty weeks, three loops, conventions at 0.9. The dashed amber skip run never falls behind the solid green staged twin; the lines sit on top of each other."
      />
    </div>
  );
}

/* ── Frame copy ─────────────────────────────────────────────────────────── */

const PAYOFF = (
  <>
    Kept in order, the bet pays twice: the cost of the nth loop bends from {fmt(COST_FIRST)}{' '}
    steward-days to {fmt(COST_LAST)} as each new loop reuses the terrain's signals, and{' '}
    {fmt(SECOND_HALF)} of the run's {fmt(BET_FINAL)} verified improvements land in the second half —
    compounding, not activity. Skip Stage 0 and the activity gauges still agree ({fmt(SKIP_PRS)} PRs
    a week against {fmt(STAGED_PRS)}) while verified yield finishes at {fmt(finalCum(SKIP.skip))}{' '}
    against {fmt(finalCum(SKIP.staged))}. Broaden Stage 1 and the dozen simple loops cross the one
    sophisticated loop at week {BROAD.crossing} and finish six times ahead. This curve is the
    author's bet, drawn{' '}
    <Badge
      layer="W"
      note="the §3.4 staging table is a principled proposal, not a measured law; §4.5 says so"
    />{' '}
    — a worked model of §3.4's staging table, not a measurement — and the dissent board below is the
    parameterization where it loses.
  </>
);

const NOTES = [
  "Bet register, all four boards: simulateStaging is a worked model of §3.4's staging table, not a system you can falsify here. One number — terrain legibility, 0.25 bare, 0.9 after four weeks of Stage 0 — sets how much of each new loop's build cost is reusable instrumentation and how much of its output survives verification.",
  'Constants are tuned for shape, not thresholds: 10 steward-days for loop one, reuse capped at 75%, coordination from three loops, a planner at six, twelve weeks of track record before auto-merge, the judge swap scripted at week 40.',
  'Paired arms share their noise. The rng draws exactly once per week in every run, so a twin differs from the bet only in structure, never in luck.',
  'The dissent parameterization (three loops, conventions at 0.9) was chosen so the bet loses, on purpose: strong conventions are accidental Stage 0, so Stage 0 has little left to buy.',
];

const CANNOT_SHOW =
  "Where any of these numbers fall on your platform. The engine draws shapes, not thresholds — no crossing week, cost curve, or stage boundary here predicts a real system's values. The field evidence behind the staging order is N=1 (one fleet, ~7 small repos, ~30 PRs), feasibility evidence rather than at-scale proof, and §4.5 lists the rest as open.";

/* ── The lab ────────────────────────────────────────────────────────────── */

export default function StagingBoard() {
  const [metric, setMetric] = useState('cumYield');

  return (
    <LabFrame
      tag="LAB 16·A — THE STAGING BOARD"
      register="bet"
      question="What does the staging order buy, what does breaking it cost — and where does the author's bet lose?"
      payoff={PAYOFF}
      notes={NOTES}
      cannotShow={CANNOT_SHOW}
      glass={GLASS}
    >
      <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '4px 0 0' }}>
        Four boards, one engine, one seed. Every run is recorded — bet-register figures are never
        free experiments — and on every chart the solid green line is the staged bet while the
        dashed amber line is the deviation under test. Paired runs share their weekly noise, so when
        two lines part, structure did it, not luck.
      </p>

      <div role="group" aria-label="Run 1: the bet, run straight">
        <BoardHead no={1} title="the bet, run straight">
          Stage 0 ships nothing for four weeks. Then watch the right-hand panel as the template
          replicates: loop one costs {fmt(COST_FIRST)} steward-days, loop twelve costs{' '}
          {fmt(COST_LAST)}, and the difference is reused instrumentation, not better agents.
        </BoardHead>
        <Walkthrough
          trace={BET_TRACE}
          renderStep={(step) => <BetBoard focus={BET_FOCUS[BET_TRACE.steps.indexOf(step)] ?? {}} />}
        />
      </div>

      <div role="group" aria-label="Run 2: skip Stage 0 — the ghost">
        <BoardHead no={2} title="skip Stage 0 — the ghost">
          Same noise, no instrumentation weeks, a month's head start. Flip the board to activity and
          the two arms agree; flip it back to verified yield and they do not. Smart agents on dumb
          terrain: high activity, low signal, no compounding.
        </BoardHead>
        <div className="mh-controls" role="group" aria-label="Skip-board reading">
          <span className="mh-kicker">Read the board as</span>
          <button
            type="button"
            className="mh-chip"
            aria-pressed={metric === 'cumYield'}
            onClick={() => setMetric('cumYield')}
          >
            verified yield
          </button>
          <button
            type="button"
            className="mh-chip"
            aria-pressed={metric === 'prs'}
            onClick={() => setMetric('prs')}
            aria-label="Read the board as activity: PRs opened per week"
          >
            activity · PRs / week
          </button>
        </div>
        <Walkthrough
          trace={SKIP_TRACE}
          renderStep={(step) => (
            <SkipBoard metric={metric} focus={SKIP_FOCUS[SKIP_TRACE.steps.indexOf(step)] ?? {}} />
          )}
        />
      </div>

      <div role="group" aria-label="Run 3: broaden Stage 1 — one deep loop">
        <BoardHead no={3} title="broaden Stage 1 — one deep loop">
          After loop one closes, every planning meeting proposes deepening it, and for the early
          weeks the chart agrees. Watch week {BROAD.crossing}: the dozen simple loops go past and
          never look back.
        </BoardHead>
        <Walkthrough
          trace={BROAD_TRACE}
          renderStep={(step) => (
            <BroadBoard focus={BROAD_FOCUS[BROAD_TRACE.steps.indexOf(step)] ?? {}} />
          )}
        />
      </div>

      <aside
        className="mh-card"
        style={{ borderTopColor: 'var(--amber)', marginTop: 22 }}
        aria-label="Model dissent: the parameterization where the bet fails"
      >
        <span className="mh-kicker" style={{ color: 'var(--amber)' }}>
          Model dissent · the parameterization where the bet fails
        </span>
        <p style={{ margin: '0 0 10px' }}>
          Three loops, a small team, and conventions strong enough that the terrain is already
          three-quarters legible before anyone instruments it: uniform commit shapes, one lockfile
          format, CI status everyone parses by habit. Run the same skip on the same noise and the
          punishment never arrives — ahead at week four, ahead at week twenty, still not behind at
          week forty. The model has freedom, and the author chose a point in it; this board is the
          other point.
        </p>
        <Walkthrough
          trace={DISSENT_TRACE}
          renderStep={(step) => (
            <DissentBoard focus={DISSENT_FOCUS[DISSENT_TRACE.steps.indexOf(step)] ?? {}} />
          )}
        />
        <p style={{ margin: '10px 0 0' }}>
          If your shop looks like this one — small N, strong conventions, signals everyone already
          reads — the bet may be wrong for you, and §4.5 flags staging as exactly this kind of
          proposal. The board exists so the curve above cannot out-argue the badge.
        </p>
      </aside>
    </LabFrame>
  );
}
