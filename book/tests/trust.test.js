// trust.test.js — the environment-stamped ledger (ENGINE-SPEC trust.js).
// Pins: determinism, every required event semantic, each property's
// characteristic surprise when disabled, and the firstBlocker strings.

import { describe, it, expect } from 'vitest';
import {
  makeTrustState,
  addOutcome,
  evaluateGate,
  applyEvent,
  counterfactualRun,
  ledgerClasses,
  DEFAULT_POLICY,
  DEFAULT_PROPERTIES,
} from '../src/engine/trust.js';

/** Add n outcomes of one kind to a class. */
function record(state, cls, outcome, n) {
  let s = state;
  for (let i = 0; i < n; i += 1) s = addOutcome(s, { cls, outcome });
  return s;
}

describe('makeTrustState', () => {
  it('matches the spec shape exactly', () => {
    expect(makeTrustState()).toEqual({
      rows: [],
      env: { model: 'judge-v1', perms: ['deps'], repoShape: 'v1' },
      week: 0,
    });
  });
});

describe('addOutcome', () => {
  it('stamps rows with the current env and week, without mutating the input', () => {
    const s0 = makeTrustState();
    const s1 = addOutcome(s0, { cls: 'deps', outcome: 'merged' });
    expect(s0.rows).toEqual([]); // input untouched
    expect(s1.rows).toEqual([
      {
        cls: 'deps',
        outcome: 'merged',
        week: 0,
        env: { model: 'judge-v1', perms: ['deps'], repoShape: 'v1' },
      },
    ]);
  });

  it('stamps are snapshots: a later model swap does not rewrite old rows', () => {
    let s = addOutcome(makeTrustState(), { cls: 'deps', outcome: 'merged' });
    s = applyEvent(s, { type: 'model-swap' });
    expect(s.rows[0].env.model).toBe('judge-v1');
    expect(s.env.model).toBe('judge-v2');
  });

  it('rejects unknown outcomes and missing cls', () => {
    const s = makeTrustState();
    expect(() => addOutcome(s, { cls: 'deps', outcome: 'approved' })).toThrow(/unknown outcome/);
    expect(() => addOutcome(s, { outcome: 'merged' })).toThrow(/cls is required/);
  });
});

describe('evaluateGate — earning', () => {
  it('a blank ledger is not earned: only 0/5 decided recently', () => {
    const g = evaluateGate(makeTrustState(), 'deps');
    expect(g).toEqual({
      earned: false,
      rate: 0,
      decided: 0,
      firstBlocker: 'only 0/5 decided recently',
    });
  });

  it('four merges is still short of the bar; the fifth earns the grant', () => {
    const four = record(makeTrustState(), 'deps', 'merged', 4);
    expect(evaluateGate(four, 'deps').firstBlocker).toBe('only 4/5 decided recently');

    const five = record(four, 'deps', 'merged', 1);
    expect(evaluateGate(five, 'deps')).toEqual({
      earned: true,
      rate: 1,
      decided: 5,
      firstBlocker: null,
    });
  });

  it("closed rows sit on the ledger but don't count as decided", () => {
    let s = record(makeTrustState(), 'deps', 'closed', 5);
    s = record(s, 'deps', 'merged', 2);
    const g = evaluateGate(s, 'deps');
    expect(g.decided).toBe(2);
    expect(g.rate).toBe(1); // closed rows never reached the codebase
    expect(g.firstBlocker).toBe('only 2/5 decided recently');
  });

  it('a low merge rate blocks once the revert tolerance allows reverts at all', () => {
    let s = record(makeTrustState(), 'deps', 'merged', 10);
    s = record(s, 'deps', 'reverted', 2);
    const g = evaluateGate(s, 'deps', { defectTolerance: 2 });
    expect(g.earned).toBe(false);
    expect(g.rate).toBeCloseTo(10 / 12, 10);
    expect(g.firstBlocker).toBe('merge rate 83% below the 95% bar');
  });

  it('a rate exactly at the bar passes', () => {
    let s = record(makeTrustState(), 'deps', 'merged', 19);
    s = record(s, 'deps', 'reverted', 1);
    const g = evaluateGate(s, 'deps', { defectTolerance: 1 });
    expect(g.rate).toBe(0.95);
    expect(g.earned).toBe(true);
  });
});

describe('evaluateGate — revocable', () => {
  it('one revert revokes instantly at the default zero tolerance', () => {
    let s = record(makeTrustState(), 'deps', 'merged', 9);
    s = record(s, 'deps', 'reverted', 1);
    const g = evaluateGate(s, 'deps');
    expect(g.earned).toBe(false);
    expect(g.firstBlocker).toBe('revoked: 1 revert this window');
  });

  it('pluralizes: two reverts read as reverts', () => {
    let s = record(makeTrustState(), 'deps', 'merged', 9);
    s = record(s, 'deps', 'reverted', 2);
    expect(evaluateGate(s, 'deps').firstBlocker).toBe('revoked: 2 reverts this window');
  });

  it('surprise with revocable off: a fresh revert and the gate stays green', () => {
    let s = record(makeTrustState(), 'deps', 'merged', 19);
    s = record(s, 'deps', 'reverted', 1);
    expect(evaluateGate(s, 'deps').earned).toBe(false); // with it on: revoked
    const g = evaluateGate(s, 'deps', {}, { revocable: false });
    expect(g.earned).toBe(true); // the long record buoys the rate to exactly 0.95
    expect(g.firstBlocker).toBeNull();
  });
});

