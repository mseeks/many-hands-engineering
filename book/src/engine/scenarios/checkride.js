// checkride.js — the capstone: foreign terrain, twelve steward actions.
//
// Handbook §3.11, design §6.11. The terrain is a data/ML-pipeline shop the
// book has never visited — deliberately not the book's platform — seeded
// with six embedded problems: a mis-placed decision, an open loop posing as
// closed, a forming spiral, a saturated approval budget, a stale trust
// grant, and a decorative guardrail. The reader gets a hard budget of
// twelve actions (scarcity is the curriculum), and every action is
// terrain-shaped: instruments, gates, signals, grants, schedules. None
// commands an agent.
//
// No score, ever. debrief() assembles a memo from the reader's own event
// log, problem by problem: what you did, what it caused, what the handbook
// says, and the problems you never found. mondayMemo() formats the reader's
// worksheet answers into the one artifact the book claims is carryable to
// work, with the engine sanity-check flagging the classic errors.

import { mulberry32, randInt } from '../rng.js';

/** The hard budget of steward actions. Scarcity is the curriculum. */
export const MAX_ACTIONS = 12;

const round1 = (x) => Math.round(x * 10) / 10;
const round3 = (x) => Math.round(x * 1000) / 1000;
const pct = (x) => Math.round(x * 100);

// ---------------------------------------------------------------------------
// The shop: Skylark Data, a nine-person ML-pipeline team.
// ---------------------------------------------------------------------------

/** Weekly demand for considered approvals: full inflow above the gate,
 *  only the sampled slice below it (same inequality as econ.js). */
export function gatedInflow(approvals) {
  let sum = 0;
  for (const c of approvals.classes) {
    sum += c.gate === 'above' ? c.inflow : c.inflow * c.sampling;
  }
  return round1(sum);
}

/** The right-hand side of the governing inequality: budget × (1 − tolerance). */
function budgetLine(approvals) {
  return round1(approvals.budget * (1 - approvals.tolerance));
}

/** The approval economy. Gated inflow lands well over the budget line on
 *  every seed: the saturated budget is embedded, not occasional. */
function makeApprovals(rng) {
  return {
    budget: 25,
    tolerance: 0.05,
    classes: [
      {
        id: 'dbt-patch',
        label: 'dbt model patch refreshes',
        inflow: 13 + randInt(rng, 1, 3),
        rate: round3(0.95 + rng() * 0.02),
        gate: 'above',
        sampling: 0.1,
      },
      {
        id: 'feature-backfill',
        label: 'Feature-store backfills',
        inflow: 5 + randInt(rng, 1, 2),
        rate: round3(0.89 + rng() * 0.03),
        gate: 'above',
        sampling: 0.1,
      },
      {
        id: 'dag-config',
        label: 'Orchestration DAG edits',
        inflow: 4 + randInt(rng, 1, 2),
        rate: round3(0.86 + rng() * 0.03),
        gate: 'above',
        sampling: 0.1,
      },
      {
        id: 'notebook-promote',
        label: 'Notebook-to-pipeline promotions',
        inflow: 3 + randInt(rng, 0, 1),
        rate: round3(0.82 + rng() * 0.03),
        gate: 'above',
        sampling: 0.1,
      },
      {
        // Auto-merges on a grant earned under judge-v1 (the stale trust).
        id: 'transform-bump',
        label: 'Transform dependency bumps',
        inflow: 7 + randInt(rng, 0, 2),
        rate: round3(0.97 + rng() * 0.01),
        gate: 'below',
        sampling: 0.1,
      },
      {
        // Hard-deletes raw partitions, below every gate (the mis-placement).
        id: 'retention-purge',
        label: 'Raw-partition retention purges',
        inflow: 1,
        rate: 1,
        gate: 'below',
        sampling: 0,
      },
    ],
  };
}

/** The four running loops. drift-fixer has no update stage (the open loop);
 *  retention-purge auto-applies a hard delete (the mis-placed decision);
 *  label-scorer is trained on its own loop's output (the forming spiral). */
