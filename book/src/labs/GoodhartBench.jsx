// GoodhartBench.jsx — LAB 20·A "The Goodhart bench" (Ch 20 · Measurement, covers §3.8).
//
// Mechanism register: every frame is the goodhart engine's real dynamics,
// re-simulated from a pinned seed. One platform, one gaming pressure, two
// instrument panels. Task 1 charts a single target (merged PRs per week) and
// takes a committed prediction about the line the panel does not carry before
// the bench draws it. Task 2 applies the §3.8 triangulation rule — two
// independent metrics that gaming velocity must damage — and the same
// pressure becomes a visible, answerable cost. Task 3 is the deliberately
// non-instrumented panel: four gauges with no number, assigned to humans.
//
// Every control is terrain: what the panel carries, where the playhead sits,
// which seed rolls the wobble. Nothing commands the fleet. Moving a control
// re-simulates all sixteen weeks from week 1, so the reader compares panels,
// never steers one mid-run. Every number quoted in the copy is computed below
// from the same engine the tiles render; the prose cannot go stale.

import { useEffect, useMemo, useState } from 'react';
import { Badge, Commit, LabFrame, glassSlice } from '../components/kit.jsx';
import { usePrefersReducedMotion } from '../shared/usePrefersReducedMotion.js';
import { simulateMetricGaming } from '../engine/scenarios/goodhart.js';
import goodhartSrc from '../engine/scenarios/goodhart.js?raw';

/* ── The canonical runs, computed once (the copy quotes these) ──────────── */

const SEED = 20;
const SINGLE = simulateMetricGaming(SEED, { triangulated: false });
const TRI = simulateMetricGaming(SEED, { triangulated: true });
const WEEKS = SINGLE.weeks.length;

const fmtV = (v) => v.toFixed(1);
const fmtPct = (v) => `${(v * 100).toFixed(1)}%`;
const fmtA = (v) => v.toFixed(2);

const S_FIRST = SINGLE.weeks[0];
const S_LAST = SINGLE.weeks.at(-1);
const T_LAST = TRI.weeks.at(-1);
const DET = TRI.detection; // week 5 on every seed: the jitter is smaller than the margin
const DET_ROW = TRI.weeks[DET.week - 1];
const PEAK = Math.max(...TRI.weeks.map((w) => w.velocity));

const V0 = fmtV(S_FIRST.velocity); // 23.9
const V1 = fmtV(S_LAST.velocity); // 39.8
const CLIMB_PCT = Math.round((S_LAST.velocity / S_FIRST.velocity - 1) * 100); // 66
const A0 = fmtA(S_FIRST.sampledOutcome); // 0.81
const A1 = fmtA(S_LAST.sampledOutcome); // 0.53
const CF1 = fmtPct(S_LAST.changeFailure); // 12.8%
const RB1 = fmtPct(S_LAST.rollback); // 9.1%
const DET_V = fmtV(DET_ROW.velocity); // 31.1
const DET_CF = fmtPct(DET_ROW.changeFailure); // 8.3%
const PEAK_S = fmtV(PEAK); // 31.1
const TV1 = fmtV(T_LAST.velocity); // 22.1
const TA1 = fmtA(T_LAST.sampledOutcome); // 0.83

/* ── The glass ──────────────────────────────────────────────────────────── */

const GLASS = [
  glassSlice(goodhartSrc, 'const WEEKS', 'PRESSURE_DECAY = 0.5'),
  glassSlice(goodhartSrc, 'export function simulateMetricGaming', '\n}'),
].join('\n\n// ── and ──\n\n');

/* ── Instrument tiles ───────────────────────────────────────────────────── */

const TILE_DEFS = [
  {
    key: 'velocity',
    label: 'merged PRs / week',
    color: 'var(--accent)',
    yMax: 42,
    fmt: fmtV,
  },
  {
    key: 'changeFailure',
    label: 'change-failure rate',
    color: 'var(--amber)',
    yMax: 0.15,
    fmt: fmtPct,
  },
  {
    key: 'rollback',
    label: 'rollback rate',
    color: 'var(--blue)',
    yMax: 0.15,
    fmt: fmtPct,
  },
  {
    key: 'sampledOutcome',
    label: 'deep-review agreement · 10% sample',
    color: 'var(--red)',
    yMax: 1,
    fmt: fmtA,
    dashed: true,
  },
  {
    key: 'pressure',
    label: 'gaming pressure',
    color: 'var(--ink-faint)',
    yMax: 1,
    fmt: fmtA,
    dashed: true,
  },
];

