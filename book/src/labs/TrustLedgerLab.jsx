// TrustLedgerLab.jsx — LAB 19·A, the Trust Ledger (Ch 19, DESIGN §6.10).
//
// A ledger of environment-stamped rows, a gate policy artifact, injectable
// events. The centerpiece is prediction-first: the judge model upgrades to a
// strictly better one — commit before the swap fires, then watch every grant
// drop to propose-only with zero failures on the ledger. The counterfactual
// run (conditional disabled, fast-forward) prices what that reset was worth:
// a defect cluster surfacing weeks after the swap looked consequence-free.
// An event console then runs the other three properties as mechanisms
// (permission-widen, idle expiry, revert revocation), and the authority
// ladder closes with five separate grants and their blast radii.
//
// Mechanism register: every grant on this page is re-derived from the ledger
// by trust.js at render time; nothing here stores a grant or asserts a
// number the engine did not produce. Seed 19, deterministic forever.

import { useEffect, useState } from 'react';
import { Artifact, Badge, Commit, LabFrame, Mark, glassSlice } from '../components/kit.jsx';
import { usePrefersReducedMotion } from '../shared/usePrefersReducedMotion.js';
import {
  addOutcome,
  applyEvent,
  counterfactualRun,
  evaluateGate,
  ledgerClasses,
  makeTrustState,
} from '../engine/trust.js';
import trustRaw from '../engine/trust.js?raw';

/* ── The seeded ledger (module-level: same rows, same grants, forever) ─── */

const SEED = 19;

// Ten weeks under judge-v1. dep-patch carries §3.7's clean record — 47
// merged, zero rolled back — plus two closes that never reached the
// codebase. doc-refresh earns its grant at a slower cadence; flaky-test is
// still short of the five-decided bar.
const DEPS_MERGES = [5, 5, 5, 5, 5, 4, 5, 4, 5, 4]; // 47
const DOCS_WEEKS = [2, 3, 5, 7, 9, 10];
const FLAKY_WEEKS = [8, 9, 10];

function buildBaseline() {
  let s = makeTrustState();
  s = applyEvent(s, { type: 'permission-widen', perm: 'docs' });
  for (let week = 1; week <= 10; week += 1) {
    s = applyEvent(s, { type: 'idle', weeks: 1 });
    for (let i = 0; i < DEPS_MERGES[week - 1]; i += 1) {
      s = addOutcome(s, { cls: 'deps', outcome: 'merged' });
    }
    if (DOCS_WEEKS.includes(week)) s = addOutcome(s, { cls: 'docs', outcome: 'merged' });
    if (FLAKY_WEEKS.includes(week)) s = addOutcome(s, { cls: 'flaky', outcome: 'merged' });
  }
  s = addOutcome(s, { cls: 'deps', outcome: 'closed' });
  s = addOutcome(s, { cls: 'deps', outcome: 'closed' });
  return s;
}

const BASELINE = buildBaseline(); // week 10, judge-v1
const SWAPPED = applyEvent(BASELINE, { type: 'model-swap' }); // judge-v2, same rows

const DEPS_AT_REST = evaluateGate(BASELINE, 'deps'); // earned, 47 decided
const FLAKY_BLOCKER = evaluateGate(BASELINE, 'flaky').firstBlocker; // only 3/5 decided recently
const SWAP_BLOCKER = evaluateGate(SWAPPED, 'deps').firstBlocker; // judge-v2 has no record here

// The counterfactual: conditional disabled after the swap, twelve weeks of
// riding at full cadence. dep-patch and doc-refresh ride; flaky-test never
// held the grant, so there is nothing for the disabled reset to keep alive.
const CF = counterfactualRun(SWAPPED, { weeks: 12, seed: SEED });
const CF_TOTAL = CF.defects.length; // 13
const CF_FIRST = CF.defects[0].week; // 5
const CF_LAST = CF.defects.at(-1).week; // 18
const CF_AFTER_STOP = CF.defects.filter((d) => d.week > 12).length; // 5
const CF_BY_CLS = CF.defects.reduce((acc, d) => {
  acc[d.cls] = (acc[d.cls] ?? 0) + 1;
  return acc;
}, {});

