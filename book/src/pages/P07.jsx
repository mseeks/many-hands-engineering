// P07 — Spec rot. The planned death spiral (handbook §2.9 + hybrids).
//
// One activity: a live status board where the only honest line is the one the
// board can draw. Reality drifts; valid assertions decline; WIP climbs; the
// hidden rework piling up behind it is undrawable — a "?" band the board
// refuses to plot until an integration forces it out. Under big-bang cadence
// that integration sits on week 16, so the board reads green for fifteen weeks
// and then takes a cliff. Commit before the reveal; then reshape the structure
// (cadence, executable contracts) and watch the cliff dissolve, while the
// worker-effort slider moves WIP and nothing else — on purpose, per the engine.

import { useMemo, useState } from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, Mark, ModelNotes, glassSlice } from '../components/kit.jsx';
import { runSpecGap } from '../engine/spec.js';
import specSrc from '../engine/spec.js?raw';

const GLASS = glassSlice(specSrc, '// 1 — Reality moves.', 'reveal = 0;');

const SEED = 11;
const SIZE = 24; // assertions in the spec
const WEEKS = 16;
const CADENCES = ['big-bang', 'weekly', 'continuous'];

const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

// The canonical big-bang run, computed once. The cliff is effort-independent
// (pinned by tests/spec.test.js), so its numbers hold at every slider position.
const BASE = runSpecGap({ seed: SEED });
const CLIFF = BASE.cliff; // { week: 16, magnitude: 255 }
const STALE_AT_15 = SIZE - BASE.weeks[14].valid; // 23

/* ── The board ──────────────────────────────────────────────────────────
 * A viewBox-scaled SVG that fills the activity width. Three honest series the
 * board can always draw — valid assertions (area), WIP (climbing line), the
 * surfaced rework (red) — plus one it cannot: the hidden-rework "?" band, drawn
 * only once an integration has forced it into the open. */

