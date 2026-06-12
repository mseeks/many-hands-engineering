// Checkride.jsx — LAB 22·A, the checkride and the Monday memo (Ch 22, DESIGN §6.11).
//
// The capstone. A foreign terrain (Skylark Data, a nine-person ML-pipeline
// shop, deliberately not the book's platform) seeded with six embedded
// problems, a menu of sixteen terrain-shaped moves, and a hard budget of
// twelve steward actions. Every action is terrain: a reading taken, a gate
// moved, a signal reshaped, a grant revoked, a schedule written. None
// commands an agent.
//
// No score anywhere. Ending the checkride is the commitment; the debrief is
// assembled by the engine from the reader's own event log, problem by
// problem, and the problems never touched say so plainly. The reader's
// choices then assemble into the Monday-morning memo (placement map,
// first-loop spec, gate table, irreversibles, disturbance schedule), the one
// artifact the book claims is carryable to work — rendered as copyable plain
// text with the engine sanity-check flagging the classic errors inline.
//
// Mechanism register on the arithmetic (gated inflow against the budget
// line, recomputed live as gates move); each action's narrated consequence
// is an authored terrain response. Seed 22, deterministic forever. No JS
// motion anywhere in this lab, so there is nothing to gate on reduced motion.

import { useRef, useState } from 'react';
import { Badge, LabFrame, Mark, glassSlice } from '../components/kit.jsx';
import {
  MAX_ACTIONS,
  applyAction,
  availableActions,
  debrief,
  gatedInflow,
  generateCheckride,
  mondayMemo,
} from '../engine/scenarios/checkride.js';
import checkrideRaw from '../engine/scenarios/checkride.js?raw';

/* ── The terrain (module-level: same seed, same shop, forever) ─────────── */

const SEED = 22;
const FRESH = generateCheckride(SEED);
const MENU = availableActions(FRESH); // sixteen labeled moves; the budget is twelve
const INSTRUMENTS = MENU.filter((a) => a.kind === 'instrument');
const MOVES = MENU.filter((a) => a.kind !== 'instrument');

const pct = (x) => Math.round(x * 100);
const LHS0 = gatedInflow(FRESH.terrain.approvals);
const BUDGET_LINE =
  Math.round(FRESH.terrain.approvals.budget * (1 - FRESH.terrain.approvals.tolerance) * 10) / 10;

const GLASS = [
  glassSlice(checkrideRaw, 'export const MAX_ACTIONS', ';'),
  glassSlice(checkrideRaw, 'export function applyAction', '\n}'),
  glassSlice(checkrideRaw, 'export function debrief', '\n}'),
  glassSlice(checkrideRaw, 'export function mondayMemo', '\n}'),
].join('\n\n// ──────────────────────────────────────────────────────────\n\n');

/* ── The memo, assembled from what the reader actually did ─────────────── */

// Glue, not physics: this maps the post-checkride state onto the worksheet
// shape mondayMemo() formats and sanity-checks. Problems the reader never
// touched stay blank, so the engine's !! flags land exactly where the
// reader's twelve actions never did.
function memoAnswers(state) {
  const terrain = state.terrain;
  const taken = state.actionsTaken;
  const misplaced = state.problems.find((p) => p.id === 'misplaced-decision');
  const quarantined = taken.includes('add-quarantine');
  const fixer = terrain.loops.find((l) => l.id === 'drift-fixer');

  const placements = [];
  if (misplaced.found) {
    placements.push({
      decision: 'raw-partition retention purges',
      // The quadrant is the axes, nothing else: the quarantine moves the
      // decision to reversible; a human gate alone leaves it in the danger
      // zone, gated.
      quadrant: quarantined ? 'emergent-explore' : 'danger',
    });
  }
  if (taken.includes('move-gate-dbt')) {
    placements.push({ decision: 'dbt model patch refreshes', quadrant: 'emergent-spec' });
  }

  const irreversibles = [];
  if (misplaced.found && !quarantined) {
    irreversibles.push('raw-partition retention purges: a dropped partition cannot be recalled');
  }

  return {
    team: 'Skylark Data',
    placements,
    firstLoop: {
      name: 'schema-drift fixer',
      signal: fixer.stages.signal,
      boundedAction: fixer.stages.action,
      verification: fixer.stages.verification,
      reversibility: fixer.stages.commitRevert,
      signalUpdate: fixer.stages.update ?? '',
      authoritySurface: 'merge on green, scoped to the staging models; everything else proposes',
    },
    gates: terrain.approvals.classes.map((c) => ({
      cls: c.label,
      inflow: c.inflow,
      rate: c.rate,
      gate: c.gate,
      sampling: c.sampling,
    })),
    budget: terrain.approvals.budget,
    tolerance: terrain.approvals.tolerance,
    irreversibles,
    disturbances: terrain.disturbances.schedule,
  };
}

