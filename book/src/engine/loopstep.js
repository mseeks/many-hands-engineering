// loopstep.js — the five-stage loop machine.
//
// The dependency-patch loop from the handbook (§3.1), run as an
// effects-as-data state machine: signal → action → verification →
// commit-revert → update. Each of the six ingredients (§3.2) is removable
// as configuration, and removing one produces that ingredient's named
// pathology: amnesia, self-approval, ossification, blast-radius creep,
// misfires, or the single global trust switch.
//
// Pure and seeded: no clocks, no I/O, all randomness from the injected
// mulberry32 stream. Same seed, same run, forever.

import { makeTrace, pushStep } from './replay.js';
import { mulberry32, pick } from './rng.js';

/** The five stages every loop walks, in order. */
export const STAGES = ['signal', 'action', 'verification', 'commit-revert', 'update'];

/**
 * @typedef {Object} LoopConfig
 * @property {string} name
 * @property {boolean} signal           a trace in the terrain fires the loop
 * @property {boolean} boundedAction    scoped to one class of change
 * @property {boolean} verification     an outside reference checks the work
 * @property {boolean} reversibility    a cheap, well-understood undo path
 * @property {boolean} signalUpdate     outcomes feed back into the terrain
 * @property {boolean} authoritySurface explicit per-class autonomy rules
 */

/**
 * The dependency-patch loop with all six ingredients present.
 * @returns {LoopConfig}
 */
export function defaultLoopConfig() {
  return {
    name: 'dependency-patch',
    signal: true,
    boundedAction: true,
    verification: true,
    reversibility: true,
    signalUpdate: true,
    authoritySurface: true,
  };
}

// ---------------------------------------------------------------------------
// One proposal, walked through the five stages (the Hello Loop trace).
// ---------------------------------------------------------------------------

// A small catalog of real-sounding patch bumps. The seed picks one, so the
// canonical run reads like an actual PR queue, not an abstraction.
const PACKAGES = [
  {
    name: 'agentmail',
    from: '0.5.1',
    to: '0.5.4',
    note: 'fix: retry jitter on 429 responses',
  },
  {
    name: 'undici',
    from: '7.3.0',
    to: '7.3.1',
    note: 'fix: headers timeout reset after redirect',
  },
  {
    name: 'pino',
    from: '9.6.0',
    to: '9.6.2',
    note: 'fix: serializer crash on circular references',
  },
  {
    name: 'tar',
    from: '7.4.3',
    to: '7.4.4',
    note: 'fix: path normalization on win32',
  },
  {
    name: 'zod',
    from: '3.24.1',
    to: '3.24.2',
    note: 'fix: optional catch-all in record types',
  },
];

/** Build the PR the canonical run is about. One bump, lockfile only. */
function makePr(rng) {
  const p = pick(rng, PACKAGES);
  return {
    pkg: p.name,
    title: `deps: bump ${p.name} to ${p.to}`,
    branch: `deps/${p.name}-${p.to}`,
    body: [
      `Bumps ${p.name} ${p.from} -> ${p.to} (patch).`,
      '',
      `Changelog (${p.to}):`,
      `- ${p.note}`,
      '',
      'Scope: one bump per PR, lockfile only.',
      'On red: close + comment + delete branch.',
    ].join('\n'),
  };
}

/**
 * One stage of the five-stage machine, as effects-as-data: each stage
 * returns the side effects it would perform, never performing them. The
 * Walkthrough replays these; nothing here touches a real repo.
 * @param {string} stage one of STAGES
 * @param {{ pr: object, ciOutcome: 'green'|'red' }} ctx
 * @returns {{ effects: object[], caption: string }}
 */
