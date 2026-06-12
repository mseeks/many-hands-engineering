// SpectrumCoupler.jsx — LAB 04·A "The coupler" (Ch 4 · The spectrum, covers §2.2).
// Bet register. One handle drags a workstream planned↔emergent and the ten
// properties of the handbook's table move together as chips. Forcing the
// halfway mix (authority pinned central, integration pinned continuous and
// asynchronous) tears the eight unpinned rows, and the recorded run names
// governance theatre. No simulation engine runs here: the model IS the
// handbook's table, held as data in the glassed block below.

import { useState } from 'react';
import { Badge, Commit, LabFrame, Walkthrough, glassSlice } from '../components/kit.jsx';
import labSrc from './SpectrumCoupler.jsx?raw';

/* ── The model, verbatim (this block is the glass) ──────────────────────
   The handbook's §2.2 table, held as data; pole text is quoted exactly.
   The only added machinery: a position t in [0,1] for the one handle, two
   thresholds for when a reading flips, and a forced mode that pins two
   rows to opposite poles. That is the entire model. The bet is the table
   itself, plus the claim that one handle moves all ten rows. */
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
    torn: 'concentrated in the plan, dispersed in the merges',
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
    planned: 'Scheduled, synchronous',
    emergent: 'Continuous, asynchronous',
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
    torn: 'audited in review, tolerated in the stream',
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
    planned: 'Hard — the whole plan breaks',
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
    emergent: 'Commons degradation',
    torn: 'brittleness and commons degradation, both',
  },
];

// Between these thresholds nothing resolves: the handle is on the boundary,
// where guarantees and adaptivity trade against each other.
const BOUNDARY_LO = 0.42;
const BOUNDARY_HI = 0.58;

/**
 * Read all ten properties at position t (0 = planned, 1 = emergent).
 * 'coupled': every row moves with the handle. Co-variance is the model,
 * not a rendering choice; there is no per-row handle to find.
 * 'forced': authority pinned planned, integration pinned emergent, and the
 * eight unpinned rows go torn — the form of planned work without its
 * substance, the name of emergent work without its benefits.
 */
function couplerRead(t, mode) {
  return PROPERTIES.map((p) => {
    if (mode === 'forced') {
      if (p.id === 'authority') return { ...p, t: 0, state: 'pinned', reading: p.planned };
      if (p.id === 'integration') return { ...p, t: 1, state: 'pinned', reading: p.emergent };
      return { ...p, t: 0.5, state: 'torn', reading: p.torn };
    }
    if (t < BOUNDARY_LO) return { ...p, t, state: 'planned', reading: p.planned };
    if (t > BOUNDARY_HI) return { ...p, t, state: 'emergent', reading: p.emergent };
    return { ...p, t, state: 'boundary', reading: 'unresolved' };
  });
}
/* end-model */

const GLASS = glassSlice(labSrc, 'The model, verbatim', '/* end-model */');

// The recorded run behind the theatre readout. Authored, not simulated:
// the captions are the author's argument for what the halfway mix does.
const THEATRE_TRACE = {
  seed: 4,
  steps: [
    {
      label: 'WK 1 · SIGN-OFF',
      caption:
        'The council approves integration-plan v1. Authority: central. The spec prescribes interfaces for six workstreams.',
      data: {},
    },
    {
      label: 'WK 2 · THE STREAM',
      caption:
        "Forty-one branches merge, continuously, asynchronously. Nobody waits for an integration window, because there isn't one.",
      data: {},
    },
    {
      label: 'WK 3 · DIVERGENCE',
      caption:
        'Merged truth and spec v1 part company. Verification still runs against the spec, and it passes, because the spec no longer describes anything the stream touches.',
      data: {},
    },
    {
      label: 'WK 4 · CEREMONY',
      caption:
        'The council reviews diffs against a document the code outran. Approvals continue. This is the form of planned work without its substance.',
      data: {},
    },
    {
      label: 'WK 5 · CONVERGENCE, UNTENDED',
      caption:
        'Interfaces settle by whichever merge landed last. No verification through convergence, no tended signals: the name of emergent work without its benefits.',
      data: {},
    },
    {
      label: 'WK 6 · THE READOUT',
      caption:
        'Guarantees: none, the spec stopped binding in week 3. Adaptivity: none, every interface still queues behind the council. The mix has a name: governance theatre.',
      data: {},
    },
  ],
};

