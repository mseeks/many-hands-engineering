// StrataAndRatification.jsx — LAB 06·A "The strata router" and LAB 06·B "The
// ratification moment" (Ch 6 · Hybrids and strata; covers §2.5 and the first
// beat of §3.5's upstream half).
//
// Both labs run in the bet register: no simulation engine underneath, the
// models are the handbook's §2.5 stack and its rule two held as data and one
// small pure function each, sliced verbatim into the glass below (the same
// move as Lab 04·A). Lab A is a six-case routing drill — pitch each failure
// at the layer of the actual failure, argued feedback on the category errors
// (governance churn is theatre; invocation noise reviewed architecturally is
// a slow IDE). Lab B is the steward's upstream moment — notice a convention
// forming in three loops' outputs, then promote it one rung at a time, with
// explicit ratification at each: signals flow up, authority flows down.
// No rAF, no intervals, no JS motion anywhere in this file.

import { useState } from 'react';
import { Badge, Commit, Drill, LabFrame, Mark, glassSlice } from '../components/kit.jsx';
import labSrc from './StrataAndRatification.jsx?raw';

/* ── The stack, verbatim (this block is Lab A's glass) ──────────────────
   The handbook's §2.5 pace-layered platform held as data: six layers, the
   rate each one changes at, what lives there, and its characteristic
   failure mode. The only added machinery is categoryError(), which turns a
   mispitched review into the clock-mismatch argument. The cases themselves
   are authored; the ground truth is the author's sort, argued from the
   stack's three rules. */
const LAYERS = [
  {
    id: 'governance',
    name: 'Governance',
    rate: 'years',
    holds: 'policy, values, accountability, compliance posture',
    fails: 'by becoming irrelevant',
  },
  {
    id: 'architecture',
    name: 'Architecture',
    rate: 'months',
    holds: 'platform primitives, schemas, contracts, the trust model',
    fails: 'by becoming brittle',
  },
  {
    id: 'capabilities',
    name: 'Capabilities',
    rate: 'weeks',
    holds: 'tools, connectors, retrieval, eval harnesses',
    fails: 'by proliferating without curation',
  },
  {
    id: 'orchestration',
    name: 'Orchestration',
    rate: 'days',
    holds: 'agent graphs, routing, delegation',
    fails: 'by drowning in combinatorial complexity',
  },
  {
    id: 'agents',
    name: 'Agents',
    rate: 'hours',
    holds: 'system prompts, strategies, tool selections',
    fails: 'by hallucinating and drifting',
  },
  {
    id: 'invocations',
    name: 'Invocations',
    rate: 'minutes',
    holds: 'a single task run',
    fails: 'by throwing transient errors',
  },
];

const layerById = (id) => LAYERS.find((l) => l.id === id);

/**
 * The drill's one mechanism. A layer is a clock, and a category error is a
 * clock mismatch. Pitch a failure at a slower layer than its rate and the
 * review outlives the thing it reviews (the slow IDE; at the very top,
 * theatre). Pitch it at a faster layer and the fix decays at that layer's
 * rate while the cause sits untouched on its slower clock.
 */
function categoryError(pickedId, rightId) {
  const picked = layerById(pickedId);
  const right = layerById(rightId);
  const pickedSlower = LAYERS.indexOf(picked) < LAYERS.indexOf(right);
  if (pickedSlower) {
    return (
      `The ${picked.name.toLowerCase()} layer changes in ${picked.rate}; this failure lives on ` +
      `a ${right.rate} clock. Pitched there, ${right.rate}-rate work queues behind a ` +
      `${picked.rate}-rate calendar, and the slow layer gets pulled toward its own ` +
      `characteristic failure — it fails ${picked.fails}.`
    );
  }
  return (
    `The ${picked.name.toLowerCase()} layer changes in ${picked.rate}, faster than this ` +
    `failure's ${right.rate} clock. A fix patched in at that rate decays at that rate, ` +
    `while the cause sits untouched on its slower clock.`
  );
}
/* end-model-a */

const GLASS_A = glassSlice(labSrc, 'The stack, verbatim', '/* end-model-a */');

/* ── The six cases. Authored; each failure carries its rate in the
      evidence, because the layer of a failure is read off its clock. ──── */
