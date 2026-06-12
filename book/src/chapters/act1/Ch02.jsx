// Ch 2 — The turn. Part I of the handbook, argued after the reader has run a
// loop: the eras table (static, the handbook's own), many hands enumerated,
// and the approval replayed in prose against Chapter 1's trace (DESIGN §5).

import { Badge, Chapter, Coda, DecisionCard, Lede, Pull, Term } from '../../components/kit.jsx';

function ErasTable() {
  return (
    <figure style={{ margin: '22px 0' }}>
      <span className="mh-kicker" style={{ display: 'block', marginBottom: 2 }}>
        The unit of work, three shifts · the handbook's table, verbatim
      </span>
      <table className="mh-table">
        <thead>
          <tr>
            <th scope="col">Era</th>
            <th scope="col">Unit of work</th>
            <th scope="col">Engineer's role</th>
            <th scope="col">What mattered</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Lines</td>
            <td>The instruction</td>
            <td>Author</td>
            <td>Writing it well</td>
          </tr>
          <tr>
            <td>Modules</td>
            <td>The component</td>
            <td>Architect</td>
            <td>Arranging them well</td>
          </tr>
          <tr>
            <td>
              <strong>Loops</strong>
            </td>
            <td>The autonomous cycle</td>
            <td>
              <strong>Steward</strong>
            </td>
            <td>Shaping the conditions under which work happens</td>
          </tr>
        </tbody>
      </table>
    </figure>
  );
}

export default function Ch02() {
  return (
    <Chapter n={2} covers="Part I">
      <Lede>
        Last chapter a change merged and you typed nothing. This chapter names what shifted, and why
        the one visible act left to you, the approval, is anything but trivial.
      </Lede>

      <p>
        It used to be building the thing. Now it's building the thing that makes the thing. That is
        the handbook's whole argument in one line, and you have already run its evidence: the
        benchfile did the building while your work was upstream of it, in the scope line, the
        oracle, the thresholds. The unit of work has shifted before, and each shift renamed the
        engineer without retiring the previous skill.
      </p>

      <ErasTable />

      <p>
        The first two rows are careers you have already lived. Read the third row's last cell twice,
        because it is the only one that names no artifact. What the steward tends is the{' '}
        <Term id="terrain">terrain</Term>: the substrate, signals, boundaries, and conditions under
        which autonomous work succeeds or fails. Good terrain compounds. Each piece of work runs
        cleaner, safer, and faster than the last, and the team's attention is freed for the
        decisions that most need it; you watched ten weeks of that in chapter 1, a review bill
        falling from 51 minutes to 31 as a track record accrued. Bad terrain collapses. Many hands
        work furiously and produce nothing that lasts. None of this makes the old engineering wisdom
        obsolete; it makes it incomplete. We still need to know how to write good code. We also need
        what the old tools never quite answered: what should be planned, what can be allowed to
        emerge, what should stay reversible, and where judgment should remain human. The framework
        in this book is built around those four questions.
      </p>

      <p>
        Why "many hands"? Count the hands already inside your codebase: human engineers, AI agents,
        review systems, automated tests, linters, deployment pipelines, on-call rotations, every
        other source of action it holds. It has always been many hands; CI has been voting on your
        merges for years. What changed is that some of those hands now make real decisions on their
        own, and that changes what the system around them has to do. A shop with many skilled hands
        and no system produces noise. A shop with one skilled hand and a rigid system produces only
        what that hand can imagine. The craft is in the system: the conditions that let many hands
        work in parallel without stepping on each other, without losing coherence, and without
        losing the judgment that keeps the work honest.
      </p>

      <Pull badge="W">
        Many hands can build a lot. They can also make a mess. The difference is the system around
        them.
      </Pull>

      <p>
        Now replay the approval you barely noticed. In chapter 1's trace, a PR titled{' '}
        <code>deps: bump tar to 7.4.4</code> sat open at stage 4, and a steward's yes, priced at
        about thirteen minutes in week one, let it become part of main. Look at everything upstream
        of that yes. The placement: someone decided this class of change was reversible and legible
        enough to run emergent, one bump per PR, lockfile only, before any agent existed. The gate:
        the oracle ran outside the loop, and line 14 held the work at propose-only. The failure
        path: a red was already priced at one comment. The record: every prior outcome on the class
        had landed somewhere, which is what let week ten's yes cost under eight minutes instead of
        thirteen. The <em>looks good to me</em> can look trivial. It is not. When the system around
        the hands is built well, the approval is the load-bearing moment, the place where autonomous
        work meets human judgment and becomes real. A framework that doesn't take this moment
        seriously isn't a framework for software in this era; the mechanics of how approval scales,
        how it is earned, budgeted, and how it decays, get chapters of their own (18 and 19).
      </p>

      <p>
        One more thing before the framework proper, because it sets the book's footing. The ideas
        underneath are older than the technology that makes them urgent{' '}
        <Badge
          layer="E"
          note="the lineage is documented field by field; Part IV of the handbook, and chapter 23, trace every borrowing"
        />
        . Common-pool resources are governed without tyranny. Armies delegate under uncertainty.
        Buildings learn, cities zone, and distributed systems prove theorems about what they cannot
        promise. None of this is decoration; these are the substrates the framework sits on, and the
        problems are not new. Only the speed and scale at which we now face them are.
      </p>

      <DecisionCard
        title="Before you call an approval trivial"
        items={[
          'Name the placement upstream of it: who scoped this class of change, and where is that scope written down?',
          'Name the oracle: what verified the work, and does it sit outside the hands that did it?',
          'Name the undo: what does a red cost, and was that path decided before the failure arrived?',
          'Name the record: what track record priced your attention, and where does this yes land so the next one starts knowing it?',
        ]}
      />

      <Coda
        line="The approval is the visible act; the terrain is the work."
        next="Chapter 3: five loops coordinate in front of you, and you go looking for the one that gave the orders."
      />
    </Chapter>
  );
}
