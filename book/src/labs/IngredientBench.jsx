// IngredientBench.jsx — LAB 14·A, the Six-Ingredient Bench + specimen
// diagnosis (Ch 14, DESIGN §6.8; mechanism register, plus the corpus deck).
//
// Chapter 1's dependency-patch machine as six removable stanzas. Pull one,
// commit a prediction from the §3.2 table, run thirty days (six weekly
// cycles of stepWeek), and watch the named pathology arrive: misfires,
// blast-radius creep, self-approval, ossification, amnesia, or the single
// global trust switch. Seeds are pinned per stanza so each removal tells
// the same story every time; every number in the feedback is read off the
// runs themselves, so the prose can never drift from what the engine did.
// Closer: the specimen diagnosis drill — the same six-slot check, run on
// loop-kind cases from the bank.
//
// Physics: stepWeek()/runLoopWeeks() in src/engine/loopstep.js.

import { useEffect, useState } from 'react';
import { Artifact, Badge, Commit, Drill, LabFrame, Mark, glassSlice } from '../components/kit.jsx';
import { usePrefersReducedMotion } from '../shared/usePrefersReducedMotion.js';
import { runLoopWeeks } from '../engine/loopstep.js';
import { CASES } from '../engine/cases.js';
import loopstepRaw from '../engine/loopstep.js?raw';

/* ── The runs (module-level: same seeds, same stories, forever) ────────── */

const WEEKS = 6;
const DAYS = 30; // six five-day weeks: the thirty working days the bench runs
const HOME_SEED = 9; // the at-rest run: all six stanzas in place, no drama

// One entry per ingredient, in the §3.2 table's order. `what` is the table's
// second column, verbatim; `consequence` is its third, the prediction chips.
// Seeds are pinned so each pull draws its named pathology legibly inside the
// thirty days (see the model notes).
const INGREDIENTS = [
  {
    id: 'signal',
    stanza: 'signal:',
    pathology: 'misfires',
    what: 'A trace in the terrain that fires the loop',
    consequence: 'The loop never starts, or fires on the wrong conditions',
    seed: 2,
    pullNote: 'pulled — an alternate-week schedule fires blind',
  },
  {
    id: 'boundedAction',
    stanza: 'action:',
    pathology: 'blast-radius creep',
    what: 'Scoped to a specific class of change',
    consequence: 'Scope creep; blast radius exceeds the reasoning that approved it',
    seed: 9,
    pullNote: 'pulled — the diff is whatever it becomes',
  },
  {
    id: 'verification',
    stanza: 'verification:',
    pathology: 'self-approval',
    what: 'An outside reference: tests, eval, human judgment',
    consequence: 'The loop self-approves; drift; Goodhart',
    seed: 5,
    pullNote: 'pulled — the loop grades its own work',
  },
  {
    id: 'reversibility',
    stanza: 'revert:',
    pathology: 'ossification',
    what: 'A cheap, well-understood undo path',
    consequence: 'Mistakes ossify; stewards stop trusting the loop',
    seed: 8,
    pullNote: 'pulled — merges are permanent',
  },
  {
    id: 'signalUpdate',
    stanza: 'update:',
    pathology: 'amnesia',
    what: 'Outcome feeds back into the terrain',
    consequence: "The next loop can't learn from this one",
    seed: 9,
    pullNote: 'pulled — outcomes die on stdout',
  },
  {
    id: 'authoritySurface',
    stanza: 'authority:',
    pathology: 'the global switch',
    what: 'Explicit rules for when autonomy expands or contracts',
    consequence: 'Trust becomes a single global decision; fragility follows',
    seed: 17,
    pullNote: 'pulled — one global switch remains',
  },
];

// For every stanza: the run with that one ingredient removed, and the intact
// run on the same seed — so the only difference between the two is the pull.
const RUNS = Object.fromEntries(
  INGREDIENTS.map((g) => [
    g.id,
    {
      pulled: runLoopWeeks({ weeks: WEEKS, seed: g.seed, config: { [g.id]: false } }),
      intact: runLoopWeeks({ weeks: WEEKS, seed: g.seed }),
    },
  ]),
);
const BASELINE = runLoopWeeks({ weeks: WEEKS, seed: HOME_SEED });

/* ── Numbers cited in the prose, read off the runs ─────────────────────── */

const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const rnd = (x) => Math.round(x);
const f2 = (x) => x.toFixed(2);

const BASE_RC1 = rnd(BASELINE.series.reviewCost[0]); // 51
const BASE_RC6 = rnd(BASELINE.series.reviewCost.at(-1)); // 37

const SIG = RUNS.signal;
const SIG_ALIGNED = SIG.pulled.weeks.filter((w) => w.merged > 0).map((w) => w.week); // [3, 5]
const SIG_MISSED = SIG.pulled.summary.missedWeeks; // [2, 4, 6]
const SIG_FALSE = SIG.pulled.summary.falseFires; // [1]
const SIG_MERGED = SIG.pulled.summary.totalMerged; // 8
const SIG_INTACT_MERGED = SIG.intact.summary.totalMerged; // 20

const BND = RUNS.boundedAction;
const BND_WEEK = BND.pulled.summary.blastRadiusExceededWeek; // 5
const BND_SCOPE6 = BND.pulled.series.scope.at(-1); // 6.05
const BND_RC6 = rnd(BND.pulled.series.reviewCost.at(-1)); // 221
const BND_INTACT_RC6 = rnd(BND.intact.series.reviewCost.at(-1)); // 37

