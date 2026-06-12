// SpecGapLab.jsx — LAB 10·A "The spec gap" (Ch 10 · Spec rot, covers §2.9,
// the planned death spiral). Mechanism register.
//
// Run 1 is big-bang integration on the engine's defaults. Hidden rework
// accumulates invisibly, and this board does not draw it: it draws only what
// has surfaced, which is the lesson. The reader predicts, then runs the one
// integration and takes the cliff. Run 2 re-runs the identical drift stream
// (the rng feeds only drift) with the structure changed — cadence, executable
// contracts, revision budget. The worker-effort slider is present in both
// runs and does nothing to the cliff, on purpose and per the engine.

import { useEffect, useMemo, useState } from 'react';
import { Badge, Commit, LabFrame, glassSlice } from '../components/kit.jsx';
import { usePrefersReducedMotion } from '../shared/usePrefersReducedMotion.js';
import { runSpecGap } from '../engine/spec.js';
import specSrc from '../engine/spec.js?raw';

const GLASS = glassSlice(specSrc, 'Work produced per week at effort 1', '};\n}');

const SEED = 11;
const SPEC_SIZE = 24;
const HORIZON = 16;
// Mirrors the engine's CLIFF_FRACTION (0.5) against the default spec size.
const CLIFF_THRESHOLD = SPEC_SIZE / 2;
const CADENCES = ['big-bang', 'weekly', 'continuous'];
const DRIFT_HINT = '≈3 assertions a week';

// The canonical run, computed once: defaults are big-bang, budget 1, effort 1.
// The cliff is effort-independent (pinned by tests/spec.test.js), so these
// numbers hold for every position of the effort slider.
const BASE = runSpecGap({ seed: SEED });
const CLIFF = BASE.cliff; // { week: 16, magnitude: 255 } at seed 11
const STALE_AT_15 = SPEC_SIZE - BASE.weeks[14].valid; // 23

const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/* ── Chart ──────────────────────────────────────────────────────────── */

function LegendItem({ color, dashed, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        aria-hidden="true"
        style={{ width: 16, borderTop: `3px ${dashed ? 'dashed' : 'solid'} ${color}` }}
      />
      <span>{label}</span>
    </span>
  );
}

function Legend({ showHidden }) {
  return (
    <div
      className="mono"
      style={{
        display: 'flex',
        gap: 14,
        flexWrap: 'wrap',
        fontSize: 11,
        color: 'var(--ink-2)',
        margin: '12px 0 0',
      }}
    >
      <LegendItem color="var(--blue)" label="WIP in flight" />
      <LegendItem color="var(--amber)" label="backlog being redone" />
      <LegendItem color="var(--red)" label="rework surfaced" />
      {showHidden ? (
        <LegendItem color="var(--red)" dashed label="hidden rework · reconstructed" />
      ) : null}
      <span style={{ color: 'var(--ink-faint)' }}>y: assertion-weeks</span>
    </div>
  );
}

