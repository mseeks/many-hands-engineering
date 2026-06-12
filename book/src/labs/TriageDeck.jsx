// TriageDeck.jsx — LAB 13·A, the book's perceptual-learning instrument
// (Ch 13, DESIGN §6.7; first full deal — re-dealt in Ch 17 and Ch 21).
//
// Ten health-panel cards dealt one at a time: the five gauges of §2.12
// animating over a compressed fortnight (reduced motion: the full fortnight
// as a static frame). Five answer chips, commit before reveal, feedback that
// quotes the card's mechanism tell. A signature the reader misreads is
// re-dealt once at the end of the run. No scores; a quiet card-k-of-n.
//
// Bet register: no dynamics engine runs behind these gauges. The shapes are
// drawn to the handbook's §2.12 descriptions — seeded jitter over authored
// curves — and the lab says so, with the dissent card marking the window
// where the glance fails.

import { useEffect, useState } from 'react';
import { Badge, Commit, LabFrame, Mark, glassSlice } from '../components/kit.jsx';
import { usePrefersReducedMotion } from '../shared/usePrefersReducedMotion.js';
import { GAUGES, triageDeck } from '../engine/scenarios/triage.js';
import triageRaw from '../engine/scenarios/triage.js?raw';

/* ── The deal (module-level: same seed, same ten cards, forever) ───────── */

// Seed 10 chosen for the deal it pins: a healthy card opens (the at-rest
// baseline), and the dissent exhibit's payments core lands ninth, so the
// cropped window below never spoils the card it crops.
const SEED = 10;
const DECK = triageDeck(SEED);
const DAYS = DECK[0].days;
const DAY_MS = 700; // 14 days in ~10 seconds: the deal is a glance, by design

// The dissent exhibit: the over-stabilized payments core, window stopped at
// day 7 — the day before its disturbance exists to be read.
const DISSENT_CARD = DECK.find((c) => c.id === 'stable-payments-core');
const DISSENT_DAY = 7;

const GLASS = [
  glassSlice(triageRaw, 'function series(rng', '\n}'),
  glassSlice(triageRaw, 'const SIGNATURES = {', '\n};'),
  glassSlice(triageRaw, 'export function triageDeck', '\n}'),
].join('\n\n');

/* ── The five signatures, as argued feedback ───────────────────────────── */

const OPTIONS = [
  { id: 'healthy', label: 'Healthy' },
  { id: 'emergent-runaway-forming', label: 'Emergent runaway forming' },
  { id: 'planned-stall', label: 'Planned stall' },
  { id: 'hybrid-theatre', label: 'Hybrid theatre' },
  { id: 'over-stabilized', label: 'Over-stabilized' },
];

// What each signature looks like on a panel, and the mechanism beneath it.
// Written to discriminate the near-misses: runaway and stall both move, but
// in opposite directions on flow and escalations; theatre and over-stabilized
// are both quiet, but one is motionless everywhere and the other is rigid
// with a dent.
const READS = {
  healthy: {
    name: 'Healthy',
    reads:
      'variety holding with outliers, flow steady, somebody still paged now and then, ' +
      'signals tracking outcomes, a commons that stays clean, and every line wobbling',
    mechanism:
      'Wobble is what alive looks like. Outliers are a sign of health; their absence is ' +
      'premature convergence. Escalations rare but real mean the autonomy envelope sits ' +
      'where judgment actually lives.',
  },
  'emergent-runaway-forming': {
    name: 'Emergent runaway forming',
    reads:
      'throughput holding or rising while variety collapses, escalations going to zero, ' +
      'and the signal-outcome line parting company with reality',
    mechanism:
      'Reinforcement is outrunning decay: every hand converging on the same hot path while ' +
      'the humans stop being called. Flow is the last gauge to admit it, which is why it is ' +
      'the one everyone watches.',
  },
  'planned-stall': {
    name: 'Planned stall',
    reads:
      'completions sagging while arrivals keep their pace, escalations climbing as ' +
      'everything queues for human judgment, and variety pinned low the whole run',
    mechanism:
      'The spec is updating slower than reality, so nothing fits the plan and everything ' +
      'escalates. The accumulating WIP is the queue announcing the bottleneck.',
  },
  'hybrid-theatre': {
    name: 'Hybrid theatre',
    reads:
      'every gauge nominal and motionless for the whole fortnight, with the signal-outcome ' +
      'line leaking quietly down',
    mechanism:
      'Live systems wobble; reports flatline. A motionless panel is describing the claimed ' +
      'system, and the slow signal-outcome leak is the running one disagreeing.',
  },
  'over-stabilized': {
    name: 'Over-stabilized',
    reads:
      'a spotless commons, escalations near zero, variety on the floor, and a mid-window ' +
      'dent in flow and signal-outcome that never re-rounds',
    mechanism:
      'Entropy fought too well becomes its own pathology: stability spent the budget ' +
      'adaptation needed, and a system that cannot re-round after a disturbance has stopped ' +
      'being able to learn.',
  },
};