describe('evaluateGate — narrow', () => {
  it("trust on one class earns nothing on another: schema-changes can't ride deps", () => {
    const s = record(makeTrustState(), 'deps', 'merged', 10);
    const g = evaluateGate(s, 'schema-changes');
    expect(g.earned).toBe(false);
    expect(g.firstBlocker).toBe('only 0/5 decided recently');
  });

  it('surprise with narrow off: a class with zero history shows earned', () => {
    const s = record(makeTrustState(), 'deps', 'merged', 10);
    const g = evaluateGate(s, 'schema-changes', {}, { narrow: false });
    expect(g.earned).toBe(true);
    expect(g.decided).toBe(10); // riding the whole ledger
  });
});

describe('applyEvent — model-swap', () => {
  const earned = record(makeTrustState(), 'deps', 'merged', 8);

  it('resets every class with zero failures on the ledger', () => {
    const s = applyEvent(earned, { type: 'model-swap' });
    expect(s.rows.every((r) => r.outcome !== 'reverted')).toBe(true); // zero failures
    for (const cls of ledgerClasses(s)) {
      const g = evaluateGate(s, cls);
      expect(g.earned).toBe(false);
      expect(g.firstBlocker).toBe('environment changed: judge-v2 has no record here');
    }
  });

  it('honors an explicit model name and bumps versionless names', () => {
    expect(applyEvent(earned, { type: 'model-swap', model: 'judge-next' }).env.model).toBe(
      'judge-next',
    );
    const oddball = {
      ...makeTrustState(),
      env: { model: 'judge', perms: ['deps'], repoShape: 'v1' },
    };
    expect(applyEvent(oddball, { type: 'model-swap' }).env.model).toBe('judge-v2');
  });

  it('does not mutate the input state', () => {
    applyEvent(earned, { type: 'model-swap' });
    expect(earned.env.model).toBe('judge-v1');
  });

  it('surprise with conditional off: the stale record keeps the grant alive', () => {
    const s = applyEvent(earned, { type: 'model-swap' });
    expect(evaluateGate(s, 'deps', {}, { conditional: false }).earned).toBe(true);
  });

  it('the new judge re-earns from zero: partial fresh record reads as 2/5', () => {
    let s = applyEvent(earned, { type: 'model-swap' });
    s = record(s, 'deps', 'merged', 2);
    const g = evaluateGate(s, 'deps');
    expect(g.firstBlocker).toBe('only 2/5 decided recently'); // env blocker clears
    expect(evaluateGate(record(s, 'deps', 'merged', 3), 'deps').earned).toBe(true);
  });
});

describe('applyEvent — permission-widen', () => {
  it('old classes keep their grant; the new surface starts at zero', () => {
    let s = record(makeTrustState(), 'deps', 'merged', 6);
    s = applyEvent(s, { type: 'permission-widen', perm: 'docs' });
    expect(s.env.perms).toEqual(['deps', 'docs']);
    expect(evaluateGate(s, 'deps').earned).toBe(true); // grant holds
    expect(evaluateGate(s, 'docs').firstBlocker).toBe('only 0/5 decided recently');
  });

  it('defaults the new perm and never duplicates an existing one', () => {
    const s1 = applyEvent(makeTrustState(), { type: 'permission-widen' });
    expect(s1.env.perms).toEqual(['deps', 'docs']);
    const s2 = applyEvent(s1, { type: 'permission-widen', perm: 'docs' });
    expect(s2.env.perms).toEqual(['deps', 'docs']);
  });
});

describe('applyEvent — refactor', () => {
  it('a reshaped repo invalidates the record and the blocker says so', () => {
    let s = record(makeTrustState(), 'deps', 'merged', 6);
    s = applyEvent(s, { type: 'refactor' });
    expect(s.env.repoShape).toBe('v2');
    const g = evaluateGate(s, 'deps');
    expect(g.earned).toBe(false);
    expect(g.firstBlocker).toBe('environment changed: repo reshaped to v2 since this record');
  });
});

describe('applyEvent — idle and expiring', () => {
  const earned = record(makeTrustState(), 'deps', 'merged', 6);

  it('a bare idle event advances one full window and the record ages out', () => {
    const s = applyEvent(earned, { type: 'idle' });
    expect(s.week).toBe(DEFAULT_POLICY.windowWeeks);
    const g = evaluateGate(s, 'deps');
    expect(g.earned).toBe(false);
    expect(g.firstBlocker).toBe('only 0/5 decided recently');
  });

  it('a shorter idle keeps the window full', () => {
    const s = applyEvent(earned, { type: 'idle', weeks: 6 });
    expect(evaluateGate(s, 'deps').earned).toBe(true);
  });

  it('surprise with expiring off: months idle and the grant never sags', () => {
    const s = applyEvent(earned, { type: 'idle', weeks: 52 });
    expect(evaluateGate(s, 'deps').earned).toBe(false);
    expect(evaluateGate(s, 'deps', {}, { expiring: false }).earned).toBe(true);
  });
});

