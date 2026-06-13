// P14 — The gate. The economics of approval (handbook §3.5, §3.6, §3.8).
//
// One activity: the Gate Console. A balance beam draws the governing
// inequality — gated inflow per week on the left pan, the steward's fixed
// budget (the counterweight that never moves) on the right. Each proposal
// class sits above the gate (its full inflow lands on the left pan) or below
// it (only its sampled slice does). Toggle a class's gate and its weight
// slides between pans; the beam tips, smoothly. While the left pan outweighs
// the budget the system is saturated, and the divergence chart draws live:
// the approval rate inflating week over week while deep-review agreement sags
// beneath it — rubber-stamping, the rate going hollow. Balance the beam by
// moving the right gate and both lines snap back together.
//
// The curveball is the flaky-quarantine class: it shows the HIGHEST approval
// rate on the console (99.7%), so it reads safest to wave below the gate. A
// commit-before-reveal triangulates it — change-failure and rollback, the two
// metrics gaming can't also inflate — and exposes that deep review endorses
// only ~81% of it. The gate alone cannot see that.

import { useEffect, useMemo, useState } from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, ModelNotes, glassSlice } from '../components/kit.jsx';
import { simulateWeeks, defaultClasses } from '../engine/econ.js';
import { simulateMetricGaming } from '../engine/scenarios/goodhart.js';
import econSrc from '../engine/econ.js?raw';

const GLASS = glassSlice(econSrc, 'The governing inequality.', 'pathology = inequality.ok');

const SEED = 7; // a saturated run breaks toward rubber-stamping at this seed
const BUDGET = 30;
const TOLERANCE = 0.05;
const RHS = BUDGET * (1 - TOLERANCE); // 28.5 — the counterweight, locked

// Cast a color per class so the same hue carries the chip, its weight on the
// pan, and its row throughout.
const CAST = {
  'dep-patch': 'var(--c-deppatch)',
  'oncall-assist': 'var(--c-triage)',
  'doc-refresh': 'var(--c-docs)',
  'flaky-quarantine': 'var(--c-flaky)',
};

const pct = (x) => (x == null ? '—' : `${(x * 100).toFixed(1)}%`);
const fmt1 = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(1));

// Below this width the gate console's 5-column grid can't fit the gate pill, so
// each row collapses to a stacked card. matchMedia mirrors usePrefersReducedMotion.
const NARROW = '(max-width: 560px)';
function useNarrow() {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(NARROW).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return narrow;
}

/** Gated demand a class places on the budget given its gate side. */
function classLoad(c) {
  const sampling = c.sampling ?? 0.1;
  return c.gate === 'above' ? c.inflow : c.inflow * sampling;
}

/* ── The balance beam ─────────────────────────────────────────────────────
 * viewBox-scaled SVG. The fulcrum is fixed; the beam rotates by an angle that
 * grows with the imbalance (clamped), so saturation reads as a tilt at rest.
 * The left pan stacks the gated load; the right pan is the locked budget. */

