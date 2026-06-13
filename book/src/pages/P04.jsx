// P04 · Placement — three empirical questions place any decision.
// The activity IS a drawn quadrant board: the reader sets three axis toggles,
// a glowing puck glides to the quadrant the axes imply, then they commit on the
// board and the case argues back — axis mis-estimates against hidden truth, and
// danger-zone cases demand the placement be made reversible or legible first.
// Engine: cases.js (CASES, quadrantForAxes, scoreAxes). No prose lectures.

import React from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, Mark } from '../components/kit.jsx';
import { CASES, quadrantForAxes, scoreAxes } from '../engine/cases.js';

const { useMemo, useState } = React;

// An eight-card placement deck curated to span all four quadrants — including
// the danger zone (pl-12) and both contested surfaces (pl-04, pl-14) — rather
// than the bank's first eight, which never reach the danger quadrant.
const DECK_IDS = ['pl-01', 'pl-06', 'pl-08', 'pl-12', 'pl-04', 'pl-03', 'pl-11', 'pl-14'];
const BY_ID = new Map(CASES.map((c) => [c.id, c]));
const DECK = DECK_IDS.map((id) => BY_ID.get(id));

// The three axes, each a two-state toggle. The left pole leans planned, the
// right pole leans emergent, so the toggles read the way the board does.
const AXES = [
  {
    key: 'reversibility',
    label: 'Reversibility',
    poles: { costly: 'costly to undo', cheap: 'cheap to undo' },
    order: ['costly', 'cheap'],
  },
  {
    key: 'legibility',
    label: 'Legibility',
    poles: { specified: 'specified', exploratory: 'exploratory' },
    order: ['specified', 'exploratory'],
  },
  {
    key: 'coupling',
    label: 'Coupling',
    poles: { tight: 'tight', loose: 'loose' },
    order: ['tight', 'loose'],
  },
];

// Quadrant geometry on a 360×300 board (40px gutters for axis captions).
const CELL_W = 155;
const CELL_H = 115;
const Q = {
  planned: { x: 50, y: 40, label: 'Planned', sub: '' },
  'emergent-spec': { x: 195, y: 40, label: 'Emergent', sub: 'specified' },
  danger: { x: 50, y: 165, label: 'Danger zone', sub: '' },
  'emergent-explore': { x: 195, y: 165, label: 'Emergent', sub: 'exploratory' },
};
const ORDER = ['planned', 'emergent-spec', 'danger', 'emergent-explore'];

const SEED = { reversibility: 'costly', legibility: 'specified', coupling: 'tight' };

// Puck rest position: horizontally centred, parked in the lower third of the
// quadrant the current axes imply so it never sits on top of the cell label.
function puckAt(axes) {
  const q = Q[quadrantForAxes(axes)];
  return { cx: q.x + CELL_W / 2, cy: q.y + CELL_H * 0.72 };
}

