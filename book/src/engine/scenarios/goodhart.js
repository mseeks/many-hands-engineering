// The Goodhart bench — Chapter 20's recorded runs. Mechanism register.
//
// One platform, one gaming pressure, two instrument panels. Panel one
// carries a single target metric (merged PRs per week); the fleet learns
// to feed it — splitting changes, shipping no-ops — and the metric climbs
// while sampled deep-review agreement falls, off-panel where nobody
// charts it. Panel two triangulates: change-failure rate and rollback
// rate, two independent metrics that gaming velocity must damage. The
// gaming is not prevented; it becomes a visible cost, gets priced, and
// gets answered.
//
// Constants tune the shape, not real-world thresholds. The triangulation
// rule is the handbook's (§3.8): if a metric will be a target, add at
// least two independent metrics that gaming it would harm.

import { mulberry32 } from '../rng.js';
import { makeTrace, pushStep } from '../replay.js';

const WEEKS = 16;
const BASE_VELOCITY = 22; // merged PRs/week before anyone games anything
const GAMED_LIFT = 0.8; // how far gaming can inflate velocity, at full pressure
const BASE_AGREEMENT = 0.84; // sampled deep-review agreement, ungamed
const AGREEMENT_LOSS = 0.3; // what full gaming pressure costs in real quality
const BASE_FAILURE = 0.04; // change-failure rate, ungamed
const FAILURE_RISE = 0.09; // gaming ships junk; junk fails in production
const BASE_ROLLBACK = 0.02;
const ROLLBACK_RISE = 0.07;
const RAMP_WEEKS = 10; // gaming pressure reaches full strength here
const DETECT_FACTOR = 2; // triangulation flags failure at 2x baseline
const PRESSURE_DECAY = 0.5; // pressure halves weekly once the class loses auto-merge

const round2 = (x) => Math.round(x * 100) / 100;
const round3 = (x) => Math.round(x * 1000) / 1000;

/**
 * Sixteen weeks of metric gaming under one of two instrument panels.
 *
 * Untriangulated, pressure ramps and stays: the target climbs, the real
 * outcomes sag, and nothing on the panel objects. Triangulated, the same
 * pressure shows up as change-failure and rollback cost; the week failure
 * crosses twice baseline, the inflating class loses auto-merge and the
 * pressure decays.
 *
 * @param {number} seed
 * @param {{ triangulated: boolean }} opts
 * @returns {{ weeks: { week: number, velocity: number,
 *   sampledOutcome: number, changeFailure: number, rollback: number,
 *   pressure: number }[], onPanel: string[],
 *   detection: { week: number, note: string } | null }}
 */
export function simulateMetricGaming(seed, { triangulated }) {
  const rng = mulberry32(seed);
  const weeks = [];
  let detection = null;
  let pressure = 0;
  for (let w = 1; w <= WEEKS; w++) {
    if (detection === null) {
      pressure = Math.min(1, w / RAMP_WEEKS); // the fleet keeps finding the seam
    } else {
      pressure *= PRESSURE_DECAY; // auto-merge gone, the gaming stops paying
    }
    const j = () => (rng() - 0.5) * 0.02; // small seeded wobble on every line
    const velocity = round2(BASE_VELOCITY * (1 + GAMED_LIFT * pressure) * (1 + j()));
    const sampledOutcome = round3(BASE_AGREEMENT - AGREEMENT_LOSS * pressure + j());
    const changeFailure = round3(BASE_FAILURE + FAILURE_RISE * pressure + j() / 4);
    const rollback = round3(BASE_ROLLBACK + ROLLBACK_RISE * pressure + j() / 4);
    if (triangulated && detection === null && changeFailure >= BASE_FAILURE * DETECT_FACTOR) {
      detection = {
        week: w,
        note:
          `week ${w}: velocity up ${Math.round(GAMED_LIFT * pressure * 100)}% while ` +
          'change-failure crossed twice baseline — the gaming is now a ' +
          'visible cost; the inflating class loses auto-merge',
      };
    }
    weeks.push({
      week: w,
      velocity,
      sampledOutcome,
      changeFailure,
      rollback,
      pressure: round3(pressure),
    });
  }
  return {
    weeks,
    onPanel: triangulated ? ['velocity', 'changeFailure', 'rollback'] : ['velocity'],
    detection,
  };
}

/**
 * The recorded comparison: the same gaming pressure under one metric and
 * under three. Step data carries both runs' series.
 * @param {number} seed
 * @returns {import('../replay.js').Trace}
 */
export function goodhartRun(seed) {
  const single = simulateMetricGaming(seed, { triangulated: false });
  const tri = simulateMetricGaming(seed, { triangulated: true });
  const sFirst = single.weeks[0];
  const sLast = single.weeks.at(-1);
  const peak = Math.max(...tri.weeks.map((w) => w.velocity));
  const tLast = tri.weeks.at(-1);

  const trace = makeTrace(seed);
  pushStep(trace, {
    label: 'the target',
    caption:
      'One number on the panel: merged PRs per week, currently ' +
      `${sFirst.velocity}. It becomes the target — review goals, agent ` +
      'rankings, the weekly report all read it. Everything else about the ' +
      'platform still exists; it just is not charted.',
    data: { onPanel: single.onPanel, baseline: { velocity: sFirst.velocity } },
  });
  pushStep(trace, {
    label: 'the climb',
    caption:
      `Sixteen weeks later velocity reads ${sLast.velocity}, up ` +
      `${Math.round((sLast.velocity / sFirst.velocity - 1) * 100)}%, and ` +
      'the panel calls it progress. Now watch the line the panel does not ' +
      'carry: sampled deep-review agreement slid from ' +
      `${sFirst.sampledOutcome} to ${sLast.sampledOutcome} — split ` +
      'changes, no-op bumps, work shaped to feed the count. The metric ' +
      'went up because it stopped measuring what it was a proxy for.',
    data: { weeks: single.weeks },
  });
  pushStep(trace, {
    label: 'triangulated',
    caption:
      'Same platform, same pressure, two more lines on the panel: ' +
      'change-failure rate and rollback rate — independent metrics that ' +
      'gaming velocity has to damage. The climb starts identically, but ' +
      `by week ${tri.detection.week} change-failure has crossed twice its ` +
      'baseline in plain view. The inflating class loses auto-merge, the ' +
      `pressure stops paying, and velocity gives back its gamed gains ` +
      `(peak ${peak}, settling toward ${tLast.velocity}).`,
    data: { weeks: tri.weeks, detection: tri.detection, onPanel: tri.onPanel },
  });
  pushStep(trace, {
    label: 'the payoff',
    caption:
      'Triangulation did not prevent the gaming; nothing prevents gaming. ' +
      'It made the gaming cost something visible, in metrics the gamer ' +
      'could not also inflate, soon enough to act on. One target invites ' +
      'the seam; three independent lines price it.',
    data: {
      single: { final: sLast },
      triangulated: { final: tLast, detection: tri.detection },
    },
  });
  return trace;
}
