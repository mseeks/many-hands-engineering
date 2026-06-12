// Ch22.jsx — The checkride, and Monday morning (covers §3.11).
// The capstone. Prose stays short on purpose: the checkride is the chapter,
// and the blank Monday worksheet (rendered by the same engine that
// sanity-checks the Skylark memo) is what the reader leaves with. No
// retrieval drill here; the checkride is the retrieval.

import { Chapter, Coda, DecisionCard, Lede, Pull } from '../../components/kit.jsx';
import Checkride from '../../labs/Checkride.jsx';
import { mondayMemo } from '../../engine/scenarios/checkride.js';

// The blank worksheet: the same formatter and sanity-check that scored the
// checkride memo, given nothing. Every !! flag below is the engine marking
// what a blank sheet owes.
const BLANK_WORKSHEET = mondayMemo({ team: 'YOUR TEAM' });

export default function Ch22() {
  return (
    <Chapter n={22} covers="§3.11">
      <Lede>
        Nine people, an ML-pipeline shop you have never seen, six problems somewhere in its terrain,
        and twelve steward actions. The book stops teaching here; you fly it.
      </Lede>

      <p>
        No new ideas in this chapter, on purpose. The terrain is foreign by design, because the
        skill that matters on Monday is the one that transfers off the book's platform, and the
        budget is the curriculum: twelve actions against sixteen moves means every reading you take
        is a fix you don't make. There is no score. When you end the ride, the debrief is assembled
        from your own event log, problem by problem, and the problems you never touched say so in
        red. Read the field notes the way you would read a real shop's: slowly, before spending
        anything.
      </p>

      <Checkride />

      <p>
        The memo you just copied is Skylark's. The blank one below is yours, printed by the same
        engine, and its flags mark what a blank sheet owes. The handbook's answer to "what do we do
        first" fills it in one move: pick one small closed loop and make it work end-to-end. Not the
        most interesting loop. Not the highest-ROI loop. The one you can fully instrument, test, and
        control within a short cycle. Dependency patches are the canonical starter, clean signals,
        clean reactions, cheap reversal, and humans generally dislike doing them. The point of the
        first loop isn't the loop; it's the template. Once one works end-to-end, the second is
        dramatically cheaper, the third cheaper still, and by the fifth the team applies the pattern
        almost mechanically.
      </p>

      <Pull badge="W">
        The platform grows by adding loops, not by making any single loop smarter.
      </Pull>

      <figure style={{ margin: '16px 0' }}>
        <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
          The blank worksheet · against your real repo
        </span>
        <pre
          style={{
            margin: 0,
            padding: '12px 14px',
            background: 'var(--paper)',
            border: '1px solid var(--line-soft)',
            borderRadius: 4,
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: 1.6,
            color: 'var(--ink-2)',
            overflowX: 'auto',
          }}
        >
          {BLANK_WORKSHEET}
        </pre>
      </figure>

      <p>
        Fill it against the repo you actually work in. The five sections are the book in order of
        use: where decisions live, what the first loop is, who waits at which gate, what can never
        be undone, and what gets shaken on a schedule. Everything else in the handbook, the
        spectrum, the pace layers, the commons, the guardrails, the trust ledger, the panel, is in
        service of one curve: making the nth loop cheaper than the (n−1)th. A team with one working
        loop and confidence it can replicate the pattern is further along than a team with elaborate
        architecture and no working loop.
      </p>

      <DecisionCard
        title="Monday morning"
        items={[
          'Pick one small closed loop and make it work end-to-end: the one you can fully instrument, test, and control inside a short cycle.',
          'Dependency patches are the canonical starter: clean signals, clean reactions, cheap reversal, and nobody wants the job anyway.',
          'Write the worksheet before the loop: placement map, six ingredients, gate table, irreversibles list, disturbance schedule. The blank lines are the to-do list.',
          'Treat the first loop as the template, not the payoff: its job is to make the second one dramatically cheaper.',
          'Judge progress by the worksheet, not the architecture: one working loop plus a repeatable pattern beats elaborate design with nothing closed.',
        ]}
      />

      <Coda
        line="Pick one small closed loop and make it work end-to-end. Start there."
        next="Act IV opens the glass case: where every badge in this book funnels, and what the evidence actually weighs."
      />
    </Chapter>
  );
}
