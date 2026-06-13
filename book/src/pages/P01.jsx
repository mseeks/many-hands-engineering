// P01 — Hello, Loop. The five-stage loop, drawn as a closed circuit.
//
// One activity: a PR token walks the ring signal → action → verification →
// commit/revert → update → back to signal, on Step/Run. The CI light flips
// green or red and the commit-or-revert node forks the token's path; the
// update node accrues ledger dots, the stage that makes the ring close. A
// gated fork deletes the update stanza and draws the amnesia bill as two
// review-cost sparklines (falling vs flat). Engines: loopstep, helloLoop.

import React from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, Mark, FieldSpecimen, ModelNotes, Commit, glassSlice } from '../components/kit.jsx';
import { usePrefersReducedMotion } from '../shared/usePrefersReducedMotion.js';
import { canonicalRun, redRun, amnesiaComparison } from '../engine/scenarios/helloLoop.js';
import { STAGES } from '../engine/loopstep.js';
import loopstepSrc from '../engine/loopstep.js?raw';

const { useEffect, useState, useMemo } = React;

/* ── Recorded runs (module-level: same seed, same trace, forever) ──────── */

const SEED = 1;
const GREEN = canonicalRun(SEED);
const RED = redRun(SEED);
const AMNESIA = amnesiaComparison(SEED);

const CLOSING = AMNESIA.steps[0].data.closing.series.reviewCost; // 51.2 → 30.7
const AMNESIAC = AMNESIA.steps[0].data.amnesiac.series.reviewCost; // flat 51.2
const FINALE = AMNESIA.steps.at(-1).data; // { billMinutes, relitigated, totals }
const PR = GREEN.steps[1].data.pr; // { title, body }

const STAGE_META = {
  signal: { short: 'signal', verb: 'fires', cast: 'var(--c-triage)' },
  action: { short: 'action', verb: 'opens PR', cast: 'var(--c-deppatch)' },
  verification: { short: 'verify', verb: 'CI runs', cast: 'var(--c-docs)' },
  'commit-revert': { short: 'commit / revert', verb: 'lands or rolls back', cast: 'var(--accent)' },
  update: { short: 'update', verb: 'ledger learns', cast: 'var(--c-flaky)' },
};

/* ── Ring geometry: five nodes on a circle, the loop literally closes ──── */

const VB = 360; // square viewBox; SVG scales to fill the activity width
const CX = VB / 2;
const CY = VB / 2 + 6;
const RING_R = 122;
const NODE_R = 33;

// Place node i on the circle, starting at top (signal) going clockwise.
function nodeAt(i) {
  const a = -Math.PI / 2 + (i / STAGES.length) * Math.PI * 2;
  return { x: CX + RING_R * Math.cos(a), y: CY + RING_R * Math.sin(a), a };
}
const NODES = STAGES.map((stage, i) => ({ stage, ...nodeAt(i), ...STAGE_META[stage] }));

// Point on the ring at fractional progress t∈[0,1] around the whole circle.
function ringPoint(t) {
  const a = -Math.PI / 2 + t * Math.PI * 2;
  return { x: CX + RING_R * Math.cos(a), y: CY + RING_R * Math.sin(a) };
}

// Curved connector path between consecutive nodes (slightly bowed inward).
function arcBetween(i, j) {
  const A = nodeAt(i);
  const B = nodeAt(j);
  const mx = (A.x + B.x) / 2;
  const my = (A.y + B.y) / 2;
  const k = 0.82; // pull control point toward center for a gentle curve
  const ctrlX = CX + (mx - CX) * k;
  const ctrlY = CY + (my - CY) * k;
  return `M ${A.x.toFixed(1)} ${A.y.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${B.x.toFixed(1)} ${B.y.toFixed(1)}`;
}

/* ── The token's journey: one revolution = the five stages, in order ───── */
// Token sits AT a node when idx points at that stage; it animates along the
// arc to the next node between steps. Progress is the node fraction.

const N = STAGES.length;
const FRAME_MS = 1150;