function Beam({ classes, lhs }) {
  const W = 720;
  const H = 300;
  const cx = W / 2;
  const fulcrumY = 196;
  const beamLen = 460;
  // Tilt: down on the heavier side. Map the ratio lhs/RHS to a bounded angle
  // so even a large overload stays legible; balance sits flat at 0deg.
  const ratio = lhs / RHS;
  const angle = Math.max(-13, Math.min(13, (ratio - 1) * 26));
  const saturated = lhs > RHS;

  const rad = (angle * Math.PI) / 180;
  const leftX = cx - (beamLen / 2) * Math.cos(rad);
  const leftY = fulcrumY - 26 - (beamLen / 2) * Math.sin(rad);
  const rightX = cx + (beamLen / 2) * Math.cos(rad);
  const rightY = fulcrumY - 26 + (beamLen / 2) * Math.sin(rad);

  // Stack the above-gate classes onto the left pan as weighted blocks.
  const above = classes.filter((c) => c.gate === 'above');
  const below = classes.filter((c) => c.gate === 'below');
  const scale = 2.4; // px of block height per unit of weekly inflow

  let stackY = 0;
  const blocks = above.map((c) => {
    const h = c.inflow * scale;
    stackY += h;
    return { c, h, top: stackY };
  });
  // sampled slices that still reach the steward from below-gate classes
  const sampledLoad = below.reduce((s, c) => s + classLoad(c), 0);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={
        `Approval balance beam. Gated inflow ${fmt1(lhs)} approvals a week on the left pan ` +
        `against a locked budget of ${RHS} on the right. ` +
        (saturated
          ? `The left pan is heavier: the steward is saturated by ${fmt1(lhs - RHS)} a week.`
          : `The beam is balanced with ${fmt1(RHS - lhs)} a week of budget to spare.`)
      }
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* the inequality, stated once across the top */}
      <text
        x={cx}
        y={26}
        textAnchor="middle"
        fontSize="12.5"
        fill="var(--ink-faint)"
        fontFamily="var(--font-mono)"
      >
        gated inflow / week ≤ budget × (1 − tolerance)
      </text>

      {/* the post and fulcrum */}
      <polygon
        points={`${cx},${fulcrumY - 26} ${cx - 22},${fulcrumY + 40} ${cx + 22},${fulcrumY + 40}`}
        fill="var(--line)"
        stroke="var(--ink-faint)"
        strokeWidth="1"
      />

      {/* the beam, rotating about the fulcrum */}
      <g
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: `${cx}px ${fulcrumY - 26}px`,
          transition: 'transform 0.55s cubic-bezier(.34,1.4,.5,1)',
        }}
      >
        <line
          x1={cx - beamLen / 2}
          y1={fulcrumY - 26}
          x2={cx + beamLen / 2}
          y2={fulcrumY - 26}
          stroke={saturated ? 'var(--red)' : 'var(--accent-ink)'}
          strokeWidth="5"
          strokeLinecap="round"
          style={{ transition: 'stroke 0.4s' }}
        />
        <circle cx={cx} cy={fulcrumY - 26} r="5.5" fill="var(--ink-faint)" />
      </g>

      {/* LEFT PAN — the gated inflow, stacked by class. Pan position follows
          the beam angle but the stack draws upright (a real scale's pan). */}
      <g style={{ transition: 'transform 0.55s cubic-bezier(.34,1.4,.5,1)' }}>
        <line
          x1={leftX}
          y1={leftY}
          x2={leftX}
          y2={leftY + 24}
          stroke="var(--ink-faint)"
          strokeWidth="1"
        />
        {blocks.map(({ c, h, top }) => (
          <rect
            key={c.id}
            x={leftX - 38}
            y={leftY + 24 + (stackY - top)}
            width={76}
            height={Math.max(2, h - 2)}
            rx={3}
            fill={CAST[c.id]}
            fillOpacity="0.82"
            stroke={CAST[c.id]}
            strokeWidth="1"
            style={{ transition: 'all 0.5s' }}
          >
            <title>
              {c.label}: {c.inflow}/week, above the gate
            </title>
          </rect>
        ))}
        {/* sampled load from below-gate classes — a thin ghost block */}
        {sampledLoad > 0 ? (
          <rect
            x={leftX - 38}
            y={leftY + 24 + stackY}
            width={76}
            height={Math.max(2, sampledLoad * scale)}
            rx={3}
            fill="var(--ink-faint)"
            fillOpacity="0.4"
            style={{ transition: 'all 0.5s' }}
          >
            <title>sampled deep reviews from below-gate classes: {fmt1(sampledLoad)}/week</title>
          </rect>
        ) : null}
        <text
          x={leftX}
          y={leftY + 24 + stackY + Math.max(2, sampledLoad * scale) + 18}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill={saturated ? 'var(--red)' : 'var(--ink)'}
          fontFamily="var(--font-mono)"
          style={{ transition: 'fill 0.4s' }}
        >
          {fmt1(lhs)}
        </text>
        <text
          x={leftX}
          y={leftY + 24 + stackY + Math.max(2, sampledLoad * scale) + 32}
          textAnchor="middle"
          fontSize="10"
          fill="var(--ink-faint)"
          fontFamily="var(--font-mono)"
        >
          gated inflow
        </text>
      </g>

      {/* RIGHT PAN — the budget. A single fixed counterweight that never moves. */}
      <g>
        <line
          x1={rightX}
          y1={rightY}
          x2={rightX}
          y2={rightY + 24}
          stroke="var(--ink-faint)"
          strokeWidth="1"
        />
        <rect
          x={rightX - 38}
          y={rightY + 24}
          width={76}
          height={RHS * scale}
          rx={3}
          fill="none"
          stroke="var(--ink-2)"
          strokeWidth="1.6"
          strokeDasharray="5 4"
        />
        <text
          x={rightX}
          y={rightY + 24 + RHS * scale + 18}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="var(--ink)"
          fontFamily="var(--font-mono)"
        >
          {RHS}
        </text>
        <text
          x={rightX}
          y={rightY + 24 + RHS * scale + 32}
          textAnchor="middle"
          fontSize="10"
          fill="var(--ink-faint)"
          fontFamily="var(--font-mono)"
        >
          budget · locked
        </text>
      </g>

      {/* the verdict, centered under the fulcrum */}
      <text
        x={cx}
        y={fulcrumY + 62}
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill={saturated ? 'var(--red)' : 'var(--accent-ink)'}
        fontFamily="var(--font-mono)"
        style={{ transition: 'fill 0.4s' }}
      >
        {saturated
          ? `saturated — ${fmt1(lhs - RHS)} over budget`
          : `balanced — ${fmt1(RHS - lhs)} to spare`}
      </text>
    </svg>
  );
}

