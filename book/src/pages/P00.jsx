// P00 — Read me first. The book in one line, and how to read the marks.
//
// The Activity is the hero: an ambient ops-floor terrain (salvaged and trimmed
// from labs/Hero.jsx). Faint contour lines are the terrain — the constant. The
// cast's maintenance loops are closed circuits in their colors, each with a
// traveling pulse; signals fade in the terrain; once per 12s cycle a PR card
// slides the dependency-patch circuit to the gate, the CI dots go green, and a
// small human glyph stamps the approval. Tiny against the terrain, on purpose.
//
// Every keyframed element's BASE state (no animation) is the gate moment: card
// at the gate, CI verified, stamp down. book.css collapses animation to a 1ms
// no-fill iteration under reduced motion, so the scene rests on that fully
// labeled frame; negative delays start motion visitors mid-cycle on it too.
//
// Beneath the scene, the page's one interaction: the epistemic legend. Select a
// mark (Ⓔ/Ⓦ/Ⓜ, ●/○) to pin what it means — the marks recur throughout the book,
// so reading them is "how to use it."

import React from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';

const { useState } = React;
const TAU = Math.PI * 2;

// A wobbled closed contour: midpoint-quadratic smoothing over a cosine-
// perturbed ellipse. Deterministic phases, so the terrain never shifts.
function contourPath(cx, cy, rx, ry, phase) {
  const n = 16;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const w = 1 + 0.14 * Math.cos(3 * a + phase) + 0.08 * Math.sin(5 * a + phase * 1.7);
    pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]);
  }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M ${m0[0].toFixed(1)} ${m0[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    d += ` Q ${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  return `${d} Z`;
}

// Two peaks, two broad saddles. `soft` drops to the fainter line.
const CONTOURS = [
  { d: contourPath(140, 320, 36, 24, 0.4) },
  { d: contourPath(140, 320, 70, 46, 1.3) },
  { d: contourPath(140, 320, 106, 68, 2.1), soft: true },
  { d: contourPath(140, 320, 144, 92, 2.9), soft: true },
  { d: contourPath(640, 70, 30, 20, 1.1) },
  { d: contourPath(640, 70, 60, 40, 2.0) },
  { d: contourPath(640, 70, 92, 60, 0.2), soft: true },
  { d: contourPath(640, 70, 126, 82, 1.7), soft: true },
  { d: contourPath(390, 205, 290, 160, 2.5), soft: true },
  { d: contourPath(390, 205, 350, 196, 0.8), soft: true },
];

// The cast circuits beyond the featured dependency-patch loop. Each carries a
// traveling pulse; dash/cycle ≈ the shape's circumference so it loops clean.
const MINOR_LOOPS = [
  { cx: 668, cy: 312, rx: 54, ry: 30, color: 'var(--c-docs)', c: -269, dur: '9s', del: '-2s' },
  { cx: 72, cy: 64, rx: 30, ry: 30, color: 'var(--c-security)', c: -189, dur: '8s', del: '-5s' },
  { cx: 296, cy: 352, rx: 58, ry: 24, color: 'var(--c-flaky)', c: -269, dur: '11s', del: '-3s' },
  { cx: 688, cy: 196, rx: 38, ry: 22, color: 'var(--c-backfill)', c: -192, dur: '10s', del: '-7s' },
  { cx: 250, cy: 52, rx: 24, ry: 24, color: 'var(--c-deadcode)', c: -151, dur: '13s', del: '-1s' },
  { cx: 348, cy: 48, rx: 34, ry: 18, color: 'var(--c-triage)', c: -167, dur: '9.5s', del: '-4s' },
];

// Signals in the terrain: position, size, cast color, pulse timing.
const SIGNALS = [
  { x: 76, y: 236, r: 3, color: 'var(--c-deppatch)', dur: '3.8s', del: '-1s' },
  { x: 96, y: 262, r: 2.6, color: 'var(--c-triage)', dur: '4.6s', del: '-2.2s' },
  { x: 64, y: 284, r: 2.4, color: 'var(--c-deppatch)', dur: '3.2s', del: '-0.6s' },
  { x: 160, y: 210, r: 2.6, color: 'var(--c-deppatch)', dur: '5s', del: '-3s' },
  { x: 628, y: 246, r: 2.8, color: 'var(--c-docs)', dur: '4.2s', del: '-1.8s' },
  { x: 330, y: 318, r: 2.6, color: 'var(--c-flaky)', dur: '3.6s', del: '-2.6s' },
  { x: 700, y: 152, r: 2.6, color: 'var(--c-backfill)', dur: '4.8s', del: '-0.9s' },
  { x: 206, y: 364, r: 2.8, color: 'var(--c-triage)', dur: '4s', del: '-3.4s' },
  { x: 560, y: 322, r: 2.4, color: 'var(--c-deadcode)', dur: '5.2s', del: '-1.4s' },
  { x: 438, y: 338, r: 2.6, color: 'var(--c-deppatch)', dur: '4.4s', del: '-2s' },
];

// The dependency-patch circuit: rounded rect, perimeter ≈ 1272; the 16px flow
// pulse travels it once per cycle.
const MAIN_CIRCUIT =
  'M 148 110 H 572 A 28 28 0 0 1 600 138 V 262 A 28 28 0 0 1 572 290 ' +
  'H 148 A 28 28 0 0 1 120 262 V 138 A 28 28 0 0 1 148 110 Z';

const STAGE_CSS = `
  .p00-stage svg { display: block; width: 100%; height: auto; }
  .p00-stage text { font-family: var(--font-mono); }
  .p00-lbl { font-size: 9.5px; letter-spacing: 0.14em; fill: var(--ink-faint); }
  .p00-tag { font-size: 8.5px; letter-spacing: 0.1em; fill: var(--ink-faint); }
  .p00-loopname { font-size: 8.5px; letter-spacing: 0.1em; }
  .p00-flow { animation: p00Flow var(--dur, 12s) linear var(--del, 0s) infinite; }
  .p00-sig {
    animation: p00Sig var(--dur, 4s) ease-in-out var(--del, 0s) infinite;
    transform-box: fill-box; transform-origin: center;
  }
  .p00-card { animation: p00Card 12s ease-in-out -7.6s infinite; }
  .p00-ci-a { animation: p00CiA 12s linear -7.6s infinite; }
  .p00-ci-b { animation: p00CiB 12s linear -7.6s infinite; }
  .p00-ci-c { animation: p00CiC 12s linear -7.6s infinite; }
  .p00-mark {
    animation: p00Mark 12s ease-out -7.6s infinite;
    transform-box: fill-box; transform-origin: center;
  }
  .p00-steward { animation: p00Steward 12s ease-in-out -7.6s infinite; }
  .p00-ring {
    animation: p00Ring 12s ease-out -7.6s infinite;
    transform-box: fill-box; transform-origin: center;
  }
  @keyframes p00Flow { to { stroke-dashoffset: var(--c, -1272); } }
  @keyframes p00Sig {
    0%, 100% { opacity: 0.22; transform: scale(0.85); }
    50% { opacity: 0.95; transform: scale(1.3); }
  }
  @keyframes p00Card {
    0% { transform: translateX(-280px); opacity: 0; }
    6% { opacity: 1; }
    30% { transform: translateX(0); }
    80% { transform: translateX(0); opacity: 1; }
    88% { transform: translateX(104px); opacity: 1; }
    93%, 100% { transform: translateX(126px); opacity: 0; }
  }
  @keyframes p00CiA { 0%, 36% { opacity: 0; } 39%, 90% { opacity: 1; } 94%, 100% { opacity: 0; } }
  @keyframes p00CiB { 0%, 42% { opacity: 0; } 45%, 90% { opacity: 1; } 94%, 100% { opacity: 0; } }
  @keyframes p00CiC { 0%, 48% { opacity: 0; } 51%, 90% { opacity: 1; } 94%, 100% { opacity: 0; } }
  @keyframes p00Mark {
    0%, 58% { opacity: 0; transform: scale(1.9); }
    62%, 100% { opacity: 1; transform: scale(1); }
  }
  @keyframes p00Steward {
    0%, 52% { transform: translateY(-3px); }
    58%, 82% { transform: translateY(0); }
    88%, 100% { transform: translateY(-3px); }
  }
  @keyframes p00Ring {
    0%, 64% { transform: scale(0.25); opacity: 0; }
    68% { opacity: 0.5; }
    82%, 100% { transform: scale(3.4); opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .p00-stage svg * { animation: none !important; }
  }
`;

// The legend the reader takes into every later page. Selecting a mark pins its
// meaning — the page's one interaction, and the "how to use it" of the brief.
const LEGEND = [
  {
    id: 'E',
    glyph: 'Ⓔ',
    cls: 'mh-badge-e',
    name: 'Evidence-backed',
    gloss: 'research or hard-won industrial experience holds it up.',
  },
  {
    id: 'W',
    glyph: 'Ⓦ',
    cls: 'mh-badge-w',
    name: 'Working design principle',
    gloss: 'the best framing I have, not yet settled science.',
  },
  {
    id: 'M',
    glyph: 'Ⓜ',
    cls: 'mh-badge-m',
    name: 'Organizing metaphor',
    gloss: 'it clarifies thinking; it is not a theorem.',
  },
  {
    id: 'real',
    glyph: '●',
    cls: 'mh-mark-real',
    name: 'Documented-real',
    gloss: 'a specimen that actually happened, drawn from a real run.',
  },
  {
    id: 'made',
    glyph: '○',
    cls: 'mh-mark-made',
    name: 'Constructed',
    gloss: 'shaped for teaching; true to the pattern, not a record.',
  },
];

function HeroScene() {
  return (
    <figure className="p00-stage" style={{ margin: 0 }}>
      <style>{STAGE_CSS}</style>
      <svg
        viewBox="0 0 760 400"
        role="img"
        aria-label="An ops-floor terrain map: faint contour lines, six maintenance loops drawn as
          closed circuits pulsing in their cast colors, signals fading in the terrain. On the
          dependency-patch circuit a PR card waits at the gate; the CI dots have gone green and a
          small human figure stamps the approval. The five loop stages are labeled signal, action,
          verification, commit or revert, and update."
      >
        {/* Terrain: the contour lines. Static — the terrain is the constant. */}
        <g fill="none" strokeWidth="1">
          {CONTOURS.map((c, i) => (
            <path key={i} d={c.d} stroke={c.soft ? 'var(--line-soft)' : 'var(--line)'} />
          ))}
        </g>

        {/* The cast's circuits: faint closed loops, each with a traveling pulse. */}
        {MINOR_LOOPS.map((l, i) => (
          <g key={i}>
            <ellipse
              cx={l.cx}
              cy={l.cy}
              rx={l.rx}
              ry={l.ry}
              fill="none"
              stroke={l.color}
              strokeOpacity="0.35"
              strokeWidth="1.2"
            />
            <ellipse
              className="p00-flow"
              style={{ '--c': l.c, '--dur': l.dur, '--del': l.del }}
              cx={l.cx}
              cy={l.cy}
              rx={l.rx}
              ry={l.ry}
              fill="none"
              stroke={l.color}
              strokeOpacity="0.85"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeDasharray={`10 ${Math.abs(l.c) - 10}`}
            />
          </g>
        ))}

        {/* Signals in the terrain: pulsing, fading, in their cast colors. */}
        {SIGNALS.map((s, i) => (
          <circle
            key={i}
            className="p00-sig"
            style={{ '--dur': s.dur, '--del': s.del }}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={s.color}
            opacity="0.55"
          />
        ))}

        {/* The featured circuit: the dependency-patch loop. */}
        <path
          d={MAIN_CIRCUIT}
          fill="none"
          stroke="var(--c-deppatch)"
          strokeOpacity="0.5"
          strokeWidth="1.5"
        />
        <path
          className="p00-flow"
          style={{ '--c': -1272, '--dur': '12s', '--del': '-7.6s' }}
          d={MAIN_CIRCUIT}
          fill="none"
          stroke="var(--c-deppatch)"
          strokeOpacity="0.9"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="16 1256"
        />

        {/* Stage 1 — a signal in the terrain fires the loop. */}
        <path
          d="M 88 266 L 118 232"
          stroke="var(--c-deppatch)"
          strokeOpacity="0.5"
          strokeWidth="1"
          strokeDasharray="2 4.5"
          fill="none"
        />
        <text className="p00-lbl" x="108" y="206" textAnchor="end">
          1 · SIGNAL
        </text>

        {/* Stage 2 — where the card sets out. */}
        <text className="p00-lbl" x="148" y="90">
          2 · ACTION
        </text>

        {/* Stage 3 — CI dots, verifying. Base state: all green. */}
        <text className="p00-lbl" x="452" y="52" textAnchor="middle">
          3 · VERIFY
        </text>
        <path
          d="M 452 80 L 452 92"
          stroke="var(--line)"
          strokeWidth="1"
          strokeDasharray="2 3"
          fill="none"
        />
        {[
          { x: 432, cls: 'p00-ci-a' },
          { x: 452, cls: 'p00-ci-b' },
          { x: 472, cls: 'p00-ci-c' },
        ].map((d) => (
          <g key={d.x}>
            <circle
              cx={d.x}
              cy="70"
              r="4.5"
              fill="none"
              stroke="var(--ink-faint)"
              strokeOpacity="0.55"
            />
            <circle className={d.cls} cx={d.x} cy="70" r="4.5" fill="var(--accent)" />
          </g>
        ))}

        {/* The gate: two posts and a dashed threshold on the top lane. */}
        <rect x="517" y="78" width="7" height="16" rx="1.5" fill="var(--ink-2)" />
        <rect x="517" y="126" width="7" height="16" rx="1.5" fill="var(--ink-2)" />
        <path
          d="M 520.5 94 L 520.5 126"
          stroke="var(--accent)"
          strokeOpacity="0.9"
          strokeWidth="1.2"
          strokeDasharray="3 3"
          fill="none"
        />
        <path
          d="M 520.5 142 L 520.5 150"
          stroke="var(--line)"
          strokeWidth="1"
          strokeDasharray="2 3"
          fill="none"
        />

        {/* Stage 4 — the steward holds veto on the irreversible, here. */}
        <text className="p00-lbl" x="524" y="158" textAnchor="middle">
          4 · COMMIT
        </text>

        {/* The update pulse: the outcome rippling back into the terrain. */}
        <circle
          className="p00-ring"
          cx="520.5"
          cy="110"
          r="12"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          opacity="0"
        />

        {/* Stage 5 — the return lane: outcomes feed back as new signal. */}
        <text className="p00-lbl" x="360" y="310" textAnchor="middle">
          5 · UPDATE
        </text>

        {/* The PR card. Base position: at the gate, stamped. */}
        <g transform="translate(404 96)">
          <g className="p00-card">
            <rect width="84" height="28" rx="4" fill="var(--paper-3)" stroke="var(--line)" />
            <text x="9" y="19" fontSize="11" fontWeight="700" fill="var(--ink-2)">
              PR
            </text>
            <rect
              x="30"
              y="9"
              width="42"
              height="3.5"
              rx="1.75"
              fill="var(--ink-faint)"
              opacity="0.65"
            />
            <rect
              x="30"
              y="17"
              width="30"
              height="3.5"
              rx="1.75"
              fill="var(--ink-faint)"
              opacity="0.65"
            />
            {/* The stamp impression: the considered yes. */}
            <g className="p00-mark">
              <g transform="translate(68 14) rotate(-10)">
                <circle
                  r="8.5"
                  fill="var(--accent-soft)"
                  stroke="var(--accent)"
                  strokeWidth="1.6"
                />
                <path
                  d="M -3.6 0 l 2.6 2.8 l 4.8 -5.4"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </g>
            </g>
          </g>
        </g>

        {/* The steward: a small human glyph, stamp in hand, tiny on purpose. */}
        <text className="p00-tag" x="560" y="68">
          the steward
        </text>
        <g transform="translate(556 108)">
          <g className="p00-steward">
            <circle cx="0" cy="-21" r="3.6" fill="var(--ink-2)" />
            <path
              d="M 0 -17.4 L 0 -7"
              stroke="var(--ink-2)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 0 -7 L -3.6 0 M 0 -7 L 3.6 0"
              stroke="var(--ink-2)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 0 -14.5 L -7.5 -10.5"
              stroke="var(--ink-2)"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            <rect x="-12" y="-13.6" width="5.5" height="4.6" rx="1" fill="var(--accent)" />
          </g>
        </g>
      </svg>
    </figure>
  );
}

function Legend() {
  const [pinned, setPinned] = useState('E');
  const active = LEGEND.find((m) => m.id === pinned);
  return (
    <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
      <div
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        The marks · select one
      </div>
      <div
        role="group"
        aria-label="Epistemic marks"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
      >
        {LEGEND.map((m) => (
          <button
            key={m.id}
            type="button"
            className="mh-chip"
            aria-pressed={pinned === m.id}
            title={`${m.name}: ${m.gloss}`}
            onClick={() => setPinned(m.id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
          >
            <span className={m.cls} style={{ fontFamily: 'var(--font-mono)', fontSize: 14 }}>
              {m.glyph}
            </span>
            {m.name}
          </button>
        ))}
      </div>
      <p
        data-testid="legend-gloss"
        style={{ margin: '12px 0 0', fontSize: 14.5, color: 'var(--ink-2)' }}
      >
        <span
          className={active.cls}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 15, marginRight: 6 }}
        >
          {active.glyph}
        </span>
        <strong style={{ color: 'var(--ink)' }}>{active.name}.</strong> {active.gloss}
      </p>
    </div>
  );
}

export default function P00() {
  return (
    <Page
      n={0}
      claim={
        <>
          It used to be building the thing. Now it&apos;s{' '}
          <strong>building the thing that builds the thing</strong>. The activity is the page; read
          the marks below, then walk the loops.
        </>
      }
    >
      <Activity wide>
        <HeroScene />
        <Legend />
      </Activity>

      <Seen>
        The approval is the visible act. The terrain — contours, circuits, fading signals — is the
        work, and it dwarfs the stamp.
      </Seen>

      <Takeaway>Shape the terrain so the considered yes is the only hand-work left.</Takeaway>

      <Deeper title="What kind of book is this">
        <p>
          A principled hypothesis, not a proven methodology. Three layers run through it; the marks
          above flag which is which. Two laws govern the simulations:
        </p>
        <ul style={{ margin: '0 0 0.8em', paddingLeft: 18 }}>
          <li>
            <strong>Terrain law.</strong> Nothing here lets you command an agent. You only shape the
            environment it runs in. The one greyed &ldquo;restart the agent&rdquo; button on page 06
            makes the point by failing.
          </li>
          <li>
            <strong>Glass law.</strong> Every simulation can show its own engine source, verbatim,
            in a collapsed drawer. No black boxes.
          </li>
        </ul>
        <p>
          <strong>Fast path.</strong> Read me, then pages 01–02 (a loop, and why nobody calls
          anyone). That is the whole idea in eleven minutes. The rest deepens it.
        </p>
        <p>
          <strong>On AI assistance.</strong> The framework and judgment are the author&apos;s; AI
          helped write it down, find prior work, and review the draft. Many hands did the work; the
          judgment stayed human. That split is the book&apos;s subject, so it belongs in the open.
        </p>
        <p>
          <strong>What these simulations prove: nothing.</strong> They are toys that make a shape
          legible. The evidence lives in the cited research and the field specimens, marked ●.
        </p>
      </Deeper>

      <Deeper title="Vocabulary crosswalk">
        <p>
          One vocabulary, mapped to the field it borrows from. Plainer words, same distinctions.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '6px 8px' }}>This book</th>
              <th style={{ padding: '6px 8px' }}>The field</th>
              <th style={{ padding: '6px 8px' }}>Source</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
              <td style={{ padding: '6px 8px' }}>Planned / emergent</td>
              <td style={{ padding: '6px 8px' }}>Cathedral / bazaar</td>
              <td style={{ padding: '6px 8px' }}>Raymond, 1997</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
              <td style={{ padding: '6px 8px' }}>Signal</td>
              <td style={{ padding: '6px 8px' }}>Pheromone / trace</td>
              <td style={{ padding: '6px 8px' }}>Stigmergy, Grassé 1959</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
              <td style={{ padding: '6px 8px' }}>Terrain</td>
              <td style={{ padding: '6px 8px' }}>Harness (per-agent slice)</td>
              <td style={{ padding: '6px 8px' }}>Hashimoto et al., 2026</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
              <td style={{ padding: '6px 8px' }}>Boundary</td>
              <td style={{ padding: '6px 8px' }}>Contract, trust zone, gate</td>
              <td style={{ padding: '6px 8px' }}>umbrella term</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px' }}>Placement, steward</td>
              <td style={{ padding: '6px 8px' }}>(no clean analog)</td>
              <td style={{ padding: '6px 8px' }}>coined here</td>
            </tr>
          </tbody>
        </table>
      </Deeper>
    </Page>
  );
}
