// Signal physics — the field every runaway grows in.
//
// One discrete core drives Chapter 8's Signal Field and Chapter 9's retry
// storm: per-region signal that spreads, decays, and is reinforced by work,
// with an exploration floor. Three rates determine everything (handbook
// §2.8): how fast signal spreads, how fast it fades, and how strongly it is
// reinforced. The storm in runStorm is the same physics wearing a
// retry-policy skin — reinforcement without counter-force, run away.
//
// Pure and deterministic. Field functions take an injected mulberry32 rng;
// the storm re-simulates from its seed on every remedy, so a remedied run
// replays its past identically and tests can pin every tick.

import { mulberry32 } from './rng.js';

const EPS = 1e-9;

/**
 * @typedef {{ id: string, name: string, signal: number, quality: number }} FieldNode
 * @typedef {{ nodes: FieldNode[], tick: number, gain: number }} Field
 * @typedef {{ spread: number, decay: number, reinforce: number,
 *             explore: number, outsideRef: boolean }} FieldParams
 */

/** Default field physics. Labs freeze all but one or two of these per task. */
export const FIELD_DEFAULTS = {
  spread: 0.06, // fraction of a region's signal that leaks to its neighbors
  decay: 0.1, // fraction of all signal that fades each tick
  reinforce: 0.5, // signal deposited when work in a region holds up
  explore: 0.1, // floor: fraction of workers who wander instead of following signal
  outsideRef: true, // CI ground truth: severed, every claimed success reinforces
};

// Repo regions, in ring order. Signal spreads between neighbors.
const REGIONS = [
  'delivery/',
  'billing/',
  'docs/',
  'evals/',
  'transforms/',
  'console/',
  'auth/',
  'ingest/',
  'search/',
  'notify/',
  'reports/',
  'infra/',
  'migrations/',
  'sdk/',
  'pipelines/',
  'fixtures/',
];

const WORKERS_PER_TICK = 4; // agents selecting work each tick
const SIGNAL_CAP = 4; // receptor saturation: past this, brighter tells no one anything
const LOCK_IN_SHARE = 0.6; // one region holding this much of the field counts as locked

/**
 * Build a fresh signal field over a ring of repo regions.
 *
 * Each region starts with a little uneven heat (signal) and a hidden
 * ground truth (quality: how much real work actually lives there). The
 * field never reads quality directly — only work that survives the
 * outside reference turns quality into signal.
 *
 * @param {{ nodes?: number, seed: number }} opts
 * @returns {Field}
 */
export function makeField({ nodes = 12, seed }) {
  const rng = mulberry32(seed);
  const list = [];
  for (let i = 0; i < nodes; i++) {
    list.push({
      id: `n${i}`,
      name: REGIONS[i] ?? `region-${i}/`,
      signal: rng() * 0.25, // dim, uneven starting heat
      quality: rng(), // hidden ground truth in [0, 1)
    });
  }
  return { nodes: list, tick: 0, gain: 1 };
}

/**
 * Weighted pick: brighter regions draw more work. A tiny floor keeps a
 * fully dark field pickable (uniformly).
 * @param {FieldNode[]} nodes
 * @param {() => number} rng
 */
function pickBySignal(nodes, rng) {
  let total = 0;
  for (const n of nodes) total += n.signal + 1e-6;
  let r = rng() * total;
  for (const n of nodes) {
    r -= n.signal + 1e-6;
    if (r <= 0) return n;
  }
  return nodes[nodes.length - 1];
}

/**
 * Loop gain, measured on the field as it stands: the reinforcement the
 * tick's physics are expected to pour in, over what decay drains. This is
 * the control parameter of §2.8 — sustained above 1, total signal grows
 * without bound (divergence); below 1, perturbations die.
 * @param {FieldNode[]} nodes
 * @param {FieldParams} p
 */
function expectedGain(nodes, p) {
  const count = nodes.length;
  let weightSum = 0;
  for (const n of nodes) weightSum += n.signal + 1e-6;
  let inflow = 0;
  let total = 0;
  for (const n of nodes) {
    const pickProb = p.explore / count + (1 - p.explore) * ((n.signal + 1e-6) / weightSum);
    const successProb = p.outsideRef ? n.quality : 1;
    inflow += WORKERS_PER_TICK * pickProb * successProb * p.reinforce * n.signal;
    total += n.signal;
  }
  return inflow / Math.max(p.decay * total, EPS);
}

