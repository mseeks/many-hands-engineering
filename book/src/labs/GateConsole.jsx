// GateConsole.jsx — LAB 18·A "The gate console" (Ch 18 · Gate, rate, budget,
// covers §3.6), mechanism register, plus the named export DivergenceChart —
// FIG 17·A "The rubber-stamp divergence" (Ch 17 · The steward, covers §3.5),
// bet register, the compact figure Ch 18's console embeds as an instrument.
//
// The console boots the handbook's exact scenario: a 30-approval weekly
// budget, dependency patches eating 18 of it at 96%, gated demand 34 against
// a 28.5 line. The budget slider is rendered locked — the engine has no
// "work harder" parameter, on purpose — so the only levers are the gates.
// Saturation breaks toward one of two recorded temperaments (seed 7
// rubber-stamps, seed 1 stalls; the coin flip is fixed by the seed in
// simulateWeeks), and each pathology is visible on exactly one instrument.
// Charts are static drawings of full 12-week runs: no rAF, no autoplay, so
// there is no JS motion for reduced-motion to gate.

import { useMemo, useState } from 'react';
import { Badge, Commit, LabFrame, glassSlice } from '../components/kit.jsx';
import { defaultClasses, moveGate, simulateWeeks } from '../engine/econ.js';
import econSrc from '../engine/econ.js?raw';

// The console's glass: the inequality's left-hand side plus the Ⓦ drift
// function, contiguous in the source. The figure's glass is the drift alone.
const CONSOLE_GLASS = glassSlice(
  econSrc,
  '/**\n * Weekly demand for considered approvals',
  'Math.min(0.3, drift + creep);\n}',
);
const DRIFT_GLASS = glassSlice(
  econSrc,
  '/**\n * Ⓦ MODELING CHOICE',
  'Math.min(0.3, drift + creep);\n}',
);

const BUDGET = 30;
// Seeds chosen so each temperament is a stable recording (pinned by
// tests/econ.test.js's findSeed walk: 7 rubber-stamps, 1 stalls).
const SEEDS = { 'rubber-stamp': 7, stall: 1 };

// The two recorded saturated quarters, computed once. Both face the same
// 34-against-28.5 breach; only the temperament differs.
const RS_RUN = simulateWeeks({ seed: SEEDS['rubber-stamp'] });
const ST_RUN = simulateWeeks({ seed: SEEDS.stall });

const CLASS_META = {
  'dep-patch': { color: 'var(--c-deppatch)' },
  'oncall-assist': { color: 'var(--c-triage)' },
  'doc-refresh': { color: 'var(--c-docs)' },
  'flaky-quarantine': { color: 'var(--c-flaky)' },
};

const round1 = (x) => Math.round(x * 10) / 10;
const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
const pct = (v) => `${fmt(Math.round(v * 1000) / 10)}%`;
/** A class's weekly claim on the budget: full inflow above the gate, the sampled slice below. */
const claimOf = (c) => (c.gate === 'above' ? c.inflow : round1(c.inflow * (c.sampling ?? 0.1)));

const MONO_NOTE = { fontSize: '11px', color: 'var(--ink-faint)', margin: '2px 0 4px' };

/* ── The divergence chart (rates over weeks) ────────────────────────── */

