import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../src/engine/rng.js';
import {
  FIELD_DEFAULTS,
  REMEDIES,
  STORM_POLICY_DEFAULTS,
  applyRemedy,
  fieldMetrics,
  makeField,
  runStorm,
  stepField,
} from '../src/engine/field.js';

/** Sum of all signal in a field. */
function totalSignal(field) {
  return field.nodes.reduce((a, n) => a + n.signal, 0);
}

/** Step a field n times with one rng stream. */
function runField(field, params, rng, n) {
  let f = field;
  for (let i = 0; i < n; i++) f = stepField(f, params, rng);
  return f;
}

/** Build a field where the brightest node is the worst node. */
function lowQualityLeaderField() {
  const field = makeField({ nodes: 12, seed: 3 });
  for (const node of field.nodes) {
    node.signal = 0.005;
    node.quality = 0.9;
  }
  field.nodes[0].signal = 1.5; // early heat...
  field.nodes[0].quality = 0.05; // ...on the wrong region
  return field;
}

describe('makeField', () => {
  it('builds 12 repo regions by default, dim and unjudged', () => {
    const field = makeField({ seed: 1 });
    expect(field.nodes).toHaveLength(12);
    expect(field.tick).toBe(0);
    expect(field.gain).toBe(1);
    expect(field.nodes[0]).toMatchObject({ id: 'n0', name: 'delivery/' });
    expect(field.nodes.map((n) => n.name)).toContain('evals/');
    for (const n of field.nodes) {
      expect(n.signal).toBeGreaterThanOrEqual(0);
      expect(n.signal).toBeLessThan(0.25);
      expect(n.quality).toBeGreaterThanOrEqual(0);
      expect(n.quality).toBeLessThan(1);
    }
  });

  it('is deterministic: same seed, same field', () => {
    expect(makeField({ nodes: 12, seed: 42 })).toEqual(makeField({ nodes: 12, seed: 42 }));
  });

  it('falls back to generated region names past the named list', () => {
    const field = makeField({ nodes: 20, seed: 1 });
    expect(field.nodes).toHaveLength(20);
    expect(field.nodes[19].name).toBe('region-19/');
  });
});

describe('stepField', () => {
  it('never mutates its input', () => {
    const field = makeField({ nodes: 12, seed: 9 });
    const before = structuredClone(field);
    stepField(field, {}, mulberry32(9));
    expect(field).toEqual(before);
  });

  it('is deterministic: same seed twice, deep-equal fields', () => {
    const run = () => runField(makeField({ nodes: 12, seed: 7 }), {}, mulberry32(7), 50);
    expect(run()).toEqual(run());
  });

  it('advances the tick and stamps a gain', () => {
    const next = stepField(makeField({ nodes: 12, seed: 5 }), {}, mulberry32(5));
    expect(next.tick).toBe(1);
    expect(next.gain).toBeGreaterThanOrEqual(0);
  });

  it('severing the outside reference reinforces every claim, not just real work', () => {
    const grounded = runField(
      makeField({ nodes: 12, seed: 11 }),
      { outsideRef: true },
      mulberry32(11),
      200,
    );
    const severed = runField(
      makeField({ nodes: 12, seed: 11 }),
      { outsideRef: false },
      mulberry32(11),
      200,
    );
    expect(totalSignal(severed)).toBeGreaterThan(totalSignal(grounded));
  });
});

