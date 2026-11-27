// Many Hands Engineering
// Notes on building the thing that builds the thing

// ─────────────────────────────────────────────────────────
// Document setup, typography, page anatomy
// ─────────────────────────────────────────────────────────

#set document(
  title: "Many Hands Engineering",
  author: "Matthew Sullivan",
)

#set page(
  paper: "us-letter",
  margin: (top: 0.95in, bottom: 0.95in, x: 1.1in),
  numbering: "1",
  number-align: center + bottom,
  header-ascent: 24pt,
)

// Typography — Libertinus Serif body, Carlito sans for headings
#set text(
  font: "Libertinus Serif",
  size: 10.5pt,
  hyphenate: auto,
  lang: "en",
)
#set par(
  justify: false,
  leading: 0.65em,
  first-line-indent: 0pt,
  spacing: 1.05em,
)

// Headings — sans, smaller, more breathing room below than above
#set heading(numbering: none)
#show heading: set text(font: "Carlito")

#show heading.where(level: 1): set text(size: 17pt, weight: "bold")
#show heading.where(level: 1): it => {
  v(1.6em, weak: true)
  block(below: 0.7em, it.body)
  block(above: 0pt, below: 1.0em)[
    #line(length: 100%, stroke: 0.5pt + luma(170))
  ]
}

#show heading.where(level: 2): set text(size: 12.5pt, weight: "bold")
#show heading.where(level: 2): it => {
  v(1.3em, weak: true)
  block(below: 0.7em, it.body)
}

#show heading.where(level: 3): set text(size: 11pt, weight: "semibold")
#show heading.where(level: 3): it => {
  v(1.1em, weak: true)
  block(below: 0.55em, it.body)
}

// Tables — tighter, restrained
#set table(
  stroke: 0.4pt + luma(190),
  inset: 7pt,
  align: left + top,
)
#show table.cell.where(y: 0): set text(weight: "bold", font: "Carlito", size: 10pt)
#show table.cell.where(y: 0): set par(justify: false)

// Code — inline + block
#show raw.where(block: false): box.with(
  fill: luma(242),
  inset: (x: 3pt, y: 0pt),
  outset: (y: 3pt),
  radius: 2pt,
)
#show raw.where(block: true): block.with(
  fill: luma(247),
  inset: 10pt,
  radius: 3pt,
  width: 100%,
)

// Block quotes — restrained pull-out
#show quote.where(block: true): it => {
  block(
    fill: luma(250),
    stroke: (left: 2pt + luma(140)),
    inset: (left: 12pt, rest: 10pt),
    width: 100%,
  )[
    #set text(style: "italic", size: 10.5pt)
    #it.body
  ]
}

// Horizontal rules
#show line: set line(stroke: 0.4pt + luma(180))

// ─────────────────────────────────────────────────────────
// Custom elements
// ─────────────────────────────────────────────────────────

// Pull-quote for thesis lines — distinct but not overbearing
#let thesis(body) = {
  v(0.4em)
  block(
    inset: (left: 14pt, top: 8pt, bottom: 8pt, right: 8pt),
    stroke: (left: 2pt + black),
    width: 100%,
  )[
    #set text(style: "italic", weight: "regular", size: 11pt)
    #body
  ]
  v(0.4em)
}

// Part divider — full page, tighter and warmer
#let part(number, title) = {
  pagebreak(weak: false)
  set page(header: none, numbering: none)
  v(2.6in)
  align(center)[
    #text(font: "Carlito", size: 11pt, tracking: 6pt, weight: "regular", fill: luma(80))[PART #number]
    #v(0.3in)
    #line(length: 18%, stroke: 0.6pt + luma(120))
    #v(0.3in)
    #text(font: "Carlito", size: 26pt, weight: "bold")[#title]
  ]
  pagebreak()
}

// ─────────────────────────────────────────────────────────
// TITLE PAGE
// ─────────────────────────────────────────────────────────

#set page(numbering: none, header: none, footer: none)

#v(1.8in)
#align(center)[
  #text(font: "Carlito", size: 36pt, weight: "bold")[Many Hands]
  #v(-0.35em)
  #text(font: "Carlito", size: 36pt, weight: "bold")[Engineering]

  #v(0.4in)
  #line(length: 22%, stroke: 0.6pt + luma(120))
  #v(0.3in)

  #text(size: 13pt, style: "italic", fill: luma(50))[
    Notes on building the thing\
    that builds the thing.
  ]

  #v(2.6in)

  #text(font: "Carlito", size: 11pt, fill: luma(70))[Matthew Sullivan]\
  #text(font: "Carlito", size: 9pt, fill: luma(140))[2026]
]

#pagebreak()

// ─────────────────────────────────────────────────────────
// FRONT MATTER
// ─────────────────────────────────────────────────────────

#set page(numbering: "i", header: none)
#counter(page).update(1)

= About the author

I am a senior software engineer with twelve years of experience in building platforms. I was a founding engineer on the enterprise platform for generative AI at a Fortune 50 retailer. My work there centered on agent orchestration and multi-agent systems. Before that, I worked on network automation, research and development for distributed systems, large-scale observability infrastructure, and developer-platform engineering at startups and agencies. The research and development included a multi-backend distributed database with a custom protocol for cluster state.

This handbook is the result of my work to understand what changes when most of the code is no longer typed by hand.

= A note on AI assistance

The ideas and the framework are mine. I used AI to help me record them in writing, to find prior work that supports and challenges them, and to review the draft.

Many hands did the work. The judgment stayed mine. The handbook is about that division, so I state it openly here too.

= A note on the name and the claim

This handbook describes a framework that I call *Many Hands Engineering*. The name is mine, but the ideas are not. They come from distributed systems, complex adaptive systems, commons governance, swarm intelligence, cybernetics, and military command doctrine, among others. Where I coined a term or renamed an existing term, I say so and name the lineage. The goal is a shared language that teams can use in practice, not a claim of novelty. Part IV tracks the provenance openly.

This handbook is also not a definitive guide. It is *my view of the direction in which software engineering now moves*. It is also the framework that I find most useful for work in that direction.

Some of what follows has strong evidence. Some is a working hypothesis, and current practice informs it. Some is an organizing metaphor that helps me think. I try to flag the difference where it matters. (See _What kind of claim is this?_ at the end of Part I.)

In a few places, the vocabulary of this framework differs from the vocabulary of the field:

- I use *planned* and *emergent* as the main vocabulary where the open-source literature uses _cathedral_ and _bazaar_ (Raymond, 1997). The distinction is the same, but the words are plainer.
- I use *signal* where the stigmergy literature uses _pheromone_ or _trace_. The mechanism is the same, but the frame is broader.
- I use *boundary* as one general term for the designed edges between regions: API contracts, review gates, capability scopes, and trust zones. The literature treats these separately. In practice, they are the same design move.
- I use *terrain* for the larger environment in which many hands operate. Per-agent execution environments are increasingly called _harnesses_ (Hashimoto, OpenAI, Fowler, et al., 2026). Harnesses are a critical layer of terrain. See §4.2 for the relationship.
- I coined *placement* and *steward* because the concepts are real and the existing words do not fully express them.

The point is one name, one vocabulary, and one mental model.

= How to read this

The handbook has four parts. Each part is useful on its own.

#v(0.4em)

#block(inset: (left: 4pt))[
  *Part I — The argument.* \
  This part explains what changes, why the old questions are no longer enough, and the new question that is enough.

  #v(0.5em)

  *Part II — The framework.* \
  This part gives the vocabulary, the spectrum, the placement discipline, the pace-layered platform, and the commons.

  #v(0.5em)

  *Part III — The practice.* \
  This part covers the anatomy of a loop, a catalog of real loops, the staged transition, and the steward's shape. It also covers the economics of approval, trust and authority, measurement, and correctness and security. It tells you where the framework applies, where it does not, and where to start on Monday.

  #v(0.5em)

  *Part IV — Foundations.* \
  This part gives the lineage, the mathematics, the evidence, and the open questions. It is for the reader who wants to trace a claim to its source.
]

#v(1em)

If you remember only one line, remember this one:

#thesis[It used to be making the thing. Now it's making the thing that makes the thing.]

// ─────────────────────────────────────────────────────────
// PART I
// ─────────────────────────────────────────────────────────

#part("I", "The argument")

#set page(numbering: "1", header: align(right)[
  #text(size: 9pt, fill: luma(100))[Part I — The argument]
  #v(-0.7em)
  #line(length: 100%, stroke: 0.4pt + luma(200))
])
#counter(page).update(1)

= The turn

It used to be making the thing. Now it's making the thing that makes the thing.

More and more, software is the work of many hands. Some hands are human, and some are automated. Some are fast, and some are slow. Some are narrow in scope, and some carry judgment.

None of this makes the old engineering wisdom obsolete. It makes that wisdom incomplete. We still need to know how to write good code. We also need to know what the old tools did not fully answer. That is: _what should be planned, what can be allowed to emerge, what should stay reversible, and where judgment should stay human._ Those questions are the center of this framework.

The unit of work has shifted before:

#table(
  columns: (auto, auto, auto, 1fr),
  table.header[Era][Unit of work][Engineer's role][What mattered],
  [Lines], [The instruction], [Author], [Writing it well],
  [Modules], [The component], [Architect], [Arranging them well],
  [Loops], [The autonomous cycle], [Steward], [Shaping the conditions under which work happens],
)

The steward tends the *terrain*: the substrate, signals, boundaries, and conditions under which autonomous work succeeds or fails. Good terrain compounds. Each piece of work runs more cleanly, more safely, and faster than the last. The team's attention is freed for the decisions that most need it. Bad terrain collapses. Many hands work furiously and produce nothing that lasts.

The ideas under the framework are older than the technology that makes them urgent. Termites build without blueprints. Common-pool resources are governed without tyranny. Armies delegate under uncertainty. Buildings learn, and cities zone. Distributed systems prove theorems about what they can and cannot promise.

None of this is decoration. These are the substrates on which the framework rests. The problems are not new. Only the speed and the scale at which we now face them are new.

= Why "Many Hands"

#thesis[Many hands can build a lot. They can also make a mess. The difference is the system around them.]

That is the whole picture. A shop with many skilled hands and no system produces noise. A shop with one skilled hand and a rigid system produces only what that hand can imagine. The craft is in the system. The system is the set of conditions that let many hands work in parallel without collisions and without loss of coherence. Those conditions also preserve the judgment that keeps the work honest.

"Many hands" includes human engineers, AI agents, review systems, automated tests, linters, deployment pipelines, and on-call rotations. It also includes every other source of action in a modern codebase. Software has always had many hands. The difference now is that some of those hands can make real decisions on their own. That changes what the system around them must do.

