import { describe, it, expect } from 'vitest';
import {
  defaultPrinciples,
  PRINCIPLE_LABELS,
  runCommons,
  fingerprintScenarios,
  removalExperiment,
} from '../src/engine/commons.js';

// ── helpers ────────────────────────────────────────────────────────────────

const last = (arr) => arr[arr.length - 1];

/** Largest single-week fall in a series. */
function maxDrop(arr) {
  let m = 0;
  for (let i = 1; i < arr.length; i++) m = Math.max(m, arr[i - 1] - arr[i]);
  return m;
}

/** Index of the largest single-week fall. */
function cliffIndex(arr) {
  let m = 0;
  let idx = -1;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i - 1] - arr[i] > m) {
      m = arr[i - 1] - arr[i];
      idx = i;
    }
  }
  return idx;
}

/** Count weeks whose fall is at least `min`. */
function countDrops(arr, min) {
  let n = 0;
  for (let i = 1; i < arr.length; i++) if (arr[i - 1] - arr[i] >= min) n++;
  return n;
}

/** Count direction changes among week-over-week deltas larger than eps. */
function signFlips(arr, eps) {
  let flips = 0;
  let prev = 0;
  for (let i = 1; i < arr.length; i++) {
    const d = arr[i] - arr[i - 1];
    if (Math.abs(d) < eps) continue;
    const s = Math.sign(d);
    if (prev !== 0 && s !== prev) flips++;
    prev = s;
  }
  return flips;
}

const SEED = 42;
const allOn = () => defaultPrinciples();
const oneOff = (key) => ({ ...defaultPrinciples(), [key]: false });
const healthy = runCommons({ principles: allOn(), weeks: 30, seed: SEED });

// ── runCommons ─────────────────────────────────────────────────────────────

