// Ch 3 — Nobody is calling anyone. The conceptual-change chapter (DESIGN §5):
// the zod field specimen as anchor, the trace-the-cause probe, the N-vs-N²
// arithmetic stated plainly (Ⓔ), and the terrain law named as the book's
// standing answer. Covers §2.8's coordination topology and seeds §3.3.

import {
  Badge,
  Chapter,
  Coda,
  DecisionCard,
  FieldSpecimen,
  Lede,
  Pull,
} from '../../components/kit.jsx';
import TraceTheCause from '../../labs/TraceTheCause.jsx';

const ZOD_SPECIMEN = `merged      deps: bump zod (patch, lockfile only)        dependency-patch
+3 days     remove zod entirely — zero imports remain    dead-code

calls, messages, or shared config between the two loops: none.
the repo state is the bus.`;

export default function Ch03() {
  return (
    <Chapter n={3} covers="§2.8 · §3.3">
      <Lede>
        Five loops are about to coordinate in front of you. The chapter title has already told you
        what you will find when you go looking for the one in charge; you will go looking anyway,
        because the reflex is the lesson.
      </Lede>

      <p>
        Start with the real event this chapter is built around. In one small fleet, the
        dependency-patch loop merged a routine zod bump. Three days later a different loop proposed
        deleting zod from the repository entirely; a quarter-old parser rewrite had orphaned the
        package, and the bump had freshened the very state that made the orphaning visible.
      </p>

      <FieldSpecimen source="froot · dep-patch → dead-code · 2026">
        <pre>{ZOD_SPECIMEN}</pre>
      </FieldSpecimen>

      <p>
        Read as a sequence, it looks planned: patch a package on Monday, discover it is dead, delete
        it by Thursday. If a teammate did that you would assume intent, and you would be right.
        Here, neither loop could have intended it. dependency-patch knows nothing about import
        graphs; dead-code reads no changelogs. So something sequenced two loops that have never
        heard of each other, and your job in the probe below is to point at it. Commit to a suspect
        first. Then trace any outcome backward, one hop at a time, and watch what every hop is made
        of.
      </p>

      <TraceTheCause />

      <p>
        Eight hops from the merge to the root, and every one of them wore the same two labels.
        Whichever suspect you committed to, the history had the same answer waiting. triage, the
        closest thing to a coordinator on stage, read three signals, wrote one ranking, and stopped;
        eight of the ten events were already on the board before it acted. The steward appears once,
        on day 9, working a queue the terrain had already ordered. And the chain bottoms out in{' '}
        <code>signals/deps.outdated</code>, written by the nightly registry sync, which is no loop
        at all. The CALL counter stayed at zero, and not because the lab hides calls from you: this
        history has no channel a call could travel. That absence is the finding. The prior you just
        tested has a name, <em>someone must be driving</em>, and experienced engineers hold it
        hardest, because emergent process is the category experts misclassify most stubbornly{' '}
        <Badge
          layer="E"
          note="Chi 2005: emergent processes are the single category experienced learners get most persistently wrong, and the error reverts under load"
        />
        . Knowing the answer does not dissolve the reflex. At 2 a.m., when work clusters somewhere
        surprising, your hand will reach for the org chart again. The trace is how you check it.
      </p>

      <p>
        This book will not build an orchestrator just to knock it down, because the case against one
        is arithmetic, not ideology. Direct messaging among N agents requires on the order of N²
        channels; coordination through a shared environment requires N{' '}
        <Badge
          layer="E"
          note="§2.8, coordination cost is topological — combinatorial, not ideological"
        />
        . With the five loops you just traced, that is ten pairwise channels against five reads and
        writes of the terrain. At fifty loops it is 1,225 channels against fifty. Every one of those
        channels is a contract to version, a failure mode to retry, a thing that pages you, which is
        why tightly coupled service meshes degrade above a few tens of services while shared-state
        coordination keeps scaling. The zod sequence cost zero channels. The merge wrote main; the
        scan read main; the proposal followed. The repo state is the bus.
      </p>

      <Pull badge="W">
        No loop calls another. Each reads the terrain and writes to it. The coordination is in the
        environment, not in any orchestrator.
      </Pull>

      <p>
        That line is the handbook's (§3.3), and chapter 15 builds on its other half: loops that read
        each other's signals are where compounding lives. For now, take the version of it this book
        enforces on itself, the terrain law. You will keep reaching for the agent lever, so this
        book does not have one, on purpose. Every control you will touch from here to the last page
        is terrain: signals, decay rates, budgets, gates, boundaries, schedules. Exactly once, in
        chapter 9, a button will offer to restart an agent for you, and you will get to watch what
        that buys. When a system like this breaks, the reflex says patch the agent. The book's
        standing answer, starting now: the problem is in the terrain, not in any individual agent.
      </p>

      <DecisionCard
        title="Before you go hunting for the orchestrator"
        items={[
          'Trace the outcome backward through artifacts, hop by hop, and label every hop a read or a write. A call would have to show up as neither.',
          'Find the root. If the chain ends in a signal no loop wrote, the terrain decided, and there is no agent to patch.',
          'Count the channels your explanation needs. N loops through shared state cost N; any story built on pairwise calls is bidding for N².',
          'Name the reflex while it happens: "someone must be driving" reverts under load, so re-run the trace every time, especially when you already know the answer.',
        ]}
      />

      <Coda
        line="When work clusters, look for the signal that gathered it, not the agent that ordered it."
        next="Act II opens with the spectrum: ten properties that move together when a decision slides between planned and emergent."
      />
    </Chapter>
  );
}