function RateChart({ run, caption, summary }) {
  const rows = run.weeks;
  const W = 460;
  const H = 200;
  const padL = 40;
  const padR = 104;
  const padT = 14;
  const padB = 28;
  const yMin = 0.85;
  const yMax = 1.0;
  const x = (wk) => padL + ((wk - 1) / (rows.length - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - (Math.max(yMin, v) - yMin) / (yMax - yMin)) * (H - padT - padB);
  const ratePts = rows.filter((r) => r.approvalRate != null);
  const agreePts = rows.filter((r) => r.deepReviewAgreement != null);
  const lastR = ratePts.at(-1);
  const lastA = agreePts.at(-1);
  const gap = lastR && lastA ? lastR.approvalRate - lastA.deepReviewAgreement : 0;

  // End labels: nudge apart when the lines finish close together.
  let labR = lastR ? y(lastR.approvalRate) : 0;
  let labA = lastA ? y(lastA.deepReviewAgreement) : 0;
  if (lastR && lastA && Math.abs(labR - labA) < 16) {
    const mid = (labR + labA) / 2;
    const up = labR <= labA;
    labR = up ? mid - 8 : mid + 8;
    labA = up ? mid + 8 : mid - 8;
  }

  return (
    <figure style={{ margin: '10px 0 0' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={summary}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {[0.85, 0.9, 0.95, 1.0].map((v) => (
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
              x={padL - 5}
              y={y(v) + 3.5}
              textAnchor="end"
              fontSize="9"
              fill="var(--ink-faint)"
              fontFamily="var(--font-mono)"
            >
              {Math.round(v * 100)}
            </text>
          </g>
        ))}
        {[1, 4, 8, 12].map((wk) => (
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
        {ratePts.length > 1 ? (
          <polyline
            points={ratePts.map((r) => `${x(r.week)},${y(r.approvalRate)}`).join(' ')}
            fill="none"
            stroke="var(--amber)"
            strokeWidth="2"
          />
        ) : null}
        <polyline
          points={agreePts.map((r) => `${x(r.week)},${y(r.deepReviewAgreement)}`).join(' ')}
          fill="none"
          stroke="var(--blue)"
          strokeWidth="2"
        />
        {lastR ? (
          <g>
            <circle cx={x(lastR.week)} cy={y(lastR.approvalRate)} r="3" fill="var(--amber)" />
            <text
              x={x(lastR.week) + 7}
              y={labR + 3}
              fontSize="9"
              fill="var(--amber)"
              fontFamily="var(--font-mono)"
            >
              approval {pct(lastR.approvalRate)}
            </text>
          </g>
        ) : (
          <text
            x={padL + 8}
            y={padT + 10}
            fontSize="9"
            fill="var(--ink-faint)"
            fontFamily="var(--font-mono)"
          >
            nothing crosses a gate — no rate to read
          </text>
        )}
        {lastA ? (
          <g>
            <circle cx={x(lastA.week)} cy={y(lastA.deepReviewAgreement)} r="3" fill="var(--blue)" />
            <text
              x={x(lastA.week) + 7}
              y={labA + 3}
              fontSize="9"
              fill="var(--blue)"
              fontFamily="var(--font-mono)"
            >
              deep review {pct(lastA.deepReviewAgreement)}
            </text>
          </g>
        ) : null}
        {lastR && lastA && gap > 0.03 ? (
          <line
            x1={x(lastR.week)}
            x2={x(lastA.week)}
            y1={y(lastR.approvalRate) + 4}
            y2={y(lastA.deepReviewAgreement) - 4}
            stroke="var(--red)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ) : null}
      </svg>
      <figcaption style={{ fontSize: '12.5px', color: 'var(--ink-2)', margin: '6px 0 0' }}>
        {caption}
      </figcaption>
    </figure>
  );
}

/* ── The queue chart (standing WIP over weeks) ──────────────────────── */

function WipChart({ run, caption, summary }) {
  const rows = run.weeks;
  const W = 460;
  const H = 180;
  const padL = 40;
  const padR = 96;
  const padT = 16;
  const padB = 28;
  const maxWip = Math.max(...rows.map((r) => r.wip));
  const yMax = Math.max(20, Math.ceil(maxWip / 20) * 20);
  const x = (wk) => padL + ((wk - 1) / (rows.length - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - v / yMax) * (H - padT - padB);
  const last = rows.at(-1);
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
              x={padL - 5}
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
        {[1, 4, 8, 12].map((wk) => (
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
        <polyline
          points={rows.map((r) => `${x(r.week)},${y(r.wip)}`).join(' ')}
          fill="none"
          stroke="var(--red)"
          strokeWidth="2"
        />
        <circle cx={x(last.week)} cy={y(last.wip)} r="3" fill="var(--red)" />
        <text
          x={x(last.week) + 7}
          y={y(last.wip) + 3}
          fontSize="9"
          fill="var(--red)"
          fontFamily="var(--font-mono)"
        >
          {fmt(last.wip)} standing
        </text>
      </svg>
      <figcaption style={{ fontSize: '12.5px', color: 'var(--ink-2)', margin: '6px 0 0' }}>
        {caption}
      </figcaption>
    </figure>
  );
}

/* ── The balance bar: the governing inequality, live ────────────────── */

function BudgetBar({ classes, inequality }) {
  const { lhs, rhs, ok } = inequality;
  const W = 460;
  const H = 86;
  const pad = 8;
  const xMax = Math.max(lhs, BUDGET) * 1.05;
  const x = (v) => pad + (v / xMax) * (W - pad * 2);
  const y0 = 32;
  const y1 = 60;
  let acc = 0;
  const segs = classes.map((c) => {
    const w = claimOf(c);
    const seg = { id: c.id, from: acc, to: acc + w };
    acc += w;
    return seg;
  });
  const upstream = BUDGET - lhs;
  const summary =
    `Budget balance: gated demand ${fmt(lhs)} a week against a sustainable line of ` +
    `${fmt(rhs)} from a locked budget of ${BUDGET}. ` +
    (ok
      ? `Under the line, with ${fmt(round1(upstream))} a week left as upstream time.`
      : `Over the line by ${fmt(round1(lhs - rhs))}; the overflow queues, or the bar erodes.`);
  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={summary}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <rect
          x={x(0)}
          y={y0}
          width={x(xMax) - x(0)}
          height={y1 - y0}
          fill="var(--paper-3)"
          rx="2"
        />
        {segs.map((s) => (
          <rect
            key={s.id}
            x={x(s.from)}
            y={y0}
            width={Math.max(0, x(s.to) - x(s.from))}
            height={y1 - y0}
            fill={CLASS_META[s.id]?.color ?? 'var(--ink-faint)'}
            opacity="0.85"
            stroke="var(--paper)"
            strokeWidth="1"
          />
        ))}
        {ok && upstream > 0 ? (
          <g>
            <rect
              x={x(lhs)}
              y={y0}
              width={x(BUDGET) - x(lhs)}
              height={y1 - y0}
              fill="var(--accent-soft)"
              stroke="var(--accent)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            {BUDGET - lhs > xMax / 9 ? (
              <text
                x={(x(lhs) + x(BUDGET)) / 2}
                y={(y0 + y1) / 2 + 3.5}
                textAnchor="middle"
                fontSize="9"
                fill="var(--accent-ink)"
                fontFamily="var(--font-mono)"
              >
                upstream {fmt(round1(upstream))}
              </text>
            ) : null}
          </g>
        ) : null}
        {!ok ? (
          <g>
            <rect
              x={x(rhs)}
              y={y0}
              width={x(lhs) - x(rhs)}
              height={y1 - y0}
              fill="var(--red-soft)"
              stroke="var(--red)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <text
              x={(x(rhs) + x(lhs)) / 2}
              y={(y0 + y1) / 2 + 3.5}
              textAnchor="middle"
              fontSize="9"
              fill="var(--red)"
              fontFamily="var(--font-mono)"
            >
              +{fmt(round1(lhs - rhs))}/wk
            </text>
          </g>
        ) : null}
        <line x1={x(rhs)} x2={x(rhs)} y1={20} y2={70} stroke="var(--amber)" strokeWidth="1.5" />
        <text
          x={x(rhs) - 4}
          y={16}
          textAnchor="end"
          fontSize="9"
          fill="var(--amber)"
          fontFamily="var(--font-mono)"
        >
          the line {fmt(rhs)}
        </text>
        <line
          x1={x(BUDGET)}
          x2={x(BUDGET)}
          y1={26}
          y2={70}
          stroke="var(--ink-faint)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <text
          x={x(BUDGET) + 4}
          y={80}
          textAnchor="start"
          fontSize="9"
          fill="var(--ink-faint)"
          fontFamily="var(--font-mono)"
        >
          budget {BUDGET} · locked
        </text>
      </svg>
      <div
        className="mono"
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          fontSize: 11,
          color: 'var(--ink-2)',
          margin: '4px 0 0',
        }}
      >
        {classes.map((c) => (
          <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span
              aria-hidden="true"
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: CLASS_META[c.id]?.color,
              }}
            />
            {c.label.toLowerCase()} {fmt(claimOf(c))}
          </span>
        ))}
        <span style={{ color: 'var(--ink-faint)' }}>units: considered approvals /wk</span>
      </div>
    </div>
  );
}

/* ── Triangulation panels ───────────────────────────────────────────── */

function PanelBars({ rows, scaleMax, axisNote }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {rows.map((r) => (
        <div
          key={r.label}
          style={{
            display: 'grid',
            gridTemplateColumns: '96px 1fr 40px',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-2)' }}>
            {r.label}
          </span>
          <span
            aria-hidden="true"
            style={{ background: 'var(--paper-3)', borderRadius: 2, height: 9 }}
          >
            <span
              style={{
                display: 'block',
                height: '100%',
                borderRadius: 2,
                width: `${Math.min(100, (r.value / scaleMax) * 100)}%`,
                background: r.hot ? 'var(--red)' : 'var(--blue)',
              }}
            />
          </span>
          <span
            className="mono"
            style={{ fontSize: 11, color: r.hot ? 'var(--red)' : 'var(--ink)' }}
          >
            {r.text}
          </span>
        </div>
      ))}
      <span className="mono" style={{ fontSize: 9.5, color: 'var(--ink-faint)' }}>
        {axisNote}
      </span>
    </div>
  );
}

function TriangulationPanels({ classes, perClass }) {
  const agreeRows = classes.map((c) => {
    const row = perClass.find((p) => p.id === c.id);
    return {
      label: c.label.toLowerCase(),
      value: (row?.agreement ?? 0) * 100,
      text: pct(row?.agreement ?? 0),
      hot: c.id === 'flaky-quarantine',
    };
  });
  const defectRows = classes.map((c) => ({
    label: c.label.toLowerCase(),
    value: Math.round((1 - c.quality) * 100),
    text: String(Math.round((1 - c.quality) * 100)),
    hot: c.id === 'flaky-quarantine',
  }));
  return (
    <div className="mh-cardgrid" style={{ margin: '12px 0 0' }}>
      <div className="mh-card" role="group" aria-label="Triangulation: sampled deep review">
        <span className="mh-kicker">Triangulation · sampled deep review</span>
        <PanelBars
          rows={agreeRows}
          scaleMax={100}
          axisNote="share of each class's landings a second considered look endorses · 0–100 · 2-pt dissent floor"
        />
        <p style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '8px 0 0' }}>
          Above the gate, the gate filters first, so honest classes read ~98. Below it, everything
          lands and agreement converges to the class's true quality, less the floor.
        </p>
      </div>
      <div className="mh-card" role="group" aria-label="Triangulation: post-merge defects">
        <span className="mh-kicker">Triangulation · post-merge defects</span>
        <PanelBars
          rows={defectRows}
          scaleMax={25}
          axisNote="defects per 100 landed proposals, surfaced later · scale 0–25"
        />
        <p style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '8px 0 0' }}>
          19 in 100 quarantines buried a real regression. This panel reads the model's ground truth;
          your defect tracker delivers the same number a quarter late.
        </p>
      </div>
    </div>
  );
}