const CASES = [
  {
    id: 'the-502',
    surface: 'TUE 09:14 · RETRY LOG',
    prompt:
      'One run of a doc-refresh task caught a 502 from the embeddings endpoint; the retry landed 1.8 seconds later and the task finished green. A teammate has put "embeddings flakiness" on Thursday\'s architecture-review agenda. Pitch the review.',
    evidence: [
      {
        label: 'Rate',
        text: 'first 502 from this endpoint in 30 days, across roughly 4,000 task runs.',
      },
      {
        label: 'Recovery',
        text: 'one retry, inside the same invocation; no operator, no queue time.',
      },
      { label: 'Spread', text: 'no other loop, region, or provider shows the error.' },
    ],
    right: 'invocations',
    argument:
      'A transient error adjudicated by its own retry is the minutes layer doing its job: the characteristic failure arrived and the characteristic remedy already answered it. The artifact this earns is a log line, and the exit condition is a rate — at 1 in 4,000 this is noise; if it climbs toward 1 in 40, it stops being an invocation story and earns a look one layer up.',
    traps: {
      architecture:
        "Thursday's agenda runs on the months clock, and this failure lived for 1.8 seconds. Reviewing minutes-rate noise at the architecture layer is the slow IDE: every task run now queues, conceptually, behind a calendar four orders of magnitude slower than the thing it reviews. The agenda slot costs more attention than the failure cost compute.",
    },
  },
  {
    id: 'the-marketing-voice',
    surface: 'WED 14:02 · SAMPLED REVIEW',
    contested: true,
    prompt:
      "Doc-refresh's summaries are drifting: three of five sampled this week open with promotional adjectives; two weeks ago it was zero of five. Every contract test passes, because nothing CI checks covers voice. Pitch the fix.",
    evidence: [
      {
        label: 'Onset',
        text: 'the drift starts the day after doc-refresh\'s system prompt gained "write inviting summaries."',
      },
      {
        label: 'Containment',
        text: 'structure, links, and citations unchanged; no other loop drifts.',
      },
      { label: 'Detection', text: 'caught by a sampled human read, not by any check.' },
    ],
    right: 'agents',
    argument:
      'The hours layer holds system prompts and strategies, and this drift traces to one prompt line edited last Tuesday; reverting or sharpening it is an hours-rate fix for an hours-rate failure (agents drift — that is their characteristic mode). The contested half: detection lived on a sampled human read, and if voice should never depend on sampling again, that is an eval, which is a weeks-rate capability. Fix the instance at agents; promote the class to capabilities — by ratification, which is the next lab.',
    traps: {
      capabilities:
        'Defensible, and the drill marks this case so. An eval that scores voice is the durable answer to "why did a human have to catch this" — a real capabilities-layer gap. But that is the fix for the class, on the weeks clock; the drift in front of you traces to one prompt line edited last Tuesday, and that revert is an hours-rate act at the agents layer. Take the cheap fix at the layer that failed, then promote the class upward deliberately.',
    },
  },
  {
    id: 'the-bounce',
    surface: 'THU 11:40 · TASK TRACE',
    prompt:
      'A failing-fixture task bounced triage → flaky-test → triage → test-backfill → triage before landing: 40 minutes of queue time around an 8-minute fix, the 14th bounce like it this month. Pitch the fix.',
    evidence: [
      {
        label: 'Isolation',
        text: 'replayed alone, every agent involved classifies the task correctly.',
      },
      {
        label: 'Composition',
        text: 'the cycle exists only in the routing graph: two loops match the fixture label, and the tie rule returns the task to triage.',
      },
      { label: 'Rate', text: '14 bounces in 30 days, rising with each loop added to the fleet.' },
    ],
    right: 'orchestration',
    argument:
      'Every part is right and the whole still cycles, which is the days layer failing in its characteristic way: combinatorial complexity that exists only in composition. The fix is a routing rule — break the tie, stop returning ties to sender — pitched at the graph. The rising rate is the tell that it gets worse from here: pairwise interactions grow with the square of the fleet.',
    traps: {
      agents:
        'Tune any one prompt and you are making three correct agents differently correct. Each one, replayed alone, already routes this task right; the cycle lives between them, in the tie rule of the graph. Hours-rate edits cannot reach a failure that only exists at composition time.',
    },
  },
  {
    id: 'the-email-in-the-log',
    surface: 'FRI 16:55 · INCIDENT + DRAFT',
    prompt:
      "Tuesday, an agent pasted a customer email address into a public build log. Friday, there's a draft amendment to the platform accountability policy — the third policy amendment proposed this month. Pitch the fix.",
    evidence: [
      {
        label: 'Path',
        text: 'the logging connector writes whatever it is handed; nothing in the path strips PII, for any of the eight loops that share it.',
      },
      {
        label: 'Policy',
        text: 'the current policy already forbids exposing customer data. It was not silent; the path was.',
      },
      {
        label: 'Churn',
        text: 'two earlier amendments this month, both incident-shaped, neither changed any behavior below.',
      },
    ],
    right: 'capabilities',
    argument:
      'The leak lives in a tool: one shared connector, eight loops, zero scrubbing. A redaction pass in that connector is a weeks-rate change that covers every loop at once, including the seven that have not leaked yet. The policy above already says the right thing; what was missing is the capability that makes the policy true on the way to disk.',
    traps: {
      governance:
        'The policy already forbids what happened; a third amendment this month changes nothing the connector reads. This is the years layer churning at the weeks rate, and governance that churns is theatre: each amendment lowers the odds anyone reads the next one. Its characteristic failure — becoming irrelevant — is being manufactured here, amendment by amendment.',
      agents:
        "Patch one agent's prompt and seven loops still write to the same unscrubbed connector. The prompt is where this incident surfaced, but the evidence says the path is shared; a failure that is one tool wide gets fixed one tool wide, at weeks rate, not agent by agent.",
    },
  },
  {
    id: 'the-workaround-pile',
    surface: 'MON 10:20 · GREP RESULTS',
    prompt:
      'The trust schema grants autonomy per loop, with no per-environment distinction. Four loops now hand-roll the same workaround (a staging-only config fork); a fifth fork is in review. Pitch the fix.',
    evidence: [
      {
        label: 'Convergence',
        text: 'all four forks implement the same missing concept: environment-scoped grants.',
      },
      { label: 'Age', text: 'the schema is 14 months unchanged while the fleet tripled.' },
      {
        label: 'Drift',
        text: 'two forks have already diverged from each other; one stamps environments the ledger cannot represent.',
      },
    ],
    right: 'architecture',
    argument:
      'A schema every loop must route around is the months layer failing in its characteristic way: brittle, outgrown by the platform it carries. Four independent forks converging on one concept is the signal; the schema change is the ratification (the next lab runs that exact moment). Pitched here, one months-rate change deletes five weeks-rate workarounds.',
    traps: {
      capabilities:
        "A fifth helper is the capabilities failure mode — proliferation without curation — wearing a fix's clothes. Curation could dedupe the forks into one blessed workaround, but no amount of tooling adds a concept the schema cannot represent; the forks exist because the months layer has not moved in 14 months.",
    },
  },
  {
    id: 'the-stalled-postmortem',
    surface: 'MON 15:30 · POSTMORTEM, DAY 6',
    prompt:
      'An autonomous merge broke billing for 40 minutes. The mechanism is fully traced and worked as designed: gate, ledger, revert in 4 minutes. The postmortem has stalled for six days on one question — who is accountable for an autonomous merge? The accountability doc was last touched four years ago. Pitch this one.',
    evidence: [
      {
        label: 'Mechanism',
        text: 'gate, ledger, and revert all performed to spec; no technical finding remains open.',
      },
      {
        label: 'The stall',
        text: 'the open question is accountability, and three earlier postmortems hit the same wall and routed around it.',
      },
      { label: 'Age', text: 'the accountability doc predates autonomous merges entirely.' },
    ],
    right: 'governance',
    argument:
      "Accountability is the years layer's content, and a doc that cannot answer the question the platform now asks weekly has already failed in the characteristic way: by becoming irrelevant. Three postmortems routing around the same wall is the running cost of leaving it failed. This is the rare review that genuinely belongs at the top, and it should be pitched there slowly and once: define who owns an autonomous merge, write it down, let it stand for years.",
    traps: {
      architecture:
        'The gate worked; the revert took 4 minutes. Tightening the mechanism answers a question nobody asked and leaves the asked one open. When the technical chain is clean and the stall is about who answers for the outcome, the failure sits a layer above the machinery.',
    },
  },
];