function Spark({ series, idx, color, yMax, dashed, markerWeek }) {
  const W = 150;
  const H = 42;
  const n = series.length;
  const x = (i) => (i / (n - 1)) * W;
  const y = (v) => H - 4 - Math.min(1, v / yMax) * (H - 8);
  const points = series.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <line x1="0" x2={W} y1={y(0)} y2={y(0)} stroke="var(--line-soft)" strokeWidth="1" />
      {markerWeek ? (
        <line
          x1={x(markerWeek - 1)}
          x2={x(markerWeek - 1)}
          y1="2"
          y2={H - 2}
          stroke="var(--amber)"
          strokeWidth="1.5"
        />
      ) : null}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray={dashed ? '4 3' : undefined}
      />
      <line x1={x(idx)} x2={x(idx)} y1="2" y2={H - 2} stroke="var(--ink-faint)" strokeWidth="1" />
      <circle cx={x(idx)} cy={y(series[idx])} r="2.5" fill={color} />
    </svg>
  );
}

function MetricTile({ def, charted, status, statusColor, series, idx, markerWeek }) {
  const value = charted ? def.fmt(series[idx]) : '— —';
  const summary = charted
    ? `${def.label}: ${def.fmt(series[idx])} at week ${idx + 1} of ${WEEKS}; ` +
      `series runs ${def.fmt(series[0])} to ${def.fmt(series.at(-1))}. ${status}.`
    : `${def.label}: measured weekly but not charted; no line on the panel.`;
  return (
    <div
      role="img"
      aria-label={summary}
      style={{
        border: '1px solid var(--line-soft)',
        borderTop: charted ? `2px solid ${def.color}` : '1px solid var(--line-soft)',
        borderRadius: 4,
        background: 'var(--paper)',
        padding: '8px 10px 7px',
        display: 'grid',
        gap: 3,
      }}
    >
      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
        {def.label}
      </span>
      <span
        className="mono"
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: charted ? 'var(--ink)' : 'var(--ink-faint)',
        }}
      >
        {value}
      </span>
      {charted ? (
        <Spark
          series={series}
          idx={idx}
          color={def.color}
          yMax={def.yMax}
          dashed={def.dashed}
          markerWeek={markerWeek}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{
            height: 42,
            border: '1px dashed var(--line)',
            borderRadius: 3,
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--ink-faint)',
          }}
        >
          no line
        </div>
      )}
      <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.06em', color: statusColor }}>
        {status}
      </span>
    </div>
  );
}

/* ── The reserved-for-judgment gauges (deliberately non-instrumented) ───── */

const GAUGE_TICKS = [0, 1, 2, 3, 4].map((k) => {
  const a = Math.PI * (1 - k / 4);
  return {
    x1: 60 + Math.cos(a) * 38,
    y1: 58 - Math.sin(a) * 38,
    x2: 60 + Math.cos(a) * 46,
    y2: 58 - Math.sin(a) * 46,
  };
});

const GAUGES = [
  {
    id: 'abstractions',
    label: 'quality of abstractions',
    argument: (
      <>
        The proxy you'd reach for: module count, file length, a complexity score. Target any of them
        and you have rebuilt the bench above — a fleet hits the number by splitting files and
        extracting interfaces nothing calls, while the thing you cared about moves the way agreement
        just did: down, off-panel. The handbook's call is flat: assign it to a human who reads the
        code, and trust the judgment.
      </>
    ),
  },
  {
    id: 'direction',
    label: 'coherence of direction',
    argument: (
      <>
        The proxy: roadmap adherence, epic burn-down. This one games without the fleet's help —
        re-scope until whatever shipped was the plan, and adherence reads 100% while the system
        walks in circles. No triangulating line exists, because the metric's owner holds the eraser.
        Where the whole thing is going is a judgment, and a human has to hold it.
      </>
    ),
  },
  {
    id: 'taste',
    label: 'taste of the output',
    argument: (
      <>
        The proxy: sentiment scores, style-pass rates, an LLM judge. A judge model is one more
        metric with a seam — tune outputs against it and you get judge-shaped prose. Chapter 19
        swapped a judge for a strictly better one and every trust grant reset for less.
        Sophisticated proxies do not escape the law; they postpone it. Taste stays with a human
        palate.
      </>
    ),
  },
  {
    id: 'norms',
    label: 'health of the norms',
    argument: (
      <>
        The proxy: escalation counts, review-tone classifiers. The gamed version of a healthy
        culture is silence — escalations to zero, flags to zero — and Chapter 13 already taught you
        to read that gauge: silence is not health. A counter cannot tell a quiet channel from a dead
        one. A steward can.
      </>
    ),
  },
];

