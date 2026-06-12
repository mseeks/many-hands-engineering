// trust.js — the environment-stamped trust ledger (handbook §3.7).
//
// The central move: trust is never a stored flag. Every grant is re-derived
// from the ledger at the moment the gate is asked, so when the environment
// shifts, grants shift with it — no failure required. The five properties of
// real trust (earned, narrow, conditional, revocable, expiring) are five
// checks inside `evaluateGate`, each disableable so a lab can run the
// counterfactual and watch the characteristic surprise of leaving one out.

import { mulberry32, randInt } from './rng.js';

/**
 * @typedef {{ model: string, perms: string[], repoShape: string }} Env
 * @typedef {'merged'|'reverted'|'closed'} Outcome
 * @typedef {{ cls: string, outcome: Outcome, week: number, env: Env }} LedgerRow
 * @typedef {{ rows: LedgerRow[], env: Env, week: number }} TrustState
 * @typedef {{ minRate: number, minDecided: number, windowWeeks: number,
 *   defectTolerance: number }} GatePolicy
 * @typedef {{ earned: boolean, narrow: boolean, conditional: boolean,
 *   revocable: boolean, expiring: boolean }} TrustProperties
 */

/** The default gate policy: 95% merge rate over at least 5 decided outcomes
 *  in a 13-week window, with zero reverts tolerated. */
export const DEFAULT_POLICY = Object.freeze({
  minRate: 0.95,
  minDecided: 5,
  windowWeeks: 13,
  defectTolerance: 0,
});

/** All five properties of real trust, on. Disable one to run its counterfactual. */
export const DEFAULT_PROPERTIES = Object.freeze({
  earned: true,
  narrow: true,
  conditional: true,
  revocable: true,
  expiring: true,
});

const OUTCOMES = ['merged', 'reverted', 'closed'];

/** Deep-copy an env so ledger stamps stay frozen in time. */
function cloneEnv(env) {
  return { model: env.model, perms: [...env.perms], repoShape: env.repoShape };
}

/**
 * A fresh ledger: no rows, week 0, and the environment trust will be earned
 * in — the judge model, the permission surface, the repo's shape.
 * @returns {TrustState}
 */
export function makeTrustState() {
  return {
    rows: [],
    env: { model: 'judge-v1', perms: ['deps'], repoShape: 'v1' },
    week: 0,
  };
}

/**
 * Record one outcome for a task class. The row is stamped with the *current*
 * environment and week — the stamp is what later lets the gate notice that a
 * record was earned somewhere the system no longer is.
 * @param {TrustState} state
 * @param {{ cls: string, outcome: Outcome }} entry
 * @returns {TrustState} new state; the input is never mutated
 */
export function addOutcome(state, { cls, outcome }) {
  if (!cls) throw new TypeError('addOutcome: cls is required');
  if (!OUTCOMES.includes(outcome)) {
    throw new TypeError(`addOutcome: unknown outcome "${outcome}"`);
  }
  const row = { cls, outcome, week: state.week, env: cloneEnv(state.env) };
  return { ...state, rows: [...state.rows, row] };
}

/** Does a row's stamped environment still describe the current one?
 *  Model and repo shape must match exactly; the row's permission surface
 *  must still be covered (widening perms keeps old stamps valid). */
function envMatches(rowEnv, env) {
  return (
    rowEnv.model === env.model &&
    rowEnv.repoShape === env.repoShape &&
    rowEnv.perms.every((p) => env.perms.includes(p))
  );
}

/** Name what changed, for the dashboard. Called only when a class has rows
 *  but none of them match the current environment. */
function envBlocker(rows, env) {
  if (!rows.some((r) => r.env.model === env.model)) {
    return `environment changed: ${env.model} has no record here`;
  }
  if (!rows.some((r) => r.env.repoShape === env.repoShape)) {
    return `environment changed: repo reshaped to ${env.repoShape} since this record`;
  }
  return 'environment changed: permissions shifted since this record';
}

/**
 * The gate. Re-derives one class's auto-merge grant from the ledger, applying
 * the five properties of real trust as five checks. Nothing here is stored:
 * ask again after the environment moves and the answer moves with it.
 * @param {TrustState} state
 * @param {string} cls task class, e.g. 'deps'
 * @param {Partial<GatePolicy>} [policy]
 * @param {Partial<TrustProperties>} [properties] disable one for a counterfactual
 * @returns {{ earned: boolean, rate: number, decided: number, firstBlocker: string|null }}
 */
