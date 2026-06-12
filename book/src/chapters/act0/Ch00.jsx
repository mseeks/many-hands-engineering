// Ch00 — How to read this bench.
// Covers the handbook's front matter: "About the author", "A note on AI
// assistance", "A note on the name and the claim", "How to read this", and
// Part I's "What kind of claim is this?". Installs the book's reading
// contract: the two laws, the three claim shelves, the two provenance marks,
// the vocabulary cross-reference, and the standing line about what the
// simulations prove.

import {
  Chapter,
  Lede,
  Pull,
  Badge,
  Mark,
  Term,
  Commit,
  DecisionCard,
  Coda,
} from '../../components/kit.jsx';
import { CHAPTERS, totalMinutes } from '../registry.js';

const SHELVES = [
  { id: 'E', label: 'Ⓔ evidence' },
  { id: 'W', label: 'Ⓦ working principle' },
  { id: 'M', label: 'Ⓜ metaphor' },
];

// The lead sentence of each reveal: agreement acknowledged, never scored.
function authorShelf(picked, shelf) {
  return picked === shelf ? "Your shelf and the author's agree:" : "The author's shelf:";
}

const FAST = CHAPTERS.filter((ch) => ch.fast);
const fastMinutes = FAST.reduce((sum, ch) => sum + ch.minutes, 0);
const hours = Math.floor(totalMinutes / 60);
const mins = totalMinutes % 60;

