# Style guide — voice, grammar, and frozen component contracts

This file governs every chapter, lab, and component. Read it whole before writing anything.
The book's design rationale lives in `DESIGN.md`; the canonical content source is the
handbook at `../many-hands-engineering.typ` — **read the sections your chapter covers, in
full, before writing prose. Content fidelity to the handbook is non-negotiable; voice is
this guide's.**

## The constitution (enforced, not aspirational)

1. **The terrain law.** No control in this book commands an agent. Every knob, slider,
   toggle, and forkable field is terrain: signals, decay rates, budgets, gates, boundaries,
   schedules, references. The one exception is the greyed-out "restart the agent" button in
   Chapter 9, which exists to fail.
2. **The glass law.** Every lab shows its physics: a `<ModelNotes>` drawer with a `glass`
   prop carrying the verbatim engine source (`import src from '../engine/econ.js?raw'` —
   slice to the relevant function with `glassSlice`). Every load-bearing claim wears a badge.
3. **The register split.** Every lab declares `register="mechanism"` (real dynamics the
   reader experiments on) or `register="bet"` (a worked model of the handbook's working
   principle). Bet-register figures are recorded runs, never free experiments, and say
   "this curve is the author's bet, drawn" at the moment of payoff, with a model-dissent
   variant where the claim fails.
4. **Argued judgment.** Drills never say "wrong." Feedback argues from the axes or warning
   signs; contested cases say so; commitment is clicks/drags only, never free text.

## Voice

