// P16 · The edges — knowing where the framework does NOT apply is part of it.
// The activity IS a drawn boundary-terrain: a fertile basin where loops compound,
// rising to a tight-gates ridge, falling off into barren ground where the
// framework declines. The reader inspects the evidence, commits a zone via three
// chips, and a survey marker drops onto the terrain at the call's hidden truth —
// chosen zone ringed, true zone lit. Five decline cases from cases.js; one is
// genuinely contested and the terrain says so (two truths, both lit).
// Engine: cases.js (CASES). Folds carry §3.9–3.10 depth.

import React from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, Mark, Artifact } from '../components/kit.jsx';
import { CASES } from '../engine/cases.js';

const { useState } = React;

// The five boundary cases, in deck order — the irrigation firmware leads
// because it is the cleanest "planned mode correctly dominant" specimen, the
// most representative state to render at rest.
const DECK_IDS = ['dc-02', 'dc-01', 'dc-03', 'dc-04', 'dc-05'];
const BY_ID = new Map(CASES.map((c) => [c.id, c]));
const DECK = DECK_IDS.map((id) => BY_ID.get(id));

// Three terrain zones, left (fertile) → right (barren). Every option id any
// decline case offers maps onto exactly one zone, so the scene reads the same
// whatever order a case lists its options (dc-04/dc-05 reorder; dc-05 has two).
const ZONE = {
  'full-mhe': { id: 'basin', x: 90, label: 'Basin', sub: 'loops compound' },
  'tight-gates': { id: 'ridge', x: 235, label: 'Ridge', sub: 'gates hold the edge' },
  'zoned-adoption': { id: 'ridge', x: 235, label: 'Ridge', sub: 'gates hold the edge' },
  decline: { id: 'barren', x: 385, label: 'Barren', sub: 'the other mode' },
};
const ZONE_ORDER = [
  { id: 'basin', x: 90, label: 'Basin', sub: 'loops compound', color: 'var(--accent)' },
  { id: 'ridge', x: 235, label: 'Ridge', sub: 'tight gates, small budget', color: 'var(--amber)' },
  { id: 'barren', x: 385, label: 'Barren', sub: 'decline, honored', color: 'var(--red)' },
];

const KICKER = {
  font: '600 11px var(--font-mono)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--ink-faint)',
};

export default function P16() {
  return (
    <Page n={16} claim="Knowing where the framework does NOT apply is part of the framework.">
      <Activity>
        <BoundaryDrill />
      </Activity>
      <Seen>
        Each surface lands somewhere on the same terrain: deep in the basin, on the gated ridge, or
        out past it. The honest cases land outside — and one is genuinely contested, so two truths
        light at once.
      </Seen>
      <Takeaway>
        A framework that won&apos;t name its own edges hasn&apos;t earned its claims.{' '}
        <strong>Decline is a placement, not a failure.</strong>
      </Takeaway>

      <Deeper title="Correctness and security (§3.9)">
        <p style={{ marginTop: 0 }}>
          Coordination clean, commons clean — and the code can still do the wrong thing or open a
          hole. Two tests that look alike answer different questions: <Badge layer="W" /> the
          test-backfill loop (§3.3) marks each one so the difference stays visible.
        </p>
        <div className="mh-cardgrid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <span style={{ ...KICKER, display: 'block', marginBottom: 6 }}>
              Behavioral — pins what the code does
            </span>
            <Artifact
              lines={[
                { no: 1, kind: 'key', text: 'test_total_rounds_down()' },
                { no: 2, kind: '', text: "assert total(cart) == '19.99'", annot: 'current output' },
                { no: 3, kind: 'comment', text: '@behavioral  # locks today, right or wrong' },
              ]}
            />
          </div>
          <div>
            <span style={{ ...KICKER, display: 'block', marginBottom: 6 }}>
              Specified — binds it to intent
            </span>
            <Artifact
              lines={[
                { no: 1, kind: 'key', text: 'test_total_matches_invoice()' },
                {
                  no: 2,
                  kind: '',
                  text: 'assert total(cart) == invoice',
                  annot: 'documented intent',
                },
                { no: 3, kind: 'comment', text: '@specified  # fails when the code is wrong' },
              ]}
            />
          </div>
        </div>
        <p style={{ margin: '12px 0 0' }}>
          A behavioral test passing tells you nothing changed; only a specified test tells you the
          system does what it should. <strong>Security is a separate ledger</strong>: an agent that
          earned auto-merge on functional changes never earned it on injection-prone or
          authorization-sensitive surfaces — different questions, different failures.
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--ink-faint)' }}>
          The named gap, after Böckeler: architectural rigor yields to mechanical enforcement;
          functional correctness needs deeper feedback with the world. The framework&apos;s
          contribution is to insist these belong in the conversation, not at its edge.
        </p>
      </Deeper>

      <Deeper title="The other mode (§3.10), verbatim">
        <p style={{ marginTop: 0 }}>
          One expert and one capable agent, in flow on a focused problem — no orchestration, no
          platform overhead. Many Hands doesn&apos;t replace that mode; it addresses the{' '}
          <em>other</em> one. <Mark kind="real" />
        </p>
        <blockquote
          className="mh-pull"
          style={{ marginLeft: 0, marginRight: 0, fontSize: 14.5, lineHeight: 1.6 }}
        >
          &ldquo;A possible future I want to acknowledge cleanly: capable enough single agents may
          eventually subsume some of what this framework addresses. If a single sufficiently-capable
          agent can hold the entire context, do the placement, run the loops, and exercise the
          judgment, the multi-hand coordination layer becomes thinner. I don&apos;t think we&apos;re
          there… I&apos;d rather name the possibility than pretend it isn&apos;t on the
          horizon.&rdquo;
        </blockquote>
        <p style={{ margin: '10px 0 0', fontSize: 13.5, color: 'var(--ink-faint)' }}>
          A team that always works in the many-hands mode is over-engineering; a team that never
          does is leaving compounding on the table. Both modes coexist.
        </p>
      </Deeper>
    </Page>
  );
}