const VER = RUNS.verification;
const VER_CONF = VER.pulled.summary.confidence;
const VER_QUAL = VER.pulled.summary.quality;
const VER_CROSS = VER_CONF.findIndex((c, i) => c > VER_QUAL[i]) + 1; // week 4
const VER_ESCAPED = VER.pulled.summary.totalDefectsEscaped; // 6
const VER_MERGED = VER.pulled.summary.totalMerged; // 24
const VER_RC = rnd(VER.pulled.series.reviewCost[0]); // 4, flat
const VER_TRUST6 = f2(VER.pulled.series.trust.at(-1)); // 0.50

const REV = RUNS.reversibility;
const REV_WEEK = REV.pulled.weeks.find((w) => w.events.some((e) => e.includes('ossified'))).week; // 3
const REV_RC_BEFORE = rnd(REV.pulled.series.reviewCost[REV_WEEK - 1]); // 45
const REV_RC_AFTER = rnd(REV.pulled.series.reviewCost[REV_WEEK]); // 90
const REV_TRUST6 = f2(REV.pulled.series.trust.at(-1)); // 0.35
const REV_INTACT_RC6 = rnd(REV.intact.series.reviewCost.at(-1)); // 37

const UPD = RUNS.signalUpdate;
const UPD_MERGED = UPD.pulled.summary.totalMerged; // 24
const UPD_RC = rnd(UPD.pulled.series.reviewCost.at(-1)); // 51, flat
const UPD_INTACT_RC6 = rnd(UPD.intact.series.reviewCost.at(-1)); // 37
const UPD_TRUST = f2(UPD.pulled.series.trust.at(-1)); // 0.20
const UPD_BILL = rnd(sum(UPD.pulled.series.reviewCost) - sum(UPD.intact.series.reviewCost)); // 44
const UPD_RELIT = UPD.pulled.weeks.filter((w) =>
  w.events.some((e) => e.includes('re-litigated')),
).length; // 6

const AUT = RUNS.authoritySurface;
const AUT_FLIP = AUT.pulled.summary.globalTrustFlip; // { week: 4, cause }
const AUT_TRUST_BEFORE = f2(AUT.pulled.series.trust[AUT_FLIP.week - 2]); // 0.40
const AUT_RC_AFTER = rnd(AUT.pulled.series.reviewCost[AUT_FLIP.week]); // 60
const AUT_INTACT_TRUST6 = f2(AUT.intact.series.trust.at(-1)); // 0.57

// stepWeek is the §3.2 table, executable: every pathology this bench shows
// is a visible branch in it. The constants block rides along because the
// shapes are theirs.
const GLASS = [
  glassSlice(loopstepRaw, '// Tuned constants', 'const QUALITY_FLOOR'),
  glassSlice(loopstepRaw, 'function stepWeek(state, config, rng)', '\n}'),
].join('\n\n// ── …and the week those constants drive ──\n\n');

/* ── The artifact pane: six stanzas, each removable ────────────────────── */

const BENCHFILE = [
  { no: 1, text: 'loop: dependency-patch', kind: 'key' },
  { no: 2, text: 'signal:', kind: 'key', ing: 'signal' },
  { no: 3, text: '  watch: deps.outdated(level: patch)', ing: 'signal' },
  { no: 4, text: '  fires_when: changelog == clean', ing: 'signal' },
  { no: 5, text: 'action:', kind: 'key', ing: 'boundedAction' },
  { no: 6, text: '  bound: one bump per PR, lockfile only', ing: 'boundedAction' },
  { no: 7, text: 'verification:', kind: 'key', ing: 'verification' },
  { no: 8, text: '  oracle: target repo CI', ing: 'verification', annot: 'outside the loop' },
  { no: 9, text: 'revert:', kind: 'key', ing: 'reversibility' },
  { no: 10, text: '  path: git revert; on_red close + delete branch', ing: 'reversibility' },
  { no: 11, text: 'update:', kind: 'key', ing: 'signalUpdate' },
  { no: 12, text: '  record: {merged, reverted, closed} -> track record', ing: 'signalUpdate' },
  { no: 13, text: 'authority:', kind: 'key', ing: 'authoritySurface' },
  {
    no: 14,
    text: '  per_class: {patch, minor, lockfile} · earned, revocable',
    ing: 'authoritySurface',
  },
];

function benchfileLines(pulledId) {
  return BENCHFILE.map((l) => {
    if (!pulledId || l.ing !== pulledId) return { ...l };
    const head = l.kind === 'key';
    const note = INGREDIENTS.find((g) => g.id === pulledId).pullNote;
    return { no: l.no, text: l.text, kind: 'comment', annot: head ? note : undefined };
  });
}

/* ── The argued feedback ───────────────────────────────────────────────── */

// What each table row's failure looks like when it does arrive — used when
// the reader's call and the pulled stanza disagree, so the feedback can
// argue from signatures instead of handing down a verdict.
const TELLS = {
  signal: 'a firing record full of no-op PRs and missed windows',
  boundedAction: 'a diff that quietly widens past what any approval reasoned about',
  verification: 'confidence climbing while quality falls, and a log with nothing in it',
  reversibility: 'one early mistake that cannot come out, taxing every change after it',
  signalUpdate: 'flat trust, and a week six priced like week one',
  authoritySurface: 'a single switch doing the work of per-class judgment',
};

