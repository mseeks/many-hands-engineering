# PAGES.md — the second edition law and page briefs

Edition 1 failed its reader: it was a wall of text, harder to read than the handbook it
teaches; most labs were prose stuffed in a frame, several didn't work. Edition 2 inverts
it. **The activity is the page. Prose is rationed. Everything works, proven in a browser.**

## The law (hard gates, enforced)

1. **Prose budget.** `node scripts/prose-budget.mjs src/pages/PNN.jsx` must pass: ≤230
   visible words outside `<Deeper>` folds (this includes the claim, captions, button
   labels). Depth, nuance, handbook tables, specimens, and provenance live INSIDE
   `<Deeper>` folds — as much as needed there, organized, scannable.
2. **Activity first.** The page anatomy is fixed: `<Page n claim>` → `<Activity>` (the
   centerpiece) → `<Seen>` (1–2 sentences) → `<Takeaway>` (one line) → 1–3 `<Deeper>`
   folds. Nothing else. No paragraphs between header and activity.
3. **Visual, not verbal.** The centerpiece is a drawn scene — an SVG diagram/animation or a
   live chart driven by an engine — never a row of buttons with text readouts. If a concept
   needs explaining, draw it; if a control changes nothing visible within ~300ms, delete it.
   Max 4 controls visible at once. One interaction idea per page.
4. **It works, proven.** Before finishing you MUST verify your page in a real browser
   against the dev server (http://localhost:5173/#p-NN): write a throwaway playwright
   script (node, `import { chromium } from 'playwright'`), drive your primary interaction,
   assert (a) zero console errors, (b) the interaction visibly changes state (assert on a
   DOM/text change), (c) commit-gates can't be bypassed where you use them. Delete the
   throwaway script after it passes. A page without this proof is not done.
5. **The constitution stands.** Terrain law (no control commands an agent; the one greyed
   "restart the agent" button on page 06). Glass law (a compact `<ModelNotes>` drawer with
   `glass` source inside the Activity, collapsed). Register split (bet-register figures are
   recorded runs labeled "the author's bet, drawn", with dissent). Argued judgment (never
   "wrong"; argue from axes/warning signs). Epistemic badges Ⓔ/Ⓦ/Ⓜ and ●/○ marks, mostly
   inside folds. The ant mill: one Ⓜ card, page 06's fold, nowhere else.
6. **Fidelity.** Your page's handbook sections (named per brief) are the content source:
   read them in `../many-hands-engineering.typ` before building. Compress, never distort.

## Tools you have

- `src/components/page.jsx` — `Page, Activity, Seen, Takeaway, Deeper` (the anatomy).
- `src/components/kit.jsx` — `Badge, Mark, FieldSpecimen, ModelNotes, Commit, Walkthrough,
Artifact, Quadrant, Drill, Term, glassSlice` (reusable; their CSS is refreshed).
- `src/engine/*` + `src/engine/scenarios/*` — tested, deterministic; the truth. Import
  freely; raw-import for glass flaps.
- `src/labs/*.jsx` — EDITION-1 LABS, judged texty and partly broken. Salvage engine wiring
  and SVG fragments selectively; never copy paragraphs or LabFrame structure.
- CSS classes in `src/styles/book.css` (only file; never edit it). Inline styles fine.
  Charts/scenes: hand-rolled SVG, viewBox-scaled, CSS-animated or stepped; gate rAF loops
  with `usePrefersReducedMotion` from `src/shared/`.
- Cast colors: `var(--c-deppatch)` amber, `--c-security`, `--c-docs`, `--c-flaky`,
  `--c-deadcode`, `--c-backfill`, `--c-triage`, `--c-disturb`.

## Page briefs

Every page file: `src/pages/PNN.jsx`, default export `PNN`. The `claim` prop is ONE
sentence. Folds named below are required; add at most one more.

**P00 · Read me first** — claim: the book in one line (build the thing that builds the
thing) and how to use it. Activity: the hero — an ambient SVG ops-floor: contour terrain,
3 loop circuits pulsing in cast colors, signals fading, a PR card sliding to a gate where a
small human glyph stamps it (CSS keyframes; the static frame IS the stamp moment). Below
it, the three badge chips Ⓔ/Ⓦ/Ⓜ and ●/○ as a one-line legend the reader can hover.
Seen: the approval is the visible act; the terrain is the work. Folds: "What kind of book
is this" (the two laws, fast path, AI-assistance note, "What these simulations prove:
nothing."), "Vocabulary crosswalk" (planned/emergent↔cathedral/bazaar, signal↔pheromone,
terrain↔harness as a small table). Covers handbook front matter + Part I stance.

**P01 · Hello, Loop** — claim: a loop is five stages that close. Activity: a drawn
pipeline — five stage nodes (signal→action→verify→commit/revert→update) as a circuit with
an animated PR token moving through on Step/Run; CI light green/red; ledger dots accruing.
Controls: Step, Run, "CI: green|red" toggle, and the fork "delete `update:`" which splits
the view into two small review-cost sparklines (falling vs flat — the amnesia bill).
Engines: `loopstep`, `scenarios/helloLoop`. Folds: "The six ingredients" (handbook table),
"A real bump PR" (FieldSpecimen ●, froot PR body). Covers §3.1, §3.2.