// Stack index per (class, week) cell, for drawing.
const CF_CELLS = (() => {
  const seen = new Map();
  return CF.defects.map((d) => {
    const key = `${d.cls}-${d.week}`;
    const stack = seen.get(key) ?? 0;
    seen.set(key, stack + 1);
    return { ...d, stack };
  });
})();

const GLASS = [
  glassSlice(trustRaw, "Does a row's stamped environment", '\n}'),
  glassSlice(trustRaw, 'export function evaluateGate', '\n}'),
  glassSlice(trustRaw, 'export function counterfactualRun', '\n}'),
].join('\n\n// ── the stamp check above feeds the gate below ──\n\n');

/* ── Display helpers ───────────────────────────────────────────────────── */

const CLASS_META = {
  deps: { label: 'dep-patch', color: 'var(--c-deppatch)' },
  docs: { label: 'doc-refresh', color: 'var(--c-docs)' },
  flaky: { label: 'flaky-test', color: 'var(--c-flaky)' },
  evals: { label: 'eval-refresh', color: 'var(--c-backfill)' },
};

const fmtRate = (rate) => {
  const pct = rate * 100;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
};

function ledgerCounts(state, cls) {
  const rows = state.rows.filter((r) => r.cls === cls);
  const count = (outcome) => rows.filter((r) => r.outcome === outcome).length;
  return { merged: count('merged'), reverted: count('reverted'), closed: count('closed') };
}

function panelClasses(state) {
  const classes = ledgerClasses(state);
  if (state.env.perms.includes('evals') && !classes.includes('evals')) classes.push('evals');
  return classes;
}

/* ── The gate panel: grants re-derived from the ledger on every render ─── */