describe('applyEvent — revert', () => {
  it('lands a reverted row and revocation falls out of the gate instantly', () => {
    let s = record(makeTrustState(), 'deps', 'merged', 8);
    expect(evaluateGate(s, 'deps').earned).toBe(true);
    s = applyEvent(s, { type: 'revert', cls: 'deps' });
    expect(s.rows.at(-1)).toMatchObject({ cls: 'deps', outcome: 'reverted', week: 0 });
    const g = evaluateGate(s, 'deps');
    expect(g.earned).toBe(false);
    expect(g.firstBlocker).toBe('revoked: 1 revert this window');
  });
});

describe('applyEvent — unknown', () => {
  it('throws on an unknown event type', () => {
    expect(() => applyEvent(makeTrustState(), { type: 'reboot' })).toThrow(/unknown event type/);
  });
});

describe('evaluateGate — earned off (trust by fiat)', () => {
  it('surprise: a class with no history at all gets the grant', () => {
    const g = evaluateGate(makeTrustState(), 'deps', {}, { earned: false });
    expect(g).toEqual({ earned: true, rate: 0, decided: 0, firstBlocker: null });
  });

  it('fiat trust still loses to a revert when revocable stays on', () => {
    const s = applyEvent(makeTrustState(), { type: 'revert', cls: 'deps' });
    const g = evaluateGate(s, 'deps', {}, { earned: false });
    expect(g.earned).toBe(false);
    expect(g.firstBlocker).toBe('revoked: 1 revert this window');
  });
});

describe('evaluateGate — env blocker variants', () => {
  it('names the permission shift when only the perms stamp mismatches', () => {
    // No event removes perms, so build the narrowed state by hand.
    const s0 = record(makeTrustState(), 'deps', 'merged', 6);
    const s = { ...s0, env: { ...s0.env, perms: ['docs'] } };
    expect(evaluateGate(s, 'deps').firstBlocker).toBe(
      'environment changed: permissions shifted since this record',
    );
  });
});

describe('ledgerClasses', () => {
  it('returns unique classes in first-appearance order', () => {
    let s = addOutcome(makeTrustState(), { cls: 'deps', outcome: 'merged' });
    s = addOutcome(s, { cls: 'docs', outcome: 'closed' });
    s = addOutcome(s, { cls: 'deps', outcome: 'merged' });
    expect(ledgerClasses(s)).toEqual(['deps', 'docs']);
  });
});

describe('counterfactualRun', () => {
  const swapped = applyEvent(record(makeTrustState(), 'deps', 'merged', 8), {
    type: 'model-swap',
  });

  it('is deterministic: same state and seed, same defects, forever', () => {
    const a = counterfactualRun(swapped, { weeks: 12, seed: 42 });
    const b = counterfactualRun(swapped, { weeks: 12, seed: 42 });
    expect(a).toEqual(b);
  });

  it('surfaces a defect cluster weeks after the swap, not the day of it', () => {
    const { defects } = counterfactualRun(swapped, { weeks: 12, seed: 42 });
    expect(defects.length).toBeGreaterThan(0);
    expect(defects.every((d) => d.cls === 'deps')).toBe(true);
    expect(Math.min(...defects.map((d) => d.week))).toBeGreaterThanOrEqual(4); // merge lag
    const weeks = defects.map((d) => d.week);
    expect(weeks).toEqual([...weeks].sort((x, y) => x - y)); // ascending
  });

  it('defaults to a 12-week horizon', () => {
    const a = counterfactualRun(swapped, { seed: 7 });
    const b = counterfactualRun(swapped, { weeks: 12, seed: 7 });
    expect(a).toEqual(b);
  });

  it('surfaces nothing when no class is riding stale trust', () => {
    const healthy = record(makeTrustState(), 'deps', 'merged', 8); // earned, env current
    expect(counterfactualRun(healthy, { weeks: 12, seed: 42 }).defects).toEqual([]);

    const blank = applyEvent(makeTrustState(), { type: 'model-swap' }); // nothing to ride
    expect(counterfactualRun(blank, { weeks: 12, seed: 42 }).defects).toEqual([]);
  });
});

describe('defaults', () => {
  it('exports the spec defaults, frozen', () => {
    expect(DEFAULT_POLICY).toEqual({
      minRate: 0.95,
      minDecided: 5,
      windowWeeks: 13,
      defectTolerance: 0,
    });
    expect(DEFAULT_PROPERTIES).toEqual({
      earned: true,
      narrow: true,
      conditional: true,
      revocable: true,
      expiring: true,
    });
    expect(Object.isFrozen(DEFAULT_POLICY)).toBe(true);
    expect(Object.isFrozen(DEFAULT_PROPERTIES)).toBe(true);
  });
});