// One glance-line per signature, for the closing recap.
const GLANCE = {
  healthy: 'Wobble inside a recognized range; somebody still gets paged',
  'emergent-runaway-forming':
    'Quieter and faster at once: variety down, flow up, escalations to zero',
  'planned-stall': 'Arrivals keep pace, completions sag, everything escalates',
  'hybrid-theatre': 'Every gauge nominal and motionless; signal-outcome quietly leaking',
  'over-stabilized': 'Spotless and rigid; the mid-window dent never re-rounds',
};

const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const fmt = (v) => v.toFixed(2);

/* ── The five-gauge panel ──────────────────────────────────────────────── */

function GaugeRow({ gauge, values, day, days }) {
  const W = 300;
  const H = 34;
  const P = 4;
  const upto = Math.max(1, Math.min(day, days));
  const shown = values.slice(0, upto);
  const x = (i) => P + (i * (W - 2 * P)) / (days - 1);
  const y = (v) => H - P - v * (H - 2 * P);
  const points = shown.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const now = shown[upto - 1];
  const lowest = Math.min(...shown);
  const highest = Math.max(...shown);
  const aria =
    `${gauge.name} (${gauge.note}) through day ${upto} of ${days}: ` +
    `starts ${fmt(values[0])}, low ${fmt(lowest)}, high ${fmt(highest)}, now ${fmt(now)}`;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '118px minmax(0, 1fr) 40px',
        gap: 10,
        alignItems: 'center',
      }}
    >
      <span className="mh-kicker" title={gauge.note}>
        {gauge.name}
      </span>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={aria}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          background: 'var(--paper)',
          border: '1px solid var(--line-soft)',
          borderRadius: 3,
        }}
      >
        <line x1={P} x2={W - P} y1={y(0.5)} y2={y(0.5)} stroke="var(--line-soft)" strokeWidth="1" />
        <polyline points={points} fill="none" stroke="var(--blue)" strokeWidth="1.8" />
        <circle cx={x(upto - 1)} cy={y(now)} r="2.6" fill="var(--ink)" />
      </svg>
      <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>
        {fmt(now)}
      </span>
    </div>
  );
}

function Panel({ card, day }) {
  return (
    <div
      role="group"
      aria-label={`Health panel: five gauges over ${card.days} days, drawn through day ${Math.min(
        day,
        card.days,
      )}`}
      style={{ display: 'grid', gap: 6, maxWidth: 560, margin: '0 0 12px' }}
    >
      {GAUGES.map((g) => (
        <GaugeRow key={g.id} gauge={g} values={card.gauges[g.id]} day={day} days={card.days} />
      ))}
    </div>
  );
}

/* ── Argued feedback, quoting the tell ─────────────────────────────────── */

function Feedback({ card, picked }) {
  const actual = READS[card.label];
  if (picked === card.label) {
    return (
      <>
        <strong>{actual.name}.</strong> The tell is on the panel: "{card.tell}." {actual.mechanism}
      </>
    );
  }
  const guess = READS[picked];
  return (
    <>
      <strong>{guess.name} draws a different fortnight:</strong> {guess.reads}. Hold that against
      this panel: "{card.tell}." That is the signature of {lower(actual.name)}. {actual.mechanism}
    </>
  );
}