function StageNode({ node, active, done, redPath }) {
  const isCommit = node.stage === 'commit-revert';
  const stroke = active ? node.cast : 'var(--line)';
  const fill = active ? node.cast : done ? 'var(--paper-3)' : 'var(--paper)';
  return (
    <g>
      <circle
        cx={node.x}
        cy={node.y}
        r={NODE_R}
        fill={fill}
        stroke={stroke}
        strokeWidth={active ? 2.5 : 1.3}
        style={{ transition: 'fill 280ms ease, stroke 280ms ease, stroke-width 200ms ease' }}
        opacity={active || done ? 1 : 0.78}
      />
      <text
        x={node.x}
        y={node.y - 3}
        textAnchor="middle"
        fontSize="12.5"
        fontWeight="600"
        fill={active ? 'var(--paper)' : 'var(--ink)'}
        fontFamily="var(--font-mono)"
        style={{ transition: 'fill 280ms ease' }}
      >
        {node.short.length > 9 ? node.short.split(' / ')[0] : node.short}
      </text>
      {isCommit ? (
        <text
          x={node.x}
          y={node.y + 11}
          textAnchor="middle"
          fontSize="9"
          fill={active ? 'var(--paper)' : 'var(--ink-faint)'}
          fontFamily="var(--font-mono)"
          style={{ transition: 'fill 280ms ease' }}
        >
          {redPath ? 'revert' : 'commit'}
        </text>
      ) : (
        <text
          x={node.x}
          y={node.y + 12}
          textAnchor="middle"
          fontSize="9"
          fill={active ? 'var(--paper)' : 'var(--ink-faint)'}
          fontFamily="var(--font-mono)"
          style={{ transition: 'fill 280ms ease' }}
        >
          {node.verb}
        </text>
      )}
    </g>
  );
}

function LoopCircuit({ idx, ci, ledger, redResolved }) {
  // The token rides the ring; its fraction is the active node's index.
  const t = idx / N;
  const tok = ringPoint(t);
  const redPath = ci === 'red' && redResolved;

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      role="img"
      aria-label={`The dependency-patch loop as a closed ring of five stages. The token is at the ${STAGES[idx]} stage; CI is ${ci}; ${ledger} clean outcomes have accrued on the ledger.`}
      style={{ width: '100%', maxWidth: 460, height: 'auto', display: 'block', margin: '0 auto' }}
    >
      <defs>
        <marker id="p01-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--line)" />
        </marker>
      </defs>

      {/* connectors, each arrow READ→WRITE direction around the ring */}
      {STAGES.map((_, i) => {
        const j = (i + 1) % N;
        const closing = j === 0; // update → signal: the stanza that closes it
        const traversed = idx > i || (closing && idx === N - 1 && false);
        return (
          <path
            key={`arc-${i}`}
            d={arcBetween(i, j)}
            fill="none"
            stroke={closing ? 'var(--c-flaky)' : 'var(--line)'}
            strokeWidth={closing ? 2 : 1.3}
            strokeDasharray={closing ? '5 4' : undefined}
            markerEnd="url(#p01-arrow)"
            opacity={traversed ? 0.85 : closing ? 0.7 : 0.5}
            style={{ transition: 'opacity 280ms ease' }}
          />
        );
      })}

      {/* the "closes" label on the update→signal arc */}
      <text
        x={CX}
        y={CY + RING_R + 30}
        textAnchor="middle"
        fontSize="9.5"
        fill="var(--c-flaky)"
        fontFamily="var(--font-mono)"
        letterSpacing="0.06em"
      >
        the stanza that closes the loop
      </text>

      {/* the five stage nodes */}
      {NODES.map((node, i) => (
        <StageNode
          key={node.stage}
          node={node}
          active={i === idx}
          done={i < idx}
          redPath={node.stage === 'commit-revert' && redPath}
        />
      ))}

      {/* CI light, anchored beside the verify node */}
      <g transform={`translate(${CX + 70}, ${CY - 96})`}>
        <circle
          r="8"
          fill={ci === 'green' ? 'var(--accent)' : ci === 'red' ? 'var(--red)' : 'var(--ink-faint)'}
          opacity={ci ? 1 : 0.4}
          style={{
            transition: 'fill 280ms ease',
            filter: ci
              ? `drop-shadow(0 0 6px ${ci === 'green' ? 'var(--accent)' : 'var(--red)'})`
              : 'none',
          }}
        />
        <text x="14" y="4" fontSize="10.5" fill="var(--ink-2)" fontFamily="var(--font-mono)">
          CI {ci ?? '—'}
        </text>
      </g>

      {/* ledger dots accruing at the update node — proof the loop closes */}
      <g transform={`translate(${CX - 64}, ${CY - 96})`}>
        <text
          x="0"
          y="4"
          fontSize="10.5"
          fill="var(--ink-2)"
          fontFamily="var(--font-mono)"
          textAnchor="end"
        >
          ledger
        </text>
        {Array.from({ length: 6 }).map((_, k) => (
          <circle
            key={k}
            cx={8 + k * 11}
            cy={0}
            r="3.6"
            fill={k < ledger ? 'var(--c-flaky)' : 'var(--line)'}
            opacity={k < ledger ? 1 : 0.5}
            style={{ transition: 'fill 320ms ease, opacity 320ms ease' }}
          />
        ))}
      </g>

      {/* the PR token, riding the ring */}
      <g
        style={{
          transform: `translate(${tok.x}px, ${tok.y}px)`,
          transition: 'transform 760ms cubic-bezier(0.65,0,0.35,1)',
        }}
      >
        <circle r="9.5" fill="var(--ink)" stroke="var(--paper)" strokeWidth="2.5" />
        <text
          y="3"
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fill="var(--paper)"
          fontFamily="var(--font-mono)"
        >
          PR
        </text>
      </g>
    </svg>
  );
}