function JudgmentGauge({ gauge, open, onToggle }) {
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${gauge.label} — why this gauge has no number`}
        onClick={onToggle}
        style={{
          width: '100%',
          border: open ? '1px solid var(--accent)' : '1px solid var(--line-soft)',
          borderRadius: 4,
          background: 'var(--paper)',
          padding: '12px 10px 9px',
          display: 'grid',
          justifyItems: 'center',
          gap: 4,
          cursor: 'pointer',
          color: 'var(--ink-2)',
        }}
      >
        <svg viewBox="0 0 120 66" aria-hidden="true" style={{ width: 96, height: 'auto' }}>
          <path
            d="M 14 58 A 46 46 0 0 1 106 58"
            fill="none"
            stroke="var(--line)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {GAUGE_TICKS.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="var(--ink-faint)"
              strokeWidth="1.5"
            />
          ))}
          <circle cx="60" cy="58" r="3" fill="var(--ink-faint)" />
        </svg>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, color: 'var(--ink)' }}>
          {gauge.label}
        </span>
        <span
          className="mono"
          style={{ fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--amber)' }}
        >
          NO NUMBER · ASSIGNED TO HUMANS
        </span>
      </button>
      {open ? (
        <div className="mh-feedback" style={{ fontSize: '13.5px' }}>
          {gauge.argument}
        </div>
      ) : null}
    </div>
  );
}

/* ── Tasks, commit prompts, and argued feedback ─────────────────────────── */

const TASKS = [
  {
    id: 'target',
    chip: '1 · the target',
    scene:
      `Week 1: merged PRs per week reads ${V0} and goes on the panel as the target — review ` +
      'goals, agent rankings, the weekly report all read it. A 10% sample of merged work still ' +
      'gets deep human review; the score lands in a spreadsheet nobody charts.',
  },
  {
    id: 'triangulate',
    chip: '2 · triangulate',
    scene:
      'Same platform, same seed, same appetite for the seam. The §3.8 rule is on the bench: if ' +
      'a metric will be used as a target, add at least two independent metrics that gaming it ' +
      'would harm. Change-failure and rollback qualify — work shaped to feed the count ships ' +
      'junk, and junk fails in production.',
  },
  {
    id: 'reserve',
    chip: '3 · reserved for judgment',
    scene:
      'Everything above got a number. Four questions on this platform never will — the handbook ' +
      'reserves them: the quality of abstractions, the coherence of direction, the taste of the ' +
      'output, the health of the norms. Press a gauge to see what a number would cost.',
  },
];

const COMMITS = {
  target: {
    prompt:
      `Sixteen weeks later velocity reads ${V1}, up ${CLIMB_PCT}%, and the panel calls it ` +
      'progress. The deep-review sample was scored every one of those weeks — charted nowhere. ' +
      'What did the agreement line do while velocity climbed?',
    options: [
      {
        id: 'held',
        label: `Held near ${A0} — merged work is merged work; the sample shouldn't care how the count is fed`,
      },
      {
        id: 'slid',
        label:
          'Slid the whole ramp — the climb is made of split changes and no-op bumps, and the sample catches them',
      },
      {
        id: 'dip',
        label: 'Dipped early, then recovered as the fleet learned what reviewers reject',
      },
    ],
    feedback: {
      held: (
        <>
          The sample scores the work, and the work changed shape. The line is drawn now: agreement
          starts at {A0} and ends at {A1}, sliding exactly as fast as the gaming pressure ramps —
          the glass couples them in one line, BASE_AGREEMENT − AGREEMENT_LOSS × pressure. Velocity
          climbed {CLIMB_PCT}% because the fleet fed the count — split changes, no-op bumps, work
          shaped to the number — and feeding the count is precisely what the proxy stopped
          measuring. The metric went up because it stopped meaning what it was a proxy for.
        </>
      ),
      slid: (
        <>
          That is the run. Agreement {A0} → {A1} while velocity climbs {CLIMB_PCT}%, mirror images
          because the glass couples both to the same pressure: every point of gamed lift is bought
          with real quality. Now notice what the panel did about it — nothing. The cost line was
          measured every week and charted nowhere, and invisible is not the same as absent. A proxy
          under targeting pressure stops measuring what it proxied. That is the whole law.
        </>
      ),
      dip: (
        <>
          The recovery story needs a feedback path, and this panel does not have one. Reviewers
          reject inside the 10% sample, but nothing routes that signal back to what the fleet is
          paid in — the target is velocity, and velocity keeps paying. So the pressure ramps for ten
          straight weeks and holds: agreement slides {A0} → {A1} and stays down. A fleet learns what
          gets measured; what gets sampled-but-never-charted teaches nothing.
        </>
      ),
    },
    direction: (
      <>
        Two new instruments just lit: the off-panel agreement line, and the gaming pressure itself —
        the engine's truth, never on any platform panel. Scrub back to week 1 and run it forward:
        the slide starts the same week the climb does, and by week 10 pressure is at full strength
        with nothing on the panel able to see it. Change-failure ends at {CF1} and rollback at {RB1}
        , measured all along, charted nowhere. Task 2 charts them.
      </>
    ),
  },
  triangulate: {
    prompt:
      'You put change-failure rate and rollback rate on the panel next to velocity. Same fleet, ' +
      'same pressure. What changes?',
    options: [
      {
        id: 'prevented',
        label:
          'Prevented — a fleet will not game what the panel can see; the pressure never builds',
      },
      {
        id: 'priced',
        label:
          'Priced — the gaming proceeds until it surfaces as visible cost in lines it cannot inflate, then gets answered',
      },
      {
        id: 'displaced',
        label: 'Displaced — the fleet games the new lines too; three numbers are three seams',
      },
    ],
    feedback: {
      prevented: (
        <>
          Add the lines and watch weeks 1 through 4: the climb starts identically, because the
          target still pays and pressure ramps whether or not anyone is watching. What the panel
          changes is week {DET.week} — change-failure crosses twice its 4% baseline at {DET_CF}, in
          plain view, the inflating class loses auto-merge, and the pressure stops paying, halving
          weekly until velocity settles back near {TV1}. Visibility did not deter the gaming; it
          priced it. Nothing prevents gaming.
        </>
      ),
      priced: (
        <>
          That is what the engine draws. The climb starts identically — velocity {DET_V} by week{' '}
          {DET.week}, because two extra lines change nothing about the seam — and then
          change-failure crosses twice its 4% baseline at {DET_CF}, in plain view. The inflating
          class loses auto-merge, the pressure decays, and velocity gives back its gamed gains: peak{' '}
          {PEAK_S}, settling toward {TV1}, agreement back to {TA1}. Triangulation prevented nothing.
          It made the gaming cost something visible, in lines the gamer could not also inflate, soon
          enough to act on.
        </>
      ),
      displaced: (
        <>
          Pull on it: which way would the fleet push change-failure? Down — and shipping junk to
          feed the count pushes it up. That asymmetry is the independence requirement doing its
          work: change-failure and rollback are not two more targets to feed, they are costs of
          feeding the first one. The engine grants that independence by construction — the glass
          adds FAILURE_RISE × pressure and no term lets gaming subtract it. On a real platform your
          instinct is the right paranoia; the model notes say what this bench cannot show.
        </>
      ),
    },
    direction: (
      <>
        Park the playhead on week 16 and flip the two lines off and on: same fleet, same seed, and
        the endings differ — {V1} against {TV1} on velocity, {A1} against {TA1} on agreement. The
        only difference between those two platforms is what the panel carries.
      </>
    ),
  },
};