// What the thirty days drew, per pulled stanza. Every number comes from the
// pinned runs above.
const OBSERVED = {
  signal: (
    <p style={{ margin: 0 }}>
      The watcher on <span className="mono">deps.outdated</span> is gone, so an alternate-week
      schedule fires blind while real patch windows land where they land. In thirty days the two
      line up twice — weeks {SIG_ALIGNED.join(' and ')}, by coincidence — and the other four weeks
      split between the table's two misfire modes: week {SIG_FALSE.join(', ')} opens a no-op PR
      against nothing, and clean patches sit unapplied through weeks {SIG_MISSED.join(', ')}.{' '}
      {SIG_MERGED} merges instead of the {SIG_INTACT_MERGED} this seed delivers intact, with junk on
      the steward's desk besides.{' '}
      <strong>"Every other Monday" is a schedule, not a condition in the terrain</strong>; the
      misfire record is the difference between them.
    </p>
  ),
  boundedAction: (
    <p style={{ margin: 0 }}>
      Nothing fails loudly, and that is the trap: every PR still merges green. The diff just widens
      1.35× a week — minor bumps ride along with patches, then config edits, then a refactor while
      it was in there. Week {BND_WEEK} it crosses 4×, the widest change anyone's approval had
      actually reasoned about, and by week 6 a single PR touches {BND_SCOPE6}× its chartered scope
      while review burns {BND_RC6} minutes a week against the intact bench's {BND_INTACT_RC6}.{' '}
      <strong>Blast radius outgrew the reasoning that approved it</strong> — and every one of those
      merges was reviewed.
    </p>
  ),
  verification: (
    <p style={{ margin: 0 }}>
      Review falls to {VER_RC} minutes a week — the loop waving itself through — and the log goes
      silent for the whole month, because escapes are precisely what no oracle sees. Meanwhile{' '}
      {VER_ESCAPED} regressions ride {VER_MERGED} merges onto main. Self-reported confidence climbs{' '}
      {VER_CONF[0].toFixed(2)} → {VER_CONF.at(-1).toFixed(2)} in the silence; true quality falls{' '}
      {VER_QUAL[0].toFixed(2)} → {VER_QUAL.at(-1).toFixed(2)}; the lines cross in week {VER_CROSS}.{' '}
      <strong>That crossing is Goodhart, drawn</strong>: the loop now optimizes the only measure
      left, its own green checkmark. Even the track record inflates — trust ends at {VER_TRUST6},
      earned on merges nobody checked.
    </p>
  ),
  reversibility: (
    <p style={{ margin: 0 }}>
      Weeks 1 and 2 are indistinguishable from the intact bench. Week {REV_WEEK}, a routine
      regression lands — the same one the intact run on this seed catches and reverts for the price
      of a log line — but the undo path is the stanza you pulled, so it stays, and becomes
      load-bearing. Review jumps from {REV_RC_BEFORE} to {REV_RC_AFTER} minutes a week and never
      comes back down:{' '}
      <strong>every later diff is re-read against a mistake that cannot come out</strong>. Trust
      freezes at {REV_TRUST6}. The intact bench ends the month at {REV_INTACT_RC6} minutes; this one
      pays double, indefinitely. Mistakes ossify, and stewards stop trusting the loop — the second
      cost is the one that kills it.
    </p>
  ),
  signalUpdate: (
    <p style={{ margin: 0 }}>
      Every run this month is perfect: {UPD_MERGED} proposals, {UPD_MERGED} green merges, nothing
      escaped. And the bench learns nothing from any of it, because{' '}
      <strong>outcomes die on stdout instead of landing on the track record</strong>. Trust holds at{' '}
      {UPD_TRUST}, so week six is priced exactly like week one — {UPD_RC} minutes against the
      closing loop's {UPD_INTACT_RC6} — and the log re-litigates the same finding {UPD_RELIT} times:
      is a lockfile-only diff safe to skim? The gap, summed, is {UPD_BILL} steward minutes of
      amnesia bill in thirty days, and it renews monthly until someone notices that nothing here
      remembers.
    </p>
  ),
  authoritySurface: (
    <p style={{ margin: 0 }}>
      Week {AUT_FLIP.week}: one patch-bump regression — caught post-merge, reverted clean, fully
      handled by the five stanzas still in place. The intact run on this seed meets the identical
      failure in the identical week, and its record barely notices: it ends the month at{' '}
      {AUT_INTACT_TRUST6}. Here, with no per-class rules, the org's only incident response is the
      one switch it has, and in the post-incident meeting somebody flips it. Mean trust drops{' '}
      {AUT_TRUST_BEFORE} → 0 in a day: minor-bump and lockfile-refresh, classes with spotless
      records, zeroed alongside the class that slipped. Review snaps back to {AUT_RC_AFTER} minutes
      a week, and nothing defines what turning back on would take.{' '}
      <strong>One flip, in panic, kills every class.</strong>
    </p>
  ),
};

function feedbackFor(pulledId, picked) {
  const g = INGREDIENTS.find((x) => x.id === pulledId);
  if (picked === pulledId) {
    return (
      <>
        <p style={{ margin: '0 0 8px' }}>The table's row, observed.</p>
        {OBSERVED[pulledId]}
      </>
    );
  }
  return (
    <>
      <p style={{ margin: '0 0 8px' }}>
        A real row of the table — but its signature is {TELLS[picked]}, and these thirty days never
        draw it. What arrives instead is the pulled stanza's own bill.
      </p>
      {OBSERVED[pulledId]}
      <p style={{ margin: '8px 0 0' }}>
        §3.2's row for a pulled <span className="mono">{g.stanza}</span> stanza: "
        {g.consequence.toLowerCase()}."
      </p>
    </>
  );
}

/* ── Charts: one line chart and one week strip, engine series only ─────── */

