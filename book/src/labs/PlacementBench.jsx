// PlacementBench.jsx — LAB 05·A "The placement bench" (Ch 5 · Placement, covers §2.3).
// Mechanism on the axes, argued on the verdicts. The sequence follows the
// worked-example literature: auth and dep-bump fully worked side by side (the
// shared schema emerges from the comparison), then backward-faded cases (place
// a worked case; then call the axes yourself, graded against hidden ground
// truth via scoreAxes), then the danger-zone case that refuses to run as
// placed, then the bare drill. The both-ways runs are real engine runs:
// econ.simulateWeeks silts the steward's queue under planned dep-bumps, and
// loopstep with the reversibility stanza removed ships the credential under
// emergent auth. Seeds pinned; same trace forever.

import { useState } from 'react';
import {
  Artifact,
  Badge,
  Commit,
  Drill,
  LabFrame,
  Mark,
  Quadrant,
  glassSlice,
} from '../components/kit.jsx';
import { CASES, quadrantForAxes, scoreAxes } from '../engine/cases.js';
import { moveGate, simulateWeeks } from '../engine/econ.js';
import { runLoopWeeks } from '../engine/loopstep.js';
import casesRaw from '../engine/cases.js?raw';

// The glass: the two functions this bench runs on. quadrantForAxes is the
// whole board (reversibility picks the column, legibility the row; coupling
// argues, it does not vote), and scoreAxes is the grader that compares your
// axis calls against a case's ground truth and returns the why for each miss.
const GLASS =
  glassSlice(
    casesRaw,
    'export function quadrantForAxes',
    "return reversible ? 'emergent-explore' : 'danger';",
  ) +
  '\n}\n\n' +
  glassSlice(casesRaw, 'const PLACEMENT_AXES', 'return { agreed, missed };\n}');

/* ── The runs (module scope, seeds pinned) ──────────────────────────────── */

const WEEKS = 12;
// Seed 5 breaks the breached weeks toward the stall pathology: the queue
// silts. (The other pathology, rubber-stamping, is Chapter 18's subject.)
const ECON_SEED = 5;
// Seed 8 lands the first post-merge auth defect in week 5, where it ossifies.
const AUTH_SEED = 8;

// The bench's terrain: one steward, budget 30, four proposal classes. The
// dep-patch numbers are the handbook's §3.6 scenario (18 a week at 96%, ~3 a
// week once sampled at 15%); the auth-change class is constructed for this
// bench: rare, decent, and sitting on a surface with no undo path.
const TERRAIN = [
  {
    id: 'dep-patch',
    label: 'Dependency patches',
    inflow: 18,
    quality: 0.96,
    sampling: 0.15,
    gate: 'below',
  },
  { id: 'auth-change', label: 'Auth changes', inflow: 2, quality: 0.9, gate: 'above' },
  { id: 'oncall-assist', label: 'On-call assist', inflow: 7, quality: 0.88, gate: 'above' },
  { id: 'doc-refresh', label: 'Doc refresh', inflow: 5, quality: 0.93, gate: 'above' },
];

function runCombo(depGate, authGate) {
  const classes = moveGate(moveGate(TERRAIN, 'dep-patch', depGate), 'auth-change', authGate);
  return simulateWeeks({ classes, seed: ECON_SEED, weeks: WEEKS });
}

const ECON_RUNS = {
  'above|above': runCombo('above', 'above'),
  'above|below': runCombo('above', 'below'),
  'below|above': runCombo('below', 'above'),
  'below|below': runCombo('below', 'below'),
};

// Emergent auth on the loop machine: the five-stage loop with the
// reversibility stanza removed, because on this surface the undo path is not
// a config choice somebody skipped. It never existed.
const AUTH_RUN = runLoopWeeks({
  config: { name: 'auth-change', reversibility: false },
  weeks: WEEKS,
  seed: AUTH_SEED,
  proposalsPerWeek: 2,
});
const OSSIFY = AUTH_RUN.weeks.find((w) => w.events.some((e) => e.includes('ossified')));

// Shared chart scales, so shapes compare honestly across gate combos.
const QUEUE_HI = Math.max(...Object.values(ECON_RUNS).flatMap((r) => r.weeks.map((w) => w.wip)));
const FREE_HI = Math.max(
  ...Object.values(ECON_RUNS).flatMap((r) => r.weeks.map((w) => w.upstreamFree)),
);
const REVIEW_HI = Math.max(...AUTH_RUN.series.reviewCost);

/* ── The worked pair (Part I) ───────────────────────────────────────────── */