= Why approval matters

The visible act of engineering in this era is the approval. It is the _looks good to me_ on a pull request and the _ship it_ in a review. It is the considered yes at the moment when autonomous work meets human judgment. The approval can look trivial, but it is not. When the system around the hands is well built, the work depends on that approval. That approval is the moment when the work becomes real.

A framework that does not treat this moment seriously is not a framework for software in this era. The mechanics of how approval scales are central enough to have their own section in Part III (§3.6). Those mechanics are how approval is earned, how it is budgeted, and how it decays.

= What kind of claim is this?

A framework is worth its cost only if it is honest about what it knows. This document has three layers of claims, and the reader should treat each layer differently:

- *Evidence-backed observations.* These are things that empirical research established or that the industry learned at high cost. They include Conway's Law, the impossibility theorems of distributed systems, and Ostrom's design principles for commons. They also include the human-factors literature on automation and the convergent failure patterns that major postmortems describe. The framework depends on these observations.
- *Working design principles.* These are patterns that follow from the observations and seem to hold in the cases that I have studied or worked on. But they have not yet been verified at industry scale for the specific shape of agent-heavy engineering. These principles are placement, the staged transition, the economics of approval, and the five properties of trust. I commit to these principles because they are the best framing that I have found, not because the science is settled.
- *Organizing metaphors.* This is language that helps us think clearly but does not claim to be literally true. The metaphors are terrain, the colony's immune system, and the four forces. These metaphors have a place here because they clarify. They are not theorems.

Where it matters, I flag the layer of a claim. Where I do not flag, I am usually in the second layer. There, I describe what I think is the right move, based on what we know now. The reader who treats every line of this document as settled truth misses the point. The reader who treats every line as opinion also misses the point. The interesting work is to know which is which.

This handbook will be wrong in specific ways. It should be revised when the evidence demands it. These structural claims have strong support:

- The spectrum is real.
- Positive feedback is dangerous.
- Commons need governance.
- Variety must match variety.
- Humans move to roles with lower frequency and higher authority.
- Trust must be earned, narrow, conditional, revocable, and expiring.

The specific operational recommendations are bets. Theory and early practice inform them. *The framework is a principled hypothesis, not a proven methodology.* Use it accordingly.

// ─────────────────────────────────────────────────────────
// PART II
// ─────────────────────────────────────────────────────────

#part("II", "The framework")

#set page(numbering: "1", header: align(right)[
  #text(size: 9pt, fill: luma(100))[Part II — The framework]
  #v(-0.7em)
  #line(length: 100%, stroke: 0.4pt + luma(200))
])

= 2.1 — Vocabulary

The framework uses a small vocabulary, and it uses that vocabulary consistently. Each term appears with its closest industry or academic analog. Readers can then cross-reference and still follow the argument.

*The two modes* form the spectrum of how work is coordinated.

- *Planned work.* Planned work is specified in advance, decomposed into bounded tasks, executed against the specification, and verified at scheduled checkpoints. Industry analogs are design-by-contract, formal methods, waterfall, and milestone-driven delivery. The lineage is Raymond's _cathedral_ (1997).
- *Emergent work.* Emergent work is expressed as constraints and goals, coordinated through signals in a shared environment, integrated continuously, and verified through convergence. Industry analogs are trunk-based development, reconciliation loops, and bazaar-style open source. The lineage is Raymond's _bazaar_ (1997) and stigmergy (Grassé, 1959).

Most real systems are mixes of the two modes. The design work is to decide which mode belongs where.

*This framework introduces or reclaims six terms.*

#table(
  columns: (auto, 1fr, 1fr),
  table.header[Term][Definition][Closest industry analog],
  [*Loop*], [A closed cycle of work: _signal → action → verification → commit or revert_. The loop is the operating unit.], [Reconciliation loop, control loop, autonomous workflow],
  [*Terrain*], [The designed environment in which loops run: substrate, signals, boundaries, and shared resources. The term is literal, not a metaphor.], [Developer platform, substrate, the _environment_ in an agent SDK],
  [*Signal*], [A piece of metadata in the terrain. It decays, and it biases the next action. Test status, staleness marker, telemetry, confidence score, ownership tag. The artifact is not the signal. The signal is what the artifact _tells the next actor_.], [Pheromone (stigmergy). State in reconciliation systems.],
  [*Boundary*], [A designed edge between regions of the system. Contracts, review gates, capability scopes, trust zones. Where planned work and emergent work meet, a boundary holds the seam.], [API contract, bounded context, trust boundary, review gate],
  [*Placement*], [The discipline of deciding, explicitly, where a decision belongs on the planned/emergent spectrum. _The placement is the decision. The implementation follows from it._], [Design at the level of an architecture decision record (ADR), but sharper and earlier],
  [*Steward*], [The human role. The steward shapes terrain, sets intent, codifies norms, approves what crosses boundaries, and holds the veto on irreversible actions.], [Platform engineer, tech lead, architect. Each is a partial match. The steward is none of these alone.],
)

*Two more terms appear throughout the handbook.*

- *The commons.* The commons is the set of shared substrates through which emergent work coordinates. These substrates include the repository, the vector store, the evaluation (eval) harness, the deployment pipeline, and the production namespace. Commons are _governable resources_, not passive storage. They degrade without governance. The lineage is Ostrom (1990).
- *Pace layers.* Pace layers are the strata of a system: governance (years), architecture (months), capabilities (weeks), orchestration (days), agents (hours), and invocations (minutes). Each layer changes at its own characteristic pace. It is a category error to mix signals across layers. The lineage is Stewart Brand (1994).

*Four forces shape every terrain.*

- *Reinforcement*: a signal strengthens with use.
- *Decay*: a signal weakens with time.
- *Runaway*: reinforcement continues without a counter-force. This is the death spiral.
- *Drift*: what the system measures and what the world rewards slowly diverge.

Most of what goes right or wrong in a many-hands system appears as one of these four forces. Under them is *entropy*: the second-law tendency of any system to move from order toward noise unless work is continually invested. Decay, drift, and (eventually) runaway are the forms that entropy takes in software. The work against entropy is one of the steward's main jobs (§2.11).

= 2.2 — The planned / emergent spectrum

The planned/emergent spectrum is not a rhetorical device. All the properties along it vary together:

#table(
  columns: (1fr, 1fr, 1fr),
  table.header[][Planned ←][→ Emergent],
  [Authority], [Central], [Distributed],
  [Knowledge], [Concentrated], [Dispersed],
  [Specification role], [Prescriptive], [Descriptive],
  [Integration], [Scheduled, synchronous], [Continuous, asynchronous],
  [Verification], [Against the specification], [Through convergence],
  [Coupling], [Explicit, audited], [Implicit, tolerated],
  [Coordination], [Direct command], [Environmental signal],
  [Failure], [Hard — the whole plan breaks], [Soft — local decay],
  [Strength], [Guarantees], [Adaptivity],
  [Weakness], [Brittleness], [Commons degradation],
)

These properties cluster because they reinforce each other. A decision that is made centrally and verified against a specification also integrates on a schedule and fails hard when it is wrong. A decision that is made in a distributed way and verified through convergence integrates continuously and fails softly. A mix halfway between the two, for example central authority with continuous asynchronous integration, usually produces governance theatre. Governance theatre is the form of planned work without its substance, and the name of emergent work without its benefits.

At a boundary, there is a trade-off between guarantees and adaptivity. You cannot have both in the same region. You can have them in different regions, and well-designed boundaries connect those regions.

= 2.3 — Placement, the central discipline

#thesis[In a world of many hands, placement is the craft.]

Traditional architectural arguments ask _what_: what framework, what language, what pattern, what data model. This framework asks _where_ instead. Given that we need authentication, where on the spectrum does it belong? It belongs on the planned side: it is irreversible, regulated, and coupled to everything.

Given that we need internal developer tooling, where does it belong? It belongs on the emergent side. The cost of a wrong choice is a revert, and the variety of needs exceeds what central design can anticipate.

The new question changes what evidence matters. An argument about _what_ often ends in taste and authority. An argument about _where_ ends in an examination of three axes, and those axes are empirical. You do not need to agree on what authentication _ought_ to be. You can still agree that it is irreversible, specified, and tightly coupled, and therefore planned.

*Three questions place any decision.* For any decision of consequence, ask:

- *Reversibility.* If this goes wrong, how expensive is it to undo? If it is cheap to undo, that points to emergent work. If it is expensive, that points to planned work. _This is the most important question._
- *Legibility.* Is the problem well-specified and stable, or is it exploratory and unstable? A specified problem points to planned work. An exploratory problem points to emergent work.
- *Coupling.* Does a local change force changes elsewhere? Tight coupling points to planned work. Loose coupling points to emergent work.

#v(0.5em)

// ─── Quadrant chart, native Typst ───
#figure(
  caption: [Where does this decision belong?],
  block(width: 100%, inset: (top: 6pt, bottom: 6pt))[
    #set align(center)
    // The quadrant grid with a left-side rotated label
    #grid(
      columns: (auto, auto),
      gutter: 8pt,
      align: horizon,
      // Y-axis label (rotated)
      rotate(-90deg, reflow: true)[
        #text(size: 9pt, style: "italic", fill: luma(100))[Exploratory  ←  →  Well-specified]
      ],
      // The 2x2 grid of quadrant cells
      grid(
        columns: (1.9in, 1.9in),
        rows: (1.25in, 1.25in),
        gutter: 0pt,
        // Top-left: Planned
        rect(width: 100%, height: 100%, fill: rgb("#eef2f8"), stroke: 0.5pt + luma(170), inset: 10pt)[
          #set align(center + horizon)
          #text(size: 13pt, weight: "bold")[Planned]
          #v(0.3em)
          #text(size: 8.5pt, fill: luma(110))[
            Authentication system\
            Schema migration
          ]
        ],
        // Top-right: Emergent (well-specified, reversible)
        rect(width: 100%, height: 100%, fill: rgb("#eff5ee"), stroke: 0.5pt + luma(170), inset: 10pt)[
          #set align(center + horizon)
          #text(size: 13pt, weight: "bold")[Emergent]
          #v(0.3em)
          #text(size: 8.5pt, fill: luma(110))[
            Dependency patch upgrade\
            Feature flag
          ]
        ],
        // Bottom-left: DANGER ZONE
        rect(width: 100%, height: 100%, fill: rgb("#fbecec"), stroke: 0.5pt + luma(170), inset: 10pt)[
          #set align(center + horizon)
          #text(size: 12pt, weight: "bold", fill: rgb("#a02020"))[DANGER ZONE]
          #v(0.3em)
          #text(size: 8.5pt, fill: luma(110))[
            Public API contract\
            Production data schema
          ]
        ],
        // Bottom-right: Emergent (exploratory, reversible)
        rect(width: 100%, height: 100%, fill: rgb("#eff5ee"), stroke: 0.5pt + luma(170), inset: 10pt)[
          #set align(center + horizon)
          #text(size: 13pt, weight: "bold")[Emergent]
          #v(0.3em)
          #text(size: 8.5pt, fill: luma(110))[
            Prototype agent\
            Internal tool
          ]
        ],
      ),
    )
    // Bottom axis: Irreversible / Reversible — both centered under their column
    #v(-0.2em)
    #grid(
      columns: (1.9in, 1.9in),
      gutter: 0pt,
      align: center,
      text(size: 9pt, style: "italic", fill: luma(100))[Irreversible],
      text(size: 9pt, style: "italic", fill: luma(100))[Reversible],
    )
  ],
)