export default function Ch00() {
  return (
    <Chapter n={0} covers="front matter · the claim layers">
      <Lede>
        You just watched a human stamp a pull request, a small figure against a large terrain.
        Everything ahead exists to make that yes trustworthy, so before anything runs, you get the
        rules it runs under.
      </Lede>

      <p>
        This is the Many Hands Engineering handbook, run. The handbook argues that software is
        increasingly made by many hands, some human, some automated, some carrying judgment, and
        that the engineer's craft has moved from writing the code to shaping the conditions under
        which code gets written. A book can assert that. This one executes it: every figure ahead
        pairs a decision artifact with the simulated consequences of that decision, produced by a
        small tested engine you can read.
      </p>
      <p>
        The author is a senior engineer, twelve years building platforms, a founding engineer on a
        Fortune 50 retailer's generative-AI platform. The handbook is, in his words, "the product of
        working through what changes when most of the code stops being typed by hand." The name is
        his; the ideas are not. They come from distributed systems, complex adaptive systems,
        commons governance, swarm intelligence, cybernetics, and military command doctrine, among
        others, and the provenance is tracked openly (Chapter 23 holds the map). Nor is it a
        definitive guide. It is one engineer's read on where software engineering is moving, and the
        framework he has found most useful for working in that direction. Some of it is
        well-evidenced. Some is working hypothesis. Some is organizing metaphor. This chapter's
        whole job is to keep those three apart in your hands.
      </p>

      <h3 className="mh-h3">The two laws</h3>
      <p>
        <strong>Law I, the terrain law.</strong> No control in this book commands an agent. Every
        knob, slider, toggle, and forkable field is <Term id="terrain">terrain</Term>: signals,
        decay rates, budgets, gates, boundaries, schedules, references. You will meet failures
        ahead, a retry storm, a citation spiral, and your hand will reach for the lever that stops
        the agent responsible. The lever is not here. That is not an interface gap; it is the
        framework's deepest claim, enforced by the medium. One exception exists, in Chapter 9: a
        restart-the-agent button, prominent and real. It exists to fail, and you will see why when
        you press it.
      </p>
      <p>
        <strong>Law II, the glass law.</strong> The box is glass. Every lab carries a flap that
        opens onto the engine source it just ran, the verbatim function, imported from the code
        itself, so the caption is structurally incapable of going stale. Beside it sits a
        model-notes drawer: what the engine simplifies, which constants were tuned and why, and one
        mandatory line, <em>what this cannot show you</em>. Ten lines of tested JavaScript are the
        most honest caption a simulation can have. You are an engineer; you believe code over
        claims. Good. The code is there.
      </p>

      <Pull>What these simulations prove: nothing.</Pull>

      <p>
        That line is this book's standing model note, installed here and repeated in the glass case,
        and it is meant exactly. The engines demonstrate dynamics the framework predicts, with
        constants chosen so the regimes are findable in minutes instead of quarters. A curve you
        watched fall feels like evidence; it is not. It is the author's reasoning made executable
        and inspectable. The evidence lives in the cited record, Ostrom's field studies, the
        postmortem corpus, the human-factors literature, and the badges on every load-bearing claim
        point at it. The moment a figure persuades you is the moment to open the drawer.
      </p>

      <h3 className="mh-h3">Three shelves</h3>
      <p>
        The handbook sorts its own claims into three layers and asks you to treat them differently.{' '}
        <strong>Evidence-backed observations</strong> <Badge layer="E" /> are established by
        empirical research or hard-won industrial experience: Conway's law, the impossibility
        theorems of distributed systems, Ostrom's commons principles, the convergent failure
        patterns in the major postmortems, the human-factors literature on automation. These are
        load-bearing. <strong>Working design principles</strong> <Badge layer="W" /> follow from the
        observations and hold across the cases the author has studied or worked, but have not been
        validated at industry scale for agent-heavy engineering: placement, the staged transition,
        the economics of approval, the five properties of trust. The handbook commits to them
        "because they're the best framing I've found, not because the science is settled."{' '}
        <strong>Organizing metaphors</strong> <Badge layer="M" /> are language that helps think
        clearly without claiming to be literally true. They earn their place by clarifying; they are
        not theorems.
      </p>
      <p>
        Where the handbook doesn't flag a claim, it is usually in the second layer. And it states
        its standing plainly: "The framework is a principled hypothesis, not a proven methodology."
        It expects to be wrong in specific ways and revised when evidence demands. Read every line
        as gospel and you miss the point. Read every line as opinion and you miss it too. The skill
        is knowing which is which, so practice it now, before the first simulation has a chance to
        feel like proof.
      </p>

      <p>
        Sixty seconds. Five sentences, quoted verbatim from the handbook{' '}
        <Mark kind="real" note="the sentences are the handbook's own text, unedited" />. Shelve each
        one, then see the author's sort. The feedback argues; it never grades.
      </p>

      <Commit
        prompt={
          '"Direct messaging among N agents requires N² channels. ' +
          'Shared-environment coordination requires N." — §2.8'
        }
        options={SHELVES}
      >
        {(picked) => (
          <p style={{ margin: 0 }}>
            {authorShelf(picked, 'E')} <Badge layer="E" />. This is counting, not conviction: the
            handbook's own gloss is "combinatorial, not ideological," and the line sits on the same
            shelf as the impossibility theorems. If you shelved it Ⓦ, you likely read the design
            advice riding on it; the advice is Ⓦ, the arithmetic underneath is not. If Ⓜ, note that
            this is the rare sentence here that is literally true.
          </p>
        )}
      </Commit>

      <Commit
        prompt={'"The placement is the decision; the implementation follows from it." — §2.1'}
        options={SHELVES}
      >
        {(picked) => (
          <p style={{ margin: 0 }}>
            {authorShelf(picked, 'W')} <Badge layer="W" />. The handbook files placement, by name,
            under working design principles, committed to as the best framing found, not as settled
            science. An Ⓔ shelf would claim validation at industry scale that doesn't exist yet. An
            Ⓜ shelf undersells it: placement cashes out in three checkable axes you will work with
            in Chapter 5. A bet, then, but a bet with instruments.
          </p>
        )}
      </Commit>

      <Commit
        prompt={
          "\"Stewards aren't supposed to work harder; they're supposed to place the " +
          'gates better." — §3.6'
        }
        options={SHELVES}
      >
        {(picked) => (
          <p style={{ margin: 0 }}>
            {authorShelf(picked, 'W')} <Badge layer="W" />. The economics of approval is on the
            handbook's own working-principles list. Notice the seam inside the sentence, though: the
            queueing arithmetic that makes a saturated approval budget misbehave is{' '}
            <Badge layer="E" />, old and solid. The operational rule built on it, hold the budget
            constant and move the gates, is the bet. Chapter 18 runs both halves so you can see the
            seam.
          </p>
        )}
      </Commit>

      <Commit prompt={'"Entropy is the default. Order requires work." — §2.11'} options={SHELVES}>
        {(picked) => (
          <p style={{ margin: 0 }}>
            {authorShelf(picked, 'M')} <Badge layer="M" />, and it is arguable. The handbook files
            "the four dynamics" under organizing metaphors, yet its entropy section insists this is
            "thermodynamics, applied to software." No repository literally obeys the second law;
            docs, tests, and trust grants just rot as if one did. The metaphor earns its place by
            clarifying, and the decay it predicts is measurable, which makes an Ⓔ shelf a defensible
            reading rather than a miss. The shelf to avoid is the one that treats it as a theorem.
          </p>
        )}
      </Commit>

      <Commit
        prompt={'"Trust on one class doesn\'t transfer to another." — §3.7'}
        options={SHELVES}
      >
        {() => (
          <div>
            <span
              className="mh-kicker"
              style={{ display: 'block', marginBottom: 6, color: 'var(--amber)' }}
            >
              Contested call
            </span>
            <p style={{ margin: 0 }}>
              The handbook files this one twice, whichever shelf you chose. "The five properties of
              trust" sit on its working-principles list <Badge layer="W" />, while "trust must be
              earned, narrow, conditional, revocable, and expiring" appears among the structural
              claims it calls well-supported <Badge layer="E" />. Both are honest: that trust
              shouldn't transfer across classes is backed by the automation and trust literature;
              the specific machinery this book builds from it, per-class ledgers, environment
              stamps, resets without failure, is the author's bet. When a source files a sentence on
              two shelves, say so. This book will, every time.
            </p>
          </div>
        )}
      </Commit>

      <p>
        That is the whole skill, and it returns as the book's last exercise: in Chapter 25 you sort
        the book's own claims against the author's sort, deltas argued. Between here and there,
        every load-bearing claim wears one of these three chips.
      </p>

      <h3 className="mh-h3">Two marks</h3>
      <p>
        Badges grade claims. Marks grade artifacts. <Mark kind="real" /> means documented-real: a
        real PR body, a real close-on-red comment, a real stale-doc bug, dated, sourced, and
        presented verbatim on field-specimen cards. Those cards carry a standing banner: N=1, one
        fleet, ~7 small repos, ~30 PRs, a local judge model, feasibility evidence, not at-scale
        proof. The real corpus comes with warts, and the warts ship too. <Mark kind="made" /> means
        constructed-for-teaching: the composite platform the chapters run on, the seeded traces,
        this chapter's drill. The five sentences you just sorted are <Mark kind="real" />; the drill
        around them is <Mark kind="made" />. Nothing in this book hides which it is.
      </p>

      <h3 className="mh-h3">One vocabulary, cross-referenced</h3>
      <p>
        The framework renames things on purpose, and the handbook is open about where its words
        diverge from the field's. The dotted terms anywhere in this book carry the definition and
        the lineage on hover; here is the crosswalk.
      </p>
      <table className="mh-table">
        <thead>
          <tr>
            <th scope="col">This book</th>
            <th scope="col">The field</th>
            <th scope="col">The relation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <Term id="planned">planned</Term> / <Term id="emergent">emergent</Term>
            </td>
            <td>cathedral / bazaar (Raymond, 1997)</td>
            <td>Same distinction, plainer words.</td>
          </tr>
          <tr>
            <td>
              <Term id="signal">signal</Term>
            </td>
            <td>pheromone, trace (stigmergy; Grassé, 1959)</td>
            <td>Same mechanism, broader frame.</td>
          </tr>
          <tr>
            <td>
              <Term id="terrain">terrain</Term>
            </td>
            <td>harness (Hashimoto, OpenAI, Fowler, et al., 2026)</td>
            <td>
              Not a rename: a harness is the per-agent layer of terrain. Where harness engineering
              is more developed, this framework defers to it (Chapter 23).
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Two more moves the handbook declares. <Term id="boundary">Boundary</Term> is an umbrella for
        the designed edges the literature splits apart, API contracts, review gates, capability
        scopes, trust zones, because in practice they are the same design move. And{' '}
        <Term id="placement">placement</Term> and <Term id="steward">steward</Term> are coined
        outright, "because the concepts are real and the existing words don't quite carry them." One
        name, one vocabulary, one mental model. That's the point.
      </p>

      <h3 className="mh-h3">Many hands wrote this, too</h3>
      <p>
        The handbook carries a note on AI assistance, and it transfers to this book unchanged: "The
        ideas and the framework are mine. I used AI to help write them down, to find prior work that
        grounds and challenges them, and to review the draft. Many hands did the work; the judgment
        stayed mine." The same split holds here. The engines, chapters, and drills were drafted by
        many hands, most of them automated. The judgment, what to claim, which register each figure
        runs in, what to refuse to simulate, stayed human. That split is what the book is about, so
        it belongs in the open here too.
      </p>

      <h3 className="mh-h3">The bill, up front</h3>
      <p>
        The full read is {hours}h {mins}m, declared chapter by chapter in every header. Five acts:
        this one, then the handbook's four parts in order, the argument, the framework, the
        practice, and the glass case, where every badge resolves into its sources. Each part is
        useful on its own, and so is each chapter: every one boots standalone from a hash link,
        every figure is legible before you touch a control, and every chapter ends in a decision
        card built for the night before a real call. Half-read and returned-to is a designed state,
        not a failure mode.
      </p>
      <p>
        Short on time? The fast path is the ⚡ chapters in the rail, about{' '}
        {Math.round(fastMinutes / 60)} hours ({fastMinutes} minutes):
      </p>
      <p className="mono" style={{ fontSize: '13.5px' }}>
        {FAST.map((ch) => `CH ${ch.n}`).join(' → ')}
      </p>
      <p>
        It keeps the spine: the loop run first, the orchestrator you won't find, placement, the
        runaway, the anatomy, the economics, trust, the boundary conditions, and the checkride.
      </p>

      <DecisionCard
        title="Before you read anything else in this book"
        items={[
          "Ask of every load-bearing claim: which shelf? Ⓔ is checkable, Ⓦ is the author's committed bet, Ⓜ is language earning its place by clarifying.",
          'Check the mark on every artifact: ● happened, dated and sourced; ○ was built so you could learn.',
          'The moment a figure persuades you, open its model notes and read "what this cannot show" before you carry the conclusion anywhere. The simulations prove nothing; the citations carry the evidence.',
          "When your hand reaches for the lever that stops an agent, notice the reach. The lever isn't here, on purpose.",
          `Short on time: the ⚡ path is ${fastMinutes} minutes and keeps the spine.`,
        ]}
      />

      <Coda
        line="Before you let any claim bear load, this book's included, ask which shelf it sits on."
        next="Chapter 1 puts a real benchfile on the bench and runs the dependency-patch loop end to end, before anyone argues about loops."
      />
    </Chapter>
  );
}