const TASK_BY_ID = Object.fromEntries(TASKS.map((t) => [t.id, t]));

/* ── Frame copy ─────────────────────────────────────────────────────────── */

const QUESTION =
  'Merged PRs per week goes on the panel as the target, and the fleet learns to feed it. What ' +
  'turns the gaming from an invisible win into a visible cost — and which questions should ' +
  'never get a number at all?';

const PAYOFF = (
  <>
    Sixteen weeks under one charted metric: velocity {V0} → {V1}, up {CLIMB_PCT}%, and the panel
    calls it progress while sampled deep-review agreement slides {A0} → {A1} where nobody charts it.
    Put the two lines gaming velocity has to damage on the panel — change-failure and rollback — and
    the same pressure crosses twice-baseline change-failure at week {DET.week}, in plain view: the
    inflating class loses auto-merge, the pressure stops paying, and velocity gives back its gamed
    gains (peak {PEAK_S}, settling toward {TV1}).{' '}
    <Badge
      layer="W"
      note="the triangulation rule, §3.8: if a metric will be used as a target, add at least two independent metrics that would be harmed by gaming it"
    />{' '}
    Triangulation prevents nothing; it prices. And four gauges stay blank on purpose — abstractions,
    direction, taste, norms — because a gauge that gets a number becomes a target, and those four
    are assigned to humans.
  </>
);