**P02 · Nobody calls anyone** — claim: the coordination is in the environment; there is no
controller to find. Activity: a drawn repo graph (region tiles) with 5 loop glyphs around
it; a Commit first ("point at the thing that decided this") then click any event in a
10-event strip → the causal chain draws backward as glowing arrows, every hop labeled READ
or WRITE, never CALL; the zod event included. Engine: `scenarios/traceCause`. Fold: "Why
shared-environment scales" (N vs N² with a tiny two-mode mesh drawing, Ⓔ). Covers §2.8
topology, §3.3 composition.

**P03 · The spectrum** — claim: ten properties move together; halfway mixes are theatre.
Activity (register: bet): ONE big slider planned↔emergent; ten property chips (authority,
knowledge, spec role, integration, verification, coupling, coordination, failure,
strength, weakness) sliding in lockstep as labeled tokens on tracks; a "force a halfway
mix" button lights a governance-theatre lamp. Label: the author's bet, drawn; dissent note
inside the fold (the mix that holds). Fold: the full §2.2 table. Covers §2.2.

**P04 · Placement** — claim: three empirical questions place any decision; the verdict
follows. Activity: the Quadrant board with the red danger zone; a deck of 8 placement
cases from `cases.js`: per case, evidence chips to inspect, three axis toggles
(reversibility/legibility/coupling), commit on the quadrant → argued feedback; axis
mis-estimates shown against hidden truth; danger-zone cases demand "shrink blast radius"
or "write the contract" first. Engines: `cases`. Folds: "The three questions" (§2.3),
"Five ways planned and emergent compose" (§2.4 pattern cards). Covers §2.3–2.4.

**P05 · Signals** — claim: spread, decay, reinforcement — three rates decide everything.
Activity: the field as a heat-tile grid of repo regions with agent dots flowing toward
signal; THREE task chips (saturate it / lock it in / find the flip), each freezing all but
one slider; live variety + signal-to-noise readouts named in framework words ("reinforcement
outran decay"). Engine: `field`. Folds: "The four forces" (§2.1), "Real math, informal
bridge" (§4.3 caveat, Ⓜ-with-real-math). Covers §2.1 forces, §2.8.

**P06 · Runaway** — claim: reinforcement without counter-force; the fix is in the terrain.
Activity: retry-storm scene — services as nodes, queue bars rising, amplification dial
crossing 1.0; reader tunes retries/backoff/jitter to survive a spike (Commit first:
"which setting survives?"); after the storm, four lamps (decay/variety/outside
reference/net) + remedy chips, INCLUDING the prominent "RESTART THE AGENT" button that
dips one tick, resumes, then greys out captioned "the problem is in the terrain."
Engine: `field.runStorm/applyRemedy`. Folds: "Same spiral, other skins" (citation loop,
eval drift as two compact Walkthroughs), "Warning signs" (§2.9 table + the ant-mill Ⓜ
card — its only appearance). Covers §2.9 emergent.

**P07 · Spec rot** — claim: when reality changes faster than the spec, the cliff is
invisible until integration. Activity: an area chart drawn live — valid assertions
declining, WIP rising, hidden rework NOT drawn (a "?" band) until the integration tick
reveals the cliff; controls: cadence dial (big-bang/weekly/continuous), executable-contracts
toggle (rework becomes visible weekly, no cliff), and an effort slider that visibly does
nothing. Engine: `spec`. Fold: "Hybrid failures" (claims vs decision logs, the honest
test; Denver/NPfIT/Healthcare.gov ● cards). Covers §2.9 planned + hybrids.

**P08 · The commons** — claim: shared substrates degrade without governance — not from
villainy, from absence. Activity: fingerprint drill — six sparkline traces
(quality/noise/cruft) from `commons.fingerprintScenarios()`; per trace, commit "which
principle is missing?" from chips → argued feedback citing the tell. Fold: "Ostrom's
eight" (Ⓔ table) + "The goal, restated" (the metric swap: autonomous:supervised ratio,
reversibility of the average change). Covers §2.6–2.7.

**P09 · Guardrails** — claim: grade a guardrail before trusting it; most do less than they
appear. Activity: 4 guardrail cards each with five small predicted-grade dials the reader
sets (coverage/latency/blast/false-positive/recovery), then "run the storm" → measured
dials swing next to predictions; the 95% review gate reads rubber-stamp, the 10× limit
decorative, the dependent breaker fails mid-storm (its node physically tied to the service
it guards). Engine: `guardrails`. Fold: "Four classes, four questions" (§2.10). Covers §2.10.

**P10 · Disturbance** — claim: remove things on purpose; subtraction reveals what addition
concealed. Activity: a terrain shelf with removable pieces (a tool, a context file, a
signal); pick one, commit collapse-or-adapt, run → story plays as 4 trace steps; fragility
map fills in across attempts. Engine: `commons.removalExperiment`. Fold: "The cadence"
(daily→quarterly table; over-stabilization warning). Covers §2.11.