/* ── The amnesia bill: two review-cost sparklines, the fork's payoff ───── */

function billSpark(series, w, h, yMax) {
  const n = series.length;
  return series
    .map((v, i) => `${((i / (n - 1)) * w).toFixed(1)},${(h - (v / yMax) * h).toFixed(1)}`)
    .join(' ');
}

function AmnesiaBill() {
  const W = 360;
  const H = 96;
  const yMax = 60;
  const closingPts = billSpark(CLOSING, W, H, yMax);
  const amnesiacPts = billSpark(AMNESIAC, W, H, yMax);
  return (
    <figure style={{ margin: '12px 0 0' }}>
      <svg
        viewBox={`0 0 ${W} ${H + 18}`}
        role="img"
        aria-label={`Two ten-week review-cost lines. With the update stanza intact, weekly steward minutes fall from ${Math.round(CLOSING[0])} to ${Math.round(CLOSING.at(-1))}. Deleted, the line stays flat at ${Math.round(AMNESIAC[0])}. The gap, summed, is ${FINALE.billMinutes} steward minutes — the amnesia bill.`}
        style={{ width: '100%', maxWidth: 460, height: 'auto', display: 'block', margin: '0 auto' }}
      >
        <polygon points={`${amnesiacPts} ${W},${H} 0,${H}`} fill="var(--red)" opacity="0.07" />
        <polygon points={`${closingPts} ${W},${H} 0,${H}`} fill="var(--paper-2)" opacity="0.9" />
        <polyline points={amnesiacPts} fill="none" stroke="var(--red)" strokeWidth="2" />
        <polyline points={closingPts} fill="none" stroke="var(--accent)" strokeWidth="2" />
        <text x="2" y={H + 14} fontSize="9" fill="var(--ink-faint)" fontFamily="var(--font-mono)">
          wk 1
        </text>
        <text
          x={W - 2}
          y={H + 14}
          textAnchor="end"
          fontSize="9"
          fill="var(--ink-faint)"
          fontFamily="var(--font-mono)"
        >
          wk 10
        </text>
        <text
          x={W}
          y={11}
          textAnchor="end"
          fontSize="9.5"
          fill="var(--red)"
          fontFamily="var(--font-mono)"
        >
          update: deleted — flat
        </text>
        <text
          x={W}
          y={H - 4}
          textAnchor="end"
          fontSize="9.5"
          fill="var(--accent-ink)"
          fontFamily="var(--font-mono)"
        >
          closing loop — falls
        </text>
      </svg>
      <figcaption
        style={{
          fontSize: '12.5px',
          color: 'var(--ink-2)',
          margin: '6px 0 0',
          textAlign: 'center',
        }}
      >
        Same loop, twice. The shaded gap is {FINALE.billMinutes} steward minutes in ten weeks: the
        amnesia bill.
      </figcaption>
    </figure>
  );
}

/* ── Fork: commit-before-reveal (constitution: register split) ─────────── */

const FORK_OPTIONS = [
  { id: 'safety', label: 'Defects slip through — update: was a safety gate' },
  { id: 'nothing', label: 'Nothing changes — every weekly run looks the same' },
  { id: 'bill', label: 'The review bill stops falling — week 10 is priced like week 1' },
];