function Board({ rows, upto, reveal, cadence, integrationWeek, cliff }) {
  const W = 720;
  const H = 320;
  const padL = 46;
  const padR = 18;
  const padT = 22;
  const padB = 34;
  const shown = rows.slice(0, upto);
  const last = shown.at(-1);

  // Hidden rework only exists when work hid before integration (big-bang); the
  // dashed reconstruction is meaningless to draw otherwise.
  const hasHidden = reveal && shown.some((r) => r.hiddenRework > 0);

  let max = 20;
  for (const r of shown) {
    max = Math.max(max, r.wip, r.visibleRework, r.backlog);
    if (hasHidden) max = Math.max(max, r.hiddenRework);
  }
  const yMax = Math.ceil(max / 40) * 40;

  const x = (wk) => padL + ((wk - 1) / (WEEKS - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - v / yMax) * (H - padT - padB);
  const yA = (v) => padT + (1 - v / SIZE) * (H - padT - padB);

  const line = (key, yfn = y) => shown.map((r) => `${x(r.week)},${yfn(r[key])}`).join(' ');
  const baseY = H - padB;

  // The hidden-rework area, only ever rendered after a reveal.
  const hiddenArea =
    `M ${x(1)},${baseY} ` +
    shown.map((r) => `L ${x(r.week)},${y(r.hiddenRework)}`).join(' ') +
    ` L ${x(last.week)},${baseY} Z`;
  const hiddenPeak = hasHidden
    ? shown.reduce((b, r) => (r.hiddenRework > b.hiddenRework ? r : b), shown[0])
    : null;

  // The valid-assertions area (its own 0..SIZE scale, drawn on the right axis).
  const validArea =
    `M ${x(1)},${baseY} ` +
    shown.map((r) => `L ${x(r.week)},${yA(r.valid)}`).join(' ') +
    ` L ${x(last.week)},${baseY} Z`;

  const showInt = cadence === 'big-bang' && integrationWeek;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Spec-rot status board, week ${last.week} of ${WEEKS}. WIP in flight ${fmt(
        last.wip,
      )}, surfaced rework ${fmt(last.visibleRework)}, valid assertions ${last.valid} of ${SIZE}.${
        reveal ? ` A cliff of ${fmt(CLIFF.magnitude)} assertion-weeks stands revealed.` : ''
      }`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* gridlines */}
      {[0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax].map((v) => (
        <g key={v}>
          <line
            x1={padL}
            x2={W - padR}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--line-soft)"
            strokeWidth="1"
          />
          <text
            x={padL - 7}
            y={y(v) + 3.5}
            textAnchor="end"
            fontSize="10"
            fill="var(--ink-faint)"
            fontFamily="var(--font-mono)"
          >
            {v}
          </text>
        </g>
      ))}
      {[1, 4, 8, 12, 16].map((wk) => (
        <text
          key={wk}
          x={x(wk)}
          y={H - padB + 16}
          textAnchor="middle"
          fontSize="10"
          fill="var(--ink-faint)"
          fontFamily="var(--font-mono)"
        >
          wk {wk}
        </text>
      ))}
      <text
        x={padL - 7}
        y={padT - 9}
        textAnchor="start"
        fontSize="9.5"
        fill="var(--ink-faint)"
        fontFamily="var(--font-mono)"
      >
        assertion-weeks
      </text>

      {/* the scheduled integration, before it fires */}
      {showInt ? (
        <g>
          <line
            x1={x(integrationWeek)}
            x2={x(integrationWeek)}
            y1={padT}
            y2={H - padB}
            stroke="var(--ink-faint)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          <text
            x={x(integrationWeek) - 5}
            y={padT + 2}
            textAnchor="end"
            fontSize="9.5"
            fill="var(--ink-faint)"
            fontFamily="var(--font-mono)"
          >
            the one integration
          </text>
        </g>
      ) : null}

      {/* valid assertions — the spec's contact with reality, decaying */}
      <path d={validArea} fill="var(--accent-soft)" stroke="none" />
      <polyline
        points={line('valid', yA)}
        fill="none"
        stroke="var(--accent-ink)"
        strokeWidth="2"
        style={{ transition: 'all 0.3s' }}
      />

      {/* the hidden-rework band, reconstructed once a reveal forces it out */}
      {hasHidden ? (
        <g style={{ transition: 'opacity 0.4s' }}>
          <path d={hiddenArea} fill="var(--c-disturb)" fillOpacity="0.16" stroke="none" />
          <polyline
            points={line('hiddenRework')}
            fill="none"
            stroke="var(--c-disturb)"
            strokeWidth="1.6"
            strokeDasharray="6 4"
            opacity="0.85"
          />
          {hiddenPeak ? (
            <text
              x={x(Math.max(1, hiddenPeak.week - 7))}
              y={y(hiddenPeak.hiddenRework / 2)}
              textAnchor="middle"
              fontSize="10"
              fill="var(--c-disturb)"
              fontFamily="var(--font-mono)"
            >
              hidden rework · reconstructed
            </text>
          ) : null}
        </g>
      ) : null}

      {/* before the reveal under big-bang: the "?" the board cannot resolve */}
      {!reveal ? (
        <g>
          <rect
            x={padL + 4}
            y={padT + 6}
            width={W - padL - padR - 8}
            height={(H - padT - padB) * 0.46}
            fill="var(--c-disturb)"
            fillOpacity="0.05"
            stroke="var(--c-disturb)"
            strokeOpacity="0.3"
            strokeWidth="1"
            strokeDasharray="2 5"
            rx="6"
          />
          <text
            x={(padL + W - padR) / 2}
            y={padT + (H - padT - padB) * 0.27}
            textAnchor="middle"
            fontSize="42"
            fill="var(--c-disturb)"
            fillOpacity="0.34"
            fontFamily="var(--font-mono)"
            fontWeight="700"
          >
            ?
          </text>
          <text
            x={(padL + W - padR) / 2}
            y={padT + (H - padT - padB) * 0.27 + 22}
            textAnchor="middle"
            fontSize="10.5"
            fill="var(--c-disturb)"
            fillOpacity="0.7"
            fontFamily="var(--font-mono)"
          >
            hidden rework — the board cannot plot it
          </text>
        </g>
      ) : null}

      {/* surfaced rework: zero until something integrates */}
      <polyline
        points={line('visibleRework')}
        fill="none"
        stroke="var(--red)"
        strokeWidth="2.4"
        style={{ transition: 'all 0.3s' }}
      />
      {/* WIP in flight, always plottable, always climbing */}
      <polyline
        points={line('wip')}
        fill="none"
        stroke="var(--blue)"
        strokeWidth="2"
        style={{ transition: 'all 0.3s' }}
      />

      {/* end-of-series dots */}
      <circle cx={x(last.week)} cy={y(last.wip)} r="3.2" fill="var(--blue)" />
      <circle cx={x(last.week)} cy={y(last.visibleRework)} r="3.2" fill="var(--red)" />

      {/* the cliff: a single integration whose reveal dominates the chart */}
      {reveal && cliff && upto >= cliff.week ? (
        <g>
          <circle
            cx={x(cliff.week)}
            cy={y(rows[cliff.week - 1].visibleRework)}
            r="6"
            fill="none"
            stroke="var(--red)"
            strokeWidth="2"
          />
          <text
            x={x(cliff.week) - 10}
            y={y(rows[cliff.week - 1].visibleRework) + 16}
            textAnchor="end"
            fontSize="11"
            fontWeight="700"
            fill="var(--red)"
            fontFamily="var(--font-mono)"
          >
            +{fmt(cliff.magnitude)} in one reveal
          </text>
        </g>
      ) : null}
    </svg>
  );
}

function Legend({ hasHidden }) {
  const item = (color, label, dashed) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        aria-hidden="true"
        style={{ width: 18, borderTop: `3px ${dashed ? 'dashed' : 'solid'} ${color}` }}
      />
      <span>{label}</span>
    </span>
  );
  return (
    <div
      className="mono"
      style={{
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        fontSize: 11,
        color: 'var(--ink-2)',
        margin: '4px 0 0',
      }}
    >
      {item('var(--accent-ink)', 'valid assertions')}
      {item('var(--blue)', 'WIP in flight')}
      {item('var(--red)', 'rework surfaced')}
      {hasHidden ? item('var(--c-disturb)', 'hidden rework · reconstructed', true) : null}
    </div>
  );
}

/* ── Commit (the reveal gate) ──────────────────────────────────────────── */

const OPTIONS = [
  { id: 'green', label: 'Close to nothing — fifteen green weeks' },
  { id: 'drift', label: `About what drifted — ~${STALE_AT_15} assertion-weeks` },
  { id: 'cliff', label: 'More rework than the whole spec is big' },
  { id: 'board', label: 'This board cannot say' },
];

const FEEDBACK = {
  green:
    'Green was measured silence, not health. Big-bang cadence puts the one integration ' +
    'on week 16, so "rework surfaced: 0" was guaranteed the day the schedule was drawn.',
  drift:
    'Right mechanism, one multiplier short. A stale assertion is not paid for once: ' +
    'hidden, it corrupts every following week until an integration reveals it.',
  cliff:
    'The engine agrees. Detection latency multiplied the drift roughly tenfold — each ' +
    'hidden assertion corrupted every week built on it, the earliest for sixteen weeks.',
  board:
    'The sharpest read. The board draws only what surfaced, and nothing surfaces before ' +
    'week 16, so the number that mattered was undrawable here by design.',
};

/* ── The page ──────────────────────────────────────────────────────────── */

export default function P07() {
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [cadence, setCadence] = useState('big-bang');
  const [contracts, setContracts] = useState(false);
  const [effort, setEffort] = useState(1);

  const run = useMemo(
    () => runSpecGap({ seed: SEED, cadence, contracts, effort }),
    [cadence, contracts, effort],
  );

  // The board hides hidden rework until a reveal. Under non-big-bang cadence (or
  // contracts), rework surfaces along the way, so there is no single cliff and
  // no "?" to hold back — the reveal is implied.
  const isBigBang = cadence === 'big-bang' && !contracts;
  const reveal = revealed || !isBigBang;
  const upto = isBigBang && !revealed ? WEEKS - 1 : WEEKS;
  const hasHidden = reveal && run.weeks.slice(0, upto).some((r) => r.hiddenRework > 0);

  const final = run.weeks[upto - 1];
  const surfaced = run.weeks[WEEKS - 1].visibleRework;
  const maxBacklog = Math.max(...run.weeks.map((r) => r.backlog));

  const choose = (id) => {
    if (picked === null) setPicked(id);
  };
  const runIntegration = () => setRevealed(true);

  // Reshaping the structure resets the gate so the reader re-reads the board.
  const setStructure = (fn) => {
    fn();
    setRevealed(false);
    setPicked(null);
  };

  const verdict = run.cliff
    ? `Cliff: ${fmt(run.cliff.magnitude)} assertion-weeks surface in one reveal at week ${
        run.cliff.week
      } — over ten times the spec's size. Effort moved the WIP line and never touched this.`
    : contracts
      ? `No cliff. Executable contracts fail the week work touches a stale assertion, so ${fmt(
          surfaced,
        )} assertion-weeks surfaced in redoable pieces (max backlog ${fmt(maxBacklog)}) instead of one batch.`
      : `No cliff. ${cadence} integration caps how long each stale assertion hides, so ${fmt(
          surfaced,
        )} assertion-weeks surfaced in small pieces (max backlog ${fmt(maxBacklog)}).`;

  const gated = isBigBang && !revealed;

  return (
    <Page
      n={7}
      claim="When reality changes faster than the spec, the cliff is invisible until integration."
    >
      <Activity wide>
        <Legend hasHidden={hasHidden} />
        <Board
          rows={run.weeks}
          upto={upto}
          reveal={reveal}
          cadence={cadence}
          integrationWeek={WEEKS}
          cliff={run.cliff}
        />

        <div className="mh-readout" role="group" aria-label="Board readouts" aria-live="polite">
          <div className="mh-stat">
            <span className="k">Week</span>
            <span className="v">
              {upto} / {WEEKS}
            </span>
          </div>
          <div className="mh-stat">
            <span className="k">WIP in flight</span>
            <span className="v">{fmt(final.wip)}</span>
          </div>
          <div className="mh-stat">
            <span className="k">Rework surfaced</span>
            <span className={final.visibleRework === 0 ? 'v good' : 'v bad'}>
              {fmt(final.visibleRework)}
            </span>
          </div>
          <div className="mh-stat">
            <span className="k">Valid assertions</span>
            <span className={final.valid >= 12 ? 'v warn' : 'v bad'}>
              {final.valid} / {SIZE}
            </span>
          </div>
          <div className="mh-stat">
            <span className="k">Cliff</span>
            {reveal ? (
              <span className={run.cliff ? 'v bad' : 'v good'}>
                {run.cliff ? `wk ${run.cliff.week} · ${fmt(run.cliff.magnitude)}` : 'none'}
              </span>
            ) : (
              <span className="v" style={{ color: 'var(--ink-faint)' }}>
                ?
              </span>
            )}
          </div>
        </div>

        {/* The reveal gate — commit-before-reveal, only under big-bang cadence */}
        {isBigBang ? (
          <div className="mh-commit" data-testid="reveal-gate">
            <span className="mh-kicker">Predict first</span>
            <p style={{ margin: '0 0 10px' }}>
              Week 15: {fmt(run.weeks[WEEKS - 2].wip)} assertion-weeks in flight, zero rework
              surfaced. The one integration runs next week. What surfaces?
            </p>
            <div className="mh-chipset" role="group" aria-label="Predict the reveal">
              {OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="mh-chip"
                  aria-pressed={picked === o.id}
                  disabled={picked !== null && picked !== o.id}
                  onClick={() => choose(o.id)}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {picked !== null ? (
              <div className="mh-feedback" data-testid="feedback">
                <p style={{ margin: '0 0 10px' }}>{FEEDBACK[picked]}</p>
                <button
                  type="button"
                  className="mh-btn mh-btn-danger"
                  onClick={runIntegration}
                  disabled={revealed}
                  data-testid="run-integration"
                  aria-label="Run the single integration, week 16"
                >
                  {revealed ? 'integration ran — week 16' : 'Run the integration — week 16'}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Structure: the knobs that reach the cliff, and the one that doesn't */}
        <div
          className="mh-controls"
          style={{ alignItems: 'flex-end', marginTop: 16 }}
          role="group"
          aria-label="Structure"
        >
          <div role="group" aria-label="Integration cadence">
            <span className="mh-kicker" style={{ display: 'block', marginBottom: 4 }}>
              integration cadence
            </span>
            <div className="mh-chipset">
              {CADENCES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="mh-chip"
                  aria-pressed={cadence === c}
                  data-testid={`cadence-${c}`}
                  onClick={() => setStructure(() => setCadence(c))}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mh-kicker" style={{ display: 'block', marginBottom: 4 }}>
              spec form
            </span>
            <button
              type="button"
              className="mh-chip"
              aria-pressed={contracts}
              data-testid="contracts"
              onClick={() => setStructure(() => setContracts((v) => !v))}
            >
              {contracts ? 'executable — fails on first touch' : 'prose — fails at integration'}
            </button>
          </div>
          <div className="mh-slider" style={{ width: 168 }}>
            <label htmlFor="p07-effort">
              <span>worker effort</span>
              <span className="mono">×{effort}</span>
            </label>
            <input
              id="p07-effort"
              type="range"
              min="1"
              max="5"
              value={effort}
              data-testid="effort"
              onChange={(e) => setEffort(Number(e.target.value))}
              aria-valuetext={`worker effort times ${effort}`}
            />
          </div>
        </div>

        <div className="mh-feedback" aria-live="polite" data-testid="verdict">
          {gated
            ? 'Big-bang, prose spec: the board reads green. Predict the reveal above, then watch the y-axis.'
            : verdict}
          {effort > 1 ? (
            <span style={{ display: 'block', marginTop: 6, color: 'var(--ink-faint)' }}>
              effort ×{effort}: WIP climbs and the backlog burns faster. The cliff is a product of
              detection latency, and effort cannot reach it.
            </span>
          ) : null}
        </div>

        <ModelNotes
          register="mechanism"
          notes={[
            'The rng feeds only the drift stream, so every configuration faces the same reality at the same seed (11): the same assertions go stale in the same weeks.',
            'Reality drifts ≈3 assertions a week against a revision budget of 1; the team builds 4 assertion-weeks of work a week and redoes 3 of visible backlog. Effort multiplies build and burn-down, and only those.',
            'That heroics cannot reveal hidden rework or slow drift is a modeling choice (Ⓦ), not a finding. The cliff threshold — one reveal ≥ half the spec — marks "one event dominates the chart," not a real constant.',
          ]}
          cannotShow="Which of your own spec's assertions is stale right now. Detection is the whole problem; the model grants itself a narrator's view of the dashed line that it denies the board. At work, nobody holds that line."
          glass={GLASS}
        />
      </Activity>

      <Seen>
        Fifteen green weeks, then one integration surfaces {fmt(CLIFF.magnitude)} assertion-weeks
        against a {SIZE}-assertion spec. The board was honest the whole time; it simply could not
        draw the gap that was forming behind it.
      </Seen>

      <Takeaway>
        The planned death spiral is one inequality — the spec updating slower than reality changes —
        and every remedy that works edits the structure, not the people.
      </Takeaway>

      <Deeper title="Hybrid failures, and the honest test">
        <p>
          The cliff is the pure planned failure. The more dangerous ones are hybrids: a system with
          the <em>form</em> of one mode and the <em>substance</em> of the other.
        </p>
        <table className="mh-table">
          <thead>
            <tr>
              <th>Hybrid</th>
              <th>Claims</th>
              <th>Decisions are actually made</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Governance theatre</td>
              <td>heavily specified, planned</td>
              <td>nobody enforces the spec — emergent in substance</td>
            </tr>
            <tr>
              <td>Ossified custom</td>
              <td>lightweight, emergent</td>
              <td>informal norms are now uneditable — planned in substance</td>
            </tr>
            <tr>
              <td>Ivory-tower architecture</td>
              <td>the design governs</td>
              <td>the design is decoration; the code decides</td>
            </tr>
          </tbody>
        </table>
        <p>
          <strong>The honest test:</strong> not what mode a system claims, but what mode its actual
          decisions are made in. Read the decision logs, not the spec header.
        </p>
        <p style={{ margin: '12px 0 6px', fontWeight: 600 }}>
          The pattern, in the record <Mark kind="real" note="documented major failures" />
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
          }}
        >
          {[
            [
              'Denver airport baggage',
              'Requirements churned during build; the spec never caught up; integration revealed the gap at once.',
            ],
            [
              'NHS NPfIT',
              'A national spec planned fully up front in a domain where full planning was impossible.',
            ],
            [
              'Healthcare.gov (original)',
              'Implementation proceeded against an increasingly wrong spec; the cliff arrived at launch.',
            ],
          ].map(([title, body]) => (
            <div
              key={title}
              style={{
                border: '1px solid var(--line-soft)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: '13px',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
              <div style={{ color: 'var(--ink-2)' }}>{body}</div>
            </div>
          ))}
        </div>
        <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--ink-faint)' }}>
          Remedies, all structural <Badge layer="W" />: shorten the integration cycle; turn the spec
          from document into executable contract; decentralize what needs no central authority;
          distribute approval by domain. Covers §2.9 planned spiral and hybrid failures.
        </p>
      </Deeper>
    </Page>
  );
}