/* ── Argued judgment: the console's live verdict ────────────────────── */

function consoleVerdict(run, classes) {
  const { lhs, rhs, ok } = run.inequality;
  const below = Object.fromEntries(classes.map((c) => [c.id, c.gate === 'below']));
  const upstream = run.weeks[0].upstreamFree;
  const parts = [];

  if (!ok) {
    parts.push(
      `Gated demand ${fmt(lhs)} against the ${fmt(rhs)} line: over by ${fmt(round1(lhs - rhs))}. ` +
        `The overflow queues, or the bar erodes — temperament decides which, and neither is a fix.`,
    );
    if (!below['dep-patch']) {
      const others = classes.filter((c) => c.gate === 'below');
      parts.push(
        others.length
          ? `The moves so far shaved ${fmt(round1(34 - lhs))}, but dependency patches still claim 18 — ` +
              `the one class whose move clears the breach on its own.`
          : `Dependency patches claim 18 of the ${fmt(lhs)}. No smaller move clears ${fmt(round1(lhs - rhs))}.`,
      );
    }
  } else {
    parts.push(`Gated demand ${fmt(lhs)} against the ${fmt(rhs)} line: under.`);
    if (below['dep-patch']) {
      parts.push(
        `Dependency patches cost 2.7 sampled reviews instead of 18 considered approvals — 15.3 ` +
          `flow back, and the on-call class's 7 fits inside the line.`,
      );
    } else {
      parts.push(
        `The line cleared without touching the 96% class; check what you widened instead.`,
      );
    }
  }
  if (below['oncall-assist']) {
    parts.push(
      `On-call assist went below at an 88% rate: one proposal in eight comes back wrong, now ` +
        `landing unreviewed. The handbook widens envelopes where the rate is consistently high; ` +
        `88 is not that.`,
    );
  }
  if (below['doc-refresh']) {
    parts.push(
      `Doc refresh at 93% is a borderline widen — one in fourteen wrong, auto-applied — and its ` +
        `5-a-week claim was never what strangled the budget.`,
    );
  }
  if (below['flaky-quarantine']) {
    parts.push(
      `And the balance bar approves of flaky-quarantine being below, because the inequality ` +
        `counts proposals, not quality. Deep review endorses 79 of its 100 landings: roughly one ` +
        `quarantine in five buries a real regression, four a week, unreviewed. The bar is the ` +
        `wrong instrument for this call.`,
    );
  }
  if (ok && upstream > 0) {
    parts.push(
      `Upstream time: ${fmt(upstream)} a week — a budget line, not a leftover. The saturated ` +
        `week read zero.`,
    );
  }
  return parts.join(' ');
}

