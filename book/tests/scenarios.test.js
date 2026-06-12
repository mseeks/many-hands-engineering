// Tests for src/engine/scenarios/ — the recorded runs.
//
// Covers: determinism for every builder (same seed, same trace, forever)
// and each scenario's named invariants: the amnesia bill, the call-free
// causal chains, the staging bet (including the dissent run that really
// shows no early penalty), the triage signatures, compounding only with
// persistence, and gaming priced only under triangulation.

import { describe, expect, it } from 'vitest';
import { amnesiaComparison, canonicalRun, redRun } from '../src/engine/scenarios/helloLoop.js';
import { causalChain, events, loops } from '../src/engine/scenarios/traceCause.js';
import {
  broadenStageOne,
  dissent,
  simulateStaging,
  skipStageZero,
  stagingRun,
} from '../src/engine/scenarios/staging.js';
import { GAUGES, TRIAGE_LABELS, triageDeck } from '../src/engine/scenarios/triage.js';
import {
  compositionRun,
  MAPPER_PARAMS,
  runMapperPopulation,
} from '../src/engine/scenarios/composition.js';
import { goodhartRun, simulateMetricGaming } from '../src/engine/scenarios/goodhart.js';

const SEED = 11;
const BET_SENTENCE = "this curve is the author's bet, drawn";

/** Every step of a trace carries a reader-facing caption. */
function expectReaderFacing(trace) {
  expect(trace.steps.length).toBeGreaterThan(0);
  for (const step of trace.steps) {
    expect(typeof step.label).toBe('string');
    expect(typeof step.caption).toBe('string');
    expect(step.caption.length).toBeGreaterThan(40);
  }
}

// ---------------------------------------------------------------------------
// helloLoop
// ---------------------------------------------------------------------------