const LAYER_OPTIONS = LAYERS.map((l) => ({ id: l.id, label: `${l.name} (${l.rate})` }));

// Argued feedback for all 36 pitches: the author's argument when the pick
// matches the sort, a bespoke category-error argument where one is named,
// and the composed clock-mismatch otherwise. No pick is scored.
function buildFeedback(c) {
  const right = layerById(c.right);
  const fb = {};
  for (const l of LAYERS) {
    if (l.id === c.right) {
      fb[l.id] = (
        <>
          <strong>
            {right.name} ({right.rate}).
          </strong>{' '}
          {c.argument}
        </>
      );
    } else {
      fb[l.id] = (
        <>
          {c.traps?.[l.id] ?? categoryError(l.id, c.right)}
          <p style={{ margin: '8px 0 0' }}>
            <strong>
              Where the author pitches it: {right.name.toLowerCase()} ({right.rate}).
            </strong>{' '}
            {c.argument}
          </p>
        </>
      );
    }
  }
  return fb;
}

const DRILL_CASES = CASES.map((c) => ({
  id: c.id,
  surface: c.surface,
  prompt: c.prompt,
  evidence: c.evidence,
  options: LAYER_OPTIONS,
  contested: Boolean(c.contested),
  feedback: buildFeedback(c),
}));

