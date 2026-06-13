// P11 · Alive — claim: a healthy system has a readable signature.
//
// The activity IS the page: the triage deck. One health panel at a time —
// five gauges of §2.12 (variety, flow, escalations, signal-outcome, commons)
// drawn as sparkline traces over a compressed fortnight, a day-cursor sweeping
// left to right (reduced motion: the full trace, cursor parked at day 14). The
// reader reads the shape, commits to one of five signatures, and the panel
// quotes the mechanism tell and names what it actually was. Six deals; a
// misread category gets re-dealt before the set closes.
//
// Every series is triage.js, the same engine the gauges draw, on a pinned
// seed. The signatures are readable at a glance long before they are provable —
// that is the steward's working condition, and the whole point of the drill.

import React from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, ModelNotes, glassSlice } from '../components/kit.jsx';
import { usePrefersReducedMotion } from '../shared/usePrefersReducedMotion.js';
import { triageDeck, TRIAGE_LABELS, GAUGES } from '../engine/scenarios/triage.js';
import triageSrc from '../engine/scenarios/triage.js?raw';

const { useEffect, useMemo, useRef, useState } = React;

/* ── The deal: six panels, every signature shown, misreads re-dealt ─────── */

const SEED = 7;

// Cast each gauge a colour and a one-word axis sense. escalations reads
// "healthy is low-but-nonzero", so its track is sensed differently — the
// engine note carries that; here colour is all the scene needs.
const GAUGE_COLOR = {
  variety: 'var(--c-flaky)',
  flow: 'var(--c-backfill)',
  escalations: 'var(--c-security)',
  signalOutcome: 'var(--c-triage)',
  commons: 'var(--c-docs)',
};

// The five signatures the reader sorts onto. Order is TRIAGE_LABELS; the
// short word is what the chip shows, the gloss is the recognisable handle.
const SIG = {
  healthy: { word: 'healthy', gloss: 'alive: wobbling, paged, bounded' },
  'emergent-runaway-forming': {
    word: 'runaway forming',
    gloss: 'throughput up, variety and escalations down',
  },
  'planned-stall': { word: 'planned stall', gloss: 'completions sag, queue and escalations climb' },
  'hybrid-theatre': { word: 'theatre', gloss: 'every gauge nominal and motionless' },
  'over-stabilized': { word: 'over-stabilized', gloss: 'spotless, rigid, a dent that never heals' },
};

/**
 * Order ten cards into a six-deal sequence: one of every signature first (so
 * all five shapes are seen), then a sixth slot held open. A misread on any
 * deal swaps the next unseen-or-spare card for one of the missed category, so
 * the reader meets a category they got wrong again before the set closes.
 */
function buildDeals(deck) {
  const firstOf = (label) => deck.find((c) => c.label === label);
  const opening = TRIAGE_LABELS.map(firstOf).filter(Boolean);
  const spare = deck.find((c) => !opening.includes(c)) ?? deck[deck.length - 1];
  return [...opening, spare];
}

/* ── The drawn panel: five gauge sparklines over a fortnight ────────────── */
//
// viewBox-scaled SVG. Each gauge is a row: a name on the left, a track, the
// 14-day trace as a polyline cast in the gauge colour, a soft fill under it,
// and the current-day value on the right. A vertical day-cursor sweeps the
// whole panel left to right; only the portion of each trace left of the cursor
// is drawn (a stepped reveal — the fortnight compressed into ~3.5s). The shape
// is legible the instant the sweep finishes, which is the steward's read.

const VW = 520;
const ROW_H = 56;
const PAD_X = 14;
const LABEL_W = 132;
const VAL_W = 46;
const TRACK_X = PAD_X + LABEL_W;
const TRACK_W = VW - TRACK_X - VAL_W - PAD_X;
const ROW_PAD = 9; // vertical inset of the trace inside its row
const HEAD_H = 26;

const xAt = (day, days) => TRACK_X + (day / (days - 1)) * TRACK_W;

function gaugePath(series, rowTop, days) {
  const top = rowTop + ROW_PAD;
  const h = ROW_H - ROW_PAD * 2;
  return series.map((v, d) => `${xAt(d, days)},${top + (1 - v) * h}`).join(' ');
}

