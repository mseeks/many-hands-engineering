// Ch 14 — Anatomy of a loop. Covers §3.2, with §3.1 reprised on Ch 1's trace.
// The five stages re-walked, the six-ingredient table verbatim, the
// Six-Ingredient Bench (LAB 14·A), and the field corpus the bench's deck was
// composited from, as documented-real specimens.

import {
  Badge,
  Chapter,
  Coda,
  DecisionCard,
  Drill,
  FieldSpecimen,
  Lede,
  Pull,
  Term,
  Walkthrough,
} from '../../components/kit.jsx';
import IngredientBench from '../../labs/IngredientBench.jsx';
import { canonicalRun } from '../../engine/scenarios/helloLoop.js';
import { CASES } from '../../engine/cases.js';

// Ch 1's trace, same seed, re-walked with the stage names showing.
const SEED = 1;
const TRACE = canonicalRun(SEED);

// Retrieval: the same check wearing other chapters' clothes. sp-02 reaches
// back to Ch 9 (a severed outside reference); pl-04 to Ch 5 (the eval rubric
// whose placement changes the day it gates merges).
const RETRIEVAL = ['sp-02', 'pl-04'].map((id) => CASES.find((c) => c.id === id));

const STAGES = [
  { name: 'Signal', text: 'A trace in the terrain fires the loop.' },
  { name: 'Action', text: 'An agent does scoped work.' },
  { name: 'Verification', text: 'An outside reference checks the work.' },
  { name: 'Commit or revert', text: 'The result either lands or rolls back.' },
  {
    name: 'Update',
    text: 'The outcome feeds back into the terrain as new signal — decaying over time, biasing the next loop.',
  },
];

// §3.2's table, verbatim. The bench below exists to collect on column three.
const INGREDIENTS = [
  {
    name: 'Signal',
    what: 'A trace in the terrain that fires the loop',
    without: 'Loop never starts, or fires on wrong conditions',
  },
  {
    name: 'Bounded action',
    what: 'Scoped to a specific class of change',
    without: 'Scope creep; blast radius exceeds reasoning',
  },
  {
    name: 'Verification',
    what: 'An outside reference: tests, eval, human judgment',
    without: 'The loop self-approves; drift; Goodhart',
  },
  {
    name: 'Reversibility',
    what: 'A cheap, well-understood undo path',
    without: 'Mistakes ossify; stewards stop trusting the loop',
  },
  {
    name: 'Signal update',
    what: 'Outcome feeds back into the terrain',
    without: "The next loop can't learn from this one",
  },
  {
    name: 'Authority surface',
    what: 'Explicit rules for when autonomy expands or contracts',
    without: 'Trust becomes a single global decision; fragility follows',
  },
];

function SpecimenArtifact({ lines }) {
  return (
    <pre style={{ margin: 0 }}>
      <code>{lines.join('\n')}</code>
    </pre>
  );
}