describe('runCommons', () => {
  it('is deterministic: same seed and config, same output, forever', () => {
    const a = runCommons({ principles: oneOff('boundaries'), weeks: 30, seed: 7 });
    const b = runCommons({ principles: oneOff('boundaries'), weeks: 30, seed: 7 });
    expect(a).toEqual(b);
  });

  it('returns one point per week, bounded and finite', () => {
    for (const run of [
      healthy,
      runCommons({ principles: oneOff('monitoring'), weeks: 30, seed: SEED }),
    ]) {
      expect(run.series.quality).toHaveLength(30);
      expect(run.series.noise).toHaveLength(30);
      expect(run.series.cruft).toHaveLength(30);
      for (let i = 0; i < 30; i++) {
        expect(run.series.quality[i]).toBeGreaterThanOrEqual(0);
        expect(run.series.quality[i]).toBeLessThanOrEqual(1);
        expect(run.series.noise[i]).toBeGreaterThanOrEqual(0);
        expect(run.series.noise[i]).toBeLessThanOrEqual(1);
        expect(run.series.cruft[i]).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(run.series.cruft[i])).toBe(true);
      }
    }
  });

  it('defaults weeks and seed; a partial principles object merges over defaults', () => {
    const defaulted = runCommons({ principles: allOn() });
    expect(defaulted.series.quality).toHaveLength(30);
    expect(defaulted).toEqual(runCommons({ principles: allOn() }));
    // Partial object: only the named principle flips, the rest stay present.
    const partial = runCommons({ principles: { boundaries: false }, weeks: 30, seed: SEED });
    const explicit = runCommons({ principles: oneOff('boundaries'), weeks: 30, seed: SEED });
    expect(partial).toEqual(explicit);
  });

  it('all eight present: quality climbs and holds, noise and cruft stay low, no incidents', () => {
    const { series, events } = healthy;
    expect(last(series.quality)).toBeGreaterThan(0.8);
    expect(last(series.quality)).toBeGreaterThan(series.quality[0]);
    expect(Math.max(...series.noise)).toBeLessThan(0.06);
    expect(Math.max(...series.cruft)).toBeLessThan(6);
    expect(events).toEqual([]);
  });

  it('boundaries off: unattributable junk floods in, noise climbs and stays, no cliff', () => {
    const { series, events } = runCommons({
      principles: oneOff('boundaries'),
      weeks: 30,
      seed: SEED,
    });
    expect(series.noise[9]).toBeGreaterThan(0.1); // fast early rise
    expect(last(series.noise)).toBeGreaterThan(0.12);
    expect(last(series.noise)).toBeGreaterThan(last(healthy.series.noise) * 5);
    expect(last(series.quality)).toBeLessThan(last(healthy.series.quality) - 0.08);
    expect(maxDrop(series.quality)).toBeLessThan(0.05); // sag, not a step or cliff
    expect(events.some((e) => e.includes('unattributable'))).toBe(true);
  });

  it('congruence off: nothing decays at the right rate, noise still climbing at week 30', () => {
    const { series, events } = runCommons({
      principles: oneOff('congruence'),
      weeks: 30,
      seed: SEED,
    });
    expect(series.noise[29]).toBeGreaterThan(series.noise[19] + 0.008); // no plateau yet
    expect(events.some((e) => e.includes('outranks'))).toBe(true); // stale signal lingers
    expect(events.some((e) => e.includes('weak datapoint'))).toBe(true); // weak evidence clears
  });

  it('monitoring off: everything looks healthy, then one cliff when rot surfaces at failure', () => {
    const { series, events } = runCommons({
      principles: oneOff('monitoring'),
      weeks: 30,
      seed: SEED,
    });
    const cliff = cliffIndex(series.quality);
    expect(cliff).toBeGreaterThanOrEqual(10);
    expect(cliff).toBeLessThanOrEqual(22);
    expect(maxDrop(series.quality)).toBeGreaterThan(0.2);
    // Quality reads healthy right up to the failure; the rot was invisible.
    expect(Math.min(...series.quality.slice(5, cliff))).toBeGreaterThan(0.78);
    // The cruft that appears at the cliff is weeks of accumulation, at once.
    expect(series.cruft[cliff] - series.cruft[cliff - 1]).toBeGreaterThan(15);
    // The event log is empty until the failure itself.
    expect(events).toHaveLength(1);
    expect(events[0]).toContain('the first warning is the failure itself');
  });

  it('sanctions off: the same offender re-offends and every warning reads the same', () => {
    const { series, events } = runCommons({
      principles: oneOff('sanctions'),
      weeks: 30,
      seed: SEED,
    });
    const offenses = events.filter((e) => e.includes('mapper-12'));
    expect(offenses.length).toBeGreaterThanOrEqual(6);
    // The flat-penalty tell: strip the week and every warning is identical.
    expect(new Set(offenses.map((e) => e.replace(/week \d+: /, ''))).size).toBe(1);
    // Quality falls in repeated steps and ends below the governed run.
    expect(countDrops(series.quality, 0.04)).toBeGreaterThanOrEqual(5);
    expect(last(series.quality)).toBeLessThan(last(healthy.series.quality) - 0.04);
  });

  it('conflict off: hidden overwrites make quality saw up and down week to week', () => {
    const { series, events } = runCommons({
      principles: oneOff('conflict'),
      weeks: 30,
      seed: SEED,
    });
    expect(signFlips(series.quality, 0.005)).toBeGreaterThanOrEqual(20);
    expect(signFlips(healthy.series.quality, 0.005)).toBeLessThanOrEqual(2);
    expect(events.some((e) => e.includes('flipped overnight'))).toBe(true);
  });

  it('collectiveChoice off: workaround cruft climbs all run, quality sags with no cliff', () => {
    const { series, events } = runCommons({
      principles: oneOff('collectiveChoice'),
      weeks: 30,
      seed: SEED,
    });
    expect(last(series.cruft)).toBeGreaterThan(25);
    expect(last(series.cruft)).toBeGreaterThan(series.cruft[9]); // still climbing
    expect(last(series.quality)).toBeLessThan(last(healthy.series.quality) - 0.05);
    expect(maxDrop(series.quality)).toBeLessThan(0.1); // sag, never a cliff
    expect(events.some((e) => e.includes('workaround'))).toBe(true);
  });

  it('rights off: central overrides recur and quality ends below the governed run', () => {
    const { series, events } = runCommons({ principles: oneOff('rights'), weeks: 30, seed: SEED });
    expect(events.filter((e) => e.includes('central override')).length).toBeGreaterThanOrEqual(3);
    expect(last(series.quality)).toBeLessThan(last(healthy.series.quality) - 0.02);
  });

  it('nested off: one global rulebook drags quality and lets edge junk in', () => {
    const { series } = runCommons({ principles: oneOff('nested'), weeks: 30, seed: SEED });
    expect(last(series.quality)).toBeLessThan(last(healthy.series.quality) - 0.04);
    expect(last(series.noise)).toBeGreaterThan(last(healthy.series.noise) * 1.5);
  });

  it('all eight absent: the tragedy of the commons, clamped and finite', () => {
    const none = Object.fromEntries(Object.keys(defaultPrinciples()).map((k) => [k, false]));
    const { series, events } = runCommons({ principles: none, weeks: 30, seed: SEED });
    expect(last(series.quality)).toBeLessThan(0.1); // the floor, not NaN
    expect(Math.max(...series.noise)).toBeLessThanOrEqual(1);
    expect(Math.min(...series.quality)).toBeGreaterThanOrEqual(0);
    expect(events.length).toBeGreaterThan(20);
  });

  it('handles a one-week run', () => {
    const { series } = runCommons({ principles: allOn(), weeks: 1, seed: SEED });
    expect(series.quality).toHaveLength(1);
    expect(series.noise).toHaveLength(1);
    expect(series.cruft).toHaveLength(1);
  });
});

