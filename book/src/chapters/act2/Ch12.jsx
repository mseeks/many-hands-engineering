// Ch12.jsx — "Entropy and disturbance" (Act II · covers §2.11). Three fronts:
// designed decay (a recorded decay-off run on doc-freshness, plus the fleet's
// real decay bug as a field specimen), garbage collection, and adversarial
// pressure culminating in Game Day. The cadence table is the decision card;
// over-stabilization is named honestly. Retrieval rail reaches to Ch 6.

import {
  Badge,
  Chapter,
  Coda,
  DecisionCard,
  Drill,
  FieldSpecimen,
  Lede,
  Mark,
  Pull,
  Term,
  Walkthrough,
} from '../../components/kit.jsx';
import GameDay from '../../labs/GameDay.jsx';
import { CASES } from '../../engine/cases.js';

const byId = (...ids) => ids.map((id) => CASES.find((c) => c.id === id));
const RETRIEVAL = byId('sp-04', 'pl-14');

// A recorded run, authored to §2.11's description: the doc-freshness signal
// with its decay turned off, twelve weeks. No engine behind it; the captions
// are the content, and the figure is marked constructed-for-teaching.
const DECAY_OFF_TRACE = {
  seed: 12,
  steps: [
    {
      label: 'WEEK 0 · DECAY OFF',
      caption:
        'The doc-freshness signal stops fading. Flags now stand until someone clears them by hand; nothing else about the loop changes.',
    },
    {
      label: 'WEEK 2',
      caption:
        '41 flags standing, 9 of them on pages already rewritten. Cleared work and stale work wear the same flag now, because fading was how the field forgot.',
    },
    {
      label: 'WEEK 5',
      caption:
        '160 flags. The refresh loop trusts the field, so a third of its runs land on pages that are already current: real capacity spent re-freshening fresh work.',
    },
    {
      label: 'WEEK 8',
      caption:
        'The field stops ranking anything. When most pages are flagged and no flag is fresher than another, the gradient agents follow is gone; signal-to-noise has gone where Chapter 8 said it would.',
    },
    {
      label: 'WEEK 11',
      caption:
        'Genuinely stale pages now enter a field of 300 standing flags and vanish into it. The one job the signal had, biasing the next action toward the stalest page, is the one thing it can no longer do.',
    },
    {
      label: 'WEEK 12 · SILTED',
      caption:
        'No agent misbehaved, and no flag is false. The commons silted up because nothing in it fades: persistence without decay turns signal into sediment.',
    },
  ],
};

