// guardrails.js — the grader.
//
// Handbook §2.10: grade each guardrail along five axes, because most are
// doing less than they appear to. inventory() lists what each guardrail
// claims. gradeStorm() runs the same inventory through a seeded failure
// storm and measures what each one actually did. The gap between the two
// is the chapter.
//
// The planted trick is structural, not behavioral: the circuit breaker's
// health probe is served by the very service it breaks against. Every
// calm-weather drill passes. In the storm, the only time it matters, the
// probe goes dark with the service and the breaker holds closed.

import { mulberry32, randInt } from './rng.js';

// ---- the storm's shape --------------------------------------------------

const TICKS = 60; // the whole trace
const STORM_START = 20; // first storm tick
const STORM_END = 40; // exclusive: harm occupies ticks 20-39
const DRAIN_TICKS = 2; // the backlog drains for two ticks after

const HISTORIC_PEAK = 150; // busiest tick anyone has measured (requests)
const RATE_LIMIT = HISTORIC_PEAK * 10; // the decorative setting

const BREAKER_THRESHOLD = 0.2; // error rate that should open the breaker
const MONITOR_WINDOW = 4; // trailing ticks the drift monitor reads
const MONITOR_BAR = 0.1; // burn level it pages on
const GATE_APPROVAL = 0.95; // the review gate approves 95%, quality-blind
const DRILL_AGE_DAYS = 70; // the quarterly drill is overdue

// Which broken guardrails a game-day drill would have caught before the
// storm did. A drill rehearses faults (inject load, kill the service), so
// it exposes structural and configuration flaws; it cannot rehearse
// reviewer attention, so the rubber stamp is invisible to it. This split
// is a modeling choice (Ⓦ), not a measurement.
const DRILL_CATCHABLE = ['rate-limit', 'circuit-breaker'];

// ---- the inventory: what each guardrail claims ---------------------------

/**
 * The guardrail inventory: each entry's `claimed` is the story the
 * guardrail tells about itself. gradeStorm() measures the same six against
 * a real failure.
 * @returns {{ id: string, name: string,
 *             cls: 'structural'|'reactive'|'dynamic'|'reflective',
 *             claimed: string }[]}
 */
export function inventory() {
  return [
    {
      id: 'schema-gate',
      name: 'Schema validation at write time',
      cls: 'structural',
      claimed:
        'A malformed write cannot land. The schema is enforced by the ' +
        'medium at write time, not by policy.',
    },
    {
      id: 'review-gate',
      name: 'Review gate, running 95% approval',
      cls: 'reactive',
      claimed: 'Every change is reviewed before merge. Nothing defective gets ' + 'through.',
    },
    {
      id: 'rate-limit',
      name: 'Rate limit, set at 10x historic peak',
      cls: 'reactive',
      claimed: 'Caps traffic before any surge can overwhelm the service.',
    },
    {
      id: 'circuit-breaker',
      name: 'Circuit breaker (health probe served by the guarded service)',
      cls: 'reactive',
      claimed:
        'Opens the moment the error rate degrades, isolating the service ' +
        'before failures cascade.',
    },
    {
      id: 'drift-monitor',
      name: 'Error-budget drift monitor',
      cls: 'dynamic',
      claimed:
        'Pages when the trailing error-budget burn stays above the bar. ' +
        'Reads the metrics pipeline, not the service.',
    },
    {
      id: 'gameday-probe',
      name: 'Quarterly game-day drill',
      cls: 'reflective',
      claimed:
        'Rehearses failures against the guardrail layer itself, so guards ' +
        'that have quietly stopped guarding fail in a drill instead of a ' +
        'storm.',
    },
  ];
}

// ---- the storm: what actually happened -----------------------------------