/* ── FIG 17·A — the rubber-stamp divergence, compact ────────────────── */

const FIG_PAYOFF = (
  <>
    Under sustained saturation the gate-depth approval rate inflates from 96.4 toward 99.8 while
    sampled deep-review agreement slides from 93.8 to 89.8: the lines part company, and the gap —
    not either line alone — is the reading. The direction is the automation-bias finding from
    aviation and medicine{' '}
    <Badge
      layer="E"
      note="fields that automated decades before software; high-volume, high-approval review erodes checking"
    />
    ; the slope is invented so twelve weeks can show it. This curve is the author's bet, drawn{' '}
    <Badge
      layer="W"
      note="rubberStampDrift: linear creep per saturated week, capped — see the glass"
    />
    . The dissent run is the same saturation wearing the other temperament: no divergence at all,
    the bill standing in a 66-deep queue. An instrument that misses half the pathologies must never
    testify alone.
  </>
);

const FIG_NOTES = [
  'Both curves are recorded runs of the same economy: 34 gated proposals a week against a 28.5 line, seeds 7 and 1. The chips change which recording you watch, never the system.',
  "The drift function is a Ⓦ modeling choice: nobody has measured how fast a saturated steward's bar erodes. Direction from the handbook claim; slope and cap tuned so the divergence fits a 12-week chart.",
  'The lines aggregate four task classes. One of them looks 99.7%-approvable with 81% true quality, which is why the agreement line starts near 94 rather than 98 — Ch 18 puts that class under the glass.',
  'Sampled deep review carries a 2-point dissent floor (an instrument, not an oracle). Week-to-week wobble of ±0.5pt is presentation noise; it never moves a conclusion.',
];

const FIG_CANNOT =
  "How fast a real steward's bar erodes — nobody has measured the slope, which is why this is a " +
  'bet and not a finding. It cannot date the week your own approvals go hollow; it can only give ' +
  'you the signature to instrument for: an approval rate climbing while sampled deep-review ' +
  'agreement falls, read against the queue gauge, never alone.';