export default function Ch12() {
  return (
    <Chapter n={12} covers="§2.11">
      <Lede>
        Documentation goes stale. Tests rot. Dead code accumulates. Nobody did this; it is the
        default. This chapter is about the work that holds order together, and why part of that work
        has to look like sabotage.
      </Lede>

      <p>
        Every <Term id="terrain">terrain</Term> decays, and the handbook refuses to treat that as
        pessimism: it is thermodynamics, applied to software. Evals drift away from the work they
        were meant to measure. Conventions ossify into dogma. Trust grants outlive the conditions
        they were earned under. Branches abandoned in a corner of the repository quietly turn into
        landmines. Entropy is the default; order requires work{' '}
        <Badge layer="W" note="§2.11 — the work against entropy, fought on three fronts at once" />.
        A many-hands platform fights on three fronts at once, and the first is the strange one:
        decay, the explicit, designed kind. Signals that don't fade become noise. Trust grants that
        don't expire become liabilities. Conventions that never get questioned become cargo cults.
        You have been using designed decay since Chapter 8's field, and the loops carry it too: the
        dep-patch loop's track record is recent, not lifetime, and the doc-freshness{' '}
        <Term id="signal">signal</Term> resets and re-decays. To feel what it is for, watch what
        happens when it is taken away. The run below is recorded{' '}
        <Mark
          kind="made"
          note="constructed for teaching: an authored run drawn to §2.11's description, no engine behind it"
        />
        : the doc-freshness signal with its decay switched off, stepped over twelve weeks. Watch
        what the flags stop meaning.
      </p>

      <Walkthrough trace={DECAY_OFF_TRACE} />

      <p>
        That run is authored; this one is not. The fleet behind this book's specimens hit the same
        failure in its first week of operation, at the size failures should be caught at. The card
        condenses the fleet's log.
      </p>

      <FieldSpecimen source="froot · advisory review loop · week one of the fleet">
        <pre>{`incident   a standing advisory comment, posted to a PR by the
           review loop, naming concrete hazards
state      the hazards it named: fixed, commit by commit
the bug    the comment had no clearing condition. nothing re-checked
           it, nothing faded it; the signal outlived every fact in it
           and kept biasing readers against fixed code
found      week one; fixed by tying the comment's lifetime to a
           re-scan of the hazards it names — decay, designed in`}</pre>
      </FieldSpecimen>

      <p>
        The second front is garbage collection: loops whose only job is to fight accumulation. The
        harness-engineering literature documents these directly{' '}
        <Badge
          layer="E"
          note="§4.2 — the harness-engineering corpus documents maintenance agents of exactly this shape"
        />
        : agents that run periodically to find inconsistencies in documentation, violations of
        architectural constraints, dead code that has crossed a threshold of disuse. They are
        unglamorous and load-bearing, and the case for them is spatial. Without them{' '}
        <Term id="commons">the commons</Term> fills with cruft, and at some point the cruft is what
        the next agent reads first.
      </p>

      <p>
        The third front is the one teams skip, because it feels counterintuitive: adversarial
        pressure, the deliberate disturbance of an otherwise functioning system to keep it honest.
        Things are working; why break them? Because systems that aren't disturbed converge on
        whatever path got reinforced first. The exploration knob decays alongside everything else,
        and the system locks onto a local optimum that may have been wrong from the beginning.
        Many-hands platforms are especially exposed because their feedback compounds: an agent that
        succeeds gets more work, which generates more success signals, which earn more autonomy,
        until the conditions change and nothing in the loop notices. Without periodic disturbance,
        the platform becomes increasingly confident in increasingly stale conclusions. The remedy is
        not stability. The remedy is productive instability: small, deliberate disturbances that
        prevent ossification, force re-adaptation, and keep the terrain honest about what it
        actually depends on.
      </p>

      <Pull badge="W">Stability without disturbance is brittleness in disguise.</Pull>

      <p>
        Three forms of adversarial pressure are worth naming. Chaos engineering: Netflix's Simian
        Army{' '}
        <Badge
          layer="E"
          note="documented practice: the Simian Army is the canonical chaos-engineering record"
        />{' '}
        <Mark kind="real" note="documented-real: Netflix's published chaos-engineering practice" />{' '}
        did not just test for resilience to failure; it ensured the system never came to depend on
        the absence of failure, and the many-hands analog is broader: deliberately failing tools,
        simulating model regressions, randomly revoking permissions, killing background loops,
        corrupting non-critical signals. Adversarial verification: property-based testing, mutation
        testing, fuzzing, the specification-by-adversary loop. Instead of asking does this work, ask
        what it would take to break this, then build the agent that systematically tries. And forced
        removal: periodically take something away (a tool the agents rely on, a piece of context
        they always read, a signal they always check) and see what happens. If they collapse, you
        have found a hidden dependency. If they adapt, the dependency wasn't load-bearing.
        Subtraction reveals what addition concealed, and the third form is the one you can run right
        now. The terrain below has been healthy for months, which is exactly when you know least
        about what it depends on. Commit a call before each removal, and let the misses correct your
        map.
      </p>

      <GameDay />

      <p>
        Keep the distinction the lab closed on, because it is the front's whole justification. This
        is not testing. Testing asks whether the system meets a known specification; adversarial
        pressure asks whether the system is quietly relying on things no one specified. The first is
        verification, the second is discovery, and both matter. The practice runs on its own pace
        layer, which is the decision card below: daily noise, weekly faults, monthly game days,
        quarterly removals. And it carries one honest warning at the far end. The healthy posture is
        equilibrium under disturbance: a system that holds its shape because it has built the
        capacity to absorb challenge and re-form, which is what an immune system actually does, and
        what Chapter 11's guardrails aspire to. Entropy fought too well becomes its own pathology{' '}
        <Badge
          layer="W"
          note="§2.11 — over-stabilization: the system loses the capacity to adapt to what comes next"
        />
        . Max the stabilizers and the system stops being able to adapt to what comes next; the work
        against entropy, done right, maintains responsive order, not stillness. You will meet the
        over-stabilized signature on a panel in the next chapter, and the tell is exactly this: a
        dent that never re-rounds.
      </p>

      <p>
        Two calls before the cadence card: a reinforced path that no disturbance ever questioned,
        and a schema commons from Chapter 6 whose healthiest feature is a TTL.
      </p>

      <Drill title="Retrieval" cases={RETRIEVAL} />

      <DecisionCard
        title="The disturbance calendar"
        items={[
          'Daily: small disturbances built into normal operation. Random retry jitter, cache misses, occasional eval shuffling.',
          'Weekly: deliberate fault injection in non-critical paths; mutation tests on recent changes.',
          'Monthly: chaos game days; full red-team passes against new agent classes; review trust grants for evidence of staleness.',
          'Quarterly, or on triggers: removal experiments. Take away a context source, a tool, a heuristic, and observe what breaks.',
        ]}
      />

      <Coda
        line="Order requires work, and the order worth having is responsive: equilibrium under disturbance, not stillness."
        next="Chapter 13 compresses everything since Chapter 8 into a glance: five gauges, five signatures, ten panels, and the call you make before you can prove it."
      />
    </Chapter>
  );
}