describe('fieldMetrics — required regimes', () => {
  it('reads a dark field as even, quiet, and unlocked', () => {
    const field = makeField({ nodes: 12, seed: 2 });
    for (const n of field.nodes) n.signal = 0;
    const m = fieldMetrics(field);
    expect(m.variety).toBe(1);
    expect(m.signalToNoise).toBe(0);
    expect(m.lockIn).toBe(false);
  });

  it('reads a single-region field as zero-variety lock-in', () => {
    const m = fieldMetrics(makeField({ nodes: 1, seed: 2 }));
    expect(m.variety).toBe(0);
    expect(m.lockIn).toBe(true);
  });

  it('decay near zero saturates the field: signal-to-noise collapses', () => {
    const healthy = fieldMetrics(
      runField(makeField({ nodes: 12, seed: 13 }), {}, mulberry32(13), 1000),
    );
    const saturated = fieldMetrics(
      runField(makeField({ nodes: 12, seed: 13 }), { decay: 0 }, mulberry32(13), 1000),
    );
    expect(saturated.signalToNoise).toBeLessThan(0.5);
    expect(saturated.signalToNoise).toBeLessThan(healthy.signalToNoise / 3);
  });

  it('reinforcement outrunning decay locks onto the early node even at low quality', () => {
    // spread: 0 isolates the reinforce-vs-decay axis; with spread on, the
    // leader's leak seeds its (high-quality) neighbors, who break the lock.
    const field = runField(
      lowQualityLeaderField(),
      { spread: 0, decay: 0.1, reinforce: 2.0, explore: 0.02 },
      mulberry32(17),
      300,
    );
    const m = fieldMetrics(field);
    expect(m.lockIn).toBe(true);
    const brightest = field.nodes.reduce((a, b) => (b.signal > a.signal ? b : a));
    expect(brightest.id).toBe('n0');
    expect(brightest.quality).toBeLessThan(0.1);
  });

  it('a fresh field is not locked in', () => {
    expect(fieldMetrics(makeField({ nodes: 12, seed: 19 })).lockIn).toBe(false);
  });

  it('gain above 1 means divergence: total signal grows', () => {
    const rng = mulberry32(23);
    const params = { decay: 0.01, reinforce: 1.5 };
    const early = runField(makeField({ nodes: 12, seed: 23 }), params, rng, 5);
    const late = runField(early, params, rng, 25);
    expect(fieldMetrics(late).gain).toBeGreaterThan(1);
    expect(totalSignal(late)).toBeGreaterThan(totalSignal(early));
  });

  it('gain below 1 means the perturbation dies: total signal shrinks', () => {
    const rng = mulberry32(23);
    const diverged = runField(
      makeField({ nodes: 12, seed: 23 }),
      { decay: 0.01, reinforce: 1.5 },
      rng,
      30,
    );
    const damped = runField(diverged, { decay: 0.4, reinforce: 0.05 }, rng, 10);
    expect(fieldMetrics(damped).gain).toBeLessThan(1);
    expect(totalSignal(damped)).toBeLessThan(totalSignal(diverged));
  });

  it('the exploration floor preserves variety', () => {
    const params = { spread: 0, decay: 0.1, reinforce: 2.0 };
    const noFloor = fieldMetrics(
      runField(makeField({ nodes: 12, seed: 42 }), { ...params, explore: 0 }, mulberry32(42), 300),
    );
    const withFloor = fieldMetrics(
      runField(
        makeField({ nodes: 12, seed: 42 }),
        { ...params, explore: 0.25 },
        mulberry32(42),
        300,
      ),
    );
    expect(withFloor.variety).toBeGreaterThan(noFloor.variety + 0.1);
  });
});

describe('runStorm', () => {
  const SEED = 99;

  it('is deterministic: same config, deep-equal runs', () => {
    expect(runStorm({ seed: SEED })).toEqual(runStorm({ seed: SEED }));
  });

  it('produces full-length series and respects the retry ceiling', () => {
    const s = runStorm({ seed: SEED, ticks: 60 });
    for (const key of ['load', 'success', 'queue', 'amplification', 'selfReport', 'groundTruth']) {
      expect(s.series[key]).toHaveLength(60);
    }
    expect(Math.max(...s.series.queue)).toBeLessThanOrEqual(300);
  });

  it('the aggressive default policy storms: amplification crosses 1.0 after the spike and self-sustains', () => {
    const s = runStorm({ seed: SEED, spikeAt: 10, ticks: 60 });
    const cross = s.series.amplification.findIndex((a) => a >= 1);
    expect(cross).toBeGreaterThan(10); // after the spike began
    expect(cross).toBeLessThan(20);
    // The spike ends at tick 13; the storm is still feeding itself at 59.
    expect(s.series.amplification[59]).toBeGreaterThanOrEqual(1);
    expect(s.phase).toBe('runaway');
    expect(s.events.join('\n')).toContain('amplification crossed 1.0');
    expect(s.events.join('\n')).toContain('self-sustaining');
    expect(s.events.join('\n')).toContain('load spike begins');
    expect(s.events.join('\n')).toContain('load spike ends');
  });

  it('a gentle policy (few retries, wide backoff, jitter, breaker) drains instead', () => {
    const s = runStorm({
      seed: SEED,
      policy: { maxRetries: 2, backoffMs: 800, jitter: true, breaker: true },
    });
    expect(s.phase).not.toBe('runaway');
    expect(s.series.amplification[59]).toBeLessThan(1);
  });

  it('a breaker alone defuses the aggressive policy', () => {
    const s = runStorm({ seed: SEED, policy: { breaker: true } });
    expect(s.phase).toBe('stable');
    expect(s.events.join('\n')).toContain('circuit breaker opened');
    expect(s.events.join('\n')).toContain('circuit breaker closed');
  });

  it('a storm that crosses but drains within the window reads as critical', () => {
    const s = runStorm({ seed: SEED, policy: { maxRetries: 2 } });
    expect(Math.max(...s.series.amplification)).toBeGreaterThanOrEqual(0.7);
    expect(s.series.amplification[59]).toBeLessThan(1);
    expect(s.phase).toBe('critical');
  });

  it('no spike, no storm', () => {
    const s = runStorm({ seed: SEED, spikeAt: 100, ticks: 20 });
    expect(s.phase).toBe('stable');
    expect(Math.max(...s.series.amplification)).toBeLessThan(0.1);
  });

  it('with the outside reference intact, self-report tracks ground truth', () => {
    const s = runStorm({ seed: SEED, outsideRef: true });
    for (let t = 0; t < 60; t++) {
      expect(Math.abs(s.series.selfReport[t] - s.series.groundTruth[t])).toBeLessThan(0.06);
    }
  });

  it('severed, self-report keeps rising while ground truth falls', () => {
    const s = runStorm({ seed: SEED, outsideRef: false });
    expect(s.events[0]).toContain('outside reference severed');
    // Ground truth collapses once the storm starts...
    expect(s.series.groundTruth[22]).toBeLessThan(s.series.groundTruth[5] - 0.3);
    // ...while the system's confidence in itself climbs.
    expect(s.series.selfReport[22]).toBeGreaterThan(s.series.selfReport[13] + 0.05);
    expect(s.series.selfReport[40]).toBeGreaterThanOrEqual(s.series.selfReport[22]);
  });
});