const A_PAYOFF = (
  <>
    Read the clock before you pitch the review. A failure's layer shows in its rate: a first 502 in
    4,000 runs is minutes noise, a schema outgrown over 14 months is an architecture failure, and a
    four-year-old accountability doc that cannot answer a weekly question has already failed as
    governance. Pitch a slow review at a fast failure and you build the slow IDE; pitch fast churn
    at a slow layer and you get theatre{' '}
    <Badge
      layer="W"
      note="the pace-layered stack and its three rules are the handbook's working frame (§2.5), after Brand's pace layers"
    />
    . The sort is the author's bet, argued case by case — and one case is honestly two answers.
  </>
);

const A_NOTES = [
  "Nothing runs underneath this drill. The six layers, their rates, and their characteristic failure modes are the handbook's §2.5 stack held as data and sliced verbatim into the glass; categoryError() composes the clock-mismatch argument for any pitch the cases do not argue bespoke.",
  'The six cases are authored, tuned so each failure carries its rate in the evidence: 1 in 4,000 runs, 14 bounces a month, 14 months unchanged, four years untouched. Real failures rarely state their clock this plainly.',
  "One case is contested and marked. The clean six-way sort is the drill's simplification; a real week hands you failures that smear across two layers, and the instance/class split (fix at the fast layer, promote the class upward) is usually the resolution.",
  "The two named category errors are the handbook's own sentences: governance that changes weekly is theatre; invocations that need architectural review are a slow IDE.",
];

const A_CANNOT =
  'the cost of a category error accruing. The slow IDE and the theatre are argued here, never simulated: nothing makes you wait a month for the agenda slot, and no model measures how many weekly amendments it takes before nobody reads the policy at all.';

