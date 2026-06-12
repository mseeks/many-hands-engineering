// Ch 25 · Open questions, the sort, and the coda — the §4.5 open questions as
// unbuilt benches (grayed frames, empty trace panes, one honest line each),
// the Evidence Sort as the epistemic capstone, the one checkable disclosure,
// and the handbook's coda returned. Covers §4.5 and the Coda.

import {
  Badge,
  Chapter,
  Coda,
  DecisionCard,
  FieldSpecimen,
  Lede,
  Pull,
} from '../../components/kit.jsx';
import EvidenceSort from '../../labs/EvidenceSort.jsx';

/* ── §4.5 — six benches this book declines to build ──────────────────── */

const UNBUILT = [
  {
    id: 'thresholds',
    title: 'PHASE THRESHOLDS',
    question:
      'At what loop gain, what fleet size, what decay rate does a real platform cross from stable to runaway?',
    why: 'The mathematics says the thresholds exist; the specific numbers are not established. Any constant seeded here would be the author inventing the answer the question asks for, then letting you find it.',
  },
  {
    id: 'failure-distribution',
    title: 'FAILURE DISTRIBUTION AT SCALE',
    question:
      'What actually goes wrong, how often, when autonomous coding agents run in production across an industry?',
    why: 'Most of the interesting data is proprietary. An engine could draw a distribution; it would be a guess wearing a chart, and you would remember the chart.',
  },
  {
    id: 'staging',
    title: 'SUPERVISED TO AUTONOMOUS',
    question:
      'Does the staged transition hold up: do teams that stage trust outperform teams that move agents to autonomy some other way?',
    why: "The staging in Part III is a principled proposal, not a validated one. An engine here could only replay Chapter 16's bet and call the replay a test.",
  },
  {
    id: 'atrophy',
    title: 'SKILL ATROPHY',
    question:
      'What does a decade of approving instead of writing do to engineering skill, organizational knowledge, and the health of the commons?',
    why: 'Aviation and medicine suggest significant effects; whether they manifest in software, and at what cadence, is unknown. The honest run is years long and its subject is you.',
  },
  {
    id: 'specs',
    title: 'SPECS AND AGENTS',
    question:
      'In a mature workflow, what is the working contract between a specification and the agents that build against it?',
    why: 'The intuitive case is strong; the empirical case is young. The engine would first have to invent the mature workflow it claims to measure.',
  },
  {
    id: 'trust-transfer',
    title: 'TRUST ACROSS UPGRADES',
    question:
      'When the model under a fleet is swapped, what actually happens to earned trust on teams that do not reset?',
    why: 'The theory says trust should not transfer, and Chapter 19 ran the theory. The economics say teams will try anyway; whether they get away with it is an outcome count nobody has published.',
  },
];

function UnbuiltBench({ n, title, question, why }) {
  return (
    <section
      className="mh-labframe"
      role="group"
      aria-label={`Unbuilt bench: ${title}`}
      style={{ borderStyle: 'dashed', background: 'transparent', opacity: 0.85 }}
    >
      <div className="mh-lab-tag">
        <span style={{ color: 'var(--ink-faint)' }}>
          UNBUILT 25·{n} — {title}
        </span>
        <span className="register">no engine</span>
      </div>
      <p className="mh-lab-q">{question}</p>
      <div className="mh-trace" style={{ borderStyle: 'dashed' }}>
        <span className="mh-kicker">Trace · 0 steps</span>
        <p
          className="mono"
          aria-hidden="true"
          style={{
            margin: '14px 0',
            textAlign: 'center',
            color: 'var(--ink-faint)',
            letterSpacing: '0.5em',
          }}
        >
          ···
        </p>
      </div>
      <p style={{ margin: '10px 0 0', fontSize: '14px', color: 'var(--ink-2)' }}>{why}</p>
    </section>
  );
}

