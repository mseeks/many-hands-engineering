// Ch 15 — The catalog, and compounding. Covers §3.3.
// The most Go-by-Example chapter: thirteen loop skeletons as uniform cards
// (benchfile-style skeleton line, the signal produced, a tier chip, one
// "when not to" line), the spec note as its own card, and the composition
// lab as the finale: the same mapper population run twice.

import { Badge, Chapter, Coda, DecisionCard, Drill, Lede, Pull } from '../../components/kit.jsx';
import CompositionLab from '../../labs/CompositionLab.jsx';
import { CASES } from '../../engine/cases.js';

// Retrieval: sp-04 reaches back to Ch 9 (a middle loop's reinforcer feeding
// on itself), sp-07 to Ch 13 (the stale-doc loop's signal, dead), pl-08 to
// Ch 5 (placement on the kind of surface starter loops are picked from).
const RETRIEVAL = ['sp-04', 'sp-07', 'pl-08'].map((id) => CASES.find((c) => c.id === id));

const TIER_LABEL = {
  starter: 'starter · high reversibility, narrow scope, clean signals',
  middle: 'middle · wider scope, richer signals, still reversible',
  advanced: 'advanced · requires mature terrain',
};

// The §3.3 catalog. `skeleton` is the benchfile-style one-liner; `produces`
// quotes the handbook's "Signal produced" line; `whenNot` is the one line
// the handbook leaves to judgment, argued from each loop's own description.
const LOOPS = [
  {
    id: 'stale-doc',
    tier: 'starter',
    name: 'Stale-doc refresh',
    skeleton:
      'signal: code Δ vs doc Δ > threshold → action: rewrite vs current code, flag unconfirmed → verify: owner from code-ownership',
    produces: 'a freshness field that decays with code change and resets on review',
    whenNot:
      'when no owner exists to take the review — a flagged-but-unread rewrite is staleness with a fresh date',
  },
  {
    id: 'flaky-test',
    tier: 'starter',
    name: 'Flaky-test loop',
    skeleton:
      'signal: pass rate enters the flaky band → action: one scoped fix (seed | timing | retry-with-diagnostic) → else quarantine + owner',
    produces: 'a flakiness score per test that compounds across runs',
    whenNot:
      'while CI itself is unstable: the band reads infrastructure noise as test noise and quarantines the innocent',
  },
  {
    id: 'dead-code',
    tier: 'starter',
    name: 'Dead-code loop',
    skeleton:
      'signal: deadness(coverage, import graph, call telemetry) across a stability window → action: deprecate, then delete → revert: one commit',
    produces: 'a persistent map of cold regions that informs refactoring',
    whenNot:
      'where dynamic dispatch hides callers — telemetry cannot see a runtime lookup, and the cheap revert starts doing real work',
  },
  {
    id: 'triage',
    tier: 'middle',
    name: 'Triage loop',
    skeleton:
      'signal: the full field (incidents, fragility, freshness, backlog) → action: ranked queue + rationale, never the work itself',
    produces:
      'an audit of which ranking criteria correlated with real business outcomes, which tunes the ranker',
    whenNot:
      'before the terrain carries signal worth ranking — a planner over noise launders noise into priority',
  },
  {
    id: 'oncall-assist',
    tier: 'middle',
    name: 'On-call assist loop',
    skeleton:
      'signal: alert fires → action: runbook + deploy history + 3 similar incidents → hypothesis + 3 diagnostic checks → the human acts',
    produces:
      'alignment between agent hypothesis and actual root cause — a confidence signal for autonomy on narrow incident classes',
    whenNot:
      "as an auto-responder. The product is the human's first five minutes; incidents are where the irreversible lives",
  },
  {
    id: 'refactor-candidate',
    tier: 'middle',
    name: 'Refactor-candidate loop',
    skeleton:
      'signal: churn × coupling × fragility × ownership → refactor pressure → action: a plan with costs, risks, a small prototype → a human authorizes',
    produces: 'a history of where refactor pressure predicted real architectural debt',
    whenNot:
      'as an executor. The plan is the product; the refactor itself waits for the authorization, every time',
  },
  {
    id: 'test-backfill',
    tier: 'middle',
    name: 'Test-backfill loop',
    skeleton:
      'signal: high churn, low coverage → action: pin current behavior, marked behavioral | specified → behavioral flagged for review',
    produces: 'a coverage map weighted by criticality',
    whenNot:
      'on code the dead-code map already condemned — pinning behavior there ossifies what was about to leave',
  },
  {
    id: 'security-patch',
    tier: 'middle',
    name: 'Security-patch loop',
    skeleton:
      'signal: CVE advisory matches the dependency graph → action: one change per package, advisory + path attached → authority: earned, narrow',
    produces: 'mean time from advisory to remediation, per criticality tier',
    whenNot:
      "as urgency-by-severity: a critical advisory lends no weight to a young track record. The loop's own distinction — a patch available is not a patch applied — is the discipline",
  },
  {
    id: 'feature-prototype',
    tier: 'advanced',
    name: 'Feature prototype loop',
    skeleton:
      'signal: intent as acceptance assertions + UX sketches → action: competing implementations in a sandbox → a human chooses on feel and fit',
    produces: 'a library of rejected implementations — a rich training signal about taste',
    whenNot:
      'when nobody can write the acceptance assertions yet — competing builds without a referee are just more options to not judge',
  },
  {
    id: 'spec-adversary',
    tier: 'advanced',
    name: 'Specification-by-adversary loop',
    skeleton:
      'signal: intent as assertions over a bounded interface → action: adversarial subagents attack each one → survives = verified; falls = a human decides which was wrong',
    produces: 'an executable, continuously-stressed specification that outlives its authors',
    whenNot:
      'in deep emergent territory, where intent resists specification and a rigid assertion forecloses the exploration it was meant to protect',
  },
  {
    id: 'migration',
    tier: 'advanced',
    name: 'Migration loop',
    skeleton:
      'signal: next shard ready → action: prepare, migrate the shard, verify → commit-to-next-step: the steward owns it; rollback pauses the run',
    produces:
      'migration progress as a visible, resumable state — the end of migrations that stall invisibly at 40%',
    whenNot:
      'when steps cannot be made independently reversible — a migration without a two-way door is planned work with a flag day, and should say so',
  },
  {
    id: 'capacity-routing',
    tier: 'advanced',
    name: 'Capacity-routing loop',
    skeleton:
      'signal: approval rates per task class → action: route incoming work to the agent whose record matches → authority: steward sets policy + thresholds',
    produces: 'a per-agent specialization pattern the team can read, reason about, and adjust',
    whenNot:
      'before per-class records exist: routing on thin records amplifies early luck into permanent specialization',
  },
  {
    id: 'disturbance',
    tier: 'advanced',
    name: 'Disturbance loop',
    skeleton:
      'signal: the schedule → action: fail a tool, sever a context, corrupt a non-critical signal → watch: graceful re-adaptation vs collapse',
    produces:
      'a map of fragile assumptions and resilient ones — where the next round of hardening belongs',
    whenNot:
      'where collapse includes the irreversible. Disturb the reversible interior; never rehearse on the cliff edge',
  },
];

