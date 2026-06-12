// Ch06.jsx — Hybrids and strata (covers §2.4–2.5, first beat of §3.5's
// upstream half). Five composition patterns as cards; the deep one
// (scaffold-and-release, overstayed) as an authored recorded run; then the
// strata router and the ratification moment. Retrieval rail: a theatre
// recall from Ch 4, a placement from Ch 5, and the contested zoning case.

import {
  Badge,
  Chapter,
  Coda,
  DecisionCard,
  Drill,
  Lede,
  Mark,
  Pull,
  Term,
  Walkthrough,
} from '../../components/kit.jsx';
import StrataAndRatification from '../../labs/StrataAndRatification.jsx';
import { CASES } from '../../engine/cases.js';

const PATTERNS = [
  {
    kicker: '1 · Shell and core',
    body: 'A firm planned interface around an emergent interior. Microservice contracts, OS kernels, constitutions.',
  },
  {
    kicker: '2 · Scaffold and release',
    body: 'Planned builds the initial structure; emergent takes over. Failure mode: overstaying the planned phase.',
  },
  {
    kicker: '3 · Nested zones',
    body: 'Planned zones contain emergent zones contain planned zones. Handle things at the lowest layer that can handle them.',
  },
  {
    kicker: '4 · Alternating breath',
    body: 'The two modes take turns in time: divergent, convergent, divergent, convergent. Know which phase you are in.',
  },
  {
    kicker: '5 · Zoning',
    body: 'Risk-stratified coexistence. Payments are planned; feature flags are emergent. Same system, different zones.',
  },
];

// The deep pattern, run twice from one fork. Authored, not an engine trace:
// the captions are the argument, step by step (the recorded-run fallback).
const OVERSTAY_TRACE = {
  seed: 6,
  steps: [
    {
      label: 'WK 1 · THE SCAFFOLD',
      caption:
        'A two-engineer planned core ships the skeleton of the new retrieval service: the index schema, the ingestion contract, one seeded connector. Every change gates on design review, and that is right; nothing exists yet for emergent work to read.',
      data: {},
    },
    {
      label: 'WK 3 · STRUCTURE DONE',
      caption:
        'The skeleton holds. Contracts written, CI oracle green, three loops staged: connector-add, chunk-tune, staleness-sweep. The scaffold has done what scaffolds do.',
      data: {},
    },
    {
      label: 'WK 4 · AS DESIGNED',
      caption:
        'The release: review narrows to the contract surface and the interior goes emergent. Loops propose, CI verifies, reverts are cheap. Hold this frame; it is the counterfactual the next five steps diverge from.',
      data: {},
    },
    {
      label: 'WK 4 · THE OVERSTAY',
      caption:
        '"Let us keep the council two more weeks, just to be safe." The failure mode is not a crash; it is this sentence, and it sounds like prudence every time it is said.',
      data: {},
    },
    {
      label: 'WK 6 · THE QUEUE',
      caption:
        "Eleven connector proposals wait on the council's calendar. Each is reversible, specified, loose: the axes read emergent, the gate reads planned, and the placement discipline from Chapter 5 is being overridden by a meeting.",
      data: {},
    },
    {
      label: 'WK 8 · TRUST, INVERTED',
      caption:
        'The council now reviews chunking parameters it has no signal on, so it approves on trust. Form: planned. Substance: a slower emergent. The sign-off ceremony costs a week and binds nothing.',
      data: {},
    },
    {
      label: 'WK 10 · THE SHADOW FORK',
      caption:
        'Two teams fork the index privately to stop waiting. The interior the council guards is going emergent anyway, off the terrain, where no signal accrues and no ledger remembers.',
      data: {},
    },
    {
      label: 'WK 12 · THE OVERSHOOT',
      caption:
        'The council disbands itself ("we have become a bottleneck") and every gate drops at once, including the contract gate the scaffold was built to leave behind. The pendulum does not stop at the design.',
      data: {},
    },
    {
      label: 'THE BILL',
      caption:
        'Eight weeks of queue, two shadow forks, and the one gate worth keeping gone with the rest. A scaffold is judged by its release date. Set the date when you build the scaffold, not when the queue forces it.',
      data: {},
    },
  ],
};

// Retrieval: the registry wearing the wrong mode's name (reaches Ch 4).
const REGISTRY_CASE = {
  id: 'rx-601-registry',
  surface: 'Data mesh: a central schema registry with a governance board; 14 producer teams.',
  prompt:
    'The board approves every schema centrally; producers deploy on merge. An audit samples 20 ' +
    'live event streams: 7 carry fields the registry has never seen, and none were blocked. ' +
    'What is this system, and what is the registry?',
  evidence: [
    {
      label: 'Form',
      text: 'Mandatory board approval for schema changes; approval SLA nine days; the coverage dashboard reads 100%.',
    },
    {
      label: 'Substance',
      text: 'Consumers integrate against the wire, not the registry, "because the wire is what is true."',
    },
    {
      label: 'The seam',
      text: 'Nothing validates payloads against the registry at publish time; a mismatch has never failed anything closed.',
    },
  ],
  options: [
    { id: 'planned-lag', label: 'Planned, with an approval backlog to fix' },
    { id: 'theatre', label: 'Governance theatre: the registry is a wiki page' },
    { id: 'shell', label: 'Shell and core: a planned interface holding an emergent interior' },
  ],
  feedback: {
    'planned-lag':
      'A backlog is planned work running slow; this is planned work not running at all. The ' +
      'decisions live on the wire: 7 of 20 streams carry unapproved fields and nothing failed ' +
      "closed, so authority is distributed in fact and central in name. That is Chapter 4's " +
      'torn board, two years in. Speeding up the board improves the SLA of the paperwork; the ' +
      'fix is at the seam, where nothing validates.',
    theatre:
      "Chapter 4's test, applied: the seam fails open, so the registry binds nothing and the " +
      'coverage dashboard measures ceremony. Then the Chapter 6 move: this system wants to be ' +
      'shell and core, and it can earn the name. Shrink the registry to the events consumers ' +
      'actually couple to, validate at publish time so a mismatch fails closed, and let the ' +
      'rest of the wire stay emergent. A smaller shell that binds beats a total one that does ' +
      'not.',
    shell:
      'Shell and core is exactly what this wants to be, and the test it fails is the shell ' +
      'test: the interface must fail closed. A registry nothing validates against at publish ' +
      'time is documentation, not an interface; 7 of 20 streams already drifted past it. The ' +
      'repair is honest zoning: freeze and enforce the minimal schema consumers couple to, and ' +
      'declare the rest emergent on purpose.',
  },
};

