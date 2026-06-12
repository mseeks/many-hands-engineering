// Tests for loopstep.js — the five-stage loop machine.
//
// Covers: determinism (same seed, same run), the canonical green and
// close-on-red walks, and every required semantic branch of the
// six-ingredient bench: amnesia, self-approval, ossification, blast-radius
// creep, misfires, and the global trust flip.

import { describe, expect, it } from 'vitest';
import {
  defaultLoopConfig,
  runCanonical,
  runLoopWeeks,
  stepStage,
  STAGES,
} from '../src/engine/loopstep.js';

// Pinned seeds, chosen so every pathology actually fires inside the
// default 10-week window. Determinism makes these stable forever.
const SEED = 2;
const SIGNAL_SEED = 3;

const WEEK_ROW_KEYS = [
  'week',
  'proposals',
  'merged',
  'reverted',
  'defectsEscaped',
  'reviewMinutes',
  'trust',
  'events',
];

describe('defaultLoopConfig', () => {
  it('names the loop and turns all six ingredients on', () => {
    expect(defaultLoopConfig()).toEqual({
      name: 'dependency-patch',
      signal: true,
      boundedAction: true,
      verification: true,
      reversibility: true,
      signalUpdate: true,
      authoritySurface: true,
    });
  });

  it('returns a fresh object each call', () => {
    const a = defaultLoopConfig();
    const b = defaultLoopConfig();
    expect(a).not.toBe(b);
    a.verification = false;
    expect(b.verification).toBe(true);
  });
});

describe('runCanonical — one proposal through the five stages', () => {
  it('is deterministic: same seed, same trace', () => {
    expect(runCanonical(7)).toEqual(runCanonical(7));
    expect(runCanonical(7, { ciOutcome: 'red' })).toEqual(runCanonical(7, { ciOutcome: 'red' }));
  });

  it('varies the PR with the seed', () => {
    const a = runCanonical(2).steps[1].data.pr.title;
    const b = runCanonical(4).steps[1].data.pr.title;
    expect(a).not.toBe(b);
  });

  it('walks the five stages in order, with reader-facing captions', () => {
    const trace = runCanonical(SEED);
    expect(trace.seed).toBe(SEED);
    expect(trace.steps).toHaveLength(5);
    expect(trace.steps.map((s) => s.label)).toEqual(STAGES);
    expect(trace.steps.map((s) => s.data.stage)).toEqual(STAGES);
    for (const step of trace.steps) {
      expect(typeof step.caption).toBe('string');
      expect(step.caption.length).toBeGreaterThan(20);
    }
  });

  it('carries a realistic PR on every step', () => {
    const trace = runCanonical(SEED);
    for (const step of trace.steps) {
      const { pr } = step.data;
      expect(pr.title).toMatch(/^deps: bump [a-z]+ to \d+\.\d+\.\d+$/);
      expect(pr.body).toContain('Changelog');
      expect(pr.body).toContain('lockfile only');
    }
  });

  it('has no CI result before verification, green from then on', () => {
    const trace = runCanonical(SEED);
    expect(trace.steps.map((s) => s.data.ci)).toEqual([null, null, 'green', 'green', 'green']);
  });

  it('green path: merges, then records the merged outcome', () => {
    const steps = runCanonical(SEED).steps;
    expect(steps[0].data.effects[0]).toMatchObject({
      type: 'signal-fired',
      watch: 'deps.outdated(level: patch)',
    });
    expect(steps[1].data.effects[0].type).toBe('open-pr');
    expect(steps[2].data.effects[0]).toEqual({ type: 'ci-run', result: 'green' });
    expect(steps[3].data.effects.map((e) => e.type)).toEqual(['merge-pr']);
    expect(steps[4].data.effects[0]).toMatchObject({
      type: 'record-outcome',
      cls: 'patch-bump',
      outcome: 'merged',
    });
  });

  it('red path: close, comment, delete branch — then records the close', () => {
    const steps = runCanonical(SEED, { ciOutcome: 'red' }).steps;
    expect(steps.map((s) => s.data.ci)).toEqual([null, null, 'red', 'red', 'red']);
    expect(steps[3].data.effects.map((e) => e.type)).toEqual([
      'close-pr',
      'comment',
      'delete-branch',
    ]);
    expect(steps[3].data.effects[1].body).toContain('closing');
    expect(steps[4].data.effects[0].outcome).toBe('closed');
  });

  it('rejects a stage outside the five', () => {
    expect(() => stepStage('deploy', { pr: {}, ciOutcome: 'green' })).toThrow(/unknown stage/);
  });
});

