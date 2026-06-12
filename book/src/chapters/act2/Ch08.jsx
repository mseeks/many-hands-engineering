// Ch08.jsx — Signal physics (covers §2.1 four forces + §2.8). The Signal
// Field's one guided appearance; the four forces consolidated with entropy
// beneath; impossibility results as static cards pointing at the literature;
// Ashby stated plainly; incentives as prose. Retrieval rail: a rate to name,
// a wiring decision reaching back to Chapter 3, and a dark region.

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
import SignalField from '../../labs/SignalField.jsx';

const FORCES = [
  [
    'Reinforcement',
    'A signal strengthens with use.',
    'The golden-path doc that gets linked because it is already the most linked.',
  ],
  [
    'Decay',
    'A signal weakens with time.',
    'The staleness marker fading to amber with nobody touching it.',
  ],
  [
    'Runaway',
    'Reinforcement without counter-force. The death spiral.',
    'The retry queue still feeding itself an hour after its trigger cleared.',
  ],
  [
    'Drift',
    'Slow divergence between what the system measures and what the world rewards.',
    'The eval score that climbs for six weeks while the thing it stands for gets worse.',
  ],
];

const IMPOSSIBILITY_CARDS = [
  {
    kicker: 'CAP · Brewer 2000; Gilbert & Lynch 2002',
    body:
      'Consistency, availability, partition tolerance: under a partition, a distributed system ' +
      'keeps two. A registry that must answer during a partition either lies or stalls; the ' +
      'theorem says pick which, in advance.',
  },
  {
    kicker: 'PACELC · Abadi 2012',
    body:
      'The extension that prices the good days too: if a partition, availability versus ' +
      'consistency; else, latency versus consistency. Even a healthy commons pays one of the ' +
      'two on every read.',
  },
  {
    kicker: 'FLP · Fischer, Lynch & Paterson 1985',
    body:
      'In a fully asynchronous system, no deterministic consensus protocol tolerates even one ' +
      'crash failure. Every real consensus system buys its way out with timeouts or randomness, ' +
      'which is a choice about where to pay.',
  },
];

const RATE_CASE = {
  id: 'rx-801-rate',
  surface:
    'Code search: a snippet index with per-result confidence scores, boosted on every click.',
  prompt:
    'Quarter two: median confidence is 0.96, every results page is a wall of high-confidence ' +
    'snippets, and engineers have started grepping instead. Which rate slipped?',
  evidence: [
    {
      label: 'Boost',
      text: 'A click adds confidence; fourteen months of clicks are in the index.',
    },
    {
      label: 'Expiry',
      text: 'Nothing reduces a score: not age, not the file changing underneath the snippet.',
    },
    {
      label: 'Contrast',
      text: 'Top decile 0.99, median 0.96. The ranking has 0.03 of contrast left.',
    },
  ],
  options: [
    { id: 'spread', label: 'Spread: relevance is leaking between neighboring results' },
    { id: 'decay', label: 'Decay: nothing fades, so everything saturates' },
    { id: 'reinforce', label: 'Reinforcement: clicks are not depositing strongly enough' },
    { id: 'explore', label: 'Exploration: the index never samples unclicked snippets' },
  ],
  feedback: {
    decay:
      'The saturation fingerprint, exactly as the field drew it in task 2: every score climbs ' +
      'toward the cap, contrast goes to 0.03, and a field that says everything is excellent ' +
      'says nothing. The contrast was the information, and decay was what paid for it. You also ' +
      'met this shape one chapter ago as a commons fingerprint: congruence says high-frequency ' +
      "signals decay fast, and engineers grepping is the field's users routing around a " +
      'commons that stopped being legible.',
    spread:
      'Spread blurs a gradient sideways: neighbors inherit heat they did not earn, and the ' +
      'shape it leaves is an even wash across adjacent results. This wall is not a wash, it is ' +
      'a monotonic climb, fourteen months of deposits with nothing ever subtracted. A climb ' +
      'plus vanishing contrast is the missing-decay signature; spread would not push the median ' +
      'to 0.96.',
    reinforce:
      'Reinforcement is the one rate here working overtime: fourteen months of clicks, every ' +
      'one deposited, none ever taken back. Weaker deposits would slow the climb without ' +
      'restoring contrast, because the asymmetry remains: signal flows in and nothing flows ' +
      'out. The missing flow is decay, and it is what legibility is made of.',
    explore:
      'An exploration floor changes what gets sampled, not what gets forgotten. More wandering ' +
      'adds new high scores to the wall and the median keeps climbing. The diagnostic is the ' +
      'expiry line in the evidence: nothing reduces a score, so the field cannot forget, and a ' +
      'field that cannot forget converges on uniform, useless confidence.',
  },
};