function HealthPanel({ card, day, revealed }) {
  const days = card.days;
  const cursorX = xAt(day, days);
  const vh = HEAD_H + GAUGES.length * ROW_H + 10;
  const label =
    `Health panel: ${card.surface}. Five gauges over a fortnight — ` +
    GAUGES.map((g) => {
      const s = card.gauges[g.id];
      const trend = s[s.length - 1] - s[0];
      const word = trend > 0.08 ? 'rising' : trend < -0.08 ? 'falling' : 'flat';
      return `${g.name} ${word} at ${s[Math.min(day, days - 1)].toFixed(2)}`;
    }).join(', ') +
    `. ${revealed ? `The signature is ${SIG[card.label].word}: ${card.tell}` : 'Read the shape, then commit.'}`;

  return (
    <svg
      viewBox={`0 0 ${VW} ${vh}`}
      role="img"
      aria-label={label}
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 10 }}
    >
      <rect x="0" y="0" width={VW} height={vh} fill="var(--paper-3)" rx="10" />

      {/* fortnight scale across the top */}
      <text
        x={TRACK_X}
        y={17}
        fontSize="10.5"
        fontFamily="var(--font-mono)"
        fill="var(--ink-faint)"
      >
        day 1
      </text>
      <text
        x={TRACK_X + TRACK_W}
        y={17}
        fontSize="10.5"
        fontFamily="var(--font-mono)"
        fill="var(--ink-faint)"
        textAnchor="end"
      >
        day 14
      </text>

      {GAUGES.map((g, gi) => {
        const rowTop = HEAD_H + gi * ROW_H;
        const top = rowTop + ROW_PAD;
        const h = ROW_H - ROW_PAD * 2;
        const series = card.gauges[g.id];
        const color = GAUGE_COLOR[g.id];
        const cur = series[Math.min(day, days - 1)];
        const full = gaugePath(series, rowTop, days);
        // Reveal only up to the cursor day (stepped). Fill polygon closes the
        // visible run down to the row baseline.
        const visible = series
          .slice(0, day + 1)
          .map((v, d) => `${xAt(d, days)},${top + (1 - v) * h}`)
          .join(' ');
        const fill = `${TRACK_X},${top + h} ${visible} ${cursorX},${top + h}`;
        return (
          <g key={g.id}>
            {/* row baseline + midline */}
            <line
              x1={TRACK_X}
              y1={top + h}
              x2={TRACK_X + TRACK_W}
              y2={top + h}
              stroke="var(--line-soft)"
              strokeWidth="1"
            />
            <line
              x1={TRACK_X}
              y1={top + h / 2}
              x2={TRACK_X + TRACK_W}
              y2={top + h / 2}
              stroke="var(--line-soft)"
              strokeWidth="0.6"
              strokeDasharray="3 5"
            />
            {/* gauge name */}
            <text
              x={PAD_X}
              y={rowTop + ROW_H / 2 - 4}
              fontSize="13"
              fontWeight="600"
              fill="var(--ink)"
            >
              {g.name}
            </text>
            <text x={PAD_X} y={rowTop + ROW_H / 2 + 11} fontSize="9.5" fill="var(--ink-faint)">
              {g.id === 'escalations'
                ? 'low-but-nonzero = well'
                : g.note.split(' ').slice(0, 4).join(' ')}
            </text>
            {/* ghost of the full trace, faint, so rest-state reads complete */}
            <polyline
              points={full}
              fill="none"
              stroke={color}
              strokeWidth="1"
              strokeOpacity="0.22"
            />
            {/* revealed run, drawn left of the cursor */}
            <polygon points={fill} fill={color} fillOpacity="0.13" />
            <polyline
              points={visible}
              fill="none"
              stroke={color}
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* current-day dot */}
            <circle
              cx={cursorX}
              cy={top + (1 - cur) * h}
              r="3.4"
              fill={color}
              stroke="var(--paper)"
              strokeWidth="1.4"
            />
            {/* current value */}
            <text
              x={VW - PAD_X}
              y={rowTop + ROW_H / 2 + 5}
              fontSize="14"
              fontWeight="700"
              fontFamily="var(--font-mono)"
              fill={color}
              textAnchor="end"
            >
              {cur.toFixed(2)}
            </text>
          </g>
        );
      })}

      {/* the sweeping day-cursor */}
      <line
        x1={cursorX}
        y1={HEAD_H - 4}
        x2={cursorX}
        y2={vh - 6}
        stroke="var(--ink-2)"
        strokeWidth="1.2"
        strokeOpacity="0.6"
      />
    </svg>
  );
}

/* ── The glass (constitution: glass law) ────────────────────────────────── */

const GLASS = [
  glassSlice(triageSrc, 'const SIGNATURES = {', '\n};'),
  glassSlice(triageSrc, 'export function triageDeck', '\n}'),
].join('\n\n// ── and ──\n\n');

/* ── The page ───────────────────────────────────────────────────────────── */