/* ── Small render helpers ──────────────────────────────────────────────── */

const SectionKicker = ({ children }) => (
  <span className="mh-kicker" style={{ display: 'block', margin: '18px 0 8px' }}>
    {children}
  </span>
);

function Panel({ title, children }) {
  return (
    <div
      style={{
        border: '1px solid var(--line-soft)',
        borderRadius: 4,
        background: 'var(--paper)',
        padding: '10px 14px 12px',
      }}
    >
      <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
        {title}
      </span>
      {children}
    </div>
  );
}

const StageRow = ({ k, v, faint }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 8, padding: '2px 0' }}>
    <span className="mh-kicker" style={{ letterSpacing: '0.12em' }}>
      {k}
    </span>
    <span
      className="mono"
      style={{
        fontSize: '11.5px',
        lineHeight: 1.5,
        color: faint ? 'var(--ink-faint)' : 'var(--ink-2)',
        fontStyle: faint ? 'italic' : undefined,
      }}
    >
      {v}
    </span>
  </div>
);

function LoopCard({ loop }) {
  return (
    <div
      style={{
        border: '1px solid var(--line-soft)',
        borderRadius: 4,
        background: 'var(--paper-2)',
        padding: '9px 12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'baseline',
          flexWrap: 'wrap',
          marginBottom: 4,
        }}
      >
        <strong style={{ fontSize: '14px' }}>{loop.name}</strong>
        {loop.autoApplied ? (
          <span className="mh-kicker" style={{ color: 'var(--amber)' }}>
            auto-applies
          </span>
        ) : null}
      </div>
      <StageRow k="signal" v={loop.stages.signal} />
      <StageRow k="action" v={loop.stages.action} />
      <StageRow k="verify" v={loop.stages.verification} />
      <StageRow k="commit·revert" v={loop.stages.commitRevert} />
      <StageRow
        k="update"
        v={loop.stages.update ?? 'nothing on file'}
        faint={!loop.stages.update}
      />
      {loop.trainedOn ? <StageRow k="trained on" v={loop.trainedOn} /> : null}
      {loop.decay ? <StageRow k="decay" v={loop.decay} /> : null}
    </div>
  );
}

function ActionButton({ action, taken, locked, lockedTitle, onTake }) {
  return (
    <button
      type="button"
      className="mh-btn"
      onClick={() => onTake(action.id)}
      disabled={taken || locked}
      title={taken ? 'Already spent' : locked ? lockedTitle : undefined}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        textTransform: 'none',
        letterSpacing: 0,
        fontSize: '12.5px',
        lineHeight: 1.45,
        marginBottom: 6,
        opacity: taken ? 0.55 : undefined,
      }}
    >
      <span
        className="mh-kicker"
        style={{
          display: 'inline-block',
          minWidth: 88,
          color: taken ? 'var(--ink-faint)' : 'var(--accent-ink)',
        }}
      >
        {taken ? '✓ spent' : action.kind}
      </span>
      {action.label}
    </button>
  );
}

const DebriefRow = ({ k, v }) => (
  <p style={{ margin: '0 0 7px', fontSize: '13.5px', lineHeight: 1.55, color: 'var(--ink-2)' }}>
    <span className="mh-kicker" style={{ display: 'block', marginBottom: 1 }}>
      {k}
    </span>
    {v}
  </p>
);

