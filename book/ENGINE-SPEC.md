# Engine spec — frozen API contracts

Every simulation in the book runs on the pure modules in `src/engine/`. These contracts are
frozen: labs and chapters are written against them in parallel, so signature changes break
sibling work. Add helpers freely; do not rename or reshape what is specified here.

Ground rules for every engine module:

- **Pure and deterministic.** No DOM, no React, no `Date.now()`, no `Math.random()`. All
  randomness flows from an injected rng created by `mulberry32(seed)`. Same seed, same output,
  forever — tests pin this.
- **Plain JS + JSDoc.** No TypeScript. Document param/return shapes with JSDoc on every export.
- **Small data, plain objects.** Engines return arrays/objects ready to render; no classes.
- **Tests in `tests/<module>.test.js`** (vitest, node environment). Cover: determinism (same
  seed twice → deep-equal), every config branch the spec names, and the semantic claims (e.g.
  "no signal-update → flat trust"). Engine coverage is gated at 90% lines/branches/functions.
  Run only your own file while iterating: `npx vitest run tests/<module>.test.js`.
- **The glass law.** Labs display engine source verbatim via Vite `?raw` imports. Keep each
  module's core step/evaluate function readable in isolation: short, named, commented for a
  reader, not just a maintainer. The code is part of the book's text.

Already written (do not touch): `src/engine/rng.js`, `src/engine/replay.js`.

---

## rng.js (done)

- `mulberry32(seed:number) -> () => number` — float in [0,1).
- `randInt(rng, min, max) -> int` inclusive; `pick(rng, arr)`; `shuffle(rng, arr) -> new array`.

## replay.js (done)

- A **Trace** is `{ seed:number, steps: Step[] }`; a **Step** is
  `{ label:string, caption:string, data:object }`. `makeTrace(seed)`, `pushStep(trace, step)`.
  Scenario builders in `src/engine/scenarios/` return Traces. Captions are reader-facing prose.

## loopstep.js — the five-stage loop machine

The dependency-patch loop as an effects-as-data state machine
(stages: `signal → action → verification → commit-revert → update`), with each of the six
ingredients removable as configuration.

- `defaultLoopConfig() -> { name:'dependency-patch', signal:true, boundedAction:true, verification:true, reversibility:true, signalUpdate:true, authoritySurface:true }`
- `runCanonical(seed, opts?) -> Trace` — one proposal walked through the five stages.
  `opts.ciOutcome: 'green'|'red'` (red → close-on-red path: close PR, comment, delete branch).
  Step data includes `{ stage, pr: {title, body}, ci }`.
- `runLoopWeeks({ config, weeks=10, seed, proposalsPerWeek=4 }) -> { weeks: WeekRow[], series, summary }`
  - `WeekRow = { week, proposals, merged, reverted, defectsEscaped, reviewMinutes, trust, events: string[] }`
  - `series = { reviewCost: number[], trust: number[], defects: number[], scope: number[] }`
  - Required semantics (each must be a tested branch):
    - all six present → reviewCost falls week over week as trust accrues; defects ≈ 0.
    - `signalUpdate:false` → **amnesia**: trust flat, reviewCost constant at week-1 level,
      recurring `re-litigated the same finding` events.
    - `verification:false` → **self-approval**: defectsEscaped grows while an internal
      `confidence` field in summary rises (the lines cross).
    - `reversibility:false` → one bad merge **ossifies**: a `defect ossified` event, then
      reviewMinutes step up permanently for everything after.
    - `boundedAction:false` → `scope` series grows past `summary.blastRadiusExceededWeek`.
    - `signal:false` → fires on wrong weeks: `missedWeeks` and `falseFires` in summary.
    - `authoritySurface:false` → `summary.globalTrustFlip = { week, cause }`: one incident
      flips a single global switch and every class's trust zeroes at once.

## econ.js — gate, rate, budget

- `simulateWeeks({ classes, budget=30, weeks=12, seed, tolerance=0.05 }) -> { weeks: EconWeek[], inequality, pathology }`
  - `classes: [{ id, label, inflow, quality (0..1 true proposal quality), gate:'above'|'below', sampling=0.1 }]`
  - `EconWeek = { week, perClass:[{ id, gated, approved, autoApplied, queued }], queue, approvalRate, deepReviewAgreement, wip, budgetSpent, upstreamFree }`
  - `inequality = { lhs (gated inflow/wk), rhs (budget × (1 - tolerance)), ok }`
  - Required semantics: when sustained `lhs > rhs`, exactly one pathology emerges
    (deterministic from seed): `'rubber-stamp'` — `approvalRate` inflates while
    `deepReviewAgreement` declines (the divergence chart) — or `'stall'` — `wip` accumulates.
    Moving a high-rate class's gate `below` frees budget: `upstreamFree` rises. The budget is
    a constant: there is deliberately no "work harder" parameter.
  - NOTE for the glass flap: the rubber-stamp drift function is a **modeling choice (Ⓦ)** —
    comment it as such in the source.
