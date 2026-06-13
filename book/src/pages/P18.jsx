// P18 · The glass case — claim: know which layer every claim lives on,
// including this book's.
//
// The activity IS the page: the evidence sort, drawn. Three shelves run down
// a drawn case (Ⓔ evidence-backed / Ⓦ working principle / Ⓜ organizing
// metaphor). Twelve of the book's own claims, badges stripped, sit as cards in
// a tray; the reader shelves the current card with one chip and the card
// physically slides onto that shelf (a stepped re-render, CSS transition on the
// card's transform). When all twelve are placed, the author's sort overlays:
// every card that moved shelves lights amber, and each delta argues from the
// handbook's own sentence. The closer is the §4.4 distribution, drawn as bands.
//
// Bet register, and honestly so: no engine runs here. The physics is the CLAIMS
// table itself, sliced verbatim into the glass. The sort the reader is checked
// against is the author grading his own claims — a bet like any other in this
// register. The contested rows are the model dissent: the handbook shelves them
// two ways. Salvaged from labs/EvidenceSort.jsx, re-cut to a drawn scene.

import React from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, Mark, ModelNotes, glassSlice } from '../components/kit.jsx';
import selfRaw from './P18.jsx?raw';

const { useMemo, useState } = React;

/* ── The three shelves (Part I, "What kind of claim is this?") ──────────── */

const SHELVES = [
  { id: 'E', glyph: 'Ⓔ', name: 'Evidence-backed', tint: 'var(--c-docs)' },
  { id: 'W', glyph: 'Ⓦ', name: 'Working principle', tint: 'var(--amber)' },
  { id: 'M', glyph: 'Ⓜ', name: 'Organizing metaphor', tint: 'var(--c-flaky)' },
];
const SHELF_NAME = Object.fromEntries(SHELVES.map((s) => [s.id, s.name]));

/* ── The claims — twelve of the book's own, badges stripped ──────────────
   Each row carries the shelf the author shelves it on (`author`), the §4.4
   band the handbook prices it in, its kind, and whether the handbook itself
   shelves it ambiguously (`contested`). This table is the whole physics. */

const CLAIMS = [
  {
    id: 'conway',
    short: "Conway's Law",
    text: 'A platform takes the shape of the channels that built it.',
    src: 'Part I · §4.4',
    author: 'E',
    band: 'very-strong',
    kind: 'structural',
    contested: false,
  },
  {
    id: 'ostrom',
    short: "Ostrom's eight",
    text: 'Commons that survive share eight design principles.',
    src: '§2.6 · §4.4',
    author: 'E',
    band: 'very-strong',
    kind: 'structural',
    contested: false,
  },
  {
    id: 'runaway',
    short: 'Runaway is structural',
    text: 'Reinforcement that outruns decay grows without bound.',
    src: '§2.8 · §4.3',
    author: 'E',
    band: 'very-strong',
    kind: 'structural',
    contested: false,
  },
  {
    id: 'variety',
    short: 'Variety matches variety',
    text: 'A regulator must match the variety of what it regulates.',
    src: '§2.8 · §4.3',
    author: 'E',
    band: 'very-strong',
    kind: 'structural',
    contested: true,
  },
  {
    id: 'automation',
    short: 'Automation bias',
    text: 'When a system is mostly right, humans stop checking.',
    src: '§3.5 · §4.4',
    author: 'E',
    band: 'very-strong',
    kind: 'structural',
    contested: false,
  },
  {
    id: 'spectrum',
    short: 'The spectrum is real',
    text: 'Planned and emergent are ends of one real spectrum.',
    src: '§2.2',
    author: 'E',
    band: 'strong',
    kind: 'structural',
    contested: false,
  },
  {
    id: 'placement',
    short: 'Placement',
    text: 'Ask where before what; three empirical axes decide it.',
    src: '§2.3 · §4.4',
    author: 'W',
    band: 'strong-mixed',
    kind: 'operational',
    contested: false,
  },
  {
    id: 'staging',
    short: 'The staged transition',
    text: 'Terrain before loops; propose-only before auto-merge.',
    src: '§3.4 · §4.5',
    author: 'W',
    band: 'strong-mixed',
    kind: 'operational',
    contested: false,
  },
  {
    id: 'economics',
    short: 'Gate, rate, budget',
    text: 'Approval is scarce and managed in three terms.',
    src: '§3.6 · §4.4',
    author: 'W',
    band: 'strong-mixed',
    kind: 'operational',
    contested: false,
  },
  {
    id: 'trust',
    short: 'Five properties of trust',
    text: 'Trust is earned, narrow, conditional, revocable, expiring.',
    src: '§3.7 · §4.4',
    author: 'W',
    band: 'strong-mixed',
    kind: 'operational',
    contested: true,
  },
  {
    id: 'terrain',
    short: 'Terrain',
    text: 'The platform is ground that holds and decays signals.',
    src: '§2.1',
    author: 'M',
    band: 'off',
    kind: 'metaphor',
    contested: false,
  },
  {
    id: 'forces',
    short: 'The four dynamics',
    text: 'Spread, decay, reinforcement, exploration: the four forces.',
    src: '§2.8',
    author: 'M',
    band: 'off',
    kind: 'metaphor',
    contested: true,
  },
];