/* ── The divergence chart ─────────────────────────────────────────────────
 * Drawn only while saturated. Approval rate climbs as the bar erodes; deep-
 * review agreement sags beneath it. The gap between them IS the rubber-stamp.
 * Balanced runs draw both lines flat and together. */

function Divergence({ weeks }) {
  const W = 720;
  const H = 168;
  const padL = 40;
  const padR = 86;
  const padT = 16;
  const padB = 24;
  const n = weeks.length;
  const lo = 0.7;
  const hi = 1.0;

  const x = (w) => padL + ((w - 1) / (n - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);

  const series = (key) =>
    weeks
      .filter((wk) => wk[key] != null)
      .map((wk) => `${x(wk.week)},${y(wk[key])}`)
      .join(' ');

  const last = weeks.at(-1);
  const gap =
    last.approvalRate != null && last.deepReviewAgreement != null
      ? last.approvalRate - last.deepReviewAgreement
      : 0;
  const diverging = gap > 0.02;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={
        diverging
          ? `Divergence chart over ${n} weeks: the approval rate climbed to ${pct(
              last.approvalRate,
            )} while deep-review agreement sank to ${pct(
              last.deepReviewAgreement,
            )} — a ${pct(gap)} gap, the rubber-stamp drawn.`
          : `Divergence chart over ${n} weeks: approval rate and deep-review agreement hold together near ${pct(
              last.approvalRate,
            )} — no rubber-stamp.`
      }
      style={{ width: '100%', height: 'auto', display: 'block', marginTop: 6 }}
    >
      {[0.7, 0.8, 0.9, 1.0].map((v) => (
        <g key={v}>
          <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="var(--line-soft)" />
          <text
            x={padL - 6}
            y={y(v) + 3}
            textAnchor="end"
            fontSize="9.5"
            fill="var(--ink-faint)"
            fontFamily="var(--font-mono)"
          >
            {v.toFixed(1)}
          </text>
        </g>
      ))}

      {/* the gap, shaded when the two lines part */}
      {diverging ? (
        <path
          d={
            `M ${weeks.map((wk) => `${x(wk.week)} ${y(wk.approvalRate)}`).join(' L ')} ` +
            `L ${[...weeks]
              .reverse()
              .map((wk) => `${x(wk.week)} ${y(wk.deepReviewAgreement)}`)
              .join(' L ')} Z`
          }
          fill="var(--red)"
          fillOpacity="0.1"
          stroke="none"
        />
      ) : null}

      {/* deep-review agreement — what survives a second look */}
      <polyline
        points={series('deepReviewAgreement')}
        fill="none"
        stroke="var(--blue)"
        strokeWidth="2.4"
        style={{ transition: 'all 0.3s' }}
      />
      {/* gate-depth approval rate — what the steward signs */}
      <polyline
        points={series('approvalRate')}
        fill="none"
        stroke={diverging ? 'var(--red)' : 'var(--accent-ink)'}
        strokeWidth="2.4"
        style={{ transition: 'all 0.3s' }}
      />

      {/* end labels */}
      <text
        x={W - padR + 6}
        y={y(last.approvalRate) + 3}
        fontSize="10.5"
        fontWeight="700"
        fill={diverging ? 'var(--red)' : 'var(--accent-ink)'}
        fontFamily="var(--font-mono)"
      >
        approves {pct(last.approvalRate)}
      </text>
      <text
        x={W - padR + 6}
        y={y(last.deepReviewAgreement) + 3}
        fontSize="10.5"
        fontWeight="700"
        fill="var(--blue)"
        fontFamily="var(--font-mono)"
      >
        endorses {pct(last.deepReviewAgreement)}
      </text>
      <text x={padL} y={H - 6} fontSize="9.5" fill="var(--ink-faint)" fontFamily="var(--font-mono)">
        12 weeks under sustained inflow →
      </text>
    </svg>
  );
}