function GrantRow({ state, cls }) {
  const meta = CLASS_META[cls];
  const gate = evaluateGate(state, cls);
  const counts = ledgerCounts(state, cls);
  const revoked = gate.firstBlocker?.startsWith('revoked');
  return (
    <div
      style={{
        border: '1px solid var(--line-soft)',
        borderLeftWidth: 3,
        borderLeftColor: meta.color,
        borderRadius: 3,
        background: 'var(--paper-3)',
        padding: '8px 12px',
        display: 'grid',
        gap: 3,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span className="mono" style={{ fontSize: '13px', color: 'var(--ink)' }}>
          {meta.label}
        </span>
        <span
          className="mono"
          style={{
            fontSize: '9.5px',
            letterSpacing: '0.14em',
            padding: '1px 7px',
            borderRadius: 3,
            color: gate.earned ? 'var(--accent-ink)' : 'var(--amber)',
            border: `1px solid ${gate.earned ? 'var(--accent)' : 'var(--amber)'}`,
          }}
        >
          {gate.earned ? 'AUTO-MERGE' : 'PROPOSE-ONLY'}
        </span>
      </div>
      <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>
        on the ledger · {counts.merged} merged · {counts.reverted} reverted · {counts.closed} closed
      </span>
      <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-2)' }}>
        the gate reads · {gate.decided} decided
        {gate.decided > 0 ? ` · ${fmtRate(gate.rate)}` : ''}
        {gate.firstBlocker ? (
          <>
            {' · '}
            <span style={{ color: revoked ? 'var(--red)' : 'var(--amber)' }}>
              &quot;{gate.firstBlocker}&quot;
            </span>
          </>
        ) : (
          ' · clears all five checks'
        )}
      </span>
    </div>
  );
}

function GatePanel({ state, title }) {
  return (
    <div role="group" aria-label={title}>
      <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
        {title}
      </span>
      <div style={{ display: 'grid', gap: 8 }}>
        {panelClasses(state).map((cls) => (
          <GrantRow key={cls} state={state} cls={cls} />
        ))}
      </div>
    </div>
  );
}

/* ── The gate policy artifact, house notation ──────────────────────────── */

const POLICY_LINES = [
  { no: 1, text: 'gate-policy: auto-merge', kind: 'key' },
  { no: 2, text: '  derived: from the ledger, at ask time', annot: 'never a stored flag' },
  { no: 3, text: '  scope: per task class', annot: 'NARROW' },
  { no: 4, text: 'bars:', kind: 'key' },
  { no: 5, text: '  min_rate: 95%', annot: 'merged / decided' },
  { no: 6, text: '  min_decided: 5', annot: 'EARNED' },
  { no: 7, text: '  window: 13 weeks', annot: 'EXPIRING' },
  { no: 8, text: '  defect_tolerance: 0', annot: 'REVOCABLE: a count, not a ratio' },
  { no: 9, text: 'stamp:', kind: 'key' },
  { no: 10, text: '  env: {model, perms, repo_shape}', annot: 'CONDITIONAL', hot: true },
  { no: 11, text: '  rule: stamp must match the asker', annot: 'env is part of the trust' },
];

/* ── The centerpiece commit ────────────────────────────────────────────── */

const SWAP_OPTIONS = [
  {
    id: 'carry',
    label: 'Holds. A strictly better judge can only improve the calls; earned trust carries.',
  },
  {
    id: 'probation',
    label: 'Holds on probation: auto-merge continues while judge-v2 builds a parallel record.',
  },
  {
    id: 'reset',
    label: 'Drops to propose-only: all 47 rows are stamped judge-v1, and judge-v2 has none.',
  },
];

const SWAP_FEEDBACK = {
  carry:
    `"Strictly better" is a claim about the model; the ledger holds evidence about a system. ` +
    `Each of the 47 rows is stamped with the environment it was earned in (judge-v1, the deps ` +
    `surface, repo shape v1), and the gate's stamp check asks one question: does the stamp ` +
    `still describe the proposer? judge-v2 fails it on all 47. Nothing was punished and nothing ` +
    `was lost — the rows still sit there at 100% — but CONDITIONAL means the environment is ` +
    `part of the trust, so the gate can read none of it. Watch the panel: every blocker says ` +
    `"no record here", not "failure". At dep-patch's cadence, five clean v2 merges clear the ` +
    `bar in about a week; that week of review is what verifying "strictly better" costs.`,
  probation:
    `That is the operational instinct, and the gate produces it, as a mechanism rather than a ` +
    `mood. There is no probation flag to set: grants are re-derived from stamped rows on every ` +
    `ask, judge-v2 matches none of the 47, so every class lands at propose-plus-review until ` +
    `v2's own rows accumulate. The handbook's line is exact: trust drops from auto-merge back ` +
    `to propose-plus-review until the new model re-earns it. Note the asymmetry the cadence ` +
    `buys: dep-patch is back over the five-decided bar in about a week of clean merges; ` +
    `doc-refresh, merging twice a month, takes two months. Probation length is not policy ` +
    `here. It is arithmetic.`,
  reset:
    `The gate agrees, and the reason matters more than the verdict. No failure fired this: the ` +
    `reverted column still reads zero, no row was rewritten, and the rate on the old rows is ` +
    `still 100%. What changed is what the gate can read. Each row is stamped judge-v1, the ` +
    `proposer is now judge-v2, and the stamp check refuses the transfer row by row — ` +
    `CONDITIONAL is the property doing the work. A reset without failure is information, the ` +
    `ledger saying "I no longer know," and the counterfactual below prices exactly what that ` +
    `information is worth.`,
};

/* ── The counterfactual strip ──────────────────────────────────────────── */

const CF_W = 760;
const CF_H = 172;
const CF_PADL = 112;
const CF_CELL = (CF_W - CF_PADL - 18) / (CF_LAST + 1);
const cfX = (w) => CF_PADL + w * CF_CELL;
const CF_LANES = [
  { cls: 'deps', base: 70 },
  { cls: 'docs', base: 122 },
];

function CounterfactualStrip({ week }) {
  const ariaLabel =
    `Defects surfacing over eighteen weeks after the model swap, with the conditional reset ` +
    `disabled. dep-patch and doc-refresh keep auto-merging at full cadence on judge-v1's ` +
    `record. Nothing surfaces in weeks one through four; ${CF_TOTAL} defects then land between ` +
    `week ${CF_FIRST} and week ${CF_LAST} — ${CF_BY_CLS.deps} on dep-patch, ${CF_BY_CLS.docs} ` +
    `on doc-refresh — including ${CF_AFTER_STOP} after proposals stop at week twelve, because ` +
    `each missed defect takes three to six weeks to surface.`;
  return (
    <svg
      viewBox={`0 0 ${CF_W} ${CF_H}`}
      role="img"
      aria-label={ariaLabel}
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        background: 'var(--paper)',
        border: '1px solid var(--line-soft)',
        borderRadius: 4,
      }}
    >
      {/* Full-cadence band: merges keep landing, weeks 1-12 */}
      <rect
        x={cfX(1)}
        y={26}
        width={12 * CF_CELL}
        height={104}
        fill="var(--accent)"
        opacity="0.05"
      />
      <text
        x={cfX(6.5)}
        y={20}
        textAnchor="middle"
        fontSize="8.5"
        fill="var(--ink-faint)"
        fontFamily="var(--font-mono)"
      >
        riding classes keep full cadence · wk 1–12
      </text>
      <text
        x={cfX(15) + CF_CELL / 2}
        y={20}
        textAnchor="middle"
        fontSize="8.5"
        fill="var(--ink-faint)"
        fontFamily="var(--font-mono)"
      >
        proposals stop · the lag keeps paying
      </text>

      {/* The swap marker */}
      <line
        x1={cfX(0) + CF_CELL / 2}
        x2={cfX(0) + CF_CELL / 2}
        y1={26}
        y2={130}
        stroke="var(--amber)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <text
        x={cfX(0) + CF_CELL / 2}
        y={142}
        textAnchor="middle"
        fontSize="8.5"
        fill="var(--amber)"
        fontFamily="var(--font-mono)"
      >
        swap
      </text>

      {/* The quiet month */}
      <text
        x={cfX(3)}
        y={96}
        textAnchor="middle"
        fontSize="8.5"
        fill="var(--ink-faint)"
        fontFamily="var(--font-mono)"
      >
        nothing surfaces
      </text>

      {/* Lanes */}
      {CF_LANES.map((lane) => (
        <g key={lane.cls}>
          <line
            x1={CF_PADL}
            x2={CF_W - 14}
            y1={lane.base}
            y2={lane.base}
            stroke="var(--line-soft)"
            strokeWidth="1"
          />
          <text
            x={CF_PADL - 8}
            y={lane.base - 2}
            textAnchor="end"
            fontSize="9"
            fill={CLASS_META[lane.cls].color}
            fontFamily="var(--font-mono)"
          >
            {CLASS_META[lane.cls].label}
          </text>
        </g>
      ))}

      {/* Defects, revealed up to the playhead */}
      {CF_CELLS.map((d, i) => {
        const lane = CF_LANES.find((l) => l.cls === d.cls);
        const seen = d.week <= week;
        return (
          <rect
            key={i}
            x={cfX(d.week) + CF_CELL / 2 - 5}
            y={lane.base - 12 - d.stack * 12}
            width={10}
            height={10}
            rx={2}
            fill="var(--red)"
            opacity={seen ? 0.9 : 0.12}
          >
            <title>
              {CLASS_META[d.cls].label} · defect surfaced week {d.week}, merged weeks earlier under
              the unproven judge
            </title>
          </rect>
        );
      })}

      {/* Playhead */}
      <line
        x1={cfX(week) + CF_CELL}
        x2={cfX(week) + CF_CELL}
        y1={26}
        y2={130}
        stroke="var(--accent)"
        strokeWidth="1"
        opacity="0.55"
      />

      {/* Week ticks */}
      {[0, CF_FIRST, 12, CF_LAST].map((w) => (
        <text
          key={w}
          x={cfX(w) + CF_CELL / 2}
          y={CF_H - 8}
          textAnchor="middle"
          fontSize="8.5"
          fill="var(--ink-faint)"
          fontFamily="var(--font-mono)"
        >
          wk {w}
        </text>
      ))}
    </svg>
  );
}

