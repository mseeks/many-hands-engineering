// The case bank — the book's judgment system.
// 42 cases across six kinds: placement calls, spiral recognition, is-it-a-loop,
// gate moves, trust resets, and decline calls. Every feedback string ARGUES from
// the framework's axes, warning signs, ingredients, or arithmetic; none of them
// hands down a verdict. Contested cases carry no answer: their feedback states
// what each reading commits you to.
//
// Shapes here are frozen contracts (see ENGINE-SPEC.md). The Drill component
// renders these cases; scoreAxes and drawCases below are its engine.

import { shuffle } from './rng.js';

/**
 * @typedef {{ label: string, text: string }} Evidence
 * @typedef {{ reversibility: 'cheap'|'costly', legibility: 'specified'|'exploratory',
 *             coupling: 'loose'|'tight' }} AxesTruth
 * @typedef {{ id: string, kind: 'placement'|'spiral'|'loop'|'gate'|'trust'|'decline',
 *             surface: string, prompt: string, evidence: Evidence[],
 *             axesTruth?: AxesTruth, axesWhy?: object, quadrant?: boolean,
 *             options?: {id: string, label: string}[], answer?: string,
 *             contested?: boolean, feedback: Object<string,string>,
 *             fromChapter: number }} Case
 * @typedef {{ seen: string[], missedKinds: string[] }} DrillState
 */

// ─── quadrantForAxes ───

/**
 * Map the two placement axes to a quadrant id.
 * Reversibility picks the column, legibility picks the row. Coupling does not
 * pick the quadrant: tight coupling pulls a decision toward the planned pole,
 * and the feedback argues that pull case by case rather than coding it here.
 * @param {AxesTruth} axesTruth
 * @returns {'planned'|'emergent-spec'|'danger'|'emergent-explore'}
 */
export function quadrantForAxes(axesTruth) {
  const reversible = axesTruth.reversibility === 'cheap';
  const specified = axesTruth.legibility === 'specified';
  if (specified) return reversible ? 'emergent-spec' : 'planned';
  return reversible ? 'emergent-explore' : 'danger';
}

// ─── quadrantForAxes end ───

// ─── scoreAxes ───

const PLACEMENT_AXES = ['reversibility', 'legibility', 'coupling'];

/**
 * Compare a reader's axis calls against a placement case's ground truth.
 * A missed axis comes back with the truth and the case's own rationale (why),
 * so feedback can argue instead of grade.
 * @param {Case} c
 * @param {object} readerAxes e.g. { reversibility: 'cheap', legibility: 'specified', coupling: 'loose' }
 * @returns {{ agreed: string[], missed: {axis: string, truth: string, why: string}[] }}
 */
export function scoreAxes(c, readerAxes) {
  const agreed = [];
  const missed = [];
  if (!c.axesTruth) return { agreed, missed }; // only placement cases carry axes
  for (const axis of PLACEMENT_AXES) {
    const truth = c.axesTruth[axis];
    if (readerAxes && readerAxes[axis] === truth) {
      agreed.push(axis);
    } else {
      missed.push({ axis, truth, why: (c.axesWhy && c.axesWhy[axis]) || '' });
    }
  }
  return { agreed, missed };
}

// ─── scoreAxes end ───

// ─── drill state ───

/** A fresh drill state: nothing seen, no categories missed. */
export function makeDrillState() {
  return { seen: [], missedKinds: [] };
}

/**
 * Record one committed answer. A miss flags the case's kind so later draws
 * resurface that category first; one agreed answer in the kind clears the flag.
 * Pure: returns a new state.
 * @param {DrillState} state
 * @param {string} caseId
 * @param {boolean} agreed did the reader's call match the case's answer/axes?
 */
export function recordOutcome(state, caseId, agreed) {
  const c = CASES.find((x) => x.id === caseId);
  if (!c) return state;
  const seen = state.seen.includes(caseId) ? state.seen : [...state.seen, caseId];
  let missedKinds = state.missedKinds;
  if (!agreed && !missedKinds.includes(c.kind)) {
    missedKinds = [...missedKinds, c.kind];
  } else if (agreed && missedKinds.includes(c.kind)) {
    missedKinds = missedKinds.filter((k) => k !== c.kind);
  }
  return { seen, missedKinds };
}

// ─── drill state end ───

// ─── drawCases ───

/**
 * Deal cases round-robin across kinds so consecutive cases change surface as
 * often as the pool allows. Groups are shuffled internally, then dealt.
 */
function interleaveKinds(cases, rng) {
  const byKind = new Map();
  for (const c of cases) {
    if (!byKind.has(c.kind)) byKind.set(c.kind, []);
    byKind.get(c.kind).push(c);
  }
  const groups = shuffle(
    rng,
    [...byKind.values()].map((g) => shuffle(rng, g)),
  );
  const out = [];
  let dealt = true;
  while (dealt) {
    dealt = false;
    for (const g of groups) {
      if (g.length > 0) {
        out.push(g.shift());
        dealt = true;
      }
    }
  }
  return out;
}

/**
 * Draw n cases for a drill. Unseen cases come first; once the pool is
 * exhausted, seen cases recycle. With missedFirst, kinds the reader has missed
 * resurface before anything else; the rest interleaves across kinds.
 * Deterministic for a given rng stream.
 * @param {DrillState} state
 * @param {{ kind?: string, n: number, missedFirst?: boolean, rng: () => number }} opts
 * @returns {{ cases: Case[], state: DrillState }}
 */
export function drawCases(state, { kind, n, missedFirst = true, rng }) {
  const pool = kind ? CASES.filter((c) => c.kind === kind) : CASES;
  const unseen = pool.filter((c) => !state.seen.includes(c.id));
  const recycled = pool.filter((c) => state.seen.includes(c.id));

  let ranked;
  if (missedFirst && state.missedKinds.length > 0) {
    const missed = unseen.filter((c) => state.missedKinds.includes(c.kind));
    const rest = unseen.filter((c) => !state.missedKinds.includes(c.kind));
    ranked = [...shuffle(rng, missed), ...interleaveKinds(rest, rng)];
  } else {
    ranked = interleaveKinds(unseen, rng);
  }
  ranked = [...ranked, ...interleaveKinds(recycled, rng)];

  const cases = ranked.slice(0, n);
  const seen = [...new Set([...state.seen, ...cases.map((c) => c.id)])];
  return { cases, state: { ...state, seen } };
}

// ─── drawCases end ───

// ─────────────────────────────────────────────────────────────────────────────
// THE BANK
// ─────────────────────────────────────────────────────────────────────────────

