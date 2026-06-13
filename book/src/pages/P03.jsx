// P03 — The spectrum (register: bet). Covers §2.2.
// One handle drags a workstream planned↔emergent; ten property tokens slide in
// lockstep along their tracks (the scene IS the handbook's §2.2 table, drawn).
// Forcing the halfway mix pins authority planned and integration emergent, tears
// the eight unpinned tokens to center, and lights the governance-theatre lamp.

import { useState } from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, Mark } from '../components/kit.jsx';

/* ── The model: the §2.2 table, held as data (pole text quoted exactly) ── */
const PROPERTIES = [
  {
    id: 'authority',
    name: 'Authority',
    planned: 'Central',
    emergent: 'Distributed',
    torn: 'central in name; the stream decides',
  },
  {
    id: 'knowledge',
    name: 'Knowledge',
    planned: 'Concentrated',
    emergent: 'Dispersed',
    torn: 'concentrated in plan, dispersed in merges',
  },
  {
    id: 'spec',
    name: 'Spec role',
    planned: 'Prescriptive',
    emergent: 'Descriptive',
    torn: 'prescriptive on paper, descriptive in fact',
  },
  {
    id: 'integration',
    name: 'Integration',
    planned: 'Scheduled, sync',
    emergent: 'Continuous, async',
    torn: 'continuous in fact, scheduled in fiction',
  },
  {
    id: 'verification',
    name: 'Verification',
    planned: 'Against the spec',
    emergent: 'Through convergence',
    torn: 'runs against a spec the merges outran',
  },
  {
    id: 'coupling',
    name: 'Coupling',
    planned: 'Explicit, audited',
    emergent: 'Implicit, tolerated',
    torn: 'audited in review, tolerated in stream',
  },
  {
    id: 'coordination',
    name: 'Coordination',
    planned: 'Direct command',
    emergent: 'Environmental signal',
    torn: 'commands issued after the signals decided',
  },
  {
    id: 'failure',
    name: 'Failure',
    planned: 'Hard — plan breaks',
    emergent: 'Soft — local decay',
    torn: 'soft decay until the plan breaks hard',
  },
  {
    id: 'strength',
    name: 'Strength',
    planned: 'Guarantees',
    emergent: 'Adaptivity',
    torn: 'guarantees claimed, not held',
  },
  {
    id: 'weakness',
    name: 'Weakness',
    planned: 'Brittleness',
    emergent: 'Commons decay',
    torn: 'brittleness and commons decay, both',
  },
];

// Reference placements from §2.3's quadrant: an irreversible, coupled auth
// system sits near the planned pole; internal dev tooling near emergent.
const AUTH_T = 0.1;
const TOOLING_T = 0.9;

// Read every token at position t (0 planned … 1 emergent), or torn in the mix.
function read(t, forced) {
  return PROPERTIES.map((p, i) => {
    if (forced) {
      if (p.id === 'authority') return { ...p, i, t: 0, state: 'pinned', reading: p.planned };
      if (p.id === 'integration') return { ...p, i, t: 1, state: 'pinned', reading: p.emergent };
      return { ...p, i, t: 0.5, state: 'torn', reading: p.torn };
    }
    const state = t < 0.42 ? 'planned' : t > 0.58 ? 'emergent' : 'boundary';
    const reading = t <= 0.5 ? p.planned : p.emergent;
    return { ...p, i, t, state, reading };
  });
}

/* ── Scene geometry (viewBox units; width 100% fills the Activity) ─────── */
const W = 760;
const ROW_H = 38;
const TOP = 34;
const LABEL_W = 96;
const TRACK_X0 = LABEL_W + 14;
const TRACK_X1 = W - 150;
const TRACK_W = TRACK_X1 - TRACK_X0;
const TOKEN_W = 138;
// Torn readings are longer sentences, so their tokens run wider.
const TORN_W = 240;
const H = TOP + PROPERTIES.length * ROW_H + 16;

const STATE_COLOR = {
  planned: 'var(--accent)',
  emergent: 'var(--accent)',
  boundary: 'var(--amber)',
  pinned: 'var(--amber)',
  torn: 'var(--red)',
};

function tokenX(t, width) {
  // Left edge of the token, clamped so it never overruns the track ends.
  const c = TRACK_X0 + t * TRACK_W;
  const half = width / 2;
  return Math.max(TRACK_X0 + half, Math.min(TRACK_X1 - half, c)) - half;
}