function cfCaption(week) {
  const surfaced = CF.defects.filter((d) => d.week <= week).length;
  if (week === 0) {
    return (
      `Week 0: the swap fires with the conditional check disabled, so nothing resets. ` +
      `dep-patch and doc-refresh ride judge-v1's record at full cadence. flaky-test has ` +
      `nothing to ride — the counterfactual only bites where the property was doing work.`
    );
  }
  if (week < CF_FIRST) {
    return (
      `Week ${week}: merges land at full cadence and nothing surfaces. The swap looks ` +
      `consequence-free, which is exactly what a 3–6 week defect lag is supposed to look like.`
    );
  }
  if (week < 12) {
    return (
      `Week ${week}: ${surfaced} defect${surfaced === 1 ? '' : 's'} surfaced so far, each one ` +
      `a merge the unproven judge waved through weeks earlier. The lag is why none of this ` +
      `looks like the swap's fault.`
    );
  }
  if (week < CF_LAST) {
    return (
      `Week ${week}: proposals stopped at week 12; the cluster keeps landing — ${surfaced} ` +
      `surfaced. What was merged under stale trust pays out on its own schedule.`
    );
  }
  return (
    `Eighteen weeks out: ${CF_TOTAL} defects, ${CF_BY_CLS.deps} on dep-patch and ` +
    `${CF_BY_CLS.docs} on doc-refresh, the first at week ${CF_FIRST}, the last ` +
    `${CF_LAST - 12} weeks after proposals stopped. The strict gate priced all of this at ` +
    `week 0 and charged a week or two of review instead. A reset without failure is ` +
    `information.`
  );
}