describe('applyRemedy', () => {
  const storm = () => runStorm({ seed: 99 });

  it('rejects remedies outside the palette', () => {
    expect(() => applyRemedy(storm(), 'patch-the-agent')).toThrow(/unknown remedy/);
  });

  it('does not mutate the input state and replays the past exactly', () => {
    const s = storm();
    const before = structuredClone(s);
    const r = applyRemedy(s, 'decay');
    expect(s).toEqual(before);
    expect(r.series.load.slice(0, 60)).toEqual(s.series.load.slice(0, 60));
    expect(r.series.load).toHaveLength(100);
    expect(r.remedies).toEqual([{ at: 60, remedy: 'decay' }]);
  });

  it('is deterministic: the same remedy twice gives deep-equal states', () => {
    expect(applyRemedy(storm(), 'variety')).toEqual(applyRemedy(storm(), 'variety'));
  });

  it.each(['variety', 'decay', 'tighten-trust'])(
    "'%s' reshapes the terrain and the storm drains",
    (remedy) => {
      const r = applyRemedy(storm(), remedy);
      expect(r.phase).not.toBe('runaway');
      expect(r.series.amplification[99]).toBeLessThan(1);
      expect(r.events.join('\n')).toContain('remedy');
    },
  );

  it("'outside-reference' re-couples self-report and drains the storm", () => {
    const severed = runStorm({ seed: 99, outsideRef: false });
    expect(severed.phase).toBe('runaway');
    const r = applyRemedy(severed, 'outside-reference');
    expect(r.phase).not.toBe('runaway');
    expect(r.series.amplification[99]).toBeLessThan(1);
    expect(Math.abs(r.series.selfReport[99] - r.series.groundTruth[99])).toBeLessThan(0.06);
  });

  it("'evacuate' drains the queue and sheds traffic", () => {
    const r = applyRemedy(storm(), 'evacuate');
    expect(r.series.queue[60]).toBe(0);
    expect(r.series.load[61]).toBe(0); // shed window
    expect(r.series.amplification[99]).toBeLessThan(0.3);
    expect(r.phase).not.toBe('runaway');
  });

  it("'restart-agent' dips load for one tick, then the runaway resumes", () => {
    const s = storm();
    const r = applyRemedy(s, 'restart-agent');
    // The dip: in-flight work vanishes for exactly one tick...
    expect(r.series.load[60]).toBeLessThan(r.series.load[59] / 3);
    // ...then the demand behind it returns and the storm resumes.
    expect(r.series.load[61]).toBeGreaterThan(r.series.load[59] * 0.8);
    expect(r.series.amplification[99]).toBeGreaterThanOrEqual(1);
    expect(r.phase).toBe('runaway');
    expect(r.events.join('\n')).toContain('the terrain is untouched');
  });

  it('remedies stack: restart fails, then a real remedy still drains', () => {
    const restarted = applyRemedy(storm(), 'restart-agent');
    const fixed = applyRemedy(restarted, 'decay');
    expect(fixed.series.load).toHaveLength(140);
    expect(fixed.phase).not.toBe('runaway');
    expect(fixed.series.amplification[139]).toBeLessThan(1);
  });
});

describe('exported palettes', () => {
  it('exposes the six remedies and the default knobs', () => {
    expect(REMEDIES).toHaveLength(6);
    expect(REMEDIES).toContain('restart-agent');
    expect(STORM_POLICY_DEFAULTS.maxRetries).toBe(5);
    expect(FIELD_DEFAULTS.decay).toBeCloseTo(0.1);
  });
});