- `moveGate(classes, id, to) -> new classes array`.

## field.js — signal physics + the storm

One discrete core: per-node signal with spread/decay/reinforcement and an exploration floor.

- `makeField({ nodes=12, seed }) -> { nodes:[{ id, name, signal, quality }], tick:0 }`
  (names are repo regions: 'delivery/', 'billing/', 'docs/', …)
- `stepField(field, params, rng) -> new field` with
  `params = { spread=0.06, decay=0.10, reinforce=0.5, explore=0.1, outsideRef=true }`
- `fieldMetrics(field) -> { variety (0..1), signalToNoise, lockIn:boolean, gain }`
  Required regimes (tested): decay→0 ⇒ saturation (signalToNoise → low);
  reinforce ≫ decay ⇒ lockIn on an early node even when its `quality` is low;
  gain > 1 ⇒ divergence (runaway); explore floor preserves variety.
- `runStorm({ policy: { maxRetries=5, backoffMs=100, jitter=false, breaker=false }, spikeAt=10, ticks=60, seed }) -> { series: { load, success, queue, amplification, selfReport, groundTruth }, phase:'stable'|'critical'|'runaway', events }`
  Required: aggressive policy (high maxRetries, low backoff, no jitter) ⇒ amplification
  crosses 1.0 after the spike and the storm self-sustains after the spike ends;
  `selfReport` (the system's own confidence) keeps rising while `groundTruth` falls once
  `outsideRef` is severed.
- `applyRemedy(stormState, remedy) -> new state`, remedy ∈
  `'variety'|'decay'|'outside-reference'|'tighten-trust'|'evacuate'|'restart-agent'`.
  `'restart-agent'` dips load for one tick, then the runaway resumes (tested).

## trust.js — the environment-stamped ledger

- `makeTrustState() -> { rows: [], env: { model:'judge-v1', perms:['deps'], repoShape:'v1' }, week:0 }`
- `addOutcome(state, { cls, outcome:'merged'|'reverted'|'closed' }) -> new state`
  (rows are stamped with the current env and week).
- `evaluateGate(state, cls, policy?, properties?) -> { earned, rate, decided, firstBlocker }`
  - `policy = { minRate:0.95, minDecided:5, windowWeeks:13, defectTolerance:0 }`
  - `properties = { earned:true, narrow:true, conditional:true, revocable:true, expiring:true }`
    Each property disableable for counterfactuals: `conditional:false` ignores env mismatch;
    `narrow:false` lets an adjacent class ride another's record; `expiring:false` ignores the
    window. Each toggle has a tested characteristic surprise.
  - `firstBlocker` is a reader-facing string, e.g. `'only 2/5 decided recently'`,
    `'environment changed: judge-v2 has no record here'`, `null` when earned.
- `applyEvent(state, event) -> new state`, event.type ∈
  `'model-swap'|'permission-widen'|'refactor'|'idle'|'revert'`.
  Required semantics: `model-swap` changes env.model ⇒ every class unearned with **zero
  failures on the ledger**; `permission-widen` adds a class at zero while old classes keep
  their grant; `idle` advances weeks so the window empties; `revert` triggers instant
  revocation of its class.
- `counterfactualRun(state, { weeks, seed }) -> { defects: [{week, cls}] }` — what surfaces
  later if `conditional` is disabled after a model swap.

## spec.js — the planned death spiral

- `runSpecGap({ assertions=24, driftPerWeek=1.5, cadence:'big-bang'|'weekly'|'continuous', revisionBudget=1, contracts=false, weeks=16, seed }) -> { weeks: [{ week, valid, hiddenRework, visibleRework, wip, backlog }], cliff: { week, magnitude } | null }`
  Required: `big-bang` + low revisionBudget ⇒ hiddenRework accumulates (visibleRework stays
  near zero — the reader cannot see it) and a `cliff` lands at integration; `contracts:true`
  ⇒ rework is visible the week it happens, no cliff; shorter cadence bounds backlog. Worker
  `effort` is accepted as a param and has **no effect** on the cliff (tested — heroics are
  not a remedy).

## commons.js — Ostrom fingerprints + removal experiments

- `runCommons({ principles, weeks=30, seed }) -> { series: { quality, noise, cruft }, events }`
  with `principles = { boundaries, congruence, monitoring, sanctions, collectiveChoice, conflict, rights, nested }` (all bool).
- `fingerprintScenarios() -> [{ id, missingPrinciple, series, tells: string[] }]` — six
  deterministic prepared traces for the reverse-inference drill (no free toggling in the lab;
  the drill shows a trace, the reader names the missing principle).
- `removalExperiment({ target:'tool'|'context'|'signal', seed }) -> { collapsed:boolean, affected:string, story: Step[], note:string }` — at least one target collapses (hidden
  dependency found), at least one re-adapts.

## guardrails.js — the grader

- `inventory() -> [{ id, name, cls:'structural'|'reactive'|'dynamic'|'reflective', claimed: string }]`
  (≥4 entries, including: a review gate running 95% approval; a rate limit set at 10× peak; a
  circuit breaker that depends on the service it guards; one honest structural guardrail.)
- `gradeStorm(seed) -> [{ id, axes: { coverage, latency, blastRadius, falsePositiveRate, recoveryCost }, verdict: string }]` — measured grades after a seeded failure storm. Required:
  the 95% gate grades as rubber stamp; the 10× limit as decorative; the dependent breaker
  fails exactly during the storm.

## cases.js — the case bank (the book's hardest content)

- `export const CASES: Case[]` — **40 cases minimum**, kinds:
  `'placement' (14) | 'spiral' (8) | 'loop' (6) | 'gate' (5) | 'trust' (4) | 'decline' (5)`.
- Case shape:
  ```js
  {
    id, kind,
    surface,            // one-line setting; vary aggressively: data pipelines, eval
                        // harnesses, on-call, mobile releases, ML feature stores, IaC —
                        // dependency bumps may appear at most twice in the whole bank
    prompt,             // what the reader is asked to call
    evidence: [{ label, text }],      // facts to inspect (placement: enough to infer axes)
    axesTruth,          // placement only: { reversibility:'cheap'|'costly',
                        //   legibility:'specified'|'exploratory', coupling:'loose'|'tight' }
    options: [{ id, label }],         // or quadrant:true for placement
    answer,             // option id — omit when contested
    contested: bool,    // at least 5 cases across the bank
    feedback: { [optionId]: string }, // ARGUED from axes/warning signs, never "wrong";
                        // contested feedback states what each reading commits you to
    fromChapter,        // number — used for interleaving/resurfacing
  }
  ```
- `scoreAxes(c, readerAxes) -> { agreed: string[], missed: [{ axis, truth, why }] }`
- `drawCases(state, { kind?, n, missedFirst:true, rng }) -> { cases, state }` — resurfaces
  missed categories first, interleaves kinds otherwise.
- Write the bank like a senior engineer wrote it: concrete numbers, real-sounding systems,
  near-misses (a "reversible-looking" data deletion whose released information can't be
  recalled; a healthy backpressure loop that looks like a storm). Feedback argues; several
  answers say "two defensible placements — here is what each commits you to."

## scenarios/ — recorded runs and the checkride

`src/engine/scenarios/` (built after the engines above exist):

- `helloLoop.js` — `canonicalRun(seed)`, `redRun(seed)`, `amnesiaComparison(seed)` (Traces
  built on loopstep).
- `staging.js` — **bet register**: `stagingRun(seed)` (stages 0–6 with the nth-loop cost
  curve bending), `skipStageZero(seed)`, `broadenStageOne(seed)`, and `dissent(seed)` — the
  parameterization where skipping Stage 0 works fine for a long while (small N, strong
  conventions). Captions must include the label "this curve is the author's bet, drawn".
- `checkride.js` —
  - `generateCheckride(seed) -> { terrain, problems }` — a data/ML-pipeline shop (not the
    book's platform) with six embedded problems: a mis-placed decision, an open loop posing
    as closed, a forming spiral, a saturated budget, a stale trust grant, a decorative
    guardrail.
  - `availableActions(state) -> [{ id, label, kind }]` — terrain-only actions (move a gate,
    add decay, add an outside reference, re-place a decision, schedule a disturbance, revoke
    a grant, …). **No action may command an agent.**
  - `applyAction(state, actionId) -> new state` (max 12 actions; further calls rejected).
  - `debrief(state) -> { sections: [{ problem, found:boolean, readerDid, whatItCaused, handbookSays }] }` — assembled from the reader's own event log; never a score.
  - `mondayMemo(answers) -> string` — plain-text memo (placement map, first-loop spec with
    six ingredients, gate table, irreversibles list, disturbance schedule).