/**
 * Advance the field one tick. Pure: returns a new field, never mutates.
 *
 * The three rates of §2.8 act in order: work reinforces signal where it
 * lands, signal spreads to neighboring regions, then everything decays.
 * `gain` is the field's loop gain this tick (see expectedGain) — hold it
 * above 1 and the field diverges. That is the shape of every runaway you
 * will see.
 *
 * @param {Field} field
 * @param {Partial<FieldParams>} [params] merged over FIELD_DEFAULTS
 * @param {() => number} rng from mulberry32
 * @returns {Field}
 */
export function stepField(field, params, rng) {
  const p = { ...FIELD_DEFAULTS, ...params };
  const gain = expectedGain(field.nodes, p);
  const nodes = field.nodes.map((n) => ({ ...n }));
  const count = nodes.length;

  // 1) Work selection + reinforcement. Each worker follows the signal,
  //    except the exploration-floor fraction, which wanders uniformly.
  //    With the outside reference intact, only work that holds up
  //    (probability = the region's hidden quality) deposits signal.
  //    Severed, every claimed success deposits — the field starts
  //    reinforcing its own reports. A deposit scales with the trail
  //    already there: signal strengthens with use, which is why an early
  //    lead can compound into lock-in.
  for (let w = 0; w < WORKERS_PER_TICK; w++) {
    const node = rng() < p.explore ? nodes[Math.floor(rng() * count)] : pickBySignal(nodes, rng);
    const heldUp = p.outsideRef ? rng() < node.quality : true;
    if (heldUp) node.signal += p.reinforce * node.signal;
  }

  // 2) Spread. Each region leaks a fraction of its signal to its two
  //    ring neighbors. Spread conserves signal; it only moves it.
  const leak = nodes.map((n) => n.signal * p.spread);
  for (let i = 0; i < count; i++) {
    nodes[i].signal -= leak[i];
    nodes[i].signal += leak[(i + 1) % count] / 2 + leak[(i + count - 1) % count] / 2;
  }

  // 3) Decay, then saturation. Decay is the only way signal leaves the
  //    field. The cap is saturation: with decay near zero nothing fades,
  //    every region drifts up to the cap, and the field goes uniformly
  //    bright — which is to say, useless.
  for (const n of nodes) {
    n.signal = Math.min(SIGNAL_CAP, n.signal * (1 - p.decay));
  }

  return { nodes, tick: field.tick + 1, gain };
}

/**
 * Read the field in the framework's vocabulary.
 *
 * - variety: normalized entropy of where the signal sits. 1 = spread
 *   evenly, 0 = all heat on one region.
 * - signalToNoise: how far the brightest region stands above the field's
 *   background, (max − mean) / mean. Saturation drives it toward zero —
 *   the field stops telling anyone where to work.
 * - lockIn: one region holds more than 60% of all signal.
 * - gain: the field's loop gain (expected reinforcement inflow over decay
 *   outflow); sustained above 1, the field is diverging.
 *
 * @param {Field} field
 * @returns {{ variety: number, signalToNoise: number, lockIn: boolean, gain: number }}
 */
export function fieldMetrics(field) {
  const signals = field.nodes.map((n) => n.signal);
  const total = signals.reduce((a, b) => a + b, 0);
  const n = signals.length;
  const gain = field.gain ?? 1;
  if (total < EPS) {
    // A dark field: nothing stands out, nothing is locked.
    return { variety: 1, signalToNoise: 0, lockIn: false, gain };
  }
  const shares = signals.map((s) => s / total);
  let entropy = 0;
  for (const p of shares) if (p > 0) entropy -= p * Math.log(p);
  const variety = n > 1 ? entropy / Math.log(n) : 0;
  const mean = total / n;
  const max = Math.max(...signals);
  return {
    variety,
    signalToNoise: (max - mean) / (mean + EPS),
    lockIn: Math.max(...shares) > LOCK_IN_SHARE,
    gain,
  };
}

// ---------------------------------------------------------------------------
// The storm: the same physics wearing a retry-policy skin.
// ---------------------------------------------------------------------------

