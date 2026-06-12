// Hero.jsx — "The Considered Yes", the book's ambient opening stage.
//
// A pure SVG/CSS scene, no engine, no LabFrame (the one sanctioned autoplay
// in the book): terrain as faint contour lines, the maintenance loops as
// closed circuits in their cast colors, signals pulsing in the terrain.
// Once per 12-second cycle a PR card slides along the dependency-patch
// circuit to the gate, the CI dots go green one by one, and a small human
// glyph stamps the approval — tiny against the terrain, which is the point.
//
// Motion is CSS keyframes only, and every keyframed element's BASE state
// (no animation applied) is the gate moment: card at the gate, CI verified,
// stamp down. book.css's global reduced-motion override collapses every
// animation to one 1ms iteration with no fill, so under reduced motion the
// scene rests exactly on that fully labeled gate frame. Negative delays
// start motion-enabled visitors mid-cycle on the same frame.

const TAU = Math.PI * 2;

// A wobbled closed contour: midpoint-quadratic smoothing over a cosine-
// perturbed ellipse. Deterministic (fixed phases), so the terrain never
// shifts between paints.
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

// Two peaks, two broad saddles. `soft: true` drops to the fainter line.
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

// The six cast circuits beyond the featured dependency-patch loop.
// dash/cycle ≈ the shape's circumference so the traveling pulse loops clean.
const MINOR_LOOPS = [
  {
    cx: 668,
    cy: 312,
    rx: 54,
    ry: 30,
    color: 'var(--c-docs)',
    name: 'doc-refresh loop',
    c: -269,
    dur: '9s',
    del: '-2s',
    lx: 668,
    ly: 358,
  },
  {
    cx: 72,
    cy: 64,
    rx: 30,
    ry: 30,
    color: 'var(--c-security)',
    name: 'security-patch loop',
    c: -189,
    dur: '8s',
    del: '-5s',
    lx: 72,
    ly: 24,
  },
  {
    cx: 296,
    cy: 352,
    rx: 58,
    ry: 24,
    color: 'var(--c-flaky)',
    name: 'flaky-test loop',
    c: -269,
    dur: '11s',
    del: '-3s',
    lx: 296,
    ly: 392,
  },
  {
    cx: 688,
    cy: 196,
    rx: 38,
    ry: 22,
    color: 'var(--c-backfill)',
    name: 'test-backfill loop',
    c: -192,
    dur: '10s',
    del: '-7s',
    lx: 688,
    ly: 232,
  },
  {
    cx: 250,
    cy: 52,
    rx: 24,
    ry: 24,
    color: 'var(--c-deadcode)',
    name: 'dead-code loop',
    c: -151,
    dur: '13s',
    del: '-1s',
    lx: 250,
    ly: 20,
  },
  {
    cx: 348,
    cy: 48,
    rx: 34,
    ry: 18,
    color: 'var(--c-triage)',
    name: 'triage loop',
    c: -167,
    dur: '9.5s',
    del: '-4s',
    lx: 348,
    ly: 16,
  },
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

// The dependency-patch circuit: rounded rect 120..600 × 110..290, r=28.
// Perimeter ≈ 1272; the 16px flow pulse travels it once per cycle.
const MAIN_CIRCUIT =
  'M 148 110 H 572 A 28 28 0 0 1 600 138 V 262 A 28 28 0 0 1 572 290 ' +
  'H 148 A 28 28 0 0 1 120 262 V 138 A 28 28 0 0 1 148 110 Z';

const STAGE_CSS = `
  .mh-hero-stage svg { display: block; width: 100%; height: auto; }
  .mh-hero-stage text { font-family: var(--font-mono); }
  .mh-hero-lbl { font-size: 9.5px; letter-spacing: 0.14em; fill: var(--ink-faint); }
  .mh-hero-tag { font-size: 8.5px; letter-spacing: 0.1em; fill: var(--ink-faint); }
  .mh-hero-loopname { font-size: 8.5px; letter-spacing: 0.1em; }
  .mh-hero-flow {
    animation: mhHeroFlow var(--dur, 12s) linear var(--del, 0s) infinite;
  }
  .mh-hero-sig {
    animation: mhHeroSig var(--dur, 4s) ease-in-out var(--del, 0s) infinite;
    transform-box: fill-box;
    transform-origin: center;
  }
  .mh-hero-card { animation: mhHeroCard 12s ease-in-out -7.6s infinite; }
  .mh-hero-ci-a { animation: mhHeroCiA 12s linear -7.6s infinite; }
  .mh-hero-ci-b { animation: mhHeroCiB 12s linear -7.6s infinite; }
  .mh-hero-ci-c { animation: mhHeroCiC 12s linear -7.6s infinite; }
  .mh-hero-mark {
    animation: mhHeroMark 12s ease-out -7.6s infinite;
    transform-box: fill-box;
    transform-origin: center;
  }
  .mh-hero-steward { animation: mhHeroSteward 12s ease-in-out -7.6s infinite; }
  .mh-hero-ring {
    animation: mhHeroRing 12s ease-out -7.6s infinite;
    transform-box: fill-box;
    transform-origin: center;
  }
  @keyframes mhHeroFlow {
    to { stroke-dashoffset: var(--c, -1272); }
  }
  @keyframes mhHeroSig {
    0%, 100% { opacity: 0.22; transform: scale(0.85); }
    50% { opacity: 0.95; transform: scale(1.3); }
  }
  @keyframes mhHeroCard {
    0% { transform: translateX(-280px); opacity: 0; }
    6% { opacity: 1; }
    30% { transform: translateX(0); }
    80% { transform: translateX(0); opacity: 1; }
    88% { transform: translateX(104px); opacity: 1; }
    93%, 100% { transform: translateX(126px); opacity: 0; }
  }
  @keyframes mhHeroCiA {
    0%, 36% { opacity: 0; }
    39%, 90% { opacity: 1; }
    94%, 100% { opacity: 0; }
  }
  @keyframes mhHeroCiB {
    0%, 42% { opacity: 0; }
    45%, 90% { opacity: 1; }
    94%, 100% { opacity: 0; }
  }
  @keyframes mhHeroCiC {
    0%, 48% { opacity: 0; }
    51%, 90% { opacity: 1; }
    94%, 100% { opacity: 0; }
  }
  @keyframes mhHeroMark {
    0%, 58% { opacity: 0; transform: scale(1.9); }
    62%, 100% { opacity: 1; transform: scale(1); }
  }
  @keyframes mhHeroSteward {
    0%, 52% { transform: translateY(-3px); }
    58%, 82% { transform: translateY(0); }
    88%, 100% { transform: translateY(-3px); }
  }
  @keyframes mhHeroRing {
    0%, 64% { transform: scale(0.25); opacity: 0; }
    68% { opacity: 0.5; }
    82%, 100% { transform: scale(3.4); opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .mh-hero-stage svg * { animation: none !important; }
  }
`;

export default function Hero() {
  return (
    <figure className="mh-hero-stage" style={{ margin: 0 }}>
      <style>{STAGE_CSS}</style>
      <svg
        viewBox="0 0 760 400"
        role="img"
        aria-label="An ops-floor terrain map: faint contour lines, maintenance loops drawn as
          closed circuits, signals pulsing in the terrain. On the dependency-patch circuit a PR
          card waits at the gate; the CI dots have gone green and a small human figure stamps
          the approval. The five loop stages are labeled: signal, action, verification, commit
          or revert, update."
      >
        {/* Terrain: the contour lines. Static — the terrain is the constant. */}
        <g fill="none" strokeWidth="1">
          {CONTOURS.map((c, i) => (
            <path key={i} d={c.d} stroke={c.soft ? 'var(--line-soft)' : 'var(--line)'} />
          ))}
        </g>

        {/* The cast's circuits: faint closed loops, each with a traveling pulse. */}
        {MINOR_LOOPS.map((l) => (
          <g key={l.name}>
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
              className="mh-hero-flow"
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
            <text
              className="mh-hero-loopname"
              x={l.lx}
              y={l.ly}
              textAnchor="middle"
              fill={l.color}
              fillOpacity="0.8"
            >
              {l.name}
            </text>
          </g>
        ))}

        {/* Signals in the terrain: pulsing, fading, in their cast colors. */}
        {SIGNALS.map((s, i) => (
          <circle
            key={i}
            className="mh-hero-sig"
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
          className="mh-hero-flow"
          style={{ '--c': -1272, '--dur': '12s', '--del': '-7.6s' }}
          d={MAIN_CIRCUIT}
          fill="none"
          stroke="var(--c-deppatch)"
          strokeOpacity="0.9"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="16 1256"
        />
        <text
          className="mh-hero-loopname"
          x="360"
          y="204"
          textAnchor="middle"
          fill="var(--c-deppatch)"
          fillOpacity="0.8"
        >
          dependency-patch loop
        </text>

        {/* Stage 1 — a signal in the terrain fires the loop. */}
        <path
          d="M 88 266 L 118 232"
          stroke="var(--c-deppatch)"
          strokeOpacity="0.5"
          strokeWidth="1"
          strokeDasharray="2 4.5"
          fill="none"
        />
        <text className="mh-hero-lbl" x="108" y="206" textAnchor="end">
          1 · SIGNAL
        </text>

        {/* Stage 2 — where the card sets out. */}
        <text className="mh-hero-lbl" x="148" y="90">
          2 · ACTION
        </text>

        {/* Stage 3 — CI dots, verifying. Base state: all green. */}
        <text className="mh-hero-lbl" x="452" y="52" textAnchor="middle">
          3 · VERIFICATION
        </text>
        <path
          d="M 452 80 L 452 92"
          stroke="var(--line)"
          strokeWidth="1"
          strokeDasharray="2 3"
          fill="none"
        />
        {[
          { x: 432, cls: 'mh-hero-ci-a' },
          { x: 452, cls: 'mh-hero-ci-b' },
          { x: 472, cls: 'mh-hero-ci-c' },
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
        <text className="mh-hero-lbl" x="524" y="158" textAnchor="middle">
          4 · COMMIT OR REVERT
        </text>

        {/* The update pulse: the outcome rippling back into the terrain. */}
        <circle
          className="mh-hero-ring"
          cx="520.5"
          cy="110"
          r="12"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          opacity="0"
        />

        {/* Stage 5 — the return lane: outcomes feed back as new signal. */}
        <text className="mh-hero-lbl" x="360" y="310" textAnchor="middle">
          5 · UPDATE
        </text>

        {/* The PR card. Base position: at the gate, stamped. */}
        <g transform="translate(404 96)">
          <g className="mh-hero-card">
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
            <g className="mh-hero-mark">
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
        <text className="mh-hero-tag" x="560" y="68">
          the steward
        </text>
        <g transform="translate(556 108)">
          <g className="mh-hero-steward">
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

      <figcaption
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '4px 14px',
          borderTop: '1px solid var(--line)',
          padding: '10px 16px',
        }}
      >
        <span className="mh-kicker">
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--accent)',
              marginRight: 8,
              verticalAlign: 'baseline',
            }}
          />
          The considered yes
        </span>
        <span style={{ fontStyle: 'italic', fontSize: '13.5px', color: 'var(--ink-2)' }}>
          The approval is the visible act. The terrain is the work.
        </span>
      </figcaption>
    </figure>
  );
}