/* ── The decline drill over the boundary terrain ───────────────────────── */

function BoundaryDrill() {
  const [idx, setIdx] = useState(0);
  const [openEv, setOpenEv] = useState(null);
  const [picked, setPicked] = useState(null);
  const c = DECK[idx];

  const truths = answersOf(c); // one zone, or two for the contested case
  const pickedZone = picked ? ZONE[picked].id : null;

  function reset(nextIdx) {
    setIdx(nextIdx);
    setOpenEv(null);
    setPicked(null);
  }
  const choose = (id) => {
    if (picked === null) setPicked(id);
  };

  return (
    <div>
      {/* Case surface + contested flag */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 10,
          marginBottom: 6,
        }}
      >
        <span style={KICKER}>
          Boundary deck · case {idx + 1} of {DECK.length}
        </span>
        {c.contested ? (
          <span style={{ ...KICKER, color: 'var(--amber)' }}>Contested surface</span>
        ) : null}
      </div>
      <p className="mono" style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ink-2)' }}>
        {c.surface}
      </p>

      {/* The drawn terrain — the centerpiece */}
      <TerrainSvg
        committed={picked !== null}
        pickedZone={pickedZone}
        truthZones={picked !== null ? truths.map((a) => ZONE[a].id) : []}
        contested={!!c.contested}
      />

      {/* Evidence chips — inspect before committing */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 6,
          marginTop: 14,
        }}
      >
        <span style={{ ...KICKER, marginRight: 4 }}>Evidence</span>
        {c.evidence.map((ev, i) => (
          <button
            key={ev.label}
            type="button"
            className="mh-chip"
            aria-pressed={openEv === i}
            aria-expanded={openEv === i}
            onClick={() => setOpenEv(openEv === i ? null : i)}
            style={{ fontSize: 12.5 }}
          >
            {ev.label}
          </button>
        ))}
      </div>
      {openEv !== null ? (
        <p
          style={{
            margin: '8px 0 0',
            fontSize: 14,
            lineHeight: 1.55,
            color: 'var(--ink-2)',
            borderLeft: '2px solid var(--line)',
            paddingLeft: 12,
          }}
        >
          {c.evidence[openEv].text}
        </p>
      ) : null}

      {/* The commitment — three zone chips. Order follows the case so the
          contested two-option surface (dc-05) renders its own pair. */}
      <div className="mh-chipset" role="group" aria-label={c.prompt} style={{ marginTop: 16 }}>
        {c.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className="mh-chip"
            aria-pressed={picked === opt.id}
            disabled={picked !== null && picked !== opt.id}
            onClick={() => choose(opt.id)}
            style={{ fontSize: 12.5 }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Argued feedback after the commitment is final */}
      {picked !== null ? (
        <div className="mh-feedback" role="status" style={{ marginTop: 14 }}>
          {c.contested ? (
            <span style={{ ...KICKER, display: 'block', marginBottom: 6, color: 'var(--amber)' }}>
              Contested call — the axes support both; what differs is the standing cost each accepts
            </span>
          ) : null}
          {c.feedback[picked]}
          <div style={{ display: 'flex', marginTop: 14 }}>
            <button
              type="button"
              className="mh-btn mh-btn-primary"
              onClick={() => reset((idx + 1) % DECK.length)}
            >
              {idx + 1 < DECK.length ? 'Next case' : 'Re-deck'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// A case's true answer(s) as option ids. Contested cases have no single
// `answer`; both their options are honored, so both light on the terrain.
function answersOf(c) {
  if (c.contested) return c.options.map((o) => o.id);
  return [c.answer];
}

/* ── The boundary terrain scene ────────────────────────────────────────── */

// A 480×260 cross-section. A green basin floor rises across a gold ridge and
// drops into red barren ground. The survey marker plants in the true zone on
// commit; the picked zone is ringed. CSS transitions carry the marker drop.
const MARK_T = 'transform 420ms cubic-bezier(0.34, 1.3, 0.5, 1), opacity 300ms ease';

// Ground baseline: the terrain fills down to here, and a clean label strip runs
// below it (so the band labels never sit on top of the green fill).
const GROUND = 214;

// Terrain silhouette: basin trough on the left, ridge crest mid, cliff down to
// a barren shelf on the right. One closed path, filled below.
const SKYLINE =
  'M0,150 C40,150 60,170 90,172 C130,175 160,120 195,108 C220,100 232,86 235,84 ' +
  'C238,86 252,104 270,116 C295,132 320,150 340,156 C360,162 372,170 385,182 ' +
  'C402,196 430,200 480,202';
const TERRAIN_FILL = `${SKYLINE} L480,${GROUND} L0,${GROUND} Z`;

// Where the survey marker plants in each zone — on the terrain surface.
const PLANT = { basin: { x: 90, y: 172 }, ridge: { x: 235, y: 84 }, barren: { x: 385, y: 182 } };

function TerrainSvg({ committed, pickedZone, truthZones, contested }) {
  return (
    <svg
      viewBox="0 0 480 260"
      role="group"
      aria-label="Boundary terrain: a fertile basin where loops compound, a gated ridge, and barren ground where the framework declines"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <linearGradient id="p16-basin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-soft)" />
          <stop offset="100%" stopColor="var(--paper-2)" />
        </linearGradient>
      </defs>

      {/* Sky band kickers, drawn into the scene */}
      <text x="240" y="18" textAnchor="middle" style={{ ...svgKicker, fill: 'var(--ink-faint)' }}>
        where the framework compounds → where it declines
      </text>

      {/* Zone wash columns over the terrain region, so the lit zone reads
          clearly without touching the label strip below the ground line. */}
      {ZONE_ORDER.map((z, i) => {
        const x0 = i === 0 ? 0 : (ZONE_ORDER[i - 1].x + z.x) / 2;
        const x1 = i === ZONE_ORDER.length - 1 ? 480 : (z.x + ZONE_ORDER[i + 1].x) / 2;
        const lit = committed && truthZones.includes(z.id);
        return (
          <rect
            key={z.id}
            x={x0}
            y={24}
            width={x1 - x0}
            height={GROUND - 24}
            fill={lit ? colorSoft(z.color) : 'transparent'}
            style={{ transition: 'fill 320ms ease' }}
          />
        );
      })}

      {/* The terrain body */}
      <path d={TERRAIN_FILL} fill="url(#p16-basin)" stroke="none" />
      <path
        d={SKYLINE}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {/* Ground line under the fill, separating terrain from the label strip */}
      <line x1="0" y1={GROUND} x2="480" y2={GROUND} stroke="var(--line)" strokeWidth="1" />

      {/* Band labels in the clean strip below the ground line */}
      {ZONE_ORDER.map((z) => {
        const lit = committed && truthZones.includes(z.id);
        const isPick = committed && pickedZone === z.id;
        return (
          <g key={`lbl-${z.id}`}>
            <text
              x={z.x}
              y={236}
              textAnchor="middle"
              style={{
                font: '600 13px var(--font-display)',
                fill: lit || isPick ? z.color : 'var(--ink-2)',
                transition: 'fill 280ms ease',
              }}
            >
              {z.label}
            </text>
            <text
              x={z.x}
              y={250}
              textAnchor="middle"
              style={{ font: '9.5px var(--font-mono)', fill: 'var(--ink-faint)' }}
            >
              {z.sub}
            </text>
          </g>
        );
      })}

      {/* Loop seeds dot the basin floor — the fertile ground reading at rest */}
      {[
        [60, 168],
        [78, 174],
        [104, 175],
        [122, 171],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="var(--accent)" opacity="0.6" />
      ))}

      {/* The gate post on the ridge crest */}
      <line x1="235" y1="84" x2="235" y2="58" stroke="var(--amber)" strokeWidth="2.5" />
      <rect x="221" y="52" width="28" height="9" rx="2" fill="var(--amber)" opacity="0.85" />

      {/* Survey markers: one in each true zone after commit, the dropped flag */}
      {committed
        ? truthZones.map((zid) => {
            const p = PLANT[zid];
            const z = ZONE_ORDER.find((o) => o.id === zid);
            return (
              <g
                key={zid}
                style={{
                  transform: 'translateY(0)',
                  opacity: 1,
                  transformBox: 'view-box',
                  transformOrigin: `${p.x}px ${p.y}px`,
                  transition: MARK_T,
                  animation: 'none',
                }}
              >
                {/* the pole */}
                <line x1={p.x} y1={p.y} x2={p.x} y2={p.y - 34} stroke={z.color} strokeWidth="2.5" />
                {/* the flag */}
                <path
                  d={`M${p.x},${p.y - 34} L${p.x + 22},${p.y - 29} L${p.x},${p.y - 23} Z`}
                  fill={z.color}
                />
                {/* the planted base ring */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill={z.color}
                  stroke="var(--paper)"
                  strokeWidth="2"
                />
                <text
                  x={p.x}
                  y={p.y - 40}
                  textAnchor="middle"
                  style={{ font: '600 9px var(--font-mono)', fill: z.color }}
                >
                  {contested ? 'a truth' : 'the truth'}
                </text>
              </g>
            );
          })
        : null}

      {/* The reader's pick, ringed where they planted it (if not also a truth) */}
      {committed && pickedZone && !truthZones.includes(pickedZone) ? (
        <g>
          <circle
            cx={PLANT[pickedZone].x}
            cy={PLANT[pickedZone].y}
            r="13"
            fill="none"
            stroke="var(--ink-faint)"
            strokeWidth="2"
            strokeDasharray="5 4"
          />
          <text
            x={PLANT[pickedZone].x}
            y={PLANT[pickedZone].y - 18}
            textAnchor="middle"
            style={{ font: 'italic 9px var(--font-mono)', fill: 'var(--ink-faint)' }}
          >
            your call
          </text>
        </g>
      ) : null}

      {/* At rest, an invitation reading right in the scene */}
      {!committed ? (
        <text
          x="240"
          y="130"
          textAnchor="middle"
          style={{ font: 'italic 11px var(--font-mono)', fill: 'var(--ink-faint)' }}
        >
          read the evidence, then place this surface
        </text>
      ) : null}
    </svg>
  );
}

const svgKicker = {
  font: '600 9px var(--font-mono)',
  letterSpacing: '0.06em',
};

// Translate a cast color var into a low-alpha wash for the lit zone band.
function colorSoft(colorVar) {
  if (colorVar === 'var(--accent)') return 'var(--accent-soft)';
  if (colorVar === 'var(--amber)') return 'var(--amber-soft)';
  return 'var(--red-soft)';
}
