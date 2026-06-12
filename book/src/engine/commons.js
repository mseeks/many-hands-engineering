// The commons engine. Every shared substrate in a many-hands platform is a
// commons: a resource many actors draw from and deposit into, where over-use
// degrades the resource for all. Ostrom's eight design principles are terrain
// here, not switches on agents: each one shapes the weekly dynamics, and each
// one missing leaves a different fingerprint on the trace. The fingerprint
// drill (Ch 7) runs on prepared traces from this module; game day (Ch 12)
// runs the forced-removal experiments.

import { mulberry32, randInt } from './rng.js';
import { makeTrace, pushStep } from './replay.js';

/** Clamp to the unit interval. */
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** Round to 4 decimals so traces are stable to pin and easy to read. */
const r4 = (x) => Math.round(x * 1e4) / 1e4;

/**
 * All eight principles present: a governed commons.
 * @returns {{ boundaries: boolean, congruence: boolean, monitoring: boolean,
 *   sanctions: boolean, collectiveChoice: boolean, conflict: boolean,
 *   rights: boolean, nested: boolean }}
 */
export function defaultPrinciples() {
  return {
    boundaries: true,
    congruence: true,
    monitoring: true,
    sanctions: true,
    collectiveChoice: true,
    conflict: true,
    rights: true,
    nested: true,
  };
}

/** Display names for the eight principles, in Ostrom's terms. */
export const PRINCIPLE_LABELS = {
  boundaries: 'Clear boundaries',
  congruence: 'Congruence',
  collectiveChoice: 'Collective choice',
  monitoring: 'Monitoring',
  sanctions: 'Graduated sanctions',
  conflict: 'Low-cost conflict resolution',
  rights: 'Rights to organize',
  nested: 'Nested enterprises',
};

/**
 * Run a shared commons forward, week by week.
 *
 * The state is three lines a steward would actually watch:
 *   quality — average usefulness of what the field holds (0..1)
 *   noise   — fraction of the field that is junk (0..1)
 *   cruft   — dead weight the watchers can see (items)
 *
 * Each missing principle distorts the dynamics in its own recognizable way.
 * The traces this produces are the raw material for the fingerprint drill.
 *
 * @param {object} opts
 * @param {object} opts.principles partial map of the eight principle booleans;
 *   anything omitted defaults to present
 * @param {number} [opts.weeks=30]
 * @param {number} [opts.seed=1]
 * @returns {{ series: { quality: number[], noise: number[], cruft: number[] },
 *   events: string[] }}
 */
export function runCommons({ principles, weeks = 30, seed = 1 }) {
  const rng = mulberry32(seed);
  const p = { ...defaultPrinciples(), ...principles };

  let quality = 0.7; // usefulness of what the field holds (0..1)
  let noise = 0.04; // fraction of the field that is junk (0..1)
  let cruft = 2; // dead weight the watchers can see (items)
  let hiddenRot = 0; // rot accruing where nobody looks (monitoring off)
  let rotFound = false;

  const series = { quality: [], noise: [], cruft: [] };
  const events = [];

  for (let week = 1; week <= weeks; week++) {
    // 1) Deposits land. Clear boundaries mean junk arrives signed, so most
    //    of it is filtered at the door. Without them, anonymous batches
    //    walk straight in.
    let junkIn = 0.01 + rng() * 0.01;
    if (p.boundaries) {
      junkIn *= 0.25;
    } else {
      junkIn += 0.05 + rng() * 0.03;
      if (rng() < 0.4) {
        events.push(
          `week ${week}: an unattributable batch lands; no identity to ask, no stated interest to check`,
        );
      }
    }
    // One global rulebook misfits the edges, where most deposits happen.
    if (!p.nested) junkIn += 0.005;
    noise = clamp01(noise + junkIn);

    // 2) Signals decay. Congruence means the rules fit the resource:
    //    high-frequency signals fade fast. Mis-tuned, almost nothing fades,
    //    and the field silts up with stale signal.
    noise *= 1 - (p.congruence ? 0.3 : 0.02);
    if (!p.congruence) {
      if (rng() < 0.25) {
        events.push(`week ${week}: a week-old build status still outranks this morning's failure`);
      }
      if (rng() < 0.15) {
        // The other half of congruence: high-consequence signals need
        // stronger evidence. Mis-tuned, weak datapoints clear the bar.
        quality -= 0.04;
        events.push(`week ${week}: a high-consequence signal cleared on one weak datapoint`);
      }
    }

    // 3) Rot accrues; a gc loop eats what it can see. Monitoring decides
    //    whether rot is visible at all: watchers accountable to the field's
    //    users surface it as cruft. Without them it piles up where nobody
    //    looks, and the first warning is the failure itself.
    const rotIn = 0.5 + rng() * 0.5;
    if (p.monitoring) cruft += rotIn;
    else hiddenRot += rotIn + 0.8;
    if (!p.collectiveChoice) {
      // Rules the affected cannot change get routed around. Workarounds are
      // cruft the gc loop cannot delete: they are load-bearing.
      cruft += 2;
      if (rng() < 0.3) {
        events.push(
          `week ${week}: another workaround committed; the rule it routes around has not changed in ${week} weeks`,
        );
      }
    }
    cruft = Math.max(0, cruft - 1.2); // the gc loop, eating what it can see
    if (!p.monitoring && !rotFound && hiddenRot > 24) {
      // The failure that finally surfaces it: weeks of rot become visible
      // at once, and quality cliffs.
      rotFound = true;
      cruft += hiddenRot;
      hiddenRot = 0;
      quality -= 0.3;
      events.push(
        `week ${week}: a deploy fails on rot nobody had seen; the first warning is the failure itself`,
      );
    }

    // 4) Named pathologies fire on their own cadence.
    if (!p.sanctions && week % 4 === 1) {
      // Sanctions that never graduate: the same emitter re-offends on a
      // schedule, and the eighth warning reads exactly like the first.
      quality -= 0.08;
      events.push(
        `week ${week}: mapper-12 floods the field again; first-offense warning issued, again`,
      );
    }
    if (!p.conflict) {
      // Costly conflict goes underground: two factions overwrite each
      // other's conventions in silence instead of resolving once.
      quality += week % 2 === 0 ? -0.05 : 0.03;
      if (rng() < 0.3) {
        events.push(
          `week ${week}: the retry convention flipped overnight; no thread, no decision, just churn`,
        );
      }
    }
    if (!p.rights && week % 6 === 3) {
      // Override every local call and the local knowledge that made the
      // call good stops being offered.
      quality -= 0.06;
      cruft += 1; // the local fix returns as an unratified copy-paste
      events.push(
        `week ${week}: a central override replaced the local rule; the local fix is back, unratified`,
      );
    }

    // 5) Quality settles toward what the field can support. A clean, quiet
    //    commons supports about 0.85; noise and visible cruft drag the
    //    ceiling down.
    const ceiling = 0.85 - 0.6 * noise - 0.004 * cruft - (p.nested ? 0 : 0.06);
    quality = clamp01(quality + (ceiling - quality) * 0.2);

    series.quality.push(r4(quality));
    series.noise.push(r4(noise));
    series.cruft.push(r4(cruft));
  }

  return { series, events };
}

