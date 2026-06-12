// Ch10.jsx — "Spec rot" (Act II · covers §2.9, the planned death spiral and
// hybrid failures). The Spec Gap lab with the withheld-information mechanic;
// Denver / NPfIT / Healthcare.gov as ● evidence cards; the honest test as the
// chapter's pull; the hybrid-detector drill (four systems classified by their
// decision logs); a retrieval rail reaching back to Ch 5.

import {
  Badge,
  Chapter,
  Coda,
  DecisionCard,
  Drill,
  Lede,
  Mark,
  Pull,
} from '../../components/kit.jsx';
import SpecGapLab from '../../labs/SpecGapLab.jsx';
import { CASES } from '../../engine/cases.js';

const byId = (...ids) => ids.map((id) => CASES.find((c) => c.id === id));
const RETRIEVAL = byId('sp-08', 'sp-03', 'pl-01');

// The hybrid detector: four systems described by their claims, classified by
// their actual decision logs. Chapter-local cases in the bank's shape; the
// feedback argues the honest test, never a verdict.
const MODE_OPTIONS = [
  { id: 'planned-planned', label: 'Planned, in form and in substance' },
  { id: 'emergent-emergent', label: 'Emergent, in form and in substance' },
  { id: 'hybrid-pe', label: 'Hybrid: planned form, emergent substance' },
  { id: 'hybrid-ep', label: 'Hybrid: emergent form, planned substance' },
];

