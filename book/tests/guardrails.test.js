import { describe, expect, it } from 'vitest';
import {
  episodes,
  firstTickWhere,
  gradeStorm,
  inventory,
  safeRate,
  simulateStorm,
} from '../src/engine/guardrails.js';

// A spread of seeds: semantic claims must hold for all of them, not for
// one lucky trace.
const SEEDS = [0, 1, 7, 42, 99, 1234, 987654];

const gradeById = (seed) => Object.fromEntries(gradeStorm(seed).map((g) => [g.id, g]));

describe('inventory', () => {
  it('lists at least 5 guardrails with unique ids', () => {
    const inv = inventory();
    expect(inv.length).toBeGreaterThanOrEqual(5);
    expect(new Set(inv.map((g) => g.id)).size).toBe(inv.length);
  });

  it('covers all four guardrail classes', () => {
    const classes = new Set(inventory().map((g) => g.cls));
    expect(classes).toEqual(new Set(['structural', 'reactive', 'dynamic', 'reflective']));
  });

  it('includes the four planted entries from the spec', () => {
    const inv = inventory();
    const ids = inv.map((g) => g.id);
    expect(ids).toContain('review-gate');
    expect(ids).toContain('rate-limit');
    expect(ids).toContain('circuit-breaker');
    // ...the 95% gate and the 10x limit say so in their names...
    expect(inv.find((g) => g.id === 'review-gate').name).toContain('95');
    expect(inv.find((g) => g.id === 'rate-limit').name).toContain('10x');
    // ...and one honest structural guardrail exists.
    expect(inv.some((g) => g.cls === 'structural')).toBe(true);
  });

  it('gives every entry a non-empty name and claim', () => {
    for (const g of inventory()) {
      expect(g.name.length).toBeGreaterThan(0);
      expect(g.claimed.length).toBeGreaterThan(0);
    }
  });

  it('returns a fresh array each call', () => {
    const a = inventory();
    const n = a.length;
    a.pop();
    expect(inventory()).toHaveLength(n);
  });
});

describe('determinism', () => {
  it('same seed, same storm, forever', () => {
    for (const seed of SEEDS) {
      expect(simulateStorm(seed)).toEqual(simulateStorm(seed));
    }
  });

  it('same seed, same grades, forever', () => {
    for (const seed of SEEDS) {
      expect(gradeStorm(seed)).toEqual(gradeStorm(seed));
    }
  });

  it('different seeds give different traffic', () => {
    const a = simulateStorm(1).ticks.map((k) => k.load);
    const b = simulateStorm(2).ticks.map((k) => k.load);
    expect(a).not.toEqual(b);
  });
});

describe('grade shape', () => {
  it('grades every inventory row, in inventory order', () => {
    for (const seed of SEEDS) {
      expect(gradeStorm(seed).map((g) => g.id)).toEqual(inventory().map((g) => g.id));
    }
  });

  it('measures exactly the five axes on every row', () => {
    const axisKeys = ['blastRadius', 'coverage', 'falsePositiveRate', 'latency', 'recoveryCost'];
    for (const g of gradeStorm(7)) {
      expect(Object.keys(g.axes).sort()).toEqual(axisKeys);
      expect(g.axes.coverage).toBeGreaterThanOrEqual(0);
      expect(g.axes.coverage).toBeLessThanOrEqual(1);
      expect(g.axes.falsePositiveRate).toBeGreaterThanOrEqual(0);
      expect(g.axes.falsePositiveRate).toBeLessThanOrEqual(1);
      expect(g.axes.blastRadius).toBeGreaterThanOrEqual(0);
      expect(g.axes.recoveryCost).toBeGreaterThanOrEqual(0);
      if (g.axes.latency !== null) {
        expect(g.axes.latency).toBeGreaterThanOrEqual(0);
      }
      expect(typeof g.verdict).toBe('string');
      expect(g.verdict.length).toBeGreaterThan(0);
    }
  });
});

describe('storm physics', () => {
  it('runs 60 ticks with t equal to index and a 20-tick storm window', () => {
    for (const seed of SEEDS) {
      const storm = simulateStorm(seed);
      expect(storm.ticks).toHaveLength(60);
      storm.ticks.forEach((k, i) => {
        expect(k.t).toBe(i);
        expect(k.inStorm).toBe(i >= storm.stormStart && i < storm.stormEnd);
      });
    }
  });

  it('saturates the service exactly during the storm', () => {
    for (const seed of SEEDS) {
      for (const k of simulateStorm(seed).ticks) {
        expect(k.serviceUp).toBe(!k.inStorm);
      }
    }
  });

  it('storms hard enough to hurt, never hard enough to reach the 10x limit', () => {
    for (const seed of SEEDS) {
      const storm = simulateStorm(seed);
      const stormPeak = Math.max(...storm.ticks.filter((k) => k.inStorm).map((k) => k.load));
      expect(stormPeak).toBeGreaterThan(storm.historicPeak * 2);
      for (const k of storm.ticks) {
        expect(k.load).toBeLessThan(storm.rateLimit);
        expect(k.limitFired).toBe(false);
      }
    }
  });

  it('blocks every malformed write at the schema, by construction', () => {
    for (const k of simulateStorm(42).ticks) {
      expect(k.malformedBlocked).toBe(k.malformed);
    }
  });
});