function Scene({ rows, forced }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Ten properties of the planned/emergent spectrum, each a token sliding between a planned and an emergent pole."
      style={{ display: 'block', maxWidth: '100%', fontFamily: 'var(--font-mono)' }}
    >
      {/* Pole headers */}
      <text x={TRACK_X0} y={20} fontSize="12" fontWeight="700" fill="var(--ink-2)">
        ← Planned
      </text>
      <text x={TRACK_X1} y={20} fontSize="12" fontWeight="700" fill="var(--ink-2)" textAnchor="end">
        Emergent →
      </text>
      {/* Boundary band: where guarantees and adaptivity trade off */}
      <rect
        x={TRACK_X0 + TRACK_W * 0.42}
        y={TOP - 6}
        width={TRACK_W * 0.16}
        height={rows.length * ROW_H + 6}
        fill="var(--amber-soft)"
        opacity={forced ? 0.35 : 1}
      />
      {rows.map((row) => {
        const y = TOP + row.i * ROW_H;
        const cy = y + ROW_H / 2;
        const color = STATE_COLOR[row.state];
        const tw = row.state === 'torn' ? TORN_W : TOKEN_W;
        return (
          <g key={row.id}>
            {/* Property name */}
            <text
              x={LABEL_W}
              y={cy + 4}
              fontSize="11.5"
              fontWeight="600"
              fill="var(--ink-2)"
              textAnchor="end"
            >
              {row.name}
            </text>
            {/* The track */}
            <line
              x1={TRACK_X0}
              y1={cy}
              x2={TRACK_X1}
              y2={cy}
              stroke="var(--line-soft)"
              strokeWidth="2"
            />
            <circle cx={TRACK_X0} cy={cy} r="2.5" fill="var(--line)" />
            <circle cx={TRACK_X1} cy={cy} r="2.5" fill="var(--line)" />
            {/* The token — slides in lockstep; CSS transition makes it glide */}
            <g
              style={{
                transform: `translateX(${tokenX(row.t, tw)}px)`,
                transition: 'transform 320ms cubic-bezier(.4,0,.2,1)',
              }}
            >
              <rect
                x={0}
                y={cy - 11}
                width={tw}
                height={22}
                rx={11}
                fill="var(--paper)"
                stroke={color}
                strokeWidth={row.state === 'pinned' ? 2 : 1.25}
              />
              <text
                x={tw / 2}
                y={cy + 4}
                fontSize="10.5"
                fill={row.state === 'torn' ? 'var(--red)' : 'var(--ink)'}
                textAnchor="middle"
              >
                {row.reading}
                {row.state === 'pinned' ? ' · pin' : ''}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

export default function P03() {
  const [t, setT] = useState(AUTH_T);
  const [forced, setForced] = useState(false);
  const rows = read(t, forced);
  const pos = Math.round(t * 100);

  const status = forced
    ? 'Authority pinned planned, integration pinned emergent — the other eight tear to the middle.'
    : t < 0.42
      ? 'All ten readings sit in the planned column.'
      : t > 0.58
        ? 'All ten readings sit in the emergent column.'
        : 'On the boundary: nothing resolves.';

  return (
    <Page n={3} claim="Ten properties move together; halfway mixes are theatre.">
      <Activity wide>
        <div className="mh-controls" style={{ alignItems: 'flex-end' }}>
          <div className="mh-slider" style={{ flex: '1 1 280px', maxWidth: 440 }}>
            <label htmlFor="p03-handle">
              <span>The one handle · where this workstream lives</span>
              <span className={forced ? 'mono locked' : 'mono'}>
                {forced ? 'held by the pins' : `${pos} → emergent`}
              </span>
            </label>
            <input
              id="p03-handle"
              type="range"
              min="0"
              max="100"
              value={pos}
              disabled={forced}
              onChange={(e) => setT(Number(e.target.value) / 100)}
              aria-valuetext={`${pos} of 100 toward emergent`}
            />
          </div>
          <div className="mh-chipset" role="group" aria-label="Reference placements">
            <button
              type="button"
              className="mh-chip"
              aria-pressed={!forced && t === AUTH_T}
              disabled={forced}
              onClick={() => setT(AUTH_T)}
            >
              auth system
            </button>
            <button
              type="button"
              className="mh-chip"
              aria-pressed={!forced && t === TOOLING_T}
              disabled={forced}
              onClick={() => setT(TOOLING_T)}
            >
              internal tooling
            </button>
          </div>
        </div>

        <Scene rows={rows} forced={forced} />

        <p
          className="mono"
          aria-live="polite"
          style={{ fontSize: '11.5px', color: 'var(--ink-faint)', margin: '4px 0 12px' }}
        >
          {status}
        </p>

        <div className="mh-controls">
          <button
            type="button"
            className="mh-btn mh-btn-danger"
            onClick={() => setForced(true)}
            disabled={forced}
            aria-label="Force the halfway mix: pin authority planned and integration emergent"
          >
            Force a halfway mix
          </button>
          {forced ? (
            <button
              type="button"
              className="mh-btn"
              onClick={() => setForced(false)}
              aria-label="Release the pins"
            >
              Release the pins
            </button>
          ) : null}
          <span className={`mh-lamp${forced ? ' off' : ''}`} role="status">
            governance theatre
            {forced ? (
              <Badge
                layer="W"
                note="argued from the table's reinforcement structure, watched in practice"
              />
            ) : null}
          </span>
        </div>

        {forced ? (
          <div className="mh-readout" role="status">
            <div className="mh-stat">
              <span className="k">Form</span>
              <span className="v">planned</span>
            </div>
            <div className="mh-stat">
              <span className="k">Substance</span>
              <span className="v">emergent</span>
            </div>
            <div className="mh-stat">
              <span className="k">Guarantees</span>
              <span className="v bad">not held</span>
            </div>
            <div className="mh-stat">
              <span className="k">Adaptivity</span>
              <span className="v bad">not delivered</span>
            </div>
          </div>
        ) : null}
      </Activity>

      <Seen>
        One handle moves all ten tokens at once — strength and weakness trade places in the same
        motion, because the rows reinforce each other. There is no second handle to find.
      </Seen>

      <Takeaway>
        The form of planned work without its substance, and the name of emergent work without its
        benefits, is governance theatre. The mix lives in the boundary, not the middle.
      </Takeaway>

      <Deeper title="The full §2.2 table">
        <p>
          Every property along the spectrum varies together. Read each row left-to-right as the
          workstream moves from the planned pole toward the emergent one.
        </p>
        <table className="mh-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Planned ←</th>
              <th>→ Emergent</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Authority</td>
              <td>Central</td>
              <td>Distributed</td>
            </tr>
            <tr>
              <td>Knowledge</td>
              <td>Concentrated</td>
              <td>Dispersed</td>
            </tr>
            <tr>
              <td>Spec role</td>
              <td>Prescriptive</td>
              <td>Descriptive</td>
            </tr>
            <tr>
              <td>Integration</td>
              <td>Scheduled, synchronous</td>
              <td>Continuous, asynchronous</td>
            </tr>
            <tr>
              <td>Verification</td>
              <td>Against the spec</td>
              <td>Through convergence</td>
            </tr>
            <tr>
              <td>Coupling</td>
              <td>Explicit, audited</td>
              <td>Implicit, tolerated</td>
            </tr>
            <tr>
              <td>Coordination</td>
              <td>Direct command</td>
              <td>Environmental signal</td>
            </tr>
            <tr>
              <td>Failure</td>
              <td>Hard — the whole plan breaks</td>
              <td>Soft — local decay</td>
            </tr>
            <tr>
              <td>Strength</td>
              <td>Guarantees</td>
              <td>Adaptivity</td>
            </tr>
            <tr>
              <td>Weakness</td>
              <td>Brittleness</td>
              <td>Commons degradation</td>
            </tr>
          </tbody>
        </table>
        <p>
          These cluster because they reinforce each other. A central, spec-verified decision also
          integrates on a schedule and fails hard when wrong; a distributed, convergence-verified
          one integrates continuously and fails soft. Mix halfway — central authority with
          continuous async integration — and you usually get governance theatre. <Badge layer="W" />
        </p>
        <p style={{ borderLeft: '3px solid var(--amber)', paddingLeft: 12, color: 'var(--ink-2)' }}>
          <strong>Dissent · the mix that holds.</strong> <Mark kind="real" /> A small planned core
          (schema, public API, auth boundary) under central authority, with everything around it
          integrating continuously and asynchronously. By the scene above that should tear. It holds
          when a third ingredient is present: a heavyweight contract at the seam that fails closed.
          Each region keeps one coherent column; the boundary does the work the middle of the slider
          cannot. The test: can consumers drift past the contract with nothing stopping them? If so,
          the seam is a wiki page and the scene is reading your system correctly.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--ink-faint)' }}>
          What this cannot show: where the boundary really sits for your system, or how long theatre
          takes to surface. The thresholds (0.42 / 0.58) are authored, not measured — a drawn bet
          needs edges; real workstreams do not announce their position. This is the author's bet,
          drawn.
        </p>
      </Deeper>
    </Page>
  );
}
