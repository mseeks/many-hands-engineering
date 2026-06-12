// Ch04.jsx — The spectrum (Act II opens; covers §2.2).
// The handbook's ten-property table, verbatim, as the primary figure; then the
// SpectrumCoupler (bet register, with dissent). Closes with the act's first
// retrieval rail: one fresh spectrum case, one reach-back to Chapter 1.

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
import SpectrumCoupler from '../../labs/SpectrumCoupler.jsx';
import { CASES } from '../../engine/cases.js';

// The handbook's §2.2 table, verbatim. Cell text is quoted exactly; the lab's
// data block holds the same strings, so the two figures cannot drift apart.
const SPECTRUM_ROWS = [
  ['Authority', 'Central', 'Distributed'],
  ['Knowledge', 'Concentrated', 'Dispersed'],
  ['Spec role', 'Prescriptive', 'Descriptive'],
  ['Integration', 'Scheduled, synchronous', 'Continuous, asynchronous'],
  ['Verification', 'Against the spec', 'Through convergence'],
  ['Coupling', 'Explicit, audited', 'Implicit, tolerated'],
  ['Coordination', 'Direct command', 'Environmental signal'],
  ['Failure', 'Hard — the whole plan breaks', 'Soft — local decay'],
  ['Strength', 'Guarantees', 'Adaptivity'],
  ['Weakness', 'Brittleness', 'Commons degradation'],
];

// The chapter's retrieval rail: one case on this chapter's table, one
// reach-back to Chapter 1's loop test (lp-04, from the case bank).
const WINDOW_CASE = {
  id: 'rx-401-window',
  surface: 'Data ingest: an 8-team pipeline platform, trunk-based, reconciliation on every source.',
  prompt:
    'The new director wants "more rigor": keep everything else as it is, but add a quarterly ' +
    'integration freeze with sign-off, "so we get the guarantees of a real plan." What does ' +
    'the table say arrives?',
  evidence: [
    {
      label: 'Authority',
      text: 'Source teams own their connectors end to end; no central design body exists.',
    },
    {
      label: 'Integration today',
      text: "Merges land continuously; convergence is verified by reconciliation against yesterday's totals.",
    },
    {
      label: 'The proposal',
      text: 'One row changes: integration becomes scheduled. Authority, verification, and coupling stay where they are.',
    },
  ],
  options: [
    { id: 'guarantees', label: 'The guarantees of planned, at the price of slower quarters' },
    { id: 'theatre', label: 'Theatre: a scheduled window over decisions the stream already made' },
    { id: 'soften', label: 'Softer failures: the freeze catches drift before it spreads' },
  ],
  feedback: {
    guarantees:
      'A guarantee is what verification against a binding spec buys, and the proposal adds no ' +
      'prescriptive spec and no central authority to bind one. The freeze parks merges on a ' +
      'calendar; the decisions still happen in the stream, distributed, before the window ' +
      'opens, so the sign-off reviews what already merged in spirit. One row dragged to the ' +
      "planned column, nine left behind: that is the coupler's torn board, and what it " +
      'delivers is the calendar of planned work without its substance.',
    theatre:
      'The rows agree. Verification still runs through convergence and authority still lives ' +
      'at the edges, so the scheduled window binds nothing; it is the form of planned work ' +
      'without its substance. If this platform needs guarantees somewhere, the move is not a ' +
      'freeze across the whole stream but a region: a small planned core with a contract that ' +
      'fails closed at the seam. The boundary can do what the window cannot.',
    soften:
      "Soft failure is the emergent column's property, and this platform already has it: " +
      'local decay, drift caught continuously by reconciliation. A quarterly freeze makes ' +
      'failure harder, because divergence that once surfaced in a day now accumulates for ' +
      'thirteen weeks and arrives at the sign-off all at once. Read the Failure row: scheduled ' +
      'integration is the mechanism by which a whole plan breaks together.',
  },
};

const RETRIEVAL_CASES = [WINDOW_CASE, CASES.find((c) => c.id === 'lp-04')];