Second person, present tense. Stakes before mechanism. Concrete numbers ("18 of your 30
approvals on one class"), never vague quantities. Short declaratives planted among longer
sentences; vary rhythm. One pull-quote-grade distillation per chapter. Prose **never
describes what a figure shows**; it directs noticing ("watch the deep-review line as the
queue passes the budget") and resumes from what the reader just did. Causal connectives
(so, because, but, therefore) carry the arcs; never "and then."

Never re-teach the substrate: not one sentence on what CI, a PR, a retry, or a deploy is.
The reader is a senior engineer; respect is part of the voice. Spend every word on the
judgment layer.

Banned words (house rule): leverage, robust, scalable, seamless, delve, deep dive, unlock,
empower, moreover, furthermore, additionally, "not just X but Y", "it is important to note".
Plain quotes, minimal em-dashes (use commas, periods, parentheses).

The ant mill may appear exactly once in the book (Chapter 9), as one margin card, badged Ⓜ.
No other biology anywhere. The substrate is CI, PRs, queues, evals, ledgers, deploys.

## Chapter anatomy (uniform)

Every chapter file: `src/chapters/act<k>/Ch<NN>.jsx`, default export named `Ch<NN>`,
rendered inside its act's `index.jsx` in registry order. Skeleton:

```jsx
import { Chapter, Lede, Pull, Badge, Coda, DecisionCard } from '../../components/kit.jsx';

export default function Ch05() {
  return (
    <Chapter n={5} covers="§2.3">
      <Lede>One-or-two-sentence stake: why this matters before any mechanism.</Lede>
      <p>…prose beats of 150–350 words between figures…</p>
      {/* labs imported from ../../labs/ */}
      <Pull badge="W">The placement is the decision; the implementation follows from it.</Pull>
      <DecisionCard
        title="Before you place a decision"
        items={[ '…the checklist an engineer needs at the moment of a real call…' ]}
      />
      <Coda line="The one idea to carry away." next="Where chapter N+1 picks this up." />
    </Chapter>
  );
}
```

Required beats, in order: cold open on something concrete (an artifact, a number, a
question) → guided figure(s) with prose handoffs → consolidation (the handbook's principle,
plainly stated, badged) → `DecisionCard` (skippable for pure-prose chapters only if the
design says so) → `Coda`. Retrieval rails (`<Drill>` with 2–4 cases, at least one reaching
≥2 chapters back) close most chapters from Act II on.

## Component contracts (frozen — implemented in `src/components/`)

All shared components are exported from `src/components/kit.jsx` (one barrel). Consumers
import only from the barrel. Props below are contracts; do not add required props.

- `<Chapter n covers>` — section wrapper: renders `<section class="mh-chapter" id="ch-N"
  tabIndex={-1}>`, the eyebrow (`CH 05 · 14 MIN · COVERS §2.3` from the registry), and the
  registry title as `<h2 class="mh-ch-title">`. Children follow.
- `<Lede>` — italic opening stake (`.mh-lede`).
- `<Pull badge?>` — pull quote (`.mh-pull`); optional badge letter `'E'|'W'|'M'`.
- `<Badge layer note?>` — inline epistemic chip: Ⓔ/Ⓦ/Ⓜ with `title` tooltip
  (layer names: evidence-backed / working design principle / organizing metaphor).
- `<Mark kind note?>` — `kind: 'real'|'made'` renders ●/○ with tooltip (documented-real vs
  constructed-for-teaching).
- `<FieldSpecimen source banner?>` — real-world artifact card (`.mh-specimen`); `source`
  like `'froot · ynab-agent#33 · 2026-06'`; default banner: `'N=1: one fleet, ~7 small
  repos, ~30 PRs, a local judge model — feasibility evidence, not at-scale proof.'`
  Children typically a `<pre>` with the verbatim artifact.
- `<ModelNotes register notes cannotShow glass?>` — the honesty drawer (`.mh-notes`):
  `notes: string[]` (simplifications, tuned constants and why), `cannotShow: string`
  (mandatory), `glass: string` (raw engine source slice; renders in `.mh-glass`).
- `<LabFrame tag register question payoff notes cannotShow glass>` — wraps every lab:
  mono tag (`LAB 09·A — THE STORM`), register chip, the stated question (`.mh-lab-q`),
  children (the interactive), payoff callout (`.mh-payoff`, the finding stated for readers
  who never touch a control), and a composed `<ModelNotes>`.
- `<Commit prompt options onReveal>` — commit-before-reveal: renders `.mh-commit` with
  kicker `PREDICT FIRST`, option chips; once one is chosen calls `onReveal(id)` and renders
  `children(id)` (render prop) as the argued feedback in `.mh-feedback`. No reveal without a
  commitment; no scoring.
- `<Walkthrough trace renderStep?>` — recorded-run stepper (`.mh-trace`): Prev/Next/Play
  over `trace.steps`, captions always visible, `renderStep(step)` optional custom snapshot.
  Play is gated by `usePrefersReducedMotion` (falls back to manual stepping).
- `<Artifact lines>` — benchfile pane (`.mh-artifact`): `lines: [{ no, text, kind?:
  'key'|'comment', hot?:bool, annot?:string }]`.
- `<Quadrant value onChange>` — the placement 2×2 (`.mh-quadrant`): quadrant ids
  `'planned'` (top-left), `'emergent-spec'` (top-right), `'danger'` (bottom-left, styled
  `.danger`), `'emergent-explore'` (bottom-right); axes labeled Irreversible↔Reversible (x)
  and Well-specified↕Exploratory (y).
- `<Drill cases title?>` — sequential case player on `cases.js` shapes: evidence list,
  options or quadrant, commitment, argued feedback, contested marking, quiet `k of n`
  progress (no scores, no streaks).
- `<DecisionCard title items>` — chapter closer (`.mh-decision`).
- `<Coda line next?>` — the chapter's one idea (`.mh-coda`).
- `<Term id>` — glossary chip (`.mh-term`) reading from `src/components/glossary.js`
  (definitions sourced from the handbook §2.1, with the closest industry analog).
- `glassSlice(rawSource, startMarker, endMarker)` — helper exported from the barrel for
  slicing `?raw` imports to one function.

## Labs

One file per lab in `src/labs/`, default export, self-contained: shared classes + inline
styles only (no new stylesheets; `src/styles/book.css` is the only CSS file and only the
integrator edits it). Every lab:

- is wrapped in `<LabFrame>` with an honest `question`, `payoff`, `notes`, `cannotShow`,
  and `glass` (the relevant engine function, raw);
- is **legible at rest**: first paint already shows the most representative state of the
  canonical run, payoff visible — a reader who never interacts still gets the claim;
- exposes **2–4 controls per task**, everything else frozen; sandbox/free-play only after
  the guided pass, clearly optional;
- names mechanisms in feedback using the framework's vocabulary;
- respects `usePrefersReducedMotion()` (from `src/shared/`) for any rAF/interval motion:
  reduced → render the representative static frame and step manually;
- is keyboard-operable (all controls are real `<button>`/`<input>`; no div-onClick) and
  carries `aria-label`s on nonobvious controls;
- runs ONLY on `src/engine/` modules — no physics in components; if a lab needs logic,
  it belongs in the engine with tests.

## Accessibility and motion

WCAG AA contrast in both themes (the tokens are tuned for it; don't introduce new colors —
use the CSS variables). `prefers-reduced-motion` is neutralized globally for CSS; gate JS
motion with the hook. Nothing autoplays except the hero's ambient frame, which freezes
under reduced motion.

## Working agreements (for parallel agents)

- Touch only the files your brief names. Never edit `book.css`, `registry.js`, `App.jsx`,
  or another agent's files.
- Verify your own work: `npx vitest run tests/<yours>.test.js` for engines;
  `npx vitest run tests/smoke.test.jsx` plus `npx eslint src/labs/<yours>.jsx` for UI files
  once dependencies are installed.
- Imports between parallel work use the contracts in this file and ENGINE-SPEC.md — write
  against the contract even if the sibling file does not exist yet.
- American English; Prettier formatting (`npx prettier --write <file>` before finishing).