export default function Ch25() {
  return (
    <Chapter n={25} covers="§4.5 · Coda">
      <Lede>
        Twenty-five chapters of benches that run. The most honest figures left in the book are six
        that refuse to.
      </Lede>

      <p>
        By now the grammar is reflex: artifact on the left, trace on the right, Step, Run, Reset,
        Fork. So you will notice immediately what is wrong with the six frames below. No controls.
        No steps. A book that simulates what it asserts owes you the complement: conspicuous silence
        where it cannot. §4.5 lists six open questions at the frontier of the field, and each one
        gets the frame a bench would have earned, with one line on why no honest engine can exist
        for it yet. Read the six lines in a row before you read anything else. They are the same
        sentence in six costumes: the constant that would make the engine honest is the thing nobody
        has measured.
      </p>

      {UNBUILT.map((bench, i) => (
        <UnbuiltBench
          key={bench.id}
          n={i + 1}
          title={bench.title}
          question={bench.question}
          why={bench.why}
        />
      ))}

      <p>
        The handbook's ruling on this list: "These aren't flaws in the framework. They're the
        frontier of the field." And its advice is the rare kind that costs the author something: a
        team holding the framework lightly in these areas, treating it as a starting point for its
        own learning, will outperform one treating any recommendation as settled. The spectrum
        applies to the framework itself: its invariants are planned, its specific practices are
        emergent{' '}
        <Badge layer="W" note="§4.5's closing sentence, the framework graded by its own scale" />.
        Which leaves exactly one exercise, the one Part I exists to produce. Not a fact to recall. A
        question to ask reflexively: what layer is this claim at? Including, and especially, about
        this book.
      </p>

      <EvidenceSort />

      <p>
        One disclosure before the coda, placed here because here it is checkable. This book lives in
        a repository beside the handbook source it quotes. Every sentence quoted in the sort you
        just did can be searched for, verbatim, in that source. The glass flaps you opened all book
        long import the engine files raw, so the code shown is the code run; the canonical traces
        are pinned by tests; and the repository is patrolled by loops of the kind this book spent
        ten chapters teaching you to build. The book is built the way it says software should be
        built. It says so exactly once, here, because here the claim has something you can grep.
      </p>

      <FieldSpecimen
        source="this repository · the book you are reading"
        banner="Checkable, not confessional: open the repository, grep any quoted sentence, read the pinned traces."
      >
        <pre>{`many-hands-engineering.typ    # the handbook, canonical source; every quoted sentence lives here
book/src/engine/*.js          # the physics; tests pin every canonical trace
book/src/labs/*.jsx           # glass flaps import these files raw: shown code is run code
on patrol, per the practice this book teaches:
  lab-fidelity                # audits the pinned traces against the engines
  content-accuracy            # audits the prose against the handbook source
  theme-parity                # audits both themes for contrast drift`}</pre>
      </FieldSpecimen>

      <p>
        Now the one idea. Software is built by many hands: some human, some not, some fast, some
        slow, some carrying judgment. The old engineering wisdom still matters; it is no longer
        enough. The craft this book trained is placement: knowing what should be planned and what
        should be allowed to emerge, where reversibility must be preserved, where judgment must stay
        human. Loops are the operating unit. Signals are how they coordinate. Boundaries hold the
        seams, stewards hold the intent. Trust is earned, narrow, conditional, revocable, and
        expiring. Entropy is the default, and deliberate disturbance is how the system stays honest
        about what it depends on. At the end of all of it sits the approval, the considered yes, the
        moment autonomous work becomes real. The handbook closes with an instruction, and it is the
        right one: "Build accordingly. And when the terrain is built well, and the loops are
        running, and the work is worth approving — say so."
      </p>

      <DecisionCard
        title="Where to go next"
        items={[
          'The handbook itself: the Many Hands Engineering PDF, the source this book runs. Two hours, every section this book covered, in the order you now have hooks for.',
          'Ostrom, Governing the Commons (1990): the strongest shelf in the inheritance. Read it for the eight principles working in systems that lasted centuries.',
          "Brand, How Buildings Learn (1994): pace layering from the source; Chapter 6's clock stack is his.",
          "The harness-engineering corpus, Hashimoto through Böckeler (Chapter 23's chronology): the per-agent layer, more developed than this framework in places, and deferred to where it is.",
          'Your own memo: the Monday-morning worksheet from Chapter 22, run against a real repository. The case bank trained the judgment; your repo is where it gets checked.',
        ]}
      />

      <p>
        The book opened with the handbook's one-line summary, the line to take if you take nothing
        else. It has earned its return.
      </p>

      <Pull>
        It used to be building the thing. Now it's building the thing that makes the thing.
      </Pull>

      <Coda
        line="Placement is the craft; the considered yes is the moment the work becomes real."
        next="Your repo. Monday morning."
      />
    </Chapter>
  );
}