/* ── The event console: three more ways the world moves ────────────────── */

function applyConsoleEvent(state, id) {
  switch (id) {
    case 'widen':
      return applyEvent(state, { type: 'permission-widen', perm: 'evals' });
    case 'wait': {
      let s = state;
      for (let w = 0; w < 4; w += 1) {
        s = applyEvent(s, { type: 'idle', weeks: 1 });
        for (let i = 0; i < 4; i += 1) s = addOutcome(s, { cls: 'deps', outcome: 'merged' });
      }
      return s;
    }
    case 'revert':
      return applyEvent(state, { type: 'revert', cls: 'deps' });
    default:
      return state;
  }
}

function observeConsoleEvent(id, state) {
  if (id === 'widen') {
    const gate = evaluateGate(state, 'evals');
    return (
      `week ${state.week} · permissions widen to ${state.env.perms.join(' + ')}. Every old ` +
      `grant is exactly what it was, because widening keeps old stamps covered. The new ` +
      `surface starts from nothing: eval-refresh reads "${gate.firstBlocker}". NARROW at ` +
      `work — 47 dep-patch rows buy evals zero.`
    );
  }
  if (id === 'wait') {
    const deps = evaluateGate(state, 'deps');
    const docs = evaluateGate(state, 'docs');
    return (
      `week ${state.week} · four weeks pass. dep-patch landed 16 fresh rows and ` +
      `${deps.earned ? 'holds auto-merge' : `reads "${deps.firstBlocker}"`}; doc-refresh sat ` +
      `idle and its window now shows ${docs.decided} decided` +
      `${docs.earned ? ', still over the bar' : ` — "${docs.firstBlocker}"`}. EXPIRING does ` +
      `the forgetting; renewal is fresh rows, not time served.`
    );
  }
  const deps = evaluateGate(state, 'deps');
  const counts = ledgerCounts(state, 'deps');
  return (
    `week ${state.week} · a dep-patch merge comes back out. The rate is ` +
    `${fmtRate(deps.rate)}, still above the 95% bar, and the grant is gone anyway: ` +
    `"${deps.firstBlocker}". REVOCABLE means tolerance is a count (zero), so one revert ` +
    `outweighs ${counts.merged} merges. No averaging away.`
  );
}

function consoleReplay(events) {
  let state = BASELINE;
  const entries = [];
  for (const id of events) {
    state = applyConsoleEvent(state, id);
    entries.push({ id, text: observeConsoleEvent(id, state) });
  }
  return { state, entries };
}

/* ── The authority ladder ──────────────────────────────────────────────── */