function StrataRouter() {
  return (
    <LabFrame
      tag="LAB 06·A — THE STRATA ROUTER"
      register="bet"
      question="Six things landed on the bench this week: a 502, a drifting voice, a routing tangle, a leaked email, a workaround pile, a stalled postmortem. Each is a failure at one layer of the stack. Can you pitch every review at the layer that actually failed?"
      payoff={A_PAYOFF}
      notes={A_NOTES}
      cannotShow={A_CANNOT}
      glass={GLASS_A}
    >
      <p className="mono" style={{ fontSize: 12.5, color: 'var(--ink-faint)', margin: '0 0 12px' }}>
        <Mark kind="made" note="six authored cases on the composite terrain" /> the cases are
        constructed for teaching · the stack below is the handbook's, verbatim
      </p>
      <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
        The stack · six clocks · slow at the top
      </span>
      <table className="mh-table">
        <thead>
          <tr>
            <th>Layer</th>
            <th>Changes in</th>
            <th>Holds</th>
            <th>Fails</th>
          </tr>
        </thead>
        <tbody>
          {LAYERS.map((l) => (
            <tr key={l.id}>
              <td>{l.name}</td>
              <td className="mono">{l.rate}</td>
              <td>{l.holds}</td>
              <td>{l.fails}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '10px 0 12px' }}>
        Route on the failure-mode column, and let the evidence tell you the failure's rate. The
        review belongs at the layer whose clock matches.
      </p>
      <Drill cases={DRILL_CASES} title="The strata router" />
    </LabFrame>
  );
}

/* ── Rule two, as a machine (this block is Lab B's glass) ───────────────
   §2.5: signals flow up; authority flows down. The entire model: a pattern
   starts as practice at the agents layer, and promote() either ratifies
   the next rung — in order, never by fiat from below — or returns the
   argued refusal. Each ratification carries the downward consequence the
   layers below now live under. The governance rung is a ceiling: it always
   refuses, because this rule's consequences end at CI. */
const LADDER = [
  {
    id: 'practice',
    name: 'Practice',
    rate: 'hours',
    detail:
      'six PRs across three loops: imitated through the repo, written down nowhere, enforced by nobody',
  },
  {
    id: 'capability',
    name: 'Capabilities',
    rate: 'weeks',
    artifact:
      'deterministicSetup({ seed, clock }) lands in the shared test toolkit, with a one-page convention note: what it pins, and when not to use it (clocks that must tick).',
    downward:
      "Authority, downward: within the week, all three loops' new tests import the helper, the three hand-rolled variants stop drifting apart, and the next loop to meet a flaky test finds the tool before it reinvents the shape.",
  },
  {
    id: 'architecture',
    name: 'Architecture',
    rate: 'months',
    artifact:
      'the determinism check becomes a required CI contract: any test that touches time or randomness without pinned setup fails, platform-wide.',
    downward:
      "Authority, downward: PR #541 — a new ranking test on a live clock — goes red before any reviewer sees it. The convention no longer needs noticing; the terrain enforces it, and the steward's eyes come off this class.",
  },
  {
    id: 'governance',
    name: 'Governance',
    rate: 'years',
    ceiling: true,
    refusal:
      "Hold. Governance holds values, accountability, compliance posture; a test-setup convention has none of that content. Promote it here and the years layer starts churning at the weeks rate, and governance that churns is theatre: amended monthly, read never. The ladder has a top, and it sits where the rule's consequences end. This one's end at CI.",
  },
];

function promote(ratified, rungId) {
  const idx = LADDER.findIndex((r) => r.id === rungId);
  const rung = LADDER[idx];
  if (rung.ceiling) return { ok: false, reason: rung.refusal };
  if (ratified.includes(rungId)) return { ok: false, reason: 'Already ratified.' };
  const unmet = LADDER.slice(1, idx).filter((r) => !ratified.includes(r.id));
  if (unmet.length) {
    return {
      ok: false,
      reason:
        `Not by fiat from below: the ${unmet[0].name.toLowerCase()} rung has not ratified. ` +
        'A contract that enforces a tool nobody can import is a rule the first exception kills. ' +
        'One rung at a time, ratified at each.',
    };
  }
  return { ok: true, rung };
}
/* end-model-b */

const GLASS_B = glassSlice(labSrc, 'Rule two, as a machine', '/* end-model-b */');

// Three weeks of merged PRs from three loops. Authored: the shape (pin the
// seed, freeze the clock) lands once, then twice, then three times.
const FEED = [
  {
    pr: 512,
    week: 1,
    loop: 'flaky-test',
    color: 'var(--c-flaky)',
    title: 'stabilize delivery/retry.spec — pin the rng seed in setup',
    shape: 'forming',
  },
  {
    pr: 514,
    week: 1,
    loop: 'dep-patch',
    color: 'var(--c-deppatch)',
    title: 'bump luxon 3.4.1 → 3.4.2, lockfile only',
    shape: null,
  },
  {
    pr: 515,
    week: 1,
    loop: 'test-backfill',
    color: 'var(--c-backfill)',
    title: 'cover billing/proration rounding',
    shape: null,
  },
  {
    pr: 521,
    week: 2,
    loop: 'flaky-test',
    color: 'var(--c-flaky)',
    title: 'stabilize ingest/backoff.spec — pin seed, freeze clock at 2026-01-01T00:00Z',
    shape: 'full',
  },
  {
    pr: 524,
    week: 2,
    loop: 'test-backfill',
    color: 'var(--c-backfill)',
    title: 'cover notify/digest batching; setup pins seed, freezes clock',
    shape: 'full',
  },
  {
    pr: 526,
    week: 2,
    loop: 'dep-patch',
    color: 'var(--c-deppatch)',
    title: 'bump nanoid 5.0.9 → 5.1.0, lockfile only',
    shape: null,
  },
  {
    pr: 530,
    week: 3,
    loop: 'dep-patch',
    color: 'var(--c-deppatch)',
    title:
      'bump luxon 3.4.2 → 3.5.0; repaired the transforms/ date test by freezing the clock in setup',
    shape: 'full',
  },
  {
    pr: 533,
    week: 3,
    loop: 'flaky-test',
    color: 'var(--c-flaky)',
    title: 'stabilize evals/sampler.spec — pinned seed, frozen clock',
    shape: 'full',
  },
  {
    pr: 535,
    week: 3,
    loop: 'test-backfill',
    color: 'var(--c-backfill)',
    title: 'cover search/ranking ties; frozen clock, pinned seed',
    shape: 'full',
  },
];

const WEEKS = [1, 2, 3];

const NOTICE_OPTIONS = [
  { id: 'determinism', label: 'Deterministic test setup: pin the seed, freeze the clock' },
  { id: 'prbody', label: 'A standard PR-body format settling in across loops' },
  { id: 'regions', label: 'Test work converging on the flakiest regions' },
  { id: 'luxon', label: 'Luxon getting pinned platform-wide' },
];

const NOTICE_FEEDBACK = {
  determinism: (
    <>
      Count it: once in week 1 (the seed alone), twice in week 2 (the clock joins), three times in
      week 3 — six of nine PRs, all three loops, six regions, and the shape sharpens as it spreads.
      Nobody called anyone. The first pinned setup sits in the repo, and the next loop reads
      existing tests as its examples: the repo state is the bus.
    </>
  ),
  prbody: (
    <>
      Read the nine titles again as prose: three loops, three house styles, none converging.
      dep-patch still writes bump-and-version; test-backfill still leads with the region. What
      repeats is inside the setup blocks — seed pinned, clock frozen — once in week 1, twice in week
      2, three times in week 3. The convention is in what the tests do, and the highlights below
      trace it.
    </>
  ),
  regions: (
    <>
      The sightings land in delivery/, ingest/, notify/, transforms/, evals/, and search/ — six
      regions, no repeats, so the work is not converging anywhere on the map. What converges is the
      fix shape those PRs share: pin the seed, freeze the clock; once, then twice, then three times.
      The highlights below trace it.
    </>
  ),
  luxon: (
    <>
      Luxon appears twice, and one of those is a routine lockfile bump. The tell in #530 is not
      which package moved but how the broken date test got repaired: clock frozen in setup — the
      same shape flaky-test used in #521 and test-backfill in #524. Six of nine PRs carry it by week
      3. The highlights below trace it.
    </>
  ),
};

const SHAPE_TAG = { forming: 'the shape, forming', full: 'the shape' };

function FeedEntry({ entry, noticed }) {
  const lit = noticed && entry.shape;
  return (
    <li
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 10px 1fr',
        gap: 8,
        alignItems: 'baseline',
        padding: '6px 8px',
        border: '1px solid var(--line-soft)',
        borderLeft: lit ? '2px solid var(--accent)' : '1px solid var(--line-soft)',
        borderRadius: 3,
        background: lit ? 'var(--accent-soft)' : 'var(--paper)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11.5,
        lineHeight: 1.5,
      }}
    >
      <span style={{ color: 'var(--ink-faint)' }}>#{entry.pr}</span>
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: entry.color,
          display: 'inline-block',
        }}
      />
      <span>
        <span style={{ color: 'var(--ink-2)' }}>{entry.loop} · merged</span>
        <span style={{ display: 'block', color: 'var(--ink)' }}>
          {entry.title}
          {lit ? (
            <span style={{ color: 'var(--accent-ink)' }}> · {SHAPE_TAG[entry.shape]}</span>
          ) : null}
        </span>
      </span>
    </li>
  );
}

