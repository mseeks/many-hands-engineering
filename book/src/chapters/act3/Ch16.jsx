// Ch 16 — The staged transition. Covers §3.4, with §4.2 (harness
// engineering) seeded as the Stage 0 literature. Bet register, deliberately:
// the Staging Board is a captioned recorded run of the author's bet, with
// the model dissent on the board, and the froot before/after table as the
// N=1 answer key.

import {
  Badge,
  Chapter,
  Coda,
  DecisionCard,
  Drill,
  FieldSpecimen,
  Lede,
  Pull,
} from '../../components/kit.jsx';
import StagingBoard from '../../labs/StagingBoard.jsx';
import { CASES } from '../../engine/cases.js';

// Retrieval: sp-05 and sp-03 reach back to Ch 10 (activity that is not
// progress, the staging failure's cousins); pl-02 to Ch 5 (the surface a
// Stage 1 loop gets picked from).
const RETRIEVAL = ['sp-05', 'sp-03', 'pl-02'].map((id) => CASES.find((c) => c.id === id));

// §3.4's staging table, verbatim.
const STAGES = [
  {
    stage: '0. Legible terrain',
    move: 'Instrument the environment for non-human readers and writers before any agent does meaningful work',
    creates: 'Structured metadata, signal schemas, standardized tool interfaces',
  },
  {
    stage: '1. Close one loop',
    move: 'Pick one small, reversible loop and make it work end-to-end',
    creates: 'A working template',
  },
  {
    stage: '2. Replicate',
    move: 'Build more loops of the same shape. Resist broadening any one',
    creates: 'Platform capacity',
  },
  {
    stage: '3. Coordinate',
    move: 'Let loops interact through signals in the terrain',
    creates: 'Cross-loop coordination and guardrails',
  },
  {
    stage: '4. Plan',
    move: 'Introduce planners and routers that read the full signal field',
    creates: 'Higher-order agents',
  },
  {
    stage: '5. Earn the approval',
    move: 'Class by class, move specific agent-task pairs from propose to auto-apply with sampling review. An agent earns the thumbs-up on a narrow class by building a track record (§3.6)',
    creates: 'Per-agent, per-class autonomy',
  },
  {
    stage: '6. De-automate gracefully',
    move: 'Maintain the ability to revoke an earned approval when a failure mode outgrows it',
    creates: 'Durable reversibility',
  },
];

// The same loop at two real maturity levels: the hand-fired script froot
// replaced, and froot itself, slot by slot.
const FROOT_ROWS = [
  {
    ing: 'Signal',
    before: 'computed inside the script, at run time; fired by whoever remembered to run it',
    after: 'a durable schedule watches the dependency graph; the trigger lives in the terrain',
  },
  {
    ing: 'Bounded action',
    before: 'one sweep over every repo in one sitting, whatever it found',
    after: 'one bump per PR, per repo, per task class',
  },
  {
    ing: 'Verification',
    before: 'the human read the diff — or did not',
    after: "the target repo's CI, plus a local judge model, both outside the loop",
  },
  {
    ing: 'Reversibility',
    before: 'moot: nothing landed without a human doing the landing',
    after: 'close-on-red — close, comment, delete branch — with git revert behind every merge',
  },
  {
    ing: 'Signal update',
    before: 'results printed to stdout and forgotten',
    after: 'every outcome lands on an environment-stamped trust ledger, per class',
  },
  {
    ing: 'Authority surface',
    before: 'propose-only forever, with no written path to anything else',
    after:
      'a shadow gate writes its would-be decision on every PR; the acting gate ships behind an allowlist',
  },
];

