// Ch11.jsx — "Guardrails" (Act II · covers §2.10). Four classes as four
// shelves, each answering its own question; the five-axis grading table
// verbatim; the Guardrail Grader (predict, run the storm, read the gap; the
// planted trick is structural). Coda content: guardrails subject to their own
// dynamics, pointing back to Ch 9. Retrieval rail reaches to Ch 5.

import { Badge, Chapter, Coda, DecisionCard, Drill, Lede, Pull } from '../../components/kit.jsx';
import GuardrailGrader from '../../labs/GuardrailGrader.jsx';
import { CASES } from '../../engine/cases.js';

const byId = (...ids) => ids.map((id) => CASES.find((c) => c.id === id));
const RETRIEVAL = byId('sp-05', 'pl-10', 'pl-08');

const SHELVES = [
  {
    kicker: 'Shelf 1 · structural',
    q: 'Can this even happen?',
    body:
      'Enforced by the medium, not by policy: schema validation at write time, capability ' +
      'scoping, sandboxing, type systems. Cheapest and most reliable of the four, because ' +
      'forbidden actions are simply impossible. Nothing to fire, nothing to miss.',
  },
  {
    kicker: 'Shelf 2 · reactive',
    q: 'Did this just happen, and should it continue?',
    body:
      'Rate limits, circuit breakers, backpressure, content filters, test gates. They run at ' +
      'the moment of action, and they carry one structural law: they must not depend on the ' +
      'thing they are guarding.',
  },
  {
    kicker: 'Shelf 3 · dynamic',
    q: 'Is the system drifting?',
    body:
      'Approval rates per agent and class, error-budget burn rates, eval drift, canary ' +
      'analysis. They operate over time and catch patterns single-event guardrails miss. The ' +
      'main design challenge is false-positive fatigue: a page that cries wolf trains the ' +
      'operator who must answer the real one.',
  },
  {
    kicker: 'Shelf 4 · reflective',
    q: 'Are our guardrails still working?',
    body:
      'Postmortems that reveal missed failure classes. Chaos probes aimed at the guardrail ' +
      'layer itself. Meta-evals checking that the eval harness is still representative. The ' +
      'most important class, because without it the other three decay silently.',
  },
];

export default function Ch11() {
  return (
    <Chapter n={11} covers="§2.10">
      <Lede>
        Six guardrails stand on this terrain, and each has a story about what it stops. By the end
        of this chapter you will have graded all six, and three of the stories will not survive the
        measurement.
      </Lede>

      <p>
        Guardrails aren't add-ons; they're load-bearing design work{' '}
        <Badge layer="W" note="§2.10 — guardrails as the system's immune response" />. The two
        spirals you just caused are what they exist to interrupt, so this chapter is where the
        failure chapters cash out into design. The handbook sorts every guardrail you will ever meet
        into four classes, and the sorting is not taxonomy for its own sake: each class answers a
        different question, and most guardrail failures begin with a guardrail answering the wrong
        one. Read the four shelves, and for each one ask which of your own controls lives there.
      </p>

      <div className="mh-cardgrid">
        {SHELVES.map((s) => (
          <div className="mh-card" key={s.kicker}>
            <span className="mh-kicker">{s.kicker}</span>
            <h4>{s.q}</h4>
            <p style={{ margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </div>

      <p>
        A mature platform has guardrails at all four layers and recognizes that the four answer
        different questions. The discipline that makes the layers honest is grading: every guardrail
        gets an explicit report card along five axes, measured against its own failure class, never
        against another row's. The red-flag column is where the surprises live.
      </p>

      <table className="mh-table">
        <thead>
          <tr>
            <th>Axis</th>
            <th>Question</th>
            <th>Red flag</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ color: 'var(--ink)' }}>Coverage</td>
            <td>What fraction of the failure class does it catch?</td>
            <td>Less than you thought</td>
          </tr>
          <tr>
            <td style={{ color: 'var(--ink)' }}>Latency</td>
            <td>Time from trigger to firing</td>
            <td>Slower than the harm rate</td>
          </tr>
          <tr>
            <td style={{ color: 'var(--ink)' }}>Blast radius</td>
            <td>Damage done by the time it fires</td>
            <td>Your real cost</td>
          </tr>
          <tr>
            <td style={{ color: 'var(--ink)' }}>False-positive rate</td>
            <td>Fraction of spurious firings</td>
            <td>Trains operators to ignore</td>
          </tr>
          <tr>
            <td style={{ color: 'var(--ink)' }}>Recovery cost</td>
            <td>Work to return to a good state</td>
            <td>Can exceed the failure cost</td>
          </tr>
        </tbody>
      </table>

      <p>
        Grading tends to reveal that many guardrails are doing less than they appear to{' '}
        <Badge
          layer="W"
          note="§2.10 — the grading exercise forces the question of whether each guardrail earns its keep"
        />
        . A review gate running 95% approval is rubber-stamping. A rate limit set at ten times peak
        is decorative. The exercise forces the question of whether each guardrail earns its keep,
        and the bench below runs it for real: commit a five-axis call on four guardrails, then let
        one recorded storm grade them back. One failure in the storm is planted, and it is
        structural rather than behavioral; the inventory table contains the sentence that gives it
        away before a single tick runs. Read the dependency lines, not just the thresholds.
      </p>

      <GuardrailGrader />

      <p>
        Now the turn the chapter has been building to: guardrails are themselves subject to the
        dynamics they guard. They can run away. The retry policy that caused the overload it was
        protecting against is not a hypothetical; it is Chapter 9's storm, which you caused, and the
        policy that fed it was somebody's reactive guardrail doing exactly what it was configured to
        do. They can Goodhart: an eval used as a gate will be optimized against. They can atrophy.
        They can become theatre, like the review that approves everything and the ADR that documents
        decisions already shipped. The defenses are the four moves the terrain has already taught
        you: add decay (rotate evals, retire stale rules), add variety (multiple independent
        guardrails for critical failures), add reflection (measure the guardrails themselves), and
        add escape valves, because a guardrail that can't be overridden will be overridden
        destructively. Fractal, as the pace-layered view in Chapter 6 predicted: the immune system
        needs an immune system, all the way up.
      </p>

      <Pull badge="W">
        A guardrail must not depend on the thing it guards. A circuit breaker that relies on the
        service it's breaking against isn't a circuit breaker.
      </Pull>

      <p>
        Three calls to close: a gate that never says no, read against this chapter's table; a
        threshold decision from Chapter 5 whose real hazard is the false-positive axis; and an
        isolation story that is structural guarding by another name.
      </p>

      <Drill title="Retrieval" cases={RETRIEVAL} />

      <DecisionCard
        title="Grading a guardrail"
        items={[
          "Name its class and ask that class's question. A guardrail answering the wrong question is decoration in the right place.",
          'Score the five axes against its own failure class: coverage, latency, blast radius, false-positive rate, recovery cost.',
          'Trace its dependencies: if it reads the thing it guards, it goes blind exactly when it matters.',
          'Check the reflective layer exists: who measures whether this guardrail still works, and when did it last fire for real?',
          'Schedule the cheap storm: a one-afternoon rehearsal finds structural and configuration failures at rehearsal prices.',
          'Give every hard rule an escape valve; one that cannot be overridden will be overridden destructively.',
        ]}
      />

      <Coda
        line="Four classes, four questions. Grade each guardrail against its own failure class, and expect the measurement to come in under the claim."
        next="Chapter 12 turns from defense to deliberate offense: entropy, designed decay, and why a healthy system needs you to break it on schedule."
      />
    </Chapter>
  );
}