const KIND_TINT = {
  structural: 'var(--c-docs)',
  operational: 'var(--amber)',
  metaphor: 'var(--c-flaky)',
};

/* ── The argued deltas — every row quotes the handbook's own weighting ──── */

const ARGUED = {
  conway:
    "Part I's evidence-backed list names it outright, and §4.4 prices it in the very-strong band beside the mathematical results and the major-failure record. The top shelf holds few claims; this is one.",
  ostrom:
    '§2.6 calls Ostrom\'s work "among the most empirically grounded bodies in the social sciences"; §4.4 holds the eight principles very strong. The evidence comes from irrigation systems, fisheries, and forests — which is why the transfer to repositories is a separate, weaker claim.',
  runaway:
    'Part I counts "positive feedback is dangerous" among the structural claims, and the math is settled: §4.3\'s Keller-Segel "genuinely produces blow-up without decay." What is unsettled is where the threshold sits for a real platform; §4.5 keeps that open.',
  variety:
    'Ashby\'s Law is real mathematics and §2.8 calls the consequence "not negotiable," so the author shelves it Ⓔ. If you shelved Ⓦ, you read §4.3\'s preamble closely: the bridge from theorem to a specific gate table "is currently informal." Marked contested for that reason.',
  automation:
    '§3.5 imports it from "fields that automated decades before software did," and §4.4 holds automation-bias research very strong. The drift curve a page may draw is a modeling choice; the bias it renders is the finding. Separating the two is the layer question this sort drills.',
  spectrum:
    'Part I counts "the spectrum is real" among the structural claims; §2.2 opens by denying it is "a rhetorical device." The neighboring claim — strict ten-property co-variance — ran in bet register elsewhere. The spectrum\'s existence and its coupling sit one shelf apart.',
  placement:
    'Part I shelves placement under working principles: "the best framing I\'ve found, not because the science is settled." §4.4 prices the named operational recommendations strong-to-mixed. The three axes underneath are empirical; the discipline built on them is the bet.',
  staging:
    '§4.5 says it without softening: "the staging in Part III is a principled proposal, not a validated one." If the cost curve you watched bend elsewhere carries more weight than that label, that is the laundering the register split exists to prevent.',
  economics:
    '"The economics of approval" sits in Part I\'s working-principles list; §4.4 prices it strong-to-mixed. The queueing arithmetic needs no shelf — arithmetic is arithmetic. That this trio is how scarcity should be managed is the framing the author commits to, not a settled result.',
  trust:
    'The handbook shelves this twice. Part I\'s bullet list places "the five properties" under working principles; three paragraphs later the closing list counts the same shape among the structural claims. The honest split: the shape is structural, the operating mechanism is the bet. The clearest model dissent in the sort.',
  terrain:
    'Terrain leads Part I\'s metaphor list: "language that helps think clearly without claiming to be literally true." Every control in this book was terrain, because the word moves attention off the agent and onto the conditions. That is everything an organizing metaphor is for.',
  forces:
    '"The four dynamics" closes Part I\'s metaphor list beside terrain. The case for Ⓔ is real: the arithmetic is genuine dynamics, the theorems genuine mathematics. But the frame — that exactly these four, named this way, are the forces — is the packaging. The dynamics are mechanism; the frame is language.',
};