function LineChart({ series, yMin = 0, yMax, ticks, upto, marker, limit, ariaLabel, caption }) {
  const W = 440;
  const H = 195;
  const padL = 44;
  const padR = 16;
  const padT = 18;
  const padB = 30;
  const upN = Math.max(1, Math.min(upto, WEEKS));
  const x = (w) => padL + ((w - 1) / (WEEKS - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - (v - yMin) / (yMax - yMin)) * (H - padT - padB);
  const pts = (vals) =>
    vals
      .slice(0, upN)
      .map((v, i) => `${x(i + 1)},${y(v)}`)
      .join(' ');
  return (
    <figure style={{ margin: '10px 0 0' }}>
      <div
        className="mono"
        style={{
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          fontSize: '10.5px',
          color: 'var(--ink-faint)',
          marginBottom: 4,
        }}
      >
        {series.map((s) => (
          <span key={s.label} style={{ color: s.color }}>
            ━ {s.label}
          </span>
        ))}
        {limit ? <span style={{ color: 'var(--amber)' }}>┅ {limit.label}</span> : null}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={ariaLabel}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {ticks.map((t) => (
          <g key={t.v}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(t.v)}
              y2={y(t.v)}
              stroke="var(--line-soft)"
              strokeWidth="1"
            />
            <text
              x={padL - 6}
              y={y(t.v) + 3.5}
              textAnchor="end"
              fontSize="9"
              fill="var(--ink-faint)"
              fontFamily="var(--font-mono)"
            >
              {t.label}
            </text>
          </g>
        ))}
        {Array.from({ length: WEEKS }, (_, i) => i + 1).map((w) => (
          <text
            key={w}
            x={x(w)}
            y={H - padB + 14}
            textAnchor="middle"
            fontSize="9"
            fill="var(--ink-faint)"
            fontFamily="var(--font-mono)"
          >
            wk {w}
          </text>
        ))}
        {limit ? (
          <line
            x1={padL}
            x2={W - padR}
            y1={y(limit.v)}
            y2={y(limit.v)}
            stroke="var(--amber)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ) : null}
        {marker && marker.week <= upN ? (
          <g>
            <line
              x1={x(marker.week)}
              x2={x(marker.week)}
              y1={padT}
              y2={H - padB}
              stroke="var(--red)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text
              x={marker.week >= WEEKS - 1 ? x(marker.week) - 5 : x(marker.week) + 5}
              y={padT + 8}
              textAnchor={marker.week >= WEEKS - 1 ? 'end' : 'start'}
              fontSize="9"
              fill="var(--red)"
              fontFamily="var(--font-mono)"
            >
              {marker.label}
            </text>
          </g>
        ) : null}
        {series.map((s) => (
          <g key={s.label}>
            {upN > 1 ? (
              <polyline points={pts(s.values)} fill="none" stroke={s.color} strokeWidth="2" />
            ) : null}
            {s.values.slice(0, upN).map((v, i) => (
              <circle key={i} cx={x(i + 1)} cy={y(v)} r={i === upN - 1 ? 3 : 2} fill={s.color} />
            ))}
          </g>
        ))}
      </svg>
      {caption ? (
        <figcaption style={{ fontSize: '12.5px', color: 'var(--ink-2)', margin: '6px 0 0' }}>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

const STRIP_KIND = {
  false: { label: 'no-op PR', detail: 'nothing to patch', color: 'var(--red)' },
  missed: { label: 'window missed', detail: 'patches waiting', color: 'var(--amber)' },
  aligned: { label: 'fired on work', detail: null, color: 'var(--accent-ink)' },
  quiet: { label: 'quiet', detail: 'nothing due', color: 'var(--ink-faint)' },
};

function WeekStrip({ run, upto, ariaLabel, caption }) {
  const upN = Math.max(1, Math.min(upto, WEEKS));
  const cells = run.weeks.map((w) => {
    const kind = run.summary.falseFires.includes(w.week)
      ? 'false'
      : run.summary.missedWeeks.includes(w.week)
        ? 'missed'
        : w.merged > 0
          ? 'aligned'
          : 'quiet';
    return { week: w.week, kind, merged: w.merged };
  });
  return (
    <figure style={{ margin: '10px 0 0' }}>
      <ul
        aria-label={ariaLabel}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6,
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {cells.map((c) => {
          const seen = c.week <= upN;
          const k = STRIP_KIND[c.kind];
          return (
            <li
              key={c.week}
              className="mono"
              style={{
                border: `1px solid ${seen ? k.color : 'var(--line-soft)'}`,
                borderRadius: 3,
                padding: '6px 8px',
                fontSize: '10.5px',
                color: seen ? k.color : 'var(--ink-faint)',
                background: 'var(--paper-3)',
              }}
            >
              <span style={{ color: 'var(--ink-faint)' }}>wk {c.week}</span>
              <div style={{ fontSize: '11.5px' }}>{seen ? k.label : '…'}</div>
              <div style={{ color: 'var(--ink-faint)' }}>
                {seen ? (c.kind === 'aligned' ? `${c.merged} merged` : k.detail) : ' '}
              </div>
            </li>
          );
        })}
      </ul>
      {caption ? (
        <figcaption style={{ fontSize: '12.5px', color: 'var(--ink-2)', margin: '6px 0 0' }}>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

// The run pane's figure, per pulled stanza. Series come straight off RUNS;
// captions appear only once the month has finished arriving.
function RunView({ id, upto, done }) {
  const { pulled, intact } = RUNS[id];
  switch (id) {
    case 'signal':
      return (
        <WeekStrip
          run={pulled}
          upto={upto}
          ariaLabel={
            `Six weeks of firing record with the signal stanza pulled: a no-op PR in week ` +
            `${SIG_FALSE.join(', ')}, missed patch windows in weeks ${SIG_MISSED.join(', ')}, ` +
            `and coincidental alignment in weeks ${SIG_ALIGNED.join(' and ')}.`
          }
          caption={
            done
              ? `Two alignments by luck, ${SIG_MISSED.length} missed windows, ` +
                `${SIG_FALSE.length} no-op PR: a schedule is not a signal.`
              : null
          }
        />
      );
    case 'boundedAction':
      return (
        <LineChart
          series={[
            {
              values: pulled.series.scope,
              color: 'var(--red)',
              label: 'diff breadth, bound pulled',
            },
            { values: intact.series.scope, color: 'var(--accent)', label: 'with the bound' },
          ]}
          yMax={6.5}
          ticks={[
            { v: 1, label: '1×' },
            { v: 4, label: '4×' },
            { v: 6, label: '6×' },
          ]}
          limit={{ v: 4, label: 'what the approval reasoned about' }}
          marker={{ week: BND_WEEK, label: 'past it' }}
          upto={upto}
          ariaLabel={
            `Diff breadth over six weeks. With the bound pulled it compounds from 1.35 times ` +
            `to ${BND_SCOPE6} times chartered scope, crossing the 4-times limit the approval ` +
            `reasoned about in week ${BND_WEEK}; with the bound it stays at 1.`
          }
          caption={
            done
              ? `Breadth compounds 1.35× weekly; week ${BND_WEEK} crosses the 4× any approval ` +
                `had reasoned about.`
              : null
          }
        />
      );
    case 'verification':
      return (
        <LineChart
          series={[
            { values: VER_CONF, color: 'var(--red)', label: 'self-reported confidence' },
            { values: VER_QUAL, color: 'var(--blue)', label: 'true quality on main' },
          ]}
          yMin={0.3}
          yMax={1}
          ticks={[
            { v: 0.4, label: '.4' },
            { v: 0.6, label: '.6' },
            { v: 0.8, label: '.8' },
            { v: 1, label: '1' },
          ]}
          marker={{ week: VER_CROSS, label: 'the cross' }}
          upto={upto}
          ariaLabel={
            `Two lines over six weeks: self-reported confidence rises from ` +
            `${VER_CONF[0].toFixed(2)} to ${VER_CONF.at(-1).toFixed(2)} while true quality falls ` +
            `from ${VER_QUAL[0].toFixed(2)} to ${VER_QUAL.at(-1).toFixed(2)}; they cross in week ` +
            `${VER_CROSS}.`
          }
          caption={
            done
              ? `Confidence crosses quality in week ${VER_CROSS}; nothing outside the loop ever ` +
                `saw it happen.`
              : null
          }
        />
      );
    case 'reversibility':
      return (
        <LineChart
          series={[
            {
              values: pulled.series.reviewCost,
              color: 'var(--red)',
              label: 'review min/wk, undo pulled',
            },
            {
              values: intact.series.reviewCost,
              color: 'var(--accent)',
              label: 'with the undo path',
            },
          ]}
          yMax={100}
          ticks={[
            { v: 0, label: '0m' },
            { v: 45, label: '45m' },
            { v: 90, label: '90m' },
          ]}
          marker={{ week: REV_WEEK, label: 'the merge that stays' }}
          upto={upto}
          ariaLabel={
            `Weekly review minutes over six weeks. Both runs fall together until week ` +
            `${REV_WEEK}, when an unrevertable defect lands; the pulled run steps up from ` +
            `${REV_RC_BEFORE} to ${REV_RC_AFTER} minutes and stays there, while the intact run ` +
            `keeps falling to ${REV_INTACT_RC6}.`
          }
          caption={
            done
              ? `The week-${REV_WEEK} merge cannot come out; review doubles for everything after.`
              : null
          }
        />
      );
    case 'signalUpdate':
      return (
        <LineChart
          series={[
            {
              values: pulled.series.reviewCost,
              color: 'var(--red)',
              label: 'update: pulled',
            },
            {
              values: intact.series.reviewCost,
              color: 'var(--accent)',
              label: 'closing loop, same seed',
            },
          ]}
          yMax={60}
          ticks={[
            { v: 0, label: '0m' },
            { v: 20, label: '20m' },
            { v: 40, label: '40m' },
            { v: 60, label: '60m' },
          ]}
          upto={upto}
          ariaLabel={
            `Weekly review minutes over six weeks, same seed twice. With update: pulled the ` +
            `line holds flat at ${UPD_RC} minutes; the closing loop falls from ${BASE_RC1} to ` +
            `${UPD_INTACT_RC6} as its track record accrues. The summed gap is ${UPD_BILL} minutes.`
          }
          caption={
            done
              ? `Same seed, same ${UPD_MERGED} green merges; the only difference is where ` +
                `outcomes land. The gap, summed: ${UPD_BILL} minutes.`
              : null
          }
        />
      );
    case 'authoritySurface':
      return (
        <LineChart
          series={[
            {
              values: pulled.series.trust,
              color: 'var(--red)',
              label: 'mean trust, one switch',
            },
            {
              values: intact.series.trust,
              color: 'var(--accent)',
              label: 'per-class trust',
            },
          ]}
          yMax={0.7}
          ticks={[
            { v: 0, label: '0' },
            { v: 0.35, label: '.35' },
            { v: 0.7, label: '.7' },
          ]}
          marker={{ week: AUT_FLIP.week, label: 'the flip' }}
          upto={upto}
          ariaLabel={
            `Mean trust over six weeks, same seed twice. Both runs climb together until week ` +
            `${AUT_FLIP.week}, when a reverted regression triggers the only switch available: ` +
            `the global one. The pulled run drops from ${AUT_TRUST_BEFORE} to zero across every ` +
            `class; the intact run keeps climbing to ${AUT_INTACT_TRUST6}.`
          }
          caption={
            done
              ? `One reverted regression in week ${AUT_FLIP.week}; zero classes left running.`
              : null
          }
        />
      );
    default:
      return null;
  }
}

/* ── Readouts and the table the bench fills in ─────────────────────────── */

const READOUT = {
  rest: [
    {
      k: 'merged',
      v: `${BASELINE.summary.totalMerged} of ${BASELINE.summary.totalMerged}`,
      cls: 'good',
    },
    { k: 'escaped defects', v: '0', cls: 'good' },
    { k: 'review', v: `${BASE_RC1}m → ${BASE_RC6}m/wk`, cls: 'good' },
  ],
  signal: [
    { k: 'merged', v: `${SIG_MERGED}, not ${SIG_INTACT_MERGED}`, cls: 'bad' },
    { k: 'windows missed', v: `${SIG_MISSED.length}`, cls: 'warn' },
    { k: 'no-op PRs', v: `${SIG_FALSE.length}`, cls: 'bad' },
  ],
  boundedAction: [
    { k: 'diff breadth, wk 6', v: `${BND_SCOPE6}×`, cls: 'bad' },
    { k: 'past the approval', v: `week ${BND_WEEK}`, cls: 'bad' },
    { k: 'review, wk 6', v: `${BND_RC6}m`, cls: 'warn' },
  ],
  verification: [
    { k: 'review', v: `${VER_RC}m/wk`, cls: 'warn' },
    { k: 'escaped defects', v: `${VER_ESCAPED}`, cls: 'bad' },
    {
      k: 'confidence / quality',
      v: `${VER_CONF.at(-1).toFixed(2)} / ${VER_QUAL.at(-1).toFixed(2)}`,
      cls: 'bad',
    },
  ],
  reversibility: [
    { k: 'ossified', v: `week ${REV_WEEK}`, cls: 'bad' },
    { k: 'review after', v: `${REV_RC_AFTER}m/wk`, cls: 'bad' },
    { k: 'trust frozen at', v: REV_TRUST6, cls: 'warn' },
  ],
  signalUpdate: [
    { k: 'trust, wk 6', v: UPD_TRUST, cls: 'warn' },
    { k: 'review, wk 6', v: `${UPD_RC}m vs ${UPD_INTACT_RC6}m`, cls: 'bad' },
    { k: 'amnesia bill', v: `${UPD_BILL}m`, cls: 'bad' },
  ],
  authoritySurface: [
    { k: 'the flip', v: `week ${AUT_FLIP.week}`, cls: 'bad' },
    { k: 'classes zeroed', v: '3 of 3', cls: 'bad' },
    { k: 'review after', v: `${AUT_RC_AFTER}m/wk`, cls: 'warn' },
  ],
};

const OUTCOME = {
  signal: `${SIG_MISSED.length} windows missed, ${SIG_FALSE.length} no-op PR; ${SIG_MERGED} merges, not ${SIG_INTACT_MERGED}`,
  boundedAction: `diff ${BND_SCOPE6}× by week 6, past the approval in week ${BND_WEEK}`,
  verification: `${VER_ESCAPED} silent defects; confidence over quality in week ${VER_CROSS}`,
  reversibility: `week-${REV_WEEK} defect ossifies; ${REV_RC_AFTER}m/wk ever after`,
  signalUpdate: `trust flat at ${UPD_TRUST}; ${UPD_BILL}m amnesia bill`,
  authoritySurface: `one flip in week ${AUT_FLIP.week}; every class to zero`,
};

const TABLE_OPTIONS = INGREDIENTS.map((g) => ({ id: g.id, label: g.consequence }));
const pathologyOf = (id) => INGREDIENTS.find((g) => g.id === id).pathology;

/* ── The specimen deck ─────────────────────────────────────────────────── */

// Fixed order, chosen not drawn: the script-vs-loop boundary case opens (it
// reaches back to Ch 1), the contested verification case lands mid-deck, and
// the global switch closes. Every empty slot appears once.
const SPECIMEN_IDS = ['lp-04', 'lp-01', 'lp-03', 'lp-05', 'lp-02', 'lp-06'];
const SPECIMENS = SPECIMEN_IDS.map((id) => CASES.find((c) => c.id === id));

/* ── The lab ───────────────────────────────────────────────────────────── */

const NOTES = [
  '"Thirty days" is six weekly cycles of stepWeek: this loop fires weekly, so a month of ' +
    'bench time is six runs.',
  'Tuned constants set the shape of each pathology, not real thresholds: CI passes 92% of ' +
    'bumps, 5% of gated merges regress (25% ungated), trust gains 0.05 per clean merge and ' +
    'caps at 0.95, review is priced 15 minutes a PR floored at 4, scope compounds 1.35× a ' +
    'week without the bound.',
  'Seeds are pinned per stanza (signal 2, action 9, verification 5, revert 8, update 9, ' +
    'authority 17) so each pull tells the same story every time; re-rolling the seed would ' +
    "move the dates, not the shape. The engine tests pin each branch's semantics.",
  'The alternate-week schedule that replaces a pulled signal is a modeling choice; a real ' +
    'cron is the same choice with different constants.',
  'Each pull removes exactly one ingredient while five stay healthy — that isolation is the ' +
    'instrument, not a claim about how loops fail in the field.',
  'The specimen deck is anonymized and composited from the corpus: surfaces renamed, ' +
    'identifying detail invented, the failure shapes as found.',
];

export default function IngredientBench() {
  const reduced = usePrefersReducedMotion();
  const [pulled, setPulled] = useState(null);
  const [calls, setCalls] = useState({});
  const [seen, setSeen] = useState({});
  const [upto, setUpto] = useState(0);

  const g = pulled ? INGREDIENTS.find((x) => x.id === pulled) : null;
  const call = pulled ? calls[pulled] : null;
  const done = Boolean(pulled && seen[pulled]);
  const revealWeeks = done ? WEEKS : upto;
  const allSeen = INGREDIENTS.every((x) => seen[x.id]);

  // The month arrives week by week once a call is committed; under reduced
  // motion it arrives whole, as a static frame.
  useEffect(() => {
    if (!pulled || !calls[pulled] || seen[pulled]) return undefined;
    if (reduced || upto >= WEEKS) {
      setSeen((s) => ({ ...s, [pulled]: true }));
      return undefined;
    }
    const t = setTimeout(() => setUpto((u) => u + 1), 430);
    return () => clearTimeout(t);
  }, [pulled, calls, seen, reduced, upto]);

  const selectStanza = (id) => {
    const next = pulled === id ? null : id;
    setPulled(next);
    if (next && calls[next] && !seen[next]) setUpto(1);
  };
  const commitCall = (picked) => {
    setCalls((prev) => ({ ...prev, [pulled]: picked }));
    setUpto(1);
  };
  const resetAll = () => {
    setPulled(null);
    setCalls({});
    setSeen({});
    setUpto(0);
  };

  const logLines = pulled
    ? RUNS[pulled].pulled.weeks
        .filter((w) => w.week <= revealWeeks)
        .flatMap((w) => w.events.map((e) => ({ week: w.week, e })))
    : [];

  return (
    <LabFrame
      tag="LAB 14·A — THE SIX-INGREDIENT BENCH"
      register="mechanism"
      question="Chapter 1's machine ran like an appliance: signal, bound, oracle, undo, record, authority, all in place. Pull any one stanza and the other five keep humming — so what breaks, how fast, and would the log even tell you?"
      payoff={
        <>
          Six pulls, six different failures, each named in advance by the table's third column: the
          blind schedule misses {SIG_MISSED.length} patch windows and opens a no-op PR; unbounded
          scope crosses the 4× its approval reasoned about in week {BND_WEEK}; with no oracle,
          confidence crosses quality in week {VER_CROSS} while the log stays silent; the week-
          {REV_WEEK} unrevertable defect doubles review on everything after; without{' '}
          <span className="mono">update:</span>, week six is priced like week one ({UPD_BILL}{' '}
          minutes of amnesia bill); without per-class authority, one already-reverted regression
          zeroes every class at once. The check is mechanical, and the missing ingredient predicts
          the failure. A loop missing any of them isn't a loop yet. It's a script looking for a
          home. <Badge layer="W" note="§3.2 — the handbook's six-ingredient table, run" />
        </>
      }
      notes={NOTES}
      cannotShow="what several missing ingredients do in combination. The bench pulls one stanza at a time so each signature stays legible; real incomplete loops are usually short more than one, and the pathologies compound rather than add. Nor are these your constants: the engine draws each failure's shape, not its size in your repo."
      glass={GLASS}
    >
      <p className="mono" style={{ fontSize: 12.5, color: 'var(--ink-faint)', margin: '0 0 12px' }}>
        <Mark
          kind="made"
          note="Ch 1's machine, six stanzas; the runs are the engine's, seeds pinned"
        />{' '}
        the dependency-patch machine · all six stanzas in place · pull one, call the failure, run
        thirty days
      </p>

      <div
        className="mh-chipset"
        role="group"
        aria-label="Choose which stanza to pull from the benchfile"
      >
        {INGREDIENTS.map((x) => (
          <button
            key={x.id}
            type="button"
            className="mh-chip mono"
            aria-pressed={pulled === x.id}
            aria-label={`Pull the ${x.stanza} stanza${seen[x.id] ? ' (already run)' : ''}`}
            onClick={() => selectStanza(x.id)}
          >
            pull {x.stanza}
            {seen[x.id] ? ' ✓' : ''}
          </button>
        ))}
      </div>

      <div className="mh-bench" style={{ marginTop: 12 }}>
        <div>
          <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
            The artifact · six stanzas, six ingredients
          </span>
          <Artifact lines={benchfileLines(pulled)} />
        </div>
        <div>
          {!pulled ? (
            <>
              <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
                At rest · all six in place · seed {HOME_SEED}
              </span>
              <div className="mh-readout">
                {READOUT.rest.map((s) => (
                  <div key={s.k} className="mh-stat">
                    <span className="k">{s.k}</span>
                    <span className={`v ${s.cls}`}>{s.v}</span>
                  </div>
                ))}
              </div>
              <LineChart
                series={[
                  {
                    values: BASELINE.series.reviewCost,
                    color: 'var(--accent)',
                    label: 'review min/wk, intact',
                  },
                ]}
                yMax={60}
                ticks={[
                  { v: 0, label: '0m' },
                  { v: 20, label: '20m' },
                  { v: 40, label: '40m' },
                  { v: 60, label: '60m' },
                ]}
                upto={WEEKS}
                ariaLabel={
                  `Weekly review minutes for the intact bench over six weeks, falling from ` +
                  `${BASE_RC1} to ${BASE_RC6} as the track record accrues.`
                }
                caption={
                  `The appliance: review falls ${BASE_RC1} → ${BASE_RC6} minutes a week as the ` +
                  `record accrues, quality holds at ${BASELINE.summary.quality.at(-1).toFixed(2)}, ` +
                  `nothing escapes. The bench exists to break it: pull a stanza above.`
                }
              />
            </>
          ) : !call ? (
            <Commit
              key={pulled}
              prompt={`The ${g.stanza} stanza is out; the other five are healthy. The §3.2 table gives each absence a name — which failure do the next thirty days deliver?`}
              options={TABLE_OPTIONS}
              onReveal={commitCall}
            >
              {(picked) => feedbackFor(pulled, picked)}
            </Commit>
          ) : (
            <>
              <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
                The thirty days · seed {g.seed} · {g.stanza} pulled
              </span>
              <span className="mh-kicker" aria-live="polite" style={{ color: 'var(--ink-faint)' }}>
                {done
                  ? `day ${DAYS} of ${DAYS} — the month, complete`
                  : `running · week ${Math.max(1, revealWeeks)} of ${WEEKS} · day ${Math.max(1, revealWeeks) * 5} of ${DAYS}`}
              </span>
              <RunView id={pulled} upto={revealWeeks} done={done} />
              <div style={{ margin: '10px 0 0' }}>
                <span className="mh-kicker" style={{ display: 'block', marginBottom: 4 }}>
                  The thirty days, logged
                </span>
                {logLines.length ? (
                  <div className="mono" style={{ fontSize: '11.5px', display: 'grid', gap: 3 }}>
                    {logLines.map((l, i) => (
                      <span key={i} style={{ color: 'var(--ink-2)' }}>
                        <span style={{ color: 'var(--ink-faint)' }}>wk {l.week}</span> · {l.e}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="mono" style={{ fontSize: '11.5px', color: 'var(--ink-faint)' }}>
                    {done
                      ? 'silence — no oracle, no events. The chart above is what the log never showed.'
                      : 'nothing logged yet'}
                  </span>
                )}
              </div>
              {done ? (
                <>
                  <div className="mh-readout" role="status" style={{ marginTop: 10 }}>
                    {READOUT[pulled].map((s) => (
                      <div key={s.k} className="mh-stat">
                        <span className="k">{s.k}</span>
                        <span className={`v ${s.cls}`}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mh-feedback">
                    <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
                      You called · {TABLE_OPTIONS.find((o) => o.id === call)?.label}
                    </span>
                    {feedbackFor(pulled, call)}
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <span className="mh-kicker">The six-ingredient table · §3.2, filled in by demolition</span>
        <table className="mh-table" style={{ margin: '8px 0 0' }}>
          <thead>
            <tr>
              <th>Stanza</th>
              <th>What it is</th>
              <th>Your call</th>
              <th>The thirty days</th>
            </tr>
          </thead>
          <tbody>
            {INGREDIENTS.map((x) => {
              const made = calls[x.id];
              const ran = seen[x.id];
              return (
                <tr key={x.id}>
                  <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                    {x.stanza}
                  </td>
                  <td>{x.what}</td>
                  <td className="mono">{made ? pathologyOf(made) : '—'}</td>
                  <td
                    className="mono"
                    style={ran ? { color: 'var(--red)' } : { color: 'var(--ink-faint)' }}
                  >
                    {ran ? OUTCOME[x.id] : 'still a claim'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {allSeen ? (
        <div
          role="status"
          style={{
            marginTop: 14,
            padding: '10px 14px',
            borderLeft: '2px solid var(--accent)',
            background: 'var(--accent-soft)',
            borderRadius: '0 3px 3px 0',
            fontSize: 14,
            color: 'var(--ink)',
          }}
        >
          <span
            className="mh-kicker"
            style={{ display: 'block', marginBottom: 4, color: 'var(--accent-ink)' }}
          >
            The table, run
          </span>
          <p style={{ margin: '0 0 8px' }}>
            Six pulls, six different failures, every one named by a column written before you
            touched anything. Read your call column against the run column: where they disagree, the
            disagreement is the finding, because the table is a dependency map of what a loop is.
          </p>
          <p style={{ margin: 0 }}>
            Two things to carry out. Script-vs-loop is a checkable condition — six slots, filled or
            empty, no judgment required. And incompleteness is a stage, not a sin: five of these
            benches looked healthy for weeks. The sin is not knowing which slots are empty while
            they run.
          </p>
          <div className="mh-controls" style={{ margin: '10px 0 0' }}>
            <button type="button" className="mh-btn" onClick={resetAll}>
              Put all six stanzas back and start over
            </button>
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 22 }}>
        <span className="mh-kicker">
          The specimen deck · the same check, on machines met in the field{' '}
          <Mark kind="real" note="anonymized: surfaces renamed, failure shapes as found" />
        </span>
        <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '6px 0 10px' }}>
          Six machines from the corpus, each described the way you would actually meet it — a team
          that calls it a loop, a record that mostly behaves. Run the check you just calibrated:
          which slot is empty, and does the empty slot predict the failure already in the evidence?
          One case is contested, and says so after you commit.
        </p>
        <Drill cases={SPECIMENS} title="Specimen diagnosis" />
      </div>
    </LabFrame>
  );
}