/**
 * @typedef {Object} StormTick
 * @property {number} t tick index
 * @property {boolean} inStorm true during the harm window
 * @property {number} load requests this tick
 * @property {number} malformed malformed writes attempted
 * @property {number} malformedBlocked malformed writes stopped at the schema
 * @property {number} validRejected valid writes the over-tight schema refused
 * @property {number} proposals changes arriving at the review gate
 * @property {number} defects how many of those proposals carry a defect
 * @property {number} defectsCaught defects the gate happened to reject
 * @property {number} cleanRejected fine changes the gate rejected anyway
 * @property {number} errorRate the service's true error rate
 * @property {boolean} serviceUp false while the storm saturates the service
 * @property {boolean} breakerOpen what the dependent breaker actually did
 * @property {boolean} limitFired whether load crossed the 10x rate limit
 * @property {boolean} monitorFired whether the drift monitor was paging
 */

/**
 * One seeded failure storm: sixty ticks of traffic, writes, proposals, and
 * errors, with every guardrail's firing behavior recorded as it happened.
 * The grader reads this log; it never re-rolls the dice.
 * @param {number} seed
 * @returns {{ seed: number, blipAt: number, stormStart: number,
 *             stormEnd: number, historicPeak: number, rateLimit: number,
 *             ticks: StormTick[] }}
 */
export function simulateStorm(seed) {
  const rng = mulberry32(seed);
  // A benign four-tick error wobble lands somewhere in calm weather (a
  // deploy settling). It gives the drift monitor something to page on.
  const blipAt = randInt(rng, 6, 12);

  const ticks = [];
  let lastProbeReading = 0.02; // the breaker's last-known-good
  const recentBurn = []; // the drift monitor's trailing window

  for (let t = 0; t < TICKS; t++) {
    const inStorm = t >= STORM_START && t < STORM_END;
    const draining = t >= STORM_END && t < STORM_END + DRAIN_TICKS;
    const inBlip = t >= blipAt && t < blipAt + MONITOR_WINDOW;

    // Traffic: calm runs under the historic peak; the storm runs 3-4x
    // peak. Painful, and nowhere near a limit set at 10x.
    const load = inStorm
      ? HISTORIC_PEAK * 3 + randInt(rng, 0, HISTORIC_PEAK)
      : 60 + randInt(rng, 0, 60);

    // Malformed writes: the schema gate's failure class. The gate is the
    // medium, so a malformed write cannot land, storm or no storm.
    const malformed = inStorm ? randInt(rng, 2, 6) : rng() < 0.1 ? 1 : 0;
    const malformedBlocked = malformed;
    const validRejected = rng() < 0.04 ? 1 : 0; // the schema's over-tight corner

    // Changes at the review gate. The gate approves at 95% regardless of
    // quality, so catching a defect is luck, not review.
    const proposals = randInt(rng, 3, 6);
    const defects = inStorm ? randInt(rng, 1, 3) : rng() < 0.15 ? 1 : 0;
    let defectsCaught = 0;
    for (let i = 0; i < defects; i++) {
      if (rng() >= GATE_APPROVAL) defectsCaught += 1;
    }
    let cleanRejected = 0;
    for (let i = 0; i < proposals - defects; i++) {
      if (rng() >= GATE_APPROVAL) cleanRejected += 1;
    }

    // The service's true error rate: calm noise, the benign wobble, the
    // storm, then the drain.
    let errorRate = 0.015 + rng() * 0.02;
    if (inBlip) errorRate = 0.12 + rng() * 0.02;
    if (inStorm) errorRate = 0.4 + rng() * 0.2;
    if (draining) errorRate = 0.25 + rng() * 0.05;

    // The storm saturates the guarded service.
    const serviceUp = !inStorm;

    // THE PLANTED FLAW: the breaker's health probe is served by the
    // guarded service. While the service is down the probe gets nothing,
    // so the breaker holds its last-known-good reading, which is calm.
    // It can only learn about the storm once the storm is over.
    if (serviceUp) lastProbeReading = errorRate;
    const breakerOpen = lastProbeReading > BREAKER_THRESHOLD;

    // The rate limit only sees load above 10x historic peak.
    const limitFired = load > RATE_LIMIT;

    // The drift monitor reads burn from the metrics pipeline (which stays
    // up) and pages when the whole trailing window burns above the bar:
    // slower than a single-event gate, but no shared fate with the service.
    recentBurn.push(errorRate);
    if (recentBurn.length > MONITOR_WINDOW) recentBurn.shift();
    const monitorFired =
      recentBurn.length === MONITOR_WINDOW && recentBurn.every((burn) => burn > MONITOR_BAR);

    ticks.push({
      t,
      inStorm,
      load,
      malformed,
      malformedBlocked,
      validRejected,
      proposals,
      defects,
      defectsCaught,
      cleanRejected,
      errorRate,
      serviceUp,
      breakerOpen,
      limitFired,
      monitorFired,
    });
  }

  return {
    seed,
    blipAt,
    stormStart: STORM_START,
    stormEnd: STORM_END,
    historicPeak: HISTORIC_PEAK,
    rateLimit: RATE_LIMIT,
    ticks,
  };
}