export function DivergenceChart() {
  const [variant, setVariant] = useState('rubber-stamp');
  const run = variant === 'rubber-stamp' ? RS_RUN : ST_RUN;
  const first = run.weeks[0];
  const last = run.weeks.at(-1);

  const caption =
    variant === 'rubber-stamp'
      ? `Watch the gap, not either line. Approvals climb ${pct(first.approvalRate)} → ` +
        `${pct(last.approvalRate)} while sampled deep review slides ${pct(first.deepReviewAgreement)} → ` +
        `${pct(last.deepReviewAgreement)}. The rate reads like the system improving; the gap says ` +
        `the steward is eroding. The slope is the author's bet, drawn; the direction is the ` +
        `literature's.`
      : `Model dissent: the same 34-against-28.5 saturation, the other temperament. The rate ` +
        `holds honest near ${pct(last.approvalRate)}, agreement holds near ` +
        `${pct(last.deepReviewAgreement)}, and this chart reads silence while the queue climbs to ` +
        `${fmt(last.wip)}. Where the claim fails to appear, the bill stands at the gate instead.`;

  const summary =
    variant === 'rubber-stamp'
      ? `Divergence chart over 12 saturated weeks: approval rate rises from ${pct(first.approvalRate)} ` +
        `to ${pct(last.approvalRate)} while deep-review agreement falls from ` +
        `${pct(first.deepReviewAgreement)} to ${pct(last.deepReviewAgreement)}.`
      : `The dissent run: approval rate and deep-review agreement hold flat near ` +
        `${pct(last.approvalRate)} and ${pct(last.deepReviewAgreement)} while standing queue ` +
        `reaches ${fmt(last.wip)}.`;

  return (
    <LabFrame
      tag="FIG 17·A — THE RUBBER-STAMP DIVERGENCE"
      register="bet"
      question="Twelve saturated weeks: 34 proposals' worth of gated demand against a 28.5-approval line. The approval rate climbs toward 100. Improving system, or eroding steward — and which instrument can tell?"
      payoff={FIG_PAYOFF}
      notes={FIG_NOTES}
      cannotShow={FIG_CANNOT}
      glass={DRIFT_GLASS}
    >
      <div className="mh-chipset" role="group" aria-label="Which recorded run to watch">
        <button
          type="button"
          className="mh-chip"
          aria-pressed={variant === 'rubber-stamp'}
          onClick={() => setVariant('rubber-stamp')}
          aria-label="Watch the rubber-stamp temperament, recorded run"
        >
          the saturated steward
        </button>
        <button
          type="button"
          className="mh-chip"
          aria-pressed={variant === 'stall'}
          onClick={() => setVariant('stall')}
          aria-label="Watch the model dissent: the steward who stalls instead"
        >
          model dissent · the steward who stalls
        </button>
      </div>
      <RateChart run={run} caption={caption} summary={summary} />
      {variant === 'stall' ? (
        <div className="mh-readout" role="group" aria-label="Where the stall shows instead">
          <div className="mh-stat">
            <span className="k">Standing queue · wk 12</span>
            <span className="v bad">{fmt(last.wip)}</span>
          </div>
          <div className="mh-stat">
            <span className="k">Added each week</span>
            <span className="v warn">+{fmt(run.weeks[0].queue)}</span>
          </div>
        </div>
      ) : null}
    </LabFrame>
  );
}

/* ── LAB 18·A — the gate console ────────────────────────────────────── */

const CONSOLE_PAYOFF = (
  <>
    Moving the 18-a-week, 96% class below the gate — 15% sampled, the rest auto-merging on green CI
    — drops gated demand from 34 to 18.7 against the 28.5 line: about 15 considered approvals flow
    back, the new on-call class fits inside the budget, and upstream time appears as a funded
    11.3-a-week line where the saturated week showed zero. The budget never moved; the gate did. The
    class the same arithmetic begs you to move next, flaky-test quarantine at 99.7%, is the one that
    must stay gated: sampled deep review endorses 79 of its 100 landings, because quarantining a
    test greens CI whether the test was flaky or a regression telling the truth{' '}
    <Badge
      layer="W"
      note="the hollow rate is modeled as plausibility 99.7% over quality 81% — a constructed class, built to teach the instrument's limit"
    />
    . Queues are signals; the budget is the constant; the gate is the lever; and the limits of the
    instrument are part of reading it.
  </>
);

const CONSOLE_NOTES = [
  "The 30-approval budget, the 18-a-week dep-patch class at 96%, and the ~3-instead-of-18 result of the move are the handbook's §3.6 example. The other three classes and every quality number are constructed so the console has something to teach.",
  "Saturation breaks toward exactly one pathology per run — a coin flip fixed by the seed, standing in for the steward's temperament under pressure. The two watch chips are recorded temperaments (seeds 7 and 1), not a knob on a person.",
  'The rubber-stamp drift function is a Ⓦ modeling choice: direction from the handbook (the rate inflates while agreement falls), slope and cap invented so a 12-week chart can show it.',
  "Flaky-quarantine's 99.7% models plausibility, not quality: quarantining always greens CI, so gate-depth review approves it either way. Its true quality (81%) is what a deep review endorses.",
  "Deep review carries a 2-point dissent floor — it is an instrument too, not an oracle. The post-merge defects panel reads the model's ground truth, a narrator's view your tracker only reaches a quarter later.",
  'Tolerance is 5%: the line sits at 28.5, not 30, because the margin pays for saying no. Moving a gate re-runs the quarter on the new terrain; the console does not splice mid-run. Week-to-week wobble of ±0.5pt is presentation noise.',
];