function forkFeedback(id) {
  if (id === 'bill') {
    return (
      <>
        That is what the engine draws. verification and on_red are untouched, so safety holds; what
        broke is memory. Each clean merge nudged the class's track record, and the record set next
        week's review minutes. With <code>update:</code> deleted, the record freezes at week one, so
        the bill freezes too: {Math.round(AMNESIAC[0])} minutes a week against the closing loop's{' '}
        {Math.round(CLOSING.at(-1))} by week ten — {FINALE.billMinutes} extra steward minutes.
      </>
    );
  }
  if (id === 'safety') {
    return (
      <>
        Right instinct, wrong stanza. CI still gates every merge and a red still unwinds clean —
        safety is intact. The steward simply re-argues the same finding {FINALE.relitigated} times
        (is a lockfile-only diff safe to skim?), because last week never landed. The cost is
        attention, not regressions.
      </>
    );
  }
  return (
    <>
      Right premise, watch the conclusion. No single run looks different; the deletion shows up{' '}
      <em>between</em> runs. Outcomes stop landing on the track record, so review minutes never
      fall: {Math.round(AMNESIAC[0])} a week forever, {FINALE.billMinutes} more in ten weeks.
    </>
  );
}

/* ── Glass: the stage machine and one week of it, verbatim ─────────────── */

const GLASS = glassSlice(loopstepSrc, 'export function stepStage', '\n}');

/* ── The page ──────────────────────────────────────────────────────────── */

