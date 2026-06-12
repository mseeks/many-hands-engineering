# Many Hands: the handbook, run

**Design for the Glassbox interactive book that teaches the entire Many Hands Engineering framework.**

One Glassbox entry, slug `many-hands`, the collection's first book. Twenty-two chapters in five acts, ~3.5 hours linear, built to be re-entered in five minutes. Every figure runs on a pure, tested engine. Every claim wears its evidence grade. No control in the book ever commands an agent.

The design in one sentence: **the runnable example for a judgment framework is a forkable decision artifact plus the simulated consequences of that decision, governed by a constitution that makes the book's form teach the framework's deepest idea and its interface carry the framework's honesty.**

---

## 1. The reader, the job, and the form

The reader is a senior engineer: expert in code, CI, PRs, retries, and deploys; novice in exactly three skills the handbook exists to build — **placement** (where a decision lives on the planned/emergent spectrum), **dynamics recognition** (a runaway from its second symptom, not its tenth), and **trust calibration** (gate, rate, budget; the five properties; when autonomy resets). These are judgment skills. A senior engineer can read the handbook in two hours and recall every term, and still patch the agent when the terrain is the problem.

Three findings shape everything:

1. **The central-control prior is ontological, not factual** (Chi 2005: emergent processes are the single category experienced people get most robustly wrong). Engineers carry "someone must be driving" and "when it breaks, find the agent responsible." Prose bounces off this. The book's hardest job is not conveying vocabulary; it is dislodging that prior, and re-dislodging it, because it reverts under load.
2. **Interaction earns its cost only where behavior is the content** (the whole explorables record, from Victor to the NYT's 85%-ignore data). MHE's claims are claims about dynamics: queues saturating, signals decaying, trust resetting, specs rotting. That is the one content class where simulation beats prose. Definitions, taxonomies, and lineage are not; they get static figures with signaling cues.
3. **Judgment is built by a known machinery**: confront the prior, struggle inside rails (guided productive failure, never sandbox-dumping), consolidate with the named principle, compare contrasting cases, commit predictions before reveals, drill classification under high surface variability, and practice transfer — including the transfer error of over-application. The book is that machinery wearing the quiet interface of a book. No quiz chrome, no scores, no streaks. A bench, a ledger, a gauge.

So the form: **a worked-artifact book in the Go-by-Example lineage.** Go by Example works because the example *is* the explanation and every page has the same grammar. MHE has no source files, but every one of its concepts has a faithful textual artifact — a loop manifest, a placement record, a gate policy, a trust ledger, a guardrail inventory, a spec — and a consequence that unfolds over time. Pair the artifact with a recorded run of a pure engine executing it; make the artifact forkable; the diff between the two futures is the lesson. This makes the handbook's central line literal: *the placement is the decision; the implementation follows from it* becomes *the artifact is the decision; the trace is its bill.*

This form won a five-way adversarial bake-off (see §13) because it is the only one a working senior engineer plausibly both **finishes** and **returns to**. The book is designed for the reader who will be half-done and come back the night before a real placement call. That reader is not a failure mode. That reader is the primary user.

---

## 2. The constitution: two laws, two disciplines

These four commitments are the book's invariants. Everything else (which labs, how many chapters, which cases) stays revisable under playtesting. The handbook's own last line applies to the book: its invariants are planned, its practices emergent.

### Law I — The terrain law

**No control in this book commands an agent.** Every knob, slider, toggle, gate, and forkable field is terrain: signals, decay rates, budgets, boundaries, schedules, references. When the reader meets a runaway and reaches for "stop the agent," the interface offers them only the terrain, because that is the entire lesson.

This converts the conceptual-change confrontation from a one-chapter event into a property of the medium. The deepest misconception gets repaired continuously, every time the reader's hand reaches for the lever that isn't there. The law is stated once in Chapter 0 and enforced everywhere, with exactly one staged exception: in the runaway chapter, a prominent **"restart the agent"** button exists. It works for one tick. The spiral resumes. The button greys out with the caption: *the problem is in the terrain, not in any individual agent.* The reader's residual reflex gets met, indulged, and shown failing.

### Law II — The glass law

**The box is glass.** Every lab has a *show the physics* flap that renders the verbatim engine rule it just ran, imported from source so it is structurally incapable of going stale. Ten lines of tested JavaScript are the most honest caption a simulation can have, and the strongest trust move available with this audience: a senior engineer believes code over claims. This is also the book earning the collection's name.

### Discipline I — The register split

This is the make-or-break content decision, and it exists because all five adversarial critiques in the design bake-off independently found the same disease: **a simulation can launder a hypothesis into felt physics.** A claim badge does not outvote a curve the reader watched fall. The handbook begs, in Part I and Part IV, not to be read as settled science. A book that simulates everything it asserts would betray that, with superb production values.

So every interactive is classified into one of two registers, never blurred:

- **Mechanism register** (experiments the reader runs): dynamics with real backbone where the engine could genuinely surprise the author. Queueing arithmetic (gate/rate/budget), reinforcement-without-decay (runaway), spec-drift accounting, the trust state machine, Goodhart gaming, the commons degradation fingerprints. The reader causes, probes, and forks these.
- **Bet register** (worked models, labeled): the framework's working design principles — the staging order and its nth-loop cost curve, the wrong-placement tax, the spectrum's co-varying properties. These render as captioned recorded runs that say, at the moment of payoff, **"this curve is the author's bet, drawn."** And each ships **model dissent**: one visible parameterization where the claim fails (a small team with strong conventions skipping Stage 0 and doing fine for a year), so the reader sees the model has freedom and the author chose a point in it.

### Discipline II — Argued judgment, never scored verdicts

The handbook says placement calls are bets checked on empirical axes. So the drills never grade the reader's *verdict* against an answer key; they grade what is actually checkable and argue the rest:

- **Hidden ground truth on the axes.** Scenarios carry facts the reader must infer — what undo really costs, how stable the spec really is, what else moves when this moves. You can be *wrong about reversibility*; that is empirical and the reveal shows it. The verdict that follows from your axes is then argued, axis by axis, never marked.
- **Contested cases are marked contested.** Some entries have two defensible placements, and the feedback says so: "if you read the coupling as loose, emergent is defensible — here is what that commits you to." A few cases the framework cannot adjudicate yet, and the reveal says that too, linking to the open questions.
- **All commitments are clicks, drags, quadrant placements, or drawn curves** (You-Draw-It). Never free text into a void; a client-only book has no honest evaluator, and a fake one would poison everything.

---

## 3. The page grammar: the Bench

Every teaching figure in the book is an instance of one component family. A Bench is two panes and a control bar:

- **Left — the artifact.** A declarative text document rendered like source: line-numbered, syntax-tinted, margin-annotated, never more than ~25 lines, every field doing work. The house notation is YAML-shaped and consistent book-wide (a loop manifest, a gate policy, a trust grant, a guardrail inventory). It is *notation*, and the book says so once; the only artifact the reader is told they can carry to work is the Monday memo (§6.10).

```
loop: dependency-patch
signal:
  watch: deps.outdated(level: patch)
  fires_when: changelog == clean
action:
  scope: one bump per PR, lockfile only
verification:
  oracle: target repo CI        # outside the loop
on_red: close + comment + delete branch
update:
  record: {merged, reverted, closed} -> track record
  decay: 90-day window
authority:
  gate: propose-only            # earned auto-merge later
```

- **Right — the run.** A step list produced by a pure engine executing that artifact against the simulated terrain, in the collection's recorded-run (Walkthrough) pattern: snapshot + human caption per step. Software-native rendering throughout: PR cards, CI check rows, queue lanes, decaying signal bars, ledger rows. No abstract dots. No organisms.
- **Control bar.** One grammar, book-wide, established in Chapter 1 and never varied: `Step · Run · Reset · Fork`. Fork flips specific load-bearing fields editable (slider, toggle, or enum chip inline in the text), re-runs the engine, and renders the divergence beside the original.

Bench rules, enforced by the shared component, not by authoring discipline:

1. **Legible at rest.** Every Bench mounts on the final, most representative frame of its canonical run, payoff caption visible. The ~85% of readers who never touch a control still receive the claim. Reduced motion: `Run` steps discretely.
2. **Engine-driven, always.** Every trace is generated by the lesson's engines and pinned by tests. The repo's `lab-fidelity` loop audits exactly this; the book passes by construction.
3. **Deterministic.** Seeded PRNG, seed in the trace header. Same artifact, same trace, forever.
4. **Model notes.** Every Bench footer folds out: what this engine simplifies, what was tuned and why, the claim register it runs in, and a mandatory line: *what this cannot show you.* (The Evolution of Trust notes-page pattern, distributed per figure.) The glass flap sits beside it.
5. **The five-part lab contract** for any Bench with controls: a stated question; a committed prediction where the result is counterintuitive; 2–4 constrained controls per task (all other knobs frozen — no knob farms); feedback that names the mechanism in the framework's vocabulary ("reinforcement outran decay," never "score: 12"); and a state-the-rule check before the chapter moves on. Free play exists, last, clearly optional.

Two reference surfaces make the Bench grammar a returnable tool rather than a tour: the **Bench Index** (a flat mono list of every bench by artifact name) and **decision cards** — each chapter closes with a "before you decide" card distilling the chapter into the checklist an engineer needs at the moment of a real call (the three axes; the six ingredients; the gate-move conditions; the spiral warning signs; the irreversibility test). Cards are individually deep-linkable. Five-minute re-arming before a real decision is a first-class use case, designed, not hoped for.

---

## 4. The world and the through-line

**One composite terrain, declared as composite, in one paragraph.** A mid-sized product platform: a monorepo with named, color-coded regions (core, integrations, console, billing, docs, evals), a CI oracle, a PR queue, one steward with a finite weekly budget, and a fixed cast of loops with stable names, colors, and glyphs for the whole book — dep-patch (amber), security-patch (red-amber), doc-refresh (teal), flaky-test (violet), dead-code (slate), test-backfill (green), triage (blue), disturbance (signal-red). The six ingredients and the four forces get fixed iconography, introduced once (Ciechanowski's color-coded watch parts, applied to a platform).

There is **no fiction**: no named coworkers, no plot, no year-long timeline pretending to be one continuous history. Continuity comes from the consistent world definition and recurring cast; every chapter boots from a deterministic per-chapter seed and stands alone. (A claimed continuous history whose chapters are actually independent scenarios would fail the book's own hybrid-failure test: form planned, substance emergent. The bake-off's narrative and persistent-world designs died on exactly this, and on cast-costs-authority with this audience.)

**The spine: the dependency-patch loop**, kept from the handbook for the handbook's reasons, and because the workspace holds something no invented example can match: *the same loop at two real maturity levels.* The hand-fired local script (signal computed, human as trigger, results printed and forgotten, propose-only forever) and froot, the durable Temporal rebuild with all six ingredients, an environment-stamped trust ledger, and a shadow gate. The book uses these as **`FIELD SPECIMEN`** cards — verbatim, dated, sourced, and fenced with an N=1 banner (*one fleet, ~7 small repos, ~30 PRs, a local 12B judge: feasibility evidence, not at-scale proof*):

- A real bump PR body, and the real close-on-red comment.
- The real security PR a human closed in favor of a better fix — a closed PR that *lowers* the loop's approval rate: steward disagreement recorded as signal.
- The real zod anecdote: dep-patch merges a zod bump; three days later dead-code proposes removing zod entirely. No call between them. The repo state is the bus.
- The real decay bug: an advisory comment that never cleared when its hazards were fixed — a signal that didn't decay, found and fixed in week one.
- The real honesty drift: "froot does not merge; a human approves," written before the acting gate shipped, now true only because the allowlist is empty. Stale docs as bugs, live in the wild, in the very system the book describes.
- The real shadow-gate blocker strings: "only 2/5 decided recently," "CI pending."
- The sonnet confabulation incident: on clean scans, a mapper invented plausible findings; the patch was a stronger model. What prompt discipline can and cannot hold; why the outside reference must be outside the model.

**The transfer defense.** One example is a far-transfer trap, so the spine is braided: every principle taught on dep-patch is exercised at least once on a foreign surface (eval harnesses, vector stores, on-call, data pipelines, schema migrations, feature prototypes), the case bank varies surfaces aggressively (§7), and the capstone checkride runs on terrain that is deliberately *not* the book's platform.

---

## 5. The chapter map

Five acts, twenty-two chapters, ~3.5 hours linear, minutes declared in every chapter header. Acts are shippable increments. A **fast path** (~2 hours: Ch 1 → 3 → 5 → 8 → 9 → 12 → 14 → 15 → 18 → 19) is marked in the rail and includes the conceptual-change chapter. Navigation: a two-level left rail (Act → chapter) on `useScrollSpy` with hash deep-links, reading progress, plus the Bench Index and the Ledger Index (the persistent color-coded glossary rail; vocabulary is taught where each term first lands and consolidated there, so no dedicated vocabulary chapter exists).

Ordering rationale: run a loop before arguing about loops (Go by Example's hello-world inversion); confront the central-control prior before any dynamics (Chi); mechanism before failure, failure caused before remedy named (productive failure inside rails); economics after the reader has inflow to feel; instruction-first for the irreversible and security content (the pedagogy mirrors the framework's own placement logic); foundations last but the honesty grammar installed on page one.

**Act 0 — The bench itself** (~8 min)
- **Ch 0 · How to read this bench.** The page grammar; the two laws, stated; the claim badges — **Ⓔ evidence / Ⓦ working principle / Ⓜ metaphor** — and the **● documented-real / ○ constructed-for-teaching** provenance marks, introduced *before any simulation runs*, with a sixty-second drill: sort five of the handbook's own sentences onto the three shelves, then see the author's sort. The vocabulary cross-reference chips (planned/emergent ↔ cathedral/bazaar; signal ↔ pheromone; terrain ↔ harness). The AI-assistance note, carried over honestly. The length declaration and the fast path. *Covers: front matter, "How to read this," "A note on the name and the claim," "What kind of claim is this?" (installed; deepened in Act V).*

**Act I — The argument, run first** (~30 min)
- **Ch 1 · Hello, Loop.** The dep-patch benchfile stepped end to end: signal fires → PR appears → CI runs → merge → ledger row. Fork one: red CI → close-on-red (reversibility working). Fork two: delete the `update:` block and run ten simulated weeks → **the amnesia bill**: the closing loop's review cost falls as track record accrues; the amnesiac loop's stays flat at run-#1 cost forever, the same findings re-paid every run. *Covers: §3.1 introduced; the turn experienced before it is argued.*
- **Ch 2 · The Turn.** The eras table (lines → modules → loops) as a static, signaled figure — it is already excellent in the handbook. "Many hands" enumerated: humans, agents, CI, linters, pipelines; it was always many hands. Then the approval replayed from Ch 1's trace with everything upstream highlighted: the placement, the gate, the track record that made the yes considerable. *Covers: Part I "The turn," "Why Many Hands," "Why approval matters."*
- **Ch 3 · Nobody is calling anyone.** The conceptual-change chapter. The **trace-the-cause probe** on the composite terrain: five loops visibly coordinating (the zod specimen ● as the anchor); the reader is asked to point at the thing that decided the coordination, commits, then traces any outcome backward — every hop labeled READ or WRITE, never CALL. The chain always terminates in a signal in the terrain. No strawman orchestrator twin built to die; the contrast is carried by the N-vs-N² channel arithmetic (Ⓔ, combinatorial not ideological) and by what the reader just failed to find. The terrain law is named here as the book's standing answer: *you will keep reaching for the agent lever; this book does not have one, on purpose.* *Covers: §2.8 coordination topology; §3.3 "no loop calls another," seeded; the Chi confrontation.*

**Act II — The framework** (~70 min)
- **Ch 4 · The spectrum.** The ten co-varying properties: the handbook's table as the primary figure, plus one Ⓦ worked model — drag a workstream along planned↔emergent and the properties drag together; force the halfway mix (central authority + continuous async integration) and the recorded run names governance theatre. Bet register, with dissent: a mix that holds (a small planned core with async integration and heavyweight contracts) shown honestly. *Covers: §2.2.*
- **Ch 5 · Placement.** The **Placement Bench** (§6.2): worked → faded → drill, hidden ground truth on the axes, argued feedback, the danger zone as an action item. *Covers: §2.3.*
- **Ch 6 · Hybrids and strata.** Five composition patterns as cards, each one a 15-step recorded run; the deep one is scaffold-and-release with the overstay failure. Pace layers as the six-clock stack (static, signaled), the strata-router drill (pitch each incident/review to its layer; feel the category errors), and the **ratification moment** — the steward's upstream work given a real interactive: notice a convention forming in the signal field (three loops independently adopting the same fix shape) and promote it upward by explicit ratification at each layer, watching it become a rule the terrain enforces. Signals flow up; authority flows down; the reader does both. *Covers: §2.4, §2.5; first beat of §3.5's upstream half.*
- **Ch 7 · The commons.** Ostrom's eight principles as Ⓔ evidence cards (the book's strongest shelf, and labeled as such; the software mapping marked Ⓦ). The lab is the **fingerprint drill**, reverse-inference: shown a degradation trace, name the missing principle — unattributable spam means boundaries are off; one repeat offender dominating means sanctions aren't graduated; rot discovered only at failure means monitoring is gone. Not eight free toggles; governance is not a switch. Coda: the goal restated — the metrics panel swaps velocity for *autonomous:supervised ratio* and *reversibility of the average change.* *Covers: §2.6, §2.7.*
- **Ch 8 · Signal physics.** The **Signal Field**, one guided appearance (§6.3): spread, decay, reinforcement, exploration on the repo graph, each task freezing all but one knob. Find saturation (decay too slow), lock-in (reinforcement outruns decay), and the phase boundary (the qualitative flip as the dial crosses critical). The four forces consolidate here with entropy beneath them. Impossibility results as cards that cross-link the collection's own CAP & PACELC lesson rather than re-teaching it; Ashby's variety matcher as a one-screen demonstration; the incentives bullet as prose. Math badged honestly: real mathematics, informal bridge (links to Act V). *Covers: §2.1 four forces, §2.8.*
- **Ch 9 · Runaway.** Productive failure inside rails (§6.4): cause the retry storm, commit an explanation, then get the name. The healthy-vs-runaway table as four live lamps (decay, variety, outside reference, net behavior). The remedy palette behind one of the book's two cognitive gates; the greyed-out **restart-the-agent** button. Re-skins as recorded runs: agents citing agents; eval drift. The ant mill: one Ⓜ margin card, the only biology in the book. *Covers: §2.9 emergent spiral.*
- **Ch 10 · Spec rot.** The **Spec Gap** (§6.5), with the withheld-information mechanic: hidden rework is invisible until integration unless executable contracts are on — the UI limitation *is* the lesson. Denver baggage, NPfIT, Healthcare.gov as ● evidence cards. Hybrid failures close: the **hybrid detector** drill — four systems described by their claims, classified by their actual decision logs. *Covers: §2.9 planned spiral + hybrids.*
- **Ch 11 · Guardrails.** Four classes as four shelves of the bench, each answering its own question; then the **Guardrail Grader** (§6.6): predict five-axis grades, run the storm, read the gap. The planted trick is structural, not behavioral: a circuit breaker that depends on the service it breaks against. Coda: guardrails subject to their own dynamics — the retry policy that causes the overload it guards against, run live, pointing back to Ch 9. *Covers: §2.10.*
- **Ch 12 · Entropy and disturbance.** Three fronts as three short benches: designed decay (toggle decay off on doc-freshness and watch the commons silt up); a garbage-collection loop eating cruft; and **game day** — a forced-removal experiment on a specimen terrain: remove a tool, context source, or signal; watch collapse (hidden dependency found) or graceful re-adaptation; build the fragility map. The cadence table as the decision card. Over-stabilization shown honestly: max the stabilizers and lose the capacity to adapt. *Covers: §2.11.*
- **Ch 13 · The signature of alive.** The five-gauge health panel, then the **Triage Deck** (§6.7), the book's perceptual-learning instrument, first full deal. *Covers: §2.12.*

**Act III — The practice** (~75 min)
- **Ch 14 · Anatomy of a loop.** The five stages re-walked on Ch 1's trace; then the **Six-Ingredient Bench** (§6.8): pull any ingredient, predict from the handbook's table, run thirty days, watch the named pathology arrive. Then the **specimen diagnosis drill** on the real corpus ●: the loop on a leash (signal computed, fired by human memory), the amnesiac mapper (findings die on stdout; fifty loops, zero shared signals), KNOWN-CONTEXT prompt archaeology (stage 5 performed by a human editing prompt text), the game-tick control loop (feedback ≠ closure: the boundary of the concept), the verification oracle with no loop around it. Incompleteness taught as a stage, not a sin; the sin is not knowing which slots are empty. *Covers: §3.2 (+§3.1 reprise).*
- **Ch 15 · The catalog, and compounding.** The most Go-by-Example chapter: twelve loops as uniform one-screen cards — benchfile, one recorded run, the signal produced, a tier chip, one "when not to" line. The spec note as its own card (specs earn their cost at boundaries). Finale: the **composition lab** — the same mapper population run twice, maps dying on stdout versus maps persisted to the shared field; compounding appears only in the second run. *Covers: §3.3.*
- **Ch 16 · The staged transition.** Bet register, deliberately: the **Staging Board** as a captioned recorded run of the author's bet — stages 0–6 advancing, the cost-of-the-nth-loop curve bending down; skip Stage 0 and the ghost run shows activity without compounding; broaden Stage 1 and one sophisticated loop burns the budget while the dozen-simple-loops counterfactual compounds past it. At the moment of punishment, the label: *this curve is the author's bet, drawn* (§4.5 flags staging as a principled proposal, and the book says so right here, not three chapters later). Model dissent included. The froot before/after table ● as the N=1 answer key; harness engineering cross-referenced as the Stage 0 literature. *Covers: §3.4 (+§4.2 seeded).*
- **Ch 17 · The steward.** The reallocation (high-volume middle → both ends) as a static signaled diagram. The four human-factors failures Ⓔ from aviation and medicine, taught with the **rubber-stamp divergence chart**: approval rate visibly parting company with sampled deep-review agreement as queue exceeds budget — the literature's finding rendered as the instrument that catches it, no gotcha required. The defenses are terrain, not willpower: triangulation, rotation, practice cases (two administered, here, even though none arrived), budgeted upstream time. *Covers: §3.5.*
- **Ch 18 · Gate, rate, budget.** The **Gate Console** (§6.9): the handbook's exact scenario — 30-approval budget, dep-patch eating 18 at 96% — with the budget slider visibly locked (*stewards aren't supposed to work harder; they're supposed to place the gates better*). Both queue pathologies rendered as signals, not solutions. The 99.7% curveball: a rate the console cannot interpret alone; the reader must open the triangulation panels to find it hollow. Shadow-gate blocker strings ●. *Covers: §3.6.*
- **Ch 19 · Trust.** The **Trust Ledger** (§6.10): the prediction-first model swap — the panel's single best teaching minute — plus the five properties as mechanisms, the authority ladder (read/write/commit/deploy/external as five separate grants), the irreversibility card sort (*undoing costs more than not doing*, including the information-release cases), the four ways trust comes apart as an identification drill, and froot's failure-disposition asymmetry ●: advice fails open; authority fails closed. *Covers: §3.7.*
- **Ch 20 · Measurement, correctness, security.** The **Goodhart bench** (mechanism register: pick one target metric, watch it gamed; add two independent metrics and the gaming becomes visible cost). The reserve-for-judgment list as deliberately non-instrumented panels — gauges with no number, on purpose. Then §3.9 mostly in prose, as the handbook holds it: behavioral vs specified tests as one paired artifact (same test, two markings, different meanings); security as a *separate* trust ledger re-skin (clean functional record meets an injection-prone surface its record never covered); adversarial pressure on outputs at agent cadence; the Böckeler gap named as a gap. The oracle-strength slider as a Ⓦ field extension ●: a loop earns autonomy only as far as its oracle can be trusted. *Covers: §3.8, §3.9.*
- **Ch 21 · Where this doesn't work.** The **Decline Drill**: engagement cards on novel surfaces (not §3.10's four verbatim) where the reader chooses full MHE / tight-gates MHE / decline, commits, and gets the handbook's reasoning argued. The single-expert-plus-one-agent mode honored as the other mode, not a lesser one. The capable-single-agent future acknowledged plainly. Transfer training against over-application, treated as a first-class skill. *Covers: §3.10.*
- **Ch 22 · The checkride, and Monday morning.** The capstone (§6.11): foreign terrain, twelve steward actions, terrain-only instruments, a debrief memo generated from the reader's own event log, assembling into the copyable **Monday-morning memo**. Then the blank worksheet against the reader's real repo, engine-sanity-checked. *Covers: §3.11.*

