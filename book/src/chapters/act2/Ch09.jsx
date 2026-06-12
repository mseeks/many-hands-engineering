// Ch09.jsx — "Runaway" (Act II · covers §2.9, the emergent death spiral).
// Productive failure inside rails: cause the storm, commit an explanation,
// then get the name. The healthy-vs-runaway table verbatim; the warning
// signs and the remedy family; the ant mill's single book-wide appearance
// as one Ⓜ margin card. Closes with a retrieval drill reaching back to Ch 5.

import {
  Badge,
  Chapter,
  Coda,
  DecisionCard,
  Drill,
  FieldSpecimen,
  Lede,
  Pull,
  Term,
} from '../../components/kit.jsx';
import RunawayLab from '../../labs/RunawayLab.jsx';
import { CASES } from '../../engine/cases.js';

const byId = (...ids) => ids.map((id) => CASES.find((c) => c.id === id));
const RETRIEVAL = byId('sp-02', 'sp-06', 'pl-04');

export default function Ch09() {
  return (
    <Chapter n={9} covers="§2.9">
      <Lede>
        A three-tick demand spike ended forty-six ticks ago, and the service is still drowning.
        Nothing broke. Nobody misbehaved. The load keeps coming anyway, and this chapter is about
        the failure family that builds itself.
      </Lede>

      <p>
        Start with the arithmetic. A service that clears 50 requests a tick is being offered 330.
        Fresh demand accounts for 30 of those, the same 30 a tick it has carried all quarter,
        because the spike that started this lasted three ticks and has been over for forty-six. So
        300 requests a tick are arriving from somewhere that is not your users. Many-hands systems
        fail in two characteristic families{' '}
        <Badge layer="W" note="§2.9 — the two death spirals; learn each from its first symptom" />,
        and the working skill is recognizing each from the first symptom. This chapter puts your
        hands on the first family. The next chapter schedules the second.
      </p>

      <p>
        The bench below opens on the wreck so you can study it before touching anything. Then it
        hands you the only two dials the retry policy has, takes a committed prediction, and runs
        the same spike against your settings. Most honest settings will not survive it. When yours
        doesn't, the question that matters sits at the far end of the chart: capacity never moved,
        demand recovered at tick 13, so what exactly is still arriving at tick 59? Count the
        composition before you answer. Then, in Phase B, the same storm runs with its outside
        reference cut, and the one button this book never gives you is sitting there, ungated, in
        red. Press it.
      </p>

      <RunawayLab />

      <p>
        You committed an explanation before the engine handed you the name, and the name is{' '}
        <strong>emergent runaway</strong>: a reinforcing <Term id="signal">signal</Term> without
        counter-force{' '}
        <Badge layer="W" note="§2.9 — the emergent death spiral, the first of the two families" />.
        The storm you caused was made of retries, but nothing about the family is a retry
        phenomenon. The handbook's catalog of skins: retry storms overwhelm the service being
        retried. Agents cite each other until ungrounded claims look well-grounded. Recommendation
        loops narrow onto local optima the exploration rate can no longer escape. Evaluators trained
        on agent output drift into rewarding surface features that agents then optimize for
        directly. You stepped two of those in Phase C and watched the phase dial refuse to care
        which nouns were attached; the recommendation skin waits in the drill at the end of this
        chapter, wearing an on-call pager.
      </p>

      <aside
        className="mh-card"
        style={{ borderTopColor: 'var(--amber)' }}
        aria-label="Margin: the biological archetype"
      >
        <span className="mh-kicker">
          Margin · the biological archetype{' '}
          <Badge
            layer="M"
            note="organizing metaphor: garnish, not argument — the only biology in this book"
          />
        </span>
        <p style={{ margin: 0 }}>
          The family has a biological archetype, and this margin card is its one appearance in the
          book: the ant mill. Army ants that lose the main trail follow each other in a circle until
          the colony dies of exhaustion. The signal did what signals do; the system lacked the
          mechanism to break the loop. That is the whole metaphor, and it is garnish. Every
          mechanism in this chapter runs on CI, queues, retries, and evals, and none of it needs an
          ant to be true.
        </p>
      </aside>

      <p>
        Phase B's lamp board was the handbook's diagnostic table, wired to a live run. Here is the
        instrument at rest. Read it column by column and notice that the rows name terrain
        properties, not agent properties: nothing in this table can be fixed by improving any
        individual hand.
      </p>

      <table className="mh-table">
        <thead>
          <tr>
            <th></th>
            <th>Healthy emergent work</th>
            <th>Runaway</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ color: 'var(--ink)' }}>Decay</td>
            <td>present</td>
            <td>absent</td>
          </tr>
          <tr>
            <td style={{ color: 'var(--ink)' }}>Variety</td>
            <td>preserved</td>
            <td>collapsed</td>
          </tr>
          <tr>
            <td style={{ color: 'var(--ink)' }}>Outside reference</td>
            <td>intact</td>
            <td>severed</td>
          </tr>
          <tr>
            <td style={{ color: 'var(--ink)' }}>Net behavior</td>
            <td>self-correcting</td>
            <td>self-amplifying</td>
          </tr>
        </tbody>
      </table>

      <p>
        A storm announces itself before the dial pins, so learn the warning signs as a family:
        signal-to-noise declining while activity rises. The same patterns recurring across unrelated
        tasks. High confidence on outputs a human recognizes as degraded. Eval scores diverging from
        real outcomes. Variety collapsing without a corresponding increase in selectivity. Notice
        what is missing from that list: volume. A loud queue draining under backpressure is weather;
        a quiet metric feeding on itself is the storm. Every sign on the list is about divergence
        and self-reference, never about noise, which is why the loudest dashboards are so rarely the
        ones that matter.
      </p>

      <p>
        The remedies form a family too, and the handbook gives it whole: inject variety. Increase
        decay. Add an outside reference the loop cannot produce itself. Tighten the trust model. In
        severe cases, evacuate and restart. You applied every one of them in Phase B and watched the
        lamps flip as the <Term id="terrain">terrain</Term> changed shape under the storm. And you
        pressed the other button, the one shaped like the reflex: restart the agent. The load dipped
        for exactly one tick, the demand behind the restarted client came straight back, and four
        lamps did not move. Chapter 3 told you that you would keep reaching for the agent lever;
        this was the run built to retire the reflex.
      </p>

      <Pull badge="W">
        The problem is in the terrain, not in any individual agent. Patching the agent won't fix it.
      </Pull>

      <p>
        The shape has real mathematics underneath it. In reaction-diffusion systems,
        self-reinforcing aggregation without sufficient decay produces finite-time blow-up{' '}
        <Badge
          layer="E"
          note="Keller–Segel: blow-up without decay is a proved result, the mathematical form of runaway"
        />
        , and reinforcement systems converge only when a positive exploration floor is preserved{' '}
        <Badge
          layer="E"
          note="ACO convergence (Gutjahr; Stützle–Dorigo): the floor is not decorative"
        />
        . But the handbook is explicit about what the theorems buy you{' '}
        <Badge
          layer="W"
          note="§4.3 — the results function as analogies and design intuitions, not predictive models; the bridge to your platform is informal"
        />
        : design intuition, not thresholds. That is why the bench drew the family's shape and
        refused to predict your service's tipping point, and why its model notes say so in plain
        text. Nothing in this book computes a real critical value.
      </p>

      <p>
        One remedy carries scar tissue from the fleet behind this book's specimens. The outside
        reference sounds like the easiest lamp to keep lit, until the question becomes where the
        reference is allowed to live. The card below condenses the fleet's incident note.
      </p>

      <FieldSpecimen source="froot · mapper loop · 2026">
        <pre>{`symptom    on clean scans, with nothing to find, a mapper returned
           findings anyway: plausible, well-formatted, false
tried      prompt discipline ("if nothing is found, report nothing")
           lowered the rate; it did not hold at zero
patch      a stronger model; on this class, it held
the keep   the patch is a bet, the structure is the fix. ground truth
           for "is there anything to find" cannot come from the model
           whose findings are in question — the outside reference must
           live outside the model.`}</pre>
      </FieldSpecimen>

      <p>
        Three calls before the chapter closes. Two are live traces to read from their warning signs;
        one reaches back to Chapter 5, because the eval that drifts in this chapter is the same
        surface you once placed on the quadrant.
      </p>

      <Drill title="Retrieval" cases={RETRIEVAL} />

      <DecisionCard
        title="At the first symptom of a storm"
        items={[
          "Find the gain: what fraction of this activity is the system's own output returning as input? Above one, the trigger no longer matters.",
          'Read the four lamps: is anything decaying, is variety preserved, does a reference exist that the loop cannot produce itself, is net behavior damping or amplifying?',
          'Check the signs that precede the dial: signal-to-noise falling while activity rises, one pattern recurring across unrelated tasks, confidence high on output you recognize as degraded, evals diverging from outcomes.',
          'Reach only into the remedy family, all of it terrain: inject variety, raise decay, restore an outside reference, tighten trust, and evacuate-and-restart for the severe case.',
          'Do not patch the agent. The storm survives every restart, because no agent owns it.',
        ]}
      />

      <Coda
        line="A reinforcing signal without counter-force runs away, and the counter-force is terrain: every remedy that works reshapes the environment, not the agent."
        next="Chapter 10 runs the other death spiral: a spec losing contact with reality faster than anyone updates it, behind a board that stays green to the end."
      />
    </Chapter>
  );
}