const CHANNEL_CASE = {
  id: 'rx-802-channels',
  surface: 'Fleet design review: 32 agents coordinating work across one monorepo.',
  prompt:
    'Proposal A: every agent messages every relevant peer ("explicit is better"). Proposal B: ' +
    'agents read and write signals in the repo: labels, ledgers, status files. The A team says ' +
    'protocol discipline will manage the chatter. What does the arithmetic say?',
  evidence: [
    {
      label: 'Channels under A',
      text: 'Every pair that can interact is a channel to design, version, and debug: 32 agents is 496 pairs.',
    },
    {
      label: 'Channels under B',
      text: 'Each agent holds one interface, the terrain: 32 agents is 32 contracts.',
    },
    { label: 'Growth', text: 'The fleet doubles next year.' },
  ],
  options: [
    {
      id: 'discipline',
      label: 'A works: with strong protocol discipline, channels stay manageable',
    },
    {
      id: 'topology',
      label: 'B wins on topology: N against N², and the gap compounds with growth',
    },
    { id: 'equivalent', label: 'Equivalent: the same information flows either way' },
  ],
  feedback: {
    discipline:
      'Discipline is a linear force set against a quadratic cost. Hold every pairwise channel ' +
      'to a beautiful protocol and there are still 496 of them to design, version, and debug, ' +
      'then 2,016 after the doubling. The mesh degrades above a few tens of nodes for ' +
      'combinatorial reasons, never ideological ones; no amount of rigor changes the exponent.',
    topology:
      'Combinatorial, not ideological: 496 pairs against 32 contracts today, 2,016 against 64 ' +
      'after the doubling. You met this arithmetic in Chapter 3, traced rather than computed: ' +
      'every hop in the chain read READ or WRITE, never CALL, because shared-environment ' +
      'coordination is the only wiring whose cost grows with the fleet instead of its square.',
    equivalent:
      'The same information can flow either way only if every pairwise exchange is faithfully ' +
      'mirrored into terrain, at which point you have built proposal B with extra steps. The ' +
      'costs differ in kind: N² channels each need design, versioning, and debugging; the ' +
      'shared field needs N contracts plus governance, and Chapter 7 just priced governance. ' +
      'That bill is real, but it is linear.',
  },
};