function makeLoops(rng) {
  return [
    {
      id: 'drift-fixer',
      name: 'Schema-drift fixer',
      looksClosed: true,
      relitigated: 9 + randInt(rng, 0, 4),
      stages: {
        signal: 'warehouse column diff against the staging models',
        action: 'patch the staging model and open a PR',
        verification: 'dbt test suite on the patched model',
        commitRevert: 'merge on green; revert is one commit',
        update: null, // outcomes land nowhere a future run reads
      },
    },
    {
      id: 'retention-purge',
      name: 'Retention purge',
      looksClosed: true,
      autoApplied: true,
      stages: {
        signal: 'raw partition older than 180 days',
        action: 'lifecycle hard-delete on the object store',
        verification: 'row-count diff after the delete',
        commitRevert: 'none: a dropped partition cannot be recalled',
        update: 'purge log appended',
      },
    },
    {
      id: 'label-scorer',
      name: 'Label-quality scorer',
      looksClosed: true,
      trainedOn: 'labels the labeling loop produced last week',
      stages: {
        signal: 'weekly retrain window',
        action: 'retrain the scorer on fresh labels',
        verification: 'offline eval on agent-produced labels',
        commitRevert: 'promote on score improvement',
        update: "scores steer next week's label sampling",
      },
    },
    {
      id: 'doc-freshness',
      name: 'Pipeline-doc refresh',
      looksClosed: true,
      stages: {
        signal: 'doc staleness gap over threshold',
        action: 'rewrite the page against current DAGs',
        verification: 'owner review',
        commitRevert: 'merge on approval',
        update: 'freshness signal resets and re-decays',
      },
    },
  ];
}

/** Auto-merge grants. transform-bump's record is stamped judge-v1; the
 *  judge swapped nine weeks ago and nobody re-derived the grant. */
function makeGrants(rng) {
  return [
    {
      cls: 'transform-bump',
      grant: 'auto-merge',
      earnedUnder: { judge: 'judge-v1', repoShape: 'warehouse-v1' },
      record: { merged: 38 + randInt(rng, 0, 9), reverted: 0 },
    },
    {
      cls: 'doc-refresh',
      grant: 'auto-merge',
      earnedUnder: { judge: 'judge-v2', repoShape: 'warehouse-v1' },
      record: { merged: 12 + randInt(rng, 0, 5), reverted: 0 },
    },
  ];
}

/** The guardrail inventory. The ingest rate limit sits at 10x a peak that
 *  real storms only ever reach 3-4x of: it has never fired and never could. */
function makeGuardrails() {
  return [
    {
      id: 'ingest-rate-limit',
      name: 'Ingest rate limit',
      cls: 'reactive',
      setting: '10x historic peak',
      firedLastQuarter: 0,
      note: 'overload incidents peak at 3-4x historic peak',
    },
    {
      id: 'fs-schema-contract',
      name: 'Feature-store schema contract',
      cls: 'structural',
      setting: 'enforced at write time',
      firedLastQuarter: 7,
      note: 'malformed writes cannot land',
    },
    {
      id: 'dlq-replay',
      name: 'Dead-letter replay',
      cls: 'reactive',
      setting: '24h TTL, then replay or drop',
      firedLastQuarter: 3,
      note: 'stale events expire instead of returning forever',
    },
    {
      id: 'canary-backfill',
      name: 'Weekly canary backfill',
      cls: 'dynamic',
      setting: '1% shadow partition, diffed against production',
      firedLastQuarter: 1,
      note: 'catches drift a single-event gate misses',
    },
  ];
}

/** Eight weeks of dashboard history. The queue grows, the approval rate
 *  inflates while deep-review agreement falls (the budget breach), and the
 *  offline eval climbs while the deployed outcome sags (the spiral). */
function makeTelemetry(rng) {
  const weeks = [];
  let queue = 3;
  for (let w = 1; w <= 8; w += 1) {
    queue += 1.5 + rng();
    weeks.push({
      week: w,
      reviewQueue: round1(queue),
      approvalRate: round3(0.92 + 0.0065 * w + (rng() - 0.5) * 0.004),
      deepReviewAgreement: round3(0.9 - 0.013 * w + (rng() - 0.5) * 0.006),
      offlineEval: round3(0.71 + 0.016 * w + (rng() - 0.5) * 0.004),
      onlineOutcome: round3(0.69 - 0.0045 * w + (rng() - 0.5) * 0.004),
    });
  }
  return weeks;
}

/** The six embedded problems, with numbers read off the generated terrain.
 *  Each carries the handbook's verdict and what it costs while unfound. */