function LoopCard({ loop }) {
  return (
    <div className="mh-card">
      <span className="mh-kicker">{TIER_LABEL[loop.tier]}</span>
      <h4>{loop.name}</h4>
      <p className="mono" style={{ fontSize: '11.5px', color: 'var(--ink-2)', margin: '0 0 8px' }}>
        {loop.skeleton}
      </p>
      <p style={{ margin: '0 0 6px', fontSize: '13px' }}>
        <strong>Signal produced:</strong> {loop.produces}.
      </p>
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-faint)' }}>
        <strong style={{ color: 'var(--amber)' }}>When not to:</strong> {loop.whenNot}.
      </p>
    </div>
  );
}

function Tier({ tier, intro }) {
  return (
    <div role="group" aria-label={TIER_LABEL[tier]}>
      <p>{intro}</p>
      <div className="mh-cardgrid">
        {LOOPS.filter((l) => l.tier === tier).map((l) => (
          <LoopCard key={l.id} loop={l} />
        ))}
      </div>
    </div>
  );
}

export default function Ch15() {
  return (
    <Chapter n={15} covers="§3.3">
      <Lede>
        Thirteen loop skeletons, each one a pattern that recurs across mature software platforms.
        The fidelity is in the shape, not the technology — and the payoff is not in any one of them.
      </Lede>

      <p>
        The goal of the first loop isn't the loop; it's the template. You already hold the canonical
        starter: the dependency-patch loop has been on your bench since Chapter 1, and Chapter 14
        took it apart stanza by stanza. This chapter is the rest of the catalog — skeletons,
        intentionally independent of any specific orchestrator, model, vendor, or pipeline. Every
        card reads the same way: the skeleton as one benchfile-style line, the signal the loop
        produces (that field matters most; hold the thought), and the one condition under which you
        should not build it. The cards are deliberately flat. Loops are not interesting one at a
        time, and the chapter's finale is about what happens when they stop being alone.
      </p>

      <aside
        className="mh-card"
        style={{ borderTopColor: 'var(--amber)' }}
        aria-label="A note on specifications, before the catalog"
      >
        <span className="mh-kicker">A note on specifications, before the catalog</span>
        <p style={{ margin: '0 0 8px' }}>
          Specs are a tool used by several of the loops below, not the framework's philosophy. They
          earn their cost at <strong>boundaries</strong>: contracts with external systems, the
          interfaces between planned and emergent regions, the schemas agents emit. They waste their
          cost in deep emergent territory, where exploration updates the direction and a rigid spec
          forecloses exactly that.{' '}
          <Badge
            layer="W"
            note="§3.3's spec note — a working design principle, stated before the catalog uses it"
          />
        </p>
        <p style={{ margin: 0 }}>
          Treat specs like software: version-controlled, tested, amended by learning. The
          specification-by-adversary loop below is the whole note made operational — a spec
          converted from document into continuously-stressed process, powerful at boundaries, weaker
          where intent resists specification.
        </p>
      </aside>

      <Tier
        tier="starter"
        intro="Begin here. Each starter loop has a clear trigger, a clear verification, and cheap reversal — the dependency-patch shape on three more surfaces."
      />
      <Tier
        tier="middle"
        intro="Once several starter loops run cleanly, richer loops become possible, because the terrain now carries signal worth reading. Notice what changed: not the agents — the field."
      />
      <Tier
        tier="advanced"
        intro="Attempt only after starter and middle loops are durable. Every loop in this tier consumes signals the earlier tiers produce; built early, each one is a planner over noise or an authority without a record."
      />

      <p>
        Individual loops are useful. <em>Loops that read each other's signals</em> are where
        compounding lives, and the catalog you just read is secretly a wiring diagram. The dead-code
        loop produces a map of cold regions; the refactor-candidate loop reads that map as one of
        its inputs. The test-backfill loop avoids cold regions and prioritizes hot-but-fragile ones.
        The migration loop reads coverage from the test-backfill loop to decide which shards are
        safe to move first. Each loop is simple; the field of signals they collectively maintain is
        rich. And nothing routed any of it — you traced this in Chapter 3, hop by hop, READ and
        WRITE and never CALL. The coordination is in the environment, not in any orchestrator.
      </p>

      <Pull badge="W">No loop calls another. Each reads the terrain and writes to it.</Pull>

      <p>
        Which brings back Chapter 14's bleakest specimen: the amnesiac mapper fleet, fifty scripts,
        zero shared signals, every finding dead in a scrollback. The lab below rebuilds that
        population and runs it twice on the same world from the same seed. Run one prints its maps
        to stdout, exactly as the fleet did. Run two changes a single line — maps persist to the
        shared field — and nothing else: same mappers, same physics, same luck. Commit to a
        prediction before you fork it, and watch the targeting line, because the mappers never get
        smarter in either run.
      </p>

      <CompositionLab />

      <Drill cases={RETRIEVAL} title="Retrieval · the catalog, under load" />

      <DecisionCard
        title="Before you stand up the next loop"
        items={[
          'Pick by tier, honestly. Starter loops need nothing; middle loops need a field worth reading; advanced loops need mature terrain. The tier names a precondition, not a difficulty.',
          'Write the skeleton line first: what fires it, what it is scoped to, what verifies it, what it writes back. If a slot will start empty, know which one (Ch 14).',
          'Name the signal it produces before you build it. A loop that writes nothing back compounds nothing, whatever it accomplishes.',
          'List the existing signals it could read. Compounding comes from the field, not the roster.',
          'Spec only at boundaries; in exploratory territory a frozen spec forecloses the exploration.',
          'Honor the when-not-to line. Every skeleton has one, and it is usually about a missing precondition, not a flaw in the loop.',
        ]}
      />

      <Coda
        line="Each loop is simple; the field of signals they collectively maintain is rich — and persistence is what makes the field possible."
        next="Chapter 16 asks the order-of-operations question: which of these to build first, and what skipping the boring stage actually costs."
      />
    </Chapter>
  );
}