export default function P01() {
  const reduced = usePrefersReducedMotion();
  const [ci, setCi] = useState('green');
  // Legible at rest: mount on the closing-loop's final frame — update lit,
  // ledger full, the loop visibly closed.
  const [idx, setIdx] = useState(N - 1);
  const [playing, setPlaying] = useState(false);
  const [committed, setCommitted] = useState(null);

  const trace = ci === 'red' ? RED : GREEN;
  const last = N - 1;

  // Ledger accrues only on a clean close, and only once the token has passed
  // the update node. Green: one dot per pass; we cap visually at 6.
  const ledger = useMemo(() => {
    if (ci === 'red') return Math.min(5, idx >= N - 1 ? 5 : idx);
    return idx >= last ? 6 : Math.min(6, idx + 1);
  }, [idx, ci, last]);

  useEffect(() => {
    if (!playing || reduced) return undefined;
    if (idx >= last) {
      setPlaying(false);
      return undefined;
    }
    const tmr = setTimeout(() => setIdx((i) => Math.min(last, i + 1)), FRAME_MS);
    return () => clearTimeout(tmr);
  }, [playing, reduced, idx, last]);

  const step = () => setIdx((i) => (i >= last ? 0 : i + 1));
  const run = () => {
    if (reduced) {
      setIdx(last);
      return;
    }
    if (idx >= last) setIdx(0);
    setPlaying(true);
  };
  const toggleCi = () => {
    setPlaying(false);
    setCi((c) => (c === 'green' ? 'red' : 'green'));
    setIdx(0);
  };

  const stage = STAGES[idx];
  const caption = trace.steps[idx].caption;

  return (
    <Page n={1} claim="A loop is five stages that close.">
      <Activity>
        <LoopCircuit idx={idx} ci={idx >= 2 ? ci : null} ledger={ledger} redResolved={idx >= 3} />

        <p
          className="mono"
          aria-live="polite"
          style={{
            margin: '4px auto 0',
            maxWidth: 520,
            fontSize: '13px',
            lineHeight: 1.5,
            color: 'var(--ink-2)',
            textAlign: 'center',
          }}
        >
          <strong style={{ color: STAGE_META[stage].cast }}>{STAGE_META[stage].short}.</strong>{' '}
          {caption}
        </p>

        <div
          className="mh-controls"
          role="group"
          aria-label="Loop controls: Step, Run, CI toggle"
          style={{ justifyContent: 'center', marginTop: 14 }}
        >
          <button
            type="button"
            className="mh-btn"
            onClick={step}
            disabled={playing}
            aria-label="Advance the token one stage"
          >
            Step
          </button>
          <button
            type="button"
            className="mh-btn mh-btn-primary"
            onClick={run}
            disabled={playing}
            aria-label="Run the token around the whole loop"
          >
            Run
          </button>
          <button
            type="button"
            className="mh-chip"
            aria-pressed={ci === 'red'}
            onClick={toggleCi}
            aria-label={`CI is ${ci}; toggle to ${ci === 'green' ? 'red' : 'green'}`}
          >
            CI: {ci === 'green' ? 'green' : 'red'}
          </button>
          <span className="mh-kicker" aria-live="polite">
            stage {idx + 1} of {N}
          </span>
        </div>

        <div
          className="mh-commit"
          style={{ marginTop: 16 }}
          role="group"
          aria-label="Fork: delete the update stanza"
        >
          {committed === null ? (
            <Commit
              prompt="Fork the loop: delete the update: stanza, the one that writes each outcome back to the terrain. Every weekly run still bumps, tests, and merges as before. Ten weeks out, what has it cost?"
              options={FORK_OPTIONS}
              onReveal={setCommitted}
            >
              {(id) => (
                <>
                  {forkFeedback(id)}
                  <AmnesiaBill />
                </>
              )}
            </Commit>
          ) : (
            <>
              <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
                Fork · update: deleted{' '}
                <span style={{ color: 'var(--amber)' }}>· the author's bet, drawn</span>
              </span>
              <div className="mh-feedback">{forkFeedback(committed)}</div>
              <AmnesiaBill />
            </>
          )}
        </div>

        <ModelNotes
          register="mechanism"
          notes={[
            `The walk is the loopstep engine's real trace on seed ${SEED}: signal → action → verification → commit/revert → update, recorded, not animated by hand.`,
            'Review minutes are priced off one per-class trust scalar (15 min/PR with no record, floored at 4, discounted as it grows). Real stewards weigh more than a number.',
            `Both ten-week runs share seed ${SEED} and four proposals a week, so the only difference between the two curves is the deleted stanza.`,
          ]}
          cannotShow="whether these constants are your constants. The engine draws the shape of the amnesia bill, not its size; nothing here predicts a real repo's review minutes."
          glass={GLASS}
        />
      </Activity>

      <Seen>
        The token only returns to <code>signal</code> because <code>update:</code> wrote the outcome
        back. Delete that one arc and every other stage still runs, but nothing remembers.
      </Seen>

      <Takeaway>
        Five stages, and the fifth is the one that makes it a loop. A walk that does not feed its
        outcome back into the terrain is a script accumulating debt, not a loop.
      </Takeaway>

      <Deeper title="The six ingredients (§3.2)">
        <p style={{ margin: '0 0 10px', fontSize: '14.5px' }}>
          Five stages name the <em>motion</em>; six ingredients name what each loop must{' '}
          <em>have</em>. Drop any one and it is not a loop yet — it is a script looking for a home.
        </p>
        <table className="mh-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>What it is</th>
              <th>What happens without it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Signal</strong>
              </td>
              <td>A trace in the terrain that fires the loop</td>
              <td>Never starts, or fires on the wrong conditions</td>
            </tr>
            <tr>
              <td>
                <strong>Bounded action</strong>
              </td>
              <td>Scoped to a specific class of change</td>
              <td>Scope creep; blast radius exceeds the reasoning</td>
            </tr>
            <tr>
              <td>
                <strong>Verification</strong>
              </td>
              <td>An outside reference: tests, eval, human judgment</td>
              <td>The loop self-approves; drift; Goodhart</td>
            </tr>
            <tr>
              <td>
                <strong>Reversibility</strong>
              </td>
              <td>A cheap, well-understood undo path</td>
              <td>Mistakes ossify; stewards stop trusting it</td>
            </tr>
            <tr>
              <td>
                <strong>Signal update</strong>
              </td>
              <td>Outcome feeds back into the terrain</td>
              <td>The next loop cannot learn from this one</td>
            </tr>
            <tr>
              <td>
                <strong>Authority surface</strong>
              </td>
              <td>Explicit rules for when autonomy expands or contracts</td>
              <td>Trust becomes one global switch; fragility follows</td>
            </tr>
          </tbody>
        </table>
        <p style={{ margin: '10px 0 0', fontSize: '13.5px', color: 'var(--ink-2)' }}>
          The dependency-patch loop has all six. The steward holds veto on the irreversible at stage
          four. <Badge layer="W" note="§3.2 — the handbook's working principle, run" />
        </p>
      </Deeper>

      <Deeper title="A real bump PR">
        <FieldSpecimen source="froot · dependency-patch loop, npm class">
          <pre
            className="mono"
            style={{
              margin: '8px 0 0',
              padding: '12px 14px',
              fontSize: '12.5px',
              lineHeight: 1.55,
              color: 'var(--ink)',
              background: 'var(--paper-3)',
              border: '1px solid var(--line-soft)',
              borderRadius: 6,
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
            }}
          >
            <strong style={{ color: 'var(--c-deppatch)' }}>{PR.title}</strong>
            {'\n\n'}
            {PR.body}
          </pre>
          <p style={{ margin: '10px 0 0', fontSize: '13.5px', color: 'var(--ink-2)' }}>
            One bump, lockfile only, the changelog quoted; the close-on-red rule is the
            reversibility ingredient spelled out in the body. <Mark kind="real" /> The recorded walk
            above is this PR's class, run on seed {SEED}.
          </p>
        </FieldSpecimen>
      </Deeper>
    </Page>
  );
}