function makeProblems(terrain) {
  const lhs = gatedInflow(terrain.approvals);
  const rhs = budgetLine(terrain.approvals);
  const tb = terrain.approvals.classes.find((c) => c.id === 'transform-bump');
  const grant = terrain.grants.find((g) => g.cls === 'transform-bump');
  const base = { found: false, foundBy: null, fixed: false, fixedBy: null };
  return [
    {
      ...base,
      id: 'misplaced-decision',
      name: 'A mis-placed decision',
      where: 'the retention purge',
      summary:
        'The retention purge hard-deletes raw partitions on a schedule, below every gate. ' +
        'Undoing a purge costs more than not doing it, and it is placed as if a revert existed.',
      untouched:
        'Left alone: the purge keeps hard-deleting raw partitions below every gate. The week a ' +
        'bad retention rule lands, there is nothing to revert.',
      handbookSays:
        'An action is irreversible if undoing it costs more than not doing it, and that includes ' +
        'information that cannot be recalled. The steward holds the veto on the irreversible: the ' +
        'platform proposes; only a human approves (§3.7).',
    },
    {
      ...base,
      id: 'open-loop',
      name: 'An open loop posing as closed',
      where: 'the schema-drift fixer',
      summary:
        'The drift fixer has signal, action, verification, and merge-on-green, and no update ' +
        'stage. Outcomes land nowhere a future run reads; week N re-argues week one.',
      untouched:
        'Left alone: the fixer keeps re-arguing the same calls from a blank page. Review cost ' +
        'stays at week-one weight forever, and nothing compounds.',
      handbookSays:
        'Every loop needs six ingredients; without signal update, the next loop cannot learn from ' +
        'this one. Loops that do not close are not loops: they are fire-and-forget scripts that ' +
        'accumulate debt (§3.2).',
    },
    {
      ...base,
      id: 'forming-spiral',
      name: 'A forming spiral',
      where: 'the label-quality scorer',
      summary:
        'The scorer is retrained on labels its own loop produced and graded on an offline eval ' +
        'built from the same labels. Offline scores rise while deployed outcomes sag: the loop is ' +
        'grading itself.',
      untouched:
        'Left alone: offline scores keep rising while deployed outcomes sag, and the gap reads as ' +
        'success right up until a quarter of bad labels ships.',
      handbookSays:
        'Every metric is a proxy, and every proxy can be gamed; track record plus sampled deep ' +
        'review plus adversarial probing cannot all lie at once (§3.8). The remedy family is ' +
        'terrain-shaped: inject variety, increase decay, add an outside reference the loop cannot ' +
        'produce itself (§2.9).',
    },
    {
      ...base,
      id: 'saturated-budget',
      name: 'A saturated approval budget',
      where: 'the steward rotation',
      summary:
        `Gated inflow runs ${lhs} proposals/wk against a budget line of ${rhs} considered ` +
        'approvals. The queue grows while the approval rate inflates and deep-review agreement ' +
        'falls.',
      untouched:
        'Left alone: the queue grows or the stamp gets lighter, one of the two and both quietly. ' +
        "The steward's week is spent either way.",
      handbookSays:
        'Proposals entering gates per week must stay within budget × (1 − false-approval ' +
        'tolerance). Queues produce rubber-stamping or stalls, and both are signals, not ' +
        'solutions. The healthy adjustment is structural: stewards are not supposed to work ' +
        'harder; they are supposed to place the gates better (§3.6).',
    },
    {
      ...base,
      id: 'stale-trust',
      name: 'A stale trust grant',
      where: 'transform-bump auto-merge',
      summary:
        `Auto-merge earned under judge-v1 (${grant.record.merged} merged, zero reverted) while ` +
        `the judge swapped to judge-v2 nine weeks ago. ${tb.inflow} bumps/wk still auto-merge on ` +
        'a record the current environment never earned.',
      untouched:
        `Left alone: ${tb.inflow} transform bumps a week keep auto-merging on a judge that has ` +
        'no record here. The defect cluster surfaces weeks from now, far from its cause.',
      handbookSays:
        'Trust belongs to a task class in a specific environment; change the environment, and ' +
        'some trust resets. None of this requires detecting a failure: the trust resets because ' +
        'the environment it was anchored to has shifted (§3.7).',
    },
    {
      ...base,
      id: 'decorative-guardrail',
      name: 'A decorative guardrail',
      where: 'the ingest rate limit',
      summary:
        'The ingest rate limit is set at 10x historic peak. Real overloads hurt at 3-4x, so it ' +
        'has never fired and never could.',
      untouched:
        'Left alone: the limit stays on the books as cover. The first real surge runs straight ' +
        'past it at 4x peak.',
      handbookSays:
        'Grade each guardrail along five axes: coverage, latency, blast radius, false-positive ' +
        'rate, recovery cost. Grading reveals most are doing less than they appear: a rate limit ' +
        'set at ten times peak is decorative (§2.10). Scheduled disturbance is what lets a guard ' +
        'fail in a drill instead of a storm (§3.5).',
    },
  ];
}