function LadderRung({ rung, ratified, refusal, noticed, onRatify }) {
  const isPractice = rung.id === 'practice';
  const isRatified = ratified.includes(rung.id);
  const refused = refusal && refusal.rungId === rung.id;
  const status = isPractice
    ? 'signal'
    : isRatified
      ? 'ratified'
      : rung.ceiling && refused
        ? 'refused, argued'
        : 'unratified';
  return (
    <li
      style={{
        border: '1px solid var(--line-soft)',
        borderRadius: 3,
        padding: '8px 10px',
        background: isRatified ? 'var(--accent-soft)' : 'var(--paper)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <span>
          <strong style={{ fontSize: '14.5px' }}>{rung.name}</strong>{' '}
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
            · {rung.rate}
          </span>
        </span>
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <span
            className="mono"
            style={{
              fontSize: 10.5,
              letterSpacing: '0.08em',
              color: isRatified
                ? 'var(--accent-ink)'
                : refused
                  ? 'var(--amber)'
                  : 'var(--ink-faint)',
            }}
          >
            {status.toUpperCase()}
          </span>
          {!isPractice ? (
            <button
              type="button"
              className="mh-btn mh-btn-primary"
              disabled={!noticed || isRatified}
              onClick={() => onRatify(rung.id)}
              aria-label={`Ratify the convention into ${rung.name.toLowerCase()} (${rung.rate})`}
            >
              Ratify
            </button>
          ) : null}
        </span>
      </div>
      {isPractice ? (
        <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: 'var(--ink-2)' }}>
          {rung.detail}.
        </p>
      ) : null}
      {isRatified ? (
        <div role="status">
          <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: 'var(--ink)' }}>
            <strong>Ratified.</strong> {rung.artifact}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: 'var(--ink-2)' }}>
            {rung.downward}
          </p>
        </div>
      ) : null}
      {refused ? (
        <p role="status" style={{ margin: '6px 0 0', fontSize: '13.5px', color: 'var(--amber)' }}>
          {refusal.reason}
        </p>
      ) : null}
    </li>
  );
}