export function stepStage(stage, ctx) {
  const { pr, ciOutcome } = ctx;
  const red = ciOutcome === 'red';
  switch (stage) {
    case 'signal':
      // Nothing acts here. A condition in the terrain became true, and the
      // loop exists to notice exactly this condition and no other.
      return {
        effects: [
          {
            type: 'signal-fired',
            watch: 'deps.outdated(level: patch)',
            detail: `${pr.pkg} patch available, changelog clean`,
          },
        ],
        caption:
          `The signal fires: a patch-level ${pr.pkg} is out and its ` +
          'changelog is clean. Nothing has acted yet; a condition in the ' +
          'terrain became true, and this loop watches exactly that condition.',
      };
    case 'action':
      // The bounded action: one bump, lockfile only, opened as a PR.
      return {
        effects: [{ type: 'open-pr', title: pr.title, branch: pr.branch }],
        caption:
          'The agent does the one thing it is scoped to do: bump the ' +
          `version, regenerate the lockfile, and open "${pr.title}".`,
      };
    case 'verification':
      // The oracle sits outside the loop: the agent cannot grade its own work.
      return {
        effects: [{ type: 'ci-run', result: ciOutcome }],
        caption: red
          ? 'CI runs the full suite against the bump and comes back red. ' +
            'The oracle sits outside the loop; the agent cannot grade its ' +
            'own work.'
          : 'CI runs the full suite against the bump and comes back green. ' +
            'The oracle sits outside the loop; the agent cannot grade its ' +
            'own work.',
      };
    case 'commit-revert':
      // Green lands; red unwinds completely. No partial state survives.
      return red
        ? {
            effects: [
              { type: 'close-pr', title: pr.title },
              {
                type: 'comment',
                body: `CI red on ${pr.branch}; closing. The bump can be re-proposed when the suite passes.`,
              },
              { type: 'delete-branch', branch: pr.branch },
            ],
            caption:
              'Red, so the loop closes the PR, leaves a comment quoting the ' +
              'failure, and deletes the branch. No partial state survives ' +
              'a red.',
          }
        : {
            effects: [{ type: 'merge-pr', title: pr.title }],
            caption:
              'Green, so the change lands. The merge is the cheap kind of ' +
              'decision: one git revert from undone.',
          };
    case 'update':
      // The outcome feeds back into the terrain as signal. This stage is
      // what separates a loop from a fire-and-forget script.
      return {
        effects: [
          {
            type: 'record-outcome',
            cls: 'patch-bump',
            outcome: red ? 'closed' : 'merged',
          },
        ],
        caption: red
          ? 'The close lands on the track record too; a red is information. ' +
            'The next run starts knowing this.'
          : 'The merge lands on the track record: one more clean patch-bump ' +
            'for this class. The next run starts knowing this.',
      };
    default:
      throw new Error(`unknown stage: ${stage}`);
  }
}

/**
 * One proposal walked through the five stages, as a recorded Trace.
 * @param {number} seed
 * @param {{ ciOutcome?: 'green'|'red' }} [opts] red walks the close-on-red
 *   path: close PR, comment, delete branch.
 * @returns {import('./replay.js').Trace} step data: { stage, pr, ci, effects }
 */
export function runCanonical(seed, opts = {}) {
  const rng = mulberry32(seed);
  const ciOutcome = opts.ciOutcome === 'red' ? 'red' : 'green';
  const pr = makePr(rng);
  const trace = makeTrace(seed);
  STAGES.forEach((stage, i) => {
    const { effects, caption } = stepStage(stage, { pr, ciOutcome });
    // CI has no result until the verification stage has actually run.
    const ci = i < STAGES.indexOf('verification') ? null : ciOutcome;
    pushStep(trace, {
      label: stage,
      caption,
      data: { stage, pr: { title: pr.title, body: pr.body }, ci, effects },
    });
  });
  return trace;
}

// ---------------------------------------------------------------------------
// Weeks of the loop, ingredients removable (the Six-Ingredient Bench).
// ---------------------------------------------------------------------------

