// LAB 12·C — GAME DAY (Ch 12, mechanism register).
// Forced removal on the specimen terrain: pick a dependency, commit a call
// (collapse or re-adapt) before the run, read the recorded week, and fill in
// the fragility map across attempts. No principle toggles, no loop levers:
// the only thing the reader varies is what gets taken away, and the only
// thing under test is the dependency model in the reader's head.
// Physics: removalExperiment() in src/engine/commons.js.

import { useState } from 'react';
import { Commit, LabFrame, Mark, Walkthrough, glassSlice } from '../components/kit.jsx';
import { removalExperiment } from '../engine/commons.js';
import commonsRaw from '../engine/commons.js?raw';

// glassSlice ends at the line carrying the end marker (the unknown-target
// throw), so the function's closing brace is appended from the next line.
const GLASS =
  glassSlice(commonsRaw, 'export function removalExperiment', 'throw new Error(`unknown removal') +
  '\n}';

// Three removal targets, seeds pinned so each removal tells the same story
// every time: tool runs 40% slower and holds, context misplaces 3 of 5 loops
// into a 14-deep queue, signal re-derives with a 6-hour lag.
const TARGETS = [
  {
    id: 'tool',
    seed: 24,
    name: 'repo-search tool',
    chip: 'a tool · repo-search',
    evidence: [
      'Every loop calls it before editing; it is the most-called tool on the terrain.',
      'It has never been down, so no loop carries a written fallback.',
    ],
  },
  {
    id: 'context',
    seed: 9,
    name: 'ARCHITECTURE.md',
    chip: 'a context source · ARCHITECTURE.md',
    evidence: [
      'It rides in every context pack; every loop reads it before placing a change.',
      'One file, owned by no loop, no freshness check. It has never once been absent.',
    ],
  },
  {
    id: 'signal',
    seed: 14,
    name: 'doc-freshness signal',
    chip: 'a signal · doc-freshness',
    evidence: [
      'Published on a schedule; the doc-refresh loop fires on it.',
      'On paper, removing it stalls the loop: nothing left to fire on.',
    ],
  },
];

const RUNS = Object.fromEntries(
  TARGETS.map((t) => [t.id, removalExperiment({ target: t.id, seed: t.seed })]),
);

const CALL_LABEL = { collapse: 'collapse', readapt: 're-adapt' };

const MAP_ENTRY = {
  tool: 'Replaceable: slower without it, never blocked. No hardening needed.',
  context: 'Load-bearing: make the module table an owned signal with a freshness check.',
  signal: 'Convenient: a cache of a derivable fact. Keep it for speed, not for safety.',
};

const COMMIT_OPTIONS = [
  { id: 'collapse', label: 'collapse — hidden dependency' },
  { id: 'readapt', label: 're-adapt — not load-bearing' },
];

// Numbers cited in the feedback come from the runs themselves, so the prose
// can never drift from what the engine did.
const TOOL_SLOWDOWN = RUNS.tool.story[1].data.slowdownPct;
const CTX_MISPLACED = RUNS.context.story[1].data.misplacedLoops;
const CTX_QUEUE = RUNS.context.story[2].data.queueDepth;
const SIG_LAG = RUNS.signal.story[2].data.lagHours;