const HYBRID_DETECTOR = [
  {
    id: 'hd-01',
    kind: 'spiral',
    surface: 'Integration platform: 40 services, contract docs and mandatory design review on all.',
    prompt: 'Classify the system by its decision log, not its claim.',
    evidence: [
      {
        label: 'The claim',
        text: 'Interfaces are designed in review before implementation; the contract documents are the source of truth.',
      },
      {
        label: 'The decision log',
        text: 'In the last 20 interface changes, 17 contract docs were edited after the implementing PR merged, to match it. Design review has requested changes twice in two years.',
      },
      {
        label: 'The seam',
        text: 'Integration disputes get settled in PR comments between the two teams involved; the contract doc learns about the outcome later, if ever.',
      },
    ],
    options: MODE_OPTIONS,
    answer: 'hybrid-pe',
    feedback: {
      'hybrid-pe':
        'Planned in form (contracts, mandatory review), emergent in substance (interfaces negotiated in PR threads, docs trailing the merged code). It inherits both sets of weaknesses: the emergent decisions run without counter-force, because everyone believes the contract layer is holding, and the planned ritual still bills its full cost in review hours and false assurance.',
      'planned-planned':
        'The form is planned; the log is the test. Seventeen of twenty contract docs edited after the merge they describe, and a review that has changed two outcomes in two years: the decisions happen in PR threads. A planned system shows the opposite order, spec first, work after.',
      'emergent-emergent':
        'The substance is emergent, but the form is not, and the form is doing damage: a contract layer everyone believes in is a counter-force that does not exist. Honest emergent work at least knows it has no spec. This system pays for one and does not have it.',
      'hybrid-ep':
        'Inverted. That diagnosis needs informal norms with planned rigidity. Here the formal layer is the soft one (docs trail reality) and the informal layer is where decisions move. Planned form, emergent substance.',
    },
    fromChapter: 10,
  },
  {
    id: 'hd-02',
    kind: 'spiral',
    surface: 'Internal tools team: no written process, a four-line README, "we just ship."',
    prompt: 'Classify the system by its decision log, not its claim.',
    evidence: [
      {
        label: 'The claim',
        text: 'Fully emergent, by self-description: no spec, no review board, anyone can change anything.',
      },
      {
        label: 'The decision log',
        text: 'Of the last 15 attempts to restructure the deploy pipeline, 15 were reverted or abandoned, each citing custom: "this isn\'t how we do it." No document says how they do it.',
      },
      {
        label: 'The seam',
        text: 'Two long-tenured engineers arbitrate what matches custom, from memory; their objections are final and unwritten.',
      },
    ],
    options: MODE_OPTIONS,
    answer: 'hybrid-ep',
    feedback: {
      'hybrid-ep':
        "Emergent in form (no spec anywhere), planned in substance: an unwritten specification, enforced absolutely, revised never. The handbook's second hybrid, informal norms ossified into uneditable custom. It has planned work's rigidity with none of its legibility: the spec cannot be read, tested, or revised, only violated.",
      'emergent-emergent':
        'Emergent substance lets variation survive. Fifteen restructure attempts, fifteen reversions, all citing custom: that is a spec with perfect enforcement. Writing it in two memories instead of a document makes it harder to revise than a real spec, not freer.',
      'planned-planned':
        'The substance is planned, in the worst way, but the form is missing everything planned work uses to stay sane: no document, no review structure, no revision path. The danger is exactly the mismatch; a real planned system could at least update its spec.',
      'hybrid-pe':
        'Backwards. Planned-form hybrids dress emergent decisions in ceremony; this one dresses a frozen rule set in no-process clothing. Form emergent, substance planned.',
    },
    fromChapter: 10,
  },
  {
    id: 'hd-03',
    kind: 'spiral',
    surface: 'Billing core: spec-first by policy, executable contract tests gate every merge.',
    prompt: 'Classify the system by its decision log, not its claim.',
    evidence: [
      {
        label: 'The claim',
        text: 'Planned: changes start as a spec revision, and contract tests gate every merge.',
      },
      {
        label: 'The decision log',
        text: 'Last quarter: 31 spec revisions merged, 9 of them ahead of any implementation; 6 merges blocked by contract tests and reworked; 2 escalations resolved by changing the spec rather than the code.',
      },
      {
        label: 'The seam',
        text: 'When a payment provider edge case contradicted the spec, the spec and its tests changed within the week.',
      },
    ],
    options: MODE_OPTIONS,
    answer: 'planned-planned',
    feedback: {
      'planned-planned':
        'Form and substance agree. Decisions are made in the spec, the spec is executable, and it updates faster than reality drifts: a week per edge case. This is the planned mode actually running: the gate blocks things, and losing an argument with reality changes the spec, not just the code.',
      'hybrid-pe':
        'Run the honest test before assigning theatre: six blocked merges, nine spec revisions ahead of implementation, escalations that changed the spec. This ceremony has teeth and a revision path. A control that says no, and updates when it is wrong, is not theatre.',
      'emergent-emergent':
        "Continuous integration can read as emergent, but the decisions live in a central, versioned spec that work must match. Continuous verification of a planned spec is still planned; the spectrum's properties co-vary, they do not flip on one feature.",
      'hybrid-ep':
        'That reading needs unwritten rules with hard enforcement. These rules are written, executable, and revised on contact with reality. The enforcement is hard because the spec is real, not because custom is.',
    },
    fromChapter: 10,
  },
  {
    id: 'hd-04',
    kind: 'spiral',
    surface: 'Docs platform: loops fork freely; conventions are ratified after they win.',
    prompt: 'Classify the system by its decision log, not its claim.',
    evidence: [
      {
        label: 'The claim',
        text: 'Emergent: doc loops fork freely, and conventions are ratified once they prove out, not designed up front.',
      },
      {
        label: 'The decision log',
        text: 'Three competing summary formats ran for six weeks; the one with the best freshness numbers was ratified into CI lint, and the other two died of decay. Last month a ratified convention was demoted when adoption stalled.',
      },
      {
        label: 'The seam',
        text: 'The ratified rules are few, written, and enforced by the terrain; everything else stays open to variation.',
      },
    ],
    options: MODE_OPTIONS,
    answer: 'emergent-emergent',
    feedback: {
      'emergent-emergent':
        'Form and substance agree. Decisions are made by variation, signal, and survival, and the small planned core (the ratified lint rules) sits downstream of what already won. Ratification after convergence is the emergent mode governing itself, the same up-then-down flow Chapter 6 had you perform: signals up, authority down.',
      'hybrid-pe':
        'Theatre needs a claimed control that decides nothing. The lint rules here decide plenty; they were written after the evidence instead of before it. Check the order of operations in the log: for this mode, that order is the healthy one.',
      'planned-planned':
        'The written rules are real, but read where they come from: ratified out of winning practice, demoted when adoption stalls. A planned system decides first and verifies after; this one verifies first and codifies after.',
      'hybrid-ep':
        'Ossified custom is unwritten and unrevisable. These conventions are written, enforced by CI, and demoted on evidence. A custom that can lose its job is not ossified.',
    },
    fromChapter: 10,
  },
];