const NOTES = [
  'Tuned constants, not field measurements: base velocity 22 merged PRs a week, gaming can inflate it 80% at full pressure, full pressure costs 0.30 of agreement, detection trips at twice baseline change-failure. The constants tune the shape; where these thresholds sit on a real platform is not knowable from here.',
  'Gaming pressure is one scalar ramping to full strength over ten weeks ("the fleet keeps finding the seam"). Real gaming is many small behaviors — split changes, no-op version bumps, work shaped to the count — that the engine compresses into a single number.',
  'Triangulation is a single switch: both independent lines arrive together, and the response is one fixed rule — cross twice baseline, lose auto-merge, pressure halves weekly. Real detection takes judgment and lags; real responses sometimes fail to hold.',
  'The agreement line is computed identically in both runs; charting it changes nothing about the physics. The two panels differ only in what they let you see in time to act.',
  'Every control re-simulates all sixteen weeks from week 1 on the same seed: you compare panels, you never steer the fleet mid-run. No control here commands an agent.',
  'The ±1% wobble is seeded noise so the lines read as measurements, not geometry. Fork the seed in free play: detection lands on week 5 on every roll, because the shape is the constants, not the luck.',
];

const CANNOT_SHOW =
  'whether your two extra metrics are truly independent. The engine grants that by construction ' +
  '— gaming velocity can only push change-failure and rollback up; no term lets it push them ' +
  'down. On a real platform the fleet probes the new lines next: rollbacks reclassified as ' +
  'fix-forwards, failures parked behind feature flags. Judging independence, like the four ' +
  'blank gauges, is work §3.8 leaves with humans.';

/* ── The lab ────────────────────────────────────────────────────────────── */

