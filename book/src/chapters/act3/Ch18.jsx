// Ch 18 — Gate, rate, budget. Covers §3.6.
// The three coupled levers, the lever table verbatim, the governing
// inequality, the handbook's worked example quoted with its real numbers,
// the Gate Console (LAB 18·A) with its locked budget slider and the 99.7%
// curveball, and froot's shadow-gate blocker strings as the field specimen.

import {
  Badge,
  Chapter,
  Coda,
  DecisionCard,
  Drill,
  FieldSpecimen,
  Lede,
  Pull,
} from '../../components/kit.jsx';
import GateConsole from '../../labs/GateConsole.jsx';
import { CASES } from '../../engine/cases.js';

// Retrieval: three gate calls from this chapter's skill, plus lp-06 reaching
// back to Ch 14 — the global trust switch, which is what a missing per-class
// gate degenerates into.
const RETRIEVAL = ['gt-01', 'gt-02', 'gt-05', 'lp-06'].map((id) => CASES.find((c) => c.id === id));

// §3.6's lever table, verbatim.
const LEVERS = [
  {
    lever: 'Gate',
    controls: 'Which proposals need human approval vs auto-apply',
    failure: 'Too wide → budget exhausted; too narrow → commons degrades',
  },
  {
    lever: 'Rate',
    controls: 'Fraction of gated proposals approved',
    failure: 'Drifts up → rubber-stamp; drifts down → agent misaligned',
  },
  {
    lever: 'Budget',
    controls: 'Considered approvals per steward per unit time',
    failure: 'Too low → bottleneck; too high → no capacity for upstream work',
  },
];