describe('runLoopWeeks — determinism and shape', () => {
  it('is deterministic: same seed and config, same result', () => {
    const args = { config: { verification: false }, seed: SEED };
    expect(runLoopWeeks(args)).toEqual(runLoopWeeks(args));
    expect(runLoopWeeks({ seed: SEED })).toEqual(runLoopWeeks({ seed: SEED }));
  });

  it('defaults to 10 weeks of 4 proposals, all ingredients on', () => {
    const r = runLoopWeeks({ seed: SEED });
    expect(r.weeks).toHaveLength(10);
    expect(r.weeks.map((w) => w.week)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const row of r.weeks) {
      expect(Object.keys(row)).toEqual(WEEK_ROW_KEYS);
      expect(row.proposals).toBe(4);
    }
    expect(r.summary.name).toBe('dependency-patch');
  });

  it('runs with no arguments at all (seed 0, defaults)', () => {
    const r = runLoopWeeks();
    expect(r.weeks).toHaveLength(10);
    expect(r).toEqual(runLoopWeeks());
  });

  it('merges a partial config over the defaults', () => {
    const r = runLoopWeeks({ config: { name: 'security-patch' }, seed: SEED });
    expect(r.summary.name).toBe('security-patch');
    // Everything else stays canonical: no pathologies fire.
    expect(r.summary.totalDefectsEscaped).toBe(0);
    expect(r.summary.globalTrustFlip).toBeNull();
  });

  it('honors weeks and proposalsPerWeek', () => {
    const one = runLoopWeeks({ seed: SEED, weeks: 1 });
    expect(one.weeks).toHaveLength(1);
    const idle = runLoopWeeks({ seed: SEED, weeks: 3, proposalsPerWeek: 0 });
    for (const row of idle.weeks) {
      expect(row.proposals).toBe(0);
      expect(row.merged).toBe(0);
      expect(row.reviewMinutes).toBe(0);
      expect(row.events).toEqual([]);
    }
  });
});

describe('all six ingredients present', () => {
  const r = runLoopWeeks({ seed: SEED });

  it('review cost falls week over week as trust accrues', () => {
    const rc = r.series.reviewCost;
    for (let i = 1; i < rc.length; i++) expect(rc[i]).toBeLessThan(rc[i - 1]);
    expect(rc.at(-1)).toBeLessThan(rc[0]);
  });

  it('trust rises week over week and never passes the cap', () => {
    const tr = r.series.trust;
    for (let i = 1; i < tr.length; i++) {
      expect(tr[i]).toBeGreaterThan(tr[i - 1]);
    }
    const long = runLoopWeeks({ seed: SEED, weeks: 30 });
    for (const t of long.series.trust) expect(t).toBeLessThanOrEqual(0.95);
    // After the cap, cost plateaus but never climbs back.
    const rc = long.series.reviewCost;
    for (let i = 1; i < rc.length; i++) {
      expect(rc[i]).toBeLessThanOrEqual(rc[i - 1]);
    }
  });

  it('defects stay at zero: reversibility catches what CI misses', () => {
    expect(r.summary.totalDefectsEscaped).toBe(0);
    expect(r.series.defects).toEqual(Array(10).fill(0));
    // The catch-and-revert path actually ran; zero defects is not luck.
    expect(r.summary.totalReverted).toBeGreaterThanOrEqual(1);
    const reverts = r.weeks.flatMap((w) =>
      w.events.filter((e) => e.includes('caught and reverted')),
    );
    expect(reverts.length).toBe(r.summary.totalReverted);
  });

  it('keeps scope pinned at 1: the action stays bounded', () => {
    expect(r.series.scope).toEqual(Array(10).fill(1));
  });
});

describe('signalUpdate:false — amnesia', () => {
  const amnesia = runLoopWeeks({ config: { signalUpdate: false }, seed: SEED });
  const canonical = runLoopWeeks({ seed: SEED });

  it('trust stays flat: outcomes never land anywhere', () => {
    expect(amnesia.series.trust).toEqual(Array(10).fill(0.2));
  });

  it('review cost stays constant at the week-1 level', () => {
    const rc = amnesia.series.reviewCost;
    expect(rc.every((v) => v === rc[0])).toBe(true);
    expect(rc[0]).toBe(canonical.series.reviewCost[0]);
  });

  it('re-litigates the same finding, week after week', () => {
    const relitigated = amnesia.weeks.filter((w) =>
      w.events.some((e) => e.includes('re-litigated the same finding')),
    );
    expect(relitigated.length).toBe(10);
  });
});

describe('verification:false — self-approval', () => {
  const r = runLoopWeeks({ config: { verification: false }, seed: SEED });

  it('escaped defects grow week over week', () => {
    const d = r.series.defects;
    for (let i = 1; i < d.length; i++) {
      expect(d[i]).toBeGreaterThanOrEqual(d[i - 1]);
    }
    expect(d.at(-1)).toBeGreaterThanOrEqual(5);
    expect(d.at(-1)).toBeGreaterThan(d[0]);
  });

  it('confidence rises while quality falls: the lines cross', () => {
    const { confidence, quality } = r.summary;
    expect(confidence.at(-1)).toBeGreaterThan(confidence[0]);
    expect(quality.at(-1)).toBeLessThan(quality[0]);
    // Week 1: the self-report sits below the truth. By the end it sits above.
    expect(confidence[0]).toBeLessThan(quality[0]);
    expect(confidence.at(-1)).toBeGreaterThan(quality.at(-1));
  });

  it('review collapses to a skim: nothing outside is checking', () => {
    expect(r.series.reviewCost.every((v) => v === 4)).toBe(true);
  });
});