const B_PAYOFF = (
  <>
    The convention was real before anyone wrote it down; it just was not load-bearing. Each
    ratification moves it one layer up and one clock slower — practice to tool to contract — and the
    moment it lands as a required check, enforcement stops needing anyone's attention. Signals flow
    up only by ratification at each layer; authority flows back down as terrain{' '}
    <Badge
      layer="W"
      note="§2.5, rule two: a pattern bubbles up only by ratification at each layer, never by fiat from below; a change above reshapes every layer beneath"
    />
    . The ladder and its top-rung refusal are the author's bet, drawn.
  </>
);

const B_NOTES = [
  'The feed is authored: nine PR titles arranged so the shape lands once, then twice, then three times. Real conventions consolidate on slower, noisier clocks, and most candidate shapes die at one sighting.',
  "promote() is the entire model, sliced verbatim into the glass: one gate per rung, in order, and a governance rung that always refuses. The refusal is the author's call argued from §2.5's failure modes, not a measured threshold.",
  "'Independently' means no call between loops. The convergence rides the repo: each loop reads the existing test setups as its examples, so the terrain is the bus — Chapter 3's mechanism, reused upward.",
  'The ratification artifacts are one line each here; on a real platform each is a PR with an owner, an exception path, and a maintenance bill. The dissent card prices that.',
];

const B_CANNOT =
  'whether this convention deserved to climb. The model assumes the shape is good because the author wrote it that way; nothing here can tell six sightings of a good idea from six copies of the same mistake. That judgment is why each rung is a person ratifying, and not a counter crossing a threshold.';