// Six prepared degradation traces, one principle absent in each. The tells
// are reader-facing observations, written so they never name the principle:
// the drill's whole point is that the reader infers it from the fingerprint.
const FINGERPRINT_SPECS = [
  {
    id: 'unsigned-flood',
    missingPrinciple: 'boundaries',
    seed: 101,
    tells: [
      'The noise line climbs from the first week and never comes back down.',
      'The junk arrives signed by nobody: no identity to ask, no stated interest to check.',
      'Quality sags in proportion to the flood, with no steps and no cliff.',
    ],
  },
  {
    id: 'repeat-offender',
    missingPrinciple: 'sanctions',
    seed: 102,
    tells: [
      'Every incident in the log names the same emitter.',
      'The eighth warning reads exactly like the first; the penalty never escalates.',
      'Quality falls in evenly spaced steps and partly recovers between them.',
    ],
  },
  {
    id: 'silent-rot',
    missingPrinciple: 'monitoring',
    seed: 103,
    tells: [
      'Every line looks healthy for over a dozen weeks, and the event log stays empty.',
      'The first warning is the failure itself.',
      'The cruft that appears at the cliff did not arrive overnight; it had been accruing where nobody looked.',
    ],
  },
  {
    id: 'nothing-fades',
    missingPrinciple: 'congruence',
    seed: 104,
    tells: [
      'The noise line climbs slowly and is still climbing at week 30; nothing fades at the rate it should.',
      "A week-old build status still outranks this morning's failure.",
      'Now and then a high-consequence call clears on one weak datapoint.',
    ],
  },
  {
    id: 'overnight-flips',
    missingPrinciple: 'conflict',
    seed: 105,
    tells: [
      'Quality saws up and down on a one-week period; the field churns without progressing.',
      'Conventions flip overnight with no thread and no decision record.',
    ],
  },
  {
    id: 'workaround-pileup',
    missingPrinciple: 'collectiveChoice',
    seed: 106,
    tells: [
      'The cruft line climbs the whole run while the rulebook never changes.',
      'The log fills with workarounds; the rules they route around outlive every complaint.',
      'Quality sags slowly, with no single dramatic week.',
    ],
  },
];

/**
 * Six deterministic prepared traces for the reverse-inference drill (Ch 7).
 * No free toggling: governance is not a switch. The drill shows one of these
 * traces and the reader names the missing principle. Each trace is a real
 * runCommons run with exactly one principle absent.
 * @returns {Array<{ id: string, missingPrinciple: string,
 *   series: { quality: number[], noise: number[], cruft: number[] },
 *   tells: string[] }>}
 */
export function fingerprintScenarios() {
  return FINGERPRINT_SPECS.map(({ id, missingPrinciple, seed, tells }) => {
    const { series } = runCommons({
      principles: { [missingPrinciple]: false },
      weeks: 30,
      seed,
    });
    return { id, missingPrinciple, series, tells: tells.slice() };
  });
}

