// The staged transition — Chapter 16's recorded runs. BET REGISTER.
//
// The handbook's §3.4 staging table is a principled proposal, not a
// measured law (§4.5 says so), and these runs are that proposal drawn as
// curves: a worked model of the working principle, not a mechanism the
// reader can falsify here. Every payoff caption says so in the book's
// standing phrase, and dissent() is the parameterization where the bet
// loses — included on purpose.
//
// The model: terrain legibility sets how much of each new loop's build
// cost is reusable instrumentation and how much of its output survives
// verification. Stage 0 buys legibility before anything ships. Skipping it
// leaves smart agents on dumb terrain; broadening Stage 1 pours the build
// budget into one loop. Constants are tuned for shape, not thresholds.

import { mulberry32 } from '../rng.js';
import { makeTrace, pushStep } from '../replay.js';

const BASE_LEGIBILITY = 0.25; // what un-instrumented terrain offers non-human readers
const STAGE0_LEGIBILITY = 0.9; // what four weeks of Stage 0 work buys
const CONVENTION_LIFT = 0.55; // strong team conventions are accidental Stage 0
const STAGE0_WEEKS = 4;
const BASE_LOOP_COST = 10; // steward-days to close loop #1
const REUSE_MAX = 0.75; // fraction of a loop's cost that legible terrain can absorb
const REUSE_CURVE = 0.7; // how fast reusable signal accumulates per prior loop
const BUILD_RATE = 2.5; // steward-days of build capacity per week
const YIELD_BASE = 0.35; // verified improvements survive even on dumb terrain...
const YIELD_LEGIBLE = 0.65; // ...but most of the yield rides on legibility
const PER_LOOP = 2; // verified improvements per loop-week at full legibility
const COORD_MIN_LOOPS = 3; // Stage 3 needs loops enough to read each other
const COORD_MIN_LEG = 0.6; // and signals legible enough to be worth reading
const COORD_BONUS = 0.05; // compounding per additional coordinating loop
const PLAN_MIN_LOOPS = 6; // Stage 4: a planner needs a field worth reading
const EARN_WEEKS = 12; // track-record weeks before first auto-merge (Stage 5)
const SWAP_WEEK = 40; // Stage 6 drill: the judge model is swapped
const REVOKE_WEEKS = 6; // autonomy stays revoked while it is re-earned
const REVOKE_DIP = 0.85; // throughput dips while everything re-queues for review
const SOPH_BONUS = 0.4; // the sophisticated loop's diminishing returns
const PRS_LEGIBLE = 3; // PRs per loop-week on legible terrain
const PRS_BLIND = 3.5; // dumb terrain produces more PRs, not fewer

const round1 = (x) => Math.round(x * 10) / 10;
const round2 = (x) => Math.round(x * 100) / 100;

/** Cost of closing loop n on terrain with legibility L: the bet's curve. */
function loopCost(n, L) {
  return BASE_LOOP_COST * (1 - REUSE_MAX * L * (1 - REUSE_CURVE ** (n - 1)));
}

/**
 * Run the staged transition for a stretch of weeks. Deterministic from the
 * seed; the rng is drawn exactly once per week so paired arms (skip vs
 * staged) share their noise and differ only in structure.
 *
 * @param {number} seed
 * @param {{ weeks?: number, skipStage0?: boolean, broaden?: boolean,
 *   conventions?: number, maxLoops?: number }} [opts]
 *   conventions: 0..1, how much accidental legibility the team already has.
 * @returns {{ rows: { week: number, stage: number, loops: number,
 *   yieldWeekly: number, cumYield: number, prs: number }[],
 *   costs: number[], legibility: number, events: { week: number,
 *   label: string }[] }} costs[i] is what loop i+1 cost to close.
 */