const AUTH_RECORD = [
  { no: 1, text: 'decision: authentication', kind: 'key' },
  { no: 2, text: 'axes:' },
  { no: 3, text: '  reversibility: costly', annot: 'a leaked credential cannot be recalled' },
  { no: 4, text: '  legibility: specified', annot: 'OIDC; the threat model is written' },
  { no: 5, text: '  coupling: tight', annot: 'every service trusts the token' },
  { no: 6, text: 'verdict: planned', kind: 'key', hot: true },
  { no: 7, text: 'gate: human design review, every change' },
];

const DEP_RECORD = [
  { no: 1, text: 'decision: dependency patch bumps', kind: 'key' },
  { no: 2, text: 'axes:' },
  { no: 3, text: '  reversibility: cheap', annot: 'one git revert, lockfile only' },
  { no: 4, text: '  legibility: specified', annot: 'changelog clean; CI is the oracle' },
  { no: 5, text: '  coupling: loose', annot: 'one bump per PR; nothing else moves' },
  { no: 6, text: 'verdict: emergent (specified)', kind: 'key', hot: true },
  { no: 7, text: 'gate: propose-only -> earned auto-merge' },
];

const WORKED_AXES = [
  {
    axis: 'Reversibility',
    ask: 'If this goes wrong, how expensive is it to undo? The most important question.',
    auth: {
      call: 'costly',
      why:
        'A bad token-minting change is not undone by a revert. The sessions it signed are ' +
        'out, the credential it logged has been copied, and the export that shipped ' +
        'overnight does not un-ship. Undoing costs more than not doing.',
    },
    dep: {
      call: 'cheap',
      why:
        'A bad patch bump is one git revert, lockfile only, and the suite that caught it ' +
        'is the same suite that clears the fix. The undo costs less than the meeting that ' +
        'would have prevented it.',
    },
  },
  {
    axis: 'Legibility',
    ask: 'Is the problem well-specified and stable, or exploratory and shifting?',
    auth: {
      call: 'specified',
      why:
        'Nothing here is being discovered. OIDC is written, the threat model is written, ' +
        'the audit checklist is written. The problem is old and pinned.',
    },
    dep: {
      call: 'specified',
      why:
        'The signal fires only on a clean changelog and the oracle is a green suite. The ' +
        'spec is finished and machine-checkable. Note the tie: this axis does not split ' +
        'the pair.',
    },
  },
  {
    axis: 'Coupling',
    ask: 'Does a local change force changes elsewhere?',
    auth: {
      call: 'tight',
      why:
        'Change what the token asserts and every service that trusts it moves with you, ' +
        'on your schedule or by surprise.',
    },
    dep: {
      call: 'loose',
      why:
        'One bump per PR, nothing else in the diff; downstream consumers see the same ' +
        'API they saw yesterday.',
    },
  },
];

/* ── Part II strings (numbers verified against the pinned runs) ─────────── */

const COMBO_READING = {
  'above|above':
    'Both held planned. The inequality fails before the first week runs (32 gated against ' +
    '28.5 capacity), so the backlog compounds 3.5 PRs a week into a 42-PR silt by week 12, ' +
    'and upstream time reads zero for twelve straight weeks. The careful-looking placement ' +
    'is the expensive one.',
  'below|above':
    "The records' placement. The inequality holds at 16.7 against 28.5; the sampled 2.7 " +
    "dep reviews a week keep that class's record honest, and 13.3 approvals a week are " +
    'left for the work only a steward can do.',
  'below|below':
    "The console's best numbers on the board: 14.9 gated, 15.1 free. Queue physics has no " +
    'objection to auth below the gate, and that is the warning. Read the panel that just ' +
    'opened underneath.',
  'above|below':
    'Both verdicts swapped. The silt and the leak at once: 30.2 gated against 28.5, so the ' +
    'backlog compounds anyway, while the surface with no undo path merges on green.',
};

const COMMIT_FEEDBACK = {
  silt: (
    <>
      On paper before it is in the trace: gated inflow 32 against capacity 28.5 (the budget less the
      5% that pays for saying no). The inequality fails, so the shortfall compounds at 3.5 PRs a
      week into a 42-PR silt by week 12, and <code>upstreamFree</code> pins at zero. Read that last
      number as the real price: the 13 approvals a week that were funding terrain work are what the
      gate spent.
    </>
  ),
  catch: (
    <>
      There is nothing extra to catch: this class runs 96% quality with CI already the oracle, so
      the considered yes mostly re-confirms a green suite, eighteen times a week. What changes is
      the other column. The inequality fails (32 against 28.5), the backlog compounds to 42 by week
      12, and upstream time goes to zero. The premium is 18 approvals a week, insuring against a
      risk whose undo is one revert.
    </>
  ),
  absorb: (
    <>
      Close enough only if the overflow drains somewhere, and it has nowhere to drain: this engine
      deliberately has no work-harder parameter, because the budget is the constant (the comment at
      the top of <code>econ.js</code> says exactly that). 32 arrive, 28.5 get considered, 3.5 carry,
      every week. Carried demand is a stock, not a blip: by week 12 it is a 42-PR silt.
    </>
  ),
};