#v(0.5em)

The bottom-left quadrant (_irreversible *and* exploratory_) is where engineering disasters occur. Never let agents do emergent work there unless you first make the decision reversible or make the problem legible.

Tight coupling pulls a decision toward the planned pole. Regulatory, financial, or safety exposure pulls it further toward that pole.

Do this explicitly for every decision of consequence. Record the placement in writing. *The placement is the decision.* The implementation follows from it. The approval at the end is honest only when the upstream placement was careful.

= 2.4 — Five patterns for composing planned and emergent

Most real systems are hybrids. Five patterns recur.

+ *Shell and core.* A firm planned interface surrounds an emergent interior. Microservice contracts, OS kernels, and constitutions have this pattern.
+ *Scaffold and release.* Planned work builds the initial structure. Emergent work then takes control. _The failure mode is to stay in the planned phase too long._
+ *Nested zones.* Planned zones contain emergent zones, and those emergent zones contain planned zones. Handle each thing at the lowest layer that can handle it.
+ *Alternating breath.* The two modes alternate in time: divergent, convergent, divergent, convergent. Know which phase you are in.
+ *Zoning.* The two modes coexist in zones that differ by risk. Payments are planned. Feature flags are emergent. They are in the same system but in different zones.

= 2.5 — The pace-layered platform

A real many-hands platform is not one system. It is several systems, stacked by rate of change.

#table(
  columns: (auto, auto, 1fr),
  table.header[Rate of change][Layer][Examples],
  [Years], [Governance], [Policy, values, accountability, compliance posture],
  [Months], [Architecture], [Platform primitives, schemas, contracts, trust model],
  [Weeks], [Capabilities], [Tools, connectors, retrieval, eval harnesses],
  [Days], [Orchestration], [Agent graphs, routing, delegation],
  [Hours], [Agents], [System prompts, strategies, tool selections],
  [Minutes], [Invocations], [A single task run],
)

Three rules govern the stack.

- *Each layer changes at its own pace.* Governance that changes weekly is theatre. Invocations that need architectural review are a slow IDE.
- *Signals flow up, and authority flows down.* A pattern that appears at the invocation layer can move up into a capability, then into architecture, then into governance. It moves up only when each layer ratifies it, not by fiat from below. In the other direction, a governance change reshapes the constraints under which every lower layer operates.
- *Each layer has a characteristic failure mode.*
  - Governance becomes irrelevant.
  - Architecture becomes brittle.
  - Capabilities multiply without curation.
  - Orchestration fails under combinatorial complexity.
  - Agents hallucinate and drift.
  - Invocations produce transient errors.

  Aim each review at the layer where the failure actually occurred.

The planned/emergent distinction applies _within_ each layer. The pace layer tells you _when_ something changes. The spectrum tells you _how_ it is coordinated.

= 2.6 — The commons, governed

Every shared substrate in a many-hands platform is a commons. A commons is a resource that many actors take from and add to, and over-use degrades the resource for all. Elinor Ostrom's decades of field research on common-pool resources produced eight principles that long-enduring commons share. Those principles translate to many-hands platforms almost line for line.

+ *Clear boundaries.* Every emitter has an attributable identity. Every consumer has a stated interest.
+ *Congruence.* Rules fit the resource. High-frequency signals decay faster. High-consequence signals need stronger evidence.
+ *Collective choice.* Those whom a rule affects can change it.
+ *Monitoring.* Watchers are accountable to users, not to a distant authority.
+ *Graduated sanctions.* A first offense receives a lighter sanction than a repeated offense. In a platform, this means earned autonomy, envelopes that narrow after incidents, and approval rates that rise and fall with track record.
+ *Low-cost conflict resolution.* If conflict resolution is expensive, conflict will be hidden. Hidden conflict is worse than open conflict.
+ *Rights to organize.* Teams and sub-platforms have meaningful local autonomy. Overriding every local decision destroys the local knowledge that made the decision good.
+ *Nested enterprises.* Large commons are layered commons. Each layer has its own rules at its own scope.

If you ignore these principles, the platform eventually shows the tragedy of the commons. The cause is not villainy but the absence of governance. If you adopt them, the platform becomes durable in the way that long-lived open-source projects and healthy markets are durable. _The evidence is strong. Ostrom's work is among the most empirically grounded bodies of work in the social sciences. The mapping to software commons is more recent, but the mechanism is the same._

= 2.7 — The goal, restated

The goal is not to build the product. *The goal is to build the conditions under which the product is produced.* The engineer's attention moves upstream to the design of the terrain, the tuning of signals, the setting of norms, and the placement of decisions. Meanwhile, the downstream work runs well enough that it does not reclaim that attention.

That puts nearly every traditional metric in a new frame. Velocity is not the point. The point is the _ratio of autonomous to supervised throughput_. Test coverage is not the point. The point is the _reversibility of the average change_. The number of lines of code is not really a signal at all.

= 2.8 — The dynamics

A many-hands platform is a dynamical system in the formal sense. It has states, transitions, and stable and unstable equilibria. It has phase transitions when parameters cross critical thresholds. If you treat it as static architecture, you make a category error that the system eventually punishes. You do not have to do the mathematics, but you should know what it says.

*Signals spread, fade, and accumulate.* The name of this dynamic is reaction-diffusion. Three rates determine everything: how fast a signal spreads, how fast it fades, and how strongly it is reinforced. If decay is too slow, signals saturate into noise. If reinforcement outruns decay, the system locks onto whatever was reinforced first, even if it was wrong. In mathematical terms: without sufficient decay, self-reinforcing aggregation can grow without bound. That is the shape of many runaways that you will eventually see.

*Positive feedback produces phase transitions.* Self-reinforcing dynamics change _qualitatively_ when a control parameter crosses a critical value. Below that value, perturbations die. Above that value, they grow without bound unless something counteracts them. Discontinuity is the default. One more agent can change everything.

*There is a trade-off between exploration and exploitation.* Every system that coordinates through signals has a control, explicit or hidden. That control sets how much agents follow existing signals and how much they explore. If the system is too exploitative, it locks onto the first path that is good enough. If the system is too exploratory, nothing consolidates. A wrong setting of this control is the most common cause of either brittleness or noise.

*Coordination cost is topological.* Direct messaging among N agents requires N² channels. Coordination through a shared environment requires N. That is why colonies scale, and why tightly coupled microservice meshes degrade above a few tens of services. The reason is combinatorial, not ideological.

*Some things are impossible.* CAP, PACELC, and FLP are theorems, not preferences. You cannot have consistency, availability, and partition tolerance at the same time. You cannot have deterministic asynchronous consensus that tolerates even one failure. No architecture evades these theorems. You choose where to pay the cost.

*A regulator must match the variety that it regulates.* This is Ashby's Law. A single uniform safety filter cannot regulate a fleet of agents with high variety. Guardrails must be at least as differentiated as the failures that they guard against. This is not negotiable.

*Intelligence turns coordination into political economy.* When agents can model incentives, they can deceive, free-ride, and game evaluators. The stable outcomes of the system tend to be the outcomes that the incentive structure supports, whether or not you intended them. _Increasingly, the design of the incentives is part of the design of the system._

= 2.9 — The two death spirals

Many-hands systems fail in two characteristic families. Learn to recognize each family from its first symptom.

== The emergent death spiral

A reinforcing signal without a counter-force becomes a runaway. The biological archetype is the _ant mill_. Army ants that lose the main trail follow each other in a circle until the colony dies of exhaustion. The signal did what signals do. The system lacked the mechanism to break the loop.

In software, the same dynamic takes many forms. Retry storms overwhelm the service that receives the retries. Agents cite each other until ungrounded claims look well-grounded. Recommendation loops narrow onto local optima that the exploration rate can no longer escape. When evaluators are trained on agent output, they drift until they reward surface features. Agents then optimize for those features directly.

#table(
  columns: (1fr, 1fr, 1fr),
  table.header[][Healthy emergent work][Runaway],
  [Decay], [present], [absent],
  [Variety], [preserved], [collapsed],
  [Outside reference], [intact], [severed],
  [Net behavior], [self-correcting], [self-amplifying],
)

_These are the warning signs:_

- The signal-to-noise ratio declines while activity rises.
- The same patterns recur across unrelated tasks.
- Confidence is high on outputs that a human recognizes as degraded.
- Eval scores diverge from real outcomes.
- Variety collapses without a corresponding increase in selectivity.

_The remedies are always in this family:_

- Inject variety.
- Increase decay.
- Add an _outside reference_ that the loop cannot produce itself.
- Tighten the trust model.
- In severe cases, evacuate and restart.

*The problem is in the terrain, not in any individual agent.* A patch to the agent will not correct it.

== The planned death spiral

A specification loses contact with reality faster than it can be updated. The baggage system at Denver airport, NHS NPfIT, and the original Healthcare.gov all show the same pattern:

+ Requirements changed during development.
+ The specification could not stay current.
+ Implementation continued against a specification that was increasingly wrong.
+ Integration at the end revealed the gap, catastrophically.

In many-hands systems, the pattern is structurally identical. A central orchestrator plans fully before it executes, in a domain where full planning is impossible. A top-level coordinator becomes a bottleneck for every decision. A specification-first workflow freezes an interface that later proves wrong. A single reviewer becomes a single point of failure.

_These are the warning signs:_

- The backlog of exceptions grows faster than the plan can absorb them.
- Work in progress (WIP) accumulates because no piece integrates until the whole is ready.
- A few humans become permanent bottlenecks.
- Outputs are superficially correct, but they fail only in composition.
- The specification becomes ceremony.

_These are the remedies:_