const CONSOLE_CANNOT =
  'Where your own gates belong. The console counts proposals and rates; it cannot price one ' +
  'missed regression against fifteen reclaimed approvals, which is exactly the judgment the ' +
  "steward is for. It also cannot show a budget that is itself wrong (30 is the handbook's " +
  'example, not a constant of nature), a steward who alternates temperaments mid-quarter, or ' +
  'whether the upstream time the move funds actually gets spent upstream.';

const COMMIT1_OPTIONS = [
  { id: 'still-over', label: "Still over — one class can't be 5.5 deep" },
  { id: 'at-line', label: 'Right at the line — about 28' },
  { id: 'under', label: 'Comfortably under — about 19' },
  { id: 'watch', label: "Can't say without running the quarter" },
];

const COMMIT1_FEEDBACK = {
  'still-over':
    "It was 5.5 deep and then some — the move is worth 15.3, not 5.5. Dep-patch's claim falls " +
    'from 18 to 18 × 0.15 = 2.7, so the week lands at 2.7 + 7 + 5 + 4 = 18.7 against 28.5: under, ' +
    'with 9.8 of slack. The miss is natural: a queue 5.5 over feels like a 5.5-sized problem, but ' +
    "the gate moves a class's whole claim, not the overflow. The toggles above are live — make " +
    'the move and watch the bar.',
  'at-line':
    'Closer, but the arithmetic is better than that: 18 falls to 18 × 0.15 = 2.7, and the week ' +
    'lands at 2.7 + 7 + 5 + 4 = 18.7 against 28.5. Pricing the move at "about 28" treats it as ' +
    'clearing the 5.5 overflow; it actually returns 15.3 — the whole class minus its sample. The ' +
    'toggles above are live; make the move.',
  under:
    '18 × 0.15 = 2.7, so the week lands at 2.7 + 7 + 5 + 4 = 18.7 against 28.5 — under, with ' +
    '15.3 considered approvals flowing back. That is the gate-move arithmetic: the lever moves a ' +
    "class's whole claim. Now make the move above and watch where the 15.3 lands — the on-call " +
    'class fits, and upstream time stops reading zero.',
  watch:
    'No quarter needed: the inequality is a property of the terrain, not the weather. Gated ' +
    'inflow is set by where the gates sit — 18 × 0.15 + 7 + 5 + 4 = 18.7 against 28.5 — and ' +
    'holds before any week runs. What a quarter adds is the pathology you avoid, not the ' +
    'arithmetic. The toggles above are live; make the move.',
};

const COMMIT2_OPTIONS = [
  { id: 'earned', label: 'Earned — move it below, same arithmetic' },
  { id: 'hollow', label: 'Hollow — keep it gated' },
  { id: 'console', label: 'This console cannot tell' },
];

const COMMIT2_FEEDBACK = {
  earned:
    'The arithmetic agrees with you, which is exactly the problem: move it and the balance bar ' +
    'stays green at 15.1 against 28.5. But a gate-depth rate measures how approvable work looks, ' +
    'and quarantining a flaky test always looks right — CI goes green whether the test was flaky ' +
    'or a regression failing honestly. The rate cannot fail at this gate. Read the panels below ' +
    'before you touch the toggle.',
  hollow:
    'Keeping it gated is the right move — now get the reading that makes it a call instead of a ' +
    'hunch. "Too clean" is a smell; the panels below are the instrument. And note what the ' +
    'console alone gave you: nothing. 96 and 99.7 sit three points apart and on opposite sides ' +
    'of this decision.',
  console:
    'Right — and the why matters: a rate is what the gate could see. Quarantining a flaky test ' +
    'greens CI by construction, so gate-depth approval cannot distinguish a justified quarantine ' +
    "from a buried regression. The 99.7 measures the move's plausibility, not its quality. The " +
    'instruments that can see are below.',
};