/* ── Cases used by Parts III–V ──────────────────────────────────────────── */

const byId = (id) => CASES.find((c) => c.id === id);
const FADED_VERDICT_CASE = byId('pl-11'); // search tokenizer: axes worked, you place
const FADED_AXES_CASE = byId('pl-03'); // erasure job: you call the axes, graded
const DANGER_CASE = byId('pl-12'); // webhook schema: refuses to run as placed
const DRILL_CASES = ['pl-01', 'pl-06', 'pl-07', 'pl-05', 'pl-02', 'pl-04'].map(byId);

const QUADRANT_LABELS = {
  planned: 'Planned',
  'emergent-spec': 'Emergent (specified)',
  danger: 'Danger zone',
  'emergent-explore': 'Emergent (exploratory)',
};

const AXIS_LABELS = {
  reversibility: 'Reversibility',
  legibility: 'Legibility',
  coupling: 'Coupling',
};

const AXIS_OPTIONS = {
  reversibility: ['cheap', 'costly'],
  legibility: ['specified', 'exploratory'],
  coupling: ['loose', 'tight'],
};

// The two honest exits from the danger zone, each one a terrain change whose
// amended axes the board function re-reads (computed, not asserted).
const REMEDIES = {
  shrink: {
    label: 'Shrink the blast radius',
    detail: 'open a versioned beta channel partners agree can break',
    axes: { reversibility: 'cheap', legibility: 'exploratory', coupling: 'tight' },
    record: [
      { no: 1, text: 'decision: webhook payload schema', kind: 'key' },
      { no: 2, text: 'terrain: beta channel, versioned; breakage clause signed' },
      { no: 3, text: 'axes:' },
      {
        no: 4,
        text: '  reversibility: cheap',
        annot: 'breaking beta is the agreed price',
        hot: true,
      },
      { no: 5, text: '  legibility: exploratory', annot: 'discovery continues, priced' },
      { no: 6, text: '  coupling: tight', annot: 'still external; the channel fences it' },
    ],
    run: [
      'wk 1 · beta channel opens; both partners sign the breakage clause',
      'wk 2-6 · the event list changes three more times, on beta, where breaking is the agreed price',
      'wk 7 · the stable channel ships its first two events: the ones that survived',
    ],
  },
  contract: {
    label: 'Write the contract',
    detail: 'freeze the minimal event set you are sure of',
    axes: { reversibility: 'costly', legibility: 'specified', coupling: 'tight' },
    record: [
      { no: 1, text: 'decision: webhook payload schema', kind: 'key' },
      { no: 2, text: 'terrain: minimal event set frozen; the rest stays unshipped' },
      { no: 3, text: 'axes:' },
      { no: 4, text: '  reversibility: costly', annot: 'the frozen four are forever' },
      {
        no: 5,
        text: '  legibility: specified',
        annot: 'four events, agreed in every partner call',
        hot: true,
      },
      { no: 6, text: '  coupling: tight', annot: 'unchanged' },
    ],
    run: [
      'wk 1 · four events freeze behind a versioned deprecation policy',
      'wk 2-6 · discovery continues in design-partner calls, not in production payloads',
      'wk 9 · event five earns its place by holding shape for a month',
    ],
  },
};

/* ── Small render helpers ───────────────────────────────────────────────── */

function Part({ no, title, children }) {
  return (
    <section style={{ margin: '20px 0' }} aria-label={`Part ${no}: ${title}`}>
      <div className="mh-kicker" style={{ marginBottom: 8 }}>
        {no} · {title}
      </div>
      {children}
    </section>
  );
}