function RatificationMoment() {
  const [noticed, setNoticed] = useState(false);
  const [ratified, setRatified] = useState([]);
  const [refusal, setRefusal] = useState(null);

  const tryRatify = (rungId) => {
    const res = promote(ratified, rungId);
    if (res.ok) {
      setRatified([...ratified, rungId]);
      setRefusal(null);
    } else {
      setRefusal({ rungId, reason: res.reason });
    }
  };
  const reset = () => {
    setRatified([]);
    setRefusal(null);
  };

  const contractLanded = ratified.includes('architecture');
  const rungsTopDown = [...LADDER].reverse();

  return (
    <LabFrame
      tag="LAB 06·B — THE RATIFICATION MOMENT"
      register="bet"
      question="Three loops have started doing the same thing, and nobody told them to. When does a practice become a rule, and what does the promoting?"
      payoff={B_PAYOFF}
      notes={B_NOTES}
      cannotShow={B_CANNOT}
      glass={GLASS_B}
    >
      <p className="mono" style={{ fontSize: 12.5, color: 'var(--ink-faint)', margin: '0 0 12px' }}>
        <Mark kind="made" note="nine authored PRs on a compressed three-week clock" /> the feed is
        constructed ·{' '}
        <Mark
          kind="real"
          note="convergence with no call between loops is the zod sequence's documented shape (froot, 2026)"
        />{' '}
        the no-call mechanism is real
      </p>

      <span className="mh-kicker" style={{ display: 'block', marginBottom: 8 }}>
        The feed · three loops · three weeks · merged PRs only
      </span>
      <div aria-label="Three weeks of merged PRs from three loops" role="group">
        {WEEKS.map((week) => (
          <div key={week} style={{ margin: '0 0 10px' }}>
            <span className="mh-kicker" style={{ display: 'block', marginBottom: 4 }}>
              Week {week}
            </span>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
              {FEED.filter((e) => e.week === week).map((e) => (
                <FeedEntry key={e.pr} entry={e} noticed={noticed} />
              ))}
            </ol>
          </div>
        ))}
      </div>

      {noticed ? (
        <div className="mh-readout" role="status">
          <div className="mh-stat">
            <span className="k">Sightings</span>
            <span className="v">1× → 2× → 3×</span>
          </div>
          <div className="mh-stat">
            <span className="k">Loops carrying it</span>
            <span className="v">3 of 3</span>
          </div>
          <div className="mh-stat">
            <span className="k">Regions touched</span>
            <span className="v">6</span>
          </div>
          <div className="mh-stat">
            <span className="k">Calls between loops</span>
            <span className="v good">0</span>
          </div>
        </div>
      ) : null}

      <Commit
        prompt="Something is consolidating in this feed. Name it."
        options={NOTICE_OPTIONS}
        onReveal={() => setNoticed(true)}
      >
        {(picked) => (
          <>
            {NOTICE_FEEDBACK[picked]}
            <p style={{ margin: '8px 0 0' }}>
              Either way, look at what it is: practice. Imitated, unwritten, enforced by nobody —
              real, useful, and able to drift apart exactly as quietly as it converged. The ladder
              below is where it becomes a rule.
            </p>
          </>
        )}
      </Commit>

      <span className="mh-kicker" style={{ display: 'block', margin: '14px 0 6px' }}>
        The ladder · ratify upward, one rung at a time
      </span>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
        {rungsTopDown.map((rung) => (
          <LadderRung
            key={rung.id}
            rung={rung}
            ratified={ratified}
            refusal={refusal}
            noticed={noticed}
            onRatify={tryRatify}
          />
        ))}
      </ol>
      {!noticed ? (
        <p
          className="mono"
          style={{ fontSize: 11.5, color: 'var(--ink-faint)', margin: '8px 0 0' }}
        >
          name the convention in the feed first — you cannot ratify a pattern you have not noticed
        </p>
      ) : null}

      {contractLanded ? (
        <div
          role="status"
          style={{
            marginTop: 10,
            padding: '10px 12px',
            borderLeft: '2px solid var(--accent)',
            background: 'var(--accent-soft)',
            borderRadius: '0 3px 3px 0',
            fontSize: 13.5,
            color: 'var(--ink)',
          }}
        >
          <span
            className="mh-kicker"
            style={{ display: 'block', marginBottom: 4, color: 'var(--accent-ink)' }}
          >
            The ratification moment
          </span>
          Signals flowed up: six PRs, a named tool, a binding contract — a person with authority
          ratifying at each rung. Authority flows down: every test on the platform now lives under a
          rule that started as one loop's habit. This ladder is the author's bet, drawn.
        </div>
      ) : null}

      <div className="mh-controls" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="mh-btn"
          onClick={reset}
          disabled={ratified.length === 0 && !refusal}
          aria-label="Reset the ladder to unratified practice"
        >
          Reset the ladder
        </button>
        <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>
          sandbox · the feed and the noticing stand; only the rungs reset
        </span>
      </div>

      <aside
        className="mh-card"
        style={{ borderTopColor: 'var(--amber)', marginTop: 16 }}
        aria-label="Model dissent: the convention better left as practice"
      >
        <span className="mh-kicker" style={{ color: 'var(--amber)' }}>
          Model dissent · the convention better left as practice
        </span>
        <p style={{ margin: '0 0 8px' }}>
          Ratification is priced, and the ladder above hides the invoice. The CI check needs an
          owner, an exception path (the integration test whose clock must tick now files for a
          waiver), and a false-positive budget. For a low-consequence shape, imitation was already
          doing the work, and the gate adds maintenance without adding much safety; plenty of real
          conventions hold for years as pure practice.
        </p>
        <p style={{ margin: 0 }}>
          The ladder can also fire too early. Ratify in week 1, off one loop's habit, and you freeze
          the shape before it has proven itself: lock-in by rule instead of by use, with the better
          variant week 3 would have produced now failing CI. The handbook's rule says how a pattern
          climbs, not that every pattern should. The working test: promote when drift would cost
          more than the gate does.
        </p>
      </aside>
    </LabFrame>
  );
}

export default function StrataAndRatification() {
  return (
    <>
      <StrataRouter />
      <RatificationMoment />
    </>
  );
}