export function evaluateGate(state, cls, policy = {}, properties = {}) {
  const pol = { ...DEFAULT_POLICY, ...policy };
  const props = { ...DEFAULT_PROPERTIES, ...properties };

  // NARROW: only this class's record counts. Disabled, any class can ride
  // the whole ledger — the boundary-erosion mistake, as a toggle.
  const classRows = props.narrow ? state.rows.filter((r) => r.cls === cls) : state.rows;

  // EXPIRING: only rows inside the window count. Disabled, a record never
  // goes stale, no matter how long the class has sat idle.
  const freshRows = props.expiring
    ? classRows.filter((r) => state.week - r.week < pol.windowWeeks)
    : classRows;

  // CONDITIONAL: only rows earned in the current environment count. The
  // environment is part of the trust; a stamp from judge-v1 says nothing
  // about judge-v2. Disabled, stale-environment rows keep counting.
  const liveRows = props.conditional
    ? freshRows.filter((r) => envMatches(r.env, state.env))
    : freshRows;

  const merged = liveRows.filter((r) => r.outcome === 'merged').length;
  const reverted = liveRows.filter((r) => r.outcome === 'reverted').length;
  // 'closed' rows sit on the ledger but never reached the codebase, so they
  // carry no information about post-merge quality: they don't move the rate.
  const decided = merged + reverted;
  const rate = decided === 0 ? 0 : merged / decided;

  // The first failed check is the dashboard's headline. Order: a stale
  // environment invalidates the record before you read it; a revert is the
  // loudest in-environment signal (REVOCABLE: instant, no averaging-away);
  // only then do EARNED's sufficiency and quality bars apply.
  let firstBlocker = null;
  if (props.conditional && liveRows.length === 0 && freshRows.length > 0) {
    firstBlocker = envBlocker(freshRows, state.env);
  } else if (props.revocable && reverted > pol.defectTolerance) {
    firstBlocker = `revoked: ${reverted} revert${reverted === 1 ? '' : 's'} this window`;
  } else if (props.earned && decided < pol.minDecided) {
    firstBlocker = `only ${decided}/${pol.minDecided} decided recently`;
  } else if (props.earned && rate < pol.minRate) {
    firstBlocker = `merge rate ${Math.round(rate * 100)}% below the ${Math.round(pol.minRate * 100)}% bar`;
  }

  return { earned: firstBlocker === null, rate, decided, firstBlocker };
}

/** 'judge-v1' → 'judge-v2', 'v1' → 'v2'; names without a number get '-v2'. */
function bumpVersion(name) {
  const m = name.match(/^(.*?)(\d+)$/);
  return m ? `${m[1]}${Number(m[2]) + 1}` : `${name}-v2`;
}

/**
 * Inject an environment or ledger event. Note what none of these do: rewrite
 * history. Old rows keep their stamps; only the *current* environment and
 * week move, and the gate re-reads the ledger against them.
 *
 * - 'model-swap'       — the judge upgrades ({ model? }); every grant resets
 *                        with zero failures on the ledger.
 * - 'permission-widen' — a new surface opens ({ perm? }); old grants hold,
 *                        the new surface starts at zero.
 * - 'refactor'         — the repo reshapes; old records stop predicting.
 * - 'idle'             — weeks pass ({ weeks? }, default one full window);
 *                        unrenewed records age out.
 * - 'revert'           — a merge comes back out ({ cls }); instant
 *                        revocation falls out of the gate, not a flag.
 * @param {TrustState} state
 * @param {{ type: 'model-swap'|'permission-widen'|'refactor'|'idle'|'revert',
 *   model?: string, perm?: string, weeks?: number, cls?: string }} event
 * @returns {TrustState} new state
 */
export function applyEvent(state, event) {
  switch (event.type) {
    case 'model-swap': {
      const model = event.model ?? bumpVersion(state.env.model);
      return { ...state, env: { ...cloneEnv(state.env), model } };
    }
    case 'permission-widen': {
      const perm = event.perm ?? 'docs';
      const perms = state.env.perms.includes(perm)
        ? [...state.env.perms]
        : [...state.env.perms, perm];
      return { ...state, env: { ...state.env, perms } };
    }
    case 'refactor': {
      const repoShape = bumpVersion(state.env.repoShape);
      return { ...state, env: { ...cloneEnv(state.env), repoShape } };
    }
    case 'idle': {
      const weeks = event.weeks ?? DEFAULT_POLICY.windowWeeks;
      return { ...state, week: state.week + weeks };
    }
    case 'revert': {
      return addOutcome(state, { cls: event.cls, outcome: 'reverted' });
    }
    default:
      throw new TypeError(`applyEvent: unknown event type "${event.type}"`);
  }
}

/** Unique task classes on the ledger, in first-appearance order. */
export function ledgerClasses(state) {
  const seen = [];
  for (const row of state.rows) {
    if (!seen.includes(row.cls)) seen.push(row.cls);
  }
  return seen;
}

/**
 * The counterfactual: what surfaces later if `conditional` is disabled after
 * an environment change. Classes that hold auto-merge *only* by riding a
 * stale-environment record keep merging at full cadence — and the unproven
 * judge's missed defects surface as a cluster weeks after the swap, not the
 * day of it. Deterministic from seed. If no class is riding stale trust,
 * nothing surfaces: the counterfactual only bites where the property was
 * doing work.
 * @param {TrustState} state typically a state just after a 'model-swap'
 * @param {{ weeks?: number, seed: number }} opts
 * @returns {{ defects: { week: number, cls: string }[] }} surfacing weeks,
 *   ascending; weeks may run past the horizon — that is the point
 */
export function counterfactualRun(state, { weeks = 12, seed }) {
  const rng = mulberry32(seed);

  // Riding = blocked under the full five properties, but earned the moment
  // `conditional` is switched off. These are the grants living on stale trust.
  const riding = ledgerClasses(state).filter((cls) => {
    const strict = evaluateGate(state, cls);
    const lax = evaluateGate(state, cls, {}, { conditional: false });
    return !strict.earned && lax.earned;
  });

  const defects = [];
  for (let week = 1; week <= weeks; week += 1) {
    for (const cls of riding) {
      const mergesThisWeek = randInt(rng, 2, 4); // the loop keeps its cadence
      for (let i = 0; i < mergesThisWeek; i += 1) {
        // The new judge misses what the old record never measured; each
        // missed defect takes weeks to surface. Lag is why the cluster
        // lands long after the swap looked consequence-free.
        if (rng() < 0.15) {
          defects.push({ week: week + randInt(rng, 3, 6), cls });
        }
      }
    }
  }
  defects.sort((a, b) => a.week - b.week || a.cls.localeCompare(b.cls));
  return { defects };
}
