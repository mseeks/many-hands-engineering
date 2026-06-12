// checkride.test.js — the capstone terrain (ENGINE-SPEC scenarios/checkride.js).
// Pins: determinism, the twelve-action cap, the terrain law on the action
// panel, every embedded problem discoverable, the debrief assembled from the
// reader's own log (verbatim, never a score), and the Monday memo's five
// sections plus its sanity-check warnings.

import { describe, it, expect } from 'vitest';
import {
  generateCheckride,
  availableActions,
  applyAction,
  debrief,
  mondayMemo,
  MAX_ACTIONS,
  gatedInflow,
} from '../src/engine/scenarios/checkride.js';

const PROBLEM_IDS = [
  'misplaced-decision',
  'open-loop',
  'forming-spiral',
  'saturated-budget',
  'stale-trust',
  'decorative-guardrail',
];

// One instrument per problem: six actions, all six problems found.
const DISCOVERY = [
  'map-placement',
  'walk-loop-anatomy',
  'chart-eval-divergence',
  'audit-budget',
  'read-trust-ledger',
  'grade-guardrails',
];

// One terrain change per problem: with DISCOVERY, exactly twelve actions.
const FIXES = [
  'add-human-gate',
  'add-update-block',
  'add-outside-reference',
  'move-gate-dbt',
  'revoke-stale-grant',
  'right-size-rate-limit',
];

// Every fix action's problem, for the cold-fix discovery test.
const FIX_TOUCHES = {
  'add-human-gate': 'misplaced-decision',
  'add-quarantine': 'misplaced-decision',
  'add-update-block': 'open-loop',
  'add-outside-reference': 'forming-spiral',
  'add-decay': 'forming-spiral',
  'move-gate-dbt': 'saturated-budget',
  'revoke-stale-grant': 'stale-trust',
  'right-size-rate-limit': 'decorative-guardrail',
};

function runActions(state, ids) {
  let s = state;
  for (const id of ids) s = applyAction(s, id);
  return s;
}

describe('determinism', () => {
  it('same seed, same checkride — deep equal', () => {
    expect(generateCheckride(11)).toEqual(generateCheckride(11));
  });

  it('same seed and same action sequence, same end state and debrief', () => {
    const a = runActions(generateCheckride(7), [...DISCOVERY, ...FIXES]);
    const b = runActions(generateCheckride(7), [...DISCOVERY, ...FIXES]);
    expect(a).toEqual(b);
    expect(debrief(a)).toEqual(debrief(b));
  });

  it('different seeds produce different terrain numbers', () => {
    expect(generateCheckride(1).terrain).not.toEqual(generateCheckride(2).terrain);
  });

  it('applyAction never mutates the input state', () => {
    const s0 = generateCheckride(3);
    const before = JSON.stringify(s0);
    applyAction(s0, 'audit-budget');
    expect(JSON.stringify(s0)).toBe(before);
  });
});

describe('the generated terrain', () => {
  it('is a data/ML-pipeline shop with all six problems embedded, unfound', () => {
    const s = generateCheckride(5);
    expect(s.terrain.shop.name).toBe('Skylark Data');
    expect(s.terrain.regions).toContain('feature-store/');
    expect(s.problems.map((p) => p.id)).toEqual(PROBLEM_IDS);
    for (const p of s.problems) {
      expect(p.found).toBe(false);
      expect(p.fixed).toBe(false);
      expect(p.handbookSays.length).toBeGreaterThan(0);
    }
  });

  it('embeds the saturated budget on every seed: gated inflow over the line', () => {
    for (const seed of [1, 2, 3, 4, 5, 99]) {
      const { approvals } = generateCheckride(seed).terrain;
      expect(gatedInflow(approvals)).toBeGreaterThan(approvals.budget * (1 - approvals.tolerance));
    }
  });

  it('embeds the open loop (no update stage) and the stale grant (judge-v1 stamp)', () => {
    const { terrain } = generateCheckride(8);
    const fixer = terrain.loops.find((l) => l.id === 'drift-fixer');
    expect(fixer.stages.update).toBeNull();
    const grant = terrain.grants.find((g) => g.cls === 'transform-bump');
    expect(grant.earnedUnder.judge).toBe('judge-v1');
    expect(terrain.env.judge).toBe('judge-v2');
    expect(grant.record.reverted).toBe(0); // zero failures: lag, not safety
  });
});