const RETRIEVAL_CASES = [
  REGISTRY_CASE,
  CASES.find((c) => c.id === 'pl-10'),
  CASES.find((c) => c.id === 'pl-14'),
];

export default function Ch06() {
  return (
    <Chapter n={6} covers="§2.4–2.5">
      <Lede>
        Almost nothing you run is purely planned or purely emergent. The real skill is composition:
        which mode holds which region, what holds the seam, and which clock each piece is allowed to
        keep.
      </Lede>

      <p>
        You already run hybrids; you may never have named them. The microservice with a frozen
        contract and a chaotic interior is a planned shell around an emergent core. The migration
        that started with a tiger team and was supposed to hand off to loops is a scaffold waiting
        for its release. The handbook finds five patterns that recur, and they are worth knowing by
        name because each one fails in its own way.
      </p>

      <div className="mh-cardgrid">
        {PATTERNS.map((p) => (
          <div className="mh-card" key={p.kicker}>
            <span className="mh-kicker">{p.kicker}</span>
            {p.body}
          </div>
        ))}
      </div>

      <p>
        Four of the five fail loudly enough to find: a shell that leaks shows up in the core's bug
        tracker, bad zoning shows up as ceremony where none is owed. The quiet one is scaffold and
        release, because its failure mode arrives as a sentence that sounds like prudence. Step the
        run below. The fork is at week 4; watch for the moment the alternate branch starts costing
        money, and notice that no step in it ever looks like a mistake while it is being made.
      </p>

      <div>
        <span className="mh-kicker" style={{ display: 'block', marginBottom: 4 }}>
          Recorded run · scaffold and release, overstayed{' '}
          <Mark
            kind="made"
            note="authored worked example, not an engine trace; the captions are the argument"
          />
        </span>
        <Walkthrough trace={OVERSTAY_TRACE} />
      </div>

      <p>
        The five patterns compose modes across a surface. The other axis is time. A real many-hands
        platform is not one system but six, stacked by rate of change, the{' '}
        <Term id="pace-layers">pace layers</Term>: governance moves in years, architecture in
        months, capabilities in weeks, orchestration in days, agents in hours, invocations in
        minutes. Three rules govern the stack{' '}
        <Badge layer="W" note="the pace-layered platform, handbook §2.5, after Brand (1994)" />.
        Each layer changes at its own pace, and the two category errors are ones you can feel:
        governance that changes weekly is theatre, and invocations that need architectural review
        are a slow IDE. Signals flow up and authority flows down: a pattern observed at the bottom
        can climb, but only by ratification at each layer, never by fiat from below, while a change
        at the top reshapes every layer beneath it. And each layer fails in its own characteristic
        way, so a review pitched at the wrong layer treats a failure the layer in front of you does
        not have. The pace layer tells you <em>when</em> something changes; the spectrum tells you{' '}
        <em>how</em> it is coordinated. The two labs below are rule two, played from both ends: the
        router hands you six failures and asks you to pitch each at the layer whose clock matches;
        the ratification moment hands you a convention forming in the feed and a ladder for deciding
        whether it climbs.
      </p>

      <StrataAndRatification />

      <p>
        Notice whose job you were just doing. Nothing in either lab touched an agent: you read
        clocks, pitched reviews at layers, named a convention, ratified it into terrain. That is the
        upstream half of the <Term id="steward">steward</Term>'s role, the half that never appears
        in an approval queue, and it is where the role earns its keep. The downstream half, the
        budget, the gates, the queue arithmetic, gets its own bench in Act III; Chapter 17 completes
        the picture of the human in this loop.
      </p>

      <Pull badge="W">Signals flow up by ratification. Authority flows down as terrain.</Pull>

      <p>
        Three cases close the chapter: a registry wearing the wrong mode's name, a placement call on
        terrain Chapter 5 never showed you, and a contested schema whose honest resolution is this
        chapter's zoning move.
      </p>

      <Drill title="Retrieval" cases={RETRIEVAL_CASES} />

      <DecisionCard
        title="Before you compose, or promote"
        items={[
          'Name the pattern out loud: shell, scaffold, nesting, breath, or zoning. Each fails its own way, and the name tells you what to watch.',
          'A scaffold gets its release date when it is built. "Two more weeks, to be safe" is the failure starting, not caution.',
          'A shell binds only if the seam fails closed. A contract you can drift past is a wiki page.',
          'Pitch every review at the layer whose clock matches the failure; read the rate off the evidence before you book the meeting.',
          'Promote a practice one rung at a time, ratified at each, never by fiat from below. Promote only when drift would cost more than the gate.',
        ]}
      />

      <Coda
        line="A hybrid holds when each region keeps one coherent column and the seam fails closed. The stack says when each piece may change; the spectrum says how it coordinates."
        next="The commons: the shared substrates every loop writes into, and the eight rules that keep shared things alive."
      />
    </Chapter>
  );
}
