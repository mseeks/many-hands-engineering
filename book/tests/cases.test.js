import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../src/engine/rng.js';
import {
  CASES,
  quadrantForAxes,
  scoreAxes,
  makeDrillState,
  recordOutcome,
  drawCases,
} from '../src/engine/cases.js';

const KINDS = ['placement', 'spiral', 'loop', 'gate', 'trust', 'decline'];
const QUADRANTS = ['planned', 'emergent-spec', 'danger', 'emergent-explore'];

const byKind = (kind) => CASES.filter((c) => c.kind === kind);
const caseText = (c) =>
  [
    c.surface,
    c.prompt,
    ...c.evidence.map((e) => `${e.label} ${e.text}`),
    ...Object.values(c.feedback),
    ...Object.values(c.axesWhy ?? {}),
    ...(c.options ?? []).map((o) => o.label),
  ].join(' ');

// ─── bank composition ───

describe('bank composition', () => {
  it('has 42 cases with the contracted kind counts', () => {
    expect(CASES).toHaveLength(42);
    expect(byKind('placement')).toHaveLength(14);
    expect(byKind('spiral')).toHaveLength(8);
    expect(byKind('loop')).toHaveLength(6);
    expect(byKind('gate')).toHaveLength(5);
    expect(byKind('trust')).toHaveLength(4);
    expect(byKind('decline')).toHaveLength(5);
  });

  it('has unique ids and only contracted kinds', () => {
    const ids = CASES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of CASES) expect(KINDS).toContain(c.kind);
  });

  it('every case carries surface, prompt, evidence, feedback, fromChapter', () => {
    for (const c of CASES) {
      expect(c.surface.length).toBeGreaterThan(10);
      expect(c.prompt.length).toBeGreaterThan(5);
      expect(c.evidence.length).toBeGreaterThanOrEqual(2);
      for (const e of c.evidence) {
        expect(e.label.length).toBeGreaterThan(0);
        expect(e.text.length).toBeGreaterThan(0);
      }
      expect(typeof c.fromChapter).toBe('number');
      expect(Object.keys(c.feedback).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('placement cases use the quadrant with full axes truth, rationale, and four-way feedback', () => {
    for (const c of byKind('placement')) {
      expect(c.quadrant).toBe(true);
      expect(c.options).toBeUndefined();
      expect(['cheap', 'costly']).toContain(c.axesTruth.reversibility);
      expect(['specified', 'exploratory']).toContain(c.axesTruth.legibility);
      expect(['loose', 'tight']).toContain(c.axesTruth.coupling);
      for (const axis of ['reversibility', 'legibility', 'coupling']) {
        expect(c.axesWhy[axis].length).toBeGreaterThan(10);
      }
      for (const q of QUADRANTS) {
        expect(c.feedback[q].length).toBeGreaterThan(40);
      }
    }
  });

  it('uncontested placement answers agree with quadrantForAxes', () => {
    for (const c of byKind('placement').filter((x) => !x.contested)) {
      expect(c.answer).toBe(quadrantForAxes(c.axesTruth));
    }
  });

  it('non-placement cases have options, and feedback for every option', () => {
    for (const c of CASES.filter((x) => x.kind !== 'placement')) {
      expect(c.quadrant).toBeUndefined();
      expect(c.options.length).toBeGreaterThanOrEqual(2);
      for (const o of c.options) {
        expect(c.feedback[o.id].length).toBeGreaterThan(40);
      }
    }
  });

  it('uncontested cases name an answer drawn from their own options', () => {
    for (const c of CASES.filter((x) => !x.contested)) {
      const valid = c.quadrant ? QUADRANTS : c.options.map((o) => o.id);
      expect(valid).toContain(c.answer);
    }
  });

  it('contested cases omit the answer and argue commitments on at least two readings', () => {
    const contested = CASES.filter((c) => c.contested);
    expect(contested.length).toBeGreaterThanOrEqual(5);
    for (const c of contested) {
      expect(c.answer).toBeUndefined();
      const commits = Object.values(c.feedback).filter((f) => /commits you to/i.test(f));
      expect(commits.length).toBeGreaterThanOrEqual(2);
    }
  });
});

// ─── argued judgment, house rules ───

describe('argued judgment', () => {
  it('never says "wrong" anywhere in the bank', () => {
    for (const c of CASES) {
      expect(caseText(c)).not.toMatch(/\bwrong(ly|ed)?\b/i);
    }
  });

  it('avoids the banned-word list', () => {
    const banned =
      /\b(leverage|robust|scalable|seamless|delve|deep dive|unlock|empower|moreover|furthermore|additionally)\b|not just|it is important to note/i;
    for (const c of CASES) {
      expect(caseText(c)).not.toMatch(banned);
    }
  });

  it('mentions dependency bumps in at most two cases across the whole bank', () => {
    const mentions = CASES.filter((c) => /dependenc|dep[- ](bump|patch)/i.test(caseText(c)));
    expect(mentions.length).toBeLessThanOrEqual(2);
  });
});

// ─── the named near-misses ───

describe('named near-misses', () => {
  it('includes the reversible-looking deletion whose released information cannot be recalled', () => {
    const deletion = CASES.find(
      (c) => c.kind === 'placement' && /cannot be recalled/i.test(caseText(c)),
    );
    expect(deletion).toBeDefined();
    expect(deletion.answer).toBe('planned');
    expect(deletion.axesTruth.reversibility).toBe('costly');
    // The trap quadrant gets argued feedback about the export, not a verdict.
    expect(deletion.feedback['emergent-spec']).toMatch(/export|recalled/i);
  });

  it('includes the healthy backpressure loop that looks like a storm', () => {
    const backpressure = CASES.find((c) => c.kind === 'spiral' && c.answer === 'healthy');
    expect(backpressure).toBeDefined();
    // The storm reading is argued from the defining number, amplification.
    expect(backpressure.feedback['emergent-runaway']).toMatch(/amplification/i);
    expect(caseText(backpressure)).toMatch(/0\.7/);
  });
});

// ─── ingredient and warning-sign coverage ───

describe('semantic coverage', () => {
  it('loop cases cover all six ingredients across their answers and contests', () => {
    const loops = byKind('loop');
    const touched = new Set();
    for (const c of loops) {
      if (c.answer) touched.add(c.answer);
      if (c.contested) for (const o of c.options) touched.add(o.id);
    }
    expect(touched).toContain('signal');
    expect(touched).toContain('bounded-action');
    expect(touched).toContain('reversibility');
    expect(touched).toContain('signal-update');
    expect(touched).toContain('authority-surface');
    // Verification is the contested case's whole question.
    expect([...touched].some((t) => /verification/.test(t))).toBe(true);
  });

  it('spiral cases span both families plus hybrid, healthy, and dead-signal reads', () => {
    const answers = byKind('spiral').map((c) => c.answer);
    expect(answers).toContain('emergent-runaway');
    expect(answers).toContain('planned-stall');
    expect(answers).toContain('hybrid-theatre');
    expect(answers).toContain('healthy');
    expect(answers).toContain('dead-signal');
  });

  it('decline cases are not uniform: at least one answers adopt-with-tight-gates', () => {
    const answers = byKind('decline')
      .filter((c) => !c.contested)
      .map((c) => c.answer);
    expect(answers).toContain('tight-gates');
    expect(answers).toContain('decline');
  });
});

// ─── quadrantForAxes ───

describe('quadrantForAxes', () => {
  it('maps all four reversibility x legibility combinations', () => {
    expect(quadrantForAxes({ reversibility: 'costly', legibility: 'specified' })).toBe('planned');
    expect(quadrantForAxes({ reversibility: 'cheap', legibility: 'specified' })).toBe(
      'emergent-spec',
    );
    expect(quadrantForAxes({ reversibility: 'costly', legibility: 'exploratory' })).toBe('danger');
    expect(quadrantForAxes({ reversibility: 'cheap', legibility: 'exploratory' })).toBe(
      'emergent-explore',
    );
  });
});

// ─── scoreAxes ───

describe('scoreAxes', () => {
  const placement = CASES.find((c) => c.id === 'pl-01'); // costly / specified / tight

  it('agrees on every axis when the reader matches truth', () => {
    const { agreed, missed } = scoreAxes(placement, {
      reversibility: 'costly',
      legibility: 'specified',
      coupling: 'tight',
    });
    expect(agreed).toEqual(['reversibility', 'legibility', 'coupling']);
    expect(missed).toEqual([]);
  });

  it('returns the truth and the case rationale for each missed axis', () => {
    const { agreed, missed } = scoreAxes(placement, {
      reversibility: 'cheap',
      legibility: 'specified',
      coupling: 'loose',
    });
    expect(agreed).toEqual(['legibility']);
    expect(missed).toHaveLength(2);
    const rev = missed.find((m) => m.axis === 'reversibility');
    expect(rev.truth).toBe('costly');
    expect(rev.why.length).toBeGreaterThan(10);
    const coup = missed.find((m) => m.axis === 'coupling');
    expect(coup.truth).toBe('tight');
  });

  it('treats absent reader axes as missed, with rationale intact', () => {
    const { agreed, missed } = scoreAxes(placement, undefined);
    expect(agreed).toEqual([]);
    expect(missed).toHaveLength(3);
    for (const m of missed) expect(m.why.length).toBeGreaterThan(10);
  });

  it('falls back to an empty rationale when a case carries no axesWhy', () => {
    const bare = {
      axesTruth: { reversibility: 'cheap', legibility: 'specified', coupling: 'loose' },
    };
    const { missed } = scoreAxes(bare, { reversibility: 'costly' });
    expect(missed.find((m) => m.axis === 'reversibility').why).toBe('');
  });

  it('returns empty results for cases that carry no axes (non-placement)', () => {
    const spiral = CASES.find((c) => c.kind === 'spiral');
    expect(scoreAxes(spiral, { reversibility: 'cheap' })).toEqual({ agreed: [], missed: [] });
  });
});

// ─── drill state ───

describe('makeDrillState / recordOutcome', () => {
  it('starts empty', () => {
    expect(makeDrillState()).toEqual({ seen: [], missedKinds: [] });
  });

  it('a miss flags the kind; an agreement in that kind clears it', () => {
    let state = makeDrillState();
    state = recordOutcome(state, 'sp-02', false);
    expect(state.missedKinds).toEqual(['spiral']);
    expect(state.seen).toEqual(['sp-02']);
    state = recordOutcome(state, 'sp-03', true);
    expect(state.missedKinds).toEqual([]);
    expect(state.seen).toEqual(['sp-02', 'sp-03']);
  });

  it('does not duplicate seen ids or missed kinds', () => {
    let state = makeDrillState();
    state = recordOutcome(state, 'gt-01', false);
    state = recordOutcome(state, 'gt-01', false);
    expect(state.seen).toEqual(['gt-01']);
    expect(state.missedKinds).toEqual(['gate']);
  });

  it('an agreement outside any missed kind leaves missedKinds untouched', () => {
    let state = recordOutcome(makeDrillState(), 'tr-01', true);
    expect(state.missedKinds).toEqual([]);
  });

  it('ignores unknown case ids', () => {
    const state = makeDrillState();
    expect(recordOutcome(state, 'nope-99', false)).toBe(state);
  });

  it('is pure: the input state is not mutated', () => {
    const state = makeDrillState();
    recordOutcome(state, 'pl-01', false);
    expect(state).toEqual({ seen: [], missedKinds: [] });
  });
});

// ─── drawCases ───

describe('drawCases', () => {
  it('is deterministic: the same seed deals the same cases', () => {
    const a = drawCases(makeDrillState(), { n: 10, rng: mulberry32(7) });
    const b = drawCases(makeDrillState(), { n: 10, rng: mulberry32(7) });
    expect(a.cases.map((c) => c.id)).toEqual(b.cases.map((c) => c.id));
    expect(a.state).toEqual(b.state);
  });

  it('different seeds deal different orders', () => {
    const a = drawCases(makeDrillState(), { n: 20, rng: mulberry32(1) });
    const b = drawCases(makeDrillState(), { n: 20, rng: mulberry32(2) });
    expect(a.cases.map((c) => c.id)).not.toEqual(b.cases.map((c) => c.id));
  });

  it('filters by kind when one is requested', () => {
    const { cases } = drawCases(makeDrillState(), { kind: 'gate', n: 5, rng: mulberry32(3) });
    expect(cases).toHaveLength(5);
    for (const c of cases) expect(c.kind).toBe('gate');
  });

  it('interleaves kinds: no two consecutive cases share a kind while all pools last', () => {
    const { cases } = drawCases(makeDrillState(), { n: 12, rng: mulberry32(11) });
    for (let i = 1; i < cases.length; i++) {
      expect(cases[i].kind).not.toBe(cases[i - 1].kind);
    }
  });

  it('resurfaces missed kinds first', () => {
    const state = { seen: [], missedKinds: ['trust'] };
    const { cases } = drawCases(state, { n: 8, rng: mulberry32(5) });
    // All four trust cases lead the deal before any other kind appears.
    expect(cases.slice(0, 4).every((c) => c.kind === 'trust')).toBe(true);
    expect(cases.slice(4).every((c) => c.kind !== 'trust')).toBe(true);
  });

  it('missedFirst:false ignores missed kinds and matches the plain interleave', () => {
    const flagged = { seen: [], missedKinds: ['trust'] };
    const plain = drawCases(makeDrillState(), { n: 12, rng: mulberry32(9) });
    const ignored = drawCases(flagged, { n: 12, missedFirst: false, rng: mulberry32(9) });
    expect(ignored.cases.map((c) => c.id)).toEqual(plain.cases.map((c) => c.id));
  });

  it('excludes seen cases until the pool runs out, then recycles', () => {
    const allButOne = CASES.slice(1).map((c) => c.id);
    const state = { seen: allButOne, missedKinds: [] };
    const { cases } = drawCases(state, { n: 3, rng: mulberry32(13) });
    expect(cases[0].id).toBe(CASES[0].id); // the lone unseen case leads
    expect(allButOne).toContain(cases[1].id); // then recycled ones
    expect(allButOne).toContain(cases[2].id);
  });

  it('recycles when everything has been seen', () => {
    const state = { seen: CASES.map((c) => c.id), missedKinds: [] };
    const { cases } = drawCases(state, { n: 4, rng: mulberry32(17) });
    expect(cases).toHaveLength(4);
  });

  it('caps the deal at the pool size and never repeats within one deal', () => {
    const { cases } = drawCases(makeDrillState(), { kind: 'trust', n: 99, rng: mulberry32(19) });
    expect(cases).toHaveLength(4);
    expect(new Set(cases.map((c) => c.id)).size).toBe(4);
  });

  it('accumulates seen ids into the returned state without mutating the input', () => {
    const state = makeDrillState();
    const first = drawCases(state, { n: 5, rng: mulberry32(23) });
    expect(state.seen).toEqual([]);
    expect(first.state.seen).toHaveLength(5);
    const second = drawCases(first.state, { n: 5, rng: mulberry32(23) });
    // The next deal avoids everything already seen.
    for (const c of second.cases) {
      expect(first.state.seen).not.toContain(c.id);
    }
    expect(second.state.seen).toHaveLength(10);
  });
});