export default function P04() {
  return (
    <Page n={4} claim="Three empirical questions place any decision; the verdict follows.">
      <Activity>
        <PlacementBoard />
      </Activity>
      <Seen>
        The axes are empirical, not matters of taste: set the three and the decision lands itself.
        Reversibility carries the most weight, and the bottom-left is where disasters live.
      </Seen>
      <Takeaway>
        Argue <strong>where</strong>, not <strong>what</strong>. The placement is the decision; the
        implementation follows from it.
      </Takeaway>

      <Deeper title="The three questions (§2.3)">
        <p style={{ marginTop: 0 }}>
          For any decision of consequence, check three axes. They are empirical, so an argument
          about <em>where</em> ends in a check, not in taste and authority. <Badge layer="W" />
        </p>
        <table className="mh-table">
          <thead>
            <tr>
              <th>Axis</th>
              <th>Planned pole</th>
              <th>Emergent pole</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Reversibility</strong> — if it goes wrong, how dear is the undo?{' '}
                <em>The most important question.</em>
              </td>
              <td>expensive → planned</td>
              <td>cheap → emergent</td>
            </tr>
            <tr>
              <td>
                <strong>Legibility</strong> — is the problem specified and stable, or shifting?
              </td>
              <td>specified → planned</td>
              <td>exploratory → emergent</td>
            </tr>
            <tr>
              <td>
                <strong>Coupling</strong> — does a local change force changes elsewhere?
              </td>
              <td>tight → planned</td>
              <td>loose → emergent</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginBottom: 0 }}>
          Coupling does not pick the quadrant on its own: tight coupling <em>pulls</em> a decision
          toward the planned pole, and regulatory, financial, or safety surface pulls it further.
          The bottom-left, irreversible <em>and</em> exploratory, is where engineering disasters
          live; never forage there without first making the decision reversible or the problem
          legible.{' '}
          <strong>An action is irreversible if undoing it costs more than not doing it.</strong>
        </p>
      </Deeper>

      <Deeper title="Five ways planned and emergent compose (§2.4)">
        <p style={{ marginTop: 0 }}>
          Most real systems are hybrids. Five patterns recur. <Badge layer="W" />
        </p>
        <div className="mh-cardgrid">
          {[
            {
              t: 'Shell and core',
              d: 'A firm planned interface around an emergent interior.',
              ex: 'Microservice contracts · OS kernels · constitutions.',
            },
            {
              t: 'Scaffold and release',
              d: 'Planned builds the structure; emergent takes over.',
              ex: 'Failure mode: overstaying the planned phase.',
            },
            {
              t: 'Nested zones',
              d: 'Planned contains emergent contains planned.',
              ex: 'Handle things at the lowest layer that can.',
            },
            {
              t: 'Alternating breath',
              d: 'The modes take turns in time: diverge, converge, repeat.',
              ex: 'Know which phase you are in.',
            },
            {
              t: 'Zoning',
              d: 'Risk-stratified coexistence in one system.',
              ex: 'Payments planned; feature flags emergent.',
            },
          ].map((p) => (
            <div className="mh-card" key={p.t}>
              <strong>{p.t}</strong>
              <p style={{ margin: '6px 0 4px', fontSize: 14 }}>{p.d}</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-faint)' }}>{p.ex}</p>
            </div>
          ))}
        </div>
        <p style={{ marginBottom: 0, fontSize: 13.5, color: 'var(--ink-faint)' }}>
          The deck draws from the book's case bank; every call is a recorded judgment.{' '}
          <Mark kind="made" /> Contested cases name what each reading commits you to, rather than
          handing down a verdict.
        </p>
      </Deeper>
    </Page>
  );
}

/* ── The board ─────────────────────────────────────────────────────────── */

const KICKER = {
  font: '600 11px var(--font-mono)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--ink-faint)',
};