function DebriefSection({ s }) {
  return (
    <div
      style={{
        border: '1px solid var(--line-soft)',
        borderLeft: `3px solid ${s.found ? 'var(--accent)' : 'var(--red)'}`,
        borderRadius: 4,
        background: 'var(--paper)',
        padding: '12px 14px 8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'baseline',
          flexWrap: 'wrap',
          marginBottom: 8,
        }}
      >
        <strong style={{ fontSize: '15px' }}>{s.problem}</strong>
        <span className="mono" style={{ fontSize: '11.5px', color: 'var(--ink-faint)' }}>
          {s.where}
        </span>
        <span className="mh-kicker" style={{ color: s.found ? 'var(--accent-ink)' : 'var(--red)' }}>
          {s.found ? 'found' : 'never found'}
        </span>
      </div>
      <DebriefRow k="what you did" v={s.readerDid} />
      <DebriefRow k="what it caused" v={s.whatItCaused} />
      <DebriefRow k="what the handbook says" v={s.handbookSays} />
    </div>
  );
}

/* ── The lab ───────────────────────────────────────────────────────────── */

export default function Checkride() {
  const [state, setState] = useState(FRESH);
  const [ended, setEnded] = useState(false);
  const [copied, setCopied] = useState(false);
  const memoRef = useRef(null);

  const spent = state.actionsTaken.length;
  const remaining = MAX_ACTIONS - spent;
  const exhausted = spent >= MAX_ACTIONS;
  const locked = ended || exhausted;
  const lockedTitle = ended ? 'The checkride is over' : 'The twelve are spent: write the debrief';
  const terrain = state.terrain;
  const foundCount = state.problems.filter((p) => p.found).length;
  const report = ended ? debrief(state) : null;
  const memoText = ended ? mondayMemo(memoAnswers(state)) : '';

  const take = (id) => {
    if (ended) return;
    setState((s) => {
      if (s.actionsTaken.length >= MAX_ACTIONS || s.actionsTaken.includes(id)) return s;
      return applyAction(s, id);
    });
  };

  const endRide = () => {
    if (spent > 0) setEnded(true);
  };

  const restart = () => {
    setState(FRESH);
    setEnded(false);
    setCopied(false);
  };

  const copyMemo = async () => {
    try {
      await navigator.clipboard.writeText(memoText);
      setCopied(true);
    } catch {
      // No clipboard API (or permission denied): select the text instead.
      memoRef.current?.select();
    }
  };

  return (
    <LabFrame
      tag="LAB 22·A — THE CHECKRIDE"
      register="mechanism"
      question="You arrive Monday as the new steward of Skylark Data: nine people, an ML-pipeline shop you have never seen, six problems somewhere in its terrain, and a hard budget of twelve steward actions. What do you spend them on?"
      payoff={
        <>
          Twelve actions cannot cover sixteen moves, so the budget does the teaching: every reading
          you take is a fix you don't make, which is a steward's actual week.{' '}
          <Badge
            layer="W"
            note="§3.6 approval economics; §3.11 start small — scarce considered attention, placed where the terrain says"
          />{' '}
          On this terrain the gated inflow runs {LHS0} proposals/wk against a {BUDGET_LINE} budget
          line, an auto-merge grant is still stamped by a judge that left nine weeks ago, and the
          other four problems hide in plain sight in the field notes. The debrief is assembled from
          your own event log, and the problems you never found say so plainly. What you carry out is
          the Monday memo: placement map, first-loop spec, gate table, irreversibles, disturbance
          schedule, with the engine's sanity-check flagging the classic errors inline. No score
          anywhere; the memo is the outcome measure.
        </>
      }
      notes={[
        `Seed ${SEED}, deterministic: the same shop, the same numbers, the same six problems on every visit. The jitter moves between seeds; the problems never do.`,
        "Each action's consequence is an authored terrain response, not a tick-by-tick simulation. The arithmetic is live: gated inflow against budget × (1 − tolerance) recomputes from the terrain as gates move, the same inequality the Gate Console runs.",
        `${MENU.length} moves, ${MAX_ACTIONS} actions, on purpose: instruments cost the same as fixes because reading the terrain spends the same steward week that reshaping it does.`,
        'The Monday memo assembles only from what you actually did. Problems you never touched leave their !! flags in the memo; that is the engine sanity-check working, not a grade.',
      ]}
      cannotShow="your shop. Skylark's six problems were planted to be findable inside twelve actions, and the menu hands you sixteen labeled moves; on a real Monday nobody numbers the problems or labels the moves. The reading order transfers (instruments before fixes, the irreversible before the merely slow), but the menu itself is the fiction."
      glass={GLASS}
    >
      {/* 1 · the shop */}
      <SectionKicker>1 · The shop · the field notes are free; the actions are not</SectionKicker>
      <p style={{ margin: '0 0 8px', fontSize: '14.5px', color: 'var(--ink-2)' }}>
        {terrain.shop.description}{' '}
        <Mark
          kind="made"
          note="composite terrain, constructed for the checkride; the six problem types are the handbook's"
        />{' '}
        The notes below are the live terrain: when an action reshapes a gate, a grant, or a loop,
        the change lands here.
      </p>
      <ul
        className="mono"
        aria-label="Repository regions"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          margin: '0 0 10px',
          padding: 0,
          listStyle: 'none',
        }}
      >
        {terrain.regions.map((r) => (
          <li
            key={r}
            style={{
              border: '1px solid var(--line-soft)',
              borderRadius: 3,
              padding: '2px 8px',
              fontSize: '11px',
              color: 'var(--ink-2)',
            }}
          >
            {r}
          </li>
        ))}
      </ul>

      <div style={{ display: 'grid', gap: 10 }}>
        <Panel title="The dashboard · eight weeks on the wall">
          <div style={{ overflowX: 'auto' }}>
            <table className="mh-table" style={{ margin: 0, fontSize: '12.5px' }}>
              <thead>
                <tr>
                  <th>wk</th>
                  <th>review queue</th>
                  <th>approval rate</th>
                  <th>deep-review agreement</th>
                  <th>offline eval</th>
                  <th>deployed outcome</th>
                </tr>
              </thead>
              <tbody>
                {terrain.telemetry.map((w) => (
                  <tr key={w.week}>
                    <td className="mono">{w.week}</td>
                    <td className="mono">{w.reviewQueue}</td>
                    <td className="mono">{pct(w.approvalRate)}%</td>
                    <td className="mono">{pct(w.deepReviewAgreement)}%</td>
                    <td className="mono">{w.offlineEval.toFixed(2)}</td>
                    <td className="mono">{w.onlineOutcome.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="The approval economy · who waits at which gate">
          <div style={{ overflowX: 'auto' }}>
            <table className="mh-table" style={{ margin: 0, fontSize: '12.5px' }}>
              <thead>
                <tr>
                  <th>task class</th>
                  <th>inflow</th>
                  <th>approval rate</th>
                  <th>gate</th>
                </tr>
              </thead>
              <tbody>
                {terrain.approvals.classes.map((c) => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--ink)' }}>{c.label}</td>
                    <td className="mono">{c.inflow}/wk</td>
                    <td className="mono">{pct(c.rate)}%</td>
                    <td className="mono">
                      {c.gate === 'above' ? 'above' : `below · ${pct(c.sampling)}% sampled`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p
            className="mono"
            style={{ margin: '8px 0 0', fontSize: '11.5px', color: 'var(--ink-faint)' }}
          >
            budget: {terrain.approvals.budget} considered approvals/wk · false-approval tolerance{' '}
            {pct(terrain.approvals.tolerance)}% · the inequality is yours to check
          </p>
        </Panel>

        <Panel title="The running loops · four, all claiming to be closed">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 10,
            }}
          >
            {terrain.loops.map((l) => (
              <LoopCard key={l.id} loop={l} />
            ))}
          </div>
        </Panel>

        <Panel title="Auto-merge grants · the trust on the books">
          <p
            className="mono"
            style={{ margin: '0 0 6px', fontSize: '11.5px', color: 'var(--ink-2)' }}
          >
            environment: judge {terrain.env.judge} (swapped {terrain.env.swappedWeeksAgo} weeks ago)
            · repo shape {terrain.env.repoShape}
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="mh-table" style={{ margin: 0, fontSize: '12.5px' }}>
              <thead>
                <tr>
                  <th>class</th>
                  <th>grant</th>
                  <th>earned under</th>
                  <th>record</th>
                </tr>
              </thead>
              <tbody>
                {terrain.grants.map((g) => (
                  <tr key={g.cls}>
                    <td className="mono" style={{ color: 'var(--ink)' }}>
                      {g.cls}
                    </td>
                    <td className="mono">{g.grant}</td>
                    <td className="mono">
                      {g.earnedUnder.judge} · {g.earnedUnder.repoShape}
                    </td>
                    <td className="mono">
                      {g.record.merged} merged · {g.record.reverted} reverted
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Guardrail inventory · and the disturbance calendar">
          <div style={{ overflowX: 'auto' }}>
            <table className="mh-table" style={{ margin: 0, fontSize: '12.5px' }}>
              <thead>
                <tr>
                  <th>guardrail</th>
                  <th>class</th>
                  <th>setting</th>
                  <th>fired last qtr</th>
                  <th>note</th>
                </tr>
              </thead>
              <tbody>
                {terrain.guardrails.map((g) => (
                  <tr key={g.id}>
                    <td style={{ color: 'var(--ink)' }}>{g.name}</td>
                    <td className="mono">{g.cls}</td>
                    <td className="mono">{g.setting}</td>
                    <td className="mono">{g.firedLastQuarter}</td>
                    <td>{g.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p
            className="mono"
            style={{ margin: '8px 0 0', fontSize: '11.5px', color: 'var(--ink-faint)' }}
          >
            {terrain.disturbances.schedule.length > 0
              ? terrain.disturbances.schedule.map((d) => `${d.cadence}: ${d.what}`).join(' · ')
              : 'no game day on record · nothing scheduled'}
          </p>
        </Panel>
      </div>

      {/* 2 · the twelve */}
      <SectionKicker>2 · The twelve · sixteen moves, twelve actions, your call</SectionKicker>
      <p style={{ margin: '0 0 10px', fontSize: '14.5px', color: 'var(--ink-2)' }}>
        Six problems are seeded here: a mis-placed decision, an open loop posing as closed, a
        forming spiral, a saturated approval budget, a stale trust grant, and a decorative
        guardrail. The field notes above hold every clue. Instruments read the terrain; moves
        reshape it; each costs one of your twelve, because a steward's attention is the scarce input
        either way.
      </p>
      <div className="mh-controls" style={{ margin: '0 0 10px' }}>
        <div
          role="img"
          aria-label={`Steward action budget: ${spent} of ${MAX_ACTIONS} spent, ${remaining} remain`}
          style={{ display: 'flex', gap: 3 }}
        >
          {Array.from({ length: MAX_ACTIONS }, (_, i) => (
            <span
              key={i}
              style={{
                width: 16,
                height: 9,
                borderRadius: 2,
                background: i < spent ? 'var(--line)' : 'var(--accent)',
                opacity: i < spent ? 0.6 : 0.85,
              }}
            />
          ))}
        </div>
        <span className="mh-kicker" aria-live="polite">
          {ended
            ? `checkride ended at ${spent} action${spent === 1 ? '' : 's'}`
            : exhausted
              ? 'the twelve are spent · write the debrief'
              : `${remaining} of ${MAX_ACTIONS} actions remain`}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 10,
        }}
      >
        <Panel title="Instruments · readings cost an action too">
          {INSTRUMENTS.map((a) => (
            <ActionButton
              key={a.id}
              action={a}
              taken={state.actionsTaken.includes(a.id)}
              locked={locked}
              lockedTitle={lockedTitle}
              onTake={take}
            />
          ))}
        </Panel>
        <Panel title="Terrain moves · gates, signals, grants, guards, schedules">
          {MOVES.map((a) => (
            <ActionButton
              key={a.id}
              action={a}
              taken={state.actionsTaken.includes(a.id)}
              locked={locked}
              lockedTitle={lockedTitle}
              onTake={take}
            />
          ))}
        </Panel>
      </div>

      <SectionKicker>The flight log · the debrief writes from this</SectionKicker>
      <div className="mh-trace" aria-live="polite">
        {state.log.length === 0 ? (
          <p className="mono" style={{ margin: 0, fontSize: '12px', color: 'var(--ink-faint)' }}>
            No actions spent yet. Everything you do lands here, in order, with what it caused; the
            debrief is assembled from this log and nothing else.
          </p>
        ) : (
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {state.log.map((e, i) => (
              <li
                key={e.action}
                className={i === state.log.length - 1 ? 'mh-trace-step now' : 'mh-trace-step'}
              >
                <span className="idx">{i + 1}</span>
                <span className="cap">
                  <strong>{e.label}.</strong> {e.caused}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="mh-controls" role="group" aria-label="End the checkride">
        <button
          type="button"
          className="mh-btn mh-btn-primary"
          onClick={endRide}
          disabled={ended || spent === 0}
          title={spent === 0 ? 'Spend at least one steward action first' : undefined}
        >
          {exhausted
            ? 'Write the debrief'
            : spent === 0
              ? 'End the checkride · write the debrief'
              : `End the checkride at ${spent} · write the debrief`}
        </button>
        {!ended ? (
          <span className="mh-kicker">
            ending is final · the debrief reads only what the log holds
          </span>
        ) : null}
      </div>

      {/* 3 · the debrief */}
      {ended && report ? (
        <>
          <SectionKicker>3 · The debrief · your log, read back, problem by problem</SectionKicker>
          <p style={{ margin: '0 0 10px', fontSize: '14.5px', color: 'var(--ink-2)' }}>
            {foundCount === state.problems.length
              ? `Your ${spent} action${spent === 1 ? '' : 's'} touched all six embedded problems.`
              : `Your ${spent} action${spent === 1 ? '' : 's'} touched ${foundCount} of the six embedded problems.`}{' '}
            No score: read the red sections first, because what a steward never looks at is the part
            of the week that costs the most.
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            {report.sections.map((s) => (
              <DebriefSection key={s.problem} s={s} />
            ))}
          </div>

          {/* 4 · the memo */}
          <SectionKicker>4 · The Monday-morning memo · copyable, carryable</SectionKicker>
          <p style={{ margin: '0 0 8px', fontSize: '14.5px', color: 'var(--ink-2)' }}>
            Assembled from your choices, formatted by the engine, and sanity-checked by it: every !!
            line names a classic error your checkride left in place. This is the one artifact the
            book claims you can carry to work, because it is plain text and the checks are code.
          </p>
          <textarea
            ref={memoRef}
            readOnly
            value={memoText}
            rows={Math.min(memoText.split('\n').length + 1, 40)}
            aria-label="The Monday-morning memo, plain text"
            onFocus={(e) => e.target.select()}
            style={{
              width: '100%',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: 1.55,
              color: 'var(--ink)',
              background: 'var(--paper)',
              border: '1px solid var(--line-soft)',
              borderRadius: 4,
              padding: '10px 12px',
              resize: 'vertical',
            }}
          />
          <div className="mh-controls" role="group" aria-label="Memo controls: copy, restart">
            <button type="button" className="mh-btn mh-btn-primary" onClick={copyMemo}>
              {copied ? 'Copied' : 'Copy the memo'}
            </button>
            <button
              type="button"
              className="mh-btn"
              onClick={restart}
              aria-label="Restart the checkride from the same terrain"
            >
              Fly it again
            </button>
            <span className="mh-kicker">
              same seed, same six problems · a different twelve is a different memo
            </span>
          </div>
        </>
      ) : null}
    </LabFrame>
  );
}