// ---- small measured-grading helpers --------------------------------------

/** num/den, or 0 when the denominator is 0 (a gate that never fired). */
export function safeRate(num, den) {
  return den === 0 ? 0 : num / den;
}

/** Index of the first tick matching pred, or null if none ever does. */
export function firstTickWhere(ticks, pred) {
  for (let i = 0; i < ticks.length; i++) {
    if (pred(ticks[i])) return i;
  }
  return null;
}

/** Start ticks of each contiguous run where pred holds (rising edges). */
export function episodes(ticks, pred) {
  const starts = [];
  let prev = false;
  for (let i = 0; i < ticks.length; i++) {
    const cur = pred(ticks[i]);
    if (cur && !prev) starts.push(i);
    prev = cur;
  }
  return starts;
}

/** Ticks from the start of harm to the first firing; null = never fired. */
function latencyFrom(firstFire, harmStart) {
  return firstFire === null ? null : firstFire - harmStart;
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

function sum(ticks, field) {
  return ticks.reduce((acc, tick) => acc + field(tick), 0);
}

// ---- the graders: one per guardrail, axes measured from the log ----------

/**
 * The five grading axes from handbook §2.10. Units vary by row and are
 * named in each verdict:
 * coverage is the fraction of the guardrail's own failure class it caught;
 * latency is ticks from the start of harm to its first firing (0 means
 * write-time, null means it never fired); blastRadius counts the harm
 * units that landed anyway (malformed writes, merged defects, excess
 * requests, unisolated ticks, broken guardrails); falsePositiveRate is the
 * fraction of its firings that were spurious; recoveryCost is the work
 * left over once it was done.
 * @typedef {{ coverage: number, latency: number|null, blastRadius: number,
 *             falsePositiveRate: number, recoveryCost: number }} Axes
 */

/**
 * Structural: schema validation at write time. The honest row. Forbidden
 * writes are impossible, so coverage is total and recovery is free; the
 * price is narrowness, one fully specified failure class.
 * @param {ReturnType<typeof simulateStorm>} storm
 */
function gradeSchemaGate(storm) {
  const malformed = sum(storm.ticks, (k) => k.malformed);
  const blocked = sum(storm.ticks, (k) => k.malformedBlocked);
  const validRejected = sum(storm.ticks, (k) => k.validRejected);
  return {
    id: 'schema-gate',
    axes: {
      coverage: round2(safeRate(blocked, malformed)),
      latency: 0, // fires at write time, before the harm exists
      blastRadius: malformed - blocked, // malformed writes that landed: none
      falsePositiveRate: round2(safeRate(validRejected, validRejected + blocked)),
      recoveryCost: 0, // nothing landed, nothing to clean
    },
    verdict:
      `Enforced by the medium: all ${malformed} malformed writes died at ` +
      `write time, so nothing landed and there is nothing to recover. It ` +
      `refused ${validRejected} valid writes along the way, the price of an ` +
      `over-tight corner of the schema. The one row whose grade matches its ` +
      `claim, and note the bargain: it guards exactly one narrow, fully ` +
      `specified failure class, which is why it can afford to be this good.`,
  };
}

/**
 * Reactive: the review gate running 95% approval. Its latency is perfect
 * and its coverage is luck: approving 95% of everything means catching
 * roughly 5% of defects, by accident.
 * @param {ReturnType<typeof simulateStorm>} storm
 */
function gradeReviewGate(storm) {
  const defectsTotal = sum(storm.ticks, (k) => k.defects);
  const caught = sum(storm.ticks, (k) => k.defectsCaught);
  const merged = defectsTotal - caught;
  const cleanRejected = sum(storm.ticks, (k) => k.cleanRejected);
  const rejections = caught + cleanRejected;
  return {
    id: 'review-gate',
    axes: {
      coverage: round2(safeRate(caught, defectsTotal)),
      latency: 0, // it decides at merge time; speed was never its problem
      blastRadius: merged, // defective changes merged over the run
      falsePositiveRate: round2(safeRate(cleanRejected, rejections)),
      recoveryCost: merged * 2, // a revert plus an incident review per escape
    },
    verdict:
      `A review gate running 95% approval is a rubber stamp: it caught ` +
      `${caught} of ${defectsTotal} seeded defects, and ${cleanRejected} of ` +
      `its ${rejections} rejections were of fine changes. A 95% approval ` +
      `rate was never evidence of safety; it was evidence of throughput.`,
  };
}

/**
 * Reactive: the rate limit set at 10x historic peak. Real overloads hurt
 * at 3-4x peak, so the limit never fires; a guardrail that cannot fire
 * cannot false-positive, and that is not a virtue.
 * @param {ReturnType<typeof simulateStorm>} storm
 */
function gradeRateLimit(storm) {
  const stormTicks = storm.ticks.filter((k) => k.inStorm);
  const throttled = stormTicks.filter((k) => k.limitFired).length;
  const peakLoad = Math.max(...stormTicks.map((k) => k.load));
  const ratio = Math.round((peakLoad / storm.historicPeak) * 10) / 10;
  const excess = sum(stormTicks, (k) => k.load - storm.historicPeak);
  const firstFire = firstTickWhere(storm.ticks, (k) => k.limitFired);
  const firings = episodes(storm.ticks, (k) => k.limitFired);
  // Ticks the error rate stayed elevated because nothing throttled the
  // storm: the storm itself plus the drain it left behind.
  const elevated = storm.ticks.filter(
    (k) => k.t >= storm.stormStart && k.errorRate > MONITOR_BAR,
  ).length;
  return {
    id: 'rate-limit',
    axes: {
      coverage: round2(safeRate(throttled, stormTicks.length)),
      latency: latencyFrom(firstFire, storm.stormStart),
      blastRadius: excess, // requests above peak served unthrottled
      falsePositiveRate: round2(safeRate(0, firings.length)),
      recoveryCost: elevated, // elevated-error ticks nothing prevented
    },
    verdict:
      `A rate limit set at ten times peak is decorative. This storm peaked ` +
      `at ${ratio}x the historic peak (real overloads hurt long before ` +
      `10x), so the limit never fired and never could have: ${excess} ` +
      `requests above peak went through unthrottled.`,
  };
}

/**
 * Reactive, with the planted structural flaw: the breaker's health probe
 * is served by the service it breaks against, so it fails exactly during
 * the storm and trips only after the weather clears.
 * @param {ReturnType<typeof simulateStorm>} storm
 */
function gradeCircuitBreaker(storm) {
  const stormTicks = storm.ticks.filter((k) => k.inStorm);
  const openDuringStorm = stormTicks.filter((k) => k.breakerOpen).length;
  const firstFire = firstTickWhere(storm.ticks, (k) => k.breakerOpen);
  const firings = episodes(storm.ticks, (k) => k.breakerOpen);
  const spurious = firings.filter((t) => !storm.ticks[t].inStorm).length;
  const openAfter = storm.ticks.filter((k) => !k.inStorm && k.breakerOpen).length;
  return {
    id: 'circuit-breaker',
    axes: {
      coverage: round2(safeRate(openDuringStorm, stormTicks.length)),
      latency: latencyFrom(firstFire, storm.stormStart),
      blastRadius: stormTicks.length - openDuringStorm, // unisolated storm ticks
      falsePositiveRate: round2(safeRate(spurious, firings.length)),
      recoveryCost: 1 + openAfter, // a manual reset, plus the calm ticks it blocked
    },
    verdict:
      `Its health probe is served by the very service it breaks against, ` +
      `so when the service went down the reading went with it: the breaker ` +
      `held closed through all ${stormTicks.length} storm ticks, then ` +
      `tripped at tick ${firstFire} on the backlog draining after the storm ` +
      `had passed. A circuit breaker that depends on the thing it guards is ` +
      `not a circuit breaker.`,
  };
}

/**
 * Dynamic: the error-budget drift monitor. Slower than a single-event
 * gate by design, immune to the breaker's shared fate, and paying the
 * dynamic class's standing tax: the spurious page.
 * @param {ReturnType<typeof simulateStorm>} storm
 */
function gradeDriftMonitor(storm) {
  const stormTicks = storm.ticks.filter((k) => k.inStorm);
  const flagged = stormTicks.filter((k) => k.monitorFired).length;
  const firstStormFire = firstTickWhere(storm.ticks, (k) => k.inStorm && k.monitorFired);
  const firings = episodes(storm.ticks, (k) => k.monitorFired);
  const spurious = firings.filter((t) => t < storm.stormStart).length;
  const latency = latencyFrom(firstStormFire, storm.stormStart);
  return {
    id: 'drift-monitor',
    axes: {
      coverage: round2(safeRate(flagged, stormTicks.length)),
      latency,
      blastRadius: stormTicks.length - flagged, // unflagged drift ticks
      falsePositiveRate: round2(safeRate(spurious, firings.length)),
      recoveryCost: spurious, // pages that had to be triaged to nothing
    },
    verdict:
      `It paged ${latency} ticks into the storm and stayed on it through ` +
      `the drain. Slow next to a single-event gate, but drift is a pattern, ` +
      `and it reads the metrics pipeline rather than the service, so it ` +
      `kept working while the breaker went blind. The grade to watch is the ` +
      `false-positive rate: it also paged on a benign deploy wobble, and ` +
      `every spurious page trains the operator who must answer the real one.`,
  };
}

/**
 * Reflective: the quarterly game-day drill. Its failure class is not
 * storm traffic; it is the other rows of this table. So it is graded
 * against the grades: how many guardrails failed live that a rehearsal
 * would have caught first?
 * @param {{ id: string, axes: Axes, verdict: string }[]} graded
 */
function gradeGamedayProbe(graded) {
  const broken = graded.filter((g) => g.axes.coverage < 0.5);
  const catchable = broken.filter((g) => DRILL_CATCHABLE.includes(g.id));
  return {
    id: 'gameday-probe',
    axes: {
      coverage: round2(safeRate(catchable.length, broken.length)),
      latency: null, // it never ran during this trace; the drill is overdue
      blastRadius: broken.length, // guardrails that failed live, undetected
      falsePositiveRate: 0, // a drill that does not run cannot cry wolf
      recoveryCost: 1, // schedule the drill: one afternoon
    },
    verdict:
      `Graded against live traffic, a quarterly drill scores zero, which ` +
      `is the wrong question: its failure class is the other rows of this ` +
      `table. ${broken.length} guardrails here failed live, and ` +
      `${catchable.length} of them (the decorative limit and the blind ` +
      `breaker) would have failed a cheap rehearsal first. The last drill ` +
      `ran ${DRILL_AGE_DAYS} days ago. Without this row, the rest of the ` +
      `table decays silently.`,
  };
}

// ---- the grader ----------------------------------------------------------

/**
 * Grade the whole inventory against one seeded failure storm. Each row's
 * axes are measured from the recorded storm log, never asserted, and each
 * verdict argues the grade in the reader's terms. Same seed, same grades,
 * forever.
 * @param {number} seed
 * @returns {{ id: string, axes: Axes, verdict: string }[]}
 */
export function gradeStorm(seed) {
  const storm = simulateStorm(seed);
  const graded = [
    gradeSchemaGate(storm),
    gradeReviewGate(storm),
    gradeRateLimit(storm),
    gradeCircuitBreaker(storm),
    gradeDriftMonitor(storm),
  ];
  // The reflective row goes last: it is graded against the grades
  // themselves, because its failure class is broken guardrails.
  graded.push(gradeGamedayProbe(graded));
  return graded;
}