/**
 * @typedef {{ maxRetries: number, backoffMs: number, jitter: boolean,
 *             breaker: boolean }} RetryPolicy
 * @typedef {{ load: number[], success: number[], queue: number[],
 *             amplification: number[], selfReport: number[],
 *             groundTruth: number[] }} StormSeries
 * @typedef {{ series: StormSeries, phase: 'stable'|'critical'|'runaway',
 *             events: string[], config: object,
 *             remedies: { at: number, remedy: string }[] }} StormState
 */

/** Default retry policy. Note that the default is already aggressive. */
export const STORM_POLICY_DEFAULTS = {
  maxRetries: 5,
  backoffMs: 100,
  jitter: false,
  breaker: false,
};

/** The remedy palette. Every one is terrain-shaped except the last. */
export const REMEDIES = [
  'variety',
  'decay',
  'outside-reference',
  'tighten-trust',
  'evacuate',
  'restart-agent',
];

// The service the retries hammer.
const CAPACITY = 50; // attempts the service can clear per tick
const BASE_ARRIVALS = 30; // steady fresh demand per tick
const SPIKE_ARRIVALS = 120; // extra demand during the spike
const SPIKE_TICKS = 3; // how long the spike lasts
const QUEUE_CEILING = 300; // finite client population: max retries in flight
const MAX_SUCCESS = 0.98; // even a calm service drops a little
const MS_PER_TICK = 100; // converts policy.backoffMs into ticks
const BREAKER_TRIP = 0.5; // breaker opens below this success rate
const BREAKER_OPEN_TICKS = 5; // and sheds retries this long
const JITTER_DUP_RELIEF = 0.5; // jittered callers pile on half as hard (Ⓦ)
const RETRY_TTL_DECAY = 0.5; // 'decay' remedy: queued retries expire at this rate
const EVACUATE_SHED_TICKS = 3; // 'evacuate' remedy: ticks of shed traffic
const REMEDY_WINDOW = 40; // extra ticks simulated after each remedy

/** Add to a retry bucket, growing the schedule as needed. */
function addToBucket(buckets, idx, amount) {
  while (buckets.length <= idx) buckets.push(0);
  buckets[idx] += amount;
}