const DARK_REGION_CASE = {
  id: 'rx-803-dark',
  surface: 'Refactor fleet: four workers picking regions by signal heat, eight weeks in.',
  prompt:
    'The bright four regions take 96% of picks. An audit finds payments/ at quality 0.97 with ' +
    'signal 0.02: the best return on the board, never visited. What do you change?',
  evidence: [
    {
      label: 'The gradient',
      text: 'Heat tracks merged outcomes; the bright four earned their heat honestly under CI.',
    },
    {
      label: 'The floor',
      text: 'Exploration is set to 0.01: one pick in a hundred ignores the heat.',
    },
    {
      label: 'The dark region',
      text: 'payments/ has never been picked; its 0.02 is the residue of initialization, not a verdict.',
    },
  ],
  options: [
    { id: 'floor', label: 'Raise the exploration floor' },
    { id: 'decay', label: 'Raise decay so the bright four fade' },
    { id: 'assign', label: 'Have the steward assign payments/ to a worker' },
  ],
  feedback: {
    floor:
      'The floor is the knob that buys information. At 0.01, the expected wait for a first ' +
      'visit anywhere off-gradient is about a hundred picks; raise it to 0.10 and the field ' +
      'samples its own blind spots, payments/ earns real heat within weeks, and the gradient ' +
      'becomes an audit instead of a habit. Priced honestly: exploration spends picks on duds ' +
      'too, and the far end of this dial is a field where nothing consolidates. The knob has ' +
      'two failure directions, which is why it is a knob.',
    decay:
      'Decay treats saturation and lock-in, and neither is the diagnosis: contrast is healthy ' +
      'and the bright four earned their heat under an intact outside reference. More decay dims ' +
      'the whole board, and payments/ stays dark, just in dimmer company. The gap is sampling, ' +
      'not forgetting: a gradient is a record of sampled outcomes, never an audit of the ' +
      'terrain.',
    assign:
      'The lever you reached for is the one this book does not have, on purpose. An assignment ' +
      'would fix payments/ once and fix nothing about the next dark region, because the gap is ' +
      'structural: a floor of 0.01 means the field almost never samples off its own gradient. ' +
      'Terrain moves exist if you want them, a one-time seeded deposit on payments/ is ' +
      'legitimate, but seeded heat decays unless visits re-earn it. The durable fix is the ' +
      'floor.',
  },
};

const RETRIEVAL_CASES = [RATE_CASE, CHANNEL_CASE, DARK_REGION_CASE];

