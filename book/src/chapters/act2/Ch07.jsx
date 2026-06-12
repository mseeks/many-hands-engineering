// Ch07.jsx — The commons (covers §2.6–2.7). Ostrom's eight principles as the
// book's strongest evidence shelf (the software mapping marked Ⓦ), the
// fingerprint drill as the lab, and the goal restated as the metric panel
// swap. Retrieval rail: two placement cases reaching back to Chapter 5.

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
import FingerprintDrill from '../../labs/FingerprintDrill.jsx';
import { CASES } from '../../engine/cases.js';

// Ostrom's eight, in the handbook's own translated wording (§2.6).
const PRINCIPLES = [
  {
    kicker: '1 · Clear boundaries',
    body: 'Every emitter has an attributable identity; every consumer a stated interest.',
  },
  {
    kicker: '2 · Congruence',
    body: 'Rules fit the resource. High-frequency signals decay faster; high-consequence signals need stronger evidence.',
  },
  {
    kicker: '3 · Collective choice',
    body: 'Those affected by a rule can modify it.',
  },
  {
    kicker: '4 · Monitoring',
    body: 'Watchers are accountable to users, not to a distant authority.',
  },
  {
    kicker: '5 · Graduated sanctions',
    body: 'A first offense is met lighter than a repeated one. Earned autonomy, narrowing envelopes after incidents, approval rates that rise and fall with track record.',
  },
  {
    kicker: '6 · Low-cost conflict resolution',
    body: 'If resolving conflict is expensive, conflict will be hidden, and hidden conflict is worse than open.',
  },
  {
    kicker: '7 · Rights to organize',
    body: 'Teams and sub-platforms have meaningful local autonomy. Overriding every local decision destroys the local knowledge that made the decision good.',
  },
  {
    kicker: '8 · Nested enterprises',
    body: 'Large commons are layered commons, each with its own rules at its own scope.',
  },
];

const RETRIEVAL_CASES = [CASES.find((c) => c.id === 'pl-08'), CASES.find((c) => c.id === 'pl-13')];

export default function Ch07() {
  return (
    <Chapter n={7} covers="§2.6–2.7">
      <Lede>
        Everything your loops coordinate through is a shared resource, and shared resources degrade
        by default. Governance is what stops the default.
      </Lede>

      <p>
        Picture the moment a commons fails you. Mid-incident, you query the runbook index and get
        three confident, contradicting answers, none dated, none signed. Nobody sabotaged the index.
        Thirty loops deposited into it for a quarter, each deposit individually reasonable, and
        over-use degraded the resource for all of them. That is the definition doing its work: every
        shared substrate in a many-hands platform, the repository, the vector store, the eval
        harness, the deployment pipeline, the production namespace, is a{' '}
        <Term id="commons">commons</Term>, a governable resource rather than passive storage. The
        word governable is the load-bearing one. Elinor Ostrom spent decades in the field on
        common-pool resources, irrigation systems, fisheries, forests, and distilled eight
        principles that long-enduring commons share{' '}
        <Badge
          layer="E"
          note="Ostrom (1990); among the most empirically grounded bodies in the social sciences"
        />
        . They translate to many-hands platforms almost line for line, and the translation, unlike
        its source, is a working bet{' '}
        <Badge
          layer="W"
          note="the mapping to software commons is the framework's working principle"
        />
        . Read the eight as one shelf:
      </p>

      <div className="mh-cardgrid">
        {PRINCIPLES.map((p) => (
          <div className="mh-card" key={p.kicker}>
            <span className="mh-kicker">{p.kicker}</span>
            {p.body}
          </div>
        ))}
      </div>

      <p>
        Ignore these and the platform eventually exhibits the tragedy of the commons, not from
        villainy but from absence of governance. Embrace them and it becomes durable the way
        long-lived open-source projects and healthy markets are durable. But the shelf earns a place
        on your bench only if you can read it in reverse, because that is how governance failures
        actually arrive: not as a missing line in a policy doc, but as a trace going wrong. Each
        absent principle leaves its own fingerprint. The drill below hands you six degraded commons
        after the fact, trace and steward's log only, and there is not a principle toggle anywhere
        on it, because governance is not a switch. Before you read each log, look at the shape of
        the quality line first; the shape is most of the diagnosis.
      </p>

      <FingerprintDrill />

      <p>
        Step back far enough and this chapter and the five before it compress into one statement
        about your job. The goal is not to build the product. It is to build the conditions under
        which the product gets produced. The engineer's attention moves upstream, to the design of
        the terrain, the tuning of signals, the setting of norms, the placement of decisions, while
        the downstream work runs well enough not to demand that attention back. That reframes nearly
        every traditional metric, and you can perform the swap on one panel:
      </p>

      <table className="mh-table">
        <thead>
          <tr>
            <th>The panel, before the turn</th>
            <th>After</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Velocity</td>
            <td>
              <strong>Ratio of autonomous to supervised throughput</strong>
            </td>
          </tr>
          <tr>
            <td>Test coverage</td>
            <td>
              <strong>Reversibility of the average change</strong>
            </td>
          </tr>
          <tr>
            <td>Lines of code</td>
            <td>Not really a signal at all</td>
          </tr>
        </tbody>
      </table>

      <p>
        Velocity measures motion; the ratio measures whether the conditions are doing the producing.
        Coverage counts assertions; reversibility prices the average mistake, which is the number
        the placement axes have been asking about since Chapter 5. The third row needs no
        replacement.
      </p>

      <Pull badge="W">
        The goal is not to build the product. It is to build the conditions under which the product
        gets produced.
      </Pull>

      <p>
        Two retrieval cases close the chapter, both reaching back to Chapter 5's bench, on surfaces
        it never showed you. The axes still do the arguing.
      </p>

      <Drill title="Retrieval" cases={RETRIEVAL_CASES} />

      <DecisionCard
        title="Before you govern a commons"
        items={[
          'Sign every deposit: an emitter you cannot name is a rule you cannot enforce.',
          'Fit the rules to the resource: fast decay for high-frequency signals, stronger evidence for high-consequence ones.',
          'Make the watchers answer to the users of the field, not to a distant dashboard.',
          'Graduate the sanctions: a first offense narrows an envelope; only a pattern revokes.',
          'Keep conflict cheap to resolve in the open, or it will be resolved silently, in overwrites.',
          'Read the trace before the postmortem: each missing principle leaves its own fingerprint.',
        ]}
      />

      <Coda
        line="Commons degrade from absence of governance, not villainy, and each absent rule signs its work in the trace."
        next="Signal physics: the three rates and four forces underneath every fingerprint you just read."
      />
    </Chapter>
  );
}
