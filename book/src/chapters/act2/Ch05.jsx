// Ch05.jsx — Placement (covers §2.3). The placement chapter: the what→where
// reframe, the three questions, the quadrant as a static figure, then the
// Placement Bench (worked → faded → danger → drill). Retrieval rail: one
// fresh placement from the bank, one reach-back to Chapter 3's mechanism.

import {
  Badge,
  Chapter,
  Coda,
  DecisionCard,
  Drill,
  Lede,
  Pull,
  Term,
} from '../../components/kit.jsx';
import PlacementBench from '../../labs/PlacementBench.jsx';
import { CASES } from '../../engine/cases.js';

const THREE_QUESTIONS = [
  {
    kicker: 'Reversibility · the most important question',
    body: 'If this goes wrong, how expensive is it to undo? Cheap → emergent. Expensive → planned.',
  },
  {
    kicker: 'Legibility',
    body: 'Is the problem well-specified and stable, or exploratory and shifting? Specified → planned. Exploratory → emergent.',
  },
  {
    kicker: 'Coupling',
    body: 'Does a local change force changes elsewhere? Tight → planned. Loose → emergent.',
  },
];

// Reach-back to Chapter 3: the zod-shaped sequence, constructed for teaching,
// asking the reader to find the coordinator that is not there.
const NO_CALL_CASE = {
  id: 'rx-501-no-call',
  surface: 'The composite terrain: two merged PRs, three days apart.',
  prompt:
    'Monday, dep-patch merges a luxon bump that drops the last import of a date polyfill. ' +
    'Thursday, dead-code opens a PR removing the polyfill package entirely. No message, no ' +
    'ticket, no shared plan links them. What coordinated the second PR?',
  evidence: [
    {
      label: 'The trail',
      text: "dead-code's signal watches for packages with zero remaining imports; the count hit zero when Monday's bump merged.",
    },
    {
      label: 'The search',
      text: 'You grep for an orchestrator config connecting the two loops. There is no orchestrator config.',
    },
    {
      label: 'The interview',
      text: "Each loop's prompt names its own scope; neither prompt mentions the other loop or the polyfill.",
    },
  ],
  options: [
    { id: 'scheduler', label: 'A scheduler fired dead-code after dep-patch completed' },
    { id: 'repo', label: "The repo state: Monday's merge changed the terrain dead-code reads" },
    { id: 'prompt', label: 'Shared context: both loops were prompted about the polyfill' },
  ],
  feedback: {
    scheduler:
      'A schedule could explain "after"; it can never explain "about." Nothing in a cron line ' +
      'carries which package just hit zero imports. Trace the outcome backward, the Chapter 3 ' +
      'way: dead-code READ the import count; the bump WROTE it when it merged. Every hop is a ' +
      'read or a write of the terrain, and no hop is a call. The chain terminates in a signal, ' +
      'not in a caller.',
    repo:
      'Trace it and that is what you find: the bump WROTE the import count to zero, dead-code ' +
      'READ it, and no hop between them is a call. The artifact is not the signal; the signal ' +
      'is what the artifact tells the next actor, and the repo state is the bus. This is also ' +
      'why the pattern scales: every loop holds one interface, the terrain, instead of a ' +
      'channel to every loop it might ever coordinate with.',
    prompt:
      'The prompts name scopes, not packages; neither mentions the polyfill, so the ' +
      'coordination cannot live there. And consider the maintenance bill if it did: every new ' +
      'pairing of loops would need a prompt edit, channels growing with the square of the ' +
      'fleet. The terrain does the same work with one interface per loop. The count dead-code ' +
      'watches went to zero on Monday; that signal is the whole story.',
  },
};

const RETRIEVAL_CASES = [CASES.find((c) => c.id === 'pl-09'), NO_CALL_CASE];

const dangerCell = { color: 'var(--red)' };