export default function Ch14() {
  return (
    <Chapter n={14} covers="§3.2 (+§3.1)">
      <Lede>
        A script that runs is not a loop. The difference is six checkable slots, and the empty slot
        predicts the failure — usually weeks before the failure arrives.
      </Lede>

      <p>
        Chapter 1 handed you a machine and let it run: a patch-level{' '}
        <span className="mono">tar</span> bump noticed, opened, verified, merged, and remembered,
        all without anyone watching. You have spent twelve chapters since then on the terrain that
        machine runs in. Now come back to the machine itself, because the same trace you stepped in
        Chapter 1 carries the whole anatomy, and this time the stage names are the point. Step it
        again and watch what each step <em>is</em>, not what it does: a condition in the terrain
        becoming true, scoped work, an outside reference, a cheap landing or a cheap retreat, and an
        outcome that lands somewhere the next run can read.
      </p>

      <Walkthrough trace={TRACE} />

      <p>
        Every <Term id="loop" />, the smallest and the largest, has the same anatomy: five stages
        that close on themselves.
      </p>
      <ol style={{ fontSize: '15px', color: 'var(--ink-2)', paddingLeft: 22 }}>
        {STAGES.map((s) => (
          <li key={s.name} style={{ margin: '4px 0' }}>
            <strong>{s.name}.</strong> {s.text}
          </li>
        ))}
      </ol>
      <p style={{ fontStyle: 'italic', color: 'var(--ink-faint)' }}>
        The <Term id="steward" /> holds veto on the irreversible at stage 4.
      </p>
      <p>
        A loop is healthy when all five stages exist, are bounded in time and scope, and close —
        meaning the outcome, pass or fail, feeds back into the terrain as a signal the next loop can
        read. Loops that don't close aren't loops; they're fire-and-forget scripts that accumulate
        debt. You priced that debt in Chapter 1: the amnesia bill, week one's review cost re-paid
        every week forever. The stages are the run-time view. The build-time view is a parts list,
        and the handbook gives it as a table with a third column that reads like a forecast.
      </p>

      <span className="mh-kicker">
        Every loop needs six ingredients · §3.2, verbatim{' '}
        <Badge
          layer="W"
          note="the handbook's working table; the bench below runs its third column"
        />
      </span>
      <table className="mh-table">
        <thead>
          <tr>
            <th scope="col">Ingredient</th>
            <th scope="col">What it is</th>
            <th scope="col">What happens without it</th>
          </tr>
        </thead>
        <tbody>
          {INGREDIENTS.map((g) => (
            <tr key={g.name}>
              <td>
                <strong>{g.name}</strong>
              </td>
              <td>{g.what}</td>
              <td>{g.without}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pull badge="W">
        A loop missing any of them isn't a loop yet. It's a script looking for a home.
      </Pull>

      <p>
        The dependency-patch loop has all six, and you can read them straight off its benchfile:
        signal, <em>patch available, clean changelog</em>; bounded action,{' '}
        <em>bump version, run tests, open PR</em>; verification, <em>CI suite</em>; reversibility,{' '}
        <em>git revert</em>; signal update,{' '}
        <em>CI result and post-merge rollback feed the track record</em>; authority surface,{' '}
        <em>auto-merge eligibility by task class and track record</em>. So the table's third column
        is six claims about what happens when one of those slots empties. Claims are cheap. The
        bench below is the same machine with every stanza removable: pull one, commit to a row of
        the table, run thirty days, and see whether the column told the truth.
      </p>

      <IngredientBench />

      <p>
        The deck you just diagnosed was composited from a real corpus: a survey of roughly fifty
        agent scripts in one working fleet, each checked against the six slots. The surfaces in the
        deck were renamed and the identifying detail invented; the failure shapes were carried over
        as found. What follows are the originals — six machines from the survey, each missing
        something different, presented the way the survey met them. Read each one with the table
        open. The question is never "is this good work?" (most of it is); the question is which slot
        is empty, and whether anyone running the machine knew.
      </p>

      <FieldSpecimen source="agents survey · derived-table backfill · 2026">
        <SpecimenArtifact
          lines={[
            '$ ./refresh-derived.sh --dry-run',
            '  drift check: 4,112 rows differ (0.9%)',
            '  checksum vs source: MISMATCH — recompute recommended',
            '# run this when the dashboards look off. usually Mondays.',
          ]}
        />
        <p style={{ margin: '10px 0 0' }}>
          <strong>The loop on a leash.</strong> You met this machine half an hour ago, wearing a
          different name: it opened the specimen deck. Everything downstream of firing is loop-grade
          — bounded to one table, checksum verification, idempotent re-run as the undo. But the
          signal is computed <em>inside</em> the script, so nothing fires until a person notices
          drift and remembers the script exists. Stage 1 is human memory. The terrain even published
          the trace (daily checksum deltas); no machine read it. Response time in the record ran
          from one day to six weeks, and that spread is the leash, measured.
        </p>
      </FieldSpecimen>

      <FieldSpecimen source="agents survey · mapper fleet, ~50 scripts · 2026">
        <SpecimenArtifact
          lines={[
            '[mapper:billing] 14 findings · 3 high-confidence',
            '[mapper:billing] wrote report to stdout · exiting 0',
            '# next run, same region: the same 14 findings, re-derived',
          ]}
        />
        <p style={{ margin: '10px 0 0' }}>
          <strong>The amnesiac mapper.</strong> Fifty loop-shaped scripts surveying a codebase, and
          zero shared signals among them: every finding died in a scrollback. Each run started
          blind, re-derived what the last run knew, and reported it to nobody. Stage 5 was missing
          fleet-wide, so no run could compound on any other — fifty workers, none of whom had ever
          met. Chapter 15 rebuilds this exact population on the bench and runs it twice; the only
          line that changes is where the maps go.
        </p>
      </FieldSpecimen>

      <FieldSpecimen source="agents survey · prompt repository · 2026">
        <SpecimenArtifact
          lines={[
            '## KNOWN-CONTEXT (do not remove)',
            '# 2025-11: ignore vendored code under third_party/',
            '# 2026-01: "staging" is the cluster named prod-2',
            '# 2026-02: never propose bumping the pinned protobuf',
          ]}
        />
        <p style={{ margin: '10px 0 0' }}>
          <strong>KNOWN-CONTEXT prompt archaeology.</strong> This loop does update — by hand. Every
          time a run went wrong, a human appended the correction to a block of prompt text, and the
          block grew strata, datable like sediment. Stage 5 exists, but it runs at human cadence, in
          a format no other loop can read, and nothing in it ever decays: the November rule outlived
          the November reason. An update stage performed by a person editing prose is a track record
          kept in a diary. The loop works; it just remembers through an editor.
        </p>
      </FieldSpecimen>

      <FieldSpecimen source="agents survey · simulation harness · 2026">
        <SpecimenArtifact
          lines={[
            'while running:',
            '    state = advance(state, dt)   # feedback every 16ms',
            '    render(state)',
          ]}
        />
        <p style={{ margin: '10px 0 0' }}>
          <strong>The game-tick control loop.</strong> The boundary of the concept, and worth
          staring at: feedback is not closure. This loop has the tightest feedback in the survey —
          state in, state out, sixty times a second — and it is not a loop in this framework's
          sense, because nothing ever lands. No commit, no revert, no outcome accruing anywhere, no
          terrain changed for a next run that never differs from this one. The word "loop" here
          means iteration; the framework's word means a cycle that closes{' '}
          <em>through the terrain</em>. The survey kept this specimen to mark where the definition
          stops.
        </p>
      </FieldSpecimen>

      <FieldSpecimen source="agents survey · nightly eval harness · 2026">
        <SpecimenArtifact
          lines={[
            'nightly-eval: 312 assertions · 296 pass · 16 fail',
            'report.html written.',
            '# no consumer configured. no ticket opened. no gate reads this.',
          ]}
        />
        <p style={{ margin: '10px 0 0' }}>
          <strong>The verification oracle with no loop around it.</strong> The inverse failure.
          Stage 3 was built superbly — three hundred assertions, run nightly, honestly scored — and
          stages 1, 2, 4, and 5 simply do not exist. Nothing fires work toward the oracle, nothing
          commits or reverts on its verdict, and the sixteen failures land in a report nothing
          reads. Where self-approval is a machine without judgment, this is judgment without a
          machine. It was also the cheapest upgrade in the survey: the expensive ingredient already
          existed, waiting for a signal in front of it and an update behind it.
        </p>
      </FieldSpecimen>

      <FieldSpecimen source="fleet incident · mapper run on a clean scan · 2026">
        <SpecimenArtifact
          lines={[
            'scan result: clean — 0 findings',
            'mapper output: 3 findings · plausible paths · line numbers · fix sketches',
            'audit: none of the three files exist',
          ]}
        />
        <p style={{ margin: '10px 0 0' }}>
          <strong>The sonnet confabulation incident.</strong> On clean scans — exactly the runs with
          nothing to report — a mapper invented findings: plausible paths, specific line numbers,
          fix sketches for files that did not exist. The prompt already said, in effect, "report
          only what you verified." That instruction could not hold, because an instruction asks the
          model to grade its own claim, and the model graded generously. The patch that worked was a
          stronger model, and the rate fell. The lesson that lasted is structural: prompt discipline
          can shape behavior, but it cannot be stage 3. The outside reference has to be outside the
          model — which is why the bench's verification pull drew confidence and quality crossing,
          with the log silent the whole way.
        </p>
      </FieldSpecimen>

      <p>
        Hold the six specimens together and the survey's real finding appears. Only one of these
        machines was bad work; the rest were good work with an empty slot. Incompleteness is a
        stage, not a sin — every loop you ever stand up will run incomplete for a while, the way the
        backfill script ran for a year on a human trigger. The sin is not knowing which slots are
        empty while it runs, because the empty slot names the failure you are currently scheduled
        for: the leash means six weeks of unrepaired drift, the missing ledger means an amnesia bill
        renewing monthly, the missing oracle means the lines have already crossed and nothing saw.
        Script-versus-loop is not a judgment call. It is six slots, filled or empty, checkable on
        any machine in an afternoon.
      </p>

      <Drill cases={RETRIEVAL} title="Retrieval · the check, under other names" />

      <DecisionCard
        title="Before you call it a loop"
        items={[
          'Walk the five stages on one real run: signal, action, verification, commit or revert, update. Name the artifact each stage reads and the artifact it writes.',
          'Then check the six slots: signal, bounded action, verification, reversibility, signal update, authority surface. Empty is allowed; unknown is not.',
          'Ask what fires it. "Someone notices and remembers" is a leash, not a signal — even when the terrain already publishes the trace.',
          'Ask where outcomes land. Stdout is where track records go to die; prompt text is a diary, not a ledger.',
          'Verification must sit outside the loop, and outside the model. An instruction to self-verify is self-approval with manners.',
          "Read the empty slot as a forecast: the table's third column names the failure before it arrives.",
        ]}
      />

      <Coda
        line="Script-versus-loop is a checkable condition — six slots, filled or empty. The sin is not knowing which are empty while it runs."
        next="Chapter 15 opens the catalog: thirteen loop skeletons, tier by tier, and the compounding that starts when they read each other's signals."
      />
    </Chapter>
  );
}