// Argued feedback per commitment. No "wrong"; the argument runs on the rows.
const PICK_FEEDBACK = {
  planned:
    "The sign-offs survive; the guarantee doesn't. A prescriptive spec binds only while integration waits for it, because verification against the spec is worth exactly the distance between the spec and the merged truth. Once the stream stops waiting, that distance grows weekly. Watch week 3 of the run.",
  emergent:
    "Distributed adaptation needs distributed authority and tended convergence, and this mix has neither. Every interface still queues behind a central yes, on the council's clock, and nobody verifies through convergence because officially the spec already decided. Watch week 5 of the run.",
  both: "Most org charts make this exact bet, so read the board instead of the chart. The guarantee column needed scheduled integration and verification against the spec; you gave both away in the same motion that kept the council. The adaptivity column needed distributed authority and verification through convergence; the council still gates every interface. Each pole's strength lived in the rows you just unpinned, so what remains is the form of one and the name of the other.",
  neither:
    "And the board agrees: the eight unpinned rows don't settle between the columns, they tear. What you committed to has a name, and the run below earns it week by week.",
};

const DOT_COLOR = {
  planned: 'var(--accent)',
  emergent: 'var(--accent)',
  boundary: 'var(--amber)',
  pinned: 'var(--amber)',
  torn: 'var(--red)',
};

const READING_COLOR = {
  planned: 'var(--ink-2)',
  emergent: 'var(--ink-2)',
  boundary: 'var(--amber)',
  pinned: 'var(--amber)',
  torn: 'var(--red)',
};

const ROW_GRID = {
  display: 'grid',
  gridTemplateColumns: 'minmax(86px, 110px) 1fr minmax(150px, 38%)',
  gap: 12,
  alignItems: 'center',
  padding: '6px 0',
  borderBottom: '1px solid var(--line-soft)',
};