- Shorten the integration cycle.
- Decentralize what does not need central authority.
- Change the specification from a document into an executable contract, with fewer words and more tests.
- Distribute approval by domain.

== Hybrid failures

The most dangerous failures are hybrids. They have the form of one mode and the substance of the other. A heavily specified system whose specifications are never enforced is planned in form and emergent in substance. It inherits the weaknesses of both modes. The opposite is a lightly specified system whose informal norms have hardened into custom that cannot be edited.

Governance theatre, ivory-tower architecture, and the inner-platform effect are all hybrids. _The honest test is not which mode the system claims, but which mode it uses for its actual decisions._

= 2.10 — Guardrails, the system's immune response

Guardrails are not add-ons. They are design work that the platform depends on. There are four classes, and each class answers a different question.

- *Structural — can this even happen?* The medium, not policy, enforces these guardrails. Schema validation at write time, capability scoping, sandboxing, and type systems are structural guardrails. They are the cheapest and the most reliable. Forbidden actions are impossible.
- *Reactive — did this just happen, and should it continue?* Rate limits, circuit breakers, backpressure, content filters, and test gates are reactive guardrails. They run at the moment of action. They must not depend on the thing that they guard against. A circuit breaker that relies on the service that it guards against is not a circuit breaker.
- *Dynamic — is the system drifting?* Dynamic guardrails cover approval rates per agent and task class, burn rates of error budgets, eval drift, and canary analysis. They operate over time. They catch patterns that single-event guardrails miss. The main design challenge is to avoid false-positive fatigue.
- *Reflective — do our guardrails still work?* Reflective guardrails include postmortems that reveal missed failure classes, and chaos engineering that probes the guardrail layer. They also include meta-evals that verify whether the eval harness is still representative. This is the most important class, because without it the other three decay silently.

A mature platform has guardrails in all four classes, and it recognizes that the four classes answer different questions.

*Grade each guardrail explicitly along five axes:*

#table(
  columns: (auto, 1fr, 1fr),
  table.header[Axis][Question][Red flag],
  [Coverage], [What fraction of the failure class does it catch?], [Less than you thought],
  [Latency], [Time from trigger to firing], [Slower than the harm rate],
  [Blast radius], [Damage done by the time it fires], [Your real cost],
  [False-positive rate], [Fraction of spurious firings], [Trains operators to ignore firings],
  [Recovery cost], [Work to return to a good state], [Can exceed the failure cost],
)

The grades tend to show that many guardrails do less than they appear to do. A review gate with a 95% approval rate is a rubber stamp: it approves without real review. A rate limit at ten times the peak is decorative. The exercise forces the question of whether each guardrail is worth its cost.

Guardrails are themselves subject to the dynamics that they guard against:

- They can become a runaway. For example, a retry policy can cause the overload that it exists to prevent.
- They can become subject to Goodhart's Law. An eval that serves as a gate becomes a target for optimization.
- They can atrophy.
- They can become theatre.

These are the defenses:

- Add decay. Rotate evals, and retire stale rules.
- Add variety. Use multiple independent guardrails for critical failures.
- Add reflection. Measure the effectiveness of each guardrail.
- Add escape valves. A guardrail that cannot be overridden will be overridden destructively.

This pattern is fractal, as the pace-layered view predicted.

= 2.11 — The work against entropy

Every terrain decays. This is not pessimism. It is thermodynamics, applied to software:

- Documentation becomes stale.
- Tests rot.
- Dead code accumulates.
- Evals drift from the work that they were meant to measure.
- Conventions harden into dogma.
- Trust grants outlive the conditions under which they were earned.
- Abandoned branches in a corner of the repository silently become hazards.

Entropy is the default. *Order requires work.* A many-hands platform fights entropy on three fronts at the same time.

*The first front is decay.* This is decay of the explicit, designed kind. Signals that do not fade become noise. Trust grants that do not expire become liabilities. Conventions that are not questioned become empty rituals.

The framework already names decay as one of the four forces (§2.1), and it builds decay into multiple loops. In the dependency-patch loop, the track record is recent, not lifetime. In the stale-doc refresh loop, the freshness signal resets and then decays again. _Designed decay is how the terrain stays current._

*The second front is garbage collection.* This front consists of loops whose only job is to fight accumulation. The harness engineering literature (§4.2) documents this directly. It describes agents that run periodically to find inconsistencies in documentation, violations of architectural constraints, and dead code that is past a threshold of disuse. These loops are not glamorous, but they are essential. Without them, the commons fills with cruft, and at some point the cruft is what the next agent reads first.

*The third front is adversarial pressure.* This is the deliberate disturbance of an otherwise functional system, to keep it honest. This is the part that teams skip, because it feels counterintuitive. If things work, why break them?

== Why deliberate disturbance is necessary

Systems without disturbance converge on whatever path was reinforced first. The exploration control (§2.8) decays with everything else. The system then locks onto a local optimum that may have been wrong from the start.

Many-hands platforms are particularly vulnerable to this because feedback compounds. An agent that succeeds receives more work. That work generates more success signals, and those signals earn more autonomy. This continues until the conditions change and nothing in the loop notices. Without periodic disturbance, the platform becomes increasingly confident in increasingly stale conclusions.

The remedy is not stability. Stability without disturbance is disguised brittleness. The remedy is _productive instability_: small, deliberate disturbances. These disturbances prevent rigidity, force re-adaptation, and keep the terrain honest about what it really depends on.

*It is useful to name three forms of adversarial pressure:*

- *Chaos engineering.* Netflix's Simian Army did not only test for resilience to failure. It made sure that the system never became dependent on the absence of failure. In a many-hands platform, the analog is broader: deliberate tool failures, simulated model regressions, random permission revocations, killed background loops, and corrupted non-critical signals.
- *Adversarial verification.* Property-based testing, mutation testing, fuzzing, and the specification-by-adversary loop (§3.3) are forms of it. Replace the question _does this work?_ with the question _what would it take to break this?_ Then build the agent that systematically tries to break it.
- *Forced removal.* Periodically remove something. Candidates are a tool that the agents rely on, a piece of context that they always read, and a signal that they always consult. Then observe what happens. If the agents collapse, that reveals a hidden dependency. If they adapt, the dependency was not essential. _Subtraction reveals what addition concealed._

== The discipline, in practice

Adversarial pressure is not a one-time exercise. It is a recurring practice with its own pace layer.

- *Daily*: small disturbances built into normal operation (random retry jitter, cache misses, an occasional shuffle of the evals).
- *Weekly*: deliberate fault injection in non-critical paths, and mutation tests on recent changes.
- *Monthly*: chaos game days, full red-team passes against new agent classes, and reviews of trust grants for evidence of staleness.
- *Quarterly or on triggers*: removal experiments. Remove a context source, a tool, or a heuristic, and observe what breaks.

This is not testing. Testing asks whether the system meets a known specification. Adversarial pressure asks whether the system _silently relies on things that no one specified_. The first is verification. The second is discovery. Both matter, but they are not the same.

The healthy posture is _equilibrium under disturbance_. A system in this posture holds its shape, but not because nothing challenges it. It holds its shape because it has built the capacity to absorb challenge and to re-form. That is what an immune system really does. That is what guardrails (§2.10) aim for.

*A fight against entropy that succeeds too well becomes its own pathology.* An over-stabilized system loses the capacity to adapt to what comes next. When the work against entropy is done right, it does not eliminate disorder. It maintains _responsive_ order.

= 2.12 — The shape of a healthy system in motion

Learn the signature of a healthy system. It is worth more than any checklist.

- *Variety is high but bounded.* Different agents solve similar problems differently, within a range that the team recognizes. Outliers exist, and they are a sign of health. Their absence indicates premature convergence.
- *Flow is steady.* Arrival rates and completion rates match over moderate windows. A sudden accumulation of WIP indicates a bottleneck. A sudden evaporation of WIP indicates silent drops.
- *Escalations are rare but real.* When humans are called, it is for something that truly needs judgment. Frequent escalations mean that the autonomy envelope is too narrow. Zero escalations mean that the envelope is too wide, or that the system no longer reports real problems.
- *Signals correlate with outcomes.* When evals say that quality is higher, users say that quality is higher. _When internal signals diverge from external reality, that is a warning that the system has started to optimize for its own metrics. It is the earliest and most important such warning._
- *The commons is clean.* Stale signals are pruned. Abandoned branches die. Unused tools are retired. A commons that slowly fills with cruft slowly becomes uninhabitable.

When all five hold, the system is *alive*, in the sense of this framework. Keep it alive. Do not freeze it, because that kills it. Instead, maintain the conditions under which it stays a healthy dynamical system.

// ─────────────────────────────────────────────────────────
// PART III
// ─────────────────────────────────────────────────────────

#part("III", "The practice")

#set page(numbering: "1", header: align(right)[
  #text(size: 9pt, fill: luma(100))[Part III — The practice]
  #v(-0.7em)
  #line(length: 100%, stroke: 0.4pt + luma(200))
])

= 3.1 — A running example

Throughout this part, I use a single concrete example: the *dependency-patch loop*. It is small, reversible, and present in nearly every codebase. It is also ordinary enough to show how the framework looks in motion.

#quote(block: true)[
  A signal watches the dependency graph for available patch-level upgrades with clean changelogs. When one appears, an agent opens a change with the upgrade and the quoted changelog. Continuous integration (CI) runs. If CI passes, the change merges. If CI fails, the change stays open for human review. In either case, the agent's track record on this task class updates.

  Signals produced: patch cadence, CI pass rate, and post-merge rollback rate. All three inform how aggressively the next patch is applied, and whether this agent has earned autonomy on this task class.
]

It is a loop. It has a placement: it is reversible, legible, and loosely coupled, so it is emergent work. It has a boundary: CI is a gate, and the human reviewer is a higher gate. It has a steward: the person who sets the thresholds. It has trust that is earned and revocable. We return to this example throughout this part.

= 3.2 — The anatomy of a loop

Every loop, from the smallest to the largest, has the same anatomy: five stages that form a closed cycle.

#v(0.4em)

