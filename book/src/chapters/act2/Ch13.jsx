// Ch13.jsx — "The signature of alive" (Act II · covers §2.12). The five-gauge
// health panel as one-line descriptions, then the Triage Deck: the book's
// perceptual-learning instrument, first full deal. Closes Act II with a
// retrieval rail (healthy backpressure, the dead signal, and a reach back to
// Ch 5) and hands off to the practice.

import { Badge, Chapter, Coda, DecisionCard, Drill, Lede, Pull } from '../../components/kit.jsx';
import TriageDeck from '../../labs/TriageDeck.jsx';
import { CASES } from '../../engine/cases.js';

const byId = (...ids) => ids.map((id) => CASES.find((c) => c.id === id));
const RETRIEVAL = byId('sp-01', 'sp-07', 'pl-11');

const GAUGE_ROWS = [
  {
    gauge: 'Variety',
    reads:
      'High but bounded: different hands solve similar problems differently, within a range the team recognizes. Outliers exist, and are a sign of health.',
    warning: 'No outliers at all: premature convergence.',
  },
  {
    gauge: 'Flow',
    reads: 'Steady: arrival and completion rates match over moderate windows.',
    warning: 'Sudden WIP accumulation is a bottleneck; sudden evaporation is silent drops.',
  },
  {
    gauge: 'Escalations',
    reads:
      'Rare but real: when humans are called, it is for something that genuinely needs judgment.',
    warning:
      'Frequent: the autonomy envelope is too narrow. Zero: too wide, or the system has stopped surfacing real problems.',
  },
  {
    gauge: 'Signal vs outcome',
    reads: 'Correlated: when the evals say quality is up, users say quality is up.',
    warning: 'Divergence from external reality: the earliest and most important warning there is.',
  },
  {
    gauge: 'The commons',
    reads: 'Clean: stale signals pruned, abandoned branches dead, unused tools retired.',
    warning: 'Cruft accumulating slowly: a commons slowly becoming uninhabitable.',
  },
];

export default function Ch13() {
  return (
    <Chapter n={13} covers="§2.12">
      <Lede>
        Learn the signature. It is worth more than any checklist, because the glance is the
        condition you will actually work under.
      </Lede>

      <p>
        Act II has shown you four ways a system dies: the storm you caused in Chapter 9, the stall
        you scheduled in Chapter 10, the theatre that fooled two of Chapter 10's four detectors, and
        the over-stabilized stillness Chapter 12 warned against. What it has not yet shown you is
        health, and health is not the absence of those four. A healthy many-hands system in motion
        has a specific look{' '}
        <Badge
          layer="W"
          note="§2.12 — the shape of a healthy system in motion: five signs, held together"
        />
        , and the handbook gives it as five signs. Here they are as the five gauges of the panel you
        are about to read ten of, each with its one-line description and the early warning on its
        far side.
      </p>

      <table className="mh-table">
        <thead>
          <tr>
            <th>Gauge</th>
            <th>Healthy reads</th>
            <th>The early warning</th>
          </tr>
        </thead>
        <tbody>
          {GAUGE_ROWS.map((r) => (
            <tr key={r.gauge}>
              <td style={{ color: 'var(--ink)' }}>{r.gauge}</td>
              <td>{r.reads}</td>
              <td>{r.warning}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pull badge="W">
        When internal signals diverge from external reality, it is the earliest and most important
        warning that the system has begun to optimize for its own metrics.
      </Pull>

      <p>
        Five gauges, read one at a time, is a checklist, and a checklist is not what a steward gets
        to use. What you get is ten seconds of panel between two other demands on your attention,
        which is why this chapter's instrument is a deck, not a list. Ten panels from ten different
        shops, each wearing exactly one of five signatures: healthy, emergent runaway forming,
        planned stall, hybrid theatre, over-stabilized. Every one of those signatures is a chapter
        you have already worked through; the deck's job is to compress that knowledge into
        recognition. Commit a call on each card before the reveal, and pay attention to the pairs
        that almost fool you: runaway and stall both move, in opposite directions; theatre and
        over-stabilized are both quiet, in different ways. The misses come back at the end of the
        run, and the dissent card below the deck shows the one window where the author's whole claim
        fails.
      </p>

      <TriageDeck />

      <p>
        When all five signs hold, the system is, in the framework's sense, alive. Keep it alive, not
        by freezing it, which kills it, but by maintaining the conditions under which it stays a
        healthy dynamical system: decay doing its quiet work, variety preserved, references kept
        outside the loops that report on themselves, disturbance arriving on Chapter 12's calendar.
        And carry the deck's honest limit with you: the glance is a triage instrument, not a
        verdict. A motionless panel is describing the claimed system, so the call it earns is to go
        read the decision log; silence on a gauge is health only if the surface it watches went
        quiet too. The signature is readable long before it is provable. Read it, call it, then go
        get the proof; the glance buys you the week you need.
      </p>

      <p>
        Three calls to close the act: a loud queue, a silent loop, and a reach back to Chapter 5 for
        the placement that made a production surface safe to tune. Neither volume nor silence is a
        verdict; read each against the gauges before you call it.
      </p>

      <Drill title="Retrieval" cases={RETRIEVAL} />

      <DecisionCard
        title="Reading a panel"
        items={[
          'Wobble is the baseline. A healthy panel moves; treat a motionless one as a report about the claimed system, and go read the decision log.',
          'Read silence twice: zero escalations, or zero output from a loop, is health only if the surface it watches went quiet too.',
          'Hold one internal line against one external one. Divergence between them outranks any single gauge.',
          "Ask when the system last re-rounded from a disturbance. A panel with no disturbance in frame is illegible; schedule one (Chapter 12's calendar).",
          'Call the signature before you can prove it, then verify. The glance is for ordering your week, not for closing the case.',
        ]}
      />

      <Coda
        line="Health is a signature in motion: variety bounded, flow steady, escalations real, signals honest, the commons clean. Alive, not still."
        next="Act III opens the practice: Chapter 14 takes one working loop apart into its six ingredients and runs it with each one missing."
      />
    </Chapter>
  );
}