**P11 · Alive** — claim: a healthy system has a readable signature. Activity: the triage
deck — five animated gauges over a compressed fortnight (reduced-motion: final frame);
five answer chips (healthy/runaway forming/planned stall/theatre/over-stabilized); commit →
feedback quotes the tell ("escalations went to zero while throughput held; silence is not
health"); 6 deals, missed categories re-dealt. Engine: `scenarios/triage`. Fold: "The five
signs" (§2.12). Covers §2.12.

**P12 · Six ingredients** — claim: script vs loop is a checkable condition; the missing
slot predicts the failure. Activity: the loop as a six-part machine drawing; pull any part
(click to eject it) → commit a prediction → 30-day consequence sparkline + one-line named
pathology (amnesia / self-approval / ossified mistake / scope creep / wrong fires / global
flip). Then a 4-specimen mini-deck (real scripts ●: the leashed bumper, the stdout mapper,
the game-tick loop, the oracle with no loop) — mark the empty slots. Engines: `loopstep`,
`cases` (loop kind). Folds: "Field specimens, verbatim" (KNOWN-CONTEXT archaeology, the
sonnet confabulation incident ●). Covers §3.2–3.3 boundary.

**P13 · A dozen loops, one ladder** — claim: the platform grows by adding loops, not by
making one smarter. Activity: the bestiary wall — 13 loop cards (cast-colored glyphs,
starter/middle/advanced bands); click any card → a 6-step recorded micro-run in a side
panel; beneath, the ladder (register: bet): the nth-loop cost curve stepping down through
stages 0–6 as a Walkthrough labeled "the author's bet, drawn", with skip-Stage-0 and
dissent variants as ghost curves. Engines: `scenarios/staging`, `scenarios/composition`.
Folds: "The catalog, in full" (§3.3 one-liners), "Harness engineering" (§4.2, the 2026
chronology), froot before/after table ●. Covers §3.3, §3.4, §4.2.

**P14 · The gate** — claim: the budget is the constant; the gate is the lever. Activity:
the console — class rows with inflow/rate, gate toggles, the LOCKED budget slider
(caption: stewards aren't supposed to work harder), the inequality as a balance beam
drawing, queue bars; the divergence chart (approval rate parting from deep-review
agreement) drawn live when saturated; the 99.7% curveball class whose hollowness only the
triangulation panel reveals. Engine: `econ`. Folds: "What goes wrong with the human" (§3.5
Ⓔ aviation/medicine; defenses are terrain), "Measure little, triangulate" (§3.8 + a tiny
goodhart sparkline pair from `scenarios/goodhart`). Covers §3.5, §3.6, §3.8.

**P15 · Trust** — claim: trust belongs to a class in an environment; change the
environment and it resets — with zero failures. Activity: the ledger — env-stamped rows
accruing on a timeline; Commit first ("the judge model upgrades to a better one — what
happens to earned auto-merge?") → fire the swap → every class drops to propose-only;
then three event chips (widen permissions / idle 90 days / one revert) each with its
distinct visible reset. Engine: `trust`. Folds: "Five properties, as mechanisms" (§3.7),
"Read is not write is not deploy" (authority ladder), "What counts as irreversible" (the
definition + card list). Covers §3.7.

**P16 · The edges** — claim: knowing where the framework does NOT apply is part of the
framework. Activity: the decline drill — 5 cases from `cases.js` (kind decline), chips:
full MHE / tight gates / decline → argued feedback; one case is genuinely contested and
says so. Folds: "Correctness and security" (§3.9: behavioral vs specified tests as two
small Artifact panes; security as a separate ledger; the named gap), "The other mode"
(one expert + one agent in flow, honored; the possible future, verbatim). Covers §3.9–3.10.

**P17 · Monday morning** — claim: pick one small loop and close it; the first loop is the
template. Activity: checkride-lite — a foreign terrain card (data/ML shop) with six
embedded problems; 12 terrain-only action chips and a budget meter; debrief renders from
YOUR action log (found/missed per problem, what the handbook says); then the Monday memo
assembles as copyable plain text (textarea + copy button). Engine: `scenarios/checkride`.
Fold: "Start here" (§3.11 verbatim counsel). Covers §3.11.

**P18 · The glass case** — claim: know which layer every claim lives on — including this
book's. Activity: the evidence sort — 12 claim cards sorted onto three shelves (Ⓔ/Ⓦ/Ⓜ)
by drag or chip; then the author's sort with deltas argued; ends on the distribution bars
(§4.4). Folds: "Lineage" (ten traditions, one line each), "The math, held honestly" (§4.3:
what each result proves, which page borrowed its shape, where the bridge is informal),
"Open questions" (§4.5 as grayed unbuilt-bench cards). Close with the coda lines: placement
is the craft; the considered yes is the moment work becomes real — and the thesis returned.
Covers Part IV + Coda. (Salvage from `labs/EvidenceSort.jsx` if sound.)