describe('the instrument panel (terrain law)', () => {
  it('offers at least 10 distinct terrain actions with id, label, kind', () => {
    const actions = availableActions(generateCheckride(1));
    expect(actions.length).toBeGreaterThanOrEqual(10);
    expect(new Set(actions.map((a) => a.id)).size).toBe(actions.length);
    for (const a of actions) {
      expect(typeof a.id).toBe('string');
      expect(typeof a.label).toBe('string');
      expect(typeof a.kind).toBe('string');
    }
  });

  it('no action commands an agent', () => {
    for (const a of availableActions(generateCheckride(1))) {
      expect(a.label).not.toMatch(/\bagents?\b/i);
      expect(a.label).not.toMatch(/restart|reprompt|re-?prompt|instruct|retrain the/i);
    }
  });

  it('every action applies cleanly from a fresh state and logs what it caused', () => {
    const ids = availableActions(generateCheckride(2)).map((a) => a.id);
    for (const id of ids) {
      const s = applyAction(generateCheckride(2), id);
      const entry = s.log[0];
      expect(entry.action).toBe(id);
      expect(entry.caused.length).toBeGreaterThan(20);
    }
  });
});

describe('the twelve-action cap', () => {
  it('accepts twelve actions, then rejects the thirteenth', () => {
    const s = runActions(generateCheckride(4), [...DISCOVERY, ...FIXES]);
    expect(s.actionsTaken).toHaveLength(MAX_ACTIONS);
    expect(() => applyAction(s, 'add-decay')).toThrow(/twelve steward actions are spent/);
  });

  it('availableActions is empty once the twelve are spent', () => {
    const s = runActions(generateCheckride(4), [...DISCOVERY, ...FIXES]);
    expect(availableActions(s)).toEqual([]);
  });

  it('a taken action leaves the panel and cannot repeat', () => {
    const s = applyAction(generateCheckride(6), 'audit-budget');
    expect(availableActions(s).map((a) => a.id)).not.toContain('audit-budget');
    expect(() => applyAction(s, 'audit-budget')).toThrow(/already taken/);
  });

  it('rejects unknown actions', () => {
    expect(() => applyAction(generateCheckride(6), 'fire-the-steward')).toThrow(/unknown action/);
  });
});

describe('discovery', () => {
  it('six instruments find all six problems inside the budget', () => {
    const s = runActions(generateCheckride(9), DISCOVERY);
    expect(s.problems.every((p) => p.found)).toBe(true);
    expect(s.problems.every((p) => !p.fixed)).toBe(true); // instruments reveal, not fix
  });

  it('each fix action, taken cold, both finds and fixes its problem', () => {
    for (const [id, problemId] of Object.entries(FIX_TOUCHES)) {
      const s = applyAction(generateCheckride(10), id);
      const p = s.problems.find((x) => x.id === problemId);
      expect(p.found).toBe(true);
      expect(p.foundBy).toBe(id);
      expect(p.fixed).toBe(true);
      expect(p.fixedBy).toBe(id);
    }
  });

  it('problems have alternate discovery paths', () => {
    const byReview = applyAction(generateCheckride(12), 'sample-deep-review');
    expect(byReview.problems.find((p) => p.id === 'saturated-budget').found).toBe(true);
    const byDrill = applyAction(generateCheckride(12), 'schedule-disturbance');
    expect(byDrill.problems.find((p) => p.id === 'decorative-guardrail').found).toBe(true);
    const byDecay = applyAction(generateCheckride(12), 'add-decay');
    expect(byDecay.problems.find((p) => p.id === 'forming-spiral').found).toBe(true);
  });

  it('foundBy keeps the first toucher; a later fix records fixedBy', () => {
    let s = applyAction(generateCheckride(13), 'audit-budget');
    s = applyAction(s, 'move-gate-dbt');
    const p = s.problems.find((x) => x.id === 'saturated-budget');
    expect(p.foundBy).toBe('audit-budget');
    expect(p.fixedBy).toBe('move-gate-dbt');
  });

  it('a second fix on an already-fixed problem keeps the first fixedBy', () => {
    let s = applyAction(generateCheckride(13), 'add-human-gate');
    s = applyAction(s, 'add-quarantine');
    const p = s.problems.find((x) => x.id === 'misplaced-decision');
    expect(p.fixedBy).toBe('add-human-gate');
  });

  it('order matters: revoking the stale grant first can leave the moved gate still over the line', () => {
    // Revocation sends transform-bump proposals back above the gate, so on
    // some seeds moving the dbt class afterward is no longer enough alone.
    const overSeed = [...Array(60).keys()].find((seed) => {
      const s = applyAction(generateCheckride(seed + 1), 'revoke-stale-grant');
      return applyAction(s, 'move-gate-dbt').log[1].caused.includes('most of the way back');
    });
    expect(overSeed).toBeDefined();
  });

  it('terrain changes really land: the gate moves, the grant drops, the limit re-sets', () => {
    let s = generateCheckride(14);
    s = runActions(s, ['move-gate-dbt', 'revoke-stale-grant', 'right-size-rate-limit']);
    expect(s.terrain.approvals.classes.find((c) => c.id === 'dbt-patch').gate).toBe('below');
    expect(s.terrain.grants.find((g) => g.cls === 'transform-bump').grant).toBe(
      'propose-plus-review',
    );
    expect(s.terrain.guardrails.find((g) => g.id === 'ingest-rate-limit').setting).toMatch(/1.5x/);
  });
});