describe('reversibility:false — one bad merge ossifies', () => {
  const r = runLoopWeeks({ config: { reversibility: false }, seed: SEED });
  const ossifyWeek = r.weeks.find((w) => w.events.some((e) => e.includes('defect ossified')));

  it('emits the ossified event exactly once', () => {
    const all = r.weeks.flatMap((w) => w.events.filter((e) => e.includes('defect ossified')));
    expect(all).toHaveLength(1);
    expect(ossifyWeek.week).toBe(4);
  });

  it('later defects still escape; only the first ossifies', () => {
    expect(r.summary.totalDefectsEscaped).toBeGreaterThanOrEqual(2);
  });

  it('review minutes step up permanently for everything after', () => {
    const rc = r.series.reviewCost;
    const before = rc.slice(0, ossifyWeek.week);
    const after = rc.slice(ossifyWeek.week);
    expect(Math.min(...after)).toBeGreaterThan(Math.max(...before));
  });

  it('trust freezes: stewards stop extending the record', () => {
    const tr = r.series.trust;
    const frozen = tr[ossifyWeek.week - 1];
    for (const t of tr.slice(ossifyWeek.week)) expect(t).toBe(frozen);
  });
});

describe('boundedAction:false — blast radius creep', () => {
  const r = runLoopWeeks({ config: { boundedAction: false }, seed: SEED });

  it('scope grows every week and keeps growing past the limit', () => {
    const sc = r.series.scope;
    for (let i = 1; i < sc.length; i++) {
      expect(sc[i]).toBeGreaterThan(sc[i - 1]);
    }
  });

  it('marks the week scope outgrew the approval reasoning', () => {
    const week = r.summary.blastRadiusExceededWeek;
    expect(week).toBe(5);
    expect(r.series.scope[week - 1]).toBeGreaterThan(4);
    expect(r.weeks[week - 1].events).toContain(
      'blast radius exceeded the reasoning that approved it',
    );
  });
});

describe('signal:false — fires on the wrong weeks', () => {
  const r = runLoopWeeks({ config: { signal: false }, seed: SIGNAL_SEED });
  const { missedWeeks, falseFires } = r.summary;

  it('both misses and false fires occur', () => {
    expect(missedWeeks.length).toBeGreaterThan(0);
    expect(falseFires.length).toBeGreaterThan(0);
    expect(missedWeeks.filter((w) => falseFires.includes(w))).toEqual([]);
  });

  it('missed weeks: patch work existed, nothing fired', () => {
    for (const w of missedWeeks) {
      const row = r.weeks[w - 1];
      expect(row.proposals).toBe(0);
      expect(row.events.some((e) => e.includes('missed window'))).toBe(true);
    }
  });

  it('false fires: the blind schedule opened a no-op PR', () => {
    for (const w of falseFires) {
      const row = r.weeks[w - 1];
      expect(row.proposals).toBe(1);
      expect(row.merged).toBe(0);
      expect(row.events.some((e) => e.includes('false fire'))).toBe(true);
    }
  });

  it('lucky weeks still happen — quiet, or fired with real work', () => {
    const quiet = r.weeks.filter(
      (row) =>
        row.proposals === 0 && !missedWeeks.includes(row.week) && !falseFires.includes(row.week),
    );
    const normal = r.weeks.filter((row) => row.proposals === 4);
    expect(quiet.length).toBeGreaterThan(0);
    expect(normal.length).toBeGreaterThan(0);
  });
});

describe('authoritySurface:false — one global trust switch', () => {
  const r = runLoopWeeks({ config: { authoritySurface: false }, seed: SEED });
  const flip = r.summary.globalTrustFlip;

  it('one incident flips the switch, with a stated cause', () => {
    expect(flip).toMatchObject({ week: 4 });
    expect(flip.cause).toContain('global');
    expect(r.weeks[flip.week - 1].events).toContain(
      'global trust switch flipped: every class to zero at once',
    );
  });

  it("every class's trust zeroes at once and stays there", () => {
    const tr = r.series.trust;
    for (const t of tr.slice(0, flip.week - 1)) expect(t).toBeGreaterThan(0);
    for (const t of tr.slice(flip.week - 1)) expect(t).toBe(0);
    expect(Object.values(r.summary.trustByClass)).toEqual([0, 0, 0]);
  });

  it('with the surface present, the same incident stays contained', () => {
    const canonical = runLoopWeeks({ seed: SEED });
    expect(canonical.summary.globalTrustFlip).toBeNull();
    for (const t of canonical.series.trust) expect(t).toBeGreaterThan(0);
  });
});