export default function GoodhartBench() {
  const reduced = usePrefersReducedMotion();
  const [taskId, setTaskId] = useState('target');
  const [commits, setCommits] = useState({ target: null, triangulate: null });
  const [week, setWeek] = useState(WEEKS); // 1..16; entry at the representative end state
  const [playing, setPlaying] = useState(false);
  const [triOn, setTriOn] = useState(false);
  const [openGauge, setOpenGauge] = useState(null);
  const [sandbox, setSandbox] = useState({ seed: SEED + 1, triangulated: true });
  const [sandboxOpen, setSandboxOpen] = useState(false);

  const isSandbox = taskId === 'sandbox';
  const isGauges = taskId === 'reserve';
  const revealed = commits.target !== null; // the off-panel truth, earned in task 1
  const committed =
    isSandbox || (taskId === 'triangulate' ? commits.triangulate !== null : revealed);
  const allCommitted = commits.target !== null && commits.triangulate !== null;

  const sandboxRun = useMemo(
    () => simulateMetricGaming(sandbox.seed, { triangulated: sandbox.triangulated }),
    [sandbox.seed, sandbox.triangulated],
  );
  const run = isSandbox ? sandboxRun : taskId === 'triangulate' && triOn ? TRI : SINGLE;
  const idx = week - 1;
  const triPanel = run.onPanel.length > 1;
  const showTruth = revealed || isSandbox;
  const markerWeek = run.detection ? run.detection.week : null;
  const revoked = run.detection !== null && week >= run.detection.week;

  useEffect(() => {
    if (!playing) return undefined;
    if (week >= WEEKS) {
      setPlaying(false);
      return undefined;
    }
    const t = setTimeout(() => setWeek((w) => Math.min(WEEKS, w + 1)), 320);
    return () => clearTimeout(t);
  }, [playing, week]);

  const switchTask = (id) => {
    setPlaying(false);
    setTaskId(id);
    setWeek(WEEKS);
  };

  const runOrPause = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (reduced) {
      // Reduced motion: Run lands on the final week in one discrete step.
      setWeek(WEEKS);
      return;
    }
    if (week >= WEEKS) setWeek(1);
    setPlaying(true);
  };

  const tiles = TILE_DEFS.filter((d) => d.key !== 'pressure' || showTruth).map((d) => {
    const series = run.weeks.map((w) => w[d.key]);
    let charted;
    let status;
    let statusColor;
    if (d.key === 'velocity') {
      charted = true;
      status = 'on the panel · the target';
      statusColor = 'var(--accent-ink)';
    } else if (d.key === 'sampledOutcome') {
      charted = showTruth;
      status = charted
        ? 'off-panel · drawn here, never for the fleet'
        : 'measured weekly · not charted';
      statusColor = charted ? 'var(--red)' : 'var(--ink-faint)';
    } else if (d.key === 'pressure') {
      charted = true;
      status = 'engine truth · no panel anywhere carries this';
      statusColor = 'var(--ink-faint)';
    } else {
      charted = triPanel;
      status = charted ? 'on the panel · triangulating' : 'measured weekly · not charted';
      statusColor = charted ? 'var(--accent-ink)' : 'var(--ink-faint)';
    }
    return { def: d, series, charted, status, statusColor };
  });

  const task = isSandbox ? null : TASK_BY_ID[taskId];
  const commitSpec = taskId === 'target' || taskId === 'triangulate' ? COMMITS[taskId] : null;
  const picked = commitSpec ? commits[taskId] : null;
  const pickedLabel =
    picked !== null && commitSpec ? commitSpec.options.find((o) => o.id === picked)?.label : null;

  return (
    <LabFrame
      tag="LAB 20·A — THE GOODHART BENCH"
      register="mechanism"
      question={QUESTION}
      payoff={PAYOFF}
      notes={NOTES}
      cannotShow={CANNOT_SHOW}
      glass={GLASS}
    >
      <div className="mh-controls" role="group" aria-label="Guided tasks">
        <span className="mh-kicker">Tasks</span>
        <div className="mh-chipset">
          {TASKS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="mh-chip"
              aria-pressed={taskId === t.id}
              onClick={() => switchTask(t.id)}
            >
              {t.chip}
              {commits[t.id] !== undefined && commits[t.id] !== null ? ' ✓' : ''}
            </button>
          ))}
          <button
            type="button"
            className="mh-chip"
            aria-pressed={isSandbox}
            disabled={!allCommitted && !sandboxOpen}
            onClick={() => switchTask('sandbox')}
            title={allCommitted || sandboxOpen ? undefined : 'Opens after the guided tasks'}
          >
            free play
          </button>
          {!allCommitted && !sandboxOpen ? (
            <button
              type="button"
              onClick={() => setSandboxOpen(true)}
              className="mono"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '10.5px',
                letterSpacing: '0.08em',
                color: 'var(--ink-faint)',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              free play opens after the guided tasks — open it anyway
            </button>
          ) : null}
        </div>
      </div>

      <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '8px 0' }}>
        {isSandbox
          ? 'Free play, clearly optional. Fork the seed and flip the panel: the wobble is ±1% ' +
            'seeded noise, and the shape — the ten-week ramp, the slide, week-5 detection — is ' +
            'the constants. Same terrain, same physics, any roll.'
          : task.scene}
      </p>

      {!isGauges ? (
        <>
          <div
            role="group"
            aria-label="Instrument panel"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 8,
              margin: '10px 0 4px',
            }}
          >
            {tiles.map((t) => (
              <MetricTile
                key={t.def.key}
                def={t.def}
                charted={t.charted}
                status={t.status}
                statusColor={t.statusColor}
                series={t.series}
                idx={idx}
                markerWeek={t.charted ? markerWeek : null}
              />
            ))}
          </div>

          <div className="mh-lamps">
            <span className={`mh-lamp ${revoked ? 'off' : 'on'}`}>
              {revoked
                ? `auto-merge revoked — week ${run.detection.week}`
                : triPanel
                  ? 'auto-merge intact'
                  : 'auto-merge intact — the panel sees no reason to act'}
            </span>
            <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-faint)' }}>
              panel carries: {triPanel ? 'velocity · change-failure · rollback' : 'velocity only'}
              {markerWeek
                ? ` · amber line — week ${markerWeek}: change-failure crossed twice its 4% baseline`
                : ''}
            </span>
          </div>

          <div
            className="mh-controls"
            role="group"
            aria-label="Bench controls: Step, Run, Reset, playhead"
          >
            <button
              type="button"
              className="mh-btn"
              onClick={() => setWeek((w) => Math.min(WEEKS, w + 1))}
              disabled={!committed || playing || week >= WEEKS}
              aria-label="Step one week forward"
            >
              Step
            </button>
            <button
              type="button"
              className="mh-btn mh-btn-primary"
              onClick={runOrPause}
              disabled={!committed}
              aria-pressed={playing}
              aria-label={playing ? 'Pause the run' : 'Run to week sixteen'}
            >
              {playing ? 'Pause' : 'Run'}
            </button>
            <button
              type="button"
              className="mh-btn"
              onClick={() => {
                setPlaying(false);
                setWeek(1);
              }}
              disabled={!committed || week === 1}
              aria-label="Reset to week one"
            >
              Reset
            </button>
            <div className="mh-slider" style={{ flex: '1 1 200px', maxWidth: 320 }}>
              <label htmlFor="gb-playhead">
                <span>playhead</span>
                <span>
                  week {week} of {WEEKS}
                </span>
              </label>
              <input
                id="gb-playhead"
                type="range"
                min="1"
                max={WEEKS}
                step="1"
                value={week}
                disabled={!committed}
                onChange={(e) => setWeek(Number(e.target.value))}
                aria-valuetext={`week ${week} of ${WEEKS}`}
              />
            </div>
          </div>
        </>
      ) : null}

      {taskId === 'triangulate' ? (
        <div className="mh-controls" role="group" aria-label="What the panel carries">
          <button
            type="button"
            className="mh-chip"
            aria-pressed={triOn}
            disabled={!committed}
            onClick={() => setTriOn((t) => !t)}
            title={committed ? undefined : 'Commit a prediction first'}
          >
            {triOn
              ? 'pull change-failure + rollback off the panel'
              : 'add change-failure + rollback to the panel'}
          </button>
          <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-faint)' }}>
            frozen — same fleet, same seed, same gaming pressure; only the panel changes
          </span>
        </div>
      ) : null}

      {isSandbox ? (
        <div className="mh-controls" role="group" aria-label="Free play: seed and panel">
          <button
            type="button"
            className="mh-btn"
            onClick={() => setSandbox((s) => ({ ...s, seed: s.seed + 1 }))}
            aria-label="Fork the seed: re-roll the wobble and re-simulate"
          >
            Fork the seed
          </button>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-2)' }}>
            seed {sandbox.seed}
          </span>
          <button
            type="button"
            className="mh-chip"
            aria-pressed={sandbox.triangulated}
            onClick={() => setSandbox((s) => ({ ...s, triangulated: !s.triangulated }))}
          >
            {sandbox.triangulated ? 'triangulated panel' : 'single-target panel'}
          </button>
        </div>
      ) : null}

      {isGauges ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 10,
              margin: '12px 0',
            }}
          >
            {GAUGES.map((g) => (
              <JudgmentGauge
                key={g.id}
                gauge={g}
                open={openGauge === g.id}
                onToggle={() => setOpenGauge(openGauge === g.id ? null : g.id)}
              />
            ))}
          </div>
          <p
            style={{
              fontStyle: 'italic',
              fontSize: '14px',
              color: 'var(--ink-2)',
              margin: '8px 0',
            }}
          >
            The blankness is load-bearing. A gauge that gets a number becomes a target, and you just
            watched, twice, what targets do. These four stay with people who can be argued with.
          </p>
        </>
      ) : null}

      {commitSpec && picked === null ? (
        <Commit
          prompt={commitSpec.prompt}
          options={commitSpec.options}
          onReveal={(id) => setCommits((c) => ({ ...c, [taskId]: id }))}
        >
          {(id) => commitSpec.feedback[id]}
        </Commit>
      ) : null}

      {commitSpec && picked !== null ? (
        <div className="mh-feedback">
          <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
            You predicted · {pickedLabel}
          </span>
          <p style={{ margin: '0 0 8px' }}>{commitSpec.feedback[picked]}</p>
          <p style={{ margin: 0, fontStyle: 'italic' }}>{commitSpec.direction}</p>
        </div>
      ) : null}
    </LabFrame>
  );
}