describe('debrief', () => {
  it('returns one section per problem, in problem order, with the contract shape', () => {
    const d = debrief(runActions(generateCheckride(15), DISCOVERY));
    expect(d.sections).toHaveLength(6);
    for (const sec of d.sections) {
      expect(typeof sec.problem).toBe('string');
      expect(typeof sec.found).toBe('boolean');
      expect(typeof sec.readerDid).toBe('string');
      expect(typeof sec.whatItCaused).toBe('string');
      expect(typeof sec.handbookSays).toBe('string');
    }
  });

  it('cites the reader actions verbatim, with what each caused', () => {
    const s = runActions(generateCheckride(16), ['audit-budget', 'move-gate-dbt', 'add-decay']);
    const d = debrief(s);
    for (const entry of s.log) {
      const sec = d.sections.find((x) => x.readerDid.includes(entry.label));
      expect(sec).toBeDefined();
      expect(sec.found).toBe(true);
      expect(sec.whatItCaused).toContain(entry.caused);
    }
  });

  it('says so plainly for problems the reader never found', () => {
    const s = applyAction(generateCheckride(17), 'audit-budget');
    const d = debrief(s);
    const unfound = d.sections.filter((sec) => !sec.found);
    expect(unfound).toHaveLength(5);
    for (const sec of unfound) {
      expect(sec.readerDid).toBe('You never looked here.');
      expect(sec.whatItCaused).toMatch(/^Left alone:/);
      expect(sec.handbookSays.length).toBeGreaterThan(0);
    }
  });

  it('is never a score', () => {
    const everything = JSON.stringify(debrief(runActions(generateCheckride(18), DISCOVERY)));
    expect(everything).not.toMatch(/\b[0-6]\s*(?:\/|of|out of)\s*6\b/i);
    expect(everything).not.toMatch(/\bscored\b|\bgrade:\s*[A-F]\b|%\s*correct/i);
  });

  it('handbookSays stays faithful to the handbook, per problem', () => {
    const d = debrief(generateCheckride(19));
    const says = Object.fromEntries(d.sections.map((s) => [s.problem, s.handbookSays]));
    expect(says['A mis-placed decision']).toContain(
      'irreversible if undoing it costs more than not doing it',
    );
    expect(says['An open loop posing as closed']).toContain('fire-and-forget');
    expect(says['A forming spiral']).toContain('outside reference the loop cannot produce');
    expect(says['A saturated approval budget']).toContain('place the gates better');
    expect(says['A stale trust grant']).toContain('task class in a specific environment');
    expect(says['A decorative guardrail']).toContain(
      'rate limit set at ten times peak is decorative',
    );
  });
});