/**
 * Game day (Ch 12): a forced-removal experiment on a specimen terrain.
 * Take something away and watch what the loops do. Collapse means a hidden
 * dependency was found; graceful re-adaptation means the dependency was not
 * load-bearing. Subtraction reveals what addition concealed.
 * @param {{ target: 'tool'|'context'|'signal', seed?: number }} opts
 * @returns {{ collapsed: boolean, affected: string,
 *   story: Array<{ label: string, caption: string, data: object }>,
 *   note: string }}
 */
export function removalExperiment({ target, seed = 1 }) {
  const rng = mulberry32(seed);
  const trace = makeTrace(seed);

  if (target === 'tool') {
    // The repo-search tool: every loop calls it; none of them need it.
    const slowdown = randInt(rng, 30, 60);
    pushStep(trace, {
      label: 'remove',
      caption:
        'Game day: the repo-search tool goes dark for a week. Every loop calls it before editing; nobody has asked what happens without it.',
      data: { target, removed: 'repo-search tool' },
    });
    pushStep(trace, {
      label: 'first day',
      caption: `First runs fail their lookup step, then fall back to plain grep over the tree. Lookups run ${slowdown}% slower.`,
      data: { fallback: 'grep', slowdownPct: slowdown },
    });
    pushStep(trace, {
      label: 'one week out',
      caption:
        'Merge rate holds through the week. The loops depended on search, the capability; the tool was one way to get it.',
      data: { mergeRateHeld: true },
    });
    pushStep(trace, {
      label: 'fragility map',
      caption:
        'Mark repo-search replaceable: slower without it, never blocked. No hardening needed here.',
      data: { verdict: 're-adapted' },
    });
    return {
      collapsed: false,
      affected: 'repo-search tool',
      story: trace.steps,
      note: 'Re-adapted: the dependency was on the capability, not the tool. Mark it replaceable on the fragility map.',
    };
  }

  if (target === 'context') {
    // ARCHITECTURE.md: the file every loop reads before placing a change.
    const misplaced = randInt(rng, 3, 4);
    const queueDepth = randInt(rng, 9, 14);
    pushStep(trace, {
      label: 'remove',
      caption:
        'Game day: ARCHITECTURE.md leaves the context pack. Every loop reads it before placing a change; it has never once been absent.',
      data: { target, removed: 'ARCHITECTURE.md' },
    });
    pushStep(trace, {
      label: 'first day',
      caption: `${misplaced} of 5 loops place their changes in the wrong module. CI catches some; review eats the rest.`,
      data: { misplacedLoops: misplaced, totalLoops: 5 },
    });
    pushStep(trace, {
      label: 'day three',
      caption: `The review queue is ${queueDepth} deep with mis-placed changes and not draining. The loops are not adapting: their placement decisions were keyed to the module table in that one file.`,
      data: { queueDepth },
    });
    pushStep(trace, {
      label: 'outcome',
      caption:
        'Collapse. One unwatched file was a hidden dependency every loop silently keyed on. Subtraction revealed what addition concealed.',
      data: { verdict: 'collapsed' },
    });
    pushStep(trace, {
      label: 'fragility map',
      caption:
        'Mark the module table load-bearing. The fix is terrain: make it an owned signal with a freshness check, not a file nobody watches.',
      data: { fix: 'owned signal with freshness check' },
    });
    return {
      collapsed: true,
      affected: 'ARCHITECTURE.md (the module table inside it)',
      story: trace.steps,
      note: 'Hidden dependency found: every loop keyed on one unwatched file. Make the module table an owned, monitored signal.',
    };
  }

  if (target === 'signal') {
    // The doc-freshness signal: the loop that fires on it can rebuild it.
    const lagHours = randInt(rng, 4, 9);
    pushStep(trace, {
      label: 'remove',
      caption:
        'Game day: the doc-freshness signal stops publishing. The doc loop fires on it; on paper, removal should stall the loop.',
      data: { target, removed: 'doc-freshness signal' },
    });
    pushStep(trace, {
      label: 'first tick',
      caption:
        'The doc loop stalls for one cycle, then recomputes freshness from git timestamps. The signal was a cache of a derivable fact.',
      data: { stalledCycles: 1, fallback: 'git timestamps' },
    });
    pushStep(trace, {
      label: 'one week out',
      caption: `Doc updates land ${lagHours} hours later than before, and they land. Nothing downstream noticed.`,
      data: { lagHours },
    });
    pushStep(trace, {
      label: 'fragility map',
      caption:
        'Mark the signal convenient, not load-bearing. Keep it for speed; do not guard it like a dependency.',
      data: { verdict: 're-adapted' },
    });
    return {
      collapsed: false,
      affected: 'doc-freshness signal',
      story: trace.steps,
      note: 'Re-adapted: the signal was a cache of a derivable fact, not a source. Keep it for speed, not for safety.',
    };
  }

  throw new Error(`unknown removal target: ${target} (expected 'tool', 'context', or 'signal')`);
}