describe('the 95% review gate grades as a rubber stamp', () => {
  it('says so, in those words', () => {
    for (const seed of SEEDS) {
      expect(gradeById(seed)['review-gate'].verdict).toMatch(/rubber stamp/i);
    }
  });

  it('has near-zero coverage despite perfect latency', () => {
    for (const seed of SEEDS) {
      const { axes } = gradeById(seed)['review-gate'];
      expect(axes.coverage).toBeLessThan(0.3);
      expect(axes.latency).toBe(0);
    }
  });

  it('mostly rejects fine changes and lets defects through at cost', () => {
    for (const seed of SEEDS) {
      const { axes } = gradeById(seed)['review-gate'];
      expect(axes.falsePositiveRate).toBeGreaterThan(0.3);
      expect(axes.blastRadius).toBeGreaterThan(10); // defects merged
      expect(axes.recoveryCost).toBe(axes.blastRadius * 2);
    }
  });
});

describe('the 10x rate limit grades as decorative', () => {
  it('says so, in those words', () => {
    for (const seed of SEEDS) {
      expect(gradeById(seed)['rate-limit'].verdict).toMatch(
        /rate limit set at ten times peak is decorative/i,
      );
    }
  });

  it('never fires: zero coverage, null latency, nothing to false-positive', () => {
    for (const seed of SEEDS) {
      const { axes } = gradeById(seed)['rate-limit'];
      expect(axes.coverage).toBe(0);
      expect(axes.latency).toBeNull();
      expect(axes.falsePositiveRate).toBe(0);
      expect(axes.blastRadius).toBeGreaterThan(1000); // excess requests served
      expect(axes.recoveryCost).toBe(22); // storm plus drain, all unprevented
    }
  });
});

describe('the dependent circuit breaker fails exactly during the storm', () => {
  it('stays closed for every storm tick and trips only after', () => {
    for (const seed of SEEDS) {
      const storm = simulateStorm(seed);
      const before = storm.ticks.filter((k) => k.t < storm.stormStart);
      const during = storm.ticks.filter((k) => k.inStorm);
      const after = storm.ticks.filter((k) => k.t >= storm.stormEnd);
      expect(before.every((k) => !k.breakerOpen)).toBe(true);
      expect(during.every((k) => !k.breakerOpen)).toBe(true);
      expect(after.some((k) => k.breakerOpen)).toBe(true);
    }
  });

  it('grades at zero coverage with latency the length of the storm', () => {
    for (const seed of SEEDS) {
      const { axes, verdict } = gradeById(seed)['circuit-breaker'];
      expect(axes.coverage).toBe(0);
      expect(axes.latency).toBe(20); // it learned about the storm when it ended
      expect(axes.blastRadius).toBe(20); // every storm tick unisolated
      expect(axes.falsePositiveRate).toBe(1); // its only firing came after
      expect(axes.recoveryCost).toBeGreaterThanOrEqual(1); // manual reset at least
      expect(verdict).toMatch(/circuit breaker/i);
    }
  });
});

describe('the structural schema gate grades honestly', () => {
  it('catches everything at write time with nothing to recover', () => {
    for (const seed of SEEDS) {
      const { axes, verdict } = gradeById(seed)['schema-gate'];
      expect(axes.coverage).toBe(1);
      expect(axes.latency).toBe(0);
      expect(axes.blastRadius).toBe(0);
      expect(axes.recoveryCost).toBe(0);
      expect(axes.falsePositiveRate).toBeLessThan(0.2);
      expect(verdict).toMatch(/write time/i);
    }
  });
});

describe('the drift monitor catches the pattern and pays in pages', () => {
  it('flags most of the storm, a few ticks late', () => {
    for (const seed of SEEDS) {
      const { axes } = gradeById(seed)['drift-monitor'];
      expect(axes.coverage).toBeGreaterThan(0.5);
      expect(axes.latency).toBe(3); // the trailing window has to fill
      expect(axes.blastRadius).toBe(axes.latency); // drift ticks before the page
    }
  });

  it('also pages once on the benign calm-weather wobble', () => {
    for (const seed of SEEDS) {
      const storm = simulateStorm(seed);
      const calmFiring = storm.ticks.some((k) => k.t < storm.stormStart && k.monitorFired);
      expect(calmFiring).toBe(true);
      const { axes } = gradeById(seed)['drift-monitor'];
      expect(axes.falsePositiveRate).toBe(0.5); // one of its two episodes
      expect(axes.recoveryCost).toBe(1); // the page triaged to nothing
    }
  });
});

describe('the game-day probe is graded against the other rows', () => {
  it('counts the live failures a rehearsal would have caught first', () => {
    for (const seed of SEEDS) {
      const { axes, verdict } = gradeById(seed)['gameday-probe'];
      expect(axes.blastRadius).toBe(3); // gate, limit, breaker all failed live
      expect(axes.coverage).toBe(0.67); // the limit and the breaker, not the stamp
      expect(axes.latency).toBeNull();
      expect(axes.falsePositiveRate).toBe(0);
      expect(verdict).toMatch(/drill/i);
    }
  });
});

describe('helpers', () => {
  it('safeRate returns 0 for an empty denominator', () => {
    expect(safeRate(0, 0)).toBe(0);
    expect(safeRate(3, 4)).toBe(0.75);
  });

  it('firstTickWhere finds the first match or returns null', () => {
    const ticks = [{ x: 0 }, { x: 1 }, { x: 1 }];
    expect(firstTickWhere(ticks, (k) => k.x === 1)).toBe(1);
    expect(firstTickWhere(ticks, (k) => k.x === 2)).toBeNull();
  });

  it('episodes counts rising edges, including one at tick zero', () => {
    const tick = (v) => ({ on: v });
    const ticks = [1, 1, 0, 0, 1, 0, 1].map(tick);
    expect(episodes(ticks, (k) => k.on === 1)).toEqual([0, 4, 6]);
    expect(episodes([], (k) => k.on === 1)).toEqual([]);
  });
});
