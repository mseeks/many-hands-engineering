import { describe, it, expect } from 'vitest';
import { simulateWeeks, moveGate, defaultClasses, rubberStampDrift } from '../src/engine/econ.js';

/** First seed (1..199) whose default run produces the given pathology. */
function findSeed(pathology) {
  for (let s = 1; s < 200; s++) {
    if (simulateWeeks({ seed: s }).pathology === pathology) return s;
  }
  throw new Error(`no seed found for ${pathology}`);
}

/** A small healthy economy: inflow well under the budget line. */
function healthyClasses() {
  return [
    { id: 'a', label: 'A', inflow: 10, quality: 0.9, gate: 'above' },
    { id: 'b', label: 'B', inflow: 12, quality: 0.95, gate: 'below', sampling: 0.25 },
  ];
}

describe('determinism', () => {
  it('same seed, same run — deep equal', () => {
    const a = simulateWeeks({ seed: 42 });
    const b = simulateWeeks({ seed: 42 });
    expect(a).toEqual(b);
  });

  it('holds for a moved-gate config and explicit params too', () => {
    const classes = moveGate(defaultClasses(), 'dep-patch', 'below');
    const opts = { classes, budget: 30, weeks: 8, seed: 7, tolerance: 0.05 };
    expect(simulateWeeks(opts)).toEqual(simulateWeeks(opts));
  });

  it('pathology is deterministic from seed', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      expect(simulateWeeks({ seed }).pathology).toBe(simulateWeeks({ seed }).pathology);
    }
  });

  it('never mutates the caller’s classes', () => {
    const classes = defaultClasses().map((c) => Object.freeze(c));
    Object.freeze(classes);
    expect(() => simulateWeeks({ classes, seed: 3 })).not.toThrow();
    expect(() => moveGate(classes, 'dep-patch', 'below')).not.toThrow();
    expect(classes[0].gate).toBe('above');
  });
});

describe('the handbook scenario (default classes)', () => {
  it('boots §3.6: dep-patch at 18/wk and 96%, on-call assist, doc refresh', () => {
    const cs = defaultClasses();
    const dep = cs.find((c) => c.id === 'dep-patch');
    expect(dep).toMatchObject({ inflow: 18, quality: 0.96, gate: 'above' });
    expect(cs.map((c) => c.id)).toContain('oncall-assist');
    expect(cs.map((c) => c.id)).toContain('doc-refresh');
  });

  it('starts saturated: 34 gated/wk against a 28.5 line', () => {
    const { inequality } = simulateWeeks({ seed: 1 });
    expect(inequality).toEqual({ lhs: 34, rhs: 28.5, ok: false });
  });

  it('carries the 99.7% curveball: a high rate with hollow deep-review agreement', () => {
    const seed = findSeed('stall'); // stall keeps rates honest (no drift)
    const week1 = simulateWeeks({ seed }).weeks[0];
    const hollow = week1.perClass.find((c) => c.id === 'flaky-quarantine');
    const dep = week1.perClass.find((c) => c.id === 'dep-patch');
    expect(hollow.rate).toBeGreaterThanOrEqual(0.99); // looks like trust
    expect(hollow.agreement).toBeLessThanOrEqual(0.85); // deep review says otherwise
    expect(dep.agreement).toBeGreaterThanOrEqual(0.9); // the honest class, for contrast
  });
});

describe('the governing inequality', () => {
  it('rhs is budget × (1 − tolerance), and tolerance is honored', () => {
    const { inequality } = simulateWeeks({
      classes: healthyClasses(),
      budget: 30,
      seed: 1,
      tolerance: 0.2,
    });
    expect(inequality.rhs).toBe(24);
  });

  it('below-gate classes count only their sampled slice toward lhs', () => {
    const { inequality } = simulateWeeks({ classes: healthyClasses(), seed: 1 });
    // above: 10, below: 12 × 0.25 = 3
    expect(inequality).toEqual({ lhs: 13, rhs: 28.5, ok: true });
  });

  it('lhs === rhs is still ok — the line itself is sustainable', () => {
    const classes = [{ id: 'a', label: 'A', inflow: 20, quality: 0.9, gate: 'above' }];
    const run = simulateWeeks({ classes, budget: 20, tolerance: 0, seed: 1 });
    expect(run.inequality.ok).toBe(true);
    expect(run.pathology).toBeNull();
  });

  it('sampling defaults to 0.1 when omitted', () => {
    const classes = moveGate(defaultClasses(), 'oncall-assist', 'below');
    const { inequality } = simulateWeeks({ classes, seed: 1 });
    // 18 + 5 + 4 above, plus 7 × 0.1 sampled
    expect(inequality.lhs).toBe(27.7);
  });
});