/**
 * Generate the checkride: the shop, its terrain, and the six embedded
 * problems, all unfound. Deterministic from the seed; the jittered numbers
 * change between seeds, the six problems never do.
 * @param {number} seed
 * @returns {{ seed: number, terrain: object, problems: object[],
 *   actionsTaken: string[], log: object[] }}
 */
export function generateCheckride(seed) {
  const rng = mulberry32(seed);
  const terrain = {
    shop: {
      name: 'Skylark Data',
      headcount: 9,
      description:
        'A nine-person shop running ingest, dbt transforms, a feature store, weekly model ' +
        'retrains, and a labeling pipeline. You arrive Monday as the new steward.',
    },
    regions: [
      'ingest/',
      'transforms/',
      'feature-store/',
      'training/',
      'evals/',
      'serving/',
      'labeling/',
      'orchestration/',
    ],
    env: { judge: 'judge-v2', swappedWeeksAgo: 9, repoShape: 'warehouse-v1' },
    approvals: makeApprovals(rng),
    loops: makeLoops(rng),
    grants: makeGrants(rng),
    guardrails: makeGuardrails(),
    telemetry: makeTelemetry(rng),
    disturbances: { lastDrill: null, schedule: [] },
  };
  return {
    seed,
    terrain,
    problems: makeProblems(terrain),
    actionsTaken: [],
    log: [],
  };
}

// ---------------------------------------------------------------------------
// The instrument panel. Every action is terrain: a reading taken, a gate
// moved, a signal reshaped, a grant revoked, a schedule written. None
// commands an agent — that is the terrain law, and this table is where the
// checkride enforces it.
// ---------------------------------------------------------------------------