export function simulateStaging(seed, opts = {}) {
  const { weeks = 48, skipStage0 = false, broaden = false, conventions = 0, maxLoops = 12 } = opts;
  const rng = mulberry32(seed);
  const L0 = Math.min(0.95, BASE_LEGIBILITY + CONVENTION_LIFT * conventions);
  const legibility = skipStage0 ? L0 : Math.max(STAGE0_LEGIBILITY, L0);
  const buildStart = skipStage0 ? 0 : STAGE0_WEEKS;

  let loops = 0;
  let banked = 0;
  let nextCost = loopCost(1, legibility);
  let sophistication = 0; // the broadened loop's depth, in added capabilities
  let firstLoopWeek = null;
  let cumYield = 0;
  let stageReached = skipStage0 ? 1 : 0;
  const rows = [];
  const costs = [];
  const events = [];
  const mark = (stage, week, label) => {
    if (stage > stageReached) {
      stageReached = stage;
      events.push({ week, label });
    }
  };

  for (let week = 1; week <= weeks; week++) {
    if (!skipStage0 && week === 1) {
      events.push({ week, label: 'stage 0: instrumenting the terrain — nothing ships' });
    }
    if (week > buildStart) {
      mark(1, week, 'stage 1: closing the first loop');
      if (loops === 0 || (!broaden && loops < maxLoops)) {
        banked += BUILD_RATE;
        if (banked >= nextCost) {
          banked -= nextCost;
          loops += 1;
          costs.push(round2(nextCost));
          if (loops === 1) firstLoopWeek = week;
          if (loops === 2) mark(2, week, 'stage 2: replicating the template');
          nextCost = loopCost(loops + 1, legibility);
        }
      } else if (broaden) {
        sophistication += 1 / 3; // the budget pours into the one loop instead
      }
    }
    if (!broaden && loops >= COORD_MIN_LOOPS && legibility >= COORD_MIN_LEG) {
      mark(3, week, "stage 3: loops begin reading each other's signals");
    }
    if (!broaden && loops >= PLAN_MIN_LOOPS && legibility >= COORD_MIN_LEG) {
      mark(4, week, 'stage 4: a planner reads the full field');
    }
    const earned =
      firstLoopWeek !== null && legibility >= COORD_MIN_LEG && week >= firstLoopWeek + EARN_WEEKS;
    if (earned) mark(5, week, 'stage 5: first class earns auto-merge with sampling');
    const revoked = earned && week >= SWAP_WEEK && week < SWAP_WEEK + REVOKE_WEEKS;
    if (earned && week === SWAP_WEEK) {
      mark(6, week, 'stage 6: judge model swapped — earned autonomy revoked, re-earning');
    }
    if (earned && stageReached >= 6 && week === SWAP_WEEK + REVOKE_WEEKS) {
      events.push({ week, label: 'autonomy re-earned on the new model' });
    }

    // Weekly yield: verified improvements that actually landed. Activity
    // (PRs opened) is counted separately — dumb terrain stays busy.
    const perLoop = PER_LOOP * (YIELD_BASE + YIELD_LEGIBLE * legibility);
    const coord =
      !broaden && loops >= COORD_MIN_LOOPS && legibility >= COORD_MIN_LEG
        ? 1 + COORD_BONUS * (loops - 1)
        : 1;
    const depth = broaden ? 1 + SOPH_BONUS * Math.sqrt(sophistication) : 1;
    const jitter = 1 + (rng() - 0.5) * 0.08; // one draw per week, every arm
    const dip = revoked ? REVOKE_DIP : 1;
    const yieldWeekly = round2(loops * perLoop * coord * depth * dip * jitter);
    cumYield += yieldWeekly;
    const prs = round1(loops * (legibility >= COORD_MIN_LEG ? PRS_LEGIBLE : PRS_BLIND) * jitter);
    rows.push({
      week,
      stage: stageReached,
      loops,
      yieldWeekly,
      cumYield: round1(cumYield),
      prs,
    });
  }
  return { rows, costs, legibility, events };
}

const finalCum = (run) => run.rows.at(-1).cumYield;
const meanPrs = (run) => round1(run.rows.reduce((a, r) => a + r.prs, 0) / run.rows.length);

/**
 * The author's bet, run straight: stages 0-6 advancing over 48 weeks, the
 * cost-of-the-nth-loop curve bending down as terrain instrumentation gets
 * reused, coordination compounding once loops read each other's signals.
 * @param {number} seed
 * @returns {import('../replay.js').Trace}
 */