export default function Ch10() {
  return (
    <Chapter n={10} covers="§2.9">
      <Lede>
        The board has been green for fifteen straight weeks, and the one integration of the project
        is on the calendar for week sixteen. The other death spiral is the one you schedule.
      </Lede>

      <p>
        The terms of the bench below: a 24-assertion spec. Reality drifting underneath it at roughly
        three assertions a week. A spec team funded to revise one a week. A team building at full
        speed against whatever the spec still claims, and nothing integrating until week 16. Chapter
        9's family built itself out of reinforcement, loudly; this family is quiet, because a
        specification losing contact with reality faster than it can be updated{' '}
        <Badge
          layer="W"
          note="§2.9 — the planned death spiral: spec-update-rate below reality-change-rate"
        />{' '}
        makes no noise at all until something integrates. The board you are about to read draws only
        what has surfaced. That is not a rendering shortcut; it is the failure's actual mechanism,
        and it means the most important number of the run is one this board cannot draw. Step the
        weeks, commit a prediction at week 15, then run the integration and watch the y-axis.
        Afterward, try the knob every status meeting reaches for first.
      </p>

      <SpecGapLab />

      <p>
        The cliff you just took is the most documented failure shape in software. The handbook names
        three, and they are worth holding as cards because every one was visible from inside as a
        green board right up to integration. Different decades, different domains, one pattern:
        requirements changed during development, the spec could not keep up, implementation
        proceeded against a spec that was increasingly wrong, and integration at the end revealed
        the gap, catastrophically.
      </p>

      <div className="mh-cardgrid">
        <div className="mh-card">
          <span className="mh-kicker">
            <Mark kind="real" note="documented-real: the public failure record" /> Denver airport
            baggage · 1995{' '}
            <Badge
              layer="E"
              note="evidence-backed: among the most studied software project failures on record"
            />
          </span>
          <p style={{ margin: 0 }}>
            An automated system meant to route every bag in a new airport, specified while the
            airport itself kept changing around it. The gap surfaced only when the whole thing ran
            together: carts mangled luggage in demonstrations, the airport opened sixteen months
            late, and the system was eventually abandoned outright.
          </p>
        </div>
        <div className="mh-card">
          <span className="mh-kicker">
            <Mark kind="real" note="documented-real: the public failure record" /> NHS NPfIT ·
            2002–2011{' '}
            <Badge
              layer="E"
              note="evidence-backed: routinely cited as the largest civil IT failure"
            />
          </span>
          <p style={{ margin: 0 }}>
            A national patient-record system specified centrally for thousands of trusts whose needs
            kept moving. Exceptions outran the plan's capacity to absorb them for nine years; the
            program was dismantled in 2011 after spending on the order of ten billion pounds, with
            its core goal unmet.
          </p>
        </div>
        <div className="mh-card">
          <span className="mh-kicker">
            <Mark kind="real" note="documented-real: the public failure record" /> Healthcare.gov ·
            2013{' '}
            <Badge
              layer="E"
              note="evidence-backed: documented in congressional testimony and the postmortem record"
            />
          </span>
          <p style={{ margin: 0 }}>
            Dozens of contractors building to a spec that shifted with policy, integrated for the
            first time on the eve of launch. On day one, out of millions of visitors, a handful of
            people nationwide managed to enroll. The rescue that followed was structural: continuous
            integration and short feedback cycles, not more effort.
          </p>
        </div>
      </div>

      <p>
        None of those programs had an agent anywhere in them, which is the point: this spiral
        belongs to the planned mode itself. In many-hands systems it looks structurally identical{' '}
        <Badge layer="W" note="§2.9 — the planned spiral's many-hands forms" />. A central
        orchestrator plans fully before executing in a domain where full planning is impossible. A
        top-level coordinator becomes the bottleneck for every decision. A spec-first workflow locks
        in an interface that turns out wrong. A single reviewer becomes the bus-factor-of-one. And
        the warning signs translate directly: the backlog of exceptions grows faster than the plan
        can absorb them. WIP accumulates because no piece integrates until the whole is ready. A few
        humans become permanent bottlenecks. Outputs are superficially correct but fail only in
        composition. The specification becomes ceremony.
      </p>

      <p>
        You already know the remedy family's defining property, because you dragged the
        worker-effort slider to five and the cliff readout did not move. Heroics move work that can
        be seen; this failure never was. Every remedy is structural: shorten the integration cycle.
        Decentralize what doesn't need central authority. Turn the spec from document into
        executable contract, fewer words, more tests. Distribute approval by domain. Run 2 was those
        moves made literal, and the same drift stream that built a cliff surfaced as small, redoable
        pieces, or never went stale at all once the revision budget beat the drift rate. One
        inequality opens the spiral; closing it from either side ends it.
      </p>

      <p>
        That leaves the failures that wear both modes at once, and the handbook is blunt about them:
        the most dangerous failures are hybrids. They have the form of one mode and the substance of
        the other. A heavily-specified system whose specs are never enforced is planned in form,
        emergent in substance, and inherits the weaknesses of both. A lightly-specified system whose
        informal norms have ossified into uneditable custom is the opposite. You have met these
        under their street names: governance theatre, ivory-tower architecture, the inner-platform
        effect. All hybrids, and all invisible to any dashboard that asks the system what mode it is
        in.
      </p>

      <Pull badge="W">
        The honest test is not what mode the system claims, but what mode its actual decisions are
        made in.
      </Pull>

      <p>
        So run the test. Four systems below describe themselves; their decision logs disagree with
        two of them. Classify each by where its decisions actually got made.
      </p>

      <Drill title="The hybrid detector" cases={HYBRID_DETECTOR} />

      <p>
        Three more calls to close the chapter: two backlogs that will not drain, read for family and
        for age, and a reach back to Chapter 5, where the axes, not the fear, make the call.
      </p>

      <Drill title="Retrieval" cases={RETRIEVAL} />

      <DecisionCard
        title="Before the spec rots"
        items={[
          "Compare two rates: how fast reality invalidates the spec's assertions, and how fast the spec absorbs revisions. The spiral condition is the first outrunning the second.",
          'Shorten the integration cycle until staleness surfaces while it is small; detection latency is the multiplier on every stale assertion.',
          'Turn prose specs into executable contracts: fewer words, more tests, so a stale assertion fails a build instead of a launch.',
          'Decentralize what never needed central authority, and distribute approval by domain before any human becomes the bottleneck.',
          'Ignore the effort knob: the spiral is insensitive to heroes, and every remedy that works edits structure.',
          'Run the honest test on any system that claims a mode: read its last ten real decisions and note where each was actually made.',
        ]}
      />

      <Coda
        line="The planned spiral is one inequality, the spec updating slower than reality changes, and every remedy that works is structural."
        next="Chapter 11 takes up the immune system: four classes of guardrail, each answering its own question, graded against what they actually catch."
      />
    </Chapter>
  );
}