function GapChart({ rows, upto, showHidden, marker, cliff, summary, caption }) {
  const W = 460;
  const H = 220;
  const padL = 42;
  const padR = 16;
  const padT = 18;
  const padB = 30;
  const n = rows.length;
  const shown = rows.slice(0, upto);
  let max = 10;
  for (const r of shown) {
    max = Math.max(max, r.wip, r.backlog, r.visibleRework, showHidden ? r.hiddenRework : 0);
  }
  const yMax = Math.ceil(max / 20) * 20;
  const x = (wk) => padL + ((wk - 1) / (n - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - v / yMax) * (H - padT - padB);
  const pts = (key) => shown.map((r) => `${x(r.week)},${y(r[key])}`).join(' ');
  const last = shown.at(-1);
  const hidPeak = showHidden
    ? shown.reduce((best, r) => (r.hiddenRework > best.hiddenRework ? r : best), shown[0])
    : null;
  const clampX = (px) => Math.min(Math.max(px, padL + 60), W - padR - 70);
  return (
    <figure style={{ margin: '10px 0 0' }}>
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
        {[1, 4, 8, 12, 16].map((wk) => (
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
        {marker ? (
          <g>
            <line
              x1={x(marker)}
              x2={x(marker)}
              y1={padT}
              y2={H - padB}
              stroke="var(--ink-faint)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text
              x={x(marker) - 4}
              y={padT - 6}
              textAnchor="end"
              fontSize="9"
              fill="var(--ink-faint)"
              fontFamily="var(--font-mono)"
            >
              the one integration
            </text>
          </g>
        ) : null}
        {showHidden ? (
          <polyline
            points={pts('hiddenRework')}
            fill="none"
            stroke="var(--red)"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            opacity="0.8"
          />
        ) : null}
        <polyline points={pts('wip')} fill="none" stroke="var(--blue)" strokeWidth="2" />
        <polyline points={pts('backlog')} fill="none" stroke="var(--amber)" strokeWidth="2" />
        <polyline points={pts('visibleRework')} fill="none" stroke="var(--red)" strokeWidth="2" />
        <circle cx={x(last.week)} cy={y(last.wip)} r="3" fill="var(--blue)" />
        <circle cx={x(last.week)} cy={y(last.backlog)} r="3" fill="var(--amber)" />
        <circle cx={x(last.week)} cy={y(last.visibleRework)} r="3" fill="var(--red)" />
        {hidPeak && hidPeak.hiddenRework > 0 ? (
          <text
            x={clampX(x(hidPeak.week))}
            y={y(hidPeak.hiddenRework) - 7}
            textAnchor="middle"
            fontSize="9"
            fill="var(--red)"
            fontFamily="var(--font-mono)"
            opacity="0.85"
          >
            hidden rework · reconstructed
          </text>
        ) : null}
        {cliff && upto >= cliff.week ? (
          <g>
            <circle
              cx={x(cliff.week)}
              cy={y(rows[cliff.week - 1].visibleRework)}
              r="4.5"
              fill="none"
              stroke="var(--red)"
              strokeWidth="1.5"
            />
            <text
              x={x(cliff.week) - 9}
              y={y(rows[cliff.week - 1].visibleRework) + 13}
              textAnchor="end"
              fontSize="9.5"
              fill="var(--red)"
              fontFamily="var(--font-mono)"
            >
              +{fmt(cliff.magnitude)} in one reveal
            </text>
          </g>
        ) : null}
      </svg>
      <figcaption style={{ fontSize: '12.5px', color: 'var(--ink-2)', margin: '6px 0 0' }}>
        {caption}
      </figcaption>
    </figure>
  );
}

/* ── Argued feedback ────────────────────────────────────────────────── */

const COMMIT_OPTIONS = [
  { id: 'nothing', label: 'Close to nothing — fifteen green weeks' },
  { id: 'drift', label: `About what drifted — call it ~${STALE_AT_15} assertion-weeks` },
  { id: 'spec', label: 'More rework than the whole spec is big' },
  { id: 'board', label: 'This board cannot say' },
];

const COMMIT_FEEDBACK = {
  nothing:
    `Green measured silence, not health. Under big-bang cadence nothing integrates until ` +
    `week 16, so "rework surfaced: 0" was guaranteed the day the schedule was drawn — the ` +
    `gauge never had a connection to the gap. Meanwhile reality drifted ${DRIFT_HINT} against ` +
    `a revision budget of 1, and the team kept building on whatever the spec still claimed. ` +
    `Run the integration; one bar on this board was never going to stay at zero.`,
  drift:
    `Right mechanism, one multiplier short. Drift opened the gap — ${STALE_AT_15} of ` +
    `${SPEC_SIZE} assertions out of contact by now — but a stale assertion is not paid for ` +
    `once. Hidden, it corrupts every following week's work until an integration reveals it, ` +
    `so the bill is the area under the staleness curve, not its height. Run the integration ` +
    `and compare.`,
  spec:
    `Larger than the spec itself is the engine's answer too, and the reason matters more than ` +
    `the number. Each hidden stale assertion corrupted every week built on it — sixteen weeks ` +
    `of exposure for the earliest — so detection latency multiplied drift roughly tenfold. ` +
    `The work was fine. The workers were fine. The structure hid the gap until hiding was no ` +
    `longer possible.`,
  board:
    `The sharpest reading of the four. This board draws only what has surfaced, and under ` +
    `big-bang cadence nothing surfaces before week 16, so the one number that mattered was ` +
    `undrawable here by design. The chart's limitation is the structure's limitation — that ` +
    `is the finding. Run the integration and see what it was withholding.`,
};

function verdictFor(run, cadence, contracts, budget) {
  const final = run.weeks.at(-1);
  const total = final.visibleRework;
  const maxBl = Math.max(...run.weeks.map((r) => r.backlog));
  const contact = `${final.valid} of ${SPEC_SIZE}`;
  if (run.cliff) {
    const head =
      `Still a cliff: week ${run.cliff.week}, ${fmt(run.cliff.magnitude)} assertion-weeks in ` +
      `one reveal — over the threshold of ${CLIFF_THRESHOLD}.`;
    if (final.valid === SPEC_SIZE) {
      return (
        `${head} The funded budget keeps the spec in contact (${contact}), but whatever does ` +
        `slip through a given week still hides until the single integration and lands as one ` +
        `batch. Budget cannot touch detection latency; cadence and contracts can.`
      );
    }
    return (
      `${head} Under big-bang cadence nothing surfaces until the one integration, so each ` +
      `stale assertion keeps corrupting every week built on it. Latency multiplies drift, and ` +
      `no throughput knob reaches latency.`
    );
  }
  if (total === 0) {
    return (
      `No cliff, and no rework at all. With ${budget} revisions a week against drift of ` +
      `${DRIFT_HINT}, the spec team closes every gap before work is built on it: ` +
      `spec-update-rate ≥ reality-change-rate, so the spiral condition never holds. Notice ` +
      `what you funded — a budget, not a hero.`
    );
  }
  const detect = contracts
    ? 'executable contracts fail the week work touches a stale assertion, so detection latency is zero'
    : cadence === 'weekly'
      ? 'weekly integration caps exposure at one week per stale assertion'
      : cadence === 'continuous'
        ? 'continuous integration cuts the exposure window to half a week'
        : 'so little goes stale that even the one big reveal stays under the cliff threshold';
  if (final.valid < SPEC_SIZE) {
    return (
      `No cliff: ${detect}. ${fmt(total)} assertion-weeks surfaced in redoable pieces (max ` +
      `backlog ${fmt(maxBl)}). But read the spec-contact gauge: ${contact} at week 16. Drift ` +
      `(${DRIFT_HINT}) still outruns the revision budget (${budget} a week), so the spiral ` +
      `condition still holds — structure bounded its damage without ending its cause. The ` +
      `budget slider ends it.`
    );
  }
  return (
    `No cliff, and the spec holds contact: ${contact} at week 16, ${fmt(total)} ` +
    `assertion-weeks of rework all run (max backlog ${fmt(maxBl)}). Detection: ${detect}. ` +
    `Condition: budget ${budget} ≥ drift ${DRIFT_HINT}, so the gap closes faster than it ` +
    `opens. Both halves are structural, and the effort slider had nothing to do with either.`
  );
}

/* ── Frame copy ─────────────────────────────────────────────────────── */

const PAYOFF = (
  <>
    Fifteen weeks of green board, then one integration surfaces {fmt(CLIFF.magnitude)}{' '}
    assertion-weeks of rework against a {SPEC_SIZE}-assertion spec — better than ten times the
    spec's size, because a stale assertion corrupts every week built on it until something
    integrates: detection latency multiplies drift. Worker effort moves the WIP line and the
    burn-down rate and nothing about the cliff{' '}
    <Badge
      layer="W"
      note="modeling choice: heroics move work that can be seen; they cannot reveal hidden rework or slow the drift"
    />
    . Rerun the same drift with the structure changed — shorter cadence, executable contracts, a
    funded revision budget — and the cliff never forms. The planned death spiral is one inequality,
    the spec updating slower than reality changes, and every remedy that works edits the structure,
    not the people.
  </>
);

const NOTES = [
  'Tuned constants: the team builds 4 assertion-weeks of work per week and redoes 3 of visible backlog per week; effort multiplies both, and only both. That heroics cannot reveal hidden rework or slow drift is a Ⓦ modeling choice, not a finding.',
  `Reality drifts at 1.5 events per week, each invalidating 1–3 assertions (${DRIFT_HINT}, 1–6 on a given week). The rng feeds only the drift stream, so run 2 faces the same reality as run 1 at the same seed (11).`,
  `The cliff threshold — one reveal ≥ half the spec, ${CLIFF_THRESHOLD} assertion-weeks — is an authored rendering choice marking "one event dominates the chart," not a real-world constant.`,
  'Exposure is stylized: a hidden stale assertion costs one assertion-week of rework per week (half under continuous integration); executable contracts set the window to zero and cost nothing here, though writing them is not free at work.',
  'The handbook mentions worker quality and effort; the engine folds them into one heroics multiplier because they enter this model identically.',
  'Rework is counted in assertion-weeks, not priced: no payroll, no morale, no attrition. The cliff at work costs more than its area.',
];

const CANNOT_SHOW =
  "Which of your own spec's assertions is stale right now. Detection is the whole problem, and " +
  "the model grants itself a narrator's view it denies the board — at work, nobody holds the " +
  'dashed line. It also cannot show partial staleness (an assertion is valid or stale, nothing ' +
  'between), drift that responds to what ships, or the authoring cost of executable contracts. ' +
  "It draws the spiral's shape, not your system's thresholds.";

/* ── The lab ────────────────────────────────────────────────────────── */

export default function SpecGapLab() {
  // Run 1 — the canonical big-bang run, stepped. At rest: week 15, board green.
  const [week, setWeek] = useState(HORIZON - 1);
  const [effort, setEffort] = useState(1);
  const [revealed, setRevealed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const reduced = usePrefersReducedMotion();

  // Run 2 — same seed, structural knobs. Starts as run 1 so the reader
  // dismantles the cliff rather than finding it pre-dismantled.
  const [cadence, setCadence] = useState('big-bang');
  const [contracts, setContracts] = useState(false);
  const [budget, setBudget] = useState(1);
  const [effort2, setEffort2] = useState(1);

  const run1 = useMemo(() => runSpecGap({ seed: SEED, effort }), [effort]);
  const run2 = useMemo(
    () => runSpecGap({ seed: SEED, cadence, contracts, revisionBudget: budget, effort: effort2 }),
    [cadence, contracts, budget, effort2],
  );

  const limit = revealed ? HORIZON : HORIZON - 1;

  useEffect(() => {
    if (!playing || reduced) return undefined;
    if (week >= limit) {
      setPlaying(false);
      return undefined;
    }
    const t = setTimeout(() => setWeek((w) => Math.min(limit, w + 1)), 700);
    return () => clearTimeout(t);
  }, [playing, reduced, week, limit]);

  const cur = run1.weeks[week - 1];

  const runIntegration = () => {
    setPlaying(false);
    setRevealed(true);
    setWeek(HORIZON);
  };

  const togglePlay = () => {
    if (!playing && week >= limit) setWeek(1);
    setPlaying((p) => !p);
  };

  const cap1 = !revealed
    ? `Week ${week} of 16. The board draws only what has surfaced; the single integration sits ` +
      `on the calendar at week 16, and nothing else about the gap is drawable here.`
    : week === HORIZON
      ? `Week 16: the integration ran and ${fmt(cur.visibleRework)} assertion-weeks surfaced in ` +
        `one reveal. The dashed line is the hidden rework, reconstructed after the fact — the ` +
        `board could not have drawn it live.`
      : `Week ${week}, replayed with hindsight. The dashed line is what the board was not ` +
        `drawing at the time.`;

  const sum1 =
    `Spec-gap status board, week ${week} of 16: work in flight ${fmt(cur.wip)} ` +
    `assertion-weeks, surfaced rework ${fmt(cur.visibleRework)}, backlog ${fmt(cur.backlog)}.` +
    (revealed
      ? ` After the reveal: a cliff of ${fmt(CLIFF.magnitude)} assertion-weeks at week ${CLIFF.week}.`
      : ' No rework has surfaced; hidden state is not drawn.');

  const final2 = run2.weeks.at(-1);
  const maxBl2 = Math.max(...run2.weeks.map((r) => r.backlog));
  const hid2Peak = Math.max(...run2.weeks.map((r) => r.hiddenRework));
  const verdict2 = verdictFor(run2, cadence, contracts, budget);

  const cap2 = run2.cliff
    ? `Same drift stream as run 1. One reveal of ${fmt(run2.cliff.magnitude)} assertion-weeks ` +
      `still dominates week ${run2.cliff.week}.`
    : `Same drift stream as run 1. No single reveal crosses the cliff threshold ` +
      `(${CLIFF_THRESHOLD} assertion-weeks); what surfaces gets redone while it is small. ` +
      `Watch the WIP line too — nothing waits for the whole.`;

  const sum2 =
    `Run 2 over the same 16 weeks: ${run2.cliff ? `a cliff of ${fmt(run2.cliff.magnitude)} assertion-weeks at week ${run2.cliff.week}` : 'no cliff'}, ` +
    `${fmt(final2.visibleRework)} assertion-weeks of rework surfaced in total, max backlog ` +
    `${fmt(maxBl2)}, spec contact ${final2.valid} of ${SPEC_SIZE} at week 16.`;

  return (
    <LabFrame
      tag="LAB 10·A — THE SPEC GAP"
      register="mechanism"
      question={
        `A ${SPEC_SIZE}-assertion spec, reality drifting underneath it, one integration ` +
        `scheduled at week 16. The board has been green for fifteen weeks — how much rework ` +
        `is waiting, and could this board have told you?`
      }
      payoff={PAYOFF}
      notes={NOTES}
      cannotShow={CANNOT_SHOW}
      glass={GLASS}
    >
      <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '0 0 4px' }}>
        The terms: a {SPEC_SIZE}-assertion spec; drift invalidating {DRIFT_HINT}; a spec team with
        budget to revise 1 a week; everyone building against whatever the spec still claims; one
        integration, week 16. The board below draws what has surfaced. Nothing else.
      </p>

      <Legend showHidden={revealed} />
      <GapChart
        rows={run1.weeks}
        upto={week}
        showHidden={revealed}
        marker={HORIZON}
        cliff={revealed ? CLIFF : null}
        summary={sum1}
        caption={cap1}
      />

      <div className="mh-readout" role="group" aria-label="Board readouts">
        <div className="mh-stat">
          <span className="k">Week</span>
          <span className="v">{week} / 16</span>
        </div>
        <div className="mh-stat">
          <span className="k">WIP in flight</span>
          <span className="v">{fmt(cur.wip)}</span>
        </div>
        <div className="mh-stat">
          <span className="k">Rework surfaced</span>
          <span className={cur.visibleRework === 0 ? 'v good' : 'v bad'}>
            {fmt(cur.visibleRework)}
          </span>
        </div>
        <div className="mh-stat">
          <span className="k">Backlog</span>
          <span className={cur.backlog === 0 ? 'v good' : 'v warn'}>{fmt(cur.backlog)}</span>
        </div>
        {revealed ? (
          <div className="mh-stat">
            <span className="k">The cliff · at every effort</span>
            <span className="v bad">
              wk {CLIFF.week} · {fmt(CLIFF.magnitude)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mh-controls" style={{ alignItems: 'flex-end' }}>
        <button
          type="button"
          className="mh-btn"
          onClick={() => setWeek((w) => Math.max(1, w - 1))}
          disabled={week <= 1}
          aria-label="Previous week"
        >
          Prev week
        </button>
        <button
          type="button"
          className="mh-btn"
          onClick={() => setWeek((w) => Math.min(limit, w + 1))}
          disabled={week >= limit}
          aria-label={
            !revealed && week === HORIZON - 1
              ? 'Next week — locked until you predict below'
              : 'Next week'
          }
        >
          Next week
        </button>
        {!reduced ? (
          <button
            type="button"
            className="mh-btn"
            onClick={togglePlay}
            aria-pressed={playing}
            aria-label={playing ? 'Pause the weeks' : 'Play the weeks'}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
        ) : null}
        <div className="mh-slider" style={{ width: 170 }}>
          <label htmlFor="sg-effort">
            <span>worker effort</span>
            <span>×{effort}</span>
          </label>
          <input
            id="sg-effort"
            type="range"
            min="1"
            max="5"
            value={effort}
            onChange={(e) => setEffort(Number(e.target.value))}
            aria-valuetext={`worker effort times ${effort}`}
          />
        </div>
      </div>
      <p
        className="mono"
        aria-live="polite"
        style={{ fontSize: '11px', color: 'var(--ink-faint)', margin: '0 0 4px' }}
      >
        {effort === 1
          ? 'worker effort is the only people-knob on this bench.'
          : revealed
            ? `effort ×${effort}: WIP climbs faster, the backlog burns faster — the cliff is ` +
              `still ${fmt(CLIFF.magnitude)} assertion-weeks at week ${CLIFF.week}.`
            : `effort ×${effort}: the WIP line steepens. Nothing else on the board moves.`}
      </p>
      {!revealed && week === HORIZON - 1 ? (
        <p className="mono" style={{ fontSize: '11px', color: 'var(--amber)', margin: '0 0 4px' }}>
          week 16 is gated: predict below, then run the integration.
        </p>
      ) : null}

      <Commit
        prompt={
          `The board at week 15: ${fmt(run1.weeks[HORIZON - 2].wip)} assertion-weeks in ` +
          `flight, zero rework surfaced, zero backlog. The single integration runs next week. ` +
          `What does it surface?`
        }
        options={COMMIT_OPTIONS}
      >
        {(picked) => (
          <>
            <p style={{ marginTop: 0 }}>{COMMIT_FEEDBACK[picked]}</p>
            <div className="mh-controls" style={{ margin: '10px 0 0' }}>
              <button
                type="button"
                className="mh-btn mh-btn-danger"
                onClick={runIntegration}
                disabled={revealed}
                aria-label="Run the single integration, week 16"
              >
                Run the integration — week 16
              </button>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>
                watch the y-axis
              </span>
            </div>
          </>
        )}
      </Commit>

      {revealed ? (
        <>
          <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '12px 0' }}>
            {fmt(CLIFF.magnitude)} assertion-weeks, against a spec {SPEC_SIZE} assertions big. The
            drift you could have guessed (~{STALE_AT_15} assertions out of contact); the multiplier
            you could not see: each one corrupted every week built on it until the reveal, sixteen
            weeks of exposure for the earliest. Now try the knob every status meeting reaches for —
            drag worker effort up and re-read the board. WIP steepens, the backlog burns faster, and
            the cliff readout holds at wk {CLIFF.week} · {fmt(CLIFF.magnitude)}. Heroics move work
            that can be seen; this failure never was.
          </p>

          <div style={{ borderTop: '1px solid var(--line-soft)', marginTop: 16, paddingTop: 12 }}>
            <span
              className="mh-kicker"
              style={{ display: 'block', color: 'var(--accent-ink)', marginBottom: 6 }}
            >
              Run 2 · same reality, different structure
            </span>
            <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '0 0 10px' }}>
              The drift stream is pinned to the seed: the same assertions go stale in the same
              weeks. None of these knobs touches the people; all of them edit structure. Kill the
              cliff, then read the spec-contact gauge to see whether you ended the spiral or only
              its damage.
            </p>
            <div className="mh-controls" style={{ alignItems: 'flex-end' }}>
              <div role="group" aria-label="Integration cadence">
                <span className="mh-kicker" style={{ display: 'block', marginBottom: 4 }}>
                  integration cadence
                </span>
                <div className="mh-chipset">
                  {CADENCES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="mh-chip"
                      aria-pressed={cadence === c}
                      onClick={() => setCadence(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="mh-kicker" style={{ display: 'block', marginBottom: 4 }}>
                  contracts
                </span>
                <button
                  type="button"
                  className="mh-chip"
                  aria-pressed={contracts}
                  onClick={() => setContracts((v) => !v)}
                  aria-label={
                    contracts
                      ? 'Executable contracts on: rework surfaces the week it happens. Press to switch back to prose specs.'
                      : 'Prose specs: rework hides until integration. Press to make the contracts executable.'
                  }
                >
                  {contracts ? 'executable — fail on first touch' : 'prose — fail at integration'}
                </button>
              </div>
              <div className="mh-slider" style={{ width: 190 }}>
                <label htmlFor="sg-budget">
                  <span>revision budget</span>
                  <span>{budget} / week · drift ≈ 3</span>
                </label>
                <input
                  id="sg-budget"
                  type="range"
                  min="1"
                  max="8"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  aria-valuetext={`${budget} spec revisions per week, against drift of about 3`}
                />
              </div>
              <div className="mh-slider" style={{ width: 150 }}>
                <label htmlFor="sg-effort2">
                  <span>worker effort</span>
                  <span>×{effort2}</span>
                </label>
                <input
                  id="sg-effort2"
                  type="range"
                  min="1"
                  max="5"
                  value={effort2}
                  onChange={(e) => setEffort2(Number(e.target.value))}
                  aria-valuetext={`worker effort times ${effort2}`}
                />
              </div>
            </div>
            {effort2 > 1 ? (
              <p
                className="mono"
                style={{ fontSize: '11px', color: 'var(--ink-faint)', margin: '0 0 4px' }}
              >
                {run2.cliff
                  ? `effort ×${effort2}: the cliff did not move. The three knobs to its left are the ones that can.`
                  : `effort ×${effort2}: WIP and burn-down only — the no-cliff result came from structure.`}
              </p>
            ) : null}

            <Legend showHidden={hid2Peak > 0} />
            <GapChart
              rows={run2.weeks}
              upto={HORIZON}
              showHidden={hid2Peak > 0}
              marker={cadence === 'big-bang' ? HORIZON : null}
              cliff={run2.cliff}
              summary={sum2}
              caption={cap2}
            />

            <div className="mh-readout" role="group" aria-label="Run 2 readouts">
              <div className="mh-stat">
                <span className="k">Cliff</span>
                <span className={run2.cliff ? 'v bad' : 'v good'}>
                  {run2.cliff ? `wk ${run2.cliff.week} · ${fmt(run2.cliff.magnitude)}` : 'none'}
                </span>
              </div>
              <div className="mh-stat">
                <span className="k">Rework surfaced</span>
                <span className="v">{fmt(final2.visibleRework)}</span>
              </div>
              <div className="mh-stat">
                <span className="k">Max backlog</span>
                <span className="v">{fmt(maxBl2)}</span>
              </div>
              <div className="mh-stat">
                <span className="k">Spec contact · wk 16</span>
                <span
                  className={
                    final2.valid === SPEC_SIZE ? 'v good' : final2.valid >= 12 ? 'v warn' : 'v bad'
                  }
                >
                  {final2.valid} / {SPEC_SIZE}
                </span>
              </div>
            </div>

            <div className="mh-feedback" aria-live="polite" style={{ marginTop: 10 }}>
              {verdict2}
            </div>
            <p
              className="mono"
              style={{ fontSize: '11px', color: 'var(--ink-faint)', margin: '8px 0 0' }}
            >
              sandbox · all four knobs stay free · big-bang + budget 1 reproduces run 1 · the drift
              never changes
            </p>
          </div>
        </>
      ) : null}
    </LabFrame>
  );
}