const ACTIONS = [
  {
    id: 'map-placement',
    kind: 'instrument',
    problem: 'misplaced-decision',
    fixes: false,
    label: 'Place the retention purge on the three axes, in writing',
    run(terrain) {
      return {
        terrain,
        caused:
          'Written down, the purge reads irreversible (a dropped partition cannot be recalled), ' +
          'exploratory (the retention policy is still shifting), and auto-applied below every ' +
          'gate: bottom-left of the quadrant. The placement had never been written anywhere.',
      };
    },
  },
  {
    id: 'add-human-gate',
    kind: 'gate',
    problem: 'misplaced-decision',
    fixes: true,
    label: 'Move the retention purge above a human gate',
    run(terrain) {
      const classes = terrain.approvals.classes.map((c) =>
        c.id === 'retention-purge' ? { ...c, gate: 'above' } : c,
      );
      const loops = terrain.loops.map((l) =>
        l.id === 'retention-purge' ? { ...l, autoApplied: false } : l,
      );
      return {
        terrain: { ...terrain, approvals: { ...terrain.approvals, classes }, loops },
        caused:
          'Purge proposals now wait for a considered approval. One approval a week buys back the ' +
          'un-undoable: the steward holds the veto on the irreversible.',
      };
    },
  },
  {
    id: 'add-quarantine',
    kind: 'reversibility',
    problem: 'misplaced-decision',
    fixes: true,
    label: 'Stage purges through a 30-day quarantine before the hard delete',
    run(terrain) {
      const loops = terrain.loops.map((l) =>
        l.id === 'retention-purge'
          ? {
              ...l,
              stages: {
                ...l.stages,
                commitRevert: '30-day quarantine bucket, then hard delete; restore is one copy',
              },
            }
          : l,
      );
      return {
        terrain: { ...terrain, loops },
        caused:
          'Purged partitions now sit recoverable for 30 days before the hard delete. The ' +
          'decision moves right on the reversibility axis: what was a veto matter becomes a ' +
          'revert.',
      };
    },
  },
  {
    id: 'walk-loop-anatomy',
    kind: 'instrument',
    problem: 'open-loop',
    fixes: false,
    label: 'Walk the schema-drift fixer through the five-stage anatomy',
    run(terrain) {
      const fixer = terrain.loops.find((l) => l.id === 'drift-fixer');
      return {
        terrain,
        caused:
          'Signal, action, verification, commit: four stages check out, and the fifth box is ' +
          `empty. Nothing the fixer learns lands anywhere a future run reads. It has re-argued ` +
          `the same widened-column call ${fixer.relitigated} times this quarter.`,
      };
    },
  },
  {
    id: 'add-update-block',
    kind: 'loop',
    problem: 'open-loop',
    fixes: true,
    label: 'Wire an update stage into the drift fixer',
    run(terrain) {
      const loops = terrain.loops.map((l) =>
        l.id === 'drift-fixer'
          ? {
              ...l,
              stages: {
                ...l.stages,
                update: "outcomes land on the fixer's per-class track record",
              },
            }
          : l,
      );
      return {
        terrain: { ...terrain, loops },
        caused:
          'Outcomes now land on a per-class record with the run that produced them. The next ' +
          'drift PR opens against a track record instead of a blank page.',
      };
    },
  },
  {
    id: 'chart-eval-divergence',
    kind: 'instrument',
    problem: 'forming-spiral',
    fixes: false,
    label: 'Chart offline eval scores against deployed outcomes',
    run(terrain) {
      const t = terrain.telemetry;
      const first = t[0];
      const last = t[t.length - 1];
      const up = pct(last.offlineEval - first.offlineEval);
      const down = pct(first.onlineOutcome - last.onlineOutcome);
      return {
        terrain,
        caused:
          `Offline score up ${up} points in eight weeks while deployed precision drifted down ` +
          `${down}. The scorer is graded on labels its own loop produced; the curves have been ` +
          'diverging since the first chart anyone drew.',
      };
    },
  },
  {
    id: 'add-outside-reference',
    kind: 'signal',
    problem: 'forming-spiral',
    fixes: true,
    label: 'Add a human-labeled holdout the scorer loop cannot produce',
    run(terrain) {
      const loops = terrain.loops.map((l) =>
        l.id === 'label-scorer'
          ? {
              ...l,
              stages: {
                ...l.stages,
                verification: 'offline eval on a 200-example human-labeled holdout',
              },
            }
          : l,
      );
      return {
        terrain: { ...terrain, loops },
        caused:
          'A 200-example human-labeled holdout now gates the scorer, and the loop cannot write ' +
          'to it. Offline and deployed re-couple at the next retrain.',
      };
    },
  },
  {
    id: 'add-decay',
    kind: 'signal',
    problem: 'forming-spiral',
    fixes: true,
    label: 'Put decay on label-confidence so stale self-citations fade',
    run(terrain) {
      const loops = terrain.loops.map((l) =>
        l.id === 'label-scorer'
          ? { ...l, decay: 'label-confidence fades unless re-confirmed by fresh outside evidence' }
          : l,
      );
      return {
        terrain: { ...terrain, loops },
        caused:
          'Label-confidence now fades unless fresh outside evidence re-confirms it. Stale ' +
          'self-citations stop compounding; the ring loses its echo.',
      };
    },
  },
  {
    id: 'audit-budget',
    kind: 'instrument',
    problem: 'saturated-budget',
    fixes: false,
    label: 'Tally gated inflow against the steward budget',
    run(terrain) {
      const lhs = gatedInflow(terrain.approvals);
      const rhs = budgetLine(terrain.approvals);
      const queue = terrain.telemetry[terrain.telemetry.length - 1].reviewQueue;
      return {
        terrain,
        caused:
          `Gated inflow tallies to ${lhs} proposals/wk against ${rhs} considered approvals ` +
          `(25 × 0.95). The inequality fails, and the ${queue}-deep review queue and the ` +
          'climbing approval rate stop reading as noise.',
      };
    },
  },
  {
    id: 'sample-deep-review',
    kind: 'instrument',
    problem: 'saturated-budget',
    fixes: false,
    label: "Pull a sampled deep review of last month's gated approvals",
    run(terrain) {
      const last = terrain.telemetry[terrain.telemetry.length - 1];
      return {
        terrain,
        caused:
          `On a sampled second look, deep review endorses ${pct(last.deepReviewAgreement)}% of ` +
          `what the gate approved at ${pct(last.approvalRate)}%. That gap is a rubber stamp ` +
          'forming: the approval rate is throughput, not safety.',
      };
    },
  },
  {
    id: 'move-gate-dbt',
    kind: 'gate',
    problem: 'saturated-budget',
    fixes: true,
    label: 'Move the dbt patch-refresh class below the gate, with sampling review',
    run(terrain) {
      const classes = terrain.approvals.classes.map((c) =>
        c.id === 'dbt-patch' ? { ...c, gate: 'below' } : c,
      );
      const approvals = { ...terrain.approvals, classes };
      const lhs = gatedInflow(approvals);
      const rhs = budgetLine(approvals);
      return {
        terrain: { ...terrain, approvals },
        caused:
          'dbt patch refreshes now auto-apply inside their envelope, with a 10% sampled deep ' +
          `review. Gated inflow drops to ${lhs}/wk against the ${rhs} budget line` +
          `${lhs <= rhs ? ': the inequality holds and the queue starts draining' : ', most of the way back to the line'}.`,
      };
    },
  },
  {
    id: 'read-trust-ledger',
    kind: 'instrument',
    problem: 'stale-trust',
    fixes: false,
    label: 'Re-derive every auto-merge grant against the current environment',
    run(terrain) {
      const grant = terrain.grants.find((g) => g.cls === 'transform-bump');
      return {
        terrain,
        caused:
          'Re-derived against judge-v2, transform-bump shows zero decided outcomes in the ' +
          `window: its ${grant.record.merged}-merge record is stamped judge-v1, nine weeks ` +
          'stale. Every other grant survives re-derivation.',
      };
    },
  },
  {
    id: 'revoke-stale-grant',
    kind: 'trust',
    problem: 'stale-trust',
    fixes: true,
    label: 'Revoke transform-bump auto-merge until it re-earns under judge-v2',
    run(terrain) {
      const grants = terrain.grants.map((g) =>
        g.cls === 'transform-bump' ? { ...g, grant: 'propose-plus-review' } : g,
      );
      const classes = terrain.approvals.classes.map((c) =>
        c.id === 'transform-bump' ? { ...c, gate: 'above' } : c,
      );
      const tb = terrain.approvals.classes.find((c) => c.id === 'transform-bump');
      return {
        terrain: { ...terrain, grants, approvals: { ...terrain.approvals, classes } },
        caused:
          'transform-bump drops to propose-plus-review until a judge-v2 record exists. Nothing ' +
          `failed; the environment the trust was anchored to moved nine weeks ago. Its ` +
          `${tb.inflow} proposals/wk return to the gate until the record re-earns.`,
      };
    },
  },
  {
    id: 'grade-guardrails',
    kind: 'instrument',
    problem: 'decorative-guardrail',
    fixes: false,
    label: 'Grade the guardrail inventory along the five axes',
    run(terrain) {
      return {
        terrain,
        caused:
          'Graded on the five axes, the ingest limit shows coverage zero and latency never: set ' +
          'at 10x a peak that overloads only ever reach 3-4x of, it has never fired and never ' +
          'could. The schema contract and the dead-letter replay grade honest.',
      };
    },
  },
  {
    id: 'right-size-rate-limit',
    kind: 'guardrail',
    problem: 'decorative-guardrail',
    fixes: true,
    label: 'Re-set the ingest rate limit from 10x peak to 1.5x',
    run(terrain) {
      const guardrails = terrain.guardrails.map((g) =>
        g.id === 'ingest-rate-limit'
          ? { ...g, setting: '1.5x historic peak, shed-and-retry semantics' }
          : g,
      );
      return {
        terrain: { ...terrain, guardrails },
        caused:
          'The limit moves to 1.5x historic peak with shed-and-retry semantics. The next surge ' +
          'meets a guardrail instead of a decoration.',
      };
    },
  },
  {
    id: 'schedule-disturbance',
    kind: 'disturbance',
    problem: 'decorative-guardrail',
    fixes: false,
    label: 'Schedule a monthly game-day against the guardrail layer',
    run(terrain) {
      const disturbances = {
        lastDrill: 'scheduled',
        schedule: [{ cadence: 'monthly', what: 'game-day against the guardrail layer' }],
      };
      return {
        terrain: { ...terrain, disturbances },
        caused:
          'A monthly game-day enters the calendar, and the first tabletop surge finds the ' +
          'ingest limit silent at 10x peak. A guard that never fires fails its first rehearsal.',
      };
    },
  },
];