describe('healthy regime (lhs ≤ rhs)', () => {
  it('no pathology, no queue, and upstream budget stays free', () => {
    const run = simulateWeeks({ classes: healthyClasses(), seed: 5 });
    expect(run.pathology).toBeNull();
    for (const w of run.weeks) {
      expect(w.wip).toBe(0);
      expect(w.queue).toBe(0);
      expect(w.upstreamFree).toBeGreaterThan(0);
      expect(w.budgetSpent).toBeLessThanOrEqual(30);
    }
  });

  it('rates stay honest: per-class rate tracks quality when plausibility is omitted', () => {
    const run = simulateWeeks({ classes: healthyClasses(), seed: 5 });
    const a = run.weeks[0].perClass.find((c) => c.id === 'a');
    expect(a.rate).toBe(0.9); // plausibility defaulted to quality, no drift
  });

  it('below-gate rows auto-apply their full inflow and audit the sample', () => {
    const run = simulateWeeks({ classes: healthyClasses(), seed: 5 });
    const b = run.weeks[0].perClass.find((c) => c.id === 'b');
    expect(b.autoApplied).toBe(12);
    expect(b.gated).toBe(3); // 12 × 0.25 sampled deep reviews
    expect(b.queued).toBe(0);
    expect(b.agreement).toBeCloseTo(0.93, 2); // quality − dissent floor
  });
});

describe('saturation pathologies', () => {
  it('a sustained breach yields exactly one pathology, and both exist across seeds', () => {
    const seen = new Set();
    for (let seed = 1; seed <= 40; seed++) {
      const { pathology } = simulateWeeks({ seed });
      expect(['rubber-stamp', 'stall']).toContain(pathology);
      seen.add(pathology);
    }
    expect(seen).toEqual(new Set(['rubber-stamp', 'stall']));
  });

  it('rubber-stamp: approval rate inflates while deep-review agreement declines', () => {
    const run = simulateWeeks({ seed: findSeed('rubber-stamp') });
    const first = run.weeks[0];
    const last = run.weeks[run.weeks.length - 1];
    expect(last.approvalRate).toBeGreaterThan(first.approvalRate + 0.02);
    expect(last.deepReviewAgreement).toBeLessThan(first.deepReviewAgreement - 0.03);
    // the rubber-stamper "keeps up": nothing piles at the gate
    for (const w of run.weeks) expect(w.wip).toBeLessThan(1);
  });

  it('stall: wip accumulates while the approval rate stays honest and flat', () => {
    const run = simulateWeeks({ seed: findSeed('stall') });
    const [w1, w6, w12] = [run.weeks[0], run.weeks[5], run.weeks[11]];
    expect(w6.wip).toBeGreaterThan(w1.wip);
    expect(w12.wip).toBeGreaterThan(w6.wip);
    expect(Math.abs(w12.approvalRate - w1.approvalRate)).toBeLessThan(0.02);
    for (const w of run.weeks) expect(w.upstreamFree).toBe(0);
  });

  it('budgetSpent never exceeds the budget in any regime', () => {
    for (const seed of [findSeed('rubber-stamp'), findSeed('stall')]) {
      for (const w of simulateWeeks({ seed }).weeks) {
        expect(w.budgetSpent).toBeLessThanOrEqual(30);
      }
    }
  });
});