#block(
  fill: luma(248),
  stroke: 0.4pt + luma(190),
  inset: 16pt,
  width: 100%,
  radius: 3pt,
)[
  #set par(justify: false, leading: 0.65em)
  #set text(size: 10pt)

  #grid(
    columns: (auto, 1fr),
    column-gutter: 14pt,
    row-gutter: 8pt,

    text(font: "Carlito", weight: "bold", fill: rgb("#3a4a6b"))[1.],
    [#text(weight: "semibold")[Signal.] A trace in the terrain starts the loop.],

    text(font: "Carlito", weight: "bold", fill: rgb("#3a4a6b"))[2.],
    [#text(weight: "semibold")[Action.] An agent does scoped work.],

    text(font: "Carlito", weight: "bold", fill: rgb("#3a4a6b"))[3.],
    [#text(weight: "semibold")[Verification.] An outside reference verifies the work.],

    text(font: "Carlito", weight: "bold", fill: rgb("#3a4a6b"))[4.],
    [#text(weight: "semibold")[Commit or revert.] The result is either committed or reverted.],

    text(font: "Carlito", weight: "bold", fill: rgb("#3a4a6b"))[5.],
    [#text(weight: "semibold")[Update.] The outcome returns to the terrain as a new signal. That signal decays over time and biases the next loop.],
  )

  #v(0.6em)
  #line(length: 100%, stroke: 0.3pt + luma(200))
  #v(0.4em)

  #set text(size: 9pt, style: "italic", fill: luma(90))
  At stage 4, the steward holds the veto on irreversible actions.
]

#v(0.4em)

A loop is healthy when all five stages exist and are bounded in time and scope, and when the loop closes. A loop closes when the outcome (pass or fail) returns to the terrain as a signal that the next loop can read. Loops that do not close are not loops. They are scripts that are started and then forgotten, and they accumulate debt.

*Every loop needs six ingredients.* A loop that lacks any of them is not yet a loop. It is a script that still needs a home.

#table(
  columns: (auto, 1fr, 1fr),
  table.header[Ingredient][What it is][What happens without it],
  [*Signal*], [A trace in the terrain that starts the loop], [The loop never starts, or it starts on the wrong conditions],
  [*Bounded action*], [An action that is scoped to a specific class of change], [Scope creep. The blast radius exceeds what the reasoning covered],
  [*Verification*], [An outside reference: tests, an eval, human judgment], [The loop approves itself. Drift. Goodhart's Law],
  [*Reversibility*], [A cheap, well-understood undo path], [Mistakes become permanent. Stewards no longer trust the loop],
  [*Signal update*], [The outcome returns to the terrain], [The next loop cannot learn from this one],
  [*Authority surface*], [Explicit rules for when autonomy expands or contracts], [Trust becomes a single global decision, and fragility follows],
)

The dependency-patch loop has all six:

- Signal: _a patch is available, with a clean changelog_.
- Bounded action: _upgrade the version, run the tests, open a change_.
- Verification: _the CI suite_.
- Reversibility: _git revert_.
- Signal update: _the CI result and post-merge rollbacks feed the agent's track record_.
- Authority surface: _auto-merge eligibility by task class and track record_.

= 3.3 — A catalog of real loops

These loops are skeletons. They are intentionally independent of any specific orchestrator, model, vendor, or pipeline. Each is a pattern that recurs across mature software platforms. The fidelity is in the shape, not in the technology.

_A note on specifications, before the catalog._ Specifications are a tool that several of the loops below use, not the philosophy of the framework. They are worth their cost at *boundaries*: contracts with external systems, interfaces between planned and emergent regions, and the schemas that agents emit. They waste their cost in deep emergent territory, where exploration updates the direction and rigid specifications prevent exactly that. Treat specifications like software: version-controlled, tested, and amended as you learn. The specification-by-adversary loop below shows how to convert a specification from a document into a continuously stressed process. That process is strong at boundaries, and weaker where intent resists specification.

== Starter loops — high reversibility, narrow scope, clean signals

Start here. Each starter loop has a clear trigger, a clear verification, and a cheap revert. The goal of the first loop is not the loop. The goal is the template.

*Dependency-patch loop.* This loop is described in §3.1 and §3.2. It is the canonical starter loop.

*Stale-doc refresh loop.* A signal on each documentation page records the _last code change in the covered area_ and the _last documentation update_. When the gap exceeds a threshold, an agent rewrites the page against the current code. The agent flags each sentence where it could not verify a claim. The change ships with a reviewer tagged from the code-ownership file. _Signal produced:_ a freshness field that decays with code changes and resets on review.

*Flaky-test loop.* CI records a pass or a fail for each test in each run. A signal appears when the pass rate of a test falls into a flaky band. An agent attempts one of three scoped interventions: seed isolation, a timing correction, or a retry with a diagnostic. The agent documents the intervention in the change. If the flakiness persists after the attempt, the test goes into quarantine with an assigned owner. _Signal produced:_ a flakiness score per test that compounds across runs.

*Dead-code loop.* Coverage, the import graph, and call telemetry combine into a _deadness_ signal. Code that stays dead across a stability window receives a deprecation proposal. After another window with no usage, an agent opens a change that removes the code. The undo path is cheap: a single revert cancels the whole change. _Signal produced:_ a persistent map of cold regions that informs refactoring.

== Middle loops — wider scope, richer signals, still reversible

After several starter loops run cleanly, richer loops become possible, because the terrain now carries signals that are worth reading.

*Triage loop.* A planner agent reads the full signal field: incident telemetry, the fragility map, freshness scores, and the backlog. It then ranks the next work. It does not do the work itself, but it produces a ranked queue with a rationale. _Signal produced:_ an audit of which ranking criteria correlated with real business outcomes. This audit tunes the ranker.

*On-call assist loop.* When an alert fires, an agent collects the runbook, the recent deploy history, the relevant dashboards, and the last three similar incidents. It drafts a hypothesis and the three most diagnostic items to verify next. The human on call reads, corrects, and acts. _Signal produced:_ the alignment between the agent's hypothesis and the actual root cause. This alignment becomes a confidence signal for decisions to increase autonomy on narrow incident classes.

*Refactor-candidate loop.* A signal combines churn, coupling, fragility, and ownership clarity into a refactor-pressure score. When a cluster exceeds the threshold, an agent proposes a refactor plan, not the refactor itself. The plan includes costs, risks, and a small prototype. A human decides whether to authorize execution. _Signal produced:_ a history of where refactor pressure predicted real architectural debt.

*Test-backfill loop.* A signal identifies code with high churn and low coverage. An agent writes tests that pin the current behavior. The agent marks each test as _behavioral_ (it locks the current behavior) or _specified_ (it tests against documented intent). Behavioral tests are flagged for review, because they encode whatever the code does now, correct or not. _Signal produced:_ a coverage map weighted by criticality.

*Security-patch loop.* A signal listens for CVE advisories and matches them against the dependency graph. An agent opens one change for each affected package, with the advisory, the affected path, and the suggested version. A non-breaking upgrade in a non-critical path is eligible for auto-merge after the agent earns the approval on this task class. For anything else, a human approves. The loop explicitly distinguishes the _availability of a patch_ from the _application of a patch_. _Signal produced:_ the mean time from advisory to remediation, per criticality tier.

== Advanced loops — require mature terrain

Attempt these loops only after the starter loops and the middle loops are durable.

*Feature prototype loop.* A product intent is expressed as a small set of acceptance assertions and UX sketches. That intent becomes a sandbox where one or more agents build competing implementations against the assertions. A human compares the results on feel and fit, and chooses a direction. The loop does not replace product judgment. It parallelizes the _preparatory_ work so that judgment has more options. _Signal produced:_ a library of rejected implementations, which becomes a rich training signal about taste.

*Specification-by-adversary loop.* For a well-bounded interface, the team writes the intent as assertions. Adversarial subagents attempt to falsify each assertion against the implementation. An assertion that survives sustained attack counts as verified. An assertion that falls triggers a human decision: is the implementation wrong, or was the assertion wrong? This loop is most valuable at boundaries, and it degrades in deep emergent territory where intent resists specification. _Signal produced:_ an executable, continuously stressed specification that outlives its authors.

*Migration loop.* A long-running migration (database schema, framework version, API deprecation) is decomposed into a sequence of independently reversible steps. Each step is a loop: prepare, migrate a shard, verify, and then commit or revert. A commit moves the loop to the next shard, and a revert pauses it. The steward owns the decision to commit and go to the next step, and the agent owns the shard work. _Signal produced:_ migration progress as a visible, resumable state. This ends the pattern of migrations that stall invisibly at 40%.

*Capacity-routing loop.* A meta-agent observes the approval rates per task class. It routes incoming work to the agent whose track record best matches the task. Agents that fail receive less work. Agents with a stronger track record receive more work within their task class. The steward sets the routing policy and the gate thresholds. _Signal produced:_ a per-agent specialization pattern that the team can read, reason about, and adjust.

*Disturbance loop.* On a schedule, a deliberately disruptive agent introduces controlled stress into the terrain in these ways:

- It makes a normally available tool fail.
- It removes a piece of context that other agents now rely on.
- It simulates a model regression.
- It revokes a permission temporarily.
- It corrupts a non-critical signal.

The point is not to find bugs, but to make sure that the system does not silently become dependent on the absence of disturbance. The other loops are observed for graceful re-adaptation or collapse. A collapse reveals a hidden dependency for the steward to address. A graceful re-adaptation builds confidence that the dependency was not essential from the start. _Signal produced:_ a map of fragile assumptions and resilient assumptions, which informs where the next round of hardening belongs. (See §2.11 for the discipline that this loop implements.)

== How loops compose

Individual loops are useful. Compounding comes from _loops that read each other's signals_.

The dead-code loop produces a map of cold regions. The refactor-candidate loop reads that map as one of its inputs. The test-backfill loop avoids cold regions and prioritizes regions that are hot but fragile. The migration loop reads coverage from the test-backfill loop to decide which shards are safe to move first. Each loop is simple. The _field of signals_ that they collectively maintain is rich.

No loop calls another loop. Each loop reads the terrain and writes to it. The coordination is in the environment, not in any orchestrator.

= 3.4 — The staged transition

Teams that go directly from traditional engineering to autonomous agents almost always stumble. The cause is rarely the agents. The cause is the terrain that they were dropped into.

The transition that works proceeds in stages. Each stage makes the next stage possible.

#table(
  columns: (auto, 1fr, 1fr),
  table.header[Stage][Move][What it creates],
  [*0. Legible terrain*], [Instrument the environment for non-human readers and writers before any agent does meaningful work], [Structured metadata, signal schemas, standardized tool interfaces],
  [*1. Close one loop*], [Pick one small, reversible loop. Make it work end-to-end], [A working template],
  [*2. Replicate*], [Build more loops of the same shape. Do not broaden any one loop], [Platform capacity],
  [*3. Coordinate*], [Let loops interact through signals in the terrain], [Cross-loop coordination and guardrails],
  [*4. Plan*], [Introduce planners and routers that read the full signal field], [Higher-order agents],
  [*5. Earn the approval*], [One task class at a time, move specific agent-task pairs from _propose_ to _auto-apply with sampling review_. An agent earns the approval on a narrow task class through a track record (see §3.6)], [Autonomy per agent and per task class],
  [*6. De-automate gracefully*], [Keep the ability to revoke an earned approval when a failure mode exceeds what that approval covers], [Durable reversibility],
)

This is not a strict sequence. Stages overlap, and different regions can be at different stages. But the order is real. You cannot skip Stage 0. You cannot run Stage 4 before Stage 3. You cannot responsibly run Stage 5 unless Stages 2 and 3 are durable.

*The stage that is most often skipped is Stage 0.* The result is smart agents that act on illegible terrain: high activity, low signal, and no compounding. _The harness engineering literature (§4.2) is the deepest current account of how to do Stage 0 well. It covers architectural constraints encoded as linters and structural tests, and knowledge stored in the repository instead of in conversation. It also covers "garbage collection" loops that fight entropy. If your team is at Stage 0, that body of work is essential reading._

*The most tempting mistake is to broaden Stage 1 before you replicate it.* A dozen simple loops that compound are better than one sophisticated loop that consumes attention.

_The dependency-patch loop moves through these stages naturally:_

- _Stage 0: the repository must expose dependency metadata, changelogs, and CI status as structured signals._
- _Stage 1: there is one agent and one loop, with human review on every change._
- _Stage 2: there are three or four similar loops for documentation, flaky tests, and dead code._
- _Stage 3: the loops start to read each other's signals. For example, patch decisions consider flakiness history._
- _Stage 4: a triage agent decides which kinds of patches to do first._
- _Stage 5: the patch agent earns auto-merge on clean patch-level upgrades, with a track record above the threshold._
- _Stage 6: when the underlying model changes, or the repository restructures, the earned autonomy is revoked until the agent earns it again._

= 3.5 — The steward's shape

The most persistent misconception about many-hands systems is that they reduce human involvement. They do not. They *reallocate* it. Human involvement moves from the high-volume, low-stakes middle to both ends. It moves upstream to the design of the conditions. It moves downstream to the adjudication of cases that exceed autonomy.

- *Upstream: intent, taste, and the terrain itself.* Agents do not generate purpose. They pursue it. Someone decides what "good" means, where acceptable variance lies, and what the system is _for_. This work cannot be delegated, because it is the work that defines what delegation means.
- *At pace-layer boundaries: codifying norms.* A convention is a useful pattern that agents imitate. When an agent practice consolidates into a convention, the steward notices it and ratifies it. The steward then promotes it from emergent practice to explicit rule. _This is how emergent work keeps each gain and moves forward. Without this step, it drifts with no direction._
- *At boundaries: curating contracts.* Every interface between planned and emergent regions is a living contract. To maintain it, the steward must understand both sides, anticipate change in both, and make revisions that minimize breakage. Good curation is invisible. Poor curation is catastrophic.
- *Downstream: adjudication.* The autonomy envelope is deliberately set so that some cases escalate. When they do, the steward's judgment defines how similar cases will be handled in the future.
- *Periodically: deliberate disturbance.* The steward must keep the system honest about what it depends on. To do this, the steward schedules adversarial pressure (chaos days, removal experiments, red-team passes) even when nothing seems wrong. This matters _especially_ when nothing seems wrong. During months without disturbance, a system accumulates dependencies that the steward does not yet know about. (See §2.11.)
- *Throughout: the veto on irreversible actions.* This veto applies to production deploys, data deletions, external calls with a cost, and legal commitments. The platform proposes. Only a human approves. This is not a position on the limits of AI. It is a position on the cost of being wrong.

In shape, the steward's role is lower in frequency and higher in authority than the traditional engineering role. The steward takes fewer actions, and each action has more weight. If engineers in a mature platform find that they execute more and decide less, the ratios are inverted.

The atomic unit of the steward's authority is the considered approval. It is not a rubber stamp, and it is not a reflex. It is the deliberate approval at the moments that matter. The upstream work supports it, and that work is what made consideration possible at those moments. A steward who approves everything does not steward. A steward who approves nothing has not built the terrain that makes trust possible.

== What goes wrong with the human in the role

The steward's role is harder than it looks. The failures are well documented in fields that automated decades before software did. The aviation literature and the medical literature converged on the same observations, and those observations apply here.

- *Automation bias.* When a system is mostly right, humans no longer verify it. They accept what the system says even when something else in front of them disagrees. Stewards who review at high volume and at a high approval rate gradually become biased in this way and do not notice it.
- *Skill atrophy on rare failures.* The cases that need a human are rare and unusual by construction. They are exactly the cases in which the human now has the least practice. A steward who last reasoned about a hard case months ago is less sharp on it than one who did that work daily.
- *Monitoring fatigue.* It is harder to watch a system that mostly works than to do the work. Attention wanders. A saturated observer misses anomalies that a fresh observer would see immediately.
- *Substitution illusion.* More automation often does not reduce human work. It changes the shape of the work, and the new shape is sometimes harder. The steward role is not a smaller version of the engineer role. It is a different role with its own cognitive demands.

The defense is not willpower. The defense is terrain:

- _Triangulation_ catches what a tired steward misses. It uses multiple metrics, sampled deep review, and adversarial probes.
- _Rotation_ makes sure that no single person holds the role too long.
- _Practice cases_ keep skills current. The steward deliberately practices on hard examples even when none arrive.
- _Time upstream_ makes the role sustainable. This is explicitly budgeted time for terrain design, not only for approval.

The steward's job is to build a system where the human in it can succeed.

= 3.6 — The economics of approval — gate, rate, budget

The steward's approval is scarce by design. _Looks Good To Me_ is engineering shorthand for that approval. It is the considered yes that a human gives at the moment when autonomous work meets judgment. Three operational terms describe how that scarcity is managed. Together, they form the throttle between agent output and human judgment.

- *The gate.* The gate is the boundary where a human approves an agent's proposal. Gates are placed per task class. A proposal that crosses a gate requires a considered approval before it commits. Proposals that do not cross a gate auto-apply within their autonomy envelope.
- *The rate.* The rate is the fraction of gated proposals that earn approval. It is tracked per agent and per task class. An agent's track record is the signal that justifies a move of the gate (Stage 5).
- *The budget.* The budget is the steward's finite capacity for considered approvals per unit of time. It is not a wish. It is a real constraint, like an error budget in site reliability engineering (SRE).

The three are coupled. If you change one, you change the others.

#table(
  columns: (auto, 1fr, 1fr),
  table.header[Lever][What it controls][Failure if mistuned],
  [*Gate*], [Which proposals need human approval and which auto-apply], [Too wide: the budget is exhausted. Too narrow: the commons degrades.],
  [*Rate*], [The fraction of gated proposals that are approved], [Drifts up: rubber-stamp approvals. Drifts down: the agent is misaligned.],
  [*Budget*], [Considered approvals per steward per unit of time], [Too low: a bottleneck. Too high: no capacity for upstream work.],
)

This is the governing inequality, in plain language:

#thesis[Proposals that enter gates per week ≤ approval budget × (1 − false-approval tolerance)]

When inflow exceeds the budget, a queue forms. Queues produce one of two pathologies. Either stewards give rubber-stamp approvals and the approval rate drifts up artificially, or the system stalls and WIP accumulates. Both are signals, not solutions.

*The healthy adjustment is always structural.* If the budget is saturated, the solution is not heroic effort. The solution is one of two moves:

- Widen the autonomy envelope for task classes where the approval rate is consistently high. This moves them below the gate.
- Narrow the envelope where the rate has drifted. This moves those task classes above the gate.

The lever that stays constant is the budget. Stewards are not supposed to work harder. They are supposed to place the gates better.

*Together, the three describe what it means operationally to "earn the approval".* To earn it, an agent produces proposals at a frequency that is compatible with the budget. The agent does so with an approval rate that is high enough to justify a move of the gate. A move of the gate is not a decision made on feel. It is what happens when the numbers say that the gate belongs somewhere else.

*A concrete example.* A team of four engineers shares a steward role on a rotation. Each rotation gives the on-call steward a budget of roughly 30 considered approvals per week. That is enough to review carefully, and it does not consume the rest of the steward's attention. The dependency-patch loop generates 18 proposals a week, with a 96% approval rate over the last quarter. Of the 30-approval budget, this loop currently consumes 18. That is most of the budget on a single task class.

The team moves the gate. Patch-level upgrades that pass CI now auto-merge. Only minor-version upgrades and any CI failure come to the steward. The loop now costs approximately 3 approvals a week, not 18. The reclaimed budget covers the new on-call assist loop that the team just started. Or, in a slow week, it frees the steward to spend that attention upstream on terrain design.

The numbers told the team where the gate belonged. The steward made the move.

= 3.7 — Authority, trust, and the cost of being wrong

#thesis[Useful is not the same as trusted. Readable is not the same as authoritative.]

A system can let an agent see something and not let the agent act on it. A system can let an agent act in one region and not in another. A system can trust an agent's work on Tuesday, and verify it again on Wednesday after a dependency changed overnight. In a many-hands platform, *authority is a design dimension, not an afterthought.*

Guardrails (§2.10) cover the _mechanics_ of containment. This section covers the _philosophy_ of trust: what trust is, how it is earned, and how it erodes.

== Five properties of real trust

Earned autonomy in a many-hands system has five properties. Each missing property is a place where the system will eventually be surprised.

- *Earned.* Trust accumulates through a track record on a specific task class, not by fiat or vendor claim.
- *Narrow.* Trust on one task class does not transfer to another. An agent that earns auto-merge on patch upgrades earns nothing on schema changes.
- *Conditional.* Trust depends on the environment in which it was earned: the model, the tools, the permission set, and the shape of the codebase. The environment is part of the trust.
- *Revocable.* Trust can be withdrawn instantly on evidence of failure. The cost to keep a bad grant is always higher than the friction of revocation.
- *Expiring.* Trust decays over time unless a fresh track record renews it. An agent that does not act in a task class for months starts from a lower baseline.

Together, these five define what it means to *earn the approval*. They are what distinguishes an autonomy grant from unlimited permission.

== The practical rule

#thesis[Trust belongs to a task class in a specific environment. If the environment changes, some trust resets.]

The dependency-patch example shows how this looks in motion. Suppose that the agent has a clean track record on patch upgrades: forty-seven merged and zero reverted. Then one of three things changes:

- *The underlying model changes.* The pipeline upgrades to a new base model, or to a new orchestration layer. The environment that produces the proposals is no longer the environment in which the trust was earned. _Trust drops from auto-merge to propose-plus-review until the new model earns it again._
- *The permission set changes.* The agent gains access to new parts of the repository, or to a new external API. _The old track record does not cover the new surface._ Auto-merge persists on the old task class. The new surface starts at proposal-only.
- *The repository itself changes.* This can be a major refactor, a new framework version, or a migration that changes what a "patch upgrade" means. _The old track record is no longer predictive._ Autonomy resets for a calibration window, until a fresh track record exists.

None of these cases requires the detection of a failure. The trust resets because the environment that it was anchored to has shifted.

== Information vs authority

One pattern deserves an explicit statement. *The right to read is not the right to write, and the right to write is not the right to deploy.* In a many-hands system, each of these rights is a separate grant with a separate evaluation.

- *Read authority* is what an agent can see. The default is wide, so that agents have context. Read authority is narrow only where secrets, personal data, or competitive information require it.
- *Write authority* is what an agent can propose. The default is narrow, with explicit expansion one task class at a time.
- *Commit authority* is what an agent can merge without human approval. The default is none. An agent earns it per task class through its track record.
- *Deploy authority* is what an agent can cause to run in production. By default, an agent is never autonomous on irreversible actions. Agents propose. Humans approve.
- *External authority* is what an agent can do to the world outside the repository (API calls with a cost, emails, filings, trades). It is treated as deploy authority: never autonomous without an explicit human grant for the task class.

This is not bureaucracy. It recognizes that the blast radius of a wrong action depends on which of these authorities is engaged. It also recognizes that confusion between them causes many of the worst failures. One such confusion is to treat read authority as if it implied write authority.

== What counts as irreversible

The reversibility axis (§2.3) is the most important placement question. It relies on a shared judgment by the team about what "irreversible" really means. This is a useful working definition:

#thesis[An action is irreversible if it costs more to undo than not to do.]

That definition is deliberately practical. It includes the obvious cases: data deletion, external financial transactions, legal commitments, and changes to production traffic that affect customers. It also includes the less obvious cases where the _information_ that is released cannot be recalled. A leaked secret, a public announcement, and a sent email are such cases. The team should maintain an explicit list of what counts as irreversible in its context. The team should review that list when the system changes.

The steward's veto applies to irreversible actions. In principle, everything else can be delegated along the graduated trust progression.

== How trust erodes

Trust in a many-hands system decays in predictable ways. Watching for these is part of the steward's job.

- *Silent environmental drift.* The model, the tools, or the permissions changed, and no one reset the autonomy envelopes that assumed the old environment.
- *Class boundary erosion.* Agents start to do work that is _adjacent_ to the task class on which they earned trust. The track record does not transfer, but the auto-merge grant was not tightened.
- *Invisible rubber-stamp approval.* The approval rate stayed high, but the stewards skimmed and did not review. The number no longer means what it meant before.
- *Reputation drag.* An agent that does well on the easy instances of a task class receives auto-merge. The hard instances receive rubber-stamp approvals, because the easy instances trained the steward to trust.

The same move counters each of these: triangulate the trust signal. A track record alone can lie. A track record, sampled deep review, adversarial probes, and the post-merge defect rate cannot all lie at the same time. The deliberate disturbance practice in §2.11 is the systematic version of this move. It applies adversarial pressure to trust grants, on a schedule, before the trust has a chance to expire silently.

= 3.8 — What to measure, and what to leave for judgment

Every metric is a proxy, and every proxy can be gamed. Do not measure nothing, because then you have no view of the system. Do not measure everything, because then you offer many metrics that can be gamed, as Goodhart's Law predicts. Measure a small number of things at each pace layer. Triangulate to defeat single-axis gaming. Reserve the important questions for judgment.

#table(
  columns: (auto, 1fr, 1fr),
  table.header[Pace layer][Good metrics][Notes],
  [Invocation], [Latency, cost, error rate, rollback rate, tool-call failure, escalation rate], [Operational: does it work, and at what cost?],
  [Orchestration / Agent], [Eval scores, *eval drift*, trajectory variety, _ratio of autonomous to assisted_], [The last one is the headline metric of the transition],
  [Capability], [Coverage, integration time, *obsolescence rate*], [High inflow with low retirement means that cruft accumulates],
  [Architecture / Governance], [DORA metrics, SPACE-style orthogonal metrics], [Lagging and coarse _by design_],
)

*Reserve these for judgment, not for a metric:*

- The quality of abstractions
- The coherence of the system's direction
- The taste of the output
- The health of the norms

These cannot be measured. Attempts produce either superficial proxies (lines of code, sentiment scores) or sophisticated proxies that are eventually gamed. Assign them to humans. Trust the judgment.

*The triangulation rule.* If a metric will be used as a target, add at least two independent metrics. Choose metrics that would suffer if the target were gamed. Velocity alone will be gamed. Velocity, change failure rate, and rollback rate together cannot be gamed without a visible cost in the others. *Triangulation is the most practical defense against Goodhart's Law in a platform.*

= 3.9 — Correctness, behavior, and security

So far, the framework has been mostly about coordination, maintainability, and trust. Those are necessary, but they are not sufficient. A platform whose loops compound and whose commons stays clean can still ship code that does the wrong thing. It can also ship code that opens a hole that an attacker can use. _Authority answers who is allowed to do what. Correctness and security answer whether the completed work was right._

One gap must be stated honestly. Birgitta Böckeler identified it in her early read of the OpenAI harness work, and it applies to this framework too. The gap is this: it is easier to specify how code is organized than whether the code does what users really need. Architectural rigor and functional correctness are different problems. The first yields to mechanical enforcement. The second requires deeper feedback between the system and the world that it claims to serve.

*Three commitments belong in any serious many-hands platform.*

- *Behavior verification, not only artifact verification.* Tests that pin current behavior are not the same as tests that verify intended behavior. The terrain needs evals, contracts, or property-based tests that bind the system to _what it should do_, not only to _what it does now_. Where the difference matters, the difference must be visible: behavioral tests are marked as behavioral and are distinct from specification-bound tests. The test-backfill loop in §3.3 does this explicitly.
- *Security as a distinct dimension of trust.* The five properties of trust in §3.7 apply to functional correctness. They also apply, separately, to security posture.

  An agent earned auto-merge on a task class. But did its track record cover injection-prone surfaces? Did it cover authorization-sensitive surfaces? Did the model that earned the trust have the same security training as the model that runs today? These questions are different from the functional questions, and they fail differently.
- *Adversarial pressure on outputs, not only on infrastructure.* The disturbance practice in §2.11 operates on the terrain itself. The same posture applies to outputs: red-team the changes that the system ships. Use adversarial probes, fuzzing, mutation tests, and security scans at agent cadence, not at the cadence of a quarterly audit. The attackers use the same tools as the defenders. The defenders need their tools to run continuously.

The framework gives these concerns the weight that they deserve: it names them explicitly. _Correctness and security are first-class concerns, not downstream consequences of good coordination._ Where this handbook does not address them in detail, the reader should treat that as a gap that I acknowledge, not one that I hide. The literature on secure-by-design, adversarial ML, and verification-aware development is deep. It is the right place to go for the specifics. The contribution of the framework is to insist that these concerns belong in the conversation, not at its edge.

= 3.10 — Boundary conditions

A framework that does not say where it does not apply has not earned its claims. Many Hands Engineering is most useful in some conditions, less useful in others, and explicitly worse than the alternatives in a few.

*Many Hands tends to compound in these conditions:*

- Greenfield or near-greenfield systems, where the terrain can be designed deliberately from the start.
- Codebases with strong, fast tests that give cheap, reliable verification.
- Domains where most changes are reversible and most decisions can be made in the emergent mode.
- Teams with the budget and the discipline to invest in harnesses and terrain before they scale agents.
- Tasks that decompose cleanly into bounded loops with clear signals.

*Many Hands struggles or does not apply well in these conditions:*

- Brownfield codebases that are full of accumulated entropy. There, the cost to build a legible terrain may exceed the cost to do the work the old way.
- Safety-critical or regulated domains (avionics, medical devices, financial settlement, nuclear). There, the planned mode is correctly dominant, and the verification regime is heavyweight by law. Emergent coordination is a category error there, not a tool.
- Highly ambiguous product work, where the question is not _how do we build this_ but _what should we build_. In that domain, human judgment carries most of the load, and many-hands compounding offers little.
- Verification-hard problems, where it is much harder to verify correctness than to produce output (security-sensitive cryptography, novel ML architectures, complex distributed protocols). The framework still applies, but the gates stay tight and the budget stays small for a long time.

*One specific point of honesty: the strength of single, contiguous agent work.* Some of the most productive work that I have seen comes from a skilled engineer who pairs closely with a single capable agent. They work for hours on a focused problem, with no orchestration, no multi-agent coordination, and no platform overhead. There is only one expert and one good tool, in a state of flow. Many Hands Engineering does not replace that mode. It addresses the _other_ mode, which applies in these conditions:

- The work has grown beyond what one expert and one agent can hold in a single session.
- The team ships more than any individual reads.
- The coordination across loops is the bottleneck.

Both modes will coexist. A team that always works in the many-hands mode over-engineers its work. A team that never works in that mode loses compounding that it could have.

There is also a possible future that I want to acknowledge plainly. Single agents that are capable enough may eventually subsume some of what this framework addresses. If one sufficiently capable agent can hold the entire context, do the placement, run the loops, and exercise judgment, the multi-hand coordination layer becomes thinner.

I do not think that we are there. I think the framework is useful in the world that we have, and probably in the world that we will have for the meaningful future. But I would rather name the possibility than pretend that it does not exist.

= 3.11 — Monday morning

When a team reads this and asks _what do we do first_, the answer is almost always the same. *Pick one small closed loop. Make it work end-to-end.*

Do not pick the most interesting loop. Do not pick the loop with the highest return on investment. Pick the loop that you can fully instrument, test, and control within a short cycle. Dependency patches are the canonical starter loop. They have clean signals, clean reactions, and a cheap revert, and humans generally dislike the work.

The point of the first loop is not the loop. The point is the template. After one loop works end-to-end, the second loop is far cheaper, and the third is cheaper still. By the fifth loop, the team has a pattern that it applies almost mechanically. *The platform grows when you add loops, not when you make any single loop smarter.*

Everything in this handbook serves to make the _nth_ loop cheaper than the _(n-1)th_. That includes the spectrum, the pace layers, the commons, the guardrails, the trust model, and the measurements. A team with one working loop and the confidence to replicate the pattern is ahead of a team with elaborate architecture and no working loop.

Start there.

// ─────────────────────────────────────────────────────────
// PART IV
// ─────────────────────────────────────────────────────────

#part("IV", "Foundations")

#set page(numbering: "1", header: align(right)[
  #text(size: 9pt, fill: luma(100))[Part IV — Foundations]
  #v(-0.7em)
  #line(length: 100%, stroke: 0.4pt + luma(200))
])