/** @type {Case[]} */
export const CASES = [
  // ═══ PLACEMENT (14) — quadrant cases; evidence carries the three axes ═══

  {
    id: 'pl-01',
    kind: 'placement',
    surface: 'Data platform: choosing the partition key for the 90 TB events table.',
    prompt: 'Place the decision: which column partitions the events table.',
    evidence: [
      {
        label: 'Undo cost',
        text: 'Re-partitioning means a full rewrite: about $14,000 in compute and six days of backfill, with freshness SLAs suspended throughout.',
      },
      {
        label: 'Spec stability',
        text: 'Eighteen months of query logs; 94% of scans filter by event_date. The access pattern is measured and stable.',
      },
      {
        label: 'Coupling',
        text: '23 dashboards and 4 ML feature jobs key their scans to the partition column.',
      },
    ],
    axesTruth: { reversibility: 'costly', legibility: 'specified', coupling: 'tight' },
    axesWhy: {
      reversibility:
        'A six-day, $14k rewrite with SLAs suspended is not an undo; it is a recovery project.',
      legibility:
        'Eighteen months of query logs converge on one access pattern; the problem is measured, not guessed.',
      coupling: 'When the partition column moves, 27 downstream consumers move with it.',
    },
    quadrant: true,
    answer: 'planned',
    feedback: {
      planned:
        'Costly to undo, specified by eighteen months of logs, and 27 consumers move when it moves. All three axes point the same way; spend the design meeting here, once.',
      'emergent-spec':
        'Specified, yes, but read the undo column: a $14k six-day rewrite with SLAs suspended. Reversible means a revert, not a recovery project, so the cost axis pulls this across the line into planned.',
      danger:
        'The exploration is already done: 94% of scans filter the same column. With the problem this legible you are not in the foraging quadrant; you are in planned territory with the homework finished.',
      'emergent-explore':
        'Foraging on a 90 TB partition key means each experiment costs six days and $14k to walk back, and 27 consumers feel every try. Both axes argue against exploring here.',
    },
    fromChapter: 5,
  },

  {
    id: 'pl-02',
    kind: 'placement',
    surface: 'Developer experience: an internal CLI for tailing and filtering local trace output.',
    prompt: "Place the decision: how the trace-tail CLI's filter syntax works.",
    evidence: [
      {
        label: 'Undo cost',
        text: 'A breaking syntax change costs each of the ~10 users a minute of relearning. Nothing scripts against it yet.',
      },
      {
        label: 'Spec stability',
        text: 'Nobody can articulate the filter grammar engineers actually want; the three loudest users want three different things.',
      },
      {
        label: 'Coupling',
        text: 'Standalone binary. No CI job, no script, no service consumes its output.',
      },
    ],
    axesTruth: { reversibility: 'cheap', legibility: 'exploratory', coupling: 'loose' },
    axesWhy: {
      reversibility: 'A breaking change costs ten users a minute each; that is the whole bill.',
      legibility:
        'Three users want three different grammars; the spec does not exist to write yet.',
      coupling: 'Nothing scripts against it and nothing consumes its output.',
    },
    quadrant: true,
    answer: 'emergent-explore',
    feedback: {
      'emergent-explore':
        'Undo is a minute of relearning for ten people, the need is genuinely unsettled, and nothing downstream consumes it. This is what the foraging quadrant is for: let versions compete and keep what survives.',
      planned:
        'A design review here buys a specification of a grammar nobody can articulate yet, insuring against a loss that costs less than the meeting. The undo column reads one minute, ten users.',
      'emergent-spec':
        'Reversible, yes, but read the spec-stability evidence: three users, three contradictory grammars. The spec does not exist to converge on yet, so the exploratory half of the emergent zone fits better.',
      danger:
        'Check the undo column before assigning danger: a syntax break costs ten users a minute each. The danger quadrant is reserved for the irreversible, and this is about as reversible as software gets.',
    },
    fromChapter: 5,
  },

  {
    // The reversible-looking deletion: the soft-delete window flatters the
    // undo cost; the nightly export sets the real one.
    id: 'pl-03',
    kind: 'placement',
    surface:
      'Data compliance: a batch job hard-deletes user rows flagged for erasure, behind a 30-day soft-delete window.',
    prompt: 'Place the decision: how the erasure job selects and deletes flagged rows.',
    evidence: [
      {
        label: 'Undo cost (apparent)',
        text: 'Deleted rows sit in a soft-delete table for 30 days; restore is one command. The runbook calls the job fully reversible.',
      },
      {
        label: 'The export',
        text: 'A nightly export ships the same tables to two analytics partners. Rows deleted in error are absent from the export; rows kept in error have already shipped by morning.',
      },
      {
        label: 'Coupling',
        text: 'Erasure flags come from support tooling, legal holds, and a self-serve form: three upstream systems write the flag.',
      },
    ],
    axesTruth: { reversibility: 'costly', legibility: 'specified', coupling: 'tight' },
    axesWhy: {
      reversibility:
        "The soft-delete window covers your tables, not the partners' copies. An action is irreversible when undoing it costs more than not doing it, and information that has shipped cannot be recalled.",
      legibility:
        'Erasure semantics are pinned by regulation and the flag contract; this is a known problem, deliberately specified.',
      coupling:
        'Three upstream writers and two external consumers; a selection bug propagates in both directions.',
    },
    quadrant: true,
    answer: 'planned',
    feedback: {
      planned:
        'The runbook says reversible; the export says otherwise. A row kept in error has shipped to two partners by morning, and released information cannot be recalled. That sets the real undo cost high, the semantics are regulated and specified, and the coupling is external. Planned, with a human gate on the selection logic.',
      'emergent-spec':
        "This placement reads the soft-delete window as the undo path, and that is the near-miss: the window restores your tables, not the partners' copies. Once a record ships in the nightly export, the information is out and cannot be recalled. Score reversibility by the most expensive copy, not the closest one.",
      danger:
        'Half the call lands: the irreversibility is real. But the semantics are not exploratory; erasure is specified by regulation and the flag contract. Specified plus irreversible is the planned quadrant, where careful design and a gate are the move.',
      'emergent-explore':
        'Foraging here means an agent experimenting with selection logic whose mistakes ship to two partners overnight. The 30-day window flatters the undo cost; the export sets the true one.',
    },
    fromChapter: 19,
  },

  {
    // Contested: the same rubric is exploratory terrain today and verification
    // terrain the day it gates merges. The lean below (cheap/exploratory) is
    // the author's placement for *today*; the contest is which week you place for.
    id: 'pl-04',
    kind: 'placement',
    surface: "Eval harness: the scoring rubric for a support-ticket triage model's weekly eval.",
    prompt: "Place the decision: what the triage eval's rubric rewards.",
    evidence: [
      {
        label: 'Undo cost',
        text: 'The rubric is a versioned YAML file; reverting a rubric change is one commit.',
      },
      {
        label: 'Spec stability',
        text: 'What good triage means is still moving: two taxonomy changes and one priority-policy reversal in the last quarter.',
      },
      {
        label: 'The gate question',
        text: 'Next sprint, a proposal would make this eval a merge gate: triage-model changes auto-merge when the eval score holds.',
      },
    ],
    axesTruth: { reversibility: 'cheap', legibility: 'exploratory', coupling: 'loose' },
    axesWhy: {
      reversibility:
        'Today, one commit reverts it. The day it gates merges, a flawed rubric lands in every auto-merged change, and undo means re-reviewing what it waved through.',
      legibility:
        'Two taxonomy changes and a policy reversal in one quarter: the target is moving.',
      coupling: 'Advisory today; coupled to every triage merge the day it becomes a gate.',
    },
    quadrant: true,
    contested: true,
    feedback: {
      'emergent-explore':
        'Defensible today: one-commit undo, a moving target, nothing downstream. This reading commits you to keeping the eval advisory. The moment it becomes a merge gate you owe the placement a re-run, because the undo cost stops being one commit and becomes every change it waved through.',
      planned:
        'Defensible if you place for next sprint instead of today: an eval that gates merges is verification terrain, and Goodhart pressure arrives with the authority. This reading commits you to planned ceremony now, review on every rubric change, for a rubric still chasing a moving taxonomy. Two defensible placements; the difference is which week you are placing for.',
      'emergent-spec':
        'The undo is cheap, but read the spec-stability evidence: two taxonomy changes and a policy reversal in one quarter. Calling this specified pins the rubric to a target that moved twice last quarter.',
      danger:
        "Today nothing here is irreversible: one commit reverts the rubric and nothing consumes the score. The danger reading borrows next sprint's coupling and today's illegibility at the same time. Pick which week you are placing, then re-read the axes.",
    },
    fromChapter: 5,
  },

  {
    id: 'pl-05',
    kind: 'placement',
    surface:
      'Mobile: the release train for the iOS app, shipping to ~2M devices through store review.',
    prompt: 'Place the decision: what gets into a release-train build.',
    evidence: [
      {
        label: 'Undo cost',
        text: 'A defective binary cannot be pulled back from devices. The fix is an expedited re-submission: one to three days in review while the defect runs.',
      },
      {
        label: 'Spec stability',
        text: 'The train is rehearsed: cut Tuesday, bake 48 hours, staged rollout 1% to 10% to 100%.',
      },
      {
        label: 'Coupling',
        text: "One binary carries every team's features; a single regression holds the whole train.",
      },
    ],
    axesTruth: { reversibility: 'costly', legibility: 'specified', coupling: 'tight' },
    axesWhy: {
      reversibility:
        'A shipped binary cannot be recalled; the undo is one to three days of a live defect on 2M devices.',
      legibility:
        'Cut Tuesday, bake 48 hours, staged rollout: the process is rehearsed to the hour.',
      coupling: 'One binary, every team; a single regression holds the train.',
    },
    quadrant: true,
    answer: 'planned',
    feedback: {
      planned:
        'Undo is one to three days of a live defect on 2M devices, the process is rehearsed to the hour, and one binary couples every team. The axes agree, so the gate before the cut earns its ceremony.',
      'emergent-spec':
        'The staged rollout caps blast radius, but it does not create an undo: the 1% who got the defect keep it for the days re-review takes. Damping is not reversibility; the undo column still reads costly.',
      'emergent-explore':
        'Two axes argue back: the train is rehearsed, nothing left to explore in the process, and a shipped binary has no cheap undo. Foraging belongs behind remotely killable flags inside the app; the train is the irreversible shell around that.',
      danger:
        'The irreversibility is real, but the train is the opposite of exploratory: cut Tuesday, bake 48 hours, staged rollout. A rehearsed, specified process with costly undo is planned; danger is for problems nobody has pinned down yet.',
    },
    fromChapter: 5,
  },

  {
    id: 'pl-06',
    kind: 'placement',
    surface:
      'ML feature store: adding days_since_last_order as a new feature, shadow-written, no consumers yet.',
    prompt: "Place the decision: the new feature's transform and backfill.",
    evidence: [
      {
        label: 'Undo cost',
        text: 'No model reads it yet; dropping the column is one migration, and the shadow write turns off in config.',
      },
      {
        label: 'Spec stability',
        text: 'The transform is fully specified: order timestamps in, integer days out, null for never-ordered.',
      },
      {
        label: 'Coupling',
        text: 'Zero consumers until a model opts in; opt-in is explicit per model.',
      },
    ],
    axesTruth: { reversibility: 'cheap', legibility: 'specified', coupling: 'loose' },
    axesWhy: {
      reversibility: 'One migration drops it; one config line stops the shadow write.',
      legibility: 'Timestamps in, integer days out, null for never-ordered: the spec is finished.',
      coupling: 'Nothing reads it until a model explicitly opts in.',
    },
    quadrant: true,
    answer: 'emergent-spec',
    feedback: {
      'emergent-spec':
        "Specified transform, one-migration undo, zero consumers. Let the loop add it, let CI verify the backfill, and save the steward's attention for the day a fraud model opts in.",
      planned:
        'A design gate here buys insurance on a column nothing reads, with a one-migration undo. Planned treatment of every additive change is how approval budgets saturate; the axes say the attention belongs elsewhere.',
      'emergent-explore':
        'The undo is cheap, but nothing here is exploratory: timestamps in, integer days out, null for never-ordered. The spec is finished, so this sits in the specified half of the emergent zone, where verification is mechanical.',
      danger:
        'Check both axes: a one-migration undo and a finished spec. The day this column feeds a fraud model its placement changes; today it is about as safe as feature work gets.',
    },
    fromChapter: 5,
  },

  {
    id: 'pl-07',
    kind: 'placement',
    surface:
      'ML feature store: normalizing the existing days_since_signup feature, consumed by nine models including fraud.',
    prompt: 'Place the decision: changing the semantics of a live, shared feature.',
    evidence: [
      {
        label: 'Undo cost',
        text: 'Nine models trained on the old semantics. After the change their inputs shift silently; undo means coordinated retrains and a backfill, measured in weeks.',
      },
      {
        label: 'Spec stability',
        text: 'The new definition is precise: calendar days, UTC, capped at 730.',
      },
      {
        label: 'The diff',
        text: 'The change itself is four lines in one transform file. It looks like a cleanup.',
      },
    ],
    axesTruth: { reversibility: 'costly', legibility: 'specified', coupling: 'tight' },
    axesWhy: {
      reversibility:
        'Undo is weeks of coordinated retrains across nine models whose training data baked in the old semantics.',
      legibility: 'Calendar days, UTC, capped at 730: the definition is finished arithmetic.',
      coupling:
        'Nine trained consumers, including fraud, shift silently when the transform shifts.',
    },
    quadrant: true,
    answer: 'planned',
    feedback: {
      planned:
        'Four lines in one file, and weeks of coordinated retrains to undo. The diff size lies about the decision size; the nine trained consumers set the real undo cost. Specified, costly, tight: planned, with the fraud team in the room.',
      'emergent-spec':
        'This reading prices the change by its diff: four lines, precise spec. But the undo column reads weeks of retrains across nine models whose training data baked in the old semantics. Training-serving skew is invisible in the diff and expensive in the undo.',
      'emergent-explore':
        'There is nothing to explore: the new definition is finished arithmetic. Exploration belongs in a new column with zero consumers, never in mutating one with nine.',
      danger:
        'The cost is real but so is the legibility: calendar days, UTC, capped at 730 is a finished spec. You are not foraging; you are making one specified, expensive, coupled change. That is planned work.',
    },
    fromChapter: 5,
  },

  {
    id: 'pl-08',
    kind: 'placement',
    surface: 'IaC: a Terraform module spinning up ephemeral preview environments per PR.',
    prompt: 'Place the decision: how preview environments are shaped and torn down.',
    evidence: [
      {
        label: 'Undo cost',
        text: 'Environments live for the PR and die on merge; a bad module version is fixed by destroy-and-recreate in about 8 minutes.',
      },
      {
        label: 'Spec stability',
        text: 'Teams keep asking for shapes nobody predicted: seeded data, fake payments, snapshot restore. The requirements list has doubled twice this quarter.',
      },
      {
        label: 'Coupling',
        text: 'Previews share nothing with production; state is per-PR and disposable.',
      },
    ],
    axesTruth: { reversibility: 'cheap', legibility: 'exploratory', coupling: 'loose' },
    axesWhy: {
      reversibility: 'Destroy-and-recreate in 8 minutes, on state that is disposable by design.',
      legibility:
        'The requirements list doubled twice in a quarter; the shape is still being discovered.',
      coupling: 'Previews share nothing with production and nothing depends on their shape yet.',
    },
    quadrant: true,
    answer: 'emergent-explore',
    feedback: {
      'emergent-explore':
        'Destroy-and-recreate in 8 minutes, requirements doubling twice a quarter, total isolation from production. Let teams fork the module and let the useful shapes win; convergence can be ratified later, once the requirements stop moving.',
      planned:
        "A planned interface here freezes this quarter's guess about a requirements list that has doubled twice in that quarter. The undo is 8 minutes; the insurance costs more than its premium. Planned becomes right when previews stabilize and other systems start depending on their shape.",
      'emergent-spec':
        'Reversible, yes, but the specified half does not hold: teams keep asking for shapes nobody predicted. Calling it specified closes a requirements conversation that is still producing new answers.',
      danger:
        'Nothing here is irreversible: previews share nothing with production and die on merge. The quadrant check takes one line of evidence, destroy-and-recreate in 8 minutes.',
    },
    fromChapter: 5,
  },

  {
    id: 'pl-09',
    kind: 'placement',
    surface: "IaC: carving the CIDR plan for a new region's VPCs and subnets.",
    prompt: "Place the decision: the new region's address plan.",
    evidence: [
      {
        label: 'Undo cost',
        text: 'Re-IPing later means touching every peering, firewall rule, and route table that ever referenced the ranges; the last re-IP took a quarter.',
      },
      {
        label: 'Spec stability',
        text: 'Growth projections and subnet math are known inputs; the address plan is arithmetic, not research.',
      },
      {
        label: 'Coupling',
        text: 'Four peered VPCs, two VPNs, and an on-prem range all have to agree with the plan, indefinitely.',
      },
    ],
    axesTruth: { reversibility: 'costly', legibility: 'specified', coupling: 'tight' },
    axesWhy: {
      reversibility: 'The last re-IP took a quarter and touched every referencing rule and route.',
      legibility: 'Growth projections and subnet math are known inputs; this is arithmetic.',
      coupling: 'Four peered VPCs, two VPNs, and on-prem must agree with the ranges, indefinitely.',
    },
    quadrant: true,
    answer: 'planned',
    feedback: {
      planned:
        'The undo is a quarter of re-IPing across every peering and firewall rule, the math is known, and four VPCs plus on-prem must agree, indefinitely. Specified, costly, tight: do the address plan once, in a document everyone signs.',
      'emergent-spec':
        'Specified, certainly: it is arithmetic. But the reversibility column is the loudest evidence here, a quarter for the last re-IP. A cheap-undo placement for a forever decision reads the easy axis and skips the expensive one.',
      'emergent-explore':
        'There is nothing to discover; subnet math has known inputs. And every experiment becomes a peering constraint other networks build against. Exploring address space is how overlapping ranges get a decade of maintenance.',
      danger:
        "Irreversible, yes; exploratory, no: growth projections and subnet arithmetic are known inputs. This is the planned quadrant's home game. Danger would require shipping ranges before anyone has done that math.",
    },
    fromChapter: 5,
  },

  {
    id: 'pl-10',
    kind: 'placement',
    surface: 'On-call: paging thresholds for a service three weeks into production.',
    prompt: "Place the decision: where the new service's pager thresholds sit.",
    evidence: [
      {
        label: 'Undo cost',
        text: 'A threshold is one line in the alerting config; a bad value reverts in minutes.',
      },
      {
        label: 'Spec stability',
        text: 'Three weeks of traffic is not a noise profile. Nobody knows yet what normal looks like at month three.',
      },
      {
        label: 'Coupling',
        text: 'Thresholds page one rotation; nothing else reads them.',
      },
    ],
    axesTruth: { reversibility: 'cheap', legibility: 'exploratory', coupling: 'loose' },
    axesWhy: {
      reversibility: 'One line in the alerting config, reverted in minutes.',
      legibility: 'Three weeks of traffic is not a noise profile; normal is still unknown.',
      coupling: "One rotation's pager; no other consumer.",
    },
    quadrant: true,
    answer: 'emergent-explore',
    feedback: {
      'emergent-explore':
        "A one-line revert, a noise profile that does not exist yet, and a blast radius of one rotation's pager. Tune in production, keep the revert close, and let three months of traffic write the spec a review board would have guessed at.",
      planned:
        'A threshold review board would specify normal for a service with three weeks of history; that spec would be fiction, and the mis-set threshold it blesses reverts in minutes anyway. Planned ceremony here freezes week-three guesses.',
      'emergent-spec':
        'Reversible, but specified overstates what three weeks of traffic can say: nobody knows what month-three normal looks like. The exploratory reading keeps you honest about why the thresholds will keep moving.',
      danger:
        'The undo is one line in a config, so the irreversibility half of danger fails. The risk worth watching is slower: a noisy pager trains the rotation to skim. Watch ack rates as the signal, and place the decision by its axes: cheap, exploratory, loose.',
    },
    fromChapter: 5,
  },

  {
    id: 'pl-11',
    kind: 'placement',
    surface: 'Search: changing the tokenizer config for the product search index (5M documents).',
    prompt: 'Place the decision: the analyzer change for product search.',
    evidence: [
      {
        label: 'Undo cost',
        text: 'Reindex is automated: 40 minutes into a parallel index, traffic moves by alias swap, and swaps back in seconds if relevance dips.',
      },
      {
        label: 'Spec stability',
        text: 'The change is pinned by a failing relevance suite: 60 golden queries, German compound nouns, agreed scores.',
      },
      {
        label: 'Coupling',
        text: 'Only the search service reads the index; the alias isolates consumers from the swap.',
      },
    ],
    axesTruth: { reversibility: 'cheap', legibility: 'specified', coupling: 'loose' },
    axesWhy: {
      reversibility:
        'Parallel reindex, alias swap, seconds to swap back with the old index still warm.',
      legibility: '60 golden queries with agreed scores: the target is written down and failing.',
      coupling: 'The alias isolates every consumer from the swap.',
    },
    quadrant: true,
    answer: 'emergent-spec',
    feedback: {
      'emergent-spec':
        "The blue-green machinery sets the axes: 40-minute parallel reindex, alias swap back in seconds, a 60-query golden suite as the spec. Reversible and specified is the emergent zone's mechanical half; let the loop run the change and let the suite and the swap do the judging.",
      planned:
        'Production search sounds planned until you price the undo: seconds, via alias swap, with the old index still warm. The fear comes from the surface; the axes come from the evidence. Save the design meetings for surfaces without a swap-back.',
      'emergent-explore':
        'Reversible, but not exploratory: 60 golden queries with agreed scores is a finished spec. The exploratory reading invites relevance tinkering without the suite as referee, which is how golden queries rot into suggestions.',
      danger:
        'Check the undo: alias swap, seconds, old index intact. Danger needs irreversibility, and this surface engineered its irreversibility away. That move is exactly what changes a quadrant label.',
    },
    fromChapter: 5,
  },

  {
    id: 'pl-12',
    kind: 'placement',
    surface:
      'Partner API: the payload schema for outbound webhooks, with two design partners ready to integrate.',
    prompt: 'Place the decision: what the webhook payload schema commits to.',
    evidence: [
      {
        label: 'Undo cost',
        text: 'Once partners code against a field it is load-bearing; removing it is a versioned deprecation measured in quarters.',
      },
      {
        label: 'Spec stability',
        text: 'Product is still discovering which events matter: the event list changed three times in four weeks of design-partner calls.',
      },
      {
        label: 'Coupling',
        text: 'External consumers you do not control and cannot redeploy.',
      },
    ],
    axesTruth: { reversibility: 'costly', legibility: 'exploratory', coupling: 'tight' },
    axesWhy: {
      reversibility:
        'Partners code against every shipped field; removal is a deprecation measured in quarters.',
      legibility: 'The event list changed three times in four weeks; discovery is still running.',
      coupling: 'External consumers you cannot redeploy.',
    },
    quadrant: true,
    answer: 'danger',
    feedback: {
      danger:
        'Irreversible (partners code against every field, and you cannot redeploy them) and exploratory (the event list moved three times in a month). This is the quadrant where disasters live, and the placement is an action item, not a label: make it reversible (a versioned beta channel partners agree can break) or make it legible (freeze the minimal event set you are sure of) before shipping anything.',
      planned:
        "Planned assumes you can specify the schema, but the event list changed three times in four weeks; a frozen spec now locks in this month's guess for quarters. Name the quadrant honestly first, then earn planned by making the problem legible: ship the smallest schema you are sure of.",
      'emergent-spec':
        "The schema language may be tidy, but reversibility is set by the consumers: external partners who code against every field you ever ship. There is no alias swap for someone else's integration.",
      'emergent-explore':
        'Exploration is exactly what product is doing, on a surface where every experiment becomes a permanent contract. Forage on a beta channel partners agree can break; never on the frozen one.',
    },
    fromChapter: 5,
  },

  {
    id: 'pl-13',
    kind: 'placement',
    surface:
      'Experimentation platform: the assignment hash that buckets users into experiment arms.',
    prompt: 'Place the decision: the bucketing function under every A/B test.',
    evidence: [
      {
        label: 'Undo cost',
        text: "Changing the hash mid-flight reshuffles every running experiment's arms; weeks of exposure data become uninterpretable and cannot be recomputed.",
      },
      {
        label: 'Spec stability',
        text: 'Requirements are crisp and old: deterministic, uniform, independent across experiment layers.',
      },
      {
        label: 'Coupling',
        text: '31 running experiments and every historical readout assume the current assignment.',
      },
    ],
    axesTruth: { reversibility: 'costly', legibility: 'specified', coupling: 'tight' },
    axesWhy: {
      reversibility:
        'Past assignments cannot be recomputed; a hash change destroys weeks of readouts rather than delaying them.',
      legibility: 'Deterministic, uniform, independent across layers: crisp and years-stable.',
      coupling: '31 running experiments and all historical readouts assume the current assignment.',
    },
    quadrant: true,
    answer: 'planned',
    feedback: {
      planned:
        'Weeks of exposure data become uninterpretable and cannot be recomputed: undo does not exist at any price. The requirements are old and crisp, and 31 running experiments couple to the choice. Pin it, version it, and treat any change as a migration with a flag day.',
      'emergent-spec':
        'The spec is crisp, but reversibility fails completely: past assignments cannot be recomputed, so a hash change destroys weeks of readouts rather than costing a redo. When undo is impossible rather than expensive, the planned pole stops being optional.',
      'emergent-explore':
        'Each attempt scrambles 31 running experiments, and the scrambled exposure data is gone, not delayed. The platform exists so product teams can explore; its foundations pay for that by being settled.',
      danger:
        'Irreversibility, yes; illegibility, no. Deterministic, uniform, independent across layers is one of the best-specified problems on the board. Danger is for foraging on irreversible ground, and nobody needs to forage here.',
    },
    fromChapter: 5,
  },

  {
    // Contested: the reversibility axis has two honest answers on this surface,
    // depending on which operations the policy permits.
    id: 'pl-14',
    kind: 'placement',
    surface: 'Product analytics: the event schema 14 teams emit to the analytics pipeline.',
    prompt: 'Place the decision: how teams add and change analytics events.',
    evidence: [
      {
        label: 'Undo cost, additions',
        text: 'Adding an event is cheap; unused events are dropped by a TTL job after 90 days of no queries.',
      },
      {
        label: 'Undo cost, renames',
        text: 'Renaming or re-typing a live event breaks every chart and cohort built on it; the funnels team still maintains a rename shim from 2019.',
      },
      {
        label: 'Coupling',
        text: '14 teams emit; dashboards, experiment readouts, and two ML jobs consume.',
      },
    ],
    axesTruth: { reversibility: 'cheap', legibility: 'specified', coupling: 'tight' },
    axesWhy: {
      reversibility:
        'Two answers on one surface: additions are TTL-reversible, renames are 2019-shim forever. The axis depends on which operations the policy permits.',
      legibility: 'Naming and typing conventions are settled enough for CI to enforce.',
      coupling: '14 emitters and dozens of consumers share the vocabulary.',
    },
    quadrant: true,
    contested: true,
    feedback: {
      'emergent-spec':
        'Defensible if the policy is additive-only: additions are cheap, TTL-reaped, and verified mechanically. This reading commits you to enforcing additive-only in CI and running a deprecation loop, because the moment a rename slips through, you are maintaining the next 2019 shim.',
      planned:
        'Defensible if you score the axis by the most expensive permitted operation: renames are forever, so the schema is planned surface. This reading commits you to a steward approval on every event change from 14 teams, and that inflow will saturate a budget. You are buying safety on mutations at the price of reviewing additions a TTL already insures. Two defensible placements; what decides between them is which operations you let the policy permit.',
      'emergent-explore':
        'The conventions themselves are settled; the dispute is over undo cost, not over what the schema should look like. The exploratory reading gives up the one thing this surface has: a spec CI can enforce.',
      danger:
        'Danger needs both irreversibility and illegibility. The mutation path is irreversible, but the schema is anything but exploratory: the conventions are settled enough for CI to check. Split the surface instead, additive changes one side of the line, mutations the other.',
    },
    fromChapter: 6,
  },

  // ═══ SPIRAL (8) — recognition from warning signs ═══

  {
    // The healthy backpressure loop that looks like a storm.
    id: 'sp-01',
    kind: 'spiral',
    surface: "Order ingest: the checkout queue during the year's biggest sale.",
    prompt: 'Read the trace: storm, stall, or healthy?',
    evidence: [
      {
        label: 'The spike',
        text: 'Queue depth spikes 14x at 09:00 as the sale opens; consumers shed load and retry rates climb. Dashboards go loud everywhere.',
      },
      {
        label: 'Retry behavior',
        text: 'Each request retries at most once per full backoff cycle; backoff doubles per attempt, with jitter. Measured amplification holds at 0.7 requests created per request shed.',
      },
      {
        label: 'Ground truth',
        text: "The payment provider's accept rate is measured independently and recovers as the queue drains; the queue is back to baseline 40 minutes after the spike ends.",
      },
    ],
    options: [
      { id: 'healthy', label: 'Healthy: no spiral' },
      { id: 'emergent-runaway', label: 'Emergent runaway forming' },
      { id: 'planned-stall', label: 'Planned stall forming' },
      { id: 'hybrid-theatre', label: 'Hybrid: one mode in form, the other in substance' },
    ],
    answer: 'healthy',
    feedback: {
      healthy:
        "Run the table: decay present (backoff doubles), variety preserved (jitter), outside reference intact (the provider's accept rate, measured independently), net behavior self-correcting (amplification 0.7, queue at baseline 40 minutes after the spike). Loud is not the same as runaway; this is backpressure doing its job.",
      'emergent-runaway':
        'The noise reads like a storm, so check the one number that defines one: amplification. At 0.7 created per shed, every cycle shrinks the work. A storm self-sustains after the spike ends; this queue is at baseline 40 minutes later. The warning signs are about divergence, not volume.',
      'planned-stall':
        'A stall accumulates WIP because nothing integrates; this queue is draining, not accumulating, and no central plan gates the flow. The shape here is load, not coordination failure.',
      'hybrid-theatre':
        'Hybrid failures are systems whose claimed mode and actual mode differ. Here the claimed mechanism, backpressure with bounded retry, is exactly what the trace shows happening.',
    },
    fromChapter: 13,
  },

  {
    id: 'sp-02',
    kind: 'spiral',
    surface: 'Eval harness: the nightly suite scoring a code-review agent.',
    prompt: 'The dashboard is green and rising. What is forming?',
    evidence: [
      {
        label: 'The score',
        text: 'Nightly eval score: 0.71 to 0.86 over six weeks. The team dashboard is green.',
      },
      {
        label: 'The outside number',
        text: 'Post-merge defect rate on the same change classes doubled over the same six weeks.',
      },
      {
        label: 'The judge',
        text: "The judge model is fine-tuned quarterly on transcripts of the agent's own accepted reviews.",
      },
    ],
    options: [
      { id: 'healthy', label: 'Healthy: no spiral' },
      { id: 'emergent-runaway', label: 'Emergent runaway forming' },
      { id: 'planned-stall', label: 'Planned stall forming' },
      { id: 'hybrid-theatre', label: 'Hybrid: one mode in form, the other in substance' },
    ],
    answer: 'emergent-runaway',
    feedback: {
      'emergent-runaway':
        "Two warning signs, textbook: eval scores diverging from real outcomes, and an evaluator trained on agent output drifting toward the surface features agents then optimize for directly. The outside reference is severed; the judge now grades the agent against itself. Remedies from the family: restore an outside reference (defect rate, human-sampled review) and add variety to the judge's diet.",
      healthy:
        "The green dashboard is the system's self-report. Hold it against the one outside number in evidence, post-merge defects doubled, and the score's rise becomes the signature of a severed reference: confidence rising while ground truth falls.",
      'planned-stall':
        "Nothing here waits on a central plan or accumulates WIP; work flows freely. The failure is in the feedback's direction, self-reinforcing, rather than in the flow's structure.",
      'hybrid-theatre':
        "There is no mode mismatch; the eval does exactly what it claims, nightly. The defect is the loop's geometry: judge trained on agent, agent optimized for judge. That circle is the emergent spiral's signature.",
    },
    fromChapter: 9,
  },

  {
    id: 'sp-03',
    kind: 'spiral',
    surface: 'Data platform migration: nine months in, no team has cut over to the new warehouse.',
    prompt: 'Name the failure family.',
    evidence: [
      {
        label: 'The checklist',
        text: 'Cutover requires feature parity; the parity checklist has grown from 60 to 140 items in nine months.',
      },
      {
        label: 'The branches',
        text: "Each team's migration work is 80 to 90% done and merged to a long-lived branch nothing runs in production.",
      },
      {
        label: 'The bottleneck',
        text: 'Two staff engineers answer every parity question; their queue is eleven days deep.',
      },
    ],
    options: [
      { id: 'healthy', label: 'Healthy: no spiral' },
      { id: 'emergent-runaway', label: 'Emergent runaway forming' },
      { id: 'planned-stall', label: 'Planned stall forming' },
      { id: 'hybrid-theatre', label: 'Hybrid: one mode in form, the other in substance' },
    ],
    answer: 'planned-stall',
    feedback: {
      'planned-stall':
        'Three warning signs in one trace: the exception backlog (parity items) grows faster than the plan absorbs it, WIP accumulates because nothing integrates until the whole is ready, and two humans are permanent bottlenecks. The remedies are structural: shorten the integration cycle (cut over one workload, not everything) and distribute the parity calls by domain.',
      'emergent-runaway':
        "Look for a reinforcing signal without counter-force: there is none. No metric feeds on itself here. What grows is the gap between plan and reality, the planned family's signature; the checklist is a spec losing contact faster than it updates.",
      healthy:
        "Nine months, zero production cutovers, and the definition of done grew by 80 items. Each team's 90% is the planned spiral's most deceptive number: progress that cannot integrate is inventory, not progress.",
      'hybrid-theatre':
        'A hybrid claims one mode and runs another; this program is sincerely, consistently planned, and that is the problem. The spec outruns its own update rate in a domain that moved while the program stood still.',
    },
    fromChapter: 10,
  },

  {
    id: 'sp-04',
    kind: 'spiral',
    surface:
      'On-call tooling: the agent that suggests runbooks during incidents, ranked by past acceptance.',
    prompt: 'Suggestion volume is up 3x. What is the trace showing?',
    evidence: [
      {
        label: 'Variety',
        text: 'The same three runbooks now headline 81% of suggestions, across incident types that share nothing.',
      },
      {
        label: 'The reinforcer',
        text: 'Acceptance clicks feed the ranking; a suggestion accepted in the first minute weighs the same as one that resolved the incident.',
      },
      {
        label: 'Outcomes',
        text: 'Suggestion volume is up 3x this quarter; incident resolution time is flat.',
      },
    ],
    options: [
      { id: 'healthy', label: 'Healthy: no spiral' },
      { id: 'emergent-runaway', label: 'Emergent runaway forming' },
      { id: 'planned-stall', label: 'Planned stall forming' },
      { id: 'hybrid-theatre', label: 'Hybrid: one mode in form, the other in substance' },
    ],
    answer: 'emergent-runaway',
    feedback: {
      'emergent-runaway':
        'Variety has collapsed (three runbooks, 81%, unrelated incidents) without any increase in selectivity, while activity rises: two warning signs from the table. The reinforcer is acceptance clicks, a signal the loop generates for itself; nothing in the loop reads whether the incident resolved. Add the outside reference and an exploration floor.',
      healthy:
        'Three runbooks covering 81% of unrelated incident types is the same patterns recurring across unrelated tasks, a listed warning sign, visible before resolution time degrades. Flat resolution under 3x volume says the extra activity is noise.',
      'planned-stall':
        'Nothing is queued or gated; this system ships suggestions faster every week. The pathology is in what the rising signal is made of: clicks the loop trained its users to give it.',
      'hybrid-theatre':
        'Both form and substance here are emergent; nothing claims central planning. What is missing is counter-force: decay on stale acceptance, variety from an exploration floor, ground truth from resolution outcomes.',
    },
    fromChapter: 9,
  },

  {
    id: 'sp-05',
    kind: 'spiral',
    surface: 'Architecture governance: a mandatory ADR for every significant change.',
    prompt: 'Coverage is 100%. Classify the system.',
    evidence: [
      {
        label: 'The claim',
        text: 'Process doc: no significant change merges without an approved ADR. Dashboards show 100% ADR coverage.',
      },
      {
        label: 'The commit log',
        text: 'In 31 of the last 35 cases, the ADR was opened after the implementing PR merged, citing the merged code as the design.',
      },
      {
        label: 'The gate that never closes',
        text: 'No merge has ever been blocked on ADR review; two reviewers approve all ADRs, median review time 4 minutes.',
      },
    ],
    options: [
      { id: 'healthy', label: 'Healthy: no spiral' },
      { id: 'emergent-runaway', label: 'Emergent runaway forming' },
      { id: 'planned-stall', label: 'Planned stall forming' },
      { id: 'hybrid-theatre', label: 'Hybrid: one mode in form, the other in substance' },
    ],
    answer: 'hybrid-theatre',
    feedback: {
      'hybrid-theatre':
        'Planned in form (mandatory ADRs, 100% coverage), emergent in substance (31 of 35 written after merge, zero merges ever blocked). The honest test is which mode the actual decisions are made in, and here they are made in the PRs, then documented as ceremony. It inherits both weaknesses: emergent decisions with no counter-force, plus the cost and false assurance of planned ritual.',
      'planned-stall':
        'A stall would show WIP waiting on the ADR queue; nothing waits, ever (zero blocked merges). The planned layer is not slowing the system down, because it is not connected to it.',
      'emergent-runaway':
        'The decisions are emergent, but nothing is self-amplifying; no signal feeds on itself. The hazard is subtler: a paper mode that makes the emergent reality unreadable, so the real spiral, when it comes, will be invisible to this dashboard.',
      healthy:
        '100% coverage is the form. The substance: documentation written after the decision, review that never changed an outcome. A control that cannot say no is not a control, and health measured by it is theatre.',
    },
    fromChapter: 10,
  },

  {
    id: 'sp-06',
    kind: 'spiral',
    surface:
      'CI fleet: auto-retry on failed test suites, during a shared-fixture-service degradation.',
    prompt: 'The fixture service recovered 50 minutes ago. Read the trace.',
    evidence: [
      {
        label: 'The policy',
        text: 'Failed suites retry up to 5 times immediately, no backoff. The fixture service degraded for 20 minutes at 14:00.',
      },
      {
        label: 'Now',
        text: 'At 15:10, 50 minutes after the fixture service recovered, CI load is 4.2x baseline and climbing; 70% of running jobs are retries of retries.',
      },
      {
        label: 'The multiplier',
        text: 'Queue wait now causes timeouts, which trigger more retries. Measured amplification: 1.4 jobs created per job failed.',
      },
    ],
    options: [
      { id: 'healthy', label: 'Healthy: no spiral' },
      { id: 'emergent-runaway', label: 'Emergent runaway forming' },
      { id: 'planned-stall', label: 'Planned stall forming' },
      { id: 'hybrid-theatre', label: 'Hybrid: one mode in form, the other in substance' },
    ],
    answer: 'emergent-runaway',
    feedback: {
      'emergent-runaway':
        'Amplification 1.4 and self-sustaining 50 minutes after the trigger cleared: the storm no longer needs the original failure, it generates its own (timeouts begetting retries). No decay (immediate retry, no backoff), variety collapsed (all load is the same retry), outside reference gone (nothing asks whether the fixture is healthy before retrying). Remedies in the family: backoff with jitter, a breaker keyed to fixture health, evacuate the queue.',
      healthy:
        'Compare against the healthy-backpressure signature: there, amplification stays under 1 and the queue drains when the spike ends. Here the trigger cleared 50 minutes ago and load is still climbing; the loop feeds itself.',
      'planned-stall':
        'WIP is piling up, but not because integration waits on a plan; it piles up because the system multiplies its own load. The queue is an effect of the runaway, not a coordination structure failing.',
      'hybrid-theatre':
        "No claimed mode differs from the real one; the retry policy does precisely what it says, five immediate retries. That policy is the runaway's engine: reinforcement with no counter-force.",
    },
    fromChapter: 9,
  },

  {
    id: 'sp-07',
    kind: 'spiral',
    surface: 'Docs: the doc-freshness loop has opened zero PRs for five weeks.',
    prompt: 'Is this silence health?',
    evidence: [
      {
        label: 'The record',
        text: 'Last quarter the loop averaged 6 freshness PRs a week; for five weeks, zero. No one changed the loop.',
      },
      {
        label: 'The move',
        text: "Four weeks ago the docs moved into the monorepo; the loop's source glob still points at the old path and has matched nothing since.",
      },
      {
        label: 'The surface it watched',
        text: 'The docs changed 240 times in those five weeks; staleness flags in page frontmatter stopped updating the day of the move.',
      },
    ],
    options: [
      { id: 'healthy-quiet', label: 'Healthy: there is nothing to do' },
      { id: 'dead-signal', label: 'The loop is open: its signal died' },
      { id: 'emergent-runaway', label: 'Emergent runaway forming' },
    ],
    answer: 'dead-signal',
    feedback: {
      'dead-signal':
        'Silence is health only when the signal is alive. This signal has been structurally unable to fire since the move (a glob matching nothing), while the surface it watched changed 240 times. Zero PRs from a working loop and zero PRs from a dead one look identical on a dashboard, which is why loop health needs its own heartbeat, one the signal cannot fake by silence.',
      'healthy-quiet':
        "Quiet would be plausible if the watched surface had gone quiet too; it changed 240 times. The discriminating evidence is the glob: it cannot match anything since the move. Six a week to zero, coincident with a path change, is a dead signal's exact signature.",
      'emergent-runaway':
        'A runaway is activity rising on self-reinforcement; this is the opposite end of the dial, activity at zero. The failure is an open loop, stage 1 severed, not an amplifying one.',
    },
    fromChapter: 13,
  },

  {
    id: 'sp-08',
    kind: 'spiral',
    surface:
      'Billing: a reconciliation service built spec-first; the interface froze before the first integration.',
    prompt: 'The exceptions queue tripled in a quarter. What is forming?',
    evidence: [
      {
        label: 'The mismatch',
        text: 'The frozen spec models refunds as negative invoices; three payment providers send refunds as separate events that do not map. Exceptions: 3 a week in March, 11 a week now.',
      },
      {
        label: 'The patch pattern',
        text: 'Each exception is patched downstream in per-provider glue code; the spec itself has not been revised, because revisions require a quarterly review board.',
      },
      {
        label: 'Composition',
        text: "Each provider's glue passes its own tests; provider pairs disagree on totals in 4% of reconciliations, found only at month-end close.",
      },
    ],
    options: [
      { id: 'healthy', label: 'Healthy: no spiral' },
      { id: 'emergent-runaway', label: 'Emergent runaway forming' },
      { id: 'planned-stall', label: 'Planned stall forming' },
      { id: 'hybrid-theatre', label: 'Hybrid: one mode in form, the other in substance' },
    ],
    answer: 'planned-stall',
    feedback: {
      'planned-stall':
        "Forming, and early enough to catch: the exceptions backlog grows faster than the spec absorbs it (3 to 11 a week, against a quarterly revision cycle), and outputs are individually fine but fail in composition (per-provider glue green, cross-provider totals off 4%). The remedies are the family's: raise the spec's update rate past reality's change rate, and turn the document into executable contracts so the next mismatch fails a test instead of a month-end close.",
      'emergent-runaway':
        'No signal amplifies itself; the glue grows linearly with exceptions, not exponentially with feedback. The widening gap is spec-versus-reality with a revision loop too slow to close it: the planned family.',
      healthy:
        "Green per-provider tests are the trap; composition is where this fails, 4% of reconciliations surfacing at close. A backlog tripling in a quarter against a once-a-quarter revision board is a spiral's opening arithmetic.",
      'hybrid-theatre':
        "Worth checking: is the spec still deciding anything? It is. Every exception gets glue precisely because the spec cannot change. Form and substance are both planned; the failure is the planned mode's own, update rate below reality's.",
    },
    fromChapter: 10,
  },

  // ═══ LOOP (6) — six-ingredient diagnosis ═══

  {
    id: 'lp-01',
    kind: 'loop',
    surface:
      'Localization: a nightly job syncs new strings, machine-translates them, opens a PR; green CI merges it.',
    prompt: 'The job runs clean every night. What keeps it from being a loop?',
    evidence: [
      {
        label: 'The stages that work',
        text: 'Signal: new untranslated strings fire the run. Action: scoped to locale files. CI checks formatting and placeholder integrity; merges on green; revert is one commit.',
      },
      {
        label: 'The other tool',
        text: 'Human linguists review translations in a separate vendor tool and reject about 12% as unusable; rejections are fixed by hand in that tool.',
      },
      {
        label: 'The rework',
        text: 'The job has re-made 60+ machine translations the linguists had already rejected and corrected, sometimes overwriting the corrections.',
      },
    ],
    options: [
      { id: 'signal-update', label: 'Signal update is missing' },
      { id: 'verification', label: 'Verification is missing' },
      { id: 'reversibility', label: 'Reversibility is missing' },
      { id: 'complete', label: 'Nothing: all six ingredients are present' },
    ],
    answer: 'signal-update',
    feedback: {
      'signal-update':
        "Stage 5 is severed: the linguists' rejections, the richest outcome signal this loop produces, land in a tool the loop never reads, so every run starts amnesiac. The 60 re-made rejects are the bill, the same findings re-paid nightly; worse, the loop overwrites corrections because nothing marks them as outcomes. Pipe rejections back as terrain (a do-not-retranslate ledger) and the loop starts learning.",
      verification:
        "Verification exists and is even layered: CI checks placeholders, linguists check quality. The breakage is what happens after the linguists' verdict: it never returns to the terrain. A loop can verify perfectly and still relearn nothing.",
      complete:
        'Five ingredients run clean, which is what makes the gap easy to miss. Check the update stage against the rework: 60 retranslations of already-rejected strings is the amnesia signature, and amnesia means stage 5, not stage 3, is open.',
      reversibility:
        'Revert is one commit and the loop uses it; that ingredient is healthy. The overwritten corrections sting because of a different gap: the loop has no memory that they were corrections.',
    },
    fromChapter: 14,
  },

  {
    id: 'lp-02',
    kind: 'loop',
    surface:
      'FinOps: an agent that right-sizes Kubernetes resource requests, chartered for one namespace.',
    prompt: 'Every PR was reviewed and merged. Which ingredient failed?',
    evidence: [
      {
        label: 'The charter',
        text: 'Chartered scope: CPU and memory requests in the batch namespace. PRs reviewed by the platform rotation; revert is a config rollback; outcomes feed a savings ledger.',
      },
      {
        label: 'The recent PRs',
        text: 'All merged: HPA min/max changes in three other namespaces, a node-pool instance-type swap, and a cluster-autoscaler profile change. Each PR description still says "right-size requests."',
      },
      {
        label: 'The incident',
        text: 'The node-pool swap caused a 25-minute capacity gap during rollout; nobody had reasoned about pod disruption budgets, because request changes never needed to.',
      },
    ],
    options: [
      { id: 'bounded-action', label: 'Bounded action is missing' },
      { id: 'authority-surface', label: 'The authority surface is missing' },
      { id: 'verification', label: 'Verification is missing' },
      { id: 'signal', label: 'The signal is missing' },
    ],
    answer: 'bounded-action',
    feedback: {
      'bounded-action':
        'The action outgrew its charter: requests in one namespace became HPAs, node pools, and autoscaler profiles, while the PR template still claims the old scope. The 25-minute gap is what unbounded action costs, blast radius exceeding the reasoning that approved it; nobody thought about disruption budgets because the chartered class never required it. Re-scope the loop to its class; new change classes start as new loops with their own record.',
      'authority-surface':
        "Related, and you would feel it next: scope creep usually outruns the trust grant too. But the grant here was per-PR human review, and reviewers approved each one. The first breakage is upstream of authority: the action class lost its boundary, so reviewers were approving changes the loop's record said nothing about.",
      verification:
        'Each PR was reviewed and merged by a human; the gate fired every time. The reviewers were reading PRs titled "right-size requests" that swapped node pools. Verification was aimed at the chartered class while the action drifted out from under it.',
      signal:
        'The trigger, utilization data, fires fine and on real conditions. What drifted is what the loop does once fired: the action stanza, not the signal stanza.',
    },
    fromChapter: 14,
  },

  {
    // Contested: is a 90-second anonymous ack an outside reference, or
    // self-approval with extra steps?
    id: 'lp-03',
    kind: 'loop',
    surface:
      'Vendor data: a weekly job updates the partner price sheet, posts the diff to Slack; the first thumbs-up from anyone applies it.',
    prompt: 'Is the ack verification?',
    evidence: [
      {
        label: 'The mechanism',
        text: 'The diff is real and readable; an ack from any of 40 channel members applies the change to production pricing config. Revert is one config push.',
      },
      {
        label: 'The acks',
        text: 'Median time-to-ack: 90 seconds. Of the last 20 applications, 14 were acked by people outside the pricing team; two ackers later said they assumed someone else had checked.',
      },
      {
        label: 'The miss',
        text: 'No record links acks to outcomes. A mispriced sheet in March was caught by a customer; the ack trail identified no reviewer of record.',
      },
    ],
    options: [
      { id: 'verification-present', label: 'Verification exists: a human checks each diff' },
      {
        id: 'verification-missing',
        label: 'Verification is missing: self-approval with extra steps',
      },
      { id: 'reversibility', label: 'The real gap is reversibility' },
    ],
    contested: true,
    feedback: {
      'verification-present':
        'Defensible: a human eyeball crosses every diff, and the diff is legible. This reading commits you to treating acks as track record, so you must make them mean something: a reviewer of record, acks restricted to people accountable for pricing, ack-to-outcome linkage. If 90-second anonymous acks keep counting as approvals, your approval rate inflates exactly the way rubber-stamping does.',
      'verification-missing':
        "Defensible: an outside reference must be able to say no, and a gate where 14 of 20 acks come from bystanders who assumed someone else checked is diffusion of responsibility wearing a gate's clothes; the March miss had no reviewer of record at all. This reading commits you to building a real gate, named approvers, accountability, sampled deep review, before this loop's scope or autonomy grows an inch.",
      reversibility:
        'Undo is one config push and it worked in March; that ingredient is sound. The dispute worth having is whether the ack is verification or theatre. The case turns on stage 3.',
    },
    fromChapter: 14,
  },

  {
    id: 'lp-04',
    kind: 'loop',
    surface:
      "Data pipeline: 'the backfill loop', a script that recomputes a derived table, run by whoever notices drift.",
    prompt: 'The team calls it a loop. Check the six ingredients.',
    evidence: [
      {
        label: 'The script itself',
        text: 'Solid: bounded to one table, dry-run mode, checksum verification against source, idempotent re-run as the undo.',
      },
      {
        label: 'How it fires',
        text: 'It runs when an engineer notices dashboard drift and remembers the script exists. Nine runs last year: twice within a day of drift starting, once six weeks after.',
      },
      {
        label: 'The unwatched trace',
        text: 'Drift is detectable mechanically (row-count and checksum deltas published daily), but nothing watches those deltas.',
      },
    ],
    options: [
      { id: 'signal', label: 'The signal is missing: this is a script' },
      { id: 'complete', label: 'Nothing: all six ingredients are present' },
      { id: 'verification', label: 'Verification is missing' },
      { id: 'bounded-action', label: 'Bounded action is missing' },
    ],
    answer: 'signal',
    feedback: {
      signal:
        'Everything downstream of firing is loop-grade: bounded, verified, reversible. But stage 1 is a human noticing and remembering, which is why response time ranges from one day to six weeks. The terrain already publishes the trace (daily checksum deltas); no machine reads it. Wire the published deltas to the trigger and this script becomes a loop. Until then it is a script with excellent manners, and the six-week gap is the cost of the missing ingredient.',
      complete:
        'Run the check on stage 1: a loop\'s signal is a trace in the terrain that fires it. "An engineer notices and remembers" is firing by human memory, the loop-on-a-leash pattern, and nine runs with a one-day-to-six-week spread is what memory-as-signal looks like in the record.',
      verification:
        "Checksum verification against source is present and mechanical; stage 3 is this script's best ingredient. The spread in response times points at the other end: nothing fires it.",
      'bounded-action':
        'One table, dry-run mode, idempotent: the action is tightly scoped. The miss is upstream. Six weeks of drift ran unrepaired because firing depends on memory.',
    },
    fromChapter: 1,
  },

  {
    id: 'lp-05',
    kind: 'loop',
    surface:
      'Release infra: an auto-remediation deletes stale preview-deploy artifacts when the registry nears quota.',
    prompt: 'Five ingredients check out. Which one is missing?',
    evidence: [
      {
        label: 'The healthy stages',
        text: 'Signal: registry at 85% quota fires the run. Action: bounded to artifacts older than 14 days with no deploy reference. Verification: re-checks quota and confirms no referenced artifact was touched. Outcomes post to a ledger.',
      },
      {
        label: 'The deletions',
        text: 'Deletion is permanent: the registry has no soft-delete tier, and artifacts are not automatically rebuildable from source.',
      },
      {
        label: 'April',
        text: 'It deleted the artifact a rollback needed (the deploy reference had been moved during an incident); the rollback became a 3-hour rebuild-and-redeploy. The team now requires human approval on every run.',
      },
    ],
    options: [
      { id: 'reversibility', label: 'Reversibility is missing' },
      { id: 'bounded-action', label: 'Bounded action is missing' },
      { id: 'signal-update', label: 'Signal update is missing' },
      { id: 'complete', label: 'Nothing: all six ingredients are present' },
    ],
    answer: 'reversibility',
    feedback: {
      reversibility:
        "Five ingredients are real; the undo path is not. Permanent deletion meant one stale-reference edge case turned a rollback into a 3-hour rebuild, and the team's reaction shows the second-order cost from the table: stewards stop trusting the loop. Every run now needs human approval, so the loop's economics are gone. Add the cheap undo first, a 14-day trash tier or rebuildable artifacts, and the trust, and the autonomy, can come back.",
      'bounded-action':
        'The bound held: 14 days old, no deploy reference, and the verifier confirmed the rule was followed. The deleted artifact satisfied the rule; the rule met an edge case with no undo behind it. A correctly bounded action with no revert path still ossifies its mistakes.',
      'signal-update':
        "Outcomes flow back (the ledger); the loop is not amnesiac. What April exposed is that when this loop errs, nothing can be rolled back. The gap is stage 4's revert half.",
      complete:
        "Close: signal, bound, verification, and update all check out. Stage 4 only half-exists; commit works, revert does not, and the April rollback paid the difference. A loop is healthy when its mistakes are cheap; this one's mistake cost 3 hours and the loop's autonomy.",
    },
    fromChapter: 14,
  },

  {
    id: 'lp-06',
    kind: 'loop',
    surface:
      'Support engineering: a ticket-triage agent routes and labels inbound tickets across four product areas.',
    prompt: 'One bad week in one area shut down all four. What was missing?',
    evidence: [
      {
        label: 'Per-class health',
        text: 'The loop is sound per class: routing signal, bounded label-and-route action, sampled human verification per area, one-click re-route as undo, outcomes feed per-area accuracy stats.',
      },
      {
        label: 'The autonomy record',
        text: "Autonomy decisions have no written rule: the agent's scope grew through ad-hoc Slack threads. Per-area accuracy: billing 98%, identity 96%, mobile 91%, integrations 74%.",
      },
      {
        label: 'The shutdown',
        text: "After a bad week in integrations, the support director turned the agent off everywhere; billing's 98% routing stopped with it. It has been off for a month, because turning it back on needs a meeting nobody has scheduled.",
      },
    ],
    options: [
      { id: 'authority-surface', label: 'The authority surface is missing' },
      { id: 'verification', label: 'Verification is missing' },
      { id: 'signal-update', label: 'Signal update is missing' },
      { id: 'bounded-action', label: 'Bounded action is missing' },
    ],
    answer: 'authority-surface',
    feedback: {
      'authority-surface':
        "Trust here had no surface to live on: scope grew by Slack thread, so when integrations (74%) had its bad week, the only available move was the global switch, and billing's 98% died with it. That is the table's exact failure: autonomy as a single global decision, fragility following. Write the surface, per-class thresholds for expansion and contraction, and integrations can lose autonomy alone while billing keeps a grant its record re-earns weekly.",
      verification:
        'Sampled human review per area exists and produced the very numbers in evidence; stage 3 is how you know integrations runs at 74%. The failure is what the system could do with that knowledge: nothing finer than off-everywhere.',
      'signal-update':
        'Per-area accuracy updates continuously; the terrain knew billing and integrations apart even when the off switch could not. Memory is not the gap. An authority surface that can read that memory class by class is.',
      'bounded-action':
        'Label-and-route is a tight, stable action class and it never drifted. What was unbounded was the trust decision: one switch spanning four classes with a 24-point accuracy spread.',
    },
    fromChapter: 14,
  },

  // ═══ GATE (5) — gate, rate, budget arithmetic ═══

  {
    id: 'gt-01',
    kind: 'gate',
    surface: 'Steward console: week 31, a 30-approval budget, the queue 9 deep and growing.',
    prompt: 'The inequality is failing. Which move restores it?',
    evidence: [
      {
        label: 'Inflow by class',
        text: 'Test-flake quarantine PRs: 19 a week at 97% approval over 12 weeks, zero post-merge defects. Alert-rule tuning: 6 a week at 88%. Data-contract changes: 4 a week at 71%.',
      },
      {
        label: 'The arithmetic',
        text: 'Budget: 30 considered approvals a week, false-approval tolerance 5%, capacity 28.5. Total gated inflow: 29 a week and rising.',
      },
      {
        label: 'The early symptom',
        text: 'The rotation has started skimming flake PRs; median review time on them fell from 7 minutes to 90 seconds.',
      },
    ],
    options: [
      {
        id: 'move-flake-below',
        label: 'Move flake-quarantine below the gate (auto-apply, 10% sampling)',
      },
      { id: 'add-steward', label: 'Add a second steward rotation to raise the budget' },
      {
        id: 'review-faster',
        label: 'Keep all gates; ask the rotation to keep reviews under 3 minutes',
      },
      {
        id: 'move-contracts-below',
        label: 'Move data-contract changes below the gate; smallest inflow',
      },
    ],
    answer: 'move-flake-below',
    feedback: {
      'move-flake-below':
        'The arithmetic: 29 gated against 28.5 capacity, and 19 of the 29 are a class running 97% over 12 weeks with zero defects, exactly the record that justifies a gate move. Below the gate with 10% sampling the class costs about 2 approvals; capacity frees to 13, and the 90-second skims (rubber-stamping already starting) end because the gate stops asking for theatre.',
      'add-steward':
        'This buys headroom by changing the constant the framework holds fixed: the budget is the constraint you place gates around, because considered attention does not grow by rota. With inflow rising, a second rotation saturates again next quarter, and you will have spent two stewards to avoid one gate move the record already justifies.',
      'review-faster':
        'The rotation already did this without being asked, 7 minutes to 90 seconds on flake PRs, and that is the rubber-stamp pathology: an approval rate that no longer means review. A 3-minute target formalizes the skim. The queue is telling you to move a gate, not to hollow out the yes.',
      'move-contracts-below':
        'This frees 4 approvals by auto-applying the class with the weakest record on the board: 71%, the rate that says the agent and the class are not aligned yet. Gate moves follow track record; at 71% this class is arguing for a tighter envelope, not a wider one.',
    },
    fromChapter: 18,
  },

  {
    id: 'gt-02',
    kind: 'gate',
    surface:
      'IaC review: plan-only Terraform diffs auto-apply below the gate; the class has shifted under the grant.',
    prompt: 'The sampled rate fell 96% to 82%. What is the structural move?',
    evidence: [
      {
        label: 'The grant',
        text: 'From January: plan-only diffs (tags, descriptions, outputs) auto-apply; the record then was 96% over 13 weeks.',
      },
      {
        label: 'The drift',
        text: 'Since the modules grew security-group rules, 30% of "plan-only" diffs touch ingress rules. Approval on the sampled 10%: 96% then; 82% and falling now.',
      },
      {
        label: 'The misses',
        text: 'Two auto-applied changes this month opened ingress wider than intended; both were caught by the weekly audit, not by the loop.',
      },
    ],
    options: [
      { id: 'move-above', label: 'Move the class above the gate while the envelope is re-drawn' },
      { id: 'patch-prompt', label: "Tighten the agent's prompt to avoid security-group rules" },
      { id: 'keep-sampling', label: 'Keep auto-apply; raise sampling from 10% to 25%' },
      { id: 'revoke-all', label: 'Turn off the IaC loop until the modules stabilize' },
    ],
    answer: 'move-above',
    feedback: {
      'move-above':
        'The rate drifted down, 96 to 82 and falling, and the lever table reads that one way: the agent and the class have come apart, narrow the envelope. The class itself changed underneath the grant; "plan-only" now includes ingress rules the January record never covered. The gate returns until a record exists for what the class has become. The reclaimed safety costs about 6 approvals a week; the two ingress incidents already cost more.',
      'patch-prompt':
        'This reaches for the agent lever, and the terrain offers a better one: the failure is a class boundary that silently widened until "plan-only" sometimes meant ingress. Re-draw the class where the record supports it (tags and outputs auto-apply; anything touching a security group gates) and the prompt can stay as it is.',
      'keep-sampling':
        'Sampling at 25% still auto-applies three quarters of a class running 82% and falling, on a surface where the audit, not the loop, caught both misses. Sampling measures drift; it does not contain it. The rate signal says the envelope is mis-drawn now.',
      'revoke-all':
        'Stopping everything zeroes the risk and the compounding together, and the record only indicts part of the class: tags, descriptions, and outputs run clean. The gate is placed per task class; use that resolution instead of the global switch.',
    },
    fromChapter: 18,
  },

  {
    id: 'gt-03',
    kind: 'gate',
    surface:
      'Steward console: the migration-helper class shows 99.2% approval; a proposal wants it below the gate.',
    prompt: 'Is 99.2% a record or a symptom?',
    evidence: [
      {
        label: 'The headline',
        text: 'Approval rate: 99.2% over 10 weeks (213 of 215). On paper, the strongest record on the board.',
      },
      {
        label: 'The texture',
        text: 'Median time-in-review fell from 11 minutes to 40 seconds over the same 10 weeks; the queue doubled in week 4.',
      },
      {
        label: 'Triangulation',
        text: "Sampled deep review agrees with the steward's yes 78% of the time, down from 96%. Post-merge defect rate on the class tripled, from a low base.",
      },
    ],
    options: [
      {
        id: 'rebase-rate',
        label: 'Hold the gate; restore considered review on a sampled slice and re-base the rate',
      },
      { id: 'move-below', label: 'The record justifies it: move the class below the gate' },
      { id: 'deep-review-all', label: 'Tighten: route every proposal in the class to deep review' },
    ],
    answer: 'rebase-rate',
    feedback: {
      'rebase-rate':
        'Triangulated, the 99.2% stops being a record: deep-review agreement fell 96 to 78 while time-in-review fell to 40 seconds, the divergence signature, with defects tripling behind it. The number measures the skim, not the work. Re-base on a deliberately reviewed slice; the only rate you can move a gate on is one that still means a considered yes.',
      'move-below':
        "This reads 99.2% at face value, and triangulation exists because that one number can lie alone: 40-second reviews, agreement down 18 points, defects tripled. Moving the gate on an inflated rate converts invisible rubber-stamping into official autonomy at the exact moment the class's real quality is unknown.",
      'deep-review-all':
        'Full deep review on 215 proposals a week is roughly seven times the whole budget; the inequality fails in week one and the queue pathologies arrive by week two. The instrument needs re-basing, not maximal force: a sampled considered slice rebuilds a trustworthy rate at a price the budget survives.',
    },
    fromChapter: 17,
  },

  {
    // Contested: override your own trust window under budget pressure, or hold
    // it and eat the queue. Both moves are defensible; both have a bill.
    id: 'gt-04',
    kind: 'gate',
    surface:
      'Steward console: budget at 28 of 28.5; the team wants to launch an on-call assist loop adding ~6 gated proposals a week.',
    prompt: 'Free the budget now, or hold the policy window?',
    evidence: [
      {
        label: 'The candidate class',
        text: "Doc-freshness PRs: 15 a week at 98% approval. But the loop is 5 weeks old, and the gate policy's window for earning auto-apply is 13 weeks.",
      },
      {
        label: 'The board',
        text: "No other class is close: the next-best record is 87%. The on-call loop's value case is strong; incident toil is the rotation's top complaint.",
      },
      {
        label: 'The trend',
        text: 'Inflow without the launch: growing about 2 a week per month as existing loops widen coverage.',
      },
    ],
    options: [
      {
        id: 'move-docs-below',
        label: 'Move doc-freshness below the gate at 5 weeks, with 20% sampling; launch now',
      },
      { id: 'delay-launch', label: 'Hold the 13-week window; delay the launch about 8 weeks' },
    ],
    contested: true,
    feedback: {
      'move-docs-below':
        'Defensible: 15 a week at 98% on the least irreversible surface on the board, and 20% sampling keeps a real measurement running while freeing about 12 approvals. This reading commits you to overriding your own written window, so say so out loud and bound it: an explicit short-window exception, heavier sampling, instant return above the gate on the first defect. Quiet exceptions are how authority surfaces rot.',
      'delay-launch':
        "Defensible: the 13-week window exists because young records flatter (five good weeks is also what reputation drag looks like early), and a policy you bend under budget pressure is a policy that bends every time. This reading commits you to eight more weeks of the rotation's top toil complaint, and to watching the inflow trend eat the headroom you are protecting. If you hold the window, hold it knowing the queue may force this same choice back at week 9 with less room.",
    },
    fromChapter: 18,
  },

  {
    id: 'gt-05',
    kind: 'gate',
    surface:
      'Data-quality console: gated inflow 41 a week against a 30-approval budget; WIP up 60% in six weeks.',
    prompt: 'Name the pathology, then pick the lever.',
    evidence: [
      {
        label: 'The pathology check',
        text: 'Approval rate steady at 91%, median time-in-review steady, no inflation anywhere. But the queue grew from 5 to 32 in six weeks and proposals now wait 8 days.',
      },
      {
        label: 'By class',
        text: 'Schema-annotation PRs: 22 a week at 96% over 15 weeks, one revert. Outlier-rule changes: 11 a week at 89%. Lineage-doc updates: 8 a week at 93%.',
      },
      {
        label: 'The offer',
        text: 'Capacity at 5% tolerance: 28.5. Two engineers have offered to burn down the queue over a weekend.',
      },
    ],
    options: [
      {
        id: 'move-annotations-below',
        label: 'Move schema annotations below the gate with sampling',
      },
      { id: 'weekend-burndown', label: 'Accept the weekend queue burndown' },
      { id: 'raise-tolerance', label: 'Raise false-approval tolerance to 15% to lift capacity' },
      { id: 'pause-loops', label: 'Pause the outlier and lineage loops until the queue clears' },
    ],
    answer: 'move-annotations-below',
    feedback: {
      'move-annotations-below':
        'The queue diagnosed itself: rates honest, reviews unhurried, WIP accumulating. That is the stall pathology, the one where the system backs up instead of hollowing out. The structural fix is on the board: schema annotations are 22 of the 41, at 96% over 15 weeks. Below the gate with sampling, inflow drops to about 19 against 28.5; the queue drains without a single hurried review, and all three loops keep compounding.',
      'weekend-burndown':
        "A weekend of heroics clears 32 items once; 41 a week against 28.5 rebuilds the queue in under a month, minus two engineers' weekend. Queues produced by the inequality are signals about gate placement. Spending people at them treats the constant (the budget) as the lever.",
      'raise-tolerance':
        'This lifts capacity to 34.8 by declaring more false approvals acceptable: the inequality passes because the goalposts moved, not the gates. Tolerance encodes how often you can afford a bad merge, and the queue says nothing about that number having changed.',
      'pause-loops':
        "Pausing drops inflow to 22 and the queue drains, at the price of two loops' entire output, including the 93% lineage class that was close to earning its own move. The arithmetic offers the same relief from one gate move on the strongest record, keeping all three loops alive.",
    },
    fromChapter: 18,
  },

  // ═══ TRUST (4) — the five properties, in motion ═══

  {
    id: 'tr-01',
    kind: 'trust',
    surface:
      "Trust ledger: the platform upgrades the agent fleet's base model to a strictly better one over the weekend.",
    prompt: "Monday morning: what happens to the dependency-patch class's auto-merge?",
    evidence: [
      {
        label: 'The record',
        text: '47 merged, 0 reverted over 14 weeks: auto-merge earned under judge-v1 and the old base model.',
      },
      {
        label: 'The upgrade',
        text: 'The new model benchmarks better on every public eval, including patch tasks. No failure has occurred.',
      },
      {
        label: 'The ledger',
        text: 'Every row is stamped with the environment it was earned in: model, judge, permissions, repo shape.',
      },
    ],
    options: [
      {
        id: 'reset-class',
        label: 'Auto-merge resets to propose-plus-review until fresh record accrues',
      },
      {
        id: 'keep-grant',
        label: 'Keep auto-merge: the record belongs to the agent, and the model only improved',
      },
      { id: 'reset-if-fail', label: 'Keep auto-merge; reset only if a defect appears' },
    ],
    answer: 'reset-class',
    feedback: {
      'reset-class':
        "Trust is conditional: it belongs to a task class in a specific environment, and the environment just changed. All 47 rows were earned under the old model; the entity producing Monday's proposals has no record at all, however well it benchmarks (benchmarks are a vendor claim, and trust accrues through track record, not claims). Nothing failed, and the grant still resets. A reset without failure is information, not punishment, and the new record usually accrues fast.",
      'keep-grant':
        'This reading makes the record portable across the thing that produced it. The ledger says otherwise: every row is stamped with the environment it was earned in, and "strictly better on benchmarks" is fiat, the very thing the earned property exists to replace. Better models behave differently, and differently is what the old record cannot speak to.',
      'reset-if-fail':
        "Waiting for the defect means the defect ships with auto-merge authority: the most expensive way to learn the environment changed. The reset exists because none of the three environment shifts requires detecting a failure first. That is the design's whole advantage over learning the hard way.",
    },
    fromChapter: 19,
  },

  {
    id: 'tr-02',
    kind: 'trust',
    surface:
      'Observability config: an agent with earned auto-merge on alert rules in alerts/ starts proposing changes in dashboards/.',
    prompt: 'Same repo, same YAML dialect. Does the record carry?',
    evidence: [
      {
        label: 'The record',
        text: 'The alerts/ class: 31 merged, 1 reverted over 12 weeks; auto-merge earned under the written gate policy.',
      },
      {
        label: 'The drift',
        text: 'The last 6 proposals touch dashboards/: same repo, same YAML dialect, same reviewer. Two have already auto-merged, because the grant is keyed to the repo, not the path.',
      },
      {
        label: 'The failure modes',
        text: 'A broken alert rule fails loudly in CI. A broken dashboard fails silently, during the next incident.',
      },
    ],
    options: [
      {
        id: 'new-class-proposal',
        label: 'Treat dashboards/ as a new class at proposal-only; re-key the grant',
      },
      {
        id: 'extend-grant',
        label: 'Extend the grant: same repo, same dialect, near-identical work',
      },
      { id: 'revoke-alerts', label: 'Revoke the alerts/ grant too; the agent overstepped' },
    ],
    answer: 'new-class-proposal',
    feedback: {
      'new-class-proposal':
        "Trust is narrow: 31 merges on alert rules say nothing about dashboards, whose failures arrive silently mid-incident instead of loudly in CI. A different verification story is a different class, whatever the file extension says. Two changes already rode a grant keyed wider than the record (class boundary erosion, the predictable decay), so the fix is two moves: dashboards/ starts at proposal-only, and the grant's key narrows to match what was actually earned.",
      'extend-grant':
        'Same dialect is a similarity of syntax; classes are defined by failure modes and verification, and a dashboard fails silently during an incident while an alert rule fails loudly in CI. Letting adjacency inherit the record is the erosion pattern: each step looks near-identical, and three steps later the record covers nothing the agent now does.',
      'revoke-alerts':
        'The alerts/ record is real and current, 31-and-1 over 12 weeks. Revoking it punishes the class that earned trust for the keying bug that let an adjacent class ride. Revocation exists for evidence of failure in the class; the move here is narrowing, not revocation. Keep what is earned, gate what is not.',
    },
    fromChapter: 19,
  },

  {
    id: 'tr-03',
    kind: 'trust',
    surface: 'Trust ledger: the schema-migration assistant returns from a five-month pause.',
    prompt: 'The grant was never revoked. Is it still alive?',
    evidence: [
      {
        label: 'The paper grant',
        text: 'Auto-apply for additive migrations, earned 14 months ago on a 9-week record; never revoked, never exercised since the pause began.',
      },
      {
        label: 'What changed during the pause',
        text: 'The ORM was upgraded two majors, the migration runner was replaced, and the schema gained 40 tables.',
      },
      {
        label: 'The window',
        text: 'Gate policy: a rolling 13-week window. The window contains zero decided rows for this class.',
      },
    ],
    options: [
      {
        id: 'relearn-window',
        label: 'Expired in substance: restart at proposal-only for a calibration window',
      },
      { id: 'resume-grant', label: 'The grant was never revoked; resume auto-apply' },
      { id: 'partial', label: 'Resume auto-apply, but only on tables that predate the pause' },
    ],
    answer: 'relearn-window',
    feedback: {
      'relearn-window':
        'Two properties converge. Expiring: a 13-week window with zero decided rows in it; the record has aged out, and renewal needs fresh track. Conditional: the runner, the ORM, and the schema shape the grant was earned against are all gone. A paper grant that outlives the conditions it was earned under is the definition of a liability. A calibration window at proposal-only is cheap, and the old skills re-earn quickly if they survived the changes.',
      'resume-grant':
        'Never-revoked measures whether anyone got around to it; the window measures whether the trust is alive, and it holds zero rows. Add the environment: new runner, two ORM majors, 40 new tables. The 14-month-old record describes a system that no longer exists, so resuming on paper authority is silent environmental drift, executed deliberately.',
      partial:
        'The split aims at the right property, narrowness, but cuts along the age of the rows when the reset cuts along environment: the old tables sit in the same changed environment, same new runner, same upgraded ORM, so the record is equally stale for them. Environment changes reset by class-in-environment, not by which rows are oldest.',
    },
    fromChapter: 19,
  },

  {
    // Contested: where does "the environment" end? Both readings are defensible;
    // each commits you to a different standing policy.
    id: 'tr-04',
    kind: 'trust',
    surface:
      "Trust ledger: the model vendor announces 'identical weights, new serving stack': new quantization, a tokenizer patch, 30% cheaper.",
    prompt: 'Did the environment change?',
    evidence: [
      {
        label: 'The bulletin',
        text: 'Same weights, new inference infrastructure, "no behavioral change expected." An internal spot-check of 200 cached prompts: 194 byte-identical, 6 differing in whitespace and one numeric format.',
      },
      {
        label: 'The stamp',
        text: "The ledger's env stamp tracks model ID, which the vendor did not change. Affected: 4 classes with earned auto-apply.",
      },
      {
        label: 'The costs',
        text: 'A 2-week shadow eval costs about 3 engineer-days. A full reset costs 4 classes a 13-week re-earn.',
      },
    ],
    options: [
      {
        id: 'treat-as-swap',
        label: 'The environment changed: reset the classes; the serving stack is part of the model',
      },
      {
        id: 'treat-as-same',
        label: 'Keep the grants with a heightened-sampling calibration; the weights are the anchor',
      },
    ],
    contested: true,
    feedback: {
      'treat-as-swap':
        'Defensible: trust is conditional on the environment, and the environment includes everything between the weights and the output. Quantization and tokenizer changes are exactly the at-the-margins behavioral shifts a 200-prompt spot check is too small to clear. This reading commits you to the full re-earn cost every time the vendor touches infrastructure, and vendors touch infrastructure often; budget for resets being routine, or this rigor decays into exceptions.',
      'treat-as-same':
        'Defensible: 194 of 200 byte-identical with whitespace-level deltas is evidence, not fiat, and a 2-week shadow eval at heightened sampling is a proportionate calibration for a change this small. This reading commits you to drawing a line you must then defend, which infra changes count as the same environment, and to owning the precedent: the next bulletin will cite this one. Write the threshold down (what eval, what sample size, what delta forces a reset) or the line will be drawn by whoever is busiest that week.',
    },
    fromChapter: 20,
  },

  // ═══ DECLINE (5) — boundary conditions on novel surfaces ═══

  {
    id: 'dc-01',
    kind: 'decline',
    surface:
      'A two-person studio tuning movement feel for a platformer: dash timing, coyote frames, camera lag.',
    prompt: 'Full MHE, tight gates, or decline?',
    evidence: [
      {
        label: 'The oracle',
        text: 'The designer evaluates a change by playing for 90 seconds; the verdict is felt, not measured. Two attempts to write it down ("dash should feel punchy") did not survive the next build.',
      },
      {
        label: 'The coordination load',
        text: 'Iteration is already seconds-fast: hot reload, one branch, no coordination overhead between the two people.',
      },
      {
        label: 'The bottleneck',
        text: "An engineer-agent pair ships 30 tuning variants a day in flow; the constraint is the designer's hands-on-controller time, which no loop output can substitute for.",
      },
    ],
    options: [
      { id: 'decline', label: 'Decline: stay in single-expert-plus-one-agent mode' },
      { id: 'tight-gates', label: 'Adopt with tight gates and a small budget' },
      { id: 'full-mhe', label: 'Adopt fully: build the loop infrastructure' },
    ],
    answer: 'decline',
    feedback: {
      decline:
        "The verification oracle is a human's hands on a controller, and the judgment will not compress into a signal a loop can read (the written spec died on contact, twice). Coordination is not the bottleneck: two people, one branch, seconds-fast iteration. Many-hands machinery earns its overhead only when work has scaled past what one expert and one agent can hold in a session. This is the other mode, honored as such, and the framework's own boundary conditions call it the right one here.",
      'tight-gates':
        "Tight gates solve a trust problem this team does not have; their constraint is oracle bandwidth, the designer's controller time, and a gate spends more of it on ceremony. At N=2 with no coordination cost, the overhead has no compounding to pay for it.",
      'full-mhe':
        "Build the loops and they will run, and pile thirty variants a day against an oracle that processes them ninety seconds at a time, by feel. Judgment-carried, ambiguous work is a listed boundary condition: the question here is what this should feel like, and loops cannot forage for an answer only one person's hands can render.",
    },
    fromChapter: 21,
  },

  {
    id: 'dc-02',
    kind: 'decline',
    surface:
      'Agtech: OTA firmware for 40,000 irrigation controllers already in fields, on metered cellular links.',
    prompt: 'Full MHE, tight gates, or decline?',
    evidence: [
      {
        label: 'Irreversibility',
        text: 'A failed flash bricks the unit: no rollback partition (cut from the BOM), and a bricked controller means a truck roll to a field, about $340 each. Historical failed-flash rate: about 3% per campaign.',
      },
      {
        label: 'Verification',
        text: 'Verification needs physical hardware: the lab has 12 test units across 9 hardware revisions, and emulation misses the radio and power-brownout behavior that causes most failures.',
      },
      {
        label: 'Cadence',
        text: 'Two firmware campaigns a year, planned around growing seasons; mid-season changes are vetoed by agronomy regardless of engineering confidence.',
      },
    ],
    options: [
      { id: 'decline', label: 'Decline: the planned mode is correctly dominant here' },
      { id: 'tight-gates', label: 'Adopt with tight gates and a small budget' },
      { id: 'full-mhe', label: 'Adopt fully: build the loop infrastructure' },
    ],
    answer: 'decline',
    feedback: {
      decline:
        'Run the axes on the whole surface: nearly every action is irreversible (3% brick rate, no rollback partition, $340 truck rolls), and verification gates on 12 physical units that emulation cannot stand in for. Loops compound where changes are reversible and verification is cheap; here the planned mode is correctly dominant, two deliberate campaigns a year. Agents still help, as tools inside the planned process, one expert pairing on driver code, without the many-hands layer.',
      'tight-gates':
        'Tight gates assume a reversible interior where loops can earn a record while the gate holds the irreversible edge. This catalog has almost no such interior: the cheap-verification, cheap-undo work the starter loops need does not exist on this hardware, so the gates would hold a queue of proposals nothing can safely verify at loop cadence.',
      'full-mhe':
        "The first loop to act autonomously meets a 3% brick rate at $340 a brick with no undo path. The reversibility ingredient cannot be supplied by terrain design here, because the hardware itself omitted it; the compounding case assumes most changes are cheap to take back, and this domain's economics are the inverse.",
    },
    fromChapter: 21,
  },

  {
    id: 'dc-03',
    kind: 'decline',
    surface:
      "A regional freight broker's 12-year-old VB6-and-Access ERP, scheduled for vendor replacement in 18 months.",
    prompt: 'Full MHE, tight gates, or decline?',
    evidence: [
      {
        label: 'The terrain',
        text: 'No test suite; the build requires a specific Windows 7 VM image; the two engineers who know the codebase retire within the year. Change volume: about 4 small fixes a month, mostly rate-table tweaks.',
      },
      {
        label: 'The quote',
        text: 'Making the terrain legible (tests around core flows, CI, reproducible builds) is quoted at about 5 engineer-months. The system is sunset in 18.',
      },
      {
        label: 'Where attention is committed',
        text: "The replacement project holds the team's engineering attention; the old system needs life support, not investment.",
      },
    ],
    options: [
      {
        id: 'decline',
        label: 'Decline: do the remaining work the old way; point loops at the replacement',
      },
      { id: 'tight-gates', label: 'Adopt with tight gates and a small budget' },
      { id: 'full-mhe', label: 'Adopt fully: build the terrain first' },
    ],
    answer: 'decline',
    feedback: {
      decline:
        'The arithmetic decides it: 5 engineer-months of terrain-building, amortized over 18 months of remaining life and 4 fixes a month, can never repay. This is the brownfield boundary condition in its purest form: the cost of building a legible terrain exceeds the cost of doing the work the old way. Spend the agents where the next decade lives; the migration itself (data mapping, parallel-run reconciliation) is fresh terrain where loops compound from day one.',
      'tight-gates':
        'Even the tightest gate needs a verification story behind it, and this terrain offers none: no tests, no reproducible build, and the only oracles, two retiring engineers, are the very resource gates would spend. Tight gates fit domains where verification is expensive; here it is nearly nonexistent, and not worth creating for a sunset.',
      'full-mhe':
        'Stage 0 of any transition is terrain work, and this terrain wants 5 engineer-months against an 18-month sunset and a 4-fix-a-month change rate. Loops would compound into a system scheduled for deletion. The same investment pointed at the replacement compounds for its whole life.',
    },
    fromChapter: 21,
  },

  {
    id: 'dc-04',
    kind: 'decline',
    surface:
      'Privacy engineering: the anonymization pipeline that releases research datasets from patient-adjacent telemetry.',
    prompt: 'Full MHE, tight gates, or decline?',
    evidence: [
      {
        label: 'The hard half',
        text: 'Producing a transform is easy; verifying it is the hard problem. Re-identification risk depends on linkage against datasets you do not hold, and a flawed release cannot be recalled once downloaded.',
      },
      {
        label: 'The mechanical half',
        text: 'Upstream of release the work is mechanical and reversible: generalization-rule changes, suppression thresholds, k-anonymity checks against held test corpora, per-release assumption docs.',
      },
      {
        label: 'The existing gate',
        text: 'Releases are quarterly, and each one gets a privacy-board review regardless of tooling.',
      },
    ],
    options: [
      {
        id: 'tight-gates',
        label: 'Adopt with tight gates: loops upstream, the board holds the release edge',
      },
      { id: 'decline', label: 'Decline: verification-hard domains are out of scope' },
      { id: 'full-mhe', label: 'Adopt fully, including release-adjacent autonomy on the roadmap' },
    ],
    answer: 'tight-gates',
    feedback: {
      'tight-gates':
        "Split the surface the way the axes do. Upstream of release the work is reversible and partially verifiable: rules, thresholds, checks against held corpora, loop terrain where a record can accrue. The release itself is the irreversibility cliff, information that cannot be recalled once downloaded. Verification-hard is a listed boundary condition with a listed posture: the framework still applies, but the gates stay tight and the budget stays small for a long time. Loops propose and pre-verify; the board's considered yes holds the cliff edge, indefinitely.",
      decline:
        'Declining outright leaves the mechanical interior hand-made forever: rule changes, threshold tuning, corpus checks, work that is reversible, specifiable, and high-volume, the exact profile loops are for. The boundary condition argues for small budgets and tight gates, not absence. The line to hold is autonomy at the release boundary, which the quarterly board already holds.',
      'full-mhe':
        "Full adoption puts release-adjacent autonomy somewhere on the roadmap, and this domain's defining feature is that the hardest verification, linkage against datasets you do not hold, cannot be supplied by any loop's oracle. Where checking is much harder than producing, envelopes stay narrow no matter how clean the record looks: the record measures what your corpora can see, and the risk lives in what they cannot.",
    },
    fromChapter: 21,
  },

  {
    // Contested: zone the periphery, or hold one auditable posture. The axes
    // genuinely support both; what differs is the standing cost each accepts.
    id: 'dc-05',
    kind: 'decline',
    surface:
      "A 60-person fintech's loan-decisioning service: regulated models, adverse-action notices, fair-lending audits, and a strong test suite.",
    prompt: 'Adopt by zone, or decline across the board?',
    evidence: [
      {
        label: 'The core',
        text: 'The decisioning core is regulated surface: model changes need documented review, audit trails, and quarterly fair-lending analysis. A flawed decision can mean redress and regulator findings.',
      },
      {
        label: 'The periphery',
        text: 'Around the core: notice templates, rule-config plumbing, internal dashboards, integration tests. About 25 PRs a week, reversible, well-tested, no regulatory sign-off required.',
      },
      {
        label: 'The team',
        text: 'Mature CI/CD, 15-minute pipelines, trunk-based development; the team is drowning in the peripheral change volume.',
      },
    ],
    options: [
      {
        id: 'zoned-adoption',
        label: 'Adopt by zone: loops on the reversible periphery; planned process holds the core',
      },
      { id: 'decline', label: 'Decline: a regulated decisioning shop holds one auditable posture' },
    ],
    contested: true,
    feedback: {
      'zoned-adoption':
        'Defensible, leaning on the zoning pattern: payments planned, flags emergent, same system. The periphery is 25 reversible, well-tested PRs a week, starter-loop terrain by every axis, while the core keeps its documented, planned process untouched. This reading commits you to policing the zone boundary forever: classes erode, and "notice template" drifts toward "notice logic" one adjacent PR at a time. The boundary needs its own gate policy, its own audits, and an explicit answer for when a peripheral loop\'s output touches regulated surface.',
      decline:
        "Defensible: regulated domains are a listed boundary condition, and a regulator does not grade your zone map; findings attach to the firm, and the audit trail must account for every hand on the decision path, autonomous ones included. This reading commits you to hand-carrying 25 peripheral PRs a week through a process designed for the core's risk profile, and to explaining to a drowning team why the dashboard backlog inherits the compliance posture of the decisioning model. If you decline, decline on the record that one auditable posture is worth the periphery's cost, not because the framework cannot draw zones.",
    },
    fromChapter: 21,
  },
];