**Act V — The glass case** (~25 min)
- **Ch 23 · Provenance.** The lineage map, static and signaled (taxonomies don't need animation): ten traditions, each weighted; every badge in the book funnels here. The §4.4 evidence-weight distribution as the chapter's one instrument: structural claims clustering strong, operational recommendations strong-to-mixed, nothing resting on sparse. Harness engineering: the 2026 chronology as a dated timeline; the scope relationship (a harness is the per-agent layer of terrain) as one clean strata diagram; "where it is more developed, this framework defers to it," verbatim. *Covers: §4.1, §4.2, §4.4.*
- **Ch 24 · The backbone, held honestly.** Each mathematical result as a card: what the theorem proves, which bench borrowed its shape, and a plain sentence on where the bridge is informal. Each card's glass flap opens the *toy form the book's engines actually implement*, so the gap between the math and the model is itself visible. A standing line: these engines show shapes, not thresholds; no bench in this book predicts a real system's critical values. *Covers: §4.3.*
- **Ch 25 · Open questions, the sort, and the coda.** The §4.5 open questions as **unbuilt benches**: grayed frames, empty trace panes, one line each on why no honest engine can exist yet (phase-transition thresholds; trust transfer across model upgrades; long-term skill atrophy) — a book that simulates what it asserts must conspicuously not simulate what it cannot. Then the **Evidence Sort**, the epistemic capstone: the reader sorts the book's own claims onto the three shelves, compared against the author's sort, deltas argued. One disclosure, where it is true and checkable: this book lives in a repository patrolled by the loops it describes (lab-fidelity, content-accuracy, theme-parity); the reader can go look. The coda names the one idea — placement is the craft; the considered yes is the moment work becomes real — and hands over: the handbook PDF, Ostrom, Brand, the harness-engineering corpus, and the reader's own memo. *Covers: §4.5, Coda.*

**Coverage audit.** Part I: Ch 0–3. §2.1: Ch 3/6/8 + Ledger Index. §2.2: Ch 4. §2.3: Ch 5. §2.4–2.5: Ch 6. §2.6–2.7: Ch 7. §2.8: Ch 3 + 8. §2.9: Ch 9–10. §2.10: Ch 11. §2.11: Ch 12. §2.12: Ch 13. §3.1: Ch 1/14. §3.2: Ch 14. §3.3: Ch 15. §3.4: Ch 16. §3.5: Ch 6 + 17. §3.6: Ch 18. §3.7: Ch 19. §3.8–3.9: Ch 20. §3.10: Ch 21. §3.11: Ch 22. §4.1–4.5: Ch 16/23–25. Front matter and coda: Ch 0, 25. No silent gaps.

---

## 6. The signature interactives

Ten, plus the Bench grammar itself. Each obeys the constitution, the five-part lab contract, and the Bench rules; each names its register.

**6.1 The Bench** *(grammar; used ~35 times).* Specified in §3. The discovery, repeated until it is a reflex: the artifact is the decision; the trace is its bill.

**6.2 The Placement Bench** *(Ch 5; mechanism on the axes, argued on the verdicts).* State: a placement-record artifact (decision, three axes, verdict); the quadrant board with the danger zone cued hardest; a case card with **evidence to inspect** (what undo costs, spec stability, what moves when this moves). Sequence per the worked-example literature: auth-system and dep-bump fully worked *side by side* first (analogical encoding: the shared schema emerges from comparison), then backward-faded cases, then the drill. The reader sets axes (committed), places, and the engine runs the decision both ways over 50 ticks where the dynamics are mechanism-register (the steward queue silting under planned dep-bumps; the leaked credential under emergent auth — the information-release case made vivid). Mis-estimated axes are shown against the hidden ground truth; verdicts are argued. Danger-zone cards refuse to run until the reader makes the decision reversible or legible first ("shrink the blast radius" / "write the contract") — the quadrant as an action item, not a label. Discovery: two readers who disagree what auth *ought* to be agree where it sits; the axes did the arguing.

**6.3 The Signal Field** *(Ch 8; mechanism register).* State: the repo graph; per-region signal intensity as heat; agents selecting work weighted by signal with an exploration floor; knobs for spread/decay/reinforcement/exploration; readouts named in framework vocabulary (variety index, signal-to-noise, lock-in detector); an outside-reference toggle (CI ground truth) whose severing hides the truth line — the reader sees only the system's self-report, which is the point. One guided appearance, four tasks, each freezing all but one or two knobs, each with a committed prediction. Discovery: three rates determine everything; the qualitative flip is real and findable.

**6.4 The Runaway set piece** *(Ch 9; mechanism register).* The Signal Field re-skinned as a retry storm with the same physics. Phase A: "clear the backlog faster" with only reinforcement-flavored controls; most honest attempts storm; commit an explanation before the name. Phase B: the four lamps flip live as remedies apply — inject variety, raise decay, restore the outside reference, tighten trust, evacuate-and-restart — and the restart-the-agent button does its one-tick failure. Phase C: the same engine wearing two more skins (citation loop, eval drift) as captioned recorded runs in a compare-contrast grid with identical phase dials. Discovery: one parameter family under every runaway you will ever see; the remedy family is short and always terrain-shaped.

**6.5 The Spec Gap** *(Ch 10; mechanism register).* State: a 24-assertion spec; a drift stream invalidating 1–3 assertions per event; integration cadence (big-bang ↔ weekly ↔ continuous); a spec-revision budget; an executable-contracts toggle. The mechanic that carries it: with contracts off, hidden rework accumulates *invisibly* and the single integration event renders as a cliff — the reader could not see the rot, and that blindness is the lesson. Run 2 applies the structural remedies; same drift, no cliff. Worker quality and effort sliders are present and useless: the spiral is insensitive to heroes. Discovery: the planned spiral is spec-update-rate < reality-change-rate, and every remedy is structural.

**6.6 The Guardrail Grader + game day** *(Ch 11–12; mechanism register).* Predict five-axis grades for four realistic guardrails (committed), run the seeded failure storm, read predicted-vs-measured. The 95%-approval review gate grades out as rubber stamp; the 10×-peak rate limit as decorative; the dependent circuit breaker fails exactly when needed. Game day: pick a removal, run it, sort the outcome into hidden-dependency vs not-load-bearing; leave with a fragility map. Discovery: grading reveals guardrails doing less than they appear; subtraction reveals what addition concealed.

**6.7 The Triage Deck** *(Ch 13, re-dealt in 17 and 21; perceptual drill).* A deck of ten-second panel traces — the five health gauges animating over a compressed fortnight — with five answer chips: healthy / emergent runaway forming / planned stall / hybrid theatre / over-stabilized. High surface variability (many domains, the Kellman recipe), commit before reveal, mechanism-pointing feedback ("escalations went to zero while throughput held; silence is not health"), missed categories resurface in later deals. Discovery: the signature is readable at a glance long before it is provable, which is the steward's actual working condition.

**6.8 The Six-Ingredient Bench + specimen diagnosis** *(Ch 14; mechanism register + real corpus).* The dep-patch loop as a machine of six removable stanzas; pull one, predict from the table, run thirty days: no verification → self-approval and the confidence/quality lines cross (Goodhart, drawn); no signal-update → amnesia; no reversibility → one bad merge ossifies and review depth rises on everything after; no bounded action → blast radius outgrows the reasoning that approved it; no authority surface → one global trust switch, flipped once in panic, kills every class. Then the diagnosis deck on the real anonymized specimens with cited feedback. Discovery: script-vs-loop is a checkable condition, and the missing ingredient predicts the failure.

**6.9 The Gate Console** *(Ch 18; mechanism register).* Per-class inflow, approval histories, gate positions; one locked budget; the governing inequality as a live constraint bar; the rubber-stamp drift function (Ⓦ-flagged on the spot as a modeling choice) driving the divergence chart. Fix the saturated week without the locked slider: move the 96% class below the gate with 10% sampling and watch ~15 approvals flow back, visibly funding the new on-call class or upstream time (a first-class budget line). Or leave it saturated and choose which pathology to watch. Then the 99.7% curveball: trust or rubber-stamping? The console alone cannot say; triangulation panels (sampled deep review, post-merge defects) can. Discovery: queues are signals; the budget is the constant; the gate is the lever; and an instrument's limits are part of reading it.

**6.10 The Trust Ledger** *(Ch 19, security re-skin Ch 20; mechanism register).* A ledger of environment-stamped rows per class; a gate policy artifact; injectable events. The centerpiece, prediction-first: *the judge model is upgraded to a strictly better one — what happens to earned auto-merge?* Commit. The swap fires. Every class drops to propose-only, zero failures having occurred; the counterfactual run (reset disabled, fast-forward) surfaces the defect cluster weeks later. Then: permission expansion cold-starts only the new surface; an idle class sags toward expiry; one revert triggers instant revocation. The authority ladder as five separate grants with blast radii. Discovery: the five properties are mechanisms, not virtues; the environment is part of the trust; a reset without failure is information, not punishment.

**6.11 The Checkride and the Monday memo** *(Ch 22; the outcome measure).* A fresh terrain that is deliberately foreign (a data/ML pipeline shop), seeded with six embedded problems: one mis-placed decision, one open loop posing as closed, one forming spiral, one saturated budget, one stale trust grant, one decorative guardrail. The full instrument set from the book; a hard budget of twelve steward actions (scarcity is the curriculum); every action terrain-only. No score: the debrief is a memo generated from the reader's own event log, problem by problem — what you did, what it caused, what the handbook would say, and a section for what you never found. The reader's choices assemble into the **Monday-morning memo**: their placement map, first-loop spec (six ingredients filled in), gate table, irreversibles list, disturbance schedule — copyable plain text, the one artifact the book claims is carryable to work, because it is. An engine sanity-check flags the classic errors (an irreversible action with no human gate; a loop with no update block gets the amnesia warning).

---

## 7. The judgment system

**The case bank is workstream one.** Every transfer claim in this design routes through it, and the bake-off's unanimous finding was that everyone under-budgets it. Target **~40 excellent cases** (placement 14, spiral recognition 8, is-it-a-loop 6, gate moves 5, trust resets 4, decline 5), each with axis-by-axis rationale, several explicitly contested, several near-misses (the reversible-looking deletion whose released information can't be recalled; the healthy backpressure loop that looks like a storm), surfaces varied far beyond dependency bumps. Sourced from the public postmortem record, the real specimen corpus, and adversarial review — every case attacked before it ships. The bank is built and playtested alongside the first engines, not after the prose.