export function stagingRun(seed) {
  const run = simulateStaging(seed);
  const { rows, costs, events } = run;
  const swap = events.find((e) => e.label.includes('swapped'));
  const half = rows[Math.floor(rows.length / 2) - 1].cumYield;

  const trace = makeTrace(seed);
  pushStep(trace, {
    label: 'stage 0 — legible terrain',
    caption:
      'Four weeks, zero PRs. The board shows nothing but instrumentation ' +
      'landing: dependency metadata, changelogs, and CI status exposed as ' +
      'structured signals. This is the stage the impatient skip, and the ' +
      'whole run prices that temptation.',
    data: { rows: rows.slice(0, STAGE0_WEEKS), events: events.slice(0, 1) },
  });
  pushStep(trace, {
    label: 'stages 1-2 — close one, replicate',
    caption:
      `Loop one costs ${costs[0]} steward-days to close. Loop two costs ` +
      `${costs[1]}, loop five ${costs[4]} — watch the cost-of-the-nth-loop ` +
      'curve as each new loop reuses the signals the terrain already ' +
      'carries. Resist broadening any one of them; the template is the ' +
      'asset.',
    data: { costs, firstLoopWeek: rows.find((r) => r.loops === 1).week },
  });
  pushStep(trace, {
    label: 'stages 3-4 — coordinate, plan',
    caption:
      'At three loops the lines stop being parallel: patch decisions start ' +
      'reading flakiness history, and weekly yield grows faster than the ' +
      'loop count alone explains. By six loops a planner is reading the ' +
      'whole field and ordering the queue.',
    data: { events: events.filter((e) => /stage [34]/.test(e.label)) },
  });
  pushStep(trace, {
    label: 'stages 5-6 — earn, de-automate',
    caption:
      `Week ${events.find((e) => e.label.includes('auto-merge')).week}: the ` +
      'patch class earns auto-merge with sampling. Then the drill that ' +
      `makes it durable — week ${swap.week}, the judge model is swapped ` +
      'and every earned grant is revoked. Watch the throughput dip and ' +
      'recover: de-automating gracefully is a capability, not a defeat.',
    data: { events: events.filter((e) => e.week >= SWAP_WEEK - 1 || /stage 5/.test(e.label)) },
  });
  pushStep(trace, {
    label: 'the payoff',
    caption:
      `Week 48: cost per new loop down from ${costs[0]} steward-days to ` +
      `${costs.at(-1)}, cumulative verified improvements at ` +
      `${finalCum(run)} — and ${round1(finalCum(run) - half)} of those ` +
      'arrived in the second half. The handbook stages this transition as ' +
      'a principled proposal, not a measured law, and this curve is the ' +
      "author's bet, drawn. The N=1 froot table is the feasibility " +
      'evidence; at-scale proof does not exist yet.',
    data: { rows, costs, events },
  });
  return trace;
}

/**
 * The ghost run: skip Stage 0 and drop the same loops onto dumb terrain.
 * Activity stays high — more PRs, even — while verified yield never
 * compounds. Data carries both arms for the comparison chart.
 * @param {number} seed
 * @returns {import('../replay.js').Trace}
 */
export function skipStageZero(seed) {
  const skip = simulateStaging(seed, { skipStage0: true });
  const staged = simulateStaging(seed);
  const aheadUntil = skip.rows.filter((r, i) => r.cumYield >= staged.rows[i].cumYield).length;

  const trace = makeTrace(seed);
  pushStep(trace, {
    label: 'the head start',
    caption:
      `No instrumentation weeks, so loop one closes at week ` +
      `${skip.rows.find((r) => r.loops === 1).week} — a month before the ` +
      'staged twin ships anything. For the first quarter this run is ' +
      'simply winning, and every skipped Stage 0 in the wild felt exactly ' +
      'like this.',
    data: { skipRows: skip.rows.slice(0, 14), stagedRows: staged.rows.slice(0, 14), aheadUntil },
  });
  pushStep(trace, {
    label: 'the ghost',
    caption:
      `Now read the two panels apart. PRs per week: ${meanPrs(skip)} here ` +
      `against ${meanPrs(staged)} on the staged run — the activity gauges ` +
      'agree. But the cost-of-the-nth-loop curve barely bends ' +
      `(${skip.costs[0]} down to only ${skip.costs.at(-1)}), every loop ` +
      'hand-rolls its own parsing, and coordination never arrives because ' +
      'there are no legible signals to read. High activity, low signal, ' +
      'no compounding.',
    data: { skipCosts: skip.costs, stagedCosts: staged.costs, meanPrs: meanPrs(skip) },
  });
  pushStep(trace, {
    label: 'the bill',
    caption:
      `Week ${aheadUntil} is the last week this run is ahead. By week 48 ` +
      `it has banked ${finalCum(skip)} verified improvements against the ` +
      `staged run's ${finalCum(staged)} — smart agents on dumb terrain, ` +
      "priced. Skipping Stage 0 is the stage's most common fate, and this " +
      "curve is the author's bet, drawn; the dissent run shows the " +
      'parameterization where it stays wrong for a long while.',
    data: { skip, staged, aheadUntil },
  });
  return trace;
}