This part gives the lineage, the mathematics, the evidence, and the open questions. Each is flagged honestly. This part is a reference, not a primary read.

= 4.1 — Intellectual inheritance

- *Biology and swarm intelligence.* Grassé coined _stigmergie_ in 1959 for termite construction. Theraulaz and Bonabeau formalized the mechanism. Dorigo's Ant Colony Optimization (from 1992) extracted it into a rigorous algorithmic framework. _The evidence is strong._
- *Economics and distributed knowledge.* Hayek (1945) described prices as compressed signals of dispersed knowledge. *Ostrom's #emph[Governing the Commons] (1990)* covers how decentralized institutions succeed where markets and central planning fail. _The evidence is strong: this is one of the most empirically grounded bodies of work in social science._
- *Open source.* Raymond's _The Cathedral and the Bazaar_ (1997, 1999) is the origin of the vocabulary that this framework renames to planned/emergent. The change is mine. I made it because the new terms travel better across technical audiences and across the many applications of the planned/emergent distinction beyond open source. _The conceptual debt is total._
- *Organizations.* Conway (1968) stated that organizations ship their communication structure. Simon (1962) described near-decomposability. Brand (1994) described pace layering. _The evidence is strong across decades._
- *Cybernetics.* Ashby (1956) described requisite variety as a lower bound on regulation. Beer described the viable system model. _The evidence is strong in theory and mixed in institutional application._
- *Military command.* Prussian _Auftragstaktik_ and modern mission command say: specify the intent, delegate the means, and trust the unit. _The historical evidence is strong._
- *Software and systems.* Brooks (1975) described planned-mode pathologies. The distributed-systems canon (CAP, CRDTs, Kubernetes reconciliation, gossip protocols) is the engineering vocabulary for emergent coordination. The formal-methods tradition (TLA+ at AWS and Azure, the B method at RATP, property-based testing) is the engineering vocabulary for planned guarantees. _The evidence is strong in both directions._
- *Human factors.* Bainbridge (1983) described the ironies of automation. Other research covers automation bias, complacency, and skill atrophy. _The evidence is strong across aviation, medicine, and now AI-assisted engineering._
- *Security and authority.* Least-privilege design is from Saltzer & Schroeder (1975). The references for capability-based security are Dennis and Van Horn (1966) and modern work at Cambridge and MIT. The reference for zero-trust architecture is NIST SP 800-207 (2020). _The evidence is strong. The authority model in §3.7 is a direct adaptation._
- *Philosophy of complexity.* Scott's _Seeing Like a State_ (1998) contrasts legibility with _metis_. Alexander (1965) wrote "A City is Not a Tree." _The evidence is mixed to strong. It depends on the claim._