function PropertyRow({ row }) {
  return (
    <div style={ROW_GRID}>
      <span className="mh-kicker" style={{ color: 'var(--ink-2)' }}>
        {row.name}
      </span>
      <div
        aria-hidden="true"
        style={{ position: 'relative', height: 4, background: 'var(--line-soft)', borderRadius: 2 }}
      >
        <span
          style={{
            position: 'absolute',
            left: `${row.t * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: DOT_COLOR[row.state],
            boxShadow: row.state === 'pinned' ? '0 0 0 3px var(--amber-soft)' : 'none',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          lineHeight: 1.5,
          color: READING_COLOR[row.state],
          border: '1px solid var(--line-soft)',
          borderRadius: 9,
          padding: '2px 9px',
          justifySelf: 'start',
        }}
      >
        {row.reading}
        {row.state === 'pinned' ? ' · pinned' : ''}
      </span>
    </div>
  );
}

const PAYOFF = (
  <>
    Ten properties, one handle. Drag a workstream toward either end and authority, knowledge, spec
    role, integration, verification, coupling, coordination, failure mode, strength, and weakness
    move together, because each row reinforces the rest. Pin two rows to opposite poles and the
    other eight do not average; they tear into governance theatre <Badge layer="W" />, the form of
    planned work without its substance and the name of emergent work without its benefits. This
    curve is the author's bet, drawn. The dissent card shows the mix that beats it: a small planned
    core, async integration around it, heavyweight contracts at the seam.
  </>
);

const NOTES = [
  "There is no simulation behind this board. The model is the handbook's §2.2 table held as data, one position value t, and two thresholds (0.42 / 0.58) that decide when a reading flips — sliced verbatim into the glass below.",
  'The thresholds are authored, not measured. A drawn bet needs edges; real workstreams do not announce their position on the spectrum.',
  "The six-week run is a worked example in the recorded-run format, not an engine trace: the captions are the author's argument, step by step.",
  "The torn readings ('prescriptive on paper, descriptive in fact') are the author's renderings of the handbook's one-sentence claim about mixing halfway.",
];

const CANNOT_SHOW =
  "Where the boundary really sits for your system, or how long theatre takes to surface. Nothing here measures a real workstream's position, and the board cannot tell a load-bearing contract from a wiki page — which is exactly the inspection the dissent card says you owe the seam.";

const AUTH_POS = 8;
const TOOLING_POS = 92;

export default function SpectrumCoupler() {
  const [pos, setPos] = useState(AUTH_POS); // 0..100 toward emergent
  const [mode, setMode] = useState('coupled');
  const [armed, setArmed] = useState(false);

  const rows = couplerRead(pos / 100, mode);
  const boundary = rows[0].state === 'boundary';
  const forced = mode === 'forced';

  const status = forced
    ? 'Authority pinned central, integration pinned continuous and asynchronous; the eight unpinned readings are torn.'
    : boundary
      ? 'Nothing resolves: the handle is on the boundary.'
      : rows[0].state === 'planned'
        ? 'All ten readings sit in the planned column.'
        : 'All ten readings sit in the emergent column.';

  return (
    <LabFrame
      tag="LAB 04·A — THE COUPLER"
      register="bet"
      question="Can you move one of the ten properties and leave the other nine where they are?"
      payoff={PAYOFF}
      notes={NOTES}
      cannotShow={CANNOT_SHOW}
      glass={GLASS}
    >
      <div className="mh-controls" style={{ alignItems: 'flex-end' }}>
        <div className="mh-slider" style={{ flex: '1 1 260px', maxWidth: 420 }}>
          <label htmlFor="sc-handle">
            <span>The one handle · where this workstream's coordination lives</span>
            <span className={forced ? 'locked' : undefined}>
              {forced ? 'held by the pins' : `${pos} / 100 toward emergent`}
            </span>
          </label>
          <input
            id="sc-handle"
            type="range"
            min="0"
            max="100"
            value={pos}
            disabled={forced}
            onChange={(e) => setPos(Number(e.target.value))}
            aria-valuetext={`${pos} of 100 toward emergent`}
          />
        </div>
        <div
          className="mh-chipset"
          role="group"
          aria-label="Reference placements from the handbook"
        >
          <button
            type="button"
            className="mh-chip"
            aria-pressed={!forced && pos === AUTH_POS}
            disabled={forced}
            onClick={() => setPos(AUTH_POS)}
          >
            auth system
          </button>
          <button
            type="button"
            className="mh-chip"
            aria-pressed={!forced && pos === TOOLING_POS}
            disabled={forced}
            onClick={() => setPos(TOOLING_POS)}
          >
            internal dev tooling
          </button>
        </div>
      </div>

      <div
        role="group"
        aria-label="The ten properties of the planned/emergent spectrum"
        style={{
          border: '1px solid var(--line-soft)',
          borderRadius: 3,
          background: 'var(--paper-2)',
          padding: '10px 14px',
          margin: '12px 0 4px',
        }}
      >
        <div style={{ ...ROW_GRID, padding: '0 0 6px' }}>
          <span className="mh-kicker">Property</span>
          <span className="mh-kicker" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Planned ←</span>
            <span>→ Emergent</span>
          </span>
          <span className="mh-kicker">Reading</span>
        </div>
        {rows.map((row) => (
          <PropertyRow key={row.id} row={row} />
        ))}
        <p
          className="mono"
          aria-live="polite"
          style={{ fontSize: '11.5px', color: 'var(--ink-faint)', margin: '8px 0 0' }}
        >
          {status}
        </p>
      </div>

      <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '10px 0' }}>
        Drag the handle and watch rows nine and ten: what you are strong at and what you are weak to
        trade places in the same motion. There is no second handle. That is the claim.
      </p>

      {boundary && !forced ? (
        <p
          style={{ fontStyle: 'italic', fontSize: '14px', color: 'var(--ink-2)', margin: '8px 0' }}
        >
          You are standing on the boundary. Guarantees and adaptivity trade against each other here;
          you cannot have both in one region. You can have them in different regions, connected by a
          designed boundary (the dissent card below is exactly that move).
        </p>
      ) : null}

      <div className="mh-controls">
        <button
          type="button"
          className="mh-btn mh-btn-danger"
          onClick={() => setArmed(true)}
          disabled={armed}
          aria-label="Force the halfway mix: pin authority at the planned pole and integration at the emergent pole"
        >
          Force the halfway mix
        </button>
        <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>
          pins Authority at Central, Integration at Continuous, asynchronous
        </span>
      </div>

      {armed ? (
        <Commit
          prompt="Authority pinned central. Integration running continuous and asynchronous. What does this workstream get?"
          options={[
            { id: 'planned', label: 'The guarantees of planned' },
            { id: 'emergent', label: 'The adaptivity of emergent' },
            { id: 'both', label: 'Both: the best of each pole' },
            { id: 'neither', label: 'Neither' },
          ]}
          onReveal={() => setMode('forced')}
        >
          {(picked) => (
            <>
              <p style={{ marginTop: 0 }}>{PICK_FEEDBACK[picked]}</p>
              <div className="mh-readout">
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
                <div className="mh-stat">
                  <span className="k">Reads as</span>
                  <span className="v warn">theatre</span>
                </div>
              </div>
              <p>
                <strong>Governance theatre</strong>{' '}
                <Badge
                  layer="W"
                  note="argued from the table's reinforcement structure and watched in practice, not measured at scale"
                />
                : the form of planned work without its substance, and the name of emergent work
                without its benefits. This curve is the author's bet, drawn.
              </p>
              <Walkthrough trace={THEATRE_TRACE} />
              <div className="mh-controls">
                <button
                  type="button"
                  className="mh-btn"
                  onClick={() => setMode('coupled')}
                  disabled={!forced}
                  aria-label="Release the pins and return the board to the coupled handle"
                >
                  Release the pins
                </button>
                <button
                  type="button"
                  className="mh-btn"
                  onClick={() => setMode('forced')}
                  disabled={forced}
                  aria-label="Pin the halfway mix again"
                >
                  Pin the mix again
                </button>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>
                  sandbox · the run above is the record; the board follows the pins
                </span>
              </div>
            </>
          )}
        </Commit>
      ) : null}

      <aside
        className="mh-card"
        style={{ borderTopColor: 'var(--amber)', marginTop: 16 }}
        aria-label="Model dissent: a mix that holds"
      >
        <span className="mh-kicker" style={{ color: 'var(--amber)' }}>
          Model dissent · a mix that holds
        </span>
        <p style={{ margin: '0 0 8px' }}>
          A small planned core (the schema, the public API, the auth boundary) under central
          authority, with everything around it integrating continuously and asynchronously. By the
          board above, that should tear. It holds, and you have probably watched it hold, because of
          the third ingredient: heavyweight contracts at the seam. The core's spec still binds,
          since integrating with the core is scheduled after all, at the contract, on the core's
          clock. Each region keeps one coherent column; the boundary does the work the middle of the
          slider cannot.
        </p>
        <p style={{ margin: 0 }}>
          This is the parameterization where the author's claim fails, and the handbook's "usually"
          is carrying it. The test for whether you are in this mix or in the theatre: does the
          contract fail closed? If consumers can drift past it and nothing stops them, the seam is a
          wiki page, and the board above is reading your system correctly.
        </p>
      </aside>
    </LabFrame>
  );
}