export default function GateConsole() {
  const [gates, setGates] = useState({});
  const [temperament, setTemperament] = useState('rubber-stamp');
  const [committed1, setCommitted1] = useState(false);
  const [committed2, setCommitted2] = useState(false);

  const classes = useMemo(() => {
    let cs = defaultClasses();
    for (const [id, to] of Object.entries(gates)) cs = moveGate(cs, id, to);
    return cs;
  }, [gates]);

  const run = useMemo(
    () => simulateWeeks({ classes, seed: SEEDS[temperament] }),
    [classes, temperament],
  );

  const { lhs, rhs, ok } = run.inequality;
  const week1 = run.weeks[0];
  const last = run.weeks.at(-1);
  const depBelow = classes.find((c) => c.id === 'dep-patch')?.gate === 'below';
  const verdict = consoleVerdict(run, classes);

  const setGate = (id, to) => setGates((g) => ({ ...g, [id]: to }));

  const chartSummary =
    temperament === 'rubber-stamp'
      ? `Approval rate and deep-review agreement over 12 weeks: ${pct(week1.approvalRate ?? 0)} ` +
        `to ${pct(last.approvalRate ?? 0)} against ${pct(week1.deepReviewAgreement)} to ` +
        `${pct(last.deepReviewAgreement)}.`
      : `Standing queue over 12 weeks: ${fmt(week1.wip)} after week one, ${fmt(last.wip)} by week 12.`;

  const chartCaption = !ok
    ? temperament === 'rubber-stamp'
      ? `Watch the gap, not either line: approvals climb ${pct(week1.approvalRate)} → ` +
        `${pct(last.approvalRate)} while sampled deep review slides ` +
        `${pct(week1.deepReviewAgreement)} → ${pct(last.deepReviewAgreement)}. The queue gauge ` +
        `reads zero all twelve weeks — a rubber-stamping steward "keeps up" — so this divergence ` +
        `is the only instrument that catches it. A signal, not a solution.`
      : `The other temperament: the rate holds honest near ${pct(last.approvalRate)} and the ` +
        `divergence goes silent. The bill stands at the gate instead — +${fmt(week1.queue)} a ` +
        `week (34 arriving, ${fmt(rhs)} reviewable), ${fmt(last.wip)} by week 12. There is no ` +
        `drain-the-queue button on this console; the queue is a signal that a gate is misplaced.`
    : temperament === 'rubber-stamp'
      ? `Parallel is the healthy shape. The level moved because the gated mix changed — the 96% ` +
        `class mostly left the denominator when it went below — which is itself a reading: an ` +
        `aggregate rate follows its mix.`
      : `Flat zero. Demand ${fmt(lhs)} a week under a ${fmt(rhs)} line leaves the queue nothing ` +
        `to say. The signal stopped because the terrain changed, not because anyone worked the ` +
        `pile down.`;

  return (
    <LabFrame
      tag="LAB 18·A — THE GATE CONSOLE"
      register="mechanism"
      question="Dependency patches eat 18 of your 30 weekly approvals at a 96% rate, the week's gated demand runs 34 against a 28.5 line, and the budget slider is locked. Fix the week without it."
      payoff={CONSOLE_PAYOFF}
      notes={CONSOLE_NOTES}
      cannotShow={CONSOLE_CANNOT}
      glass={CONSOLE_GLASS}
    >
      <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '0 0 8px' }}>
        The terms, from the handbook: four engineers share the steward role on rotation, and the
        on-call week carries a budget of 30 considered approvals. A 5% false-approval tolerance pays
        for saying no, so the sustainable line sits at 28.5. Four task classes feed the gates. Every
        control below is terrain — gate positions, and a budget you cannot touch.
      </p>

      <table className="mh-table">
        <thead>
          <tr>
            <th scope="col">class</th>
            <th scope="col">inflow /wk</th>
            <th scope="col">rate · last quarter</th>
            <th scope="col">gate</th>
            <th scope="col">claim on the line /wk</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c) => {
            const sampling = c.sampling ?? 0.1;
            return (
              <tr key={c.id}>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: CLASS_META[c.id]?.color,
                        flex: 'none',
                      }}
                    />
                    {c.label}
                  </span>
                </td>
                <td className="mono">{c.inflow}</td>
                <td className="mono">{pct(c.plausibility ?? c.quality)}</td>
                <td>
                  <div className="mh-chipset" role="group" aria-label={`Gate for ${c.label}`}>
                    <button
                      type="button"
                      className="mh-chip"
                      aria-pressed={c.gate === 'above'}
                      disabled={!committed1}
                      title={committed1 ? undefined : 'Commit to the arithmetic below first'}
                      onClick={() => setGate(c.id, 'above')}
                    >
                      above
                    </button>
                    <button
                      type="button"
                      className="mh-chip"
                      aria-pressed={c.gate === 'below'}
                      disabled={!committed1}
                      title={committed1 ? undefined : 'Commit to the arithmetic below first'}
                      onClick={() => setGate(c.id, 'below')}
                      aria-label={`Move ${c.label} below the gate: auto-apply with ${pct(sampling)} sampled deep review`}
                    >
                      below · {pct(sampling)} sample
                    </button>
                  </div>
                </td>
                <td className="mono">
                  {fmt(claimOf(c))}
                  {c.gate === 'below' ? ' (sampled)' : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!committed1 ? (
        <p className="mono" style={{ ...MONO_NOTE, color: 'var(--amber)' }}>
          the gate toggles go live after you commit to the arithmetic below.
        </p>
      ) : null}

      <div className="mh-controls" style={{ alignItems: 'flex-end', margin: '12px 0 4px' }}>
        <div className="mh-slider" style={{ width: 230 }}>
          <label htmlFor="gc-budget">
            <span className="locked">approval budget · LOCKED</span>
            <span>{BUDGET} /wk</span>
          </label>
          <input
            id="gc-budget"
            type="range"
            min="10"
            max="60"
            defaultValue={BUDGET}
            disabled
            aria-label={`Approval budget, locked at ${BUDGET} considered approvals per week`}
          />
        </div>
        <p style={{ fontSize: '12.5px', color: 'var(--ink-2)', margin: 0, maxWidth: 380 }}>
          <em>
            "Stewards aren't supposed to work harder; they're supposed to place the gates better."
          </em>
        </p>
      </div>

      <BudgetBar classes={classes} inequality={run.inequality} />

      <div className="mh-readout" role="group" aria-label="Console readouts">
        <div className="mh-stat">
          <span className="k">Gated demand /wk</span>
          <span className={ok ? 'v good' : 'v bad'}>{fmt(lhs)}</span>
        </div>
        <div className="mh-stat">
          <span className="k">The line</span>
          <span className="v">{fmt(rhs)}</span>
        </div>
        <div className="mh-stat">
          <span className="k">Spent /wk</span>
          <span className="v">{fmt(week1.budgetSpent)}</span>
        </div>
        <div className="mh-stat">
          <span className="k">Upstream time /wk</span>
          <span className={week1.upstreamFree > 0 ? 'v good' : 'v warn'}>
            {fmt(week1.upstreamFree)}
          </span>
        </div>
        <div className="mh-stat">
          <span className="k">Standing queue · wk 12</span>
          <span className={last.wip > 0 ? 'v bad' : 'v good'}>{fmt(last.wip)}</span>
        </div>
      </div>

      <div className="mh-feedback" aria-live="polite">
        {verdict}
      </div>

      <div style={{ margin: '14px 0 0' }}>
        <span className="mh-kicker" style={{ display: 'block', marginBottom: 4 }}>
          watch the quarter · two temperaments, two instruments
        </span>
        <div className="mh-chipset" role="group" aria-label="Which saturated temperament to watch">
          <button
            type="button"
            className="mh-chip"
            aria-pressed={temperament === 'rubber-stamp'}
            onClick={() => setTemperament('rubber-stamp')}
            aria-label="Watch the rubber-stamp temperament: recorded run, divergence chart"
          >
            rubber-stamp
          </button>
          <button
            type="button"
            className="mh-chip"
            aria-pressed={temperament === 'stall'}
            onClick={() => setTemperament('stall')}
            aria-label="Watch the stall temperament: recorded run, queue chart"
          >
            stall
          </button>
        </div>
        {temperament === 'rubber-stamp' ? (
          <>
            <RateChart run={run} caption={chartCaption} summary={chartSummary} />
            {!ok ? (
              <p className="mono" style={MONO_NOTE}>
                the drift behind the divergence is a modeling choice{' '}
                <Badge
                  layer="W"
                  note="slope and cap invented for a 12-week chart; the direction — rate up, agreement down under saturation — is the handbook claim"
                />{' '}
                · the glass below has the function
              </p>
            ) : null}
          </>
        ) : (
          <WipChart run={run} caption={chartCaption} summary={chartSummary} />
        )}
      </div>

      <Commit
        prompt="The handbook's move: patch-level bumps auto-merge on green CI, and what still reaches you is the 15% sample plus escalations. Dependency patches go below the gate. Where does the week's gated demand land against the 28.5 line?"
        options={COMMIT1_OPTIONS}
        onReveal={() => setCommitted1(true)}
      >
        {(picked) => <p style={{ margin: 0 }}>{COMMIT1_FEEDBACK[picked]}</p>}
      </Commit>

      {committed1 && depBelow ? (
        <div style={{ borderTop: '1px solid var(--line-soft)', marginTop: 16, paddingTop: 12 }}>
          <span
            className="mh-kicker"
            style={{ display: 'block', color: 'var(--amber)', marginBottom: 6 }}
          >
            the curveball · 99.7%
          </span>
          <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '0 0 10px' }}>
            The console now begs the same move twice. Flaky-test quarantine runs 99.7% — higher than
            the rate that just justified dep-patch — four proposals a week, every one of them
            greening CI. The arithmetic says move it. The 96% class earned that argument. Did this
            one?
          </p>
          <Commit
            prompt="99.7% over a full quarter. Trust earned, or rubber-stamping by another name?"
            options={COMMIT2_OPTIONS}
            onReveal={() => setCommitted2(true)}
          >
            {(picked) => <p style={{ margin: 0 }}>{COMMIT2_FEEDBACK[picked]}</p>}
          </Commit>
          {committed2 ? (
            <>
              <TriangulationPanels classes={classes} perClass={week1.perClass} />
              <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '12px 0 0' }}>
                96% was honest: deep review backs ~98 of 100 of what that gate passed, because the
                rate had quality underneath it. 99.7% is hollow: 79 of 100. The gate stays — and if
                you flip it anyway, watch the balance bar approve while the deep-review panel does
                not. The inequality counts proposals; only triangulation reads quality. An
                instrument's limits are part of reading it.
              </p>
              <p className="mono" style={{ ...MONO_NOTE, margin: '10px 0 0' }}>
                sandbox · all four gates stay free · every class above the gate reproduces the
                saturated quarter · the budget never moves
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </LabFrame>
  );
}