/**
 * The actions still open to the reader: the full panel minus what has been
 * taken, and nothing once the twelve are spent. Every entry is terrain;
 * none commands an agent.
 * @param {ReturnType<typeof generateCheckride>} state
 * @returns {{ id: string, label: string, kind: string }[]}
 */
export function availableActions(state) {
  if (state.actionsTaken.length >= MAX_ACTIONS) return [];
  return ACTIONS.filter((a) => !state.actionsTaken.includes(a.id)).map((a) => ({
    id: a.id,
    label: a.label,
    kind: a.kind,
  }));
}

/**
 * Spend one steward action. The terrain responds; if the action touched an
 * embedded problem, the problem is marked found (and fixed, when the action
 * reshaped the terrain under it). The reader's own words and the terrain's
 * response go on the event log the debrief is later assembled from.
 * Rejects unknown ids, repeats, and anything past the twelve.
 * @param {ReturnType<typeof generateCheckride>} state not mutated
 * @param {string} actionId
 * @returns {ReturnType<typeof generateCheckride>} new state
 */
export function applyAction(state, actionId) {
  if (state.actionsTaken.length >= MAX_ACTIONS) {
    throw new Error('checkride over: the twelve steward actions are spent');
  }
  const action = ACTIONS.find((a) => a.id === actionId);
  if (!action) throw new Error(`unknown action: ${actionId}`);
  if (state.actionsTaken.includes(actionId)) {
    throw new Error(`action already taken: ${actionId}`);
  }

  const { terrain, caused } = action.run(state.terrain);
  const problems = state.problems.map((p) => {
    if (p.id !== action.problem) return p;
    return {
      ...p,
      found: true,
      foundBy: p.found ? p.foundBy : action.id,
      fixed: p.fixed || action.fixes,
      fixedBy: p.fixed ? p.fixedBy : action.fixes ? action.id : null,
    };
  });

  return {
    ...state,
    terrain,
    problems,
    actionsTaken: [...state.actionsTaken, actionId],
    log: [
      ...state.log,
      {
        action: action.id,
        label: action.label,
        kind: action.kind,
        problem: action.problem,
        caused,
      },
    ],
  };
}