// ── fingerprintScenarios ───────────────────────────────────────────────────

describe('fingerprintScenarios', () => {
  const scenarios = fingerprintScenarios();
  const byId = Object.fromEntries(scenarios.map((s) => [s.id, s]));

  it('is fully deterministic across calls', () => {
    expect(fingerprintScenarios()).toEqual(scenarios);
  });

  it('returns six scenarios, each missing a distinct valid principle', () => {
    expect(scenarios).toHaveLength(6);
    const principles = scenarios.map((s) => s.missingPrinciple);
    expect(new Set(principles).size).toBe(6);
    const valid = Object.keys(defaultPrinciples());
    for (const p of principles) expect(valid).toContain(p);
    expect(new Set(scenarios.map((s) => s.id)).size).toBe(6);
  });

  it('covers the three fingerprints the drill is built around', () => {
    const missing = scenarios.map((s) => s.missingPrinciple);
    expect(missing).toContain('boundaries'); // unattributable spam
    expect(missing).toContain('sanctions'); // one repeat offender dominating
    expect(missing).toContain('monitoring'); // rot discovered only at failure
  });

  it('gives every scenario 2-3 reader-facing tells that never name the principle', () => {
    for (const s of scenarios) {
      expect(s.tells.length).toBeGreaterThanOrEqual(2);
      expect(s.tells.length).toBeLessThanOrEqual(3);
      for (const tell of s.tells) {
        expect(typeof tell).toBe('string');
        expect(tell.length).toBeGreaterThan(10);
        // The reader infers the principle; the tell must not hand it over.
        expect(tell.toLowerCase()).not.toContain(s.missingPrinciple.toLowerCase());
        expect(tell.toLowerCase()).not.toContain(
          PRINCIPLE_LABELS[s.missingPrinciple].toLowerCase(),
        );
      }
    }
  });

  it('returns 30-week series ready to render', () => {
    for (const s of scenarios) {
      expect(s.series.quality).toHaveLength(30);
      expect(s.series.noise).toHaveLength(30);
      expect(s.series.cruft).toHaveLength(30);
    }
  });

  it('each prepared trace actually shows its fingerprint', () => {
    // Boundaries: noise floods early and stays high.
    expect(byId['unsigned-flood'].series.noise[9]).toBeGreaterThan(0.1);
    expect(last(byId['unsigned-flood'].series.noise)).toBeGreaterThan(0.12);
    // Sanctions: repeated quality steps.
    expect(countDrops(byId['repeat-offender'].series.quality, 0.04)).toBeGreaterThanOrEqual(5);
    // Monitoring: one cliff, healthy until it lands.
    const rot = byId['silent-rot'].series.quality;
    expect(maxDrop(rot)).toBeGreaterThan(0.2);
    expect(Math.min(...rot.slice(5, cliffIndex(rot)))).toBeGreaterThan(0.78);
    // Congruence: noise still climbing at the end.
    const fades = byId['nothing-fades'].series.noise;
    expect(fades[29]).toBeGreaterThan(fades[19] + 0.008);
    // Conflict: the sawtooth.
    expect(signFlips(byId['overnight-flips'].series.quality, 0.005)).toBeGreaterThanOrEqual(20);
    // Collective choice: cruft ramp with no cliff.
    expect(last(byId['workaround-pileup'].series.cruft)).toBeGreaterThan(25);
    expect(maxDrop(byId['workaround-pileup'].series.quality)).toBeLessThan(0.1);
  });

  it('returns fresh tells arrays each call (no shared mutable state)', () => {
    const first = fingerprintScenarios();
    first[0].tells.push('mutated');
    expect(fingerprintScenarios()[0].tells).not.toContain('mutated');
  });
});