// The task classes the loop proposes against. Trust is per-class: that is
// the authority surface. Remove it and one global switch remains.
const CLASSES = ['patch-bump', 'minor-bump', 'lockfile-refresh'];

// Tuned constants. They set the *shape* of each pathology, not real-world
// thresholds; the model notes on every lab say so.
const TRUST_START = 0.2; // a new loop starts with a thin record
const TRUST_CAP = 0.95; // trust never reaches blind
const TRUST_GAIN = 0.05; // per clean merged outcome, on its class
const BASE_REVIEW_MIN = 15; // steward minutes per PR with no record
const FLOOR_REVIEW_MIN = 4; // the skim a trusted class still gets
const SKIM_MIN = 1; // with no oracle, the loop waves itself through
const OSSIFY_REVIEW_FACTOR = 1.5; // post-ossification deep-read multiplier
const CI_GREEN_RATE = 0.92; // a patch bump usually passes
const DEFECT_CHANCE = 0.05; // post-merge regression, CI-gated merge
const UNVERIFIED_DEFECT_CHANCE = 0.25; // post-merge regression, ungated
const BLAST_RADIUS_LIMIT = 4; // the diff breadth the approval reasoned about
const SCOPE_CREEP = 1.35; // weekly scope growth without the bound
const PATCH_LAND_RATE = 0.55; // weekly chance real patch work exists
const CONFIDENCE_START = 0.6;
const CONF_GAIN = 0.04; // confidence drifts up in silence
const CONF_DIP = 0.1; // and dips when failure is visible
const CONF_CAP = 0.97;
const CONF_FLOOR = 0.3;
const QUALITY_START = 0.92; // true quality of what's on main
const QUALITY_EROSION = 0.06; // per escaped defect
const QUALITY_FLOOR = 0.3;

const round1 = (x) => Math.round(x * 10) / 10;
const round2 = (x) => Math.round(x * 100) / 100;
const round3 = (x) => Math.round(x * 1000) / 1000;