describe('mondayMemo', () => {
  const fullAnswers = {
    team: 'payments-platform',
    placements: [
      { decision: 'auth-service schema migration', quadrant: 'planned' },
      { decision: 'dependency patch bumps', quadrant: 'emergent-spec' },
      { decision: 'prototype eval harness', quadrant: 'emergent-explore' },
    ],
    firstLoop: {
      name: 'dependency-patch',
      signal: 'patch-level upgrade available, changelog clean',
      boundedAction: 'one bump per PR, lockfile only',
      verification: 'full CI suite',
      reversibility: 'git revert, single commit',
      signalUpdate: 'CI result and rollback feed the per-class record',
      authoritySurface: 'auto-merge eligibility per class, by track record',
    },
    gates: [
      { cls: 'dep-patch', inflow: 18, rate: 0.96, gate: 'above' },
      { cls: 'doc-refresh', inflow: 5, rate: 0.93, gate: 'below', sampling: 0.1 },
    ],
    budget: 30,
    irreversibles: ['production data deletion', 'external API calls with cost'],
    disturbances: [{ cadence: 'monthly', what: 'removal experiment on one context source' }],
  };

  it('contains all five sections', () => {
    const memo = mondayMemo(fullAnswers);
    expect(memo).toContain('PLACEMENT MAP');
    expect(memo).toContain('FIRST LOOP');
    expect(memo).toContain('GATE TABLE');
    expect(memo).toContain('IRREVERSIBLES');
    expect(memo).toContain('DISTURBANCE SCHEDULE');
  });

  it('is plain text, deterministic, and renders the answers', () => {
    expect(mondayMemo(fullAnswers)).toBe(mondayMemo(fullAnswers));
    const memo = mondayMemo(fullAnswers);
    expect(memo).toContain('payments-platform');
    expect(memo).toContain('auth-service schema migration -> planned');
    expect(memo).toContain('dep-patch — 18/wk at 96% — gate: above');
    expect(memo).toContain('- production data deletion');
    expect(memo).toContain('monthly: removal experiment on one context source');
    expect(memo).toContain('inequality: 18.5 gated/wk <= 28.5 — holds');
    expect(memo).not.toMatch(/!!/); // a complete worksheet earns no flags
  });

  it('flags a loop with no update block with the amnesia warning', () => {
    const memo = mondayMemo({
      ...fullAnswers,
      firstLoop: { ...fullAnswers.firstLoop, signalUpdate: '' },
    });
    expect(memo).toContain('Signal update: !! missing — amnesia');
  });

  it('flags an irreversible action with no human gate', () => {
    const memo = mondayMemo({
      ...fullAnswers,
      gates: [...fullAnswers.gates, { cls: 'retention purge', inflow: 1, rate: 1, gate: 'below' }],
      irreversibles: [...fullAnswers.irreversibles, 'retention purge'],
    });
    expect(memo).toMatch(/!! 'retention purge' is on the irreversibles list and sits below a gate/);
  });

  it('renders an unknown quadrant id as written, rather than dropping the row', () => {
    const memo = mondayMemo({
      placements: [{ decision: 'eval harness rewrite', quadrant: 'undecided' }],
    });
    expect(memo).toContain('eval harness rewrite -> undecided');
  });

  it('flags a danger-quadrant placement and a failing inequality', () => {
    const memo = mondayMemo({
      ...fullAnswers,
      placements: [{ decision: 'public API contract rewrite', quadrant: 'danger' }],
      gates: [{ cls: 'big-class', inflow: 40, rate: 0.9, gate: 'above' }],
    });
    expect(memo).toMatch(/!! public API contract rewrite sits irreversible-and-exploratory/);
    expect(memo).toMatch(/!! inequality fails: 40 gated\/wk > 28.5/);
  });

  it('renders a usable skeleton from no answers at all, with the empty-schedule flag', () => {
    const memo = mondayMemo();
    expect(memo).toContain('PLACEMENT MAP');
    expect(memo).toContain('DISTURBANCE SCHEDULE');
    expect(memo).toContain('!! nothing scheduled');
    expect(memo).toContain('!! missing — amnesia'); // all six ingredients blank
  });
});