function Sparkline({ label, values, hi, color, fmt }) {
  const W = 220;
  const H = 56;
  const P = 4;
  const n = values.length;
  const span = hi || 1;
  const points = values
    .map((v, i) => {
      const x = P + (i * (W - 2 * P)) / (n - 1);
      const y = H - P - (Math.min(v, span) / span) * (H - 2 * P);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <div style={{ display: 'grid', gap: 3 }}>
      <span className="mh-kicker">{label}</span>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${label} over ${n} weeks: starts at ${fmt(values[0])}, ends at ${fmt(values[n - 1])}`}
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--line-soft)',
          borderRadius: 3,
        }}
      >
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
      <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>
        wk 1 {fmt(values[0])} · wk {n} {fmt(values[n - 1])}
      </span>
    </div>
  );
}

function EvidenceList({ evidence }) {
  return (
    <ul style={{ margin: '0 0 10px', paddingLeft: 18, fontSize: '14.5px' }}>
      {evidence.map((ev) => (
        <li key={ev.label}>
          <strong>{ev.label}.</strong> {ev.text}
        </li>
      ))}
    </ul>
  );
}

function CaseHead({ c }) {
  return (
    <>
      <p
        className="mono"
        style={{ margin: '0 0 4px', fontSize: '12.5px', color: 'var(--ink-faint)' }}
      >
        {c.surface}
      </p>
      <p style={{ margin: '0 0 8px' }}>{c.prompt}</p>
    </>
  );
}

const cellStyle = {
  border: '1px solid var(--line-soft)',
  borderRadius: 3,
  background: 'var(--paper-2)',
  padding: '10px 12px',
  fontSize: '13.5px',
  color: 'var(--ink-2)',
};

/* ── Part I — the worked pair ───────────────────────────────────────────── */

function WorkedPair() {
  return (
    <Part no="I" title="The worked pair">
      <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '0 0 10px' }}>
        Two placement records, finished. Read them as a pair: the schema you need is in the
        difference, not in either record alone.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 12,
          margin: '0 0 12px',
        }}
      >
        <Artifact lines={AUTH_RECORD} />
        <Artifact lines={DEP_RECORD} />
      </div>
      {WORKED_AXES.map((row) => (
        <div key={row.axis} style={{ margin: '0 0 10px' }}>
          <div className="mh-kicker" style={{ marginBottom: 4 }}>
            {row.axis} — {row.ask}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 10,
            }}
          >
            <div style={cellStyle}>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--accent-ink)' }}>
                authentication · {row.auth.call}
              </span>
              <p style={{ margin: '4px 0 0' }}>{row.auth.why}</p>
            </div>
            <div style={cellStyle}>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--accent-ink)' }}>
                dep patch bumps · {row.dep.call}
              </span>
              <p style={{ margin: '4px 0 0' }}>{row.dep.why}</p>
            </div>
          </div>
        </div>
      ))}
      <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '12px 0 0' }}>
        Two axes split the pair, one ties, and the verdicts fall out of the board: costly and
        specified is planned; cheap and specified is emergent, the specified half. Notice what never
        came up: what auth <em>ought</em> to be. Sessions against JWTs, build against buy, none of
        it. An argument about <em>what</em> ends in taste and authority; an argument about{' '}
        <em>where</em> ends in a check of three axes, which are empirical{' '}
        <Badge
          layer="W"
          note="the three placement axes are the handbook's working design principle, §2.3"
        />
        . Two readers who disagree about everything auth ought to be will land both records in the
        same cells.
      </p>
    </Part>
  );
}

/* ── Part II — run it both ways ─────────────────────────────────────────── */

function GateChips({ label, value, onChange, disabled }) {
  return (
    <div>
      <span className="mh-kicker" style={{ display: 'block', marginBottom: 4 }}>
        {label}
      </span>
      <div className="mh-chipset" role="group" aria-label={`${label}: gate position`}>
        {[
          { id: 'above', label: 'above the gate · planned' },
          { id: 'below', label: 'below the gate · emergent' },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            className="mh-chip"
            aria-pressed={value === opt.id}
            disabled={disabled}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function LeakPanel() {
  const wk12 = WEEKS - 1;
  return (
    <div
      className="mh-card"
      style={{ borderTopColor: 'var(--red)', marginTop: 12 }}
      aria-label="What the console cannot see: the same placement on the loop machine"
    >
      <span className="mh-kicker" style={{ color: 'var(--red)' }}>
        What the console cannot see · the same placement, run on the loop machine
      </span>
      <p style={{ margin: '0 0 8px' }}>
        The 2 auth changes a week now merge inside their autonomy envelope, sampled like any
        below-gate class. For four weeks the record builds the way records do: review minutes fall
        from 25.6 to 23.4 as the track record accrues. Week 5, a session-token change merges on
        green. CI cannot see that the new debug path logs the minted credential, and the nightly log
        export ships before anyone reads it. You rotate the signing key by noon; rotation closes the
        door, and the copies keep what they copied.{' '}
        <Mark
          kind="made"
          note="the credential story is the authored face of the engine's ossified defect"
        />
      </p>
      <p
        className="mono"
        style={{
          fontSize: '12px',
          color: 'var(--red)',
          border: '1px solid var(--line-soft)',
          borderRadius: 3,
          padding: '6px 10px',
          margin: '0 0 10px',
        }}
      >
        week {OSSIFY.week} · {OSSIFY.events.find((e) => e.includes('ossified'))}
      </p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', margin: '0 0 8px' }}>
        <Sparkline
          label="Review minutes / week"
          values={AUTH_RUN.series.reviewCost}
          hi={REVIEW_HI * 1.08}
          color="var(--red)"
          fmt={(v) => `${v}m`}
        />
        <div className="mh-readout" style={{ margin: 0 }}>
          <div className="mh-stat">
            <span className="k">Merged</span>
            <span className="v">{AUTH_RUN.summary.totalMerged}</span>
          </div>
          <div className="mh-stat">
            <span className="k">Escaped, no undo</span>
            <span className="v bad">{AUTH_RUN.summary.totalDefectsEscaped}</span>
          </div>
          <div className="mh-stat">
            <span className="k">Self-report wk 12</span>
            <span className="v warn">{AUTH_RUN.summary.confidence[wk12].toFixed(2)}</span>
          </div>
          <div className="mh-stat">
            <span className="k">True quality wk 12</span>
            <span className="v bad">{AUTH_RUN.summary.quality[wk12].toFixed(2)}</span>
          </div>
        </div>
      </div>
      <p style={{ margin: 0 }}>
        Everything after week 5 is re-read against the mistake that cannot come out: review minutes
        step from 22.7 to 45 and never come back down, trust freezes at 0.35, and the loop's
        confidence climbs back to 0.94 over a main branch that is permanently worse. Held above the
        gate instead, auth costs 2 considered approvals a week, the cheapest line in the table. The
        console rewarded this placement; the reversibility axis is the only instrument that said no.
        That is why it is the most important question.
      </p>
    </div>
  );
}

function RunBothWays() {
  const [ran, setRan] = useState(false);
  const [depGate, setDepGate] = useState('below');
  const [authGate, setAuthGate] = useState('above');

  const run = ECON_RUNS[`${depGate}|${authGate}`];
  const last = run.weeks[run.weeks.length - 1];
  const { lhs, rhs, ok } = run.inequality;
  const classes = moveGate(moveGate(TERRAIN, 'dep-patch', depGate), 'auth-change', authGate);

  return (
    <Part no="II" title="Run it both ways">
      <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '0 0 10px' }}>
        Placement reads as paperwork until something runs on it. So run it. One steward, a budget of
        30 considered approvals a week, four proposal classes; the only controls here are gate
        positions, because the gate position is what a verdict is. The bench starts where the
        records above put things: 18 dep bumps a week below the gate at 15% sampling, auth above it
        at 2.
      </p>

      <table className="mh-table">
        <thead>
          <tr>
            <th>Class</th>
            <th>Inflow / wk</th>
            <th>Gate</th>
            <th>Considered demand / wk</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c) => {
            const sampling = c.sampling ?? 0.1;
            const demand = c.gate === 'above' ? c.inflow : c.inflow * sampling;
            return (
              <tr key={c.id}>
                <td>{c.label}</td>
                <td>{c.inflow}</td>
                <td>{c.gate}</td>
                <td>
                  {Math.round(demand * 10) / 10}
                  {c.gate === 'below' ? ` (${Math.round(sampling * 100)}% sampled)` : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mh-readout">
        <div className="mh-stat">
          <span className="k">Gated inflow / wk</span>
          <span className={ok ? 'v' : 'v bad'}>{lhs}</span>
        </div>
        <div className="mh-stat">
          <span className="k">Capacity (30 − 5%)</span>
          <span className="v">{rhs}</span>
        </div>
        <div className="mh-stat">
          <span className="k">Inequality</span>
          <span className={ok ? 'v good' : 'v bad'}>{ok ? 'holds' : 'fails'}</span>
        </div>
        <div className="mh-stat">
          <span className="k">Queue, wk 12</span>
          <span className={last.wip > 0 ? 'v bad' : 'v good'}>{last.wip}</span>
        </div>
        <div className="mh-stat">
          <span className="k">Upstream free, wk 12</span>
          <span className={last.upstreamFree > 0 ? 'v good' : 'v bad'}>{last.upstreamFree}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', margin: '10px 0' }}>
        <Sparkline
          label="The gate queue (standing backlog)"
          values={run.weeks.map((w) => w.wip)}
          hi={QUEUE_HI * 1.08}
          color="var(--amber)"
          fmt={(v) => `${v}`}
        />
        <Sparkline
          label="Upstream time left (approvals/wk)"
          values={run.weeks.map((w) => w.upstreamFree)}
          hi={FREE_HI * 1.08}
          color="var(--accent)"
          fmt={(v) => `${v}`}
        />
      </div>

      <Commit
        prompt={
          'A new platform lead reads "agents merge dependency bumps" and wants every bump ' +
          'held for a considered approval: all 18 a week, above the gate. The budget stays ' +
          '30, because budgets do. What does week 12 look like?'
        }
        options={[
          { id: 'silt', label: 'The queue silts: backlog compounds, upstream time hits zero' },
          { id: 'catch', label: 'Escapes drop: considered review catches what sampling missed' },
          { id: 'absorb', label: 'It absorbs: 32 demands on 30 approvals is close enough' },
        ]}
        onReveal={() => {
          setRan(true);
          setDepGate('above');
        }}
      >
        {(picked) => (
          <>
            <p style={{ marginTop: 0 }}>{COMMIT_FEEDBACK[picked]}</p>
            <p style={{ margin: 0 }}>
              The gates are unlocked now. Watch the queue line as you move them, and watch what
              opens when auth goes below.
            </p>
          </>
        )}
      </Commit>

      <div className="mh-controls" style={{ alignItems: 'flex-start' }}>
        <GateChips
          label="Dependency patches (18/wk, 96%)"
          value={depGate}
          onChange={setDepGate}
          disabled={!ran}
        />
        <GateChips
          label="Auth changes (2/wk, no undo path)"
          value={authGate}
          onChange={setAuthGate}
          disabled={!ran}
        />
        {!ran ? (
          <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>
            commit above to unlock the gates
          </span>
        ) : null}
      </div>

      <p
        aria-live="polite"
        style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '10px 0 0' }}
      >
        {COMBO_READING[`${depGate}|${authGate}`]}
      </p>

      {authGate === 'below' ? <LeakPanel /> : null}
    </Part>
  );
}

/* ── Part III — faded cases ─────────────────────────────────────────────── */

// Backward fading, step one: the axes arrive worked; you place the verdict.
function FadedVerdictCase({ c }) {
  const [placed, setPlaced] = useState(null);
  const boardReads = quadrantForAxes(c.axesTruth);
  return (
    <div className="mh-commit" role="group" aria-label="Faded case: place the verdict">
      <span className="mh-kicker">Faded case 1 · the axes are worked; you place it</span>
      <CaseHead c={c} />
      <EvidenceList evidence={c.evidence} />
      <div style={{ display: 'grid', gap: 8, margin: '0 0 6px' }}>
        {Object.keys(AXIS_LABELS).map((axis) => (
          <div key={axis} style={cellStyle}>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--accent-ink)' }}>
              {AXIS_LABELS[axis]} · {c.axesTruth[axis]} · worked for you
            </span>
            <p style={{ margin: '4px 0 0' }}>{c.axesWhy[axis]}</p>
          </div>
        ))}
      </div>
      <Quadrant value={placed} onChange={(id) => placed === null && setPlaced(id)} />
      {placed !== null ? (
        <div className="mh-feedback">
          {c.feedback[placed]}
          <p style={{ margin: '8px 0 0' }}>
            On these axes the board function reads <strong>{QUADRANT_LABELS[boardReads]}</strong>{' '}
            (that is <code>quadrantForAxes</code>, in the glass below: reversibility picks the
            column, legibility the row, and coupling argues rather than votes).
          </p>
        </div>
      ) : null}
    </div>
  );
}

// Backward fading, step two: you call all three axes; scoreAxes grades the
// calls against the case's hidden ground truth; then you place.
function FadedAxesCase({ c }) {
  const [picks, setPicks] = useState({ reversibility: null, legibility: null, coupling: null });
  const [committed, setCommitted] = useState(false);
  const [placed, setPlaced] = useState(null);

  const allPicked = Object.values(picks).every((v) => v !== null);
  const grade = committed ? scoreAxes(c, picks) : null;
  const missedAxes = grade ? grade.missed.map((m) => m.axis) : [];
  const boardOnTruth = quadrantForAxes(c.axesTruth);
  const boardOnPicks = committed ? quadrantForAxes(picks) : null;

  return (
    <div className="mh-commit" role="group" aria-label="Faded case: call the axes, then place">
      <span className="mh-kicker">Faded case 2 · you call the axes; the terrain grades them</span>
      <CaseHead c={c} />
      <EvidenceList evidence={c.evidence} />
      <div style={{ display: 'grid', gap: 8, margin: '0 0 10px' }}>
        {Object.keys(AXIS_LABELS).map((axis) => (
          <div key={axis}>
            <span className="mh-kicker" style={{ display: 'block', marginBottom: 4 }}>
              {AXIS_LABELS[axis]}
            </span>
            <div className="mh-chipset" role="group" aria-label={`Your call: ${AXIS_LABELS[axis]}`}>
              {AXIS_OPTIONS[axis].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className="mh-chip"
                  aria-pressed={picks[axis] === opt}
                  disabled={committed}
                  onClick={() => setPicks({ ...picks, [axis]: opt })}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {!committed ? (
        <div className="mh-controls" style={{ margin: 0 }}>
          <button
            type="button"
            className="mh-btn mh-btn-primary"
            disabled={!allPicked}
            onClick={() => setCommitted(true)}
          >
            Commit the axes
          </button>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>
            all three, then the terrain answers
          </span>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: 8, margin: '0 0 6px' }}>
            {Object.keys(AXIS_LABELS).map((axis) => {
              const missed = missedAxes.includes(axis);
              return (
                <div
                  key={axis}
                  style={{
                    ...cellStyle,
                    borderColor: missed ? 'var(--amber)' : 'var(--line-soft)',
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: '11px',
                      color: missed ? 'var(--amber)' : 'var(--accent-ink)',
                    }}
                  >
                    {AXIS_LABELS[axis]} · you said {picks[axis]} ·{' '}
                    {missed ? `the terrain says ${c.axesTruth[axis]}` : 'the terrain agrees'}
                  </span>
                  <p style={{ margin: '4px 0 0' }}>{c.axesWhy[axis]}</p>
                </div>
              );
            })}
          </div>
          <Quadrant value={placed} onChange={(id) => placed === null && setPlaced(id)} />
          {placed !== null ? (
            <div className="mh-feedback">
              {c.feedback[placed]}
              <p style={{ margin: '8px 0 0' }}>
                On the terrain's axes the board reads{' '}
                <strong>{QUADRANT_LABELS[boardOnTruth]}</strong>
                {boardOnPicks !== boardOnTruth ? (
                  <>
                    ; on your committed axes it read{' '}
                    <strong>{QUADRANT_LABELS[boardOnPicks]}</strong>. One missed axis is how a
                    verdict goes wrong while feeling checked: the board only ever reads what you fed
                    it.
                  </>
                ) : (
                  <>, same as yours: the axes did the work before the board did.</>
                )}
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

/* ── Part IV — the danger zone refuses ──────────────────────────────────── */

function DangerCase({ c }) {
  const [placed, setPlaced] = useState(null);
  const [attempted, setAttempted] = useState(false);
  const [remedy, setRemedy] = useState(null);

  const chosen = remedy ? REMEDIES[remedy] : null;
  const newQuadrant = chosen ? quadrantForAxes(chosen.axes) : null;

  return (
    <div className="mh-commit" role="group" aria-label="The danger-zone case">
      <span className="mh-kicker">The case the bench treats differently</span>
      <CaseHead c={c} />
      <EvidenceList evidence={c.evidence} />
      <Quadrant value={placed} onChange={(id) => placed === null && setPlaced(id)} />
      {placed !== null ? (
        <div className="mh-feedback">
          {c.feedback[placed]}
          <div className="mh-controls" style={{ margin: '10px 0 0' }}>
            <button
              type="button"
              className="mh-btn mh-btn-danger"
              onClick={() => setAttempted(true)}
              disabled={attempted}
            >
              Run a schema-iteration loop here
            </button>
          </div>
        </div>
      ) : null}
      {attempted ? (
        <div
          role="status"
          style={{
            marginTop: 10,
            padding: '10px 12px',
            border: '1px solid var(--red)',
            borderRadius: 3,
            background: 'var(--red-soft)',
            fontSize: '14px',
            color: 'var(--ink)',
          }}
        >
          <span className="mh-kicker" style={{ display: 'block', color: 'var(--red)' }}>
            Refused · the bench will not run this placement
          </span>
          <p style={{ margin: '6px 0 8px' }}>
            The bench checked the axes itself: partners code against every shipped field and cannot
            be redeployed (costly), and the event list moved three times in four weeks
            (exploratory). Irreversible and exploratory is where engineering disasters live; never
            let agents forage there without first making the decision reversible or making the
            problem legible <Badge layer="W" note="the danger-zone rule, handbook §2.3" />. The
            quadrant is an action item, not a label. Change the terrain:
          </p>
          <div
            className="mh-chipset"
            role="group"
            aria-label="Terrain changes that exit the danger zone"
          >
            {Object.entries(REMEDIES).map(([id, r]) => (
              <button
                key={id}
                type="button"
                className="mh-chip"
                aria-pressed={remedy === id}
                onClick={() => setRemedy(id)}
              >
                {r.label} · {r.detail}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {chosen ? (
        <div style={{ marginTop: 10 }}>
          <Artifact lines={chosen.record} />
          <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '8px 0' }}>
            The board re-reads the amended axes and lands it in{' '}
            <strong>{QUADRANT_LABELS[newQuadrant]}</strong> (computed by{' '}
            <code>quadrantForAxes</code>, same function as everywhere else). Now the loop runs:
          </p>
          <ul
            className="mono"
            style={{
              margin: '0 0 8px',
              paddingLeft: 18,
              fontSize: '12.5px',
              lineHeight: 1.7,
              color: 'var(--ink-2)',
            }}
          >
            {chosen.run.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: 0 }}>
            <Mark kind="made" note="authored vignette, not an engine trace; see model notes" /> Same
            surface, two honest exits, and the loop runs in either. What the bench would not do is
            run the danger quadrant and hope. Try the other exit; the two commit you to different
            futures.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* ── The lab ────────────────────────────────────────────────────────────── */

const PAYOFF = (
  <>
    Auth and a dep bump disagree about everything except how to be placed. Check three axes, what
    undo costs, whether the spec is settled, what moves when this moves, and the verdicts fall out:
    costly-specified-tight is planned; cheap-specified-loose is emergent. Get either backwards and
    the bills differ in kind. Dep bumps held above the gate silt the steward's queue (32 demands on
    28.5 capacity, a 42-PR backlog by week 12), while auth below the gate runs clean for four weeks
    and then ships one credential no rotation can recall. The danger quadrant is not a label but a
    state to leave: make the decision reversible or make the problem legible, then run. Two readers
    who disagree what auth ought to be agree where it sits. The axes did the arguing.
  </>
);

const NOTES = [
  'The case bank carries authored ground truth: axesTruth and the why behind each axis are ' +
    "the author's calls, pinned per case so the bench can argue back. The grading is " +
    'mechanical (scoreAxes, in the glass); the truth it grades against is judgment, written ' +
    'down. Contested cases carry no answer at all, and their feedback says what each ' +
    'reading commits you to.',
  'The both-ways runs are real engine runs with pinned seeds. Queue physics: simulateWeeks ' +
    '(econ.js), seed 5, 12 weeks, budget 30, four classes; dep-patch above the gate breaks ' +
    'the governing inequality (32 > 28.5), and this seed breaks toward the stall pathology. ' +
    "The other pathology, rubber-stamping, is Chapter 18's subject. The leak: runLoopWeeks " +
    '(loopstep.js), seed 8, the five-stage loop machine with the reversibility stanza ' +
    'removed; the week-5 post-merge defect ossifies.',
  'The leaked credential is the authored face of that ossified defect. The engine knows ' +
    'only "a bad merge with no undo path"; the session token, the log export, and the ' +
    'too-late rotation are dressing so the information-release case has a face. The ' +
    'auth-change class itself (2 a week, quality 0.9) is constructed for teaching, and the ' +
    'two danger-zone exit vignettes in Part IV are authored, not engine traces.',
  'Tuned constants set shapes, not thresholds: 15 base review minutes falling with trust, ' +
    'the 1.5x re-read multiplier after an ossified defect, a 5% post-merge defect chance, ' +
    'the 15% sampling rate (the handbook\'s "~3 approvals a week instead of 18"). Real ' +
    'terrains do not publish these numbers.',
  'Coupling does not pick the quadrant. quadrantForAxes reads reversibility and legibility; ' +
    'tight coupling pulls a decision toward the planned pole, and the case feedback argues ' +
    'that pull case by case. Regulatory, financial, or safety surface pulls the same way.',
];

const CANNOT_SHOW =
  "where your real decision's axes sit. The bench grades axis calls against ground truth " +
  'the author wrote into each case; your repo publishes no axesTruth. The three questions ' +
  'stay empirical (undo cost, spec churn, what moves when this moves), but checking them is ' +
  'fieldwork, and the fieldwork is the placement discipline. Nor does any run here price a ' +
  'real credential leak; the engine knows only that no undo path exists.';

export default function PlacementBench() {
  return (
    <LabFrame
      tag="LAB 05·A — THE PLACEMENT BENCH"
      register="mechanism"
      question="One steward, thirty considered approvals a week, and two decisions on the bench: where authentication lives, and where this week's eighteen dependency bumps live. Which gets the design meeting, which gets the loop, and what exactly goes wrong if you swap them?"
      payoff={PAYOFF}
      notes={NOTES}
      cannotShow={CANNOT_SHOW}
      glass={GLASS}
    >
      <WorkedPair />
      <RunBothWays />
      <Part no="III" title="Your calls against the terrain">
        <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '0 0 10px' }}>
          Now the fading starts. The first case arrives with its axes worked; you place it. The
          second arrives bare: you call all three axes, the bench grades the calls against the
          terrain's ground truth, and then you place. Verdicts are argued, never marked. Axes are
          facts, and facts grade.
        </p>
        <FadedVerdictCase c={FADED_VERDICT_CASE} />
        <FadedAxesCase c={FADED_AXES_CASE} />
      </Part>
      <Part no="IV" title="The danger zone is an action item">
        <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '0 0 10px' }}>
          One more before the drill. Read the evidence, place it, then try to run it.
        </p>
        <DangerCase c={DANGER_CASE} />
      </Part>
      <Part no="V" title="The drill">
        <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '0 0 10px' }}>
          Six bare cases close the bench: no worked axes, surfaces deliberately far from dependency
          bumps. Two of them share one surface and split anyway, because the axes split. One is
          contested and says so. Commit on the board; the feedback argues from the evidence.
        </p>
        <Drill title="The placement drill" cases={DRILL_CASES} />
      </Part>
    </LabFrame>
  );
}