// Argued feedback, per target and per call. Never "wrong": the argument runs
// from what the week showed, and a missed call is named as the finding.
const FEEDBACK = {
  tool: {
    collapse: (
      <>
        A defensible call: the most-called tool on the terrain goes dark, and no loop carries a
        fallback. But watch what the loops actually depended on. First runs fail their lookup step,
        then fall back to plain grep over the tree; lookups run {TOOL_SLOWDOWN}% slower, and merge
        rate holds through the week. The dependency was on <strong>search, the capability</strong>;
        the tool was one way to get it. So the missed call is itself the product: game day just
        corrected your dependency map, for the price of a slow week that never really happened. Mark
        repo-search replaceable.
      </>
    ),
    readapt: (
      <>
        The run agrees, so check that you called it for the run's reason. The loops do not route
        around the outage because they are clever; they re-adapt because the dependency was on{' '}
        <strong>search, the capability</strong>, and grep over the tree is another way to get it.
        Lookups run {TOOL_SLOWDOWN}% slower; merge rate holds through the week. Mark repo-search
        replaceable, no hardening needed: a dependency with a derivable substitute is convenience,
        and convenience does not earn a guard.
      </>
    ),
  },
  context: {
    collapse: (
      <>
        Collapse, as you called, but check the shape against your reasons. Nothing slows down. The
        loops keep shipping at full rate, into the wrong modules: {CTX_MISPLACED} of 5 place their
        changes wrong on the first day, and by day three the review queue holds {CTX_QUEUE}{' '}
        mis-placed changes and is not draining. They cannot re-adapt, because what they keyed on,
        the module table inside that one file, was never declared anywhere a fallback could find it.
        <strong> Hidden dependency found.</strong> The fix is terrain: make the module table an
        owned signal with a freshness check, not a file nobody watches.
      </>
    ),
    readapt: (
      <>
        A fair read: it is one Markdown file, and the loops have CI and review behind them. But the
        week finds the other thing. The loops keep shipping at full rate, into the wrong modules:{' '}
        {CTX_MISPLACED} of 5 place their changes wrong on the first day, and by day three the review
        queue holds {CTX_QUEUE} mis-placed changes and is not draining. Their placement decisions
        were keyed to the module table inside that one file, a dependency nobody specified, so there
        was no fallback to reach for. That is the practice working: the system, and your model of
        it, were both quietly relying on something unspecified. Mark the table{' '}
        <strong>load-bearing</strong>, and make it an owned signal with a freshness check.
      </>
    ),
  },
  signal: {
    collapse: (
      <>
        On paper the call is sound: the loop fires on this signal, and the signal is gone. It does
        stall, for exactly one cycle. Then it recomputes freshness from git timestamps, because the
        signal was <strong>a cache of a derivable fact</strong>, not a source. Doc updates land{' '}
        {SIG_LAG} hours later than before, and they land; nothing downstream notices. The
        distinction the map needs is convenient versus load-bearing: keep the signal for speed, but
        do not guard it like a dependency, because the guard would be protecting a cache.
      </>
    ),
    readapt: (
      <>
        Re-adapt, and the mechanism is worth naming: the signal was{' '}
        <strong>a cache of a derivable fact</strong>. The loop stalls one cycle, recomputes
        freshness from git timestamps, and doc updates land {SIG_LAG} hours later than before. They
        land. So the map entry is convenient, not load-bearing: keep it for speed, skip the guard.
        That is the general test a removal runs: a dependency the loops can re-derive comes back on
        its own; one they silently keyed on does not.
      </>
    ),
  },
};

const NOTES = [
  'Each experiment is a recorded run with a pinned seed (tool 24, context 9, signal 14): the ' +
    'same removal tells the same story every time. A real game day runs against live loops, ' +
    'with a bounded blast radius and an announced end time.',
  'Outcomes are scripted to a one-week window and a clean binary, collapse or re-adapt. Real ' +
    'removals smear: partial degradation, slow leaks, re-adaptations that quietly trade away ' +
    'quality.',
  'The three dependencies are constructed for teaching and tuned so one of each kind appears: ' +
    'a replaceable tool, a load-bearing context file, a convenient signal. Real terrains do not ' +
    'distribute so evenly.',
  'Nothing you choose changes how the loops respond; the engine fixes their behavior under each ' +
    'removal. What varies between attempts is your prediction, and the prediction is what the ' +
    'experiment is calibrated to test.',
];