/**
 * The seductive mistake: after loop one, pour the build budget into making
 * it sophisticated instead of replicating it. The dozen-simple-loops
 * counterfactual (the staged run, same seed and noise) compounds past it.
 * @param {number} seed
 * @returns {import('../replay.js').Trace}
 */
export function broadenStageOne(seed) {
  const broad = simulateStaging(seed, { broaden: true });
  const staged = simulateStaging(seed);
  const crossing = staged.rows.find((r, i) => r.cumYield > broad.rows[i].cumYield).week;

  const trace = makeTrace(seed);
  pushStep(trace, {
    label: 'the seduction',
    caption:
      'Loop one works, so every planning meeting proposes deepening it: ' +
      'wider scopes, richer prompts, more capabilities. For the early ' +
      'weeks the chart agrees — one sophisticated loop out-yields a staged ' +
      'twin that is still instrumenting terrain.',
    data: { broadRows: broad.rows.slice(0, crossing), stagedRows: staged.rows.slice(0, crossing) },
  });
  pushStep(trace, {
    label: 'the crossing',
    caption:
      `Week ${crossing}: the replicating run passes it and never looks ` +
      'back. Sophistication pays the square-root of what it costs, while ' +
      'each simple loop added is a full new line of yield plus a ' +
      'coordination bonus on every line already running.',
    data: { crossing },
  });
  pushStep(trace, {
    label: 'the payoff',
    caption:
      `Week 48: ${finalCum(broad)} verified improvements from the one ` +
      `sophisticated loop, ${finalCum(staged)} from the dozen simple ones. ` +
      'A dozen simple loops compounding beats one sophisticated loop ' +
      "burning attention — and this curve is the author's bet, drawn, " +
      'not a measurement of your platform.',
    data: { broad, staged, crossing },
  });
  return trace;
}

/**
 * Model dissent: the parameterization where skipping Stage 0 works fine
 * for a long while. Small N (three loops) and strong conventions (terrain
 * already half-legible by habit) — the skip run never falls behind inside
 * the forty-week window. The bet, drawn where it loses.
 * @param {number} seed
 * @returns {import('../replay.js').Trace}
 */
export function dissent(seed) {
  const opts = { weeks: 40, conventions: 0.9, maxLoops: 3 };
  const skip = simulateStaging(seed, { ...opts, skipStage0: true });
  const staged = simulateStaging(seed, opts);

  const trace = makeTrace(seed);
  pushStep(trace, {
    label: 'the parameterization',
    caption:
      'Three loops, a small team, and conventions strong enough that the ' +
      'terrain is already half-legible before anyone instruments it: ' +
      'uniform commit shapes, one lockfile format, CI status everyone ' +
      'already parses by habit. Stage 0 has much less to buy here.',
    data: { conventions: opts.conventions, maxLoops: opts.maxLoops, legibility: skip.legibility },
  });
  pushStep(trace, {
    label: 'forty weeks, no penalty',
    caption:
      'Run the skip and its staged twin on the same noise and watch the ' +
      'cumulative lines: the skip run is ahead at week four, ahead at week ' +
      'twenty, and still not behind at week forty. The punishment the main ' +
      'run promised simply has not arrived.',
    data: { skipRows: skip.rows, stagedRows: staged.rows },
  });
  pushStep(trace, {
    label: 'the honest reading',
    caption:
      `Week 40: ${finalCum(skip)} verified improvements against ` +
      `${finalCum(staged)} — the staged twin has spent the window paying ` +
      'off its instrumentation tax and has only just pulled level. At ' +
      'small N with strong conventions, Stage 0 buys little that habit ' +
      "had not already built; this curve is the author's bet, drawn " +
      'where it loses. If your shop looks like this one, the bet may be ' +
      'wrong for you, and the handbook flags staging as exactly this kind ' +
      'of proposal (§4.5).',
    data: { skip, staged },
  });
  return trace;
}