// ── removalExperiment ──────────────────────────────────────────────────────

describe('removalExperiment', () => {
  it('is deterministic per target and seed', () => {
    for (const target of ['tool', 'context', 'signal']) {
      expect(removalExperiment({ target, seed: 5 })).toEqual(
        removalExperiment({ target, seed: 5 }),
      );
    }
  });

  it('different seeds vary the concrete numbers in the story', () => {
    const a = removalExperiment({ target: 'context', seed: 1 });
    const b = removalExperiment({ target: 'context', seed: 2 });
    expect(a.story).not.toEqual(b.story);
  });

  it('at least one target collapses and at least one re-adapts', () => {
    const outcomes = ['tool', 'context', 'signal'].map(
      (target) => removalExperiment({ target, seed: 1 }).collapsed,
    );
    expect(outcomes).toContain(true);
    expect(outcomes).toContain(false);
  });

  it('context removal finds the hidden dependency', () => {
    const result = removalExperiment({ target: 'context', seed: 1 });
    expect(result.collapsed).toBe(true);
    expect(result.affected).toContain('ARCHITECTURE.md');
    expect(result.note).toContain('Hidden dependency found');
    expect(result.story.some((s) => s.caption.includes('Subtraction revealed'))).toBe(true);
  });

  it('tool removal re-adapts: the dependency was the capability, not the tool', () => {
    const result = removalExperiment({ target: 'tool', seed: 1 });
    expect(result.collapsed).toBe(false);
    expect(result.affected).toBe('repo-search tool');
    expect(result.note).toContain('Re-adapted');
  });

  it('signal removal re-adapts: the signal was a cache of a derivable fact', () => {
    const result = removalExperiment({ target: 'signal', seed: 1 });
    expect(result.collapsed).toBe(false);
    expect(result.affected).toBe('doc-freshness signal');
    expect(result.note).toContain('Re-adapted');
    expect(result.story.some((s) => s.data.fallback === 'git timestamps')).toBe(true);
  });

  it('tells every story in well-formed steps, starting from the removal', () => {
    for (const target of ['tool', 'context', 'signal']) {
      const { story } = removalExperiment({ target, seed: 3 });
      expect(story.length).toBeGreaterThanOrEqual(4);
      expect(story[0].label).toBe('remove');
      expect(last(story).label).toBe('fragility map');
      for (const step of story) {
        expect(typeof step.label).toBe('string');
        expect(typeof step.caption).toBe('string');
        expect(step.caption.length).toBeGreaterThan(20);
        expect(step.data).toBeTypeOf('object');
      }
    }
  });

  it('rejects an unknown target', () => {
    expect(() => removalExperiment({ target: 'permissions', seed: 1 })).toThrow(
      /unknown removal target/,
    );
  });
});