/* ── The lab ───────────────────────────────────────────────────────────── */

export default function TriageDeck() {
  const reduced = usePrefersReducedMotion();
  const [cards, setCards] = useState(DECK);
  const [idx, setIdx] = useState(0);
  // Legible at rest: card 1 mounts on the full fortnight, nothing autoplays.
  const [day, setDay] = useState(DAYS);
  const [dealing, setDealing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [missed, setMissed] = useState([]);
  const [done, setDone] = useState(false);

  const card = cards[idx];
  const isLast = idx === cards.length - 1;

  useEffect(() => {
    if (!dealing) return undefined;
    if (reduced || day >= DAYS) {
      setDay(DAYS);
      setDealing(false);
      return undefined;
    }
    const t = setTimeout(() => setDay((d) => d + 1), DAY_MS);
    return () => clearTimeout(t);
  }, [dealing, reduced, day]);

  const deal = (nextIdx) => {
    setIdx(nextIdx);
    setRevealed(false);
    if (reduced) {
      setDay(DAYS); // static final frame: the whole fortnight at once
    } else {
      setDay(1);
      setDealing(true);
    }
  };

  const replay = () => {
    setDay(1);
    setDealing(true);
  };

  const onReveal = (picked) => {
    // Committing mid-deal snaps the rest of the fortnight in, so the
    // feedback and the panel argue about the same fourteen days.
    setDay(DAYS);
    setDealing(false);
    setRevealed(true);
    if (picked !== card.label && !card.redeal) {
      setMissed((m) => (m.some((c) => c.label === card.label) ? m : [...m, card]));
    }
  };

  const next = () => {
    if (!isLast) {
      deal(idx + 1);
      return;
    }
    if (missed.length) {
      // Missed categories come back: one re-deal per misread signature,
      // appended to the run. Re-deals do not re-queue.
      const redeals = missed.map((c) => ({ ...c, id: `${c.id}-redeal`, redeal: true }));
      setCards((cs) => [...cs, ...redeals]);
      setMissed([]);
      deal(idx + 1);
      return;
    }
    setDone(true);
  };

  const restart = () => {
    setCards(DECK);
    setMissed([]);
    setDone(false);
    deal(0);
  };

  return (
    <LabFrame
      tag="LAB 13·A — THE TRIAGE DECK"
      register="bet"
      question="Ten health panels from ten different shops, dealt one at a time: five gauges over a compressed fortnight. Each panel wears exactly one of five signatures. Can you call it at a glance, before you could prove it?"
      payoff={
        <>
          Healthy wobbles. A forming runaway gets quieter and faster at the same time. A planned
          stall escalates everything while completing nothing. Theatre flatlines. Over-stabilized
          stays spotless right up to the dent that never re-rounds. The signature is readable at a
          glance long before it is provable, and the glance is the steward's actual working
          condition. These five shapes are the author's bet, drawn: §2.12's checklist rendered as
          gauges{' '}
          <Badge
            layer="W"
            note="§2.12 — learn the signature: a working principle argued from queueing, reinforcement, and the failure record, not measured at scale"
          />
          . The dissent card below is the window where the glance fails.
        </>
      }
      notes={[
        "No dynamics engine runs behind these gauges. Each card is five authored shape functions plus seeded jitter, drawn to §2.12's descriptions and sliced verbatim into the glass below: the shapes are the content.",
        'The deal is pinned to seed 10: the same ten cards in the same order, forever. Two cards per signature, surfaces varied on purpose (the Kellman recipe: vary everything except the mechanism), dependency bumps deliberately absent.',
        'Tuned constants set the tells. Jitter is 0.03 book-wide but 0.006 on the theatre cards (the flatline is literally the variance), and the over-stabilized cards take their disturbance on day 8 so the dent has a week to not re-round.',
        'All five gauges read 0..1 with higher meaning a healthier reading, escalations included (healthy is low but nonzero). Real panels share no such scale, and a fortnight here compresses into about ten seconds.',
        'A signature you misread is re-dealt once at the end of the run; nothing is scored. The deck is re-dealt with fresh surfaces in Ch 17 and Ch 21.',
      ]}
      cannotShow="whether these five gauges are the right five, or how the signatures present when they mix. The cards are drawn, so calling them correctly means you have learned the author's drawing of §2.12, not that real systems sort this cleanly: real panels wear two signatures at once, and the deadliest one (theatre) is defined by being indistinguishable from health until you check the decision log."
      glass={GLASS}
    >
      {done ? (
        <div>
          <div className="mh-feedback" role="status">
            That's the deal: {cards.length} panels, five signatures, no score. The glance is what
            you carry, and the deck is re-dealt with fresh surfaces in Ch 17 and Ch 21.
          </div>
          <table className="mh-table">
            <thead>
              <tr>
                <th>The signature</th>
                <th>At a glance</th>
              </tr>
            </thead>
            <tbody>
              {OPTIONS.map((o) => (
                <tr key={o.id}>
                  <td>{o.label}</td>
                  <td>{GLANCE[o.id]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mh-controls">
            <button type="button" className="mh-btn" onClick={restart}>
              Deal the ten again
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mh-kicker" style={{ marginBottom: 4 }}>
            card {idx + 1} of {cards.length}
            {card.redeal ? ' · re-deal — this signature got past you earlier' : ''}
          </div>
          <p
            className="mono"
            style={{ margin: '0 0 8px', fontSize: '12.5px', color: 'var(--ink-faint)' }}
          >
            {card.surface}{' '}
            <Mark kind="made" note="constructed panel; the shapes are drawn to §2.12" />
          </p>
          <div className="mh-controls" style={{ margin: '0 0 8px' }}>
            {!reduced ? (
              <button
                type="button"
                className="mh-btn"
                onClick={replay}
                disabled={dealing}
                aria-label="Replay the fortnight from day one"
              >
                Replay the fortnight
              </button>
            ) : null}
            <span className="mh-kicker">
              {dealing ? `dealing · day ${day} of ${DAYS}` : `the full fortnight · ${DAYS} days`}
            </span>
          </div>
          <Panel card={card} day={day} />
          <Commit
            key={`${card.id}-${idx}`}
            prompt="Call it. Which signature is this fortnight wearing?"
            options={OPTIONS}
            onReveal={onReveal}
          >
            {(picked) => <Feedback card={card} picked={picked} />}
          </Commit>
          {revealed ? (
            <div className="mh-controls">
              <button type="button" className="mh-btn mh-btn-primary" onClick={next}>
                {!isLast
                  ? 'Deal the next card'
                  : missed.length
                    ? 'Re-deal the missed signatures'
                    : 'Close the deck'}
              </button>
            </div>
          ) : null}
        </div>
      )}

      <aside
        className="mh-card"
        style={{ borderTopColor: 'var(--amber)', marginTop: 16 }}
        aria-label="Model dissent: the window where the glance fails"
      >
        <span className="mh-kicker" style={{ color: 'var(--amber)' }}>
          Model dissent · the window where the glance fails
        </span>
        <Panel card={DISSENT_CARD} day={DISSENT_DAY} />
        <p style={{ margin: '0 0 8px' }}>
          The first seven days of one of this deck's cards: a payments core behind maximum
          stabilizers. Stop the window here and the over-stabilized call is not available. Flow is
          steady, signals track outcomes, nothing escalates, the commons is spotless. Variety on the
          floor is the only hint, and a mature, tightly converged, perfectly healthy system draws
          that same line. The deciding gauge (can it re-round?) does not exist until something
          disturbs the system, and in this window nothing has.
        </p>
        <p style={{ margin: 0 }}>
          That is the parameterization where the author's claim fails: the signature is readable at
          a glance only when the fortnight contains a disturbance worth reading. A system nobody
          perturbs shows you stillness, and stillness is exactly what theatre fakes. §2.11's
          deliberate disturbance is not housekeeping for this panel; it is what makes the panel
          legible at all.
        </p>
      </aside>
    </LabFrame>
  );
}