export default function Ch08() {
  return (
    <Chapter n={8} covers="§2.1 + §2.8">
      <Lede>
        A many-hands platform is a dynamical system in the formal sense: states, transitions, stable
        and unstable equilibria, and phase changes when a parameter crosses a threshold. Treat it as
        static architecture and the system will eventually correct you.
      </Lede>

      <p>
        Take an inventory of your own terrain tonight and you will find four forces already at work.
        Something is strengthening because it gets used. Something is weakening because time is
        passing. Somewhere a feedback circle is feeding itself. And somewhere a number you report is
        quietly parting company with the thing it stands for. The handbook gives the four their
        names <Term id="four-forces">the four forces</Term>, and claims most of what goes right or
        wrong in a many-hands system shows up as one of them{' '}
        <Badge layer="W" note="the four forces, handbook §2.1" />. Underneath all four is entropy:
        the second-law tendency of any system to drift from order toward noise unless work is
        continually invested. Decay, drift, and eventually runaway are how entropy presents itself
        in software; the work against it is the steward's standing job, and Chapter 12 puts it on a
        schedule.
      </p>

      <table className="mh-table">
        <thead>
          <tr>
            <th>Force</th>
            <th>What it is</th>
            <th>On your platform</th>
          </tr>
        </thead>
        <tbody>
          {FORCES.map(([name, def, example]) => (
            <tr key={name}>
              <td>
                <strong>{name}</strong>
              </td>
              <td>{def}</td>
              <td>{example}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        The first three forces share one piece of mathematics. A <Term id="signal">signal</Term>{' '}
        spreads, fades, and accumulates: a dynamic called reaction–diffusion, in which three rates
        determine everything: how fast a signal spreads, how fast it fades, and how strongly it is
        reinforced. Decay too slow, and signals saturate into noise. Reinforcement outrunning decay,
        and the system locks onto whatever was reinforced first, even when it was wrong; without
        sufficient decay, self-reinforcing aggregation can grow without bound, which is the shape of
        most runaways you will ever see{' '}
        <Badge
          layer="E"
          note="reaction–diffusion and branching-process results are real mathematics; the bridge from this toy field to a repo terrain is informal — Chapter 24 holds the gap honestly"
        />
        . The field below is those three rates made walkable: twelve repo regions, four workers
        following heat, one knob freed per task. Commit before each run. Find the saturation in task
        2, watch CI lose to a hot dial in task 3, and in task 4 walk the dial down one notch at a
        time until the field stops being possible.
      </p>

      <SignalField />

      <p>
        The cliff you found in task 4 is the chapter's second law: positive feedback produces phase
        transitions. Self-reinforcing dynamics change <em>qualitatively</em> when a control
        parameter crosses a critical value. Below it, perturbations die; above it, they grow until
        something counter-acts; and between the regimes there is no ramp. Discontinuity is the
        default, so adding one more agent, one more loop, one more retry can change everything, and
        a system calibrated by feel on the smooth side carries no warning that the smoothness ends.
      </p>

      <Pull badge="E">
        Below the critical value, perturbations die. Above it, they grow until something
        counter-acts. Discontinuity is the default.
      </Pull>

      <p>
        The rate you mostly held frozen is the fourth knob: exploration. Every system that
        coordinates through signals has a dial, explicit or hidden, for how much its agents follow
        existing signal versus wander. Too exploitative and the system locks onto the first
        good-enough path; you watched delivery/ own a field it deserved to lose. Too exploratory and
        nothing consolidates: deposits land everywhere and accumulate nowhere. Mistuning this knob
        is the most common cause of either brittleness or noise, and most platforms have never
        located the knob at all.
      </p>

      <p>
        One more result, about wiring rather than rates. Direct messaging among N agents needs on
        the order of N² channels; shared-environment coordination needs N{' '}
        <Badge
          layer="E"
          note="combinatorial, not ideological; the channel arithmetic from Chapter 3"
        />
        . You met this in Chapter 3, traced rather than computed: every hop read READ or WRITE and
        never CALL. It is why tightly coupled meshes degrade above a few tens of nodes, each pair a
        designed, versioned, debuggable surface, while a shared field grows one contract per actor.
        Some constraints bind harder still. The three cards below are theorems, and the book draws
        the line at simulating what a proof already settles: no bench can add to them, and no
        architecture evades them. You choose where to pay the cost.
      </p>

      <div className="mh-cardgrid">
        {IMPOSSIBILITY_CARDS.map((c) => (
          <div className="mh-card" key={c.kicker}>
            <span className="mh-kicker">{c.kicker}</span>
            {c.body}
          </div>
        ))}
      </div>

      <p>
        Ashby's law of requisite variety, stated plainly: a regulator must have at least as much
        variety as the disturbances it regulates{' '}
        <Badge layer="E" note="Ashby (1956), the law of requisite variety" />. A one-size-fits-all
        safety filter cannot regulate a variety-rich agent fleet; guardrails must be at least as
        differentiated as the failures they guard against. The handbook's gloss is two words, not
        negotiable, and Chapter 11 builds its four guardrail classes directly on this law.
      </p>

      <p>
        The last dynamic does not fit on a dial. When agents can model incentives, coordination
        acquires a political economy: they can deceive, free-ride, and game evaluators, and the
        system's stable outcomes tend to be the ones the incentive structure supports, whether or
        not you intended them. Designing the incentives is, increasingly, part of designing the
        system. That claim runs as a live bench in Chapter 20; here it stands as the reason signal
        physics alone is never the whole story.
      </p>

      <p>
        Three cases close the act's physics: a rate to name, a wiring decision that reaches back to
        Chapter 3, and a dark region that will tempt you toward the lever this book does not have.
      </p>

      <Drill title="Retrieval" cases={RETRIEVAL_CASES} />

      <DecisionCard
        title="Before you tune a signal"
        items={[
          'Find the three rates first: how it spreads, how it fades, how strongly success reinforces it. The answers predict the failure.',
          'Decay is not cleanup; it is what legibility is made of. A field that never forgets converges on uniform, useless confidence.',
          'Keep one outside reference the signal cannot vote on, and check the self-report against it on a schedule.',
          'Hold an exploration floor: a gradient is a record of sampled outcomes, not an audit of the terrain.',
          'Count the channels: N reading a shared field, N² calling each other. The exponent does not negotiate.',
          "Match your regulator's variety to the failures it guards; one filter cannot hold a varied fleet.",
        ]}
      />

      <Coda
        line="Signals obey physics: three rates, four forces, and a boundary with no ramp."
        next="Runaway. Chapter 9 takes the leash off: you cause the storm yourself, and the restart-the-agent button gets its one tick."
      />
    </Chapter>
  );
}