/** Sum every retry scheduled at or after `from`. */
function sumFrom(buckets, from) {
  let sum = 0;
  for (let i = from; i < buckets.length; i++) sum += buckets[i];
  return sum;
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

/**
 * Mutate the live simulation when a remedy fires. Every remedy reshapes
 * the terrain — except 'restart-agent', which touches only the agent and
 * therefore cannot work.
 */
function applyRemedyToSim(sim, remedy, buckets, t, events) {
  switch (remedy) {
    case 'variety':
      // Desynchronize the herd: jitter the retries and widen the backoff.
      sim.jitter = true;
      sim.backoffMs = Math.max(sim.backoffMs * 4, 400);
      events.push(`tick ${t}: remedy — inject variety (jitter, wider backoff)`);
      break;
    case 'decay':
      // Stale retries expire instead of returning forever.
      sim.retryDecay = RETRY_TTL_DECAY;
      events.push(`tick ${t}: remedy — add decay (queued retries expire)`);
      break;
    case 'outside-reference':
      // Restore ground truth. Informed callers stop double-firing into a
      // dead service, and self-report re-couples to reality.
      sim.outsideRef = true;
      sim.dupEnabled = false;
      events.push(
        `tick ${t}: remedy — outside reference restored; ` +
          `self-report re-coupled to ground truth`,
      );
      break;
    case 'tighten-trust':
      // No blind re-tries: one attempt per request.
      sim.maxRetries = 1;
      events.push(`tick ${t}: remedy — tighten trust (no blind re-tries)`);
      break;
    case 'evacuate':
      // Drain everything and shed traffic while the system restarts cold.
      for (let i = t; i < buckets.length; i++) buckets[i] = 0;
      sim.shedUntil = t + EVACUATE_SHED_TICKS - 1;
      events.push(`tick ${t}: remedy — evacuate (queue drained, traffic shed)`);
      break;
    case 'restart-agent':
      // The one that cannot work. The restarted agent drops its in-flight
      // work, so load dips for a single tick — but the demand behind that
      // work is untouched and comes straight back.
      addToBucket(buckets, t + 1, buckets[t] ?? 0);
      buckets[t] = 0;
      events.push(
        `tick ${t}: agent restarted — load dips one tick; ` +
          `the terrain is untouched and the storm resumes`,
      );
      break;
    /* v8 ignore next 2 -- applyRemedy validates before scheduling */
    default:
      throw new Error(`unknown remedy: ${remedy}`);
  }
}

/**
 * The full storm simulation, replayed from tick 0 every time. Remedies
 * fire at their scheduled tick; everything before them replays exactly.
 * @param {{ policy: RetryPolicy, spikeAt: number, ticks: number,
 *           seed: number, outsideRef: boolean,
 *           remedies: { at: number, remedy: string }[] }} config
 * @returns {StormState}
 */
function buildStorm(config) {
  const { policy, spikeAt, ticks, seed, outsideRef, remedies } = config;
  const rng = mulberry32(seed);
  const events = [];
  const series = {
    load: [],
    success: [],
    queue: [],
    amplification: [],
    selfReport: [],
    groundTruth: [],
  };
  // Live knobs. Remedies mutate these mid-run; the policy itself is data.
  const sim = {
    maxRetries: policy.maxRetries,
    backoffMs: policy.backoffMs,
    jitter: policy.jitter,
    breaker: policy.breaker,
    outsideRef,
    dupEnabled: true, // overloaded callers double-fire on timeout
    retryDecay: 0, // no TTL until the 'decay' remedy adds one
    shedUntil: -1, // 'evacuate' sheds arrivals through this tick
  };
  if (!outsideRef) {
    events.push('outside reference severed: the system grades itself on its own activity');
  }

  const buckets = []; // buckets[t] = retries scheduled to come due at tick t
  let breakerOpenLeft = 0;
  let selfReport = 0.7; // the severed system's starting confidence
  let crossed = false;

  for (let t = 0; t < ticks; t++) {
    // Remedies fire at the top of their tick.
    for (const r of remedies) {
      if (r.at === t) applyRemedyToSim(sim, r.remedy, buckets, t, events);
    }

    // 1) Demand: steady arrivals, plus the spike window.
    const inSpike = t >= spikeAt && t < spikeAt + SPIKE_TICKS;
    if (t === spikeAt) events.push(`tick ${t}: load spike begins`);
    if (t === spikeAt + SPIKE_TICKS) events.push(`tick ${t}: load spike ends`);
    const shed = t <= sim.shedUntil;
    const arrivals = shed ? 0 : BASE_ARRIVALS + (inSpike ? SPIKE_ARRIVALS : 0);

    // 2) Retries scheduled earlier come due (after any TTL expiry).
    if (sim.retryDecay > 0) {
      for (let i = t; i < buckets.length; i++) buckets[i] *= 1 - sim.retryDecay;
    }
    const due = buckets[t] ?? 0;
    const load = arrivals + due;

    // 3) The service clears what it can; success collapses under overload.
    const successRate = load < EPS ? 1 : Math.min(MAX_SUCCESS, CAPACITY / load);
    const successes = load * successRate;
    const failures = load - successes;

    // 4) Circuit breaker: below the trip rate it opens and sheds retries.
    let blocked = false;
    if (sim.breaker) {
      if (breakerOpenLeft > 0) {
        blocked = true;
        breakerOpenLeft -= 1;
        if (breakerOpenLeft === 0) events.push(`tick ${t}: circuit breaker closed`);
      } else if (successRate < BREAKER_TRIP) {
        breakerOpenLeft = BREAKER_OPEN_TICKS;
        blocked = true;
        events.push(`tick ${t}: circuit breaker opened`);
      }
    }

    // 5) Failures spawn retries. Each failed attempt with budget left
    //    retries once; under overload, synchronized timeouts make callers
    //    double-fire (Ⓦ modeling choice: duplication scales with how far
    //    past capacity the load is, and jitter halves the pile-on).
    const retain = sim.maxRetries > 1 ? 1 - 1 / sim.maxRetries : 0;
    const overload = Math.max(0, load / CAPACITY - 1);
    const dup = sim.dupEnabled ? Math.min(1, overload) * (sim.jitter ? JITTER_DUP_RELIEF : 1) : 0;
    let spawn = blocked ? 0 : failures * retain * (1 + dup);
    // Finite client population: only so many retries can be in flight.
    spawn = Math.min(spawn, Math.max(0, QUEUE_CEILING - sumFrom(buckets, t + 1)));

    // 6) Schedule them after the backoff; jitter spreads the wave.
    const delay = Math.max(1, Math.round(sim.backoffMs / MS_PER_TICK));
    if (sim.jitter) {
      const span = delay + 1; // lands anywhere in [delay, 2 * delay]
      for (let d = delay; d <= 2 * delay; d++) {
        addToBucket(buckets, t + d, spawn / span);
      }
    } else {
      addToBucket(buckets, t + delay, spawn);
    }

    // 7) Readouts. Amplification is retry pressure: retries due this tick
    //    over capacity. Above 1.0, retries alone exceed what the service
    //    can clear — the storm no longer needs the spike.
    const amplification = due / CAPACITY;
    if (!crossed && amplification >= 1) {
      crossed = true;
      events.push(
        `tick ${t}: amplification crossed 1.0 — retries alone exceed ` +
          `capacity; the storm feeds itself`,
      );
    }

    // 8) Telemetry: ground truth vs the system's own report. Intact, the
    //    self-report tracks reality. Severed, the system grades itself on
    //    activity — retry pressure reads as progress, so confidence rises
    //    exactly while outcomes fall.
    const gtNoise = (rng() - 0.5) * 0.02;
    const srNoise = (rng() - 0.5) * 0.04;
    const groundTruth = clamp01(successRate + gtNoise);
    selfReport = sim.outsideRef
      ? clamp01(groundTruth + srNoise)
      : Math.min(0.99, selfReport + 0.012 * Math.min(amplification, 2));

    series.load.push(load);
    series.success.push(successes);
    series.queue.push(sumFrom(buckets, t + 1));
    series.amplification.push(amplification);
    series.selfReport.push(selfReport);
    series.groundTruth.push(groundTruth);
  }

  // Phase: where the run ended, with credit for where it has been.
  const finalAmp = series.amplification[ticks - 1] ?? 0;
  const peakAmp = Math.max(0, ...series.amplification);
  const phase = finalAmp >= 1 ? 'runaway' : peakAmp >= 0.7 ? 'critical' : 'stable';
  if (phase === 'runaway' && spikeAt + SPIKE_TICKS < ticks) {
    events.push('the storm outlived the spike: it is self-sustaining');
  }

  return {
    series,
    phase,
    events,
    config: { policy: { ...policy }, spikeAt, ticks, seed, outsideRef },
    remedies: remedies.map((r) => ({ ...r })),
  };
}

/**
 * Run the retry storm. The default policy is already aggressive (five
 * retries, 100 ms backoff, no jitter, no breaker): a three-tick demand
 * spike at `spikeAt` is enough to push amplification past 1.0, and the
 * storm sustains itself long after the spike ends.
 *
 * @param {{ policy?: Partial<RetryPolicy>, spikeAt?: number, ticks?: number,
 *           seed: number, outsideRef?: boolean }} opts
 * @returns {StormState}
 */
export function runStorm({ policy = {}, spikeAt = 10, ticks = 60, seed, outsideRef = true } = {}) {
  return buildStorm({
    policy: { ...STORM_POLICY_DEFAULTS, ...policy },
    spikeAt,
    ticks,
    seed,
    outsideRef,
    remedies: [],
  });
}

/**
 * Apply a remedy to a storm in progress and watch what follows. The run
 * is re-simulated from its seed with the remedy scheduled at the current
 * end, then extended 40 ticks: the past replays exactly, the future
 * diverges. Five remedies reshape the terrain and drain the storm;
 * 'restart-agent' dips load for one tick and changes nothing, because the
 * problem was never in the agent.
 *
 * @param {StormState} stormState
 * @param {'variety'|'decay'|'outside-reference'|'tighten-trust'|'evacuate'|'restart-agent'} remedy
 * @returns {StormState}
 */
export function applyRemedy(stormState, remedy) {
  if (!REMEDIES.includes(remedy)) {
    throw new Error(`unknown remedy: ${remedy}`);
  }
  const { config, remedies } = stormState;
  return buildStorm({
    ...config,
    policy: { ...config.policy },
    ticks: config.ticks + REMEDY_WINDOW,
    remedies: [...remedies, { at: config.ticks, remedy }],
  });
}