= 4.2 — Harness engineering, a closely related discipline

A related body of practice converged in early 2026, under the name *harness engineering*. The chronology deserves an explicit statement, because it shows that the field reached similar conclusions independently and quickly:

- #block(breakable: false)[*February 5, 2026*: Mitchell Hashimoto publishes the originating definition:

  _"anytime you find an agent makes a mistake, you take the time to engineer a solution such that the agent never makes that mistake again."_]
- *February 11*: OpenAI publishes _Harness Engineering: Leveraging Codex in an Agent-First World_. It documents an internal experiment that shipped roughly a million lines of production code with no human-typed source.
- *February 17*: Birgitta Böckeler (Thoughtworks) publishes the first analysis memo that identifies the convergence and names the gaps. The notable gap is that maintainability is addressed, but functional correctness is not.
- *March 2*: Stripe documents an evaluation harness for coding agents.
- *March 12*: HumanLayer publishes on harness configuration for coding agents.
- *March 24*: Anthropic publishes design notes for long-running application harnesses.
- *April 2*: Böckeler publishes a fuller framework, with categories of guides, sensors, and harness templates.

The core observation across these sources matches mine. As agents do more of the writing, the engineer's primary work shifts to _the design of the environment in which the agent operates._ OpenAI summarized it as _"designing environments, feedback loops, and control systems."_ That phrase could be the core of this framework.