export default function Ch05() {
  return (
    <Chapter n={5} covers="§2.3">
      <Lede>
        You can spend a career arguing about what to build. The arguments that settle are about
        where the decision lives, because where is checkable and what is taste.
      </Lede>

      <p>
        Run the experiment on your own memory. The last architecture meeting that went ninety
        minutes and ended in a draw was almost certainly an argument about <em>what</em>: what
        framework, what language, what pattern, what data model. Arguments about what end in taste
        and authority, which is why they end in a draw, or in whoever was most senior. The
        framework's move is to reframe the question as <em>where</em>. Given that we need
        authentication, where on the spectrum does it belong? Planned: it is irreversible,
        regulated, coupled to everything. Given that we need internal developer tooling, where?
        Emergent: a wrong choice costs a revert, and the variety of needs exceeds what central
        design can anticipate. Notice what happened to the evidence. You do not need to agree on
        what authentication <em>ought</em> to be to agree that it is irreversible, specified, and
        tightly coupled, and therefore planned. The axes did the arguing, and the axes are
        empirical. Three questions place any decision of consequence:
      </p>

      <div className="mh-cardgrid">
        {THREE_QUESTIONS.map((q) => (
          <div className="mh-card" key={q.kicker}>
            <span className="mh-kicker">{q.kicker}</span>
            {q.body}
          </div>
        ))}
      </div>

      <p>
        Two of the three vote directly: reversibility picks a column, legibility picks a row, and
        together they draw a board with four cells. Coupling argues rather than votes: tight
        coupling pulls a decision toward the planned pole, and regulatory, financial, or safety
        surface pulls it further the same way. Find your decision's cell before you read on, and
        keep one eye on the bottom-left.
      </p>

      <table className="mh-table">
        <thead>
          <tr>
            <th>Where does this decision belong?</th>
            <th>Irreversible</th>
            <th>Reversible</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Well-specified</strong>
            </td>
            <td>
              <strong>Planned</strong> · auth system, schema migration
            </td>
            <td>
              <strong>Emergent</strong> · dep patch bump, feature flag
            </td>
          </tr>
          <tr>
            <td>
              <strong>Exploratory</strong>
            </td>
            <td style={dangerCell}>
              <strong>DANGER ZONE</strong> · public API contract, production data schema
            </td>
            <td>
              <strong>Emergent</strong> · prototype agent, internal tool
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        The bottom-left cell, irreversible <em>and</em> exploratory, is where engineering disasters
        live. Never let agents forage there without first making the decision reversible or making
        the problem legible <Badge layer="W" note="the danger-zone rule, handbook §2.3" />. And when
        a decision of consequence crosses your bench, do the <Term id="placement">placement</Term>{' '}
        explicitly and write it down, because the verdict is only as honest as the axis work above
        it. The bench below makes you do exactly that, with the engine running the consequences both
        ways. Start with the worked pair, and read the two records as one figure: the schema you
        need is in the difference between them.
      </p>

      <PlacementBench />

      <p>
        Hold on to what the swap cost in there. The careful-looking placement, every bump held for a
        considered yes, was the expensive one: 32 demands on 28.5 capacity, a 42-PR silt, upstream
        time at zero for twelve weeks. The casual-looking one ran clean for a month and shipped a
        credential no rotation could recall. Placement is not ceremony allocation; it is risk
        engineering with empirical inputs, and the approval at the end of the pipeline is honest
        only when the placement upstream was done with care. The considered yes you met in Chapter 2
        inherits its meaning from a where-call somebody made weeks earlier, or never made at all.
      </p>

      <Pull badge="W">The placement is the decision. The implementation follows from it.</Pull>

      <p>
        Two more cases before the close. One is a fresh placement on terrain the bench never showed
        you; the other reaches back to Chapter 3 and asks you to find a coordinator that is not
        there.
      </p>

      <Drill title="Retrieval" cases={RETRIEVAL_CASES} />

      <DecisionCard
        title="Before you place a decision"
        items={[
          'Ask reversibility first: price the undo, not the redo, and price it on the most expensive copy of the consequences. Information that has shipped cannot be recalled.',
          'Ask legibility: is the spec written and stable, or did the requirements move twice last quarter?',
          'Ask coupling: what else moves when this moves, and can the things that move be redeployed by you?',
          'Tight coupling, regulation, money, or safety pulls the verdict toward planned. The axes vote; these pull.',
          'If it lands irreversible and exploratory, stop. Shrink the blast radius or write the contract before anything runs. The quadrant is an action item, not a label.',
          'Write the placement down where the next engineer will find it: decision, three axes, verdict, gate.',
        ]}
      />

      <Coda
        line="An argument about what ends in taste. An argument about where ends in three checks, and the checks are empirical."
        next="Hybrids and strata: composing both modes on purpose, the six clocks a platform keeps, and the moment a practice becomes a rule."
      />
    </Chapter>
  );
}