// The glass (constitution: glass law). No engine module backs this page, so
// the glass shows this page's own physics, verbatim: the CLAIMS table the sort
// is checked against. Sliced from this file's raw source.
const GLASS = glassSlice(selfRaw, 'const CLAIMS = [', '\n];');

/* ── The §4.4 distribution (drawn as bands) ──────────────────────────────── */

const BANDS = [
  { id: 'very-strong', label: 'Very strong' },
  { id: 'strong', label: 'Strong' },
  { id: 'strong-mixed', label: 'Strong → mixed' },
  { id: 'mixed', label: 'Mixed' },
  { id: 'sparse', label: 'Sparse' },
];

/* ── The drawn case: three shelves, cards sliding onto them ───────────────
   viewBox-scaled SVG. A tray at the top holds the unsorted deck as a stack;
   the current card is drawn large and bright in the tray mouth. Three shelf
   rails run beneath, each labeled with its glyph and tint. A committed card is
   drawn as a small colored tile resting on its shelf; tiles fill left to right.
   The transition is a stepped re-render: a placed card simply appears on its
   shelf, and the tray count drops — the motion the reader sees is the card
   leaving the tray for the shelf. */

const VW = 560;
const SHELF_H = 78;
const TRAY_H = 96;
const PAD = 16;
const RAIL_X = PAD + 168; // left edge of the tile area
const RAIL_W = VW - RAIL_X - PAD;
const TILE_W = 30;
const TILE_GAP = 6;