export default function Ch18() {
  return (
    <Chapter n={18} covers="§3.6">
      <Lede>
        Eighteen of your thirty weekly approvals go to one class of PR, and that class ran 96% last
        quarter. Nothing is broken. Everything is mispriced.
      </Lede>

      <p>
        The steward's approval is scarce by design — Chapter 17 built the role around exactly that
        scarcity. <em>Looks Good To Me</em> is engineering shorthand for the thing being rationed:
        the considered yes a human gives at the moment autonomous work meets judgment. Three
        operational terms describe how the rationing is managed, and together they form the throttle
        between agent output and human judgment. The <strong>gate</strong> is the boundary where a
        human confirms an agent's proposal, placed per task class; what crosses a gate needs a
        considered approval, what doesn't auto-applies inside its autonomy envelope. The{' '}
        <strong>rate</strong> is the fraction of gated proposals that earn approval, tracked per
        agent, per class — the track record that justifies moving a gate. The{' '}
        <strong>budget</strong> is the steward's finite capacity for considered approvals per unit
        time. Not a wish: a real constraint, like an SRE error budget. The three are coupled. You
        can't change one without changing the others.
      </p>

      <span className="mh-kicker">
        The three levers · §3.6, verbatim{' '}
        <Badge layer="W" note="the handbook's lever table; the console below runs it" />
      </span>
      <table className="mh-table">
        <thead>
          <tr>
            <th scope="col">Lever</th>
            <th scope="col">What it controls</th>
            <th scope="col">Failure if mistuned</th>
          </tr>
        </thead>
        <tbody>
          {LEVERS.map((l) => (
            <tr key={l.lever}>
              <td>
                <strong>{l.lever}</strong>
              </td>
              <td>{l.controls}</td>
              <td>{l.failure}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>The governing inequality, in plain language:</p>
      <p
        className="mono"
        style={{
          border: '1px solid var(--line-soft)',
          borderLeft: '2px solid var(--accent)',
          borderRadius: '0 3px 3px 0',
          background: 'var(--paper-2)',
          padding: '12px 16px',
          fontSize: '14px',
          color: 'var(--ink)',
        }}
      >
        proposals entering gates per week ≤ approval budget × (1 − false-approval tolerance){' '}
        <Badge
          layer="W"
          note="§3.6's governing inequality — the console renders it as a live constraint bar"
        />
      </p>
      <p>
        When inflow exceeds the budget, a queue builds, and queues produce one of two pathologies:
        stewards rubber-stamp (the rate drifts up artificially — Chapter 17's divergence), or the
        system stalls (WIP accumulates). Both are signals, not solutions. And the healthy adjustment
        is always structural: widen the envelope where the rate is consistently high, moving the
        class below the gate, or narrow it where the rate has drifted, moving the class above. The
        lever that stays constant is the budget.
      </p>

      <Pull badge="W">
        Stewards aren't supposed to work harder; they're supposed to place the gates better.
      </Pull>

      <p>
        The handbook closes the section with a worked example, and it is worth quoting whole,
        numbers intact, because the console below boots this exact week:
      </p>

      <aside className="mh-card" aria-label="The handbook's worked example, quoted">
        <span className="mh-kicker">The handbook's example · §3.6, verbatim</span>
        <p style={{ margin: 0 }}>
          "A team of four engineers shares a steward role on a rotation. Each rotation gives the
          on-call steward a budget of roughly 30 considered approvals per week, enough to review
          carefully without burning the rest of their attention. The dependency-patch loop generates
          18 proposals a week with a 96% approval rate over the last quarter. Of the 30-approval
          budget, this loop currently consumes 18. That's most of the budget on a single class. The
          team moves the gate: patch-level bumps with green CI auto-merge; only minor-version bumps
          and any failing CI come to the steward. The loop now costs ~3 approvals a week instead of
          18. The reclaimed budget covers the new on-call assist loop the team just stood up, or, on
          a slow week, frees the steward to spend that attention upstream on terrain design. The
          numbers told the team where the gate belonged. The steward made the move."
        </p>
      </aside>

      <p>
        Run it yourself. The budget slider is on the console and it is locked — the engine has no
        "work harder" parameter, on purpose. Commit to the arithmetic before the gate toggles go
        live; after the move, watch where the reclaimed approvals land. Then the console deals the
        curveball: a class running 99.7%, higher than the rate that just justified the move, and the
        same arithmetic begging twice.
      </p>

      <GateConsole />

      <p>
        The curveball's lesson generalizes past the console: a rate is only evidence where the gate
        could have said no, and triangulation is how you find out whether it could. Which raises the
        practical question for any real gate you are about to trust — what does it say while it is
        still learning? Run it in shadow. Compute the decision on every proposal, write the decision
        and its reasons where humans can read them, act on nothing. froot's acting gate shipped
        exactly this way, and its blocker strings are the part worth copying:
      </p>

      <FieldSpecimen source="froot · shadow gate, blocker strings · 2026">
        <pre style={{ margin: 0 }}>
          <code>
            {[
              'shadow-gate: HOLD — only 2/5 decided recently',
              'shadow-gate: HOLD — CI pending',
              'shadow-gate: would-merge · acting gate: allowlist empty — no action taken',
            ].join('\n')}
          </code>
        </pre>
        <p style={{ margin: '10px 0 0', fontSize: '13.5px' }}>
          A blocker string is the gate explaining itself: not "no," but "no, because the window
          holds two decided rows of the five it needs," or "no, because the oracle hasn't spoken."
          Each string names the condition that would have to change — which makes the shadow weeks
          an audit of the gate policy itself, run at zero risk. When the strings go quiet on a class
          for a quarter, that silence is the record arguing for the move; Chapter 19 is about what
          that record is made of.
        </p>
      </FieldSpecimen>

      <p>
        Step back and the three terms describe what "earning the approval" means operationally. An
        agent earns it by producing proposals at a rate compatible with the budget, with an approval
        rate high enough — and honest enough, the curveball adds — that moving the gate is
        justified. Moving a gate isn't a decision made on feel. It's what happens when the numbers
        say the gate belongs somewhere else, read on instruments whose limits you know.
      </p>

      <Drill cases={RETRIEVAL} title="Retrieval · gate moves, and one older ghost" />

      <DecisionCard
        title="Before you move a gate"
        items={[
          'Run the inequality first: gated inflow per week against budget × (1 − tolerance). A failing inequality is a placement problem, not a staffing problem.',
          'Move the class whose record justifies it — consistently high rate, unhurried reviews — never the class with the smallest inflow.',
          'Triangulate the rate before trusting it: sampled deep review, post-merge defects. A rate that cannot fail at its gate measures plausibility, not quality.',
          'Keep sampling on everything below the gate. The measurement must outlive the move.',
          'Write the return-above condition the day you write the move: the defect, the drift, or the environment change that re-gates the class.',
          'The budget stays constant. The week you catch yourself reviewing faster, the queue has already won — go move a gate instead.',
        ]}
      />

      <Coda
        line="Queues are signals; the budget is the constant; the gate is the lever — and an instrument's limits are part of reading it."
        next="Chapter 19 opens the ledger underneath every rate in this chapter: what trust is, how it's earned, and the five ways it comes apart."
      />
    </Chapter>
  );
}