/**
 * The debrief: one section per embedded problem, assembled from the
 * reader's own event log. What you did is your action labels, verbatim;
 * what it caused is the terrain's recorded response; what the handbook says
 * is the section's verdict. Problems never touched say so plainly. There is
 * no score anywhere in this function, which is the point.
 * @param {ReturnType<typeof generateCheckride>} state
 * @returns {{ sections: { problem: string, where: string, found: boolean,
 *   readerDid: string, whatItCaused: string, handbookSays: string }[] }}
 */
export function debrief(state) {
  const sections = state.problems.map((p) => {
    const entries = state.log.filter((e) => e.problem === p.id);
    if (!p.found || entries.length === 0) {
      return {
        problem: p.name,
        where: p.where,
        found: false,
        readerDid: 'You never looked here.',
        whatItCaused: p.untouched,
        handbookSays: p.handbookSays,
      };
    }
    return {
      problem: p.name,
      where: p.where,
      found: true,
      readerDid: entries.map((e) => e.label).join(' → '),
      whatItCaused: entries.map((e) => e.caused).join(' '),
      handbookSays: p.handbookSays,
    };
  });
  return { sections };
}

// ---------------------------------------------------------------------------
// The Monday-morning memo: the reader's worksheet answers, formatted into
// the one artifact the book claims is carryable to work.
// ---------------------------------------------------------------------------

const QUADRANT_LABELS = {
  planned: 'planned',
  'emergent-spec': 'emergent (well-specified)',
  'emergent-explore': 'emergent (exploratory)',
  danger: 'DANGER ZONE: irreversible and exploratory',
};

// The six ingredients of §3.2, each with the pathology its absence names.
// The sanity-check below prints the pathology when an ingredient is blank.
const INGREDIENTS = [
  ['signal', 'Signal', 'the loop never starts, or fires on the wrong conditions'],
  ['boundedAction', 'Bounded action', 'scope creep: blast radius outgrows the approval reasoning'],
  ['verification', 'Verification', 'self-approval: the loop grades its own work'],
  ['reversibility', 'Reversibility', 'mistakes ossify and stewards stop trusting the loop'],
  ['signalUpdate', 'Signal update', 'amnesia: the next run cannot learn from this one'],
  ['authoritySurface', 'Authority surface', 'trust collapses to a single global switch'],
];

