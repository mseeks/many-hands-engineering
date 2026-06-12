// Ch 1 — Hello, Loop. The dep-patch benchfile run end to end before the book
// argues anything (DESIGN §5, Act I). Covers §3.1: the running example, the
// close-on-red fork, and the amnesia bill. The numbers in the prose are the
// engine's own (seed 1): 51 → 31 review minutes, a 106-minute bill.

import { Badge, Chapter, Coda, DecisionCard, Lede, Pull, Term } from '../../components/kit.jsx';
import HelloLoop from '../../labs/HelloLoop.jsx';

export default function Ch01() {
  return (
    <Chapter n={1} covers="§3.1">
      <Lede>
        Fourteen lines of notation claim to patch your dependencies while you sleep. Before this
        book argues a single thing, you are going to run them.
      </Lede>

      <p>
        The bench below holds the book's running example: the dependency-patch{' '}
        <Term id="loop">loop</Term>, the smallest machine this book cares about. No definitions yet.
        Step through the run once, watch what fires before anything acts, and when the fork bar
        opens, take both forks: turn CI red, then delete the three lines that look most like
        bookkeeping. Commit honestly when a prediction is asked of you. The chapter resumes on the
        other side.
      </p>

      <HelloLoop />

      <p>
        Five stages, one closed cycle. Notice what stage 1 did not do: nothing acted. A condition in
        the terrain became true (a patch-level release, a clean changelog), and the loop exists to
        notice exactly that condition and no other. That is what a <Term id="signal">signal</Term>{' '}
        is, and it is why the run starts in the terrain rather than in any agent. The bump itself
        was the least interesting line in the trace. Watch where the decisions sat instead. The
        scope was settled on line 6, one bump per PR, lockfile only, before any agent ran. The
        oracle on line 8 sits outside the loop, so the agent cannot grade its own work. And when you
        forced CI red, the loop closed the PR, quoted the failure, and deleted the branch; no
        partial state survived. That response was not improvised at failure time. Line 9 decided it
        before CI ever ran, so the red cost the terrain one comment. Reversibility is not a recovery
        heroic; it is a line in the artifact, working. Every call in that trace was made by the
        benchfile, and the run only collected what each call cost.
      </p>

      <Pull badge="W">The artifact is the decision; the trace is its bill.</Pull>

      <p>
        The second fork is the one to carry out of this chapter. You deleted <code>update:</code>,
        three lines that did nothing but write outcomes back to a track record, and for one run
        nothing changed. The bump landed, CI gated it, a red still unwound clean. The deletion is
        invisible at the resolution of a single run, which is why this failure ships so easily. The
        bill arrives between runs. Week one, both copies of the loop cost the steward 51 review
        minutes, about thirteen minutes a PR, the going rate for a class nobody has a record on. By
        week ten the intact loop's bill has fallen to 31 minutes, because 35 clean merges and 3
        clean reverts accrued to its classes and priced the next review down. The amnesiac copy pays
        51 minutes every week forever and re-argues the same finding all ten weeks: is a
        lockfile-only diff safe to skim? Ten weeks of that gap is 106 steward minutes, and it
        compounds for as long as you let it run. The handbook's rule, the first one this book will
        hold you to: loops that don't close aren't loops; they're fire-and-forget scripts that
        accumulate debt{' '}
        <Badge layer="W" note="§3.2 — a working design principle; you just ran its price" />.
      </p>

      <p>
        What you ran is the handbook's running example (§3.1), and it already carries every idea
        this book teaches. It has a placement: reversible, legible, loosely coupled, so the decision
        lives at the emergent end of a spectrum you will learn to read in chapter 5. It has a
        boundary: CI as a gate, the human as a higher one. It has a{' '}
        <Term id="steward">steward</Term>, whoever set those thresholds and priced that review. And
        it has trust that is earned per class and revocable, which is why line 14 says{' '}
        <code>propose-only</code> today and will not say it forever. Each of those words gets its
        own chapter. You have now seen all of them in motion, which is the order this book prefers:
        run first, argue after.
      </p>

      <DecisionCard
        title="Before you call a script a loop"
        items={[
          'Walk the five stages on its last run: signal, action, verification, commit or revert, update. Name the artifact each stage read or wrote.',
          'Find the oracle, and check that it sits outside the thing it grades. Work that grades itself is stage 3 missing, not stage 3 done.',
          'Ask what a red costs. If failure leaves partial state behind, you do not have reversibility; you have hope.',
          'Find where outcomes land. If the answer is stdout, week ten will be priced like week one, and the bill compounds quietly between runs.',
        ]}
      />

      <Coda
        line="Closing the loop is what turns activity into a track record; everything else is the same attention, re-paid weekly."
        next="Chapter 2 names what you just felt: the unit of work has shifted, and the one visible act left is the approval."
      />
    </Chapter>
  );
}