function ShelfScene({ placed, current, revealed }) {
  const vh = TRAY_H + SHELVES.length * SHELF_H + PAD;
  const cur = current;

  // Which shelf each placed claim sits on now (reader's pick, or — once
  // revealed — still the reader's pick, with the author's overlaid as a mark).
  const onShelf = (shelfId) => CLAIMS.filter((c) => placed[c.id] === shelfId);

  const label = revealed
    ? `Evidence case, sorted: ${CLAIMS.map((c) => `${c.short} on the ${SHELF_NAME[placed[c.id]]} shelf`).join(', ')}.`
    : cur
      ? `Evidence case. ${Object.keys(placed).length} of ${CLAIMS.length} cards shelved. Now sorting: "${cur.text}"`
      : `Evidence case. All ${CLAIMS.length} cards shelved.`;

  return (
    <svg
      viewBox={`0 0 ${VW} ${vh}`}
      role="img"
      aria-label={label}
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 10 }}
    >
      <rect x="0" y="0" width={VW} height={vh} fill="var(--paper-3)" rx="10" />

      {/* ── The tray: the unsorted deck and the current card ── */}
      <text x={PAD} y={20} fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-faint)">
        TO SORT
      </text>
      {cur ? (
        <g>
          {/* deck stack behind the current card */}
          {[3, 2, 1].map((d) => (
            <rect
              key={d}
              x={PAD + d * 3}
              y={28 - d * 2}
              width={150}
              height={TRAY_H - 34}
              rx="6"
              fill="var(--paper-2)"
              stroke="var(--line-soft)"
            />
          ))}
          {/* current card, bright, with its kind tint as a left bar */}
          <rect
            x={PAD}
            y={28}
            width={VW - PAD * 2}
            height={TRAY_H - 38}
            rx="6"
            fill="var(--paper)"
            stroke="var(--line)"
          />
          <rect x={PAD} y={28} width={5} height={TRAY_H - 38} rx="2.5" fill="var(--ink-faint)" />
          <text x={PAD + 16} y={48} fontSize="13.5" fontWeight="700" fill="var(--ink)">
            {cur.short}
          </text>
          <text x={PAD + 16} y={67} fontSize="12" fill="var(--ink-2)">
            {cur.text.length > 64 ? `${cur.text.slice(0, 62)}…` : cur.text}
          </text>
          <text
            x={VW - PAD - 8}
            y={42}
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill="var(--ink-faint)"
            textAnchor="end"
          >
            {cur.src}
          </text>
        </g>
      ) : (
        <g>
          <rect
            x={PAD}
            y={28}
            width={VW - PAD * 2}
            height={TRAY_H - 38}
            rx="6"
            fill="var(--paper-2)"
            stroke="var(--line-soft)"
          />
          <text
            x={VW / 2}
            y={28 + (TRAY_H - 38) / 2 + 5}
            fontSize="13"
            fill="var(--ink-faint)"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
          >
            {revealed ? "the author's sort, overlaid" : 'tray empty — twelve shelved'}
          </text>
        </g>
      )}

      {/* ── The three shelves ── */}
      {SHELVES.map((s, si) => {
        const top = TRAY_H + si * SHELF_H;
        const railY = top + SHELF_H - 18;
        const here = onShelf(s.id);
        return (
          <g key={s.id}>
            {/* shelf label block */}
            <text x={PAD} y={top + 30} fontSize="20" fill={s.tint}>
              {s.glyph}
            </text>
            <text x={PAD + 30} y={top + 25} fontSize="13" fontWeight="700" fill="var(--ink)">
              {s.name}
            </text>
            <text
              x={PAD + 30}
              y={top + 41}
              fontSize="10.5"
              fontFamily="var(--font-mono)"
              fill="var(--ink-faint)"
            >
              {here.length} card{here.length === 1 ? '' : 's'}
            </text>
            {/* the rail the tiles rest on */}
            <line
              x1={RAIL_X}
              y1={railY}
              x2={RAIL_X + RAIL_W}
              y2={railY}
              stroke={s.tint}
              strokeWidth="2.5"
              strokeOpacity="0.55"
              strokeLinecap="round"
            />
            {/* shelf separator */}
            {si > 0 ? (
              <line
                x1={PAD}
                y1={top}
                x2={VW - PAD}
                y2={top}
                stroke="var(--line-soft)"
                strokeWidth="1"
              />
            ) : null}
            {/* the tiles: one per claim shelved here */}
            {here.map((c, ti) => {
              const x = RAIL_X + ti * (TILE_W + TILE_GAP);
              const tileTop = railY - 34;
              // Once revealed, a card whose author-shelf differs from where the
              // reader placed it wears an amber delta ring; matches stay calm.
              const delta = revealed && c.author !== s.id;
              return (
                <g key={c.id} style={{ transition: 'opacity 240ms ease' }}>
                  <rect
                    x={x}
                    y={tileTop}
                    width={TILE_W}
                    height={30}
                    rx="4"
                    fill={KIND_TINT[c.kind]}
                    fillOpacity={revealed && c.author === s.id ? 0.85 : 0.6}
                    stroke={delta ? 'var(--amber)' : 'var(--paper-3)'}
                    strokeWidth={delta ? 2 : 1}
                  />
                  <text
                    x={x + TILE_W / 2}
                    y={tileTop + 19}
                    fontSize="11"
                    fontWeight="700"
                    fill="var(--paper)"
                    textAnchor="middle"
                  >
                    {c.short
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 3)
                      .toUpperCase()}
                  </text>
                  {c.contested ? (
                    <circle cx={x + TILE_W - 4} cy={tileTop + 4} r="3" fill="var(--amber)" />
                  ) : null}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* ── The distribution band chart (§4.4, drawn) ───────────────────────────── */

function DistributionBars() {
  const DW = 560;
  const ROW = 30;
  const LAB = 120;
  const barX = LAB + 8;
  const barW = DW - barX - 8;
  const counts = BANDS.map((b) => ({
    ...b,
    structural: CLAIMS.filter((c) => c.band === b.id && c.kind === 'structural').length,
    operational: CLAIMS.filter((c) => c.band === b.id && c.kind === 'operational').length,
  }));
  const maxN = Math.max(1, ...counts.map((c) => c.structural + c.operational));
  const metaphors = CLAIMS.filter((c) => c.band === 'off');
  const dh = BANDS.length * ROW + 56;

  return (
    <svg
      viewBox={`0 0 ${DW} ${dh}`}
      role="img"
      aria-label={`The §4.4 distribution. Structural claims cluster very-strong-to-strong; the named operational recommendations sit strong-to-mixed; nothing load-bearing rests on sparse evidence. The ${metaphors.length} metaphors take no band.`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {counts.map((b, bi) => {
        const y = bi * ROW + 8;
        const n = b.structural + b.operational;
        const w = (n / maxN) * barW;
        const sW = (b.structural / maxN) * barW;
        return (
          <g key={b.id}>
            <text
              x={LAB}
              y={y + ROW / 2 + 2}
              fontSize="11.5"
              fontFamily="var(--font-mono)"
              fill="var(--ink-2)"
              textAnchor="end"
            >
              {b.label}
            </text>
            <rect x={barX} y={y + 4} width={barW} height={ROW - 12} rx="3" fill="var(--paper-3)" />
            {b.structural > 0 ? (
              <rect
                x={barX}
                y={y + 4}
                width={sW}
                height={ROW - 12}
                rx="3"
                fill="var(--c-docs)"
                fillOpacity="0.8"
              />
            ) : null}
            {b.operational > 0 ? (
              <rect
                x={barX + sW}
                y={y + 4}
                width={w - sW}
                height={ROW - 12}
                rx="3"
                fill="var(--amber)"
                fillOpacity="0.8"
              />
            ) : null}
            {n > 0 ? (
              <text
                x={barX + w + 6}
                y={y + ROW / 2 + 2}
                fontSize="11"
                fontFamily="var(--font-mono)"
                fill="var(--ink-faint)"
              >
                {n}
              </text>
            ) : (
              <text
                x={barX + 6}
                y={y + ROW / 2 + 2}
                fontSize="10.5"
                fill="var(--ink-faint)"
                fontStyle="italic"
              >
                {b.id === 'sparse' ? 'held, not rested on' : '—'}
              </text>
            )}
          </g>
        );
      })}
      <text x={barX} y={BANDS.length * ROW + 26} fontSize="11" fill="var(--ink-faint)">
        <tspan fill="var(--c-docs)">■</tspan> structural · <tspan fill="var(--amber)">■</tspan>{' '}
        operational · metaphors take no band ({metaphors.map((m) => m.short).join(', ')})
      </text>
    </svg>
  );
}

/* ── The page ───────────────────────────────────────────────────────────── */

// Pre-load a representative state: the first five cards already shelved (most
// to their author shelf, one deliberately off so the scene shows a tray, a
// half-stocked Ⓔ shelf, and an Ⓜ tile at rest — legible the instant it loads).
const PRELOAD = { conway: 'E', ostrom: 'E', runaway: 'E', terrain: 'M', placement: 'E' };

export default function P18() {
  const [placed, setPlaced] = useState(PRELOAD);
  const [revealed, setRevealed] = useState(false);

  const order = CLAIMS;
  const nextUnsorted = useMemo(() => order.find((c) => !(c.id in placed)) ?? null, [placed, order]);
  const allPlaced = nextUnsorted === null;

  const shelve = (shelfId) => {
    if (revealed || !nextUnsorted) return;
    setPlaced((p) => ({ ...p, [nextUnsorted.id]: shelfId }));
  };
  const reshelveLast = () => {
    if (revealed) return;
    const ids = Object.keys(placed);
    if (!ids.length) return;
    const last = order.filter((c) => c.id in placed).pop();
    setPlaced((p) => {
      const next = { ...p };
      delete next[last.id];
      return next;
    });
  };
  const startOver = () => {
    setPlaced({});
    setRevealed(false);
  };

  const deltas = revealed ? CLAIMS.filter((c) => placed[c.id] !== c.author) : [];

  return (
    <Page n={18} claim="Know which layer every claim lives on — including this book's.">
      <Activity>
        <ShelfScene placed={placed} current={revealed ? null : nextUnsorted} revealed={revealed} />

        {!revealed ? (
          <div className="mh-commit" style={{ marginBottom: 0 }}>
            <span className="mh-kicker tag">
              {allPlaced
                ? 'All twelve shelved'
                : `Shelve this claim · ${Object.keys(placed).length} of ${CLAIMS.length}`}
            </span>
            {allPlaced ? (
              <p style={{ margin: '0 0 10px', fontSize: '14px' }}>
                Your sort stands. Reveal sets it against the author&apos;s, card by card; every
                shelf that differs lights amber and argues from the handbook&apos;s own sentence.
              </p>
            ) : (
              <div className="mh-chipset" role="group" aria-label={`Shelve: ${nextUnsorted.short}`}>
                {SHELVES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="mh-chip"
                    onClick={() => shelve(s.id)}
                    style={{ borderColor: s.tint }}
                  >
                    {s.glyph} {s.name}
                  </button>
                ))}
              </div>
            )}
            <div className="mh-controls" style={{ margin: '10px 0 0' }}>
              <button
                type="button"
                className="mh-btn"
                onClick={reshelveLast}
                disabled={Object.keys(placed).length === 0}
                aria-label="Take the last card back off its shelf"
              >
                Back one
              </button>
              {allPlaced ? (
                <button
                  type="button"
                  className="mh-btn mh-btn-primary"
                  onClick={() => setRevealed(true)}
                >
                  Reveal the author&apos;s sort
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div>
            <div className="mh-feedback" role="status">
              <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
                The author&apos;s sort · drawn as the author&apos;s bet
              </span>
              {deltas.length === 0
                ? 'You and the author land together on all twelve. Read the contested rows anyway — they are where the handbook argues with itself.'
                : `You and the author agree on ${CLAIMS.length - deltas.length} of ${CLAIMS.length}; the ${deltas.length === 1 ? 'amber tile is your delta' : `${deltas.length} amber tiles are your deltas`}. Each is argued below.`}
            </div>
            <div style={{ margin: '12px 0 0' }}>
              {CLAIMS.map((c) => {
                const delta = placed[c.id] !== c.author;
                return (
                  <details
                    key={c.id}
                    open={delta || c.contested || undefined}
                    style={{ borderTop: '1px solid var(--line-soft)', padding: '8px 0' }}
                  >
                    <summary style={{ cursor: 'pointer', fontSize: '14px', color: 'var(--ink)' }}>
                      <strong>{c.short}</strong>
                      <span style={{ color: 'var(--ink-faint)' }}>
                        {' '}
                        · yours <Badge layer={placed[c.id]} /> · author <Badge layer={c.author} />
                      </span>{' '}
                      <span
                        className="mono"
                        style={{
                          fontSize: '10.5px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: delta ? 'var(--amber)' : 'var(--ink-faint)',
                        }}
                      >
                        {delta ? 'differs' : 'same shelf'}
                      </span>
                      {c.contested ? (
                        <span
                          className="mono"
                          style={{
                            fontSize: '10.5px',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'var(--amber)',
                            marginLeft: 8,
                          }}
                        >
                          contested
                        </span>
                      ) : null}
                    </summary>
                    <div style={{ padding: '8px 0 4px', fontSize: '14px', color: 'var(--ink-2)' }}>
                      <p
                        style={{
                          margin: '0 0 8px',
                          fontStyle: 'italic',
                          color: 'var(--ink-faint)',
                          fontSize: '13px',
                        }}
                      >
                        &ldquo;{c.text}&rdquo; — {c.src}
                      </p>
                      <p style={{ margin: 0 }}>
                        {delta ? (
                          <>
                            You shelved it as {SHELF_NAME[placed[c.id]].toLowerCase()}; the author
                            shelves it as {SHELF_NAME[c.author].toLowerCase()}.{' '}
                          </>
                        ) : null}
                        {ARGUED[c.id]}
                      </p>
                    </div>
                  </details>
                );
              })}
            </div>

            <span className="mh-kicker" style={{ display: 'block', margin: '18px 0 4px' }}>
              The distribution · §4.4, drawn
            </span>
            <DistributionBars />

            <div className="mh-feedback" role="status" style={{ marginTop: 14 }}>
              Placement is the craft. The considered yes is the moment the work becomes real. It
              used to be building the thing; now it is building the thing that makes the thing.
            </div>

            <div className="mh-controls" style={{ margin: '14px 0 0' }}>
              <button type="button" className="mh-btn" onClick={startOver}>
                Sort again
              </button>
            </div>
          </div>
        )}

        <ModelNotes
          register="bet"
          notes={[
            "No engine runs behind this page. The physics is the CLAIMS table in the glass: twelve of the book's claims, each carrying the shelf and the §4.4 band the handbook assigns it. The sort you are checked against is the author grading his own claims — itself a bet, which is why this page sits in the bet register.",
            "Three rows wear a contested dot (the amber pip on the tile): the handbook shelves them two ways. Trust's five properties most of all — a working principle in one paragraph of Part I, a structural claim in another. Those are the figure's model dissent.",
            'The delta count is a count of differences, not a score. On a contested row a delta can mean you read the handbook more strictly than the author does.',
          ]}
          cannotShow="whether the author's sort is right. These shelves are the author grading his own claims, and §4.4 is one person's weighting of his own sources. What the exercise installs is the habit — asking what layer a claim sits at, including about this book. A book that sorted its own claims and found them all evidence-backed should worry you more than this one."
          glass={GLASS}
        />
      </Activity>

      <Seen>
        Twelve of the book&apos;s own claims, badges stripped, shelved by you — then the
        author&apos;s sort overlaid, every difference lit and argued. The structural claims cluster
        very-strong; the operational recommendations are named as bets; the metaphors take no grade.
      </Seen>

      <Takeaway>
        The framework <strong>weighs its own claims</strong> and prices them in the open. The habit
        it installs is the point: ask what layer any claim sits on — including this book&apos;s.
      </Takeaway>

      <Deeper title="Lineage · ten traditions, one line each (§4.1)">
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>
            <strong>Swarm intelligence.</strong> Grassé&apos;s <em>stigmergie</em> (1959);
            Dorigo&apos;s Ant Colony Optimization. The coordination-through-traces mechanism.{' '}
            <Badge layer="E" />
          </li>
          <li>
            <strong>Distributed knowledge.</strong> Hayek 1945 on prices as compressed signals;
            Ostrom 1990 on commons that govern themselves. <Badge layer="E" />
          </li>
          <li>
            <strong>Open source.</strong> Raymond&apos;s <em>Cathedral and the Bazaar</em> (1997) —
            the vocabulary this framework renames to planned/emergent. The debt is total.
          </li>
          <li>
            <strong>Organizations.</strong> Conway 1968 (structure ships structure); Simon 1962
            (near-decomposability); Brand 1994 (pace layering). <Badge layer="E" />
          </li>
          <li>
            <strong>Cybernetics.</strong> Ashby 1956 (requisite variety as a lower bound);
            Beer&apos;s viable system model.
          </li>
          <li>
            <strong>Military command.</strong> Prussian <em>Auftragstaktik</em>: specify intent,
            delegate means, trust the unit. <Badge layer="E" />
          </li>
          <li>
            <strong>Distributed systems.</strong> CAP, CRDTs, reconciliation, gossip — the
            engineering vocabulary for emergent coordination. Formal methods (TLA+, property
            testing) for planned guarantees.
          </li>
          <li>
            <strong>Human factors.</strong> Bainbridge 1983 (the ironies of automation); the
            automation-bias and skill-atrophy literature. <Badge layer="E" />
          </li>
          <li>
            <strong>Security.</strong> Saltzer &amp; Schroeder (1975) least privilege; capability
            security; NIST zero-trust. The §3.7 authority model is a direct adaptation.
          </li>
          <li>
            <strong>Complexity philosophy.</strong> Scott 1998 (legibility vs <em>metis</em>);
            Alexander 1965 (&ldquo;A City is Not a Tree&rdquo;).
          </li>
        </ul>
        <p style={{ marginBottom: 0, fontSize: '13px', color: 'var(--ink-faint)' }}>
          The name is the author&apos;s; the ideas are not. Where a term is coined or renamed, the
          lineage is named. The goal is a shared language, not a claim of novelty.
        </p>
      </Deeper>

      <Deeper title="The math, held honestly (§4.3)">
        <p style={{ marginTop: 0 }}>
          The results below are real mathematics. In this framework they function as{' '}
          <strong>analogies and design intuitions</strong>, not predictive models a team computes
          against. The bridge from a theorem to a specific operational decision is currently
          informal, and the framework deliberately hands you no state variables to solve.{' '}
          <Badge layer="M" note="real math, informal bridge" />
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <tbody>
            {[
              [
                'Keller-Segel',
                'Without decay, self-reinforcing aggregation blows up in finite time. The form of runaway.',
                'Runaway (P06)',
              ],
              [
                'Bifurcation',
                'Self-reinforcing dynamics change qualitatively at critical thresholds. Trail formation.',
                'Signals (P05)',
              ],
              [
                'ACO convergence',
                'Reinforcement reaches the optimum only with a positive floor preserving exploration. The floor is not decorative.',
                'Signals (P05)',
              ],
              [
                'CAP / FLP',
                'Consistency, availability, partition-tolerance are not simultaneously achievable; async consensus tolerates no failures.',
                'Nobody calls anyone (P02)',
              ],
              [
                "Ashby's Law",
                'A regulator must match the regulated in distinguishable states. The bridge to a gate table is informal.',
                'Guardrails (P09)',
              ],
              [
                'Coordination complexity',
                'Full mesh is N²; a shared medium is N. Combinatorial, not ideological.',
                'Nobody calls anyone (P02)',
              ],
            ].map(([name, what, page]) => (
              <tr key={name} style={{ borderTop: '1px solid var(--line-soft)' }}>
                <td
                  style={{
                    padding: '7px 10px 7px 0',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    verticalAlign: 'top',
                  }}
                >
                  {name}
                </td>
                <td style={{ padding: '7px 10px 7px 0', verticalAlign: 'top' }}>{what}</td>
                <td
                  className="mono"
                  style={{
                    padding: '7px 0',
                    fontSize: '11.5px',
                    color: 'var(--ink-faint)',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'top',
                  }}
                >
                  borrowed by {page}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginBottom: 0, fontSize: '13px', color: 'var(--ink-faint)' }}>
          These are the substrate of why the framework&apos;s instincts hold up — not equations to
          solve against your platform.
        </p>
      </Deeper>

      <Deeper title="Open questions · the unbuilt benches (§4.5)">
        <p style={{ marginTop: 0 }}>
          The frontier, not flaws. A team holding the framework lightly here — treating it as a
          starting point for its own learning — will outperform one treating any recommendation as
          settled. <Badge layer="W" />
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          {[
            [
              'Phase-transition thresholds',
              'The mathematics says they exist for multi-agent systems; the specific numbers are not established.',
            ],
            [
              'Failure-mode distribution',
              'What autonomous coding agents fail at, in production, at scale. Most interesting data is proprietary.',
            ],
            [
              'Supervised → autonomous',
              'How teams actually move agents along the staging. Part III is a principled proposal, not a validated one.',
            ],
            [
              'Long-term skill atrophy',
              'Aviation and medicine suggest significant effects; whether they manifest in software, at what cadence, is unknown.',
            ],
            [
              'Specs and agents, matured',
              'How specifications and agents should relate in mature workflows. The intuitive case is strong; the empirical case is young.',
            ],
            [
              'Trust across model upgrades',
              'The theory says earned trust should not transfer; the economics say teams will try anyway.',
            ],
          ].map(([title, body]) => (
            <div
              key={title}
              style={{
                border: '1px dashed var(--ink-faint)',
                borderRadius: 6,
                padding: '10px 12px',
                background: 'var(--paper-2)',
                opacity: 0.85,
              }}
            >
              <span className="mh-kicker" style={{ color: 'var(--ink-faint)' }}>
                {title}
              </span>
              <p style={{ margin: '6px 0 0', fontSize: '13px' }}>{body}</p>
            </div>
          ))}
        </div>
        <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--ink-faint)' }}>
          The spectrum applies to the framework itself: its invariants are planned, its specific
          practices are emergent. <Mark kind="real" note="the handbook's own §4.5 closing line" />
        </p>
      </Deeper>
    </Page>
  );
}