describe('helloLoop', () => {
  it('is deterministic: same seed, same traces', () => {
    expect(canonicalRun(SEED)).toEqual(canonicalRun(SEED));
    expect(redRun(SEED)).toEqual(redRun(SEED));
    expect(amnesiaComparison(SEED)).toEqual(amnesiaComparison(SEED));
  });

  it('canonicalRun walks the five stages green', () => {
    const trace = canonicalRun(SEED);
    expectReaderFacing(trace);
    expect(trace.steps).toHaveLength(5);
    expect(trace.steps.at(-1).data.ci).toBe('green');
    expect(trace.steps[3].data.effects.map((e) => e.type)).toEqual(['merge-pr']);
  });

  it('redRun walks close-on-red: close, comment, delete branch', () => {
    const trace = redRun(SEED);
    expect(trace.steps[3].data.effects.map((e) => e.type)).toEqual([
      'close-pr',
      'comment',
      'delete-branch',
    ]);
    expect(trace.steps.at(-1).data.effects[0].outcome).toBe('closed');
  });

  it('amnesiaComparison: both loops pay the same week-one bill', () => {
    const trace = amnesiaComparison(SEED);
    expectReaderFacing(trace);
    const week1 = trace.steps[1].data;
    expect(week1.closingMinutes).toBe(week1.amnesiacMinutes);
  });

  it('amnesiaComparison: the closing loop cheapens, the amnesiac never does', () => {
    const { closing, amnesiac } = amnesiaComparison(SEED).steps[0].data;
    const rcClose = closing.series.reviewCost;
    const rcAmnesia = amnesiac.series.reviewCost;
    for (let i = 1; i < rcClose.length; i++) expect(rcClose[i]).toBeLessThan(rcClose[i - 1]);
    expect(rcAmnesia.every((v) => v === rcAmnesia[0])).toBe(true);
    expect(amnesiac.series.trust.every((v) => v === amnesiac.series.trust[0])).toBe(true);
  });

  it('amnesiaComparison: the bill is the sum of the gap, and it is positive', () => {
    const payoff = amnesiaComparison(SEED).steps.at(-1).data;
    expect(payoff.billMinutes).toBeGreaterThan(0);
    expect(payoff.billMinutes).toBe(payoff.totals.amnesiac - payoff.totals.closing);
    expect(payoff.relitigated).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// traceCause
// ---------------------------------------------------------------------------

describe('traceCause', () => {
  it('is a fixed history: ten events, five loops, book.css colors', () => {
    expect(events).toHaveLength(10);
    expect(loops).toHaveLength(5);
    for (const loop of loops) {
      expect(loop.color).toMatch(/^var\(--c-[a-z]+\)$/);
      expect(loop.name.length).toBeGreaterThan(0);
    }
    const ids = new Set(loops.map((l) => l.id));
    expect(ids.size).toBe(5);
    for (const e of events) {
      expect(e.loop === 'terrain' || ids.has(e.loop)).toBe(true);
    }
  });

  it('carries the real zod shape: bump merged, removal proposed days later', () => {
    const merge = events.find((e) => e.id === 'dp-merge');
    const removal = events.find((e) => e.id === 'dc-propose');
    expect(merge.loop).toBe('dep-patch');
    expect(removal.loop).toBe('dead-code');
    expect(removal.day - merge.day).toBeGreaterThanOrEqual(2);
    expect(merge.caption).toContain('zod');
    expect(removal.caption).toContain('remove zod');
  });

  it('every read points at an event that actually wrote that artifact', () => {
    const byId = new Map(events.map((e) => [e.id, e]));
    for (const e of events) {
      for (const read of e.reads) {
        const writer = byId.get(read.wroteBy);
        expect(writer).toBeDefined();
        expect(writer.writes).toContain(read.artifact);
        expect(writer.day).toBeLessThanOrEqual(e.day);
      }
    }
  });

  it('every causal hop is a terrain READ, never a CALL', () => {
    for (const e of events) {
      const { hops } = causalChain(e.id);
      for (const hop of hops) {
        expect(hop.kind).toBe('READ');
        expect(hop.label).toContain('READ');
        expect(hop.label).toContain('WRITTEN');
        expect(hop.label.toUpperCase()).not.toContain('CALL');
      }
    }
  });

  it('every chain terminates in the signal in the terrain', () => {
    for (const e of events) {
      const { terminal } = causalChain(e.id);
      expect(terminal.id).toBe('sig-zod-patch');
      expect(terminal.artifact).toBe('signals/deps.outdated');
      expect(terminal.note).toContain('signal in the terrain');
    }
  });

  it('the final outcome traces back through loops and terrain alike', () => {
    const { hops } = causalChain('dc-removal-merge');
    const touched = new Set();
    const byId = new Map(events.map((e) => [e.id, e]));
    for (const hop of hops) {
      touched.add(byId.get(hop.from).loop);
      touched.add(byId.get(hop.to).loop);
    }
    // The removal's causes: triage ranked it, dead-code mapped it, the
    // bump dep-patch merged orphaned it, and the terrain carried it all.
    for (const id of ['dead-code', 'triage', 'dep-patch', 'terrain']) {
      expect(touched.has(id)).toBe(true);
    }
  });

  it('all five loops appear in the history, even where they are not causes', () => {
    const actors = new Set(events.map((e) => e.loop));
    for (const loop of loops) expect(actors.has(loop.id)).toBe(true);
  });

  it('is deterministic and rejects unknown events', () => {
    expect(causalChain('dc-propose')).toEqual(causalChain('dc-propose'));
    expect(() => causalChain('orchestrator')).toThrow(/unknown event/);
  });
});

// ---------------------------------------------------------------------------
// staging (bet register)
// ---------------------------------------------------------------------------

describe('staging', () => {
  it('is deterministic: same seed, same traces', () => {
    expect(stagingRun(SEED)).toEqual(stagingRun(SEED));
    expect(skipStageZero(SEED)).toEqual(skipStageZero(SEED));
    expect(broadenStageOne(SEED)).toEqual(broadenStageOne(SEED));
    expect(dissent(SEED)).toEqual(dissent(SEED));
  });

  it('every payoff caption says the bet sentence, verbatim', () => {
    for (const build of [stagingRun, skipStageZero, broadenStageOne, dissent]) {
      const trace = build(SEED);
      expectReaderFacing(trace);
      expect(trace.steps.at(-1).caption).toContain(BET_SENTENCE);
    }
  });

  it('stagingRun: the cost-of-the-nth-loop curve bends down', () => {
    const { costs } = simulateStaging(SEED);
    expect(costs.length).toBeGreaterThanOrEqual(10);
    for (let i = 1; i < costs.length; i++) expect(costs[i]).toBeLessThan(costs[i - 1]);
    expect(costs.at(-1)).toBeLessThan(0.4 * costs[0]);
  });

  it('stagingRun: yield compounds — the second half out-earns the first', () => {
    const { rows } = simulateStaging(SEED);
    const half = rows[Math.floor(rows.length / 2) - 1].cumYield;
    const total = rows.at(-1).cumYield;
    expect(total - half).toBeGreaterThan(2 * half);
  });

  it('stagingRun: stages 0 through 6 all arrive, then autonomy is re-earned', () => {
    const { events: stageEvents } = simulateStaging(SEED);
    for (const n of [0, 1, 2, 3, 4, 5, 6]) {
      expect(stageEvents.some((e) => e.label.startsWith(`stage ${n}`))).toBe(true);
    }
    expect(stageEvents.some((e) => e.label.includes('re-earned'))).toBe(true);
  });

  it('skipStageZero: a real head start, then the bill', () => {
    const skip = simulateStaging(SEED, { skipStage0: true });
    const staged = simulateStaging(SEED);
    // Ahead early (it shipped a month sooner)...
    expect(skip.rows[9].cumYield).toBeGreaterThan(staged.rows[9].cumYield);
    // ...far behind by the end: no compounding ever arrived.
    expect(skip.rows.at(-1).cumYield).toBeLessThan(0.45 * staged.rows.at(-1).cumYield);
  });

  it('skipStageZero: the ghost — activity holds while the cost curve stays flat', () => {
    const skip = simulateStaging(SEED, { skipStage0: true });
    const staged = simulateStaging(SEED);
    const meanPrs = (run) => run.rows.reduce((a, r) => a + r.prs, 0) / run.rows.length;
    expect(meanPrs(skip)).toBeGreaterThan(0.85 * meanPrs(staged));
    expect(skip.costs.at(-1)).toBeGreaterThan(0.75 * skip.costs[0]);
  });

  it('broadenStageOne: the dozen simple loops compound past the one deep loop', () => {
    const broad = simulateStaging(SEED, { broaden: true });
    const staged = simulateStaging(SEED);
    const crossing = staged.rows.findIndex((r, i) => r.cumYield > broad.rows[i].cumYield);
    expect(crossing).toBeGreaterThan(0);
    expect(crossing).toBeLessThan(20);
    for (let i = crossing; i < staged.rows.length; i++) {
      expect(staged.rows[i].cumYield).toBeGreaterThan(broad.rows[i].cumYield);
    }
    expect(staged.rows.at(-1).cumYield).toBeGreaterThan(2 * broad.rows.at(-1).cumYield);
  });

  it('dissent: skipping Stage 0 really shows no early penalty at small N', () => {
    const opts = { weeks: 40, conventions: 0.9, maxLoops: 3 };
    const skip = simulateStaging(SEED, { ...opts, skipStage0: true });
    const staged = simulateStaging(SEED, opts);
    // The named invariant: never behind, any week, the whole window.
    for (let i = 0; i < 40; i++) {
      expect(skip.rows[i].cumYield).toBeGreaterThanOrEqual(staged.rows[i].cumYield);
    }
    // And the finals are a wash: the bet's punishment never arrived.
    const ratio = skip.rows.at(-1).cumYield / staged.rows.at(-1).cumYield;
    expect(ratio).toBeGreaterThanOrEqual(1);
    expect(ratio).toBeLessThan(1.1);
  });

  it('dissent: the trace says where the bet loses, honestly', () => {
    const trace = dissent(SEED);
    expect(trace.steps.at(-1).caption).toContain('where it loses');
    expect(trace.steps[1].data.skipRows).toHaveLength(40);
    expect(trace.steps[1].data.stagedRows).toHaveLength(40);
  });
});

// ---------------------------------------------------------------------------
// triage
// ---------------------------------------------------------------------------

describe('triage', () => {
  const deck = triageDeck(SEED);
  const byLabel = (label) => deck.filter((c) => c.label === label);

  it('is deterministic: same seed, same deal', () => {
    expect(triageDeck(SEED)).toEqual(triageDeck(SEED));
  });

  it('different seeds deal in different orders, same ten cards', () => {
    const other = triageDeck(SEED + 1);
    expect(other.map((c) => c.id)).not.toEqual(deck.map((c) => c.id));
    expect([...other].map((c) => c.id).sort()).toEqual([...deck].map((c) => c.id).sort());
  });

  it('deals ten cards, two per signature, five gauges over a fortnight', () => {
    expect(deck).toHaveLength(10);
    for (const label of TRIAGE_LABELS) expect(byLabel(label)).toHaveLength(2);
    for (const card of deck) {
      expect(card.days).toBe(14);
      expect(card.tell.length).toBeGreaterThan(20);
      expect(Object.keys(card.gauges).sort()).toEqual(GAUGES.map((g) => g.id).sort());
      for (const g of Object.values(card.gauges)) {
        expect(g).toHaveLength(14);
        for (const v of g) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('varies the surface: ten distinct settings, none a dep bump', () => {
    const surfaces = new Set(deck.map((c) => c.surface));
    expect(surfaces.size).toBe(10);
    for (const s of surfaces) expect(s).not.toMatch(/dependency|dep bump/i);
  });

  it('carries the canonical tell on a runaway card', () => {
    const tells = deck.map((c) => c.tell);
    expect(tells).toContain(
      'escalations went to zero while throughput held; silence is not health',
    );
  });

  it('healthy: escalations rare but real, signals tracking outcomes', () => {
    for (const card of byLabel('healthy')) {
      for (const v of card.gauges.escalations) {
        expect(v).toBeGreaterThan(0.05);
        expect(v).toBeLessThan(0.35);
      }
      for (const v of card.gauges.signalOutcome) expect(v).toBeGreaterThan(0.75);
    }
  });

  it('emergent-runaway-forming: escalations die while throughput holds', () => {
    for (const card of byLabel('emergent-runaway-forming')) {
      const { escalations, flow, signalOutcome, variety } = card.gauges;
      expect(escalations.at(-1)).toBeLessThanOrEqual(0.03);
      expect(flow.at(-1)).toBeGreaterThanOrEqual(flow[0]);
      expect(signalOutcome[0] - signalOutcome.at(-1)).toBeGreaterThan(0.2);
      expect(variety[0] - variety.at(-1)).toBeGreaterThan(0.25);
    }
  });

  it('planned-stall: completion sags while escalations climb', () => {
    for (const card of byLabel('planned-stall')) {
      expect(card.gauges.flow[0] - card.gauges.flow.at(-1)).toBeGreaterThan(0.3);
      expect(card.gauges.escalations.at(-1) - card.gauges.escalations[0]).toBeGreaterThan(0.25);
    }
  });

  it('hybrid-theatre: every gauge flatlines while signal-outcome leaks', () => {
    for (const card of byLabel('hybrid-theatre')) {
      for (const id of ['variety', 'flow', 'escalations', 'commons']) {
        const g = card.gauges[id];
        expect(Math.max(...g) - Math.min(...g)).toBeLessThan(0.05);
      }
      expect(card.gauges.signalOutcome.at(-1)).toBeLessThan(card.gauges.signalOutcome[0]);
    }
  });

  it('over-stabilized: the day-8 dent never re-rounds', () => {
    for (const card of byLabel('over-stabilized')) {
      const { variety, escalations, commons, flow } = card.gauges;
      for (const v of variety) expect(v).toBeLessThan(0.2);
      for (const v of escalations) expect(v).toBeLessThan(0.05);
      for (const v of commons) expect(v).toBeGreaterThan(0.9);
      expect(flow[7] - flow.at(-1)).toBeGreaterThan(0.15); // the dent
      expect(flow.at(-1)).toBeLessThanOrEqual(flow[8] + 0.05); // no recovery
    }
  });
});

// ---------------------------------------------------------------------------
// composition
// ---------------------------------------------------------------------------

describe('composition', () => {
  const COMP_SEED = 73;
  const stdout = runMapperPopulation(COMP_SEED, { persist: false });
  const persisted = runMapperPopulation(COMP_SEED, { persist: true });

  it('is deterministic: same seed, same runs and trace', () => {
    expect(runMapperPopulation(COMP_SEED, { persist: true })).toEqual(persisted);
    expect(compositionRun(COMP_SEED)).toEqual(compositionRun(COMP_SEED));
  });

  it('maps on stdout: targeting never moves off the blind baseline', () => {
    expect(stdout.perTick).toHaveLength(60);
    expect(stdout.perTick.every((v) => v === stdout.perTick[0])).toBe(true);
  });

  it('maps persisted: targeting climbs well above the baseline and stays', () => {
    const baseline = stdout.perTick[0];
    const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(persisted.perTick.slice(-15))).toBeGreaterThan(baseline + 0.1);
    // Persistence never costs: with the outside reference on, the field
    // is never a worse guide than blind picking.
    for (const v of persisted.perTick) expect(v).toBeGreaterThanOrEqual(baseline - 0.02);
  });

  it('compounds only with persistence: the cumulative gap widens every quarter', () => {
    const gaps = [15, 30, 45, 60].map(
      (t) => persisted.cumulative[t - 1] - stdout.cumulative[t - 1],
    );
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeGreaterThan(gaps[i - 1]);
    expect(persisted.cumulative.at(-1)).toBeGreaterThan(1.2 * stdout.cumulative.at(-1));
  });

  it('both runs share the world: same params, same starting field', () => {
    expect(MAPPER_PARAMS.outsideRef).toBe(true);
    expect(stdout.perTick[0]).toBe(persisted.perTick[0]);
  });

  it('the trace tells the comparison, payoff last', () => {
    const trace = compositionRun(COMP_SEED);
    expectReaderFacing(trace);
    expect(trace.steps).toHaveLength(4);
    expect(trace.steps[1].caption).toContain('zero shared signals');
    const payoff = trace.steps.at(-1);
    expect(payoff.data.gap).toBeGreaterThan(0);
    for (let i = 1; i < payoff.data.gapAtQuarters.length; i++) {
      expect(payoff.data.gapAtQuarters[i]).toBeGreaterThan(payoff.data.gapAtQuarters[i - 1]);
    }
  });
});

// ---------------------------------------------------------------------------
// goodhart
// ---------------------------------------------------------------------------

describe('goodhart', () => {
  const G_SEED = 5;
  const single = simulateMetricGaming(G_SEED, { triangulated: false });
  const tri = simulateMetricGaming(G_SEED, { triangulated: true });

  it('is deterministic: same seed, same series and trace', () => {
    expect(simulateMetricGaming(G_SEED, { triangulated: false })).toEqual(single);
    expect(goodhartRun(G_SEED)).toEqual(goodhartRun(G_SEED));
  });

  it('single target: the metric climbs while sampled outcomes fall', () => {
    const first = single.weeks[0];
    const last = single.weeks.at(-1);
    expect(last.velocity).toBeGreaterThan(1.5 * first.velocity);
    expect(last.sampledOutcome).toBeLessThan(first.sampledOutcome - 0.2);
    expect(single.onPanel).toEqual(['velocity']);
    expect(single.detection).toBeNull();
  });

  it('single target: the cost is real off-panel too — just unwatched', () => {
    const first = single.weeks[0];
    const last = single.weeks.at(-1);
    expect(last.changeFailure).toBeGreaterThan(2 * first.changeFailure);
    expect(last.rollback).toBeGreaterThan(2 * first.rollback);
  });

  it('triangulated: the gaming becomes visible cost in the other two metrics', () => {
    expect(tri.onPanel).toEqual(['velocity', 'changeFailure', 'rollback']);
    expect(tri.detection).not.toBeNull();
    const atDetection = tri.weeks[tri.detection.week - 1];
    expect(atDetection.changeFailure).toBeGreaterThanOrEqual(0.08);
    expect(atDetection.rollback).toBeGreaterThan(tri.weeks[0].rollback);
  });

  it('triangulated: after the price is read, velocity gives back its gains', () => {
    const peak = Math.max(...tri.weeks.map((w) => w.velocity));
    const last = tri.weeks.at(-1);
    expect(last.velocity).toBeLessThan(0.8 * peak);
    // Real outcomes recover once the gaming stops paying.
    const worst = Math.min(...tri.weeks.map((w) => w.sampledOutcome));
    expect(last.sampledOutcome).toBeGreaterThan(worst + 0.1);
  });

  it('the trace prices the gaming rather than claiming to prevent it', () => {
    const trace = goodhartRun(G_SEED);
    expectReaderFacing(trace);
    expect(trace.steps).toHaveLength(4);
    expect(trace.steps.at(-1).caption).toContain('price');
    expect(trace.steps[2].data.detection.week).toBe(tri.detection.week);
  });
});