describe('moving the gate (the structural fix)', () => {
  it('moveGate returns a new array and leaves the input untouched', () => {
    const before = defaultClasses();
    const after = moveGate(before, 'dep-patch', 'below');
    expect(after).not.toBe(before);
    expect(before.find((c) => c.id === 'dep-patch').gate).toBe('above');
    expect(after.find((c) => c.id === 'dep-patch').gate).toBe('below');
  });

  it('an unknown id moves nothing and is not an error', () => {
    const before = defaultClasses();
    const after = moveGate(before, 'no-such-class', 'below');
    expect(after).toEqual(before);
    expect(after).not.toBe(before);
  });

  it('moving the 96% class below the gate frees ~15 approvals: upstreamFree rises', () => {
    const saturated = simulateWeeks({ seed: 9 });
    const fixed = simulateWeeks({
      classes: moveGate(defaultClasses(), 'dep-patch', 'below'),
      seed: 9,
    });
    expect(fixed.inequality.ok).toBe(true);
    expect(fixed.pathology).toBeNull();
    for (let i = 0; i < fixed.weeks.length; i++) {
      expect(fixed.weeks[i].upstreamFree).toBeGreaterThan(saturated.weeks[i].upstreamFree);
    }
    // dep-patch now costs ~3 sampled reviews instead of 18 considered ones
    const dep = fixed.weeks[0].perClass.find((c) => c.id === 'dep-patch');
    expect(dep.gated).toBeCloseTo(2.7, 1);
    expect(dep.autoApplied).toBe(18);
    const freed = saturated.weeks[0].budgetSpent - fixed.weeks[0].budgetSpent;
    expect(freed).toBeGreaterThanOrEqual(9); // ≈ 28.5 spent → ≈ 18.7 spent
  });
});

describe('the budget is a constant', () => {
  it('there is no "work harder" parameter: effort/overtime change nothing', () => {
    const base = simulateWeeks({ seed: 11 });
    const heroic = simulateWeeks({ seed: 11, effort: 5, overtime: true, workHarder: 1 });
    expect(heroic).toEqual(base);
  });
});

describe('rubberStampDrift (Ⓦ modeling choice)', () => {
  it('creeps upward each saturated week, faster under worse overload', () => {
    const mild = rubberStampDrift(0, 1.05);
    const harsh = rubberStampDrift(0, 1.8);
    expect(mild).toBeGreaterThan(0);
    expect(harsh).toBeGreaterThan(mild);
  });

  it('is capped: blindness saturates instead of growing without bound', () => {
    let d = 0;
    for (let i = 0; i < 100; i++) d = rubberStampDrift(d, 2.5);
    expect(d).toBe(0.3);
  });
});

describe('edges', () => {
  it('an empty economy produces no NaNs and nothing to measure', () => {
    const run = simulateWeeks({ classes: [], seed: 1 });
    expect(run.pathology).toBeNull();
    expect(run.inequality).toEqual({ lhs: 0, rhs: 28.5, ok: true });
    for (const w of run.weeks) {
      expect(w.approvalRate).toBeNull();
      expect(w.deepReviewAgreement).toBeNull();
      expect(w.wip).toBe(0);
      expect(w.budgetSpent).toBe(0);
      expect(w.upstreamFree).toBe(30);
    }
  });

  it('an all-below economy has no gated reviews to rate, but agreement still reads', () => {
    const classes = [{ id: 'x', label: 'X', inflow: 8, quality: 0.9, gate: 'below' }];
    const w = simulateWeeks({ classes, seed: 2 }).weeks[0];
    expect(w.approvalRate).toBeNull();
    expect(w.deepReviewAgreement).toBeGreaterThan(0.8);
    expect(w.perClass[0].autoApplied).toBe(8);
  });

  it('weeks and budget params are honored', () => {
    const run = simulateWeeks({ classes: healthyClasses(), budget: 40, weeks: 5, seed: 3 });
    expect(run.weeks).toHaveLength(5);
    expect(run.inequality.rhs).toBe(38);
    expect(simulateWeeks({ seed: 3 }).weeks).toHaveLength(12);
  });
});