const LADDER = [
  {
    grant: 'read',
    covers: 'what the agent can see',
    fallback: 'wide by default; narrow only around secrets, personal data, competitive info',
    blast: "information released — and release can't be recalled",
  },
  {
    grant: 'write',
    covers: 'what it can propose',
    fallback: 'narrow, expanded class by class',
    blast: 'a bad proposal costs review minutes; the gate is still ahead of it',
  },
  {
    grant: 'commit',
    covers: 'what it can merge without a human',
    fallback: 'none — earned per class, through this ledger',
    blast: 'a defect lands in main; one revert from undone',
  },
  {
    grant: 'deploy',
    covers: 'what it can cause to run in production',
    fallback: 'never autonomous on the irreversible; propose, human approves',
    blast: 'customer-visible; undoing can cost more than not doing',
  },
  {
    grant: 'external',
    covers: 'the world beyond the repo: paid API calls, emails, filings, trades',
    fallback: 'treated as deploy — explicit, class-level human grant',
    blast: 'no revert exists for a sent email',
  },
];

/* ── The lab ───────────────────────────────────────────────────────────── */

const SectionKicker = ({ children }) => (
  <span className="mh-kicker" style={{ display: 'block', margin: '18px 0 8px' }}>
    {children}
  </span>
);

const CF_SWEEP_MS = 240;

