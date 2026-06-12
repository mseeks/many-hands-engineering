// Tests for spec.js — the planned death spiral.
// Every required semantic branch from ENGINE-SPEC.md is pinned here:
// big-bang + low budget → invisible rot and a cliff at integration;
// contracts → rework visible the week it happens, no cliff; shorter cadence
// bounds backlog; and effort — present, accepted — has no effect on the cliff.

import { describe, it, expect } from 'vitest';
import { runSpecGap } from '../src/engine/spec.js';

const SEED = 11;

describe('determinism', () => {
  it('same seed and options → identical output, deep-equal', () => {
    const a = runSpecGap({ seed: SEED });
    const b = runSpecGap({ seed: SEED });
    expect(b).toEqual(a);
  });

  it('different seeds → different drift, different weeks', () => {
    const a = runSpecGap({ seed: 7 });
    const b = runSpecGap({ seed: 8 });
    expect(b.weeks).not.toEqual(a.weeks);
  });

  it('runs with all defaults (no options object at all)', () => {
    const r = runSpecGap();
    expect(r.weeks).toHaveLength(16);
    expect(r.cliff).not.toBeNull();
  });
});

describe('output shape', () => {
  it('one row per week, numbered 1..weeks, with exactly the contract fields', () => {
    const { weeks } = runSpecGap({ seed: SEED });
    expect(weeks).toHaveLength(16);
    weeks.forEach((row, i) => {
      expect(row.week).toBe(i + 1);
      expect(Object.keys(row).sort()).toEqual([
        'backlog',
        'hiddenRework',
        'valid',
        'visibleRework',
        'week',
        'wip',
      ]);
    });
  });

  it('respects a custom horizon', () => {
    const { weeks } = runSpecGap({ seed: SEED, weeks: 4 });
    expect(weeks).toHaveLength(4);
    // Big-bang integrates on the final week even on a short horizon.
    expect(weeks.at(-1).hiddenRework).toBe(0);
  });

  it('weeks: 0 → no rows, no cliff', () => {
    expect(runSpecGap({ seed: SEED, weeks: 0 })).toEqual({
      weeks: [],
      cliff: null,
    });
  });

  it('counts stay in range: valid within [0, assertions], stocks never negative', () => {
    for (const cadence of ['big-bang', 'weekly', 'continuous']) {
      for (const row of runSpecGap({ seed: SEED, cadence }).weeks) {
        expect(row.valid).toBeGreaterThanOrEqual(0);
        expect(row.valid).toBeLessThanOrEqual(24);
        expect(row.hiddenRework).toBeGreaterThanOrEqual(0);
        expect(row.visibleRework).toBeGreaterThanOrEqual(0);
        expect(row.backlog).toBeGreaterThanOrEqual(0);
        expect(row.wip).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('rejects an unknown cadence', () => {
    expect(() => runSpecGap({ cadence: 'monthly' })).toThrow(/unknown cadence/);
  });
});

describe('big-bang + low revision budget — the canonical spiral', () => {
  const run = runSpecGap({ seed: SEED }); // defaults: big-bang, budget 1

  it('hidden rework accumulates while visible rework stays at zero', () => {
    const beforeCliff = run.weeks.slice(0, -1);
    for (const row of beforeCliff) {
      expect(row.visibleRework).toBe(0);
      expect(row.backlog).toBe(0);
    }
    // Monotone growth: nothing integrates, so nothing ever surfaces.
    for (let i = 1; i < beforeCliff.length; i++) {
      expect(beforeCliff[i].hiddenRework).toBeGreaterThanOrEqual(beforeCliff[i - 1].hiddenRework);
    }
    expect(beforeCliff.at(-1).hiddenRework).toBeGreaterThan(24);
  });

  it('the cliff lands at the single integration event', () => {
    expect(run.cliff).not.toBeNull();
    expect(run.cliff.week).toBe(16);
    expect(run.cliff.magnitude).toBeGreaterThanOrEqual(12);
    const last = run.weeks.at(-1);
    expect(last.hiddenRework).toBe(0); // flushed
    expect(last.visibleRework).toBe(run.cliff.magnitude); // all at once
  });

  it('the spec rots: valid assertions decline as drift outruns the budget', () => {
    expect(run.weeks.at(-1).valid).toBeLessThan(run.weeks[0].valid);
  });

  it('WIP accumulates because no piece integrates until the whole is ready', () => {
    for (let i = 1; i < run.weeks.length; i++) {
      expect(run.weeks[i].wip).toBeGreaterThan(run.weeks[i - 1].wip);
    }
  });
});

describe('contracts:true — rework is visible the week it happens', () => {
  const plain = runSpecGap({ seed: SEED });
  const contracted = runSpecGap({ seed: SEED, contracts: true });

  it('no cliff, and nothing is ever hidden', () => {
    expect(contracted.cliff).toBeNull();
    for (const row of contracted.weeks) expect(row.hiddenRework).toBe(0);
  });

  it('rework surfaces immediately instead of at week 16', () => {
    const firstVisible = contracted.weeks.find((r) => r.visibleRework > 0);
    expect(firstVisible.week).toBeLessThanOrEqual(3);
    const visible = contracted.weeks.map((r) => r.visibleRework);
    for (let i = 1; i < visible.length; i++) {
      expect(visible[i]).toBeGreaterThanOrEqual(visible[i - 1]);
    }
  });

  it('detection latency bounds total rework: same drift, far less to redo', () => {
    // Same seed → same drift stream. A contract catches a stale assertion on
    // first touch; without it the assertion corrupts every following week.
    expect(contracted.weeks.at(-1).visibleRework).toBeLessThan(plain.cliff.magnitude / 2);
  });
});

describe('cadence — shorter cycles bound the backlog', () => {
  const maxBacklog = (run) => Math.max(...run.weeks.map((r) => r.backlog));
  const big = runSpecGap({ seed: SEED, cadence: 'big-bang' });
  const weekly = runSpecGap({ seed: SEED, cadence: 'weekly' });
  const continuous = runSpecGap({ seed: SEED, cadence: 'continuous' });

  it('max backlog orders continuous ≤ weekly < big-bang', () => {
    expect(maxBacklog(continuous)).toBeLessThanOrEqual(maxBacklog(weekly));
    expect(maxBacklog(weekly)).toBeLessThan(maxBacklog(big));
  });

  it('weekly and continuous integration produce no cliff at default drift', () => {
    expect(weekly.cliff).toBeNull();
    expect(continuous.cliff).toBeNull();
  });

  it('under extreme drift even weekly batches cliff — and only the first crossing is recorded', () => {
    const storm = runSpecGap({ seed: SEED, cadence: 'weekly', driftPerWeek: 8 });
    expect(storm.cliff).not.toBeNull();
    expect(storm.cliff.week).toBe(1);
  });
});

describe('effort — present, accepted, useless against the cliff', () => {
  const base = runSpecGap({ seed: SEED, effort: 1 });
  const hero = runSpecGap({ seed: SEED, effort: 5 });
  const superhero = runSpecGap({ seed: SEED, effort: 10 });

  it('heroics change nothing about the cliff', () => {
    expect(base.cliff).not.toBeNull(); // not vacuous
    expect(hero.cliff).toEqual(base.cliff);
    expect(superhero.cliff).toEqual(base.cliff);
  });

  it('heroics reveal nothing: the hidden-rework series is identical', () => {
    expect(hero.weeks.map((r) => r.hiddenRework)).toEqual(base.weeks.map((r) => r.hiddenRework));
  });

  it('the knob is wired, not ignored: visible work does move', () => {
    // More effort → more work in flight; the weeks tables differ even
    // though the cliff does not.
    expect(hero.weeks).not.toEqual(base.weeks);
    expect(hero.weeks[0].wip).toBeGreaterThan(base.weeks[0].wip);
  });

  it('heroics do help with what is already visible: backlog burns faster', () => {
    const maxBacklog = (run) => Math.max(...run.weeks.map((r) => r.backlog));
    const slow = runSpecGap({ seed: SEED, cadence: 'weekly', effort: 1 });
    const fast = runSpecGap({ seed: SEED, cadence: 'weekly', effort: 5 });
    expect(maxBacklog(fast)).toBeLessThanOrEqual(maxBacklog(slow));
  });
});

describe('the spiral condition itself: spec-update-rate vs reality-change-rate', () => {
  it('a revision budget above the drift rate → the spec keeps up, no cliff', () => {
    // Max drift at 1.5 events/week is 6 assertions; a budget of 8 clears
    // every gap before any work is built on it, on any seed.
    const funded = runSpecGap({ seed: SEED, revisionBudget: 8 });
    expect(funded.cliff).toBeNull();
    for (const row of funded.weeks) {
      expect(row.valid).toBe(24);
      expect(row.hiddenRework).toBe(0);
    }
  });

  it('no drift → no spiral: a static reality leaves the plan intact', () => {
    const calm = runSpecGap({ seed: SEED, driftPerWeek: 0 });
    expect(calm.cliff).toBeNull();
    for (const row of calm.weeks) {
      expect(row.valid).toBe(24);
      expect(row.hiddenRework).toBe(0);
      expect(row.visibleRework).toBe(0);
      expect(row.backlog).toBe(0);
    }
    // Work itself continues fine; nothing was ever wrong with the workers.
    expect(calm.weeks.at(-1).wip).toBeGreaterThan(0);
  });
});
