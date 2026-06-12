// The composition lab — Chapter 15's finale, recorded. Mechanism register.
//
// One mapper-loop population, run twice on the same world (same regions,
// same hidden quality, same seed). Run one: every tick the mappers survey
// the repo, print their maps to stdout, and exit — fifty runs, zero shared
// signals, so the next tick starts blind. Run two: the same maps are
// persisted to the shared signal field, where verified findings reinforce
// and decay like any other signal. Compounding appears only in the second
// run, and the mappers are identical; the difference is the terrain.
//
// "Targeting" is the per-tick expected hit rate: the probability that a
// mapper's chosen region actually holds verified findings, given where the
// signal sends it. In the stdout run that probability never moves.

import { makeField, stepField, fieldMetrics } from '../field.js';
import { mulberry32 } from '../rng.js';
import { makeTrace, pushStep } from '../replay.js';

/** Field physics for the mapper population. Frozen for both runs. */
export const MAPPER_PARAMS = {
  spread: 0.05,
  decay: 0.05,
  reinforce: 0.6,
  explore: 0.1,
  outsideRef: true, // only findings that survive CI deposit signal
};

const TICKS = 60;
const NODES = 12;
const round3 = (x) => Math.round(x * 1000) / 1000;

/**
 * Expected hit rate of one mapper pick on this field: the chance its
 * signal-weighted choice lands on real findings (the region's hidden
 * quality), with the exploration floor included.
 * @param {import('../field.js').Field} field
 */
function targeting(field) {
  const { explore } = MAPPER_PARAMS;
  const n = field.nodes.length;
  let weightSum = 0;
  for (const node of field.nodes) weightSum += node.signal + 1e-6;
  let hit = 0;
  for (const node of field.nodes) {
    const pickProb = explore / n + (1 - explore) * ((node.signal + 1e-6) / weightSum);
    hit += pickProb * node.quality;
  }
  return hit;
}

/**
 * Run the mapper population for sixty ticks.
 *
 * With `persist: false` the field is stepped from the same pristine state
 * every tick — the work happens, the maps are printed, and nothing lands
 * in the terrain, so targeting is pinned at its blind baseline. With
 * `persist: true` each tick's verified findings stay in the field and the
 * next tick reads them.
 *
 * @param {number} seed
 * @param {{ persist: boolean, ticks?: number }} opts
 * @returns {{ perTick: number[], cumulative: number[],
 *   finalField: import('../field.js').Field,
 *   metrics: ReturnType<typeof fieldMetrics> }}
 *   perTick is the expected hit rate each tick; cumulative is its running
 *   sum (expected verified findings banked, in mapper-pick units).
 */
export function runMapperPopulation(seed, { persist, ticks = TICKS }) {
  const initial = makeField({ nodes: NODES, seed });
  const rng = mulberry32(seed * 31 + 1);
  let field = initial;
  const perTick = [];
  const cumulative = [];
  let cum = 0;
  for (let t = 0; t < ticks; t++) {
    perTick.push(round3(targeting(field)));
    cum += targeting(field);
    cumulative.push(round3(cum));
    const stepped = stepField(field, MAPPER_PARAMS, rng);
    // The fork: persisted maps stay in the field; stdout maps die with
    // the process, so the next tick starts from the pristine field.
    field = persist ? stepped : initial;
  }
  const final = persist ? field : initial;
  return { perTick, cumulative, finalField: final, metrics: fieldMetrics(final) };
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const pct = (x) => Math.round(x * 100);

/**
 * The recorded comparison: the same population, run twice, compounding
 * only where the maps persist. Step data carries both runs' series.
 * @param {number} seed
 * @returns {import('../replay.js').Trace}
 */
export function compositionRun(seed) {
  const stdout = runMapperPopulation(seed, { persist: false });
  const persisted = runMapperPopulation(seed, { persist: true });
  const baseline = stdout.perTick[0];
  const lastQuarter = mean(persisted.perTick.slice(-15));
  const finalGap = round3(persisted.cumulative.at(-1) - stdout.cumulative.at(-1));
  const hot = [...persisted.finalField.nodes].sort((a, b) => b.signal - a.signal)[0];

  const trace = makeTrace(seed);
  pushStep(trace, {
    label: 'the population',
    caption:
      'Twelve repo regions, each hiding some true amount of real findings ' +
      '(dead imports, stale fixtures, cold paths), and a population of ' +
      'mappers that survey four regions a tick. CI is the outside ' +
      'reference: only findings that hold up count. Both runs start from ' +
      'exactly this field.',
    data: {
      params: MAPPER_PARAMS,
      regions: stdout.finalField.nodes.map((n) => ({ name: n.name, signal: round3(n.signal) })),
    },
  });
  pushStep(trace, {
    label: 'run one — maps die on stdout',
    caption:
      'Sixty ticks of honest work, printed and lost. Watch the targeting ' +
      `line: every tick, ${pct(baseline)}% of mapper picks land on real ` +
      'findings, and sixty ticks later it is still exactly ' +
      `${pct(baseline)}% — the next mapper starts blind because the last ` +
      "one's map went to a terminal scrollback. Fifty loops, zero shared " +
      'signals.',
    data: { perTick: stdout.perTick, cumulative: stdout.cumulative, baseline: round3(baseline) },
  });
  pushStep(trace, {
    label: 'run two — maps persist to the field',
    caption:
      'Same mappers, same world, same seed; the only change is where the ' +
      'maps go. Verified findings now deposit signal, and the curve bends: ' +
      `targeting climbs from ${pct(baseline)}% to about ` +
      `${pct(lastQuarter)}% as the field concentrates on ${hot.name} and ` +
      'its real hot spots. Each tick starts where the last one finished.',
    data: {
      perTick: persisted.perTick,
      cumulative: persisted.cumulative,
      metrics: persisted.metrics,
    },
  });
  pushStep(trace, {
    label: 'the payoff',
    caption:
      `Banked findings after sixty ticks: ${persisted.cumulative.at(-1)} ` +
      `against ${stdout.cumulative.at(-1)} — a gap of ${finalGap}, and it ` +
      'widens every quarter of the run. The mappers never got smarter. ' +
      'The terrain got informative, and compounding lives there, not in ' +
      'the agents.',
    data: {
      gap: finalGap,
      gapAtQuarters: [15, 30, 45, 60].map((t) =>
        round3(persisted.cumulative[t - 1] - stdout.cumulative[t - 1]),
      ),
    },
  });
  return trace;
}