function PlacementBoard() {
  const [idx, setIdx] = useState(0);
  const c = DECK[idx];
  // The reader's working axis estimate, seeded fresh per case at the planned
  // pole so nothing is pre-given. The board puck follows it live.
  const [axes, setAxes] = useState(SEED);
  const [openEv, setOpenEv] = useState(null);
  const [committed, setCommitted] = useState(null);

  const implied = quadrantForAxes(axes);
  const puck = useMemo(() => puckAt(axes), [axes]);

  function reset(nextIdx) {
    setIdx(nextIdx);
    setAxes(SEED);
    setOpenEv(null);
    setCommitted(null);
  }
  const toggle = (key, value) => {
    if (committed) return;
    setAxes((a) => ({ ...a, [key]: value }));
  };
  const commit = (qid) => {
    if (committed) return;
    setCommitted(qid);
  };

  const truth = c.axesTruth;
  const { missed } = committed ? scoreAxes(c, axes) : { missed: [] };
  const truthQuadrant = truth ? quadrantForAxes(truth) : null;
  const isDanger = truthQuadrant === 'danger';

  return (
    <div>
      {/* Case surface + step counter */}
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
          Placement deck · case {idx + 1} of {DECK.length}
        </span>
        {c.contested ? (
          <span style={{ ...KICKER, color: 'var(--amber)' }}>Contested surface</span>
        ) : null}
      </div>
      <p className="mono" style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ink-2)' }}>
        {c.surface}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.5fr) minmax(190px, 1fr)',
          gap: 18,
          alignItems: 'start',
        }}
      >
        {/* The drawn quadrant board */}
        <BoardSvg
          implied={implied}
          puck={puck}
          committed={committed}
          truthQuadrant={committed ? truthQuadrant : null}
          onCommit={commit}
        />

        {/* The three axis toggles — the only live controls */}
        <div>
          <span style={{ ...KICKER, display: 'block', marginBottom: 10 }}>
            Read the axes, then place it
          </span>
          {AXES.map((ax) => (
            <div key={ax.key} style={{ marginBottom: 12 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: 4,
                }}
              >
                {ax.label}
              </span>
              <div role="group" aria-label={ax.label} style={{ display: 'flex', gap: 6 }}>
                {ax.order.map((val) => {
                  const on = axes[ax.key] === val;
                  const wrong = committed && truth && on && truth[ax.key] !== val;
                  return (
                    <button
                      key={val}
                      type="button"
                      className="mh-chip"
                      aria-pressed={on}
                      disabled={!!committed}
                      onClick={() => toggle(ax.key, val)}
                      style={{
                        flex: 1,
                        fontSize: 12.5,
                        ...(wrong
                          ? {
                              borderColor: 'var(--red)',
                              background: 'var(--red-soft)',
                              color: 'var(--ink)',
                            }
                          : {}),
                      }}
                    >
                      {ax.poles[val]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 12.5,
              lineHeight: 1.5,
              color: committed ? 'var(--ink-faint)' : 'var(--ink-2)',
            }}
          >
            {committed
              ? 'Locked. The board rings the hidden truth beside your call.'
              : `The axes point to ${Q[implied].label.toLowerCase()}${
                  Q[implied].sub ? ` (${Q[implied].sub})` : ''
                }. Click that cell to commit.`}
          </p>
        </div>
      </div>

      {/* Evidence chips — click to inspect, no readout until inspected */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 6,
          marginTop: 16,
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

      {/* Argued feedback after the commitment is final */}
      {committed ? (
        <div className="mh-feedback" role="status" style={{ marginTop: 16 }}>
          {isDanger ? (
            <span
              style={{
                display: 'inline-block',
                marginBottom: 8,
                padding: '3px 9px',
                borderRadius: 6,
                background: 'var(--red-soft)',
                border: '1px solid var(--red)',
                color: 'var(--red)',
                font: '600 11px var(--font-mono)',
                letterSpacing: '0.04em',
              }}
            >
              Danger zone — placement is an action item, not a label
            </span>
          ) : null}
          {c.contested ? (
            <span style={{ ...KICKER, display: 'block', marginBottom: 6, color: 'var(--amber)' }}>
              Contested call
            </span>
          ) : null}
          {c.feedback[committed]}

          {missed.length ? (
            <div
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: '1px solid var(--line-soft)',
              }}
            >
              <span style={{ ...KICKER, display: 'block', marginBottom: 6 }}>
                Axis re-reads, against the hidden truth
              </span>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {missed.map((m) => (
                  <li key={m.axis} style={{ marginBottom: 5, fontSize: 14, lineHeight: 1.5 }}>
                    <strong>
                      {m.axis}: {m.truth}.
                    </strong>{' '}
                    {m.why}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--ink-faint)' }}>
              All three axes read true.
            </p>
          )}

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

/* ── The SVG quadrant scene ────────────────────────────────────────────── */

const FILL = {
  planned: 'var(--paper-3)',
  'emergent-spec': 'var(--accent-soft)',
  danger: 'var(--red-soft)',
  'emergent-explore': 'var(--accent-soft)',
};

const TRANSITION = 'cx 320ms cubic-bezier(0.4, 0, 0.2, 1), cy 320ms cubic-bezier(0.4, 0, 0.2, 1)';

function BoardSvg({ implied, puck, committed, truthQuadrant, onCommit }) {
  const capStyle = {
    font: 'italic 9px var(--font-mono)',
    fill: 'var(--ink-faint)',
    letterSpacing: '0.04em',
  };
  return (
    <svg
      viewBox="0 0 360 300"
      role="group"
      aria-label="Placement quadrant board: irreversible to reversible across, well-specified to exploratory down"
      style={{ width: '100%', height: 'auto', display: 'block', maxWidth: 460 }}
    >
      {/* Axis captions, drawn into the board */}
      <text x="200" y="14" textAnchor="middle" style={capStyle}>
        Well-specified
      </text>
      <text x="200" y="296" textAnchor="middle" style={capStyle}>
        Exploratory
      </text>
      <text x="14" y="155" textAnchor="middle" transform="rotate(-90 14 155)" style={capStyle}>
        Irreversible
      </text>
      <text x="352" y="155" textAnchor="middle" transform="rotate(90 352 155)" style={capStyle}>
        Reversible
      </text>

      {/* Four quadrant cells. Before commit the implied cell glows; after,
          the picked cell holds and the hidden-truth cell is ringed. */}
      {ORDER.map((qid) => {
        const q = Q[qid];
        const isImplied = !committed && implied === qid;
        const isPicked = committed === qid;
        const isTruth = committed && truthQuadrant === qid;
        return (
          <g key={qid}>
            <rect
              x={q.x}
              y={q.y}
              width={CELL_W}
              height={CELL_H}
              rx="9"
              fill={FILL[qid]}
              stroke={isImplied || isPicked ? 'var(--accent)' : 'var(--line)'}
              strokeWidth={isImplied || isPicked ? 2 : 1}
              onClick={() => !committed && onCommit(qid)}
              tabIndex={committed ? -1 : 0}
              role="button"
              aria-label={`Commit: ${q.label}${q.sub ? `, ${q.sub}` : ''}`}
              onKeyDown={(e) => {
                if (!committed && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onCommit(qid);
                }
              }}
              style={{
                cursor: committed ? 'default' : 'pointer',
                transition: 'stroke 200ms ease, stroke-width 200ms ease, fill 200ms ease',
              }}
            />
            {isTruth ? (
              <rect
                x={q.x + 3}
                y={q.y + 3}
                width={CELL_W - 6}
                height={CELL_H - 6}
                rx="7"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
            ) : null}
            <text
              x={q.x + CELL_W / 2}
              y={q.y + 30}
              textAnchor="middle"
              style={{
                font: '600 14px var(--font-display)',
                fill: qid === 'danger' ? 'var(--red)' : 'var(--ink)',
                pointerEvents: 'none',
              }}
            >
              {q.label}
            </text>
            {q.sub ? (
              <text
                x={q.x + CELL_W / 2}
                y={q.y + 46}
                textAnchor="middle"
                style={{
                  font: '11px var(--font-mono)',
                  fill: 'var(--ink-faint)',
                  pointerEvents: 'none',
                }}
              >
                {q.sub}
              </text>
            ) : null}
            {isTruth ? (
              <text
                x={q.x + CELL_W / 2}
                y={q.y + (q.sub ? 60 : 47)}
                textAnchor="middle"
                style={{
                  font: 'italic 9px var(--font-mono)',
                  fill: 'var(--accent)',
                  pointerEvents: 'none',
                }}
              >
                hidden truth
              </text>
            ) : null}
          </g>
        );
      })}

      {/* The placement puck — glides between quadrant centres as the axes
          toggle. After commit it parks on the reader's chosen cell. */}
      <circle
        cx={puck.cx}
        cy={puck.cy}
        r="22"
        fill="var(--accent)"
        opacity="0.16"
        style={{ transition: TRANSITION, pointerEvents: 'none' }}
      />
      <circle
        cx={puck.cx}
        cy={puck.cy}
        r="9"
        fill="var(--accent)"
        stroke="var(--paper)"
        strokeWidth="2.5"
        style={{ transition: TRANSITION, pointerEvents: 'none' }}
      />
    </svg>
  );
}