/* ── The triangulation reveal ──────────────────────────────────────────────
 * The flaky-quarantine class reads 99.7% at the gate — the highest on the
 * console, so it looks safest to move below. Commit, then triangulate: deep
 * review endorses far less, because quarantining a flaky test always turns CI
 * green whether the test was noise or a real regression. */

const SAFEST_OPTIONS = [
  { id: 'flaky', label: 'Flaky-test quarantine — 99.7%' },
  { id: 'doc', label: 'Doc refresh — 93%' },
  { id: 'oncall', label: 'On-call assist — 88%' },
];

/* ── The console rows ──────────────────────────────────────────────────── */

function ClassRow({ c, rate, onToggle, narrow }) {
  const dot = (
    <span
      aria-hidden="true"
      style={{ width: 10, height: 10, borderRadius: 3, background: CAST[c.id] }}
    />
  );
  const label = <span style={{ fontWeight: 500 }}>{c.label}</span>;
  const inflow = (
    <span className="mono" style={{ color: 'var(--ink-faint)' }}>
      {c.inflow}/wk
    </span>
  );
  const approves = (
    <span className="mono" style={{ color: 'var(--ink-2)', minWidth: 52, textAlign: 'right' }}>
      {pct(rate)}
    </span>
  );
  const gate = (
    <button
      type="button"
      className="mh-chip"
      aria-pressed={c.gate === 'below'}
      data-testid={`gate-${c.id}`}
      onClick={() => onToggle(c.id)}
      style={{ minWidth: 132 }}
    >
      {c.gate === 'above' ? 'above gate — steward' : 'below gate — sampled'}
    </button>
  );

  // Below 560px the 5-column grid can't hold the gate pill, so stack: label on
  // line 1, then inflow / approves / gate on line 2 — nothing overruns.
  if (narrow) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '10px',
          borderBottom: '1px solid var(--line-soft)',
          fontSize: 13.5,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {dot}
          {label}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {inflow}
          {approves}
          {gate}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '12px 1fr auto auto auto',
        alignItems: 'center',
        gap: 12,
        padding: '7px 10px',
        borderBottom: '1px solid var(--line-soft)',
        fontSize: 13.5,
      }}
    >
      {dot}
      {label}
      {inflow}
      {approves}
      {gate}
    </div>
  );
}

/* ── The page ──────────────────────────────────────────────────────────── */