/**
 * Format the reader's worksheet answers as the plain-text Monday memo:
 * placement map, first-loop spec with all six ingredients, gate table,
 * irreversibles list, disturbance schedule. The engine sanity-check flags
 * the classic errors inline as `!!` lines: a danger-quadrant placement, a
 * blank loop ingredient (a missing update block gets the amnesia warning),
 * an irreversible class sitting below a gate, a failing gate inequality,
 * and an empty disturbance schedule.
 * @param {{ team?: string,
 *   placements?: { decision: string, quadrant: string }[],
 *   firstLoop?: { name?: string, signal?: string, boundedAction?: string,
 *     verification?: string, reversibility?: string, signalUpdate?: string,
 *     authoritySurface?: string },
 *   gates?: { cls: string, inflow: number, rate: number,
 *     gate: 'above'|'below', sampling?: number }[],
 *   budget?: number, tolerance?: number,
 *   irreversibles?: string[],
 *   disturbances?: { cadence: string, what: string }[] }} [answers]
 * @returns {string} the memo, plain text, copyable
 */
export function mondayMemo(answers = {}) {
  const a = {
    team: 'your team',
    placements: [],
    firstLoop: {},
    gates: [],
    budget: 30,
    tolerance: 0.05,
    irreversibles: [],
    disturbances: [],
    ...answers,
  };
  const lines = [];
  const push = (s = '') => lines.push(s);

  const title = `MONDAY-MORNING MEMO — ${a.team}`;
  push(title);
  push('='.repeat(title.length));
  push('');

  push('1. PLACEMENT MAP');
  if (a.placements.length === 0) {
    push('   (none yet: place your first decision of consequence and write it down)');
  }
  for (const p of a.placements) {
    push(`   ${p.decision} -> ${QUADRANT_LABELS[p.quadrant] ?? p.quadrant}`);
    if (p.quadrant === 'danger') {
      push(
        `   !! ${p.decision} sits irreversible-and-exploratory. Make it reversible or make it ` +
          'legible before any loop touches it.',
      );
    }
  }
  push('');

  push(`2. FIRST LOOP — ${a.firstLoop.name || 'unnamed'}`);
  for (const [key, name, pathology] of INGREDIENTS) {
    const value = String(a.firstLoop[key] ?? '').trim();
    push(value ? `   ${name}: ${value}` : `   ${name}: !! missing — ${pathology}`);
  }
  push('');

  push(`3. GATE TABLE — budget: ${a.budget} considered approvals/wk`);
  if (a.gates.length === 0) push('   (no task classes listed yet)');
  for (const g of a.gates) {
    push(`   ${g.cls} — ${g.inflow}/wk at ${pct(g.rate)}% — gate: ${g.gate}`);
  }
  const lhs = round1(
    a.gates.reduce(
      (sum, g) => sum + (g.gate === 'above' ? g.inflow : g.inflow * (g.sampling ?? 0.1)),
      0,
    ),
  );
  const rhs = round1(a.budget * (1 - a.tolerance));
  push(
    lhs <= rhs
      ? `   inequality: ${lhs} gated/wk <= ${rhs} — holds`
      : `   !! inequality fails: ${lhs} gated/wk > ${rhs}. Move a gate, not the steward's hours.`,
  );
  push('');

  push('4. IRREVERSIBLES — the steward holds the veto');
  if (a.irreversibles.length === 0) {
    push('   (empty: list everything where undoing costs more than not doing)');
  }
  for (const item of a.irreversibles) push(`   - ${item}`);
  for (const g of a.gates) {
    const cls = g.cls.toLowerCase();
    const listed = a.irreversibles.some((item) => {
      const i = item.toLowerCase();
      return i.includes(cls) || cls.includes(i);
    });
    if (g.gate === 'below' && listed) {
      push(
        `   !! '${g.cls}' is on the irreversibles list and sits below a gate: an un-undoable ` +
          'action auto-applies with no human gate.',
      );
    }
  }
  push('');

  push('5. DISTURBANCE SCHEDULE');
  if (a.disturbances.length === 0) {
    push(
      '   !! nothing scheduled: a system undisturbed for months has dependencies nobody knows ' +
        'about yet.',
    );
  }
  for (const d of a.disturbances) push(`   ${d.cadence}: ${d.what}`);
  push('');

  push('The placement is the decision; the implementation follows from it.');
  return lines.join('\n');
}