**Three drill systems** run as rails: placement calls (Ch 5 onward), spiral/health recognition (Ch 9/13 onward), and economic tuning (Ch 18 onward). **Faded worked examples** on exactly those three skills: full reasoning trace → partially faded → bare case. **Retrieval rails** close most chapters: two to four case-shaped committed prompts, at least one reaching back two or more chapters, none glossary-shaped, all skippable without penalty. Commitment moments are budgeted (~10–12 book-wide, reserved for the genuinely counterintuitive: the model-swap reset, the storm threshold, the absent orchestrator, the gate-move arithmetic). Two cognitive gates total (the remedy palette after the caused storm; the fork bar unlocking after each bench's first guided pass), each with a quiet "show me anyway."

Misconceptions, scheduled (design-time artifact, invisible on the page): **patch-the-agent / someone-is-driving** (confronted Ch 3, re-confronted Ch 9 and 15), **trust transfers** (Ch 19, re-confronted Ch 20's security ledger), **stability is health** (Ch 12, re-confronted Ch 13's silence-is-not-health), **a script that runs is a loop** (Ch 1, re-confronted Ch 14), **the framework applies everywhere** (Ch 21, re-confronted in the checkride's decline problem). The stale priors this audience does not hold (more-agents-means-faster, automation-shrinks-the-human-role) get a thirty-second nod, not a confrontation; strawmen condescend.

---

## 8. Epistemic honesty as interface

One system, introduced in Chapter 0, present everywhere, resolving into Act V:

- **Claim badges** — Ⓔ evidence / Ⓦ working principle / Ⓜ metaphor — on load-bearing claims (dozens, budgeted; not ninety ambient chips that train banner-blindness). Tappable: one-line provenance, deep link to the glass case.
- **Provenance marks** — ● documented-real / ○ constructed-for-teaching — on every incident and specimen.
- **Model notes** on every bench: simplifications, tuned constants and why, the register, and *what this cannot show*.
- **The glass flap**: the verbatim engine rule, raw-imported, on every lab.
- **Model dissent** on every bet-register figure: the parameterization where the author's claim fails.
- **The register split** itself (§2): experiments where the evidence is, worked bets where it isn't.
- **N=1 banners** on all field material, including its warts — the unwired canary, the stale footer, trust starving at tiny volume — presented as what mid-transition actually looks like.
- **Unbuilt benches** for the open questions: the honest visual for "no engine can exist for this yet."
- **One prominent early entry**, stated in Chapter 0's model-notes introduction and repeated in the glass case: **what these simulations prove: nothing.** They demonstrate dynamics the framework predicts, with constants chosen so the regimes are findable in minutes; the evidence lives in the cited record.
- **The Evidence Sort** as the book's last exercise: the reader demonstrates the one habit Part I exists to produce — asking *what layer is this claim at?* — including about this book.

---

## 9. Voice, identity, and the reader's time

**Voice.** Glassbox second person crossed with Go-by-Example terseness. Stakes before mechanism; concrete numbers always ("18 of your 30 approvals on one class"); short declaratives planted among long sentences; one pull-quote-grade distillation per chapter ("A script is a loop that forgot to close." "Silence is not health." "The approval is the visible act; the terrain is the work."). Prose never describes what a figure shows; it directs noticing ("watch the deep-review agreement line as the queue passes the budget") and resumes from what the reader just did. Causal connectives carry the arcs; "and then" is banned. The substrate is never re-taught: not one paragraph on what CI or a PR is. Expertise reversal is a hard constraint, and the respect is part of the voice.

**Identity.** Slug `many-hands`, class prefix `mh-`, one catalog entry, declared in COLLECTION.md as the collection's first **book** (a new declared tier, ~3.5 h, with per-chapter minutes). World: *the steward's bench* — a quiet ops floor at night; PR cards, CI rows, queue lanes, ledgers; contour-line paper texture as the one whisper of "terrain." Native dark ("the ops floor at night"), light complement ("the morning handoff") as a full override block, both loop-audited. Accent: **approval green** (the color of the considered yes), with held-amber and a guarded runaway-red reserved exclusively for spiral states — semantic constants book-wide. Display font: **Besley** (a sturdy slab, ledger-like without pastiche, unclaimed in the collection); JetBrains Mono untouched as family glue. Eyebrow: `SULLIVAN · 2026 · THE HANDBOOK, RUN`. Hero: **The Considered Yes** — the terrain rendered as a living contour map, loops as closed circuits, signals pulsing and fading; once per cycle a PR card slides to a gate, CI dots verify, and a small human glyph stamps the approval, tiny against the terrain; the status line carries the inversion: *the approval is the visible act; the terrain is the work.* Reduced motion: frozen at the gate moment, all five loop stages labeled.

**The reader's time.** Minutes in every header; the fast path marked; full random access (hash deep-links; every chapter boots standalone); every figure legible at rest; recorded-run mode with captions on every interactive (also the reduced-motion strategy); decision cards and the Bench Index as the primary product for the returning engineer; no scroll-driven animation anywhere; mobile stacks artifact-over-trace and survives 360px. No points, no streaks, no completion theater. Assume the book will be half-read and returned to, and be the best half-read book in the genre.

---

## 10. Glassbox fit and build plan

```
src/lessons/many-hands/
  index.js                  # re-export
  ManyHandsLesson.jsx       # composition root; act nav; React.lazy per act
  many-hands.css            # .mh- prefix; Besley display; approval-green accent
  components/               # Bench, BenchArtifact, BenchTrace, GlassFlap, Badge,
                            # ProvenanceMark, ModelNotes, DecisionCard, FieldSpecimen,
                            # Drill, LedgerIndex, BenchIndex, ActNav, Hero
  sections/act0 .. act5/    # Ch 0–25 prose
  labs/                     # PlacementBench, SignalField, RunawayLab, SpecGap,
                            # GuardrailGrader, GameDay, TriageDeck, IngredientBench,
                            # GateConsole, TrustLedger, Checkride, MondayMemo,
                            # EvidenceSort, FingerprintDrill, StrataRouter, Ratification
  engine/
    rng.js                  # mulberry32, seeded
    loopstep.js             # five-stage effects-as-data machine (froot-shaped)
    field.js                # signal physics: spread/decay/reinforce/explore + gain
    econ.js                 # gate/rate/budget queueing + rubber-stamp drift (Ⓦ-flagged)
    trust.js                # env-stamped ledger, five properties as code, authority grants
    spec.js                 # divergence vs amendment, integration batching, hidden rework
    commons.js              # shared-resource quality, decay schedules, removal experiments
    cases.js                # the case bank: items, axis evidence, scoring, resurfacing
    replay.js + scenarios/  # recorded-run builders; checkride generator + debrief writer
```

- **Gates:** engines ≥90% on all four metrics with pinned canonical traces; an acceptance spec per signature lab (commit a prediction → run → assert the machine advanced and the reveal unlocked → zero console errors; swap the model → assert every class resets; move the gate → assert the queue drains; finish a checkride fix → assert the debrief cites it); axe + reduced-motion + 360px + both themes contrast-audited from day one. The glass flaps use raw-source imports so shown code is run code; the repo's lab-fidelity, content-accuracy, and theme-parity loops are the book's standing verification terrain. The book is built the way it says software should be built, and says so once, where it is checkable.
- **Build order (insight-through-making):** Tier 1 — `loopstep`, `econ`, `field` + Hello Loop, the Gate Console, and the Runaway set piece as the vertical slice, played hard before prose is finalized (the Polygons lesson: the authors' own play generates the content; expect the engines to teach the author things the prose must then include), with the case bank's first twenty entries written alongside. Ship Acts 0–I. Tier 2 — `trust`, `spec`, `cases` complete; Acts II–III. Tier 3 — the checkride, the glass case, identity polish, the COLLECTION.md declaration. Acts publish progressively under the single slug; the rail grows honestly ("Act IV in progress").
- **Cut order if the budget contracts:** re-skins and supporting labs first (recorded runs with captions are the cheap honest fallback), canonical signature runs never, the case bank and drills never — the drills are the thesis.
- **Cost honesty:** by Distill and Ciechanowski rates, ten signature labs plus eight engines plus forty cases is months of focused work. The Bench component family amortizes hard (one grammar, ~35 instances), recorded runs are the default delivery, and the act-shippable ordering means the book is never more than one tier from a coherent public artifact.

---

## 11. What the book refuses to do

- **No fiction.** No named coworkers, no plot, no year-spine pretending to be one continuous history. A composite terrain, declared composite in one paragraph. Artifacts over scenes; a cast costs authority with this audience, and a claimed-continuous world whose chapters are independent seeds would fail the book's own hybrid-detector test.
- **No agent-commanding controls** (the terrain law). One staged exception, greyed out, on purpose.
- **No behavioral gotcha traps.** No planted defect floods, no entrapment reveals. The automation-bias lesson lives in the Ⓔ literature and the rubber-stamp divergence chart. A suspicion cascade would de-naive the reader and poison every later commit-before-reveal.
- **No strawman twins.** No terrain-less shop built to collapse, no orchestrator built to die. The contrast comes from trace-the-cause, the channel arithmetic, and the documented postmortem record (Ⓔ).
- **No hypothesis-tier discovery mechanics.** Staging, placement taxes, and spectrum co-variance are worked models with dissent, labeled as the author's bet at the moment of payoff. A felt cost-curve outvotes any badge; the register split is the defense.
- **No scored verdicts on contested judgment.** Argued feedback, contested cases marked contested, hidden ground truth only on the empirical axes.
- **No Ostrom toggles, no knob farms.** Governance is not a switch; the fingerprint drill teaches more at a tenth the fiddle. Tasks freeze all but one knob or the figure goes static.
- **No gamification, no spaced-repetition system, no AI tutor, no scroll-driven animation, no free-text gates.** Quiet tallies at most. The medium looks calmer than it is; the benefits are delayed, and the book says so.
- **No load-bearing biology.** The ant mill is one Ⓜ-chipped margin card. The substrate is CI, PRs, retries, queues, evals, deploys — the reader's native perceptual world.
- **No re-teaching the substrate**, and no pretending the sims are evidence. "What these simulations prove: nothing" is in the book, early and verbatim.

---

## 12. Risks, and the calls reserved for you

**Risks.** (1) Scope: months of work; mitigated by the one-grammar amortization, recorded-run default, act shipping, and the cut order — still the dominant risk. (2) Case-bank quality: the book's actual product, and the hardest authoring; mitigated by building it first and reviewing it adversarially; if the cases ship thin the book is a tour, and the tour already exists as a PDF. (3) Toy-model authority: even badged and dissented, a running model persuades beyond its warrant; the register split, glass flaps, and Evidence Sort are the defense; residual risk is real and is the price of the form, watched not solved. (4) Grammar monotony across 22 chapters; mitigated by varying the interaction register inside the grammar (steppers, twin runs, drills, graders, one worksheet) and letting Acts 0/V breathe as prose. (5) The terrain law may frustrate before it teaches; the Ch 9 pressure-valve button must land as insight, not trick — a named playtest question.

**Calls reserved for you** (taste, or contested in the bake-off): the title (working: *Many Hands*; alternatives: *The Steward's Bench*, *The Considered Yes*); the display face and accent (Besley + approval green proposed; the collection's grammar gives you the veto); whether the fast path is marked in the rail or kept to the front matter; whether the Evidence Sort ships in v1 or lands with Act V; and whether the book's first public release is Acts 0–I (a 40-minute coherent artifact) or waits for Act III's economics chapters, which are the book's strongest case for existing.

---

## 13. How this design was derived

Process note, for provenance. The MHE source was read in full, firsthand. Six parallel reviews fed the design: the dead `interactive-guide` branch (an ant-foraging sim plus ~20 mostly-static cards — the negative template: metaphor-first, decoration-heavy, single-file), the Glassbox codebase and conventions, froot (MHE in production, with its honest warts), the agents-survey corpus (~50 real scripts diagnosed against the six ingredients), the explorable-explanations practice record (Victor, Case, Matuschak/Nielsen, Distill's postmortem, Ciechanowski, Red Blob, Go by Example), and the learning-science evidence base (worked examples and expertise reversal, cognitive load, productive failure's boundary conditions, guided vs pure discovery, multimedia principles, analogical encoding, perceptual learning, far transfer, and Chi 2005 on emergent-process misconceptions — the single most design-shaping finding). Five independent designers then produced full competing books under different pedagogical lenses (worked-artifact, simulation-first, narrative, learning-engineering, free-form); each was adversarially critiqued; three judges (master teacher, skeptical staff engineer, creative director) unanimously ranked the worked-artifact skeleton first and the free-form design's two laws second, and converged on the same structural disease and its fix (the register split). This document is the synthesis: the exemplar's body, the wildcard's constitution, the curriculum's rigor, the simulation's set pieces, the narrative's provenance marks — and the kill list applied to all five.

The design holds itself to the handbook's standard: its invariants (the two laws, the register split, argued judgment) are planned; everything else is emergent under playtesting, and the book should say so about itself, once, where it is checkable.