export default function Ch16() {
  return (
    <Chapter n={16} covers="§3.4 (+§4.2)">
      <Lede>
        Teams that jump straight from traditional engineering to autonomous agents almost always
        stumble — and the stumble is rarely in the agents. It's in the terrain they were dropped
        into.
      </Lede>

      <p>
        After two chapters of anatomy and catalog, the obvious move is to go build six loops by
        Friday. This chapter is the handbook's argument for not doing that, and it is the book's
        most honest chapter about its own epistemics: the staging order is a principled proposal,
        not a measured law, and you will see both the proposal and the parameterization where it
        loses. The transition that works proceeds in stages, each making the next possible. Here is
        the whole table; the rest of the chapter is what it costs to disrespect it.
      </p>

      <span className="mh-kicker">
        The staged transition · §3.4, verbatim{' '}
        <Badge
          layer="W"
          note="a principled proposal — §4.5 lists staging among the open questions"
        />
      </span>
      <table className="mh-table">
        <thead>
          <tr>
            <th scope="col">Stage</th>
            <th scope="col">Move</th>
            <th scope="col">What it creates</th>
          </tr>
        </thead>
        <tbody>
          {STAGES.map((s) => (
            <tr key={s.stage}>
              <td style={{ whiteSpace: 'nowrap' }}>
                <strong>{s.stage}</strong>
              </td>
              <td>{s.move}</td>
              <td>{s.creates}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        Not a strict sequence — stages overlap, and different regions of a platform can sit at
        different stages. But the order is real. You can't skip Stage 0. You can't run Stage 4
        before Stage 3, because a planner needs a signal field to read. You can't responsibly run
        Stage 5 without Stages 2 and 3 being durable, because an approval earned on a thin record is
        Chapter 18's problem wearing a head start. The stage most often skipped is Stage 0, and
        skipping it produces a specific, recognizable condition: smart agents acting on dumb
        terrain. High activity, low signal, no compounding.
      </p>

      <p>
        Stage 0 has a literature now, and it deserves the cross-reference. Through early 2026 a body
        of practice converged under the name <strong>harness engineering</strong>{' '}
        <Badge
          layer="E"
          note="a dated public chronology, Feb–Apr 2026: Hashimoto, OpenAI, Böckeler/Thoughtworks, Stripe, HumanLayer, Anthropic"
        />
        : Mitchell Hashimoto's originating definition ("anytime you find an agent makes a mistake,
        you take the time to engineer a solution such that the agent never makes that mistake
        again"), OpenAI's account of shipping roughly a million lines with no human-typed source,
        Böckeler's framework of guides, sensors, and harness templates. OpenAI's summary — designing
        environments, feedback loops, and control systems — could be the spine of this framework.
        The relationship is one of scope: harness engineering is the per-agent execution
        environment; Many Hands sits one level up, where harnessed agents share a commons.{' '}
        <em>A harness is a critical layer of terrain — the per-agent layer</em>, and where harness
        engineering is more developed, this framework defers to it. If your team is at Stage 0, that
        body of work is essential reading; architectural constraints as linters, knowledge stored in
        the repository rather than in conversation, garbage-collection loops against entropy — that
        is what "instrument the environment" means in practice.
      </p>

      <p>
        The second discipline the table enforces is at Stage 2, and it guards against the most
        seductive mistake in the sequence: broadening Stage 1 before replicating it. The first loop
        works, so every planning meeting proposes deepening it — more change classes, richer
        actions, smarter triage inside the one machine that has a record. The handbook's counter is
        blunt:
      </p>

      <Pull badge="W">
        A dozen simple loops compounding beats one sophisticated loop burning attention.
      </Pull>

      <p>
        The dependency-patch loop walks the whole staircase naturally, and it is worth one pass in
        miniature. Stage 0: the repo exposes dependency metadata, changelogs, and CI status as
        structured signals. Stage 1: one agent, one loop, human review on every PR. Stage 2: three
        or four similar loops around docs, flaky tests, dead code. Stage 3: the loops start reading
        each other's signals — patch decisions consider flakiness history. Stage 4: a triage agent
        decides which kinds of patches to tackle first. Stage 5: the patch agent earns auto-merge on
        clean patch-level bumps. Stage 6: when the model underneath changes, or the repo
        restructures, the earned autonomy is revoked until it's re-earned. Now the board. Four
        recorded runs of one engine on one seed: the bet run straight, the two ways teams break the
        order, and the parameterization where the bet fails. Watch the cost panel on run 1 as the
        template replicates, flip run 2 between activity and verified yield (the gauges agreeing is
        the ghost), and on run 3 watch the crossing week. The label lands at the moment of
        punishment, where it belongs — not three chapters later.
      </p>

      <StagingBoard />

      <p>
        That was the model. Here is the one piece of field evidence this book can offer, with its
        sample size on its sleeve. The workspace this framework grew up in holds the same loop at
        two real maturity levels: a hand-fired local script — Chapter 14's loop on a leash, more or
        less — and froot, the durable rebuild that replaced it. Read the table as a Stage
        0-through-6 answer key: every row is one ingredient crossing from absent or human-powered to
        terrain.
      </p>

      <FieldSpecimen source="froot · dependency-patch loop, before and after · 2026">
        <table className="mh-table" style={{ margin: '10px 0 0' }}>
          <thead>
            <tr>
              <th scope="col">Ingredient</th>
              <th scope="col">The hand-fired script</th>
              <th scope="col">froot, the rebuild</th>
            </tr>
          </thead>
          <tbody>
            {FROOT_ROWS.map((r) => (
              <tr key={r.ing}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <strong>{r.ing}</strong>
                </td>
                <td>{r.before}</td>
                <td>{r.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ margin: '10px 0 0', fontSize: '13.5px' }}>
          One honesty wart, kept on purpose: froot's docs said "froot does not merge; a human
          approves" — written before the acting gate shipped, and true today only because the
          allowlist is empty. A stale doc as a live bug, in the very system this book describes.
          Stage 6 is listed last in the table, but the discipline it names — keeping your claims
          about autonomy current with your autonomy — starts the day the shadow gate does.
        </p>
      </FieldSpecimen>

      <p>
        What the answer key argues is narrow but real: the staircase is walkable, slot by slot, by a
        small fleet on small repos. What it cannot argue is the curve — how much compounding the
        order buys at your scale, which is exactly what the dissent board refused to promise. Carry
        both: the order as discipline, the curve as bet.
      </p>

      <Drill cases={RETRIEVAL} title="Retrieval · activity, progress, and where loops start" />

      <DecisionCard
        title="Before you stage (or restage) the transition"
        items={[
          'Instrument before you automate. Stage 0 is the only stage you cannot skip, and the harness-engineering corpus is its manual.',
          'Close one small, reversible loop end-to-end before anything clever. The first loop is a template, not a product.',
          'Replicate the shape before deepening any instance — the dozen-simple-loops bet.',
          'Let coordination arrive as signals in the terrain (Stage 3) before any planner reads the field (Stage 4).',
          'Move propose to auto-apply per class, on track record, with sampling — Chapter 18 has the arithmetic.',
          'Keep revocation cheap and rehearsed. Stage 6 is a capability, not an apology.',
          'If your shop matches the dissent board — small N, strong conventions, signals everyone already reads — say so out loud. The bet is weakest exactly there.',
        ]}
      />

      <Coda
        line="You can't skip Stage 0: smart agents on dumb terrain produce activity, not compounding — and the activity gauges will not warn you."
        next="Chapter 17 turns to the human the staircase keeps invoking: what the steward role actually is, and what it does to the person holding it."
      />
    </Chapter>
  );
}