export default function P11() {
  const reduced = usePrefersReducedMotion();
  const deals = useMemo(() => buildDeals(triageDeck(SEED)), []);

  const [order, setOrder] = useState(deals);
  const [dealIdx, setDealIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [missed, setMissed] = useState([]); // labels read wrong, re-dealt at the end

  const card = order[dealIdx];
  const last = order.length - 1;
  const done = dealIdx > last;

  // The fortnight sweep: a day cursor 0..days-1 advancing on an interval. The
  // reduced-motion reader gets the finished frame and no animation; everyone
  // gets the full frame once the panel is read (revealed).
  const days = card?.days ?? 14;
  const [day, setDay] = useState(reduced ? days - 1 : 0);
  const tickRef = useRef(0);

  // Restart the sweep on every new deal (motion readers only).
  useEffect(() => {
    if (reduced || done) {
      setDay(days - 1);
      return undefined;
    }
    setDay(0);
    tickRef.current = window.setInterval(() => {
      setDay((d) => {
        if (d >= days - 1) {
          window.clearInterval(tickRef.current);
          return days - 1;
        }
        return d + 1;
      });
    }, 230);
    return () => window.clearInterval(tickRef.current);
  }, [dealIdx, reduced, done, days]);

  // Once committed, jump to the finished fortnight so the whole shape shows.
  useEffect(() => {
    if (picked !== null) {
      window.clearInterval(tickRef.current);
      setDay(days - 1);
    }
  }, [picked, days]);

  if (done) {
    return (
      <Page n={11} claim="A healthy system has a readable signature.">
        <Activity>
          <div className="mh-feedback" role="status" style={{ fontSize: '15px' }}>
            That's the deck: six panels read. No score — the arguments are what you carry. You
            learned the five shapes the way a clinician learns a heartbeat: by seeing them move.
          </div>
        </Activity>
        <Seen>
          Each panel was the same five gauges over the same fortnight. Only the shape changed, and
          the shape is the diagnosis.
        </Seen>
        <Takeaway>
          When variety stays high-but-bounded, flow holds, escalations are rare-but-real, signals
          track outcomes, and the commons stays clean — the system is <strong>alive</strong>. The
          read comes before the proof.
        </Takeaway>
        {FOLD}
      </Page>
    );
  }

  const truth = SIG[card.label];
  const correct = picked === card.label;

  const commit = (label) => {
    if (picked !== null) return;
    setPicked(label);
    if (label !== card.label && !missed.includes(card.label)) {
      // Re-deal the misread category into the final slot: swap the spare card
      // for the other card of this signature, if one is still unseen.
      const seenIds = order.slice(0, dealIdx + 1).map((c) => c.id);
      const replacement = triageDeck(SEED).find(
        (c) => c.label === card.label && !seenIds.includes(c.id),
      );
      if (replacement) {
        setOrder((o) => {
          const next = o.slice();
          next[last] = replacement;
          return next;
        });
      }
      setMissed((m) => [...m, card.label]);
    }
  };

  const advance = () => {
    setPicked(null);
    setDealIdx((i) => i + 1);
  };

  return (
    <Page n={11} claim="A healthy system has a readable signature.">
      <Activity>
        <div
          className="mh-controls"
          style={{ justifyContent: 'space-between', alignItems: 'baseline' }}
        >
          <span className="mh-kicker">
            Panel {dealIdx + 1} of {order.length}
          </span>
          <span
            className="mono"
            style={{ fontSize: '12.5px', color: 'var(--ink-faint)', textAlign: 'right' }}
          >
            {card.surface}
          </span>
        </div>

        <HealthPanel card={card} day={day} revealed={picked !== null} />

        <div className="mh-commit" style={{ marginBottom: 0 }}>
          <span className="mh-kicker tag">Read first · which signature?</span>
          <div className="mh-chipset" role="group" aria-label="Pick the signature">
            {TRIAGE_LABELS.map((label) => (
              <button
                key={label}
                type="button"
                className="mh-chip"
                aria-pressed={picked === label}
                disabled={picked !== null && picked !== label}
                onClick={() => commit(label)}
              >
                {SIG[label].word}
              </button>
            ))}
          </div>

          {picked !== null ? (
            <div className="mh-feedback">
              <span
                className="mh-kicker"
                style={{
                  display: 'block',
                  marginBottom: 6,
                  color: correct ? 'var(--accent-ink)' : 'var(--amber)',
                }}
              >
                {correct ? 'Read confirmed' : `You read ${SIG[picked].word}`} · it was {truth.word}
              </span>
              <p style={{ margin: '0 0 6px' }}>
                <strong>The tell.</strong> {card.tell}
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-faint)' }}>
                {truth.gloss}.{' '}
                {correct
                  ? 'The shape gave it away before any number could prove it.'
                  : `You'll meet a ${truth.word} panel again before the set closes.`}
              </p>
              <div className="mh-controls" style={{ margin: '10px 0 0' }}>
                <button type="button" className="mh-btn mh-btn-primary" onClick={advance}>
                  {dealIdx < last ? 'Next panel' : 'Finish'}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <ModelNotes
          register="mechanism"
          notes={[
            'Every series is triage.js on a pinned seed — the same engine the gauges draw. Two cards per signature: the Kellman recipe, vary the surface, hold the mechanism.',
            'escalations reads inverted: low-but-nonzero is healthy. Zero is the runaway tell (humans stopped being called); climbing is the stall tell (nothing fits the plan).',
            'The signature is readable long before it is provable. The sweep compresses a fortnight; the diagnosis lands the instant the shape resolves, not when a metric crosses a line.',
          ]}
          cannotShow="where your fleet's bands sit. High-but-bounded variety, rare-but-real escalations — the numbers that count as healthy are properties of your terrain, not constants this deck can hand you."
          glass={GLASS}
        />
      </Activity>

      <Seen>
        Five gauges, one fortnight, and the diagnosis is in the shape: a flatline that never wobbles
        is theatre; escalations falling to zero while throughput holds is runaway forming, not calm.
      </Seen>

      <Takeaway>
        A live system has a <strong>signature</strong> you can read at a glance — variety bounded,
        flow steady, escalations rare-but-real, signals tracking outcomes, commons clean. Learn the
        shape; it beats any checklist.
      </Takeaway>

      {FOLD}
    </Page>
  );
}

/* ── The fold: the five signs, verbatim §2.12 ──────────────────────────── */

const FOLD = (
  <Deeper title="The five signs (§2.12)">
    <p style={{ marginTop: 0 }}>
      Learn the signature. It's worth more than any checklist. When all five hold, the system is, in
      the framework's sense, <strong>alive</strong> — kept that way not by freezing it (which kills
      it) but by maintaining the conditions under which it stays a healthy dynamical system.{' '}
      <Badge layer="W" />
    </p>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
      <tbody>
        <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
          <td style={{ padding: '8px 12px 8px 0', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Variety high but bounded
          </td>
          <td style={{ padding: '8px 0' }}>
            Different agents solve similar problems differently, within a range the team recognizes.
            Outliers are a sign of health; their absence signals premature convergence.
          </td>
        </tr>
        <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
          <td style={{ padding: '8px 12px 8px 0', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Flow steady
          </td>
          <td style={{ padding: '8px 0' }}>
            Arrival and completion rates match over moderate windows. Sudden WIP accumulation is a
            bottleneck; sudden evaporation is silent drops.
          </td>
        </tr>
        <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
          <td style={{ padding: '8px 12px 8px 0', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Escalations rare but real
          </td>
          <td style={{ padding: '8px 0' }}>
            When humans are called, it's for something that genuinely needs judgment. Frequent → the
            autonomy envelope is too narrow. Zero → too wide, or the system has stopped surfacing
            real problems.
          </td>
        </tr>
        <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
          <td style={{ padding: '8px 12px 8px 0', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Signals correlate with outcomes
          </td>
          <td style={{ padding: '8px 0' }}>
            When evals say quality is up, users say quality is up.{' '}
            <em>
              When internal signals diverge from external reality, it's the earliest and most
              important warning that the system has begun to optimize for its own metrics.
            </em>
          </td>
        </tr>
        <tr>
          <td style={{ padding: '8px 12px 8px 0', fontWeight: 600, whiteSpace: 'nowrap' }}>
            The commons is clean
          </td>
          <td style={{ padding: '8px 0' }}>
            Stale signals pruned. Abandoned branches die. Unused tools retired. A commons slowly
            filling with cruft is slowly becoming uninhabitable.
          </td>
        </tr>
      </tbody>
    </table>
    <p style={{ marginBottom: 0, fontSize: '13.5px', color: 'var(--ink-faint)' }}>
      The four failure shapes the deck teaches against: runaway forming (variety and escalations
      collapse while flow rises), planned stall (completions sag, escalations climb), theatre (every
      gauge nominal and motionless — live systems wobble, reports flatline), and over-stabilized
      (spotless and rigid, a disturbance leaves a dent that never re-rounds).
    </p>
  </Deeper>
);