export default function Ch04() {
  return (
    <Chapter n={4} covers="§2.2">
      <Lede>
        Before you can place a decision, you need to know what a position on the spectrum buys. The
        answer is ten things at once, whether you wanted all ten or not.
      </Lede>

      <p>
        Two workstreams run on the platform you keep. The payments rewrite has a spec nine people
        signed, an integration scheduled for week 26, and a verification suite that checks the build
        against the document. The dependency stream merged 41 times last week; nobody scheduled any
        of them, and the only verification that matters is whether the repo converges back to green.
        Now watch how each one fails. When payments goes wrong, it goes wrong in week 26, all at
        once, because every divergence since the signing waited for integration day to be
        discovered: hard failure, the whole plan breaking. When the bump stream goes wrong, one PR
        is reverted before lunch and the other forty stand: soft failure, local decay.
      </p>

      <p>
        Neither failure shape was chosen. Nobody at the design table said "and let us fail hard."
        The failure mode came bundled with the authority structure, the spec's role, the integration
        cadence, the verification mode. That is this chapter's claim, and it is a strong one: along
        the <Term id="planned">planned</Term>/<Term id="emergent">emergent</Term> spectrum, ten
        properties move as one. Read the table the way you read a diff, row by row, asking which
        column your own systems sit in. Then slow down on the last four rows, where the bundle stops
        being description and becomes a bill.
      </p>

      <table className="mh-table">
        <thead>
          <tr>
            <th></th>
            <th>Planned ←</th>
            <th>→ Emergent</th>
          </tr>
        </thead>
        <tbody>
          {SPECTRUM_ROWS.map(([name, planned, emergent]) => (
            <tr key={name}>
              <td>
                <strong>{name}</strong>
              </td>
              <td>{planned}</td>
              <td>{emergent}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        These properties cluster because they reinforce each other{' '}
        <Badge
          layer="W"
          note="the co-variance claim is the handbook's working design principle, §2.2"
        />
        . A decision made by central authority gets written into a prescriptive spec, because a spec
        is how central authority travels. The spec wants scheduled integration, because checking
        work against a document is a synchronous act. Scheduled integration makes failure hard,
        because errors compound quietly between checkpoints. Run the same chain down the other
        column: distributed authority coordinates through environmental signal, integrates
        continuously because nothing says wait, verifies through convergence, fails soft. Each row
        props up its neighbors. The columns are stable; the middle is not.
      </p>

      <p>
        Which raises the obvious temptation: keep the rows you like from each side. Central
        authority, say, with continuous asynchronous integration, because the org chart wants
        control and the engineers want flow. The handbook's name for what that usually produces is
        governance theatre: the form of planned work without its substance, and the name of emergent
        work without its benefits. The board below holds all ten rows on one handle. Drag it and
        watch rows nine and ten, strength and weakness, trade places in the same motion. Then force
        the halfway mix and commit to a prediction before the recorded run names what you built.
      </p>

      <SpectrumCoupler />

      <p>
        The board cannot tell you the mix is hopeless, because it is not, and the dissent card said
        so: a small planned core inside an asynchronous exterior holds, when heavyweight contracts
        at the seam keep each region in one coherent column. That is the move worth carrying out of
        this chapter. At any single boundary, guarantees and adaptivity trade against each other;
        you cannot have both in one region. You can have them in different regions, connected by a{' '}
        <Term id="boundary">boundary</Term> designed to fail closed. The rest of the framework is
        machinery for exactly that: choosing which region a decision belongs in, which is Chapter 5,
        and composing the regions and their seams, which is Chapter 6.
      </p>

      <Pull badge="W">
        Guarantees and adaptivity trade against each other. You can have both, in different regions,
        never in the same one.
      </Pull>

      <p>
        Two cases close the chapter. The first hands this chapter's table a live proposal; the
        second reaches back to Chapter 1 and asks the question that loop earned you the right to
        ask: is this thing actually a loop?
      </p>

      <Drill title="Retrieval" cases={RETRIEVAL_CASES} />

      <DecisionCard
        title="Before you call a workstream's mode"
        items={[
          'Read the decision log, not the org chart: the column a system sits in is where its decisions actually get made.',
          'Check the rows together. One row sitting in the other column is not a compromise; it is a tear, and the torn rows are where the bill arrives.',
          'Wanting guarantees and adaptivity at once means wanting two regions and a boundary. Design the boundary first, and make it fail closed.',
          'Strength and weakness are one choice. Pick guarantees, inherit brittleness; pick adaptivity, inherit commons degradation. Budget for the weakness you chose.',
        ]}
      />

      <Coda
        line="The spectrum is one handle: ten properties move together, and mixing them halfway buys both columns' weaknesses at once."
        next="Placement: the three empirical questions that decide where on this spectrum a decision belongs."
      />
    </Chapter>
  );
}