*The relationship to Many Hands Engineering is one of scope.* Harness engineering focuses on the per-agent execution environment: tools, context architecture, structured documentation, architectural constraints, custom linters, and garbage-collection loops. Many Hands Engineering is one level higher. It covers these questions:

- How multiple harnessed agents share a commons
- Where decisions are placed on the planned/emergent spectrum
- How authority is granted and revoked
- How work compounds across loops
- How human stewardship operates at a different rate than agent execution

_A harness is a critical layer of terrain._ Specifically, it is the per-agent layer. A team with excellent harnesses but no shared terrain produces reliable per-agent work that fails to compound. A team with broad terrain but weak harnesses has agents that cannot be trusted to do anything.

The two converge, and they do not compete. The harness engineering practices documented in early 2026 map directly onto Stage 0 of the staged transition (§3.4). Stage 0 is the substrate layer that everything else builds on. Where harness engineering is more developed, this framework defers to it. Many Hands extends into multi-agent coordination, the commons, the trust economy, the steward's role, and placement. There, it builds on the harness layer and does not replace it.

= 4.3 — Mathematical backbone

A note before the list: the results below are real mathematics. In this framework, they function primarily as *analogies and design intuitions*, not as predictive models that a team can compute against. CAP and FLP do constrain what distributed systems can promise. Mean-field games do model populations that interact through aggregate effects. Keller–Segel does produce blow-up without decay.

But the bridge from the mathematics to a specific operational decision in your platform is currently informal. The framework has not tried to give you state variables or measurable thresholds to compute against, and it probably should not. Treat these results as the foundation for why the framework's instincts are sound, not as equations to solve.

- *Reaction–diffusion / Keller–Segel*: without sufficient decay, self-reinforcing aggregation produces finite-time blow-up. This is the mathematical form of runaway.
- *Bifurcation*: self-reinforcing dynamics change qualitatively at critical thresholds. This is the canonical form of trail formation in emergent systems.
- *Mean-field game theory (Lasry–Lions, Huang–Malhamé–Caines)*: many strategic agents interact through aggregate effects. The equilibrium is a consistency fixed point.
- *ACO convergence (Gutjahr, Stützle–Dorigo)*: reinforcement systems converge to the optimum _only_ with a positive lower bound that preserves exploration. The floor is not decorative.
- *CAP / PACELC / FLP*: consistency, availability, and partition tolerance are not achievable at the same time. There is a trade-off between latency and consistency even without partitions. Deterministic asynchronous consensus tolerates no failures.
- *Ashby's Law*: the regulator must match the regulated system in distinguishable states.
- *Coordination complexity*: a full mesh requires N² channels. A shared medium requires N. The difference is combinatorial, not ideological.

= 4.4 — Evidence base, weighted

- *Very strong:*
  - The mathematical results
  - The impossibility theorems of distributed systems
  - The empirical record of major failures (Knight Capital, AWS US-EAST-1, Meta BGP 2021, CrowdStrike 2024, XZ Utils, NPfIT, Healthcare.gov)
  - Automation-bias research
  - The DORA/Accelerate correlations between practice and performance
  - Conway's Law
  - Ostrom's design principles
- *Strong:*
  - The shape of effective engineering practices (CI, small batches, observability, progressive delivery)
  - Formal methods in safety-critical domains
  - The broad outline of where autonomous coding agents succeed (narrow, reversible, well-tested work) and where they fail (ambiguous, cross-cutting, novel work)
- *Mixed:*
  - Vendor productivity claims for AI coding assistants
  - Benchmark numbers for autonomous agents
  - Specific multi-agent orchestration patterns compared with strong single-agent baselines at equivalent compute
  - The Spotify model
  - "Edge of chaos" as a design principle
- *Sparse:*
  - Long-term effects of skill atrophy
  - Optimal frequencies of human intervention
  - Specification-driven development with AI at industrial scale
  - Case studies of adversarial specification testing
  - Industry-wide failure telemetry for autonomous coding agents

This is the distribution behind the _epistemic stance_ that Part I declares. The structural claims are in the band from very strong to strong. The specific operational recommendations are in the band from strong to mixed. Those recommendations are placement, the staged transition, approval economics, and the five properties of trust. None of the framework rests on sparse evidence. Where it touches sparse territory, I say so.

= 4.5 — Open questions

- What are the phase-transition thresholds for multi-agent systems? The mathematics says that they exist. The specific numbers are not established.
- What is the distribution of failure modes of autonomous coding agents in production at scale? Most of the interesting data is proprietary.
- How do teams effectively move agents from supervised work to autonomous work? The staging in Part III is a principled proposal, not a verified one.
- What long-term effects does heavy reliance on agents have on engineering skill, organizational knowledge, and commons health? Historical parallels from aviation and medicine suggest significant effects. Whether those effects appear in software, and at what cadence, is unknown.
- How should specifications and agents relate in mature workflows? The intuitive case is strong. The empirical case is young.
- How does earned trust actually transfer, or fail to transfer, across model upgrades? The theory says that it should not transfer. The economics say that teams will try anyway.

These are not flaws in the framework. They are the frontier of the field. A team that holds the framework lightly in these areas will outperform a team that treats any recommendation as settled. To hold it lightly is to treat it as a starting point for the team's own learning. *The spectrum applies to the framework itself: its invariants are planned, and its specific practices are emergent.*

// ─────────────────────────────────────────────────────────
// CODA
// ─────────────────────────────────────────────────────────

#pagebreak()
#set page(header: none)

= Coda

Software is the work of many hands. Some are human, and some are not. Some are fast, some are slow, and some carry judgment.

The old engineering wisdom still matters. It is no longer enough.

What is needed now is a craft of _placement_. That craft is to know what should be planned and what should be allowed to emerge. It is also to know where reversibility must be preserved and where judgment must stay human.

Loops are the operating unit. Signals are how loops coordinate. Boundaries hold the seams. Stewards hold the intent. Trust is earned, narrow, conditional, revocable, and expiring.

Entropy is the default. Deliberate disturbance is how the system stays honest about what it depends on. The approval at the end is the moment when the work becomes real.

The framework will be wrong in specific ways, and it should be revised when the evidence demands it. But this handbook defends the view that the shape of the framework is durable. That shape is many hands, a system around them, placement as the central discipline, and humans upstream and downstream but not in the middle.

Build accordingly. And when the terrain is well built, and the loops run, and the work is worth your approval, say so.

#thesis[It used to be making the thing. Now it's making the thing that makes the thing.]