function meanTrust(trust) {
  const vals = Object.values(trust);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** True quality of what's on main: starts high, erodes per escaped defect. */
function qualityOf(cumDefects) {
  return Math.max(QUALITY_FLOOR, round3(QUALITY_START - QUALITY_EROSION * cumDefects));
}

function initialState(proposalsPerWeek) {
  const trust = {};
  for (const cls of CLASSES) trust[cls] = TRUST_START;
  return {
    week: 0,
    proposalsPerWeek,
    trust, // per-class track record, 0..1
    scope: 1, // blast-radius index of one PR; the bound pins it at 1
    confidence: CONFIDENCE_START, // the loop's self-report, not quality
    cumDefects: 0, // escaped defects, cumulative
    ossifiedWeek: null, // week the un-revertable defect landed
    blastWeek: null, // week scope outgrew the approval reasoning
    flip: null, // { week, cause } once the global switch flips
    missedWeeks: [],
    falseFires: [],
  };
}

/**
 * One week of the loop. Each ingredient's absence is a separate, visible
 * branch — this function is the six-ingredient table from §3.2, executable.
 * @param {object} state from initialState (not mutated)
 * @param {LoopConfig} config
 * @param {() => number} rng
 * @returns {{ state: object, row: WeekRow }}
 */
function stepWeek(state, config, rng) {
  const s = {
    ...state,
    trust: { ...state.trust },
    missedWeeks: [...state.missedWeeks],
    falseFires: [...state.falseFires],
  };
  s.week += 1;
  const events = [];

  // SIGNAL — when does the loop fire? With the ingredient, exactly when
  // patch work exists. Without it, a blind schedule fires on alternate
  // weeks while real patch windows land at random; the two rarely line up.
  let proposals = s.proposalsPerWeek;
  let junk = false;
  if (!config.signal) {
    const patchesLanded = rng() < PATCH_LAND_RATE;
    const fired = s.week % 2 === 1;
    if (fired && !patchesLanded) {
      junk = true; // a no-op PR opened against nothing
      proposals = Math.min(1, s.proposalsPerWeek);
      s.falseFires.push(s.week);
      events.push('false fire: nothing to patch, a no-op PR opened anyway');
    } else if (!fired && patchesLanded) {
      proposals = 0;
      s.missedWeeks.push(s.week);
      events.push('missed window: clean patches sat unapplied all week');
    } else if (!fired) {
      proposals = 0; // quiet week, correctly quiet only by luck
    }
  }

  // BOUNDED ACTION — scope is the breadth of diff one PR may touch. The
  // bound pins it at 1 (one bump, lockfile only). Without it, scope creeps
  // multiplicatively: minor bumps, then config edits, then refactors.
  if (!config.boundedAction) {
    s.scope = round2(s.scope * SCOPE_CREEP);
    if (s.blastWeek === null && s.scope > BLAST_RADIUS_LIMIT) {
      s.blastWeek = s.week;
      events.push('blast radius exceeded the reasoning that approved it');
    }
  }

  // Steward cost is set by the trust standing at the start of the week,
  // and scales with diff breadth. After an ossified defect, every later
  // change is re-read against the mistake that cannot come out.
  let perPr = BASE_REVIEW_MIN - (BASE_REVIEW_MIN - FLOOR_REVIEW_MIN) * meanTrust(s.trust);
  if (!config.verification) perPr = SKIM_MIN; // nobody outside is checking
  if (s.ossifiedWeek !== null) perPr = BASE_REVIEW_MIN * OSSIFY_REVIEW_FACTOR;
  const reviewMinutes = round1(proposals * perPr * s.scope);

  // The week's proposals walk verification and commit-or-revert.
  let merged = 0;
  let reverted = 0;
  let defectsEscaped = 0;
  let closedRed = 0;
  let visibleFailure = junk; // a misfire is visible noise on the steward's desk
  for (let i = 0; i < proposals; i++) {
    const cls = CLASSES[i % CLASSES.length];
    if (junk) continue; // the no-op PR closes at triage; nothing merges

    // VERIFICATION — the outside reference. Without it nothing gates the
    // merge, and post-merge regressions go from rare to routine.
    if (config.verification && rng() >= CI_GREEN_RATE) {
      closedRed += 1; // close-on-red: routine, harmless, visible
      visibleFailure = true;
      continue;
    }
    merged += 1;

    const defectChance = config.verification ? DEFECT_CHANCE : UNVERIFIED_DEFECT_CHANCE;
    if (rng() < defectChance) {
      if (!config.verification) {
        defectsEscaped += 1; // self-approval: no oracle ever sees it
      } else if (config.reversibility) {
        reverted += 1; // REVERSIBILITY — caught and rolled back, cheap
        visibleFailure = true;
        events.push(`post-merge regression caught and reverted (${cls})`);
      } else {
        defectsEscaped += 1; // detected, but there is no undo path
        visibleFailure = true;
        if (s.ossifiedWeek === null) {
          s.ossifiedWeek = s.week;
          events.push('defect ossified: a bad merge with no undo path is now load-bearing');
        }
      }
      // AUTHORITY SURFACE — without per-class rules, the org's only
      // incident response is the one switch it has. Flipping it zeroes
      // every class at once, including the ones that did nothing.
      if (!config.authoritySurface && s.flip === null) {
        s.flip = {
          week: s.week,
          cause: `${cls} regression in week ${s.week}; no per-class surface, so the only switch was global`,
        };
        for (const c of CLASSES) s.trust[c] = 0;
        events.push('global trust switch flipped: every class to zero at once');
      }
    } else if (
      // SIGNAL UPDATE — a clean merged outcome feeds this class's track
      // record. (A clean revert is recorded too, but one rollback does not
      // move the gate.) Frozen after a flip or an ossified defect.
      config.signalUpdate &&
      s.flip === null &&
      s.ossifiedWeek === null
    ) {
      s.trust[cls] = Math.min(TRUST_CAP, s.trust[cls] + TRUST_GAIN);
    }
  }

  if (closedRed > 0) {
    events.push(`close-on-red: ${closedRed} PR closed, commented, branch deleted`);
  }
  if (!config.signalUpdate && proposals > 0) {
    // Amnesia: outcomes never land anywhere, so week N re-argues week 1.
    events.push('re-litigated the same finding: is a lockfile-only diff safe to skim?');
  }

  // Self-reported confidence drifts up in silence and dips when a failure
  // is visible. Note what it is not: a measure of quality.
  s.confidence = visibleFailure
    ? Math.max(CONF_FLOOR, s.confidence - CONF_DIP)
    : Math.min(CONF_CAP, s.confidence + CONF_GAIN);
  s.cumDefects += defectsEscaped;

  const row = {
    week: s.week,
    proposals,
    merged,
    reverted,
    defectsEscaped,
    reviewMinutes,
    trust: round3(meanTrust(s.trust)),
    events,
  };
  return { state: s, row };
}

/**
 * @typedef {Object} WeekRow
 * @property {number} week 1-indexed
 * @property {number} proposals
 * @property {number} merged
 * @property {number} reverted caught post-merge and rolled back
 * @property {number} defectsEscaped shipped and never undone, this week
 * @property {number} reviewMinutes steward cost this week
 * @property {number} trust mean per-class trust at week's end, 0..1
 * @property {string[]} events
 */

/**
 * Run the loop for a stretch of weeks with any subset of the six
 * ingredients removed. Deterministic from the seed.
 * @param {{ config?: Partial<LoopConfig>, weeks?: number, seed: number,
 *   proposalsPerWeek?: number }} args missing config fields default to
 *   present (defaultLoopConfig).
 * @returns {{ weeks: WeekRow[],
 *   series: { reviewCost: number[], trust: number[], defects: number[],
 *     scope: number[] },
 *   summary: object }} series.defects is cumulative escaped defects.
 *   summary: { name, totalMerged, totalReverted, totalDefectsEscaped,
 *   confidence: number[], quality: number[], blastRadiusExceededWeek,
 *   missedWeeks, falseFires, globalTrustFlip, trustByClass }.
 */
export function runLoopWeeks({ config = {}, weeks = 10, seed, proposalsPerWeek = 4 } = {}) {
  const cfg = { ...defaultLoopConfig(), ...config };
  const rng = mulberry32(seed);
  let state = initialState(proposalsPerWeek);

  const rows = [];
  const confidence = []; // the loop's self-report, week by week
  const quality = []; // the truth the self-report drifts away from
  const defects = []; // cumulative escaped defects
  const scope = [];
  for (let w = 0; w < weeks; w++) {
    const r = stepWeek(state, cfg, rng);
    state = r.state;
    rows.push(r.row);
    confidence.push(round3(state.confidence));
    quality.push(qualityOf(state.cumDefects));
    defects.push(state.cumDefects);
    scope.push(state.scope);
  }

  const trustByClass = {};
  for (const cls of CLASSES) trustByClass[cls] = round3(state.trust[cls]);

  return {
    weeks: rows,
    series: {
      reviewCost: rows.map((r) => r.reviewMinutes),
      trust: rows.map((r) => r.trust),
      defects,
      scope,
    },
    summary: {
      name: cfg.name,
      totalMerged: rows.reduce((a, r) => a + r.merged, 0),
      totalReverted: rows.reduce((a, r) => a + r.reverted, 0),
      totalDefectsEscaped: rows.reduce((a, r) => a + r.defectsEscaped, 0),
      confidence,
      quality,
      blastRadiusExceededWeek: state.blastWeek,
      missedWeeks: state.missedWeeks,
      falseFires: state.falseFires,
      globalTrustFlip: state.flip,
      trustByClass,
    },
  };
}