export default function P14() {
  const [classes, setClasses] = useState(defaultClasses);
  const [picked, setPicked] = useState(null);
  const narrow = useNarrow();

  const run = useMemo(
    () => simulateWeeks({ classes, budget: BUDGET, seed: SEED, tolerance: TOLERANCE }),
    [classes],
  );
  const { weeks, inequality } = run;
  const saturated = !inequality.ok;

  // Per-class gate-depth approval rate, read from week 1 of the run.
  const rateOf = (id) => weeks[0].perClass.find((p) => p.id === id)?.rate;
  // The flaky class's true deep-review agreement — the hollow rate.
  const flakyAgreement = weeks[0].perClass.find((p) => p.id === 'flaky-quarantine')?.agreement;

  const toggle = (id) =>
    setClasses((cs) =>
      cs.map((c) => (c.id === id ? { ...c, gate: c.gate === 'above' ? 'below' : 'above' } : c)),
    );

  const commit = (id) => {
    if (picked === null) setPicked(id);
  };

  return (
    <Page n={14} claim="The budget is the constant; the gate is the lever.">
      <Activity wide>
        <Beam classes={classes} lhs={inequality.lhs} />

        {/* the console: class rows, then the locked budget slider */}
        <div
          style={{
            border: '1px solid var(--line-soft)',
            borderRadius: 10,
            background: 'var(--paper)',
            margin: '10px 0',
          }}
          role="group"
          aria-label="Gate console"
        >
          {/* The grid-aligned column header only makes sense for the 5-column
              row layout; when rows stack, it would float over nothing. */}
          {narrow ? null : (
            <div
              className="mono"
              style={{
                display: 'grid',
                gridTemplateColumns: '12px 1fr auto auto auto',
                gap: 12,
                padding: '8px 10px 6px',
                fontSize: 10.5,
                color: 'var(--ink-faint)',
                borderBottom: '1px solid var(--line-soft)',
              }}
            >
              <span />
              <span>class</span>
              <span>inflow</span>
              <span style={{ textAlign: 'right' }}>approves</span>
              <span style={{ textAlign: 'center' }}>gate</span>
            </div>
          )}
          {classes.map((c) => (
            <ClassRow key={c.id} c={c} rate={rateOf(c.id)} onToggle={toggle} narrow={narrow} />
          ))}
          <div className="mh-slider" style={{ padding: '10px 12px 12px' }}>
            <label htmlFor="p14-budget">
              <span>steward budget · approvals per week</span>
              <span className="mono locked">🔒 {BUDGET}</span>
            </label>
            <input
              id="p14-budget"
              type="range"
              min="10"
              max="50"
              value={BUDGET}
              disabled
              aria-disabled="true"
              aria-valuetext={`locked at ${BUDGET} approvals per week`}
            />
            <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
              locked — stewards aren&apos;t supposed to work harder; they place the gates better.
            </span>
          </div>
        </div>

        <div className="mh-readout" role="group" aria-label="Console readouts" aria-live="polite">
          <div className="mh-stat">
            <span className="k">Gated inflow</span>
            <span className={saturated ? 'v bad' : 'v good'}>{fmt1(inequality.lhs)}/wk</span>
          </div>
          <div className="mh-stat">
            <span className="k">Budget line</span>
            <span className="v">{inequality.rhs}/wk</span>
          </div>
          <div className="mh-stat">
            <span className="k">Approval rate, wk 12</span>
            <span className={saturated ? 'v bad' : 'v good'}>{pct(weeks.at(-1).approvalRate)}</span>
          </div>
          <div className="mh-stat">
            <span className="k">Deep-review endorses</span>
            <span className={saturated ? 'v warn' : 'v good'}>
              {pct(weeks.at(-1).deepReviewAgreement)}
            </span>
          </div>
        </div>

        <Divergence weeks={weeks} />

        <p
          className="mh-feedback"
          aria-live="polite"
          data-testid="verdict"
          style={{ margin: '4px 0 0' }}
        >
          {saturated ? (
            <>
              Saturated by {fmt1(inequality.lhs - inequality.rhs)} a week. The rate inflates to{' '}
              <strong>{pct(weeks.at(-1).approvalRate)}</strong> while deep review endorses only{' '}
              <strong>{pct(weeks.at(-1).deepReviewAgreement)}</strong> — the gap is the
              rubber-stamp. Move a high-rate class below the gate to balance the beam.
            </>
          ) : (
            <>
              Balanced, {fmt1(inequality.rhs - inequality.lhs)} a week to spare. Approval and
              deep-review agreement hold together near{' '}
              <strong>{pct(weeks.at(-1).approvalRate)}</strong>. The reclaimed budget buys time
              upstream — no one worked harder; the gate moved.
            </>
          )}
        </p>

        {/* the curveball: 99.7% looks safest. triangulate before you trust it. */}
        <div className="mh-commit" data-testid="triangulate">
          <span className="mh-kicker">Predict first</span>
          <p style={{ margin: '0 0 10px' }}>
            One class reads highest on the console. Which is safest to wave below the gate?
          </p>
          <div className="mh-chipset" role="group" aria-label="Pick the safest class to delegate">
            {SAFEST_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                className="mh-chip"
                aria-pressed={picked === o.id}
                disabled={picked !== null && picked !== o.id}
                onClick={() => commit(o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
          {picked !== null ? (
            <div className="mh-feedback" data-testid="triangulate-feedback">
              {picked === 'flaky' ? (
                <p style={{ margin: '0 0 8px' }}>
                  The obvious read, and the trap. 99.7% is the gate-depth rate. Triangulate it:
                </p>
              ) : (
                <p style={{ margin: '0 0 8px' }}>
                  A defensible pick — but the console&apos;s highest rate is the flaky-test
                  quarantine at {pct(rateOf('flaky-quarantine'))}. Triangulate that one before you
                  trust the number:
                </p>
              )}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 8,
                  margin: '0 0 8px',
                }}
              >
                {[
                  ['gate approves', pct(rateOf('flaky-quarantine')), 'var(--accent-ink)'],
                  ['deep review endorses', pct(flakyAgreement), 'var(--red)'],
                  ['the gap', pct(rateOf('flaky-quarantine') - flakyAgreement), 'var(--amber)'],
                ].map(([k, v, color]) => (
                  <div
                    key={k}
                    style={{
                      border: '1px solid var(--line-soft)',
                      borderRadius: 8,
                      padding: '8px 10px',
                    }}
                  >
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>
                      {k}
                    </div>
                    <div className="mono" style={{ fontSize: 17, fontWeight: 700, color }}>
                      {v}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ margin: 0 }}>
                Quarantining a flaky test turns CI green whether it was noise or a real regression,
                so it always looks approvable. A single number can&apos;t catch that; a second,
                independent one can.
              </p>
            </div>
          ) : null}
        </div>

        <ModelNotes
          register="mechanism"
          notes={[
            'The inequality is a property of the terrain, not the week: it holds or fails for the whole run by where the gates sit. Saturation produces exactly one pathology, fixed by the seed — rubber-stamp here.',
            "The rubber-stamp slope and cap are the author's bet, drawn (Ⓦ): the direction (rate up, agreement down under sustained saturation) is the handbook's claim; the rate of erosion is invented so the divergence fits a 12-week chart.",
            'The budget slider is deliberately disabled. There is no "work harder" parameter in the engine, by design — the only healthy lever is the gate.',
          ]}
          cannotShow="The real cost of a missed regression that the flaky class quietly buried. The model knows the hidden quality because it set it; a steward never gets that number for free — only the triangulating metrics that hint at it."
          glass={GLASS}
        />
      </Activity>

      <Seen>
        Moving the dependency-patch class below the gate drops gated inflow from{' '}
        {fmt1(simulateWeeks({ seed: SEED }).inequality.lhs)} to under the {RHS} budget line, and the
        approval and deep-review lines that had parted snap back together — without the budget ever
        moving.
      </Seen>

      <Takeaway>
        When the budget saturates, the rate going hollow is a signal, not a solution; the fix is
        always structural — move a gate, never work harder.
      </Takeaway>

      <Deeper title="What goes wrong with the human in the role">
        <p>
          The steward&apos;s role is harder than it looks, and the failure modes are well documented
          in fields that automated decades before software did. Aviation and medicine converged on
          the same four, and they transfer. <Badge layer="E" note="aviation + medical literature" />
        </p>
        <table className="mh-table">
          <thead>
            <tr>
              <th>Failure</th>
              <th>What it looks like at the gate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Automation bias</td>
              <td>
                When a system is mostly right, humans stop checking. High volume + high approval
                rate drifts here unnoticed — exactly the saturated-steward state above.
              </td>
            </tr>
            <tr>
              <td>Skill atrophy on rare failures</td>
              <td>
                The cases that need a human are rare by construction — the very cases the human now
                has least practice on.
              </td>
            </tr>
            <tr>
              <td>Monitoring fatigue</td>
              <td>
                Watching a system that mostly works is harder than working. Anomalies that jump out
                to a fresh observer slide past a saturated one.
              </td>
            </tr>
            <tr>
              <td>Substitution illusion</td>
              <td>
                Automation changes the shape of the work, not its amount. The steward role is a
                different job, not a smaller one.
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          <strong>The defense isn&apos;t willpower; it&apos;s terrain.</strong> Triangulation
          (multiple metrics, sampled deep review, adversarial probing) catches what a tired steward
          misses. Rotation stops one person carrying the role too long. Practice cases keep skills
          warm even when none arrive. Budgeted time upstream is what makes the role sustainable. The
          steward&apos;s job is to build a system in which the human can succeed.
        </p>
      </Deeper>

      <Deeper title="Measure little, triangulate — the Goodhart pair">
        <p>
          Every metric is a proxy, and every proxy can be gamed. The flaky class above is a
          single-axis trap: the gate-depth rate was a proxy for quality, and the proxy got fed. The
          rule <Badge layer="W" />: if a metric will be a target, add at least two independent
          metrics that gaming it would harm.
        </p>
        <p style={{ margin: '10px 0 4px', fontWeight: 600 }}>
          One target vs three — the same 16 weeks of gaming pressure
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          <GoodhartSpark
            label="Velocity alone"
            caption="The target climbs ~80%; the panel calls it progress. The real-quality line it does not carry sags off-chart."
            series={GOODHART.single}
            target
          />
          <GoodhartSpark
            label="Velocity + change-failure + rollback"
            caption="The same climb, but by week 10 change-failure has crossed twice baseline in plain view; auto-merge is pulled and the gamed gains give back."
            series={GOODHART.tri}
          />
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--ink-faint)' }}>
          Triangulation does not prevent gaming — nothing does. It makes the gaming a visible cost,
          in metrics the gamer can&apos;t also inflate, soon enough to act on. Covers §3.5 the
          steward, §3.6 gate/rate/budget, §3.8 measurement.
        </p>
      </Deeper>
    </Page>
  );
}

/* ── Goodhart sparklines (fold-only) ──────────────────────────────────────
 * A tiny twin-spark from the recorded Goodhart bench: velocity (the gamed
 * target) against the real-outcome line that gaming actually damages. */

const GOODHART = {
  single: simulateMetricGaming(7, { triangulated: false }).weeks,
  tri: simulateMetricGaming(7, { triangulated: true }).weeks,
};

function GoodhartSpark({ label, caption, series, target }) {
  const W = 240;
  const H = 84;
  const padL = 6;
  const padR = 6;
  const padT = 8;
  const padB = 8;
  const n = series.length;
  const vMax = Math.max(...series.map((w) => w.velocity));
  const x = (w) => padL + ((w - 1) / (n - 1)) * (W - padL - padR);
  const yVel = (v) => padT + (1 - v / vMax) * (H - padT - padB);
  const yRate = (v) => padT + (1 - v) * (H - padT - padB); // 0..1 outcome
  const vel = series.map((w) => `${x(w.week)},${yVel(w.velocity)}`).join(' ');
  const out = series.map((w) => `${x(w.week)},${yRate(w.sampledOutcome)}`).join(' ');
  const detectWeek = target ? null : (series.find((w) => w.changeFailure >= 0.08)?.week ?? null);

  return (
    <div style={{ border: '1px solid var(--line-soft)', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{label}</div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${label}: velocity against real deep-review outcome over ${n} weeks.`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {detectWeek ? (
          <line
            x1={x(detectWeek)}
            x2={x(detectWeek)}
            y1={padT}
            y2={H - padB}
            stroke="var(--amber)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
        ) : null}
        <polyline points={vel} fill="none" stroke="var(--c-deppatch)" strokeWidth="2" />
        <polyline points={out} fill="none" stroke="var(--blue)" strokeWidth="2" />
      </svg>
      <div
        className="mono"
        style={{
          display: 'flex',
          gap: 12,
          fontSize: 10,
          color: 'var(--ink-faint)',
          margin: '4px 0 6px',
        }}
      >
        <span style={{ color: 'var(--c-deppatch)' }}>— velocity (target)</span>
        <span style={{ color: 'var(--blue)' }}>— real outcome</span>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-2)' }}>{caption}</p>
    </div>
  );
}