export default function TrustLedgerLab() {
  const reduced = usePrefersReducedMotion();
  const [committed, setCommitted] = useState(null);
  // Legible at rest: the counterfactual mounts on its final, fully-paid frame.
  const [cfWeek, setCfWeek] = useState(CF_LAST);
  const [cfPlaying, setCfPlaying] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!cfPlaying) return undefined;
    if (cfWeek >= CF_LAST) {
      setCfPlaying(false);
      return undefined;
    }
    const t = setTimeout(() => setCfWeek((w) => Math.min(CF_LAST, w + 1)), CF_SWEEP_MS);
    return () => clearTimeout(t);
  }, [cfPlaying, cfWeek]);

  const cfReplay = () => {
    setCfWeek(0);
    setCfPlaying(true);
  };
  const cfStep = () => {
    setCfPlaying(false);
    setCfWeek((w) => Math.min(CF_LAST, w + 1));
  };
  const cfReset = () => {
    setCfPlaying(false);
    setCfWeek(0);
  };

  const { state: consoleState, entries: consoleEntries } = consoleReplay(events);
  const waitCount = events.filter((id) => id === 'wait').length;
  const inject = (id) => setEvents((prev) => [...prev, id]);

  return (
    <LabFrame
      tag="LAB 19·A — THE TRUST LEDGER"
      register="mechanism"
      question="Forty-seven merged, zero rolled back — and tonight the judge model behind the loop upgrades to one strictly better on every eval. What happens to earned auto-merge, and what would skipping the answer cost?"
      payoff={
        <>
          The five properties are mechanisms, not virtues.{' '}
          <Badge layer="W" note="§3.7 — the five properties of real trust, run as code" /> Swap the
          judge under a clean ledger (47 merged, 0 reverted) and every class drops to propose-only
          with zero failures recorded: each row is stamped with the environment it was earned in,
          and judge-v2 matches none of them. Disable that one check and the bill arrives late —{' '}
          {CF_TOTAL} defects surfacing between weeks {CF_FIRST} and {CF_LAST}, after the swap had
          looked consequence-free for a month. Widen permissions and only the new surface
          cold-starts; let a class idle and its window empties; one revert revokes straight through
          a 97.9% rate. A reset without failure is information, not punishment.
        </>
      }
      notes={[
        "The ledger is seeded, not simulated: 47 merged dep-patch rows (§3.7's clean track record), 6 doc-refresh, 3 flaky-test, recorded across ten weeks under judge-v1. Every grant on this page is re-derived from those rows at render time; nothing stores a grant.",
        "The gate policy is the book's default: a 95% merge rate over at least 5 decided outcomes in a 13-week window, zero reverts tolerated. Real policies tune all four numbers per class.",
        "Closed PRs sit on the ledger but never reached the codebase, so they carry no information about post-merge quality: dep-patch's 47 merged · 2 closed reads as 47 decided.",
        `The counterfactual's constants are tuned so the lag is visible in one strip: each riding class keeps a 2–4 merge weekly cadence, 15% of unproven-judge merges carry a defect, and each defect takes 3–6 weeks to surface (seed ${SEED}, deterministic). The cluster's shape is the claim; its size is a constant.`,
        'In the event console, each four-weeks press also lands 16 fresh dep-patch merges — the loop keeps its cadence — so one class renews while another ages out of the same window.',
      ]}
      cannotShow="when judge-v2 has re-earned your trust. Whether any of judge-v1's record can safely transfer across a model upgrade is one of the handbook's open questions (§4.5); this gate takes the conservative position and resets. The bars here — 95%, five decided, thirteen weeks, zero tolerance — were chosen so every property flips in one sitting, not to price your classes' risk."
      glass={GLASS}
    >
      {/* 1 · the ledger at rest */}
      <SectionKicker>
        1 · The ledger at rest · week 10 · judge-v1{' '}
        <Mark kind="made" note="composite terrain; Ch 19's froot specimens are the real corpus" />
      </SectionKicker>
      <div className="mh-bench">
        <div>
          <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
            The artifact · gate policy, one per platform
          </span>
          <Artifact lines={POLICY_LINES} />
        </div>
        <GatePanel state={BASELINE} title="The gate panel · grants re-derived on every ask" />
      </div>
      <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: 'var(--ink-2)' }}>
        EARNED is already visible: flaky-test runs at 100% and still reads &quot;
        {FLAKY_BLOCKER}&quot; — the gate wants evidence, and three decided is not yet evidence.
        dep-patch cleared every bar weeks ago. Hold its {DEPS_AT_REST.decided}-row record in mind;
        the next control is an upgrade, not an incident.
      </p>

      {/* 2 · the swap, committed first */}
      <SectionKicker>2 · The swap · CONDITIONAL · commit before it fires</SectionKicker>
      <Commit
        prompt="Week 10. The platform upgrades its judge: judge-v1 → judge-v2, strictly better on every eval you have. The dep-patch ledger reads 47 merged · 0 reverted · 100%. The moment the swap lands, what happens to its auto-merge grant?"
        options={SWAP_OPTIONS}
        onReveal={setCommitted}
      >
        {(id) => SWAP_FEEDBACK[id]}
      </Commit>
      {committed !== null ? (
        <>
          <GatePanel
            state={SWAPPED}
            title="Week 10 · judge-v2 · the same ledger, re-read by the same gate"
          />
          <div className="mh-readout" role="group" aria-label="What the swap did to the ledger">
            <div className="mh-stat">
              <span className="k">failures on the ledger</span>
              <span className="v good">0</span>
            </div>
            <div className="mh-stat">
              <span className="k">rows rewritten</span>
              <span className="v good">0</span>
            </div>
            <div className="mh-stat">
              <span className="k">grants surviving</span>
              <span className="v warn">0 of 2</span>
            </div>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--ink-2)' }}>
            Read the blocker on every row: &quot;{SWAP_BLOCKER}&quot;. Not one of them mentions a
            failure, because there wasn&apos;t one. The history is intact; the stamps just stopped
            describing the proposer.
          </p>

          {/* 3 · the counterfactual */}
          <SectionKicker>
            3 · The counterfactual · conditional off · what the reset was worth
          </SectionKicker>
          <CounterfactualStrip week={cfWeek} />
          <p
            className="mono"
            aria-live="polite"
            style={{
              fontSize: '12.5px',
              lineHeight: 1.6,
              color: 'var(--ink-2)',
              margin: '8px 0 0',
              minHeight: '4.8em',
            }}
          >
            {cfCaption(cfWeek)}
          </p>
          <div className="mh-readout">
            <div className="mh-stat">
              <span className="k">defects surfaced</span>
              <span className="v bad">
                {CF.defects.filter((d) => d.week <= cfWeek).length} of {CF_TOTAL}
              </span>
            </div>
            <div className="mh-stat">
              <span className="k">first surfaces</span>
              <span className="v">wk {CF_FIRST}</span>
            </div>
            <div className="mh-stat">
              <span className="k">after proposals stop</span>
              <span className="v">{CF_AFTER_STOP}</span>
            </div>
          </div>
          <div
            className="mh-controls"
            role="group"
            aria-label="Counterfactual controls: replay, step, reset"
          >
            {!reduced ? (
              <button
                type="button"
                className="mh-btn mh-btn-primary"
                onClick={cfReplay}
                disabled={cfPlaying}
                aria-label="Replay the eighteen counterfactual weeks"
              >
                Replay the 18 weeks
              </button>
            ) : null}
            <button
              type="button"
              className="mh-btn"
              onClick={cfStep}
              disabled={cfPlaying || cfWeek >= CF_LAST}
              aria-label="Step one week forward"
            >
              Step
            </button>
            <button
              type="button"
              className="mh-btn"
              onClick={cfReset}
              disabled={cfPlaying || cfWeek === 0}
              aria-label="Reset to the week of the swap"
            >
              Reset
            </button>
            <span className="mh-kicker" aria-live="polite">
              week {cfWeek} of {CF_LAST}
            </span>
          </div>
        </>
      ) : null}

      {/* 4 · the event console */}
      <SectionKicker>
        4 · The event console · NARROW · EXPIRING · REVOCABLE · a separate fork of week 10
      </SectionKicker>
      <p style={{ margin: '0 0 8px', fontSize: '13.5px', color: 'var(--ink-2)' }}>
        The swap from section 2 never happens on this fork. Inject the other three ways the world
        moves; the gate re-reads the same ledger after each one. Expiry will arrive wearing
        EARNED&apos;s blocker string — the window empties, so the sufficiency bar fails. The first
        failed check is the headline; the order is in the glass.
      </p>
      <div className="mh-controls" role="group" aria-label="Inject terrain events into the ledger">
        <button
          type="button"
          className="mh-btn"
          onClick={() => inject('widen')}
          disabled={events.includes('widen')}
          aria-label="Widen permissions: open the evals surface"
        >
          Open the evals surface
        </button>
        <button
          type="button"
          className="mh-btn"
          onClick={() => inject('wait')}
          disabled={waitCount >= 4}
          title={waitCount >= 4 ? 'The 13-week window has fully emptied' : undefined}
          aria-label="Let four weeks pass with doc-refresh paused"
        >
          Let four weeks pass · doc-refresh paused
        </button>
        <button
          type="button"
          className="mh-btn"
          onClick={() => inject('revert')}
          disabled={events.includes('revert')}
          aria-label="A dep-patch merge comes back out of the codebase"
        >
          A dep-patch merge comes back out
        </button>
        <button
          type="button"
          className="mh-btn"
          onClick={() => setEvents([])}
          disabled={events.length === 0}
          aria-label="Rewind the console to week 10"
        >
          Rewind to week 10
        </button>
      </div>
      {consoleEntries.length ? (
        <div aria-live="polite" style={{ display: 'grid', gap: 6, margin: '0 0 10px' }}>
          {consoleEntries.map((entry, i) => (
            <div key={i} className="mh-feedback" style={{ marginTop: 0 }}>
              {entry.text}
            </div>
          ))}
        </div>
      ) : null}
      <GatePanel
        state={consoleState}
        title={`The gate panel · week ${consoleState.week} · ${consoleState.env.model} · perms ${consoleState.env.perms.join('+')}`}
      />

      {/* 5 · the authority ladder */}
      <SectionKicker>
        5 · The authority ladder · five separate grants{' '}
        <Badge layer="W" note="§3.7 — information vs authority: each grant evaluated separately" />
      </SectionKicker>
      <table className="mh-table" style={{ margin: '0 0 6px' }}>
        <thead>
          <tr>
            <th>Grant</th>
            <th>What it covers</th>
            <th>Default</th>
            <th>Blast radius when wrong</th>
          </tr>
        </thead>
        <tbody>
          {LADDER.map((row) => (
            <tr
              key={row.grant}
              style={row.grant === 'commit' ? { background: 'var(--accent-soft)' } : undefined}
            >
              <td className="mono" style={{ color: 'var(--ink)' }}>
                {row.grant}
              </td>
              <td>{row.covers}</td>
              <td>{row.fallback}</td>
              <td>{row.blast}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ margin: '0', fontSize: '13.5px', color: 'var(--ink-2)' }}>
        Five separate grants, evaluated separately. Everything this lab ran — the stamps, the swap,
        the revocation — moves exactly one row: commit. The right to read is not the right to write,
        and treating one grant as if it implied the next is how many of the worst failures happen.
      </p>
    </LabFrame>
  );
}