export default function GameDay() {
  const [targetId, setTargetId] = useState('tool');
  const [calls, setCalls] = useState({});

  const target = TARGETS.find((t) => t.id === targetId);
  const run = RUNS[targetId];
  const call = calls[targetId];
  const allDone = TARGETS.every((t) => calls[t.id]);

  const commitCall = (picked) => setCalls((prev) => ({ ...prev, [targetId]: picked }));
  const reset = () => {
    setCalls({});
    setTargetId('tool');
  };

  return (
    <LabFrame
      tag="LAB 12·C — GAME DAY"
      register="mechanism"
      question="The terrain has been healthy for months, which is exactly when you know least about what it depends on. Game day: remove one thing the loops rely on, for one week. Which removals collapse the system, and which does it shrug off?"
      payoff="Collapse finds a hidden dependency; graceful re-adaptation proves the dependency was not load-bearing. On this terrain the most-called tool and the always-watched signal both turn out replaceable, and the one collapse comes from a file nobody watches: the module table every loop silently keys on. Subtraction reveals what addition concealed. The deliverable is the fragility map, and the misses in your prediction column are the part you could not have bought any other way."
      notes={NOTES}
      cannotShow="the removals that are not on the menu. A real terrain's dependency surface is unenumerated, and the dependency that hurts is usually the one nobody thought to test. This engine can only remove what its author already suspected; the discipline exists because real terrains do not come with this list."
      glass={GLASS}
    >
      <p className="mono" style={{ fontSize: 12.5, color: 'var(--ink-faint)', margin: '0 0 12px' }}>
        <Mark kind="made" note="composite terrain; the three dependencies are cast" /> specimen
        terrain, quiet for months · three things every loop touches · take one away for a week
      </p>

      <div
        className="mh-chipset"
        role="group"
        aria-label="Choose what game day removes from the terrain"
      >
        {TARGETS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="mh-chip"
            aria-pressed={targetId === t.id}
            aria-label={`Remove ${t.name}${calls[t.id] ? ' (already run)' : ''}`}
            onClick={() => setTargetId(t.id)}
          >
            {t.chip}
            {calls[t.id] ? ' ✓' : ''}
          </button>
        ))}
      </div>

      <div style={{ margin: '12px 0' }}>
        <span className="mh-kicker">The dependency, before the run</span>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: '14.5px' }}>
          {target.evidence.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      {!call ? (
        <Commit
          key={targetId}
          prompt={`Game day removes the ${target.name} for one week. Call it before the run.`}
          options={COMMIT_OPTIONS}
          onReveal={commitCall}
        >
          {(picked) => FEEDBACK[targetId][picked]}
        </Commit>
      ) : (
        <div>
          <div className="mh-readout" role="status">
            <div className="mh-stat">
              <span className="k">Removed</span>
              <span className="v">{target.name}</span>
            </div>
            <div className="mh-stat">
              <span className="k">Your call</span>
              <span className="v">{CALL_LABEL[call]}</span>
            </div>
            <div className="mh-stat">
              <span className="k">The run</span>
              <span className={run.collapsed ? 'v bad' : 'v good'}>
                {run.collapsed ? 'collapsed' : 're-adapted'}
              </span>
            </div>
          </div>
          <span className="mh-kicker" style={{ display: 'block', margin: '8px 0 4px' }}>
            The week, recorded · seed {target.seed}
          </span>
          <Walkthrough trace={{ seed: target.seed, steps: run.story }} />
          <div className="mh-feedback">{FEEDBACK[targetId][call]}</div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <span className="mh-kicker">The fragility map · what game day is for</span>
        <table className="mh-table" style={{ margin: '8px 0 0' }}>
          <thead>
            <tr>
              <th>Removed</th>
              <th>Your call</th>
              <th>Outcome</th>
              <th>Map entry</th>
            </tr>
          </thead>
          <tbody>
            {TARGETS.map((t) => {
              const made = calls[t.id];
              const collapsed = RUNS[t.id].collapsed;
              return (
                <tr key={t.id}>
                  <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                    {t.name}
                  </td>
                  <td className="mono">{made ? CALL_LABEL[made] : '—'}</td>
                  <td
                    className="mono"
                    style={made ? { color: collapsed ? 'var(--red)' : 'var(--accent-ink)' } : {}}
                  >
                    {made ? (collapsed ? 'collapsed' : 're-adapted') : 'untested'}
                  </td>
                  <td>{made ? MAP_ENTRY[t.id] : 'Untested, so assumed safe. That is the gap.'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {allDone ? (
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
            The map, complete
          </span>
          <p style={{ margin: '0 0 8px' }}>
            Three removals, one collapse, and it came from the file nobody watches, while the
            most-called tool shrugged. Now read your call column against the outcome column:
            anywhere they disagree, the disagreement is the finding, because the thing under test
            was the dependency model in your head.
          </p>
          <p style={{ margin: 0 }}>
            Testing asks whether the system meets a known specification. This asked what the system
            was quietly relying on that nobody specified. The first is verification; the second is
            discovery. The cadence table puts removal experiments at quarterly, or on triggers; this
            map is what the quarter buys.
          </p>
          <div className="mh-controls" style={{ margin: '10px 0 0' }}>
            <button type="button" className="mh-btn" onClick={reset}>
              Clear the map and run game day again
            </button>
          </div>
        </div>
      ) : null}
    </LabFrame>
  );
}
