// P15 · Trust — claim: trust belongs to a class in an environment; change the
// environment and it resets, with zero failures on the ledger.
//
// The activity IS the page: a drawn trust ledger. Five task-class lanes, each a
// timeline of merged-outcome chips stamped with the environment they were
// earned in (the judge model). On the right of every lane, a gate node reads
// AUTO-MERGE or PROPOSE-ONLY, re-derived live from trust.evaluateGate — never a
// stored flag. The reader commits a prediction, fires the model swap, and
// watches every earned grant drop to propose-only with not one revert on the
// ledger; then three event chips (widen / idle / revert) each play their own
// distinct reset. Every gate state and stamp is trust.js output on a fixed
// build; nothing here decides trust but the engine.

import React from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, Commit, ModelNotes, glassSlice } from '../components/kit.jsx';
import {
  makeTrustState,
  addOutcome,
  evaluateGate,
  applyEvent,
  ledgerClasses,
} from '../engine/trust.js';
import trustSrc from '../engine/trust.js?raw';

const { useMemo, useState } = React;

/* ── The five class lanes (cast colors), built into the starting ledger ──── */
//
// Each class is a real task class from the handbook's authority surface. The
// build sequence below produces the at-rest ledger: deps and docs have a clean
// earned record under judge-v1; schema and security sit just short of the bar;
// backfill is idle-prone. Every chip the scene draws is one addOutcome row.

const CLASSES = [
  { id: 'deps', name: 'patch bumps', color: 'var(--c-deppatch)' },
  { id: 'docs', name: 'doc refresh', color: 'var(--c-docs)' },
  { id: 'security', name: 'auth surfaces', color: 'var(--c-security)' },
  { id: 'schema', name: 'schema changes', color: 'var(--c-backfill)' },
  { id: 'flaky', name: 'flaky-test quarantine', color: 'var(--c-flaky)' },
];

// Per-class outcome script: 'm' merged, 'c' closed. The two trusted classes
// clear the 5/95% bar cleanly; the rest fall short on count, so the swap's
// reset is read against a backdrop of grants that were and weren't there.
const SCRIPT = {
  deps: 'mmmmmmmm',
  docs: 'mmmmmm',
  security: 'mmc',
  schema: 'mmcm',
  flaky: 'mm',
};

/** Build the at-rest ledger: every class earns its record under judge-v1. */
function buildLedger() {
  let s = makeTrustState();
  // Open the permission surface so every class can be recorded under one env.
  for (const perm of ['docs', 'security', 'schema', 'flaky']) {
    s = applyEvent(s, { type: 'permission-widen', perm });
  }
  for (const { id } of CLASSES) {
    for (const ch of SCRIPT[id]) {
      s = addOutcome(s, { cls: id, outcome: ch === 'm' ? 'merged' : 'closed' });
    }
  }
  return s;
}

const BASE = buildLedger();

/* ── The drawn ledger scene ─────────────────────────────────────────────── */
//
// viewBox-scaled SVG. One lane per class: a name plate, a stamp band painted in
// the lane color (the environment the record was earned in), a row of outcome
// chips accruing left→right, and a gate node on the right whose fill and label
// come straight from evaluateGate. State changes transition via CSS on fill,
// stroke, and opacity; nothing re-mounts, so the reset reads as motion.

const VW = 640;
const LANE_H = 56;
const TOP = 30;
const NAME_X = 14;
const CHIP_X0 = 158;
const CHIP_W = 17;
const CHIP_GAP = 4;
const GATE_X = 524;
const GATE_W = 104;

const gateColor = (earned) => (earned ? 'var(--accent)' : 'var(--amber)');

function GateNode({ y, gate }) {
  const col = gateColor(gate.earned);
  const label = gate.earned ? 'AUTO-MERGE' : 'PROPOSE-ONLY';
  return (
    <g style={{ transition: 'all 0.5s ease' }}>
      <rect
        x={GATE_X}
        y={y + 8}
        width={GATE_W}
        height={34}
        rx={6}
        fill={gate.earned ? 'var(--accent-soft)' : 'var(--amber-soft)'}
        stroke={col}
        strokeWidth={1.6}
        style={{ transition: 'fill 0.5s ease, stroke 0.5s ease' }}
      />
      <text
        x={GATE_X + GATE_W / 2}
        y={y + 22}
        textAnchor="middle"
        fontSize={9}
        fontWeight={700}
        fontFamily="var(--font-mono)"
        fill={col}
        style={{ transition: 'fill 0.5s ease' }}
      >
        {label}
      </text>
      <text
        x={GATE_X + GATE_W / 2}
        y={y + 35}
        textAnchor="middle"
        fontSize={7.5}
        fontFamily="var(--font-mono)"
        fill="var(--ink-faint)"
      >
        {gate.firstBlocker ? gate.firstBlocker.replace(/^(\w+):.*/, '$1').slice(0, 16) : 'earned'}
      </text>
    </g>
  );
}

function Lane({ klass, rows, gate, y, stampLabel }) {
  const chips = rows.map((r, i) => ({ ...r, i }));
  return (
    <g>
      {/* lane rule */}
      <line
        x1={NAME_X}
        y1={y + LANE_H - 4}
        x2={VW - 12}
        y2={y + LANE_H - 4}
        stroke="var(--line-soft)"
        strokeWidth={1}
      />
      {/* class name plate */}
      <rect x={NAME_X} y={y + 10} width={5} height={30} rx={2} fill={klass.color} />
      <text x={NAME_X + 13} y={y + 24} fontSize={12} fontWeight={700} fill="var(--ink)">
        {klass.name}
      </text>
      <text
        x={NAME_X + 13}
        y={y + 37}
        fontSize={8.5}
        fontFamily="var(--font-mono)"
        fill={klass.color}
        style={{ transition: 'fill 0.5s ease' }}
      >
        {stampLabel}
      </text>

      {/* outcome chips accruing left→right; merged = filled, closed = hollow */}
      {chips.map((c) => {
        const cx = CHIP_X0 + c.i * (CHIP_W + CHIP_GAP);
        const merged = c.outcome === 'merged';
        const reverted = c.outcome === 'reverted';
        const stale = !c.live;
        const fill = reverted
          ? 'var(--red)'
          : merged
            ? stale
              ? 'var(--line-soft)'
              : klass.color
            : 'var(--paper-2)';
        return (
          <g key={c.i} style={{ transition: 'opacity 0.5s ease' }}>
            <rect
              x={cx}
              y={y + 12}
              width={CHIP_W}
              height={26}
              rx={3}
              fill={fill}
              stroke={reverted ? 'var(--red)' : stale ? 'var(--line-soft)' : klass.color}
              strokeWidth={1.3}
              opacity={stale && !reverted ? 0.45 : 1}
              style={{ transition: 'fill 0.5s ease, stroke 0.5s ease, opacity 0.5s ease' }}
            />
            {reverted ? (
              <text
                x={cx + CHIP_W / 2}
                y={y + 30}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fill="var(--paper)"
              >
                ✕
              </text>
            ) : null}
          </g>
        );
      })}

      <GateNode y={y} gate={gate} />
    </g>
  );
}

function LedgerScene({ state, properties }) {
  const lanes = CLASSES.map((klass) => {
    const rows = state.rows
      .filter((r) => r.cls === klass.id)
      .map((r) => ({
        outcome: r.outcome,
        // A chip is "live" when its stamped env still describes the current one.
        live:
          r.env.model === state.env.model &&
          r.env.repoShape === state.env.repoShape &&
          r.env.perms.every((p) => state.env.perms.includes(p)),
      }));
    const gate = evaluateGate(state, klass.id, {}, properties);
    return { klass, rows, gate };
  });

  const earnedCount = lanes.filter((l) => l.gate.earned).length;
  const env = state.env;
  const H = TOP + CLASSES.length * LANE_H + 14;

  return (
    <svg
      viewBox={`0 0 ${VW} ${H}`}
      role="img"
      aria-label={
        `Trust ledger. Environment: judge model ${env.model}, repo ${env.repoShape}, ` +
        `week ${state.week}. ${CLASSES.length} task-class lanes; ${earnedCount} hold ` +
        `auto-merge, the rest are propose-only. Each lane's gate state is re-derived from ` +
        `the ledger, not stored.`
      }
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }}
    >
      <rect x={0} y={0} width={VW} height={H} fill="var(--paper-3)" rx={8} />

      {/* header band: the current environment stamp every gate is read against */}
      <text x={NAME_X} y={18} fontSize={10} fontWeight={700} fill="var(--ink-2)">
        TRUST LEDGER
      </text>
      <text x={CHIP_X0} y={18} fontSize={9} fontFamily="var(--font-mono)" fill="var(--ink-faint)">
        env: {env.model} · repo {env.repoShape} · week {state.week}
      </text>
      <text
        x={GATE_X + GATE_W / 2}
        y={18}
        textAnchor="middle"
        fontSize={8.5}
        fontWeight={600}
        fontFamily="var(--font-mono)"
        fill="var(--ink-faint)"
      >
        GATE
      </text>

      {CLASSES.map((klass, k) => {
        const lane = lanes[k];
        const stamp = lane.rows.some((r) => r.live)
          ? `earned under ${env.model}`
          : (lane.gate.firstBlocker ?? 'no record');
        return (
          <Lane
            key={klass.id}
            klass={klass}
            rows={lane.rows}
            gate={lane.gate}
            y={TOP + k * LANE_H}
            stampLabel={stamp.length > 34 ? stamp.slice(0, 34) + '…' : stamp}
          />
        );
      })}
    </svg>
  );
}

/* ── Commit: the swap, and what it does to earned auto-merge ─────────────── */

const PREDICT = [
  { id: 'nothing', label: 'nothing — the track record is the track record' },
  { id: 'drop', label: 'every earned class drops to propose-only' },
  { id: 'fail', label: 'it flags a failure and revokes on evidence' },
];

const VERDICT = {
  nothing:
    'No. The record was earned under judge-v1; judge-v2 has never produced one of these ' +
    'merges. The stamp no longer matches the environment, so the gate stops counting it.',
  drop:
    'Yes. Re-derive each gate against the new environment and every earned grant falls to ' +
    'propose-only at once — and look at the ledger: not one revert. The trust reset because ' +
    'its environment moved, not because anything failed.',
  fail:
    'No failure fired. Every outcome on the ledger is still a clean merge. The reset is not ' +
    'a revocation on evidence; it is the record going silent because the environment it was ' +
    'anchored to is gone.',
};

/* ── Events after the swap, each with its own distinct visible reset ─────── */

const EVENTS = [
  {
    id: 'permission-widen',
    label: 'widen permissions',
    arg: { type: 'permission-widen', perm: 'infra' },
    note: 'A new surface (infra) opens. Old grants are unaffected — the new surface simply has no record yet, so it starts at propose-only. Authority is granted per surface, not in bulk.',
  },
  {
    id: 'idle',
    label: 'idle 90 days',
    arg: { type: 'idle', weeks: 13 },
    note: 'A full window passes with no fresh outcomes. Records age out of the window and the rate goes to zero decided — trust expires when it is not renewed by recent track record.',
  },
  {
    id: 'revert',
    label: 'one revert (patch bumps)',
    arg: { type: 'revert', cls: 'deps' },
    note: 'A single merged change comes back out. Revocation is instant and falls straight out of the gate — no averaging it away across a long clean record. One revert, the grant is gone.',
  },
];

/* ── The glass (constitution: glass law) ────────────────────────────────── */

const GLASS = [
  glassSlice(trustSrc, 'export function evaluateGate', '\n}'),
  glassSlice(trustSrc, 'export function applyEvent', '\n}'),
].join('\n\n// ── and ──\n\n');

const NOTES = [
  'Trust is never a stored flag. Every gate is re-derived from the ledger at the moment it is ' +
    'asked, so when the environment moves, grants move with it. The five properties are five ' +
    'checks inside evaluateGate, each one disableable for a counterfactual.',
  'The model swap rewrites nothing: old rows keep their judge-v1 stamps; only the current ' +
    'environment advances. The gate then re-reads the same rows against a stamp they no longer ' +
    'match — which is why the reset carries zero reverts.',
  'The lane scripts and the starting permission surface are constructed for teaching: a clean ' +
    'two-class auto-merge backdrop so the swap has something to knock down. The mechanism — ' +
    're-derivation, env stamps, instant revocation — is the engine, verbatim in the glass.',
];

const CANNOT_SHOW =
  "where your team should set the bar, the window, or what counts as 'the environment changed.' " +
  'The engine draws the shape — trust that resets on a stamp mismatch, not a failure — but the ' +
  'merge rate, the window length, and which model swaps count as a reset are policy your fleet ' +
  'writes, not numbers this ledger can hand you.';

/* ── The page ───────────────────────────────────────────────────────────── */

export default function P15() {
  const [state, setState] = useState(BASE);
  const [predicted, setPredicted] = useState(null);
  const [fired, setFired] = useState([]); // event ids applied, in order

  // The five properties stay fully on for the page's main line; the
  // counterfactual lives in the fold's prose, not in a control here.
  const properties = useMemo(() => ({}), []);

  const earnedNow = useMemo(
    () => ledgerClasses(state).filter((cls) => evaluateGate(state, cls).earned).length,
    [state],
  );

  const swap = () => {
    setState((s) => applyEvent(s, { type: 'model-swap', model: 'judge-v2' }));
  };

  const apply = (ev) => {
    setState((s) => applyEvent(s, ev.arg));
    setFired((f) => (f.includes(ev.id) ? f : [...f, ev.id]));
  };

  const swapped = state.env.model !== BASE.env.model;

  return (
    <Page
      n={15}
      claim="Trust belongs to a task class in a specific environment — change the environment and some of it resets, with zero failures."
    >
      <Activity wide>
        <LedgerScene state={state} properties={properties} />

        <p
          className="mono"
          aria-live="polite"
          style={{
            fontSize: '11.5px',
            color: 'var(--ink-faint)',
            margin: '6px 0 12px',
            textAlign: 'center',
          }}
        >
          {swapped
            ? `judge-v2 in place · ${earnedNow} of ${CLASSES.length} classes hold auto-merge`
            : `judge-v1 · ${earnedNow} of ${CLASSES.length} classes hold auto-merge`}
        </p>

        {predicted === null ? (
          <Commit
            prompt="The judge model upgrades to a better one. What happens to the auto-merge that patch bumps and doc refresh have earned?"
            options={PREDICT}
            onReveal={() => {}}
          >
            {(picked) => (
              <>
                <p style={{ margin: '0 0 10px' }}>{VERDICT[picked]}</p>
                <button
                  type="button"
                  className="mh-btn mh-btn-primary"
                  onClick={() => {
                    setPredicted(picked);
                    swap();
                  }}
                >
                  Fire the model swap
                </button>
              </>
            )}
          </Commit>
        ) : (
          <>
            <div className="mh-feedback">
              <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
                you predicted · {PREDICT.find((o) => o.id === predicted)?.label}
              </span>
              <p style={{ margin: 0 }}>{VERDICT[predicted]}</p>
            </div>

            <div
              className="mh-controls"
              role="group"
              aria-label="Three more environment events, each with its own reset"
            >
              <span className="mh-kicker">Now push the environment further</span>
              {EVENTS.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  className="mh-chip"
                  onClick={() => apply(ev)}
                  disabled={fired.includes(ev.id)}
                  aria-pressed={fired.includes(ev.id)}
                >
                  {ev.label}
                </button>
              ))}
            </div>

            {fired.length ? (
              <ul
                style={{
                  margin: '8px 0 0',
                  paddingLeft: 18,
                  fontSize: '13.5px',
                  color: 'var(--ink-2)',
                }}
              >
                {fired.map((id) => {
                  const ev = EVENTS.find((e) => e.id === id);
                  return (
                    <li key={id} style={{ margin: '4px 0' }}>
                      <strong>{ev.label}.</strong> {ev.note}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </>
        )}

        <ModelNotes register="mechanism" notes={NOTES} cannotShow={CANNOT_SHOW} glass={GLASS} />
      </Activity>

      <Seen>
        Nobody detected a fault; the upgrade simply moved the environment out from under every
        stamped record, and the gates re-read empty. The grants come back only as the new judge
        earns its own track record.
      </Seen>

      <Takeaway>
        Trust is <strong>earned, narrow, conditional, revocable, and expiring</strong>. It is
        anchored to a task class in an environment — move the environment and the anchor lets go, no
        failure required.
      </Takeaway>

      <Deeper title="Five properties, as mechanisms (§3.7)">
        <p style={{ margin: '0 0 8px' }}>
          Earned autonomy has five properties. Each is a check inside the gate; drop any one and the
          system is eventually surprised in a characteristic way. <Badge layer="W" />
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--ink-faint)' }}>
              <th style={{ padding: '4px 8px 4px 0' }}>Property</th>
              <th style={{ padding: '4px 8px' }}>Mechanism in the ledger</th>
              <th style={{ padding: '4px 8px' }}>Surprise if dropped</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                'Earned',
                'Track record on this class, not fiat — 5 decided at a 95% bar.',
                'Trust by vendor claim; no evidence under it.',
              ],
              [
                'Narrow',
                'Only this class’s rows count toward this class’s gate.',
                'Schema changes ride the deps record — boundary erosion.',
              ],
              [
                'Conditional',
                'Only rows whose env-stamp matches the current one count.',
                'A judge-v1 record vouches for judge-v2; silent drift.',
              ],
              [
                'Revocable',
                'One revert past tolerance fails the gate, no averaging.',
                'A fresh fault buried under a long clean rate.',
              ],
              [
                'Expiring',
                'Only rows inside the window count; idle records age out.',
                'A grant idle for months never sags from disuse.',
              ],
            ].map((row) => (
              <tr key={row[0]} style={{ borderTop: '1px solid var(--line-soft)' }}>
                <td style={{ padding: '6px 8px 6px 0', fontWeight: 700, color: 'var(--ink)' }}>
                  {row[0]}
                </td>
                <td style={{ padding: '6px 8px', color: 'var(--ink-2)' }}>{row[1]}</td>
                <td style={{ padding: '6px 8px', color: 'var(--red)' }}>{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ margin: '12px 0 0', fontSize: '13.5px' }}>
          Each surprise is countered by the same move: triangulate the trust signal. Track record
          alone can lie; track record plus sampled deep review plus adversarial probing plus
          post-merge defect rate cannot all lie at once.
        </p>
      </Deeper>

      <Deeper title="Read is not write is not deploy (the authority ladder)">
        <p style={{ margin: '0 0 8px' }}>
          The right to read is not the right to write, and the right to write is not the right to
          deploy. Each is a separate grant, evaluated separately; the blast radius of a wrong action
          depends on which one is engaged. <Badge layer="W" />
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <tbody>
            {[
              ['Read', 'what an agent can see', 'Wide by default — agents need context.'],
              ['Write', 'what it can propose', 'Narrow; expanded class by class.'],
              ['Commit', 'what it merges without a human', 'None by default; earned per class.'],
              ['Deploy', 'what it can run in production', 'Never autonomous on the irreversible.'],
              [
                'External',
                'what it can do to the world (API cost, emails, trades)',
                'Treated as deploy: explicit human grant only.',
              ],
            ].map((row) => (
              <tr key={row[0]} style={{ borderTop: '1px solid var(--line-soft)' }}>
                <td
                  style={{
                    padding: '6px 10px 6px 0',
                    fontWeight: 700,
                    color: 'var(--accent-ink)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row[0]}
                </td>
                <td style={{ padding: '6px 8px', color: 'var(--ink-2)' }}>{row[1]}</td>
                <td style={{ padding: '6px 8px', color: 'var(--ink)' }}>{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Deeper>

      <Deeper title="What counts as irreversible">
        <p style={{ margin: '0 0 8px' }}>
          An action is <strong>irreversible if undoing it costs more than not doing it</strong>.
          Deliberately practical: it covers the obvious cases and the ones where the information
          released can’t be recalled. The team keeps an explicit list and reviews it when the system
          changes. The steward’s veto applies to the irreversible; everything else can, in
          principle, be delegated along the graduated trust progression. <Badge layer="W" />
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 8,
          }}
        >
          {[
            'Data deletion',
            'External financial transactions',
            'Legal commitments',
            'Production traffic affecting customers',
            'A leaked secret',
            'A public announcement / email sent',
          ].map((c) => (
            <div
              key={c}
              style={{
                border: '1px solid var(--line-soft)',
                borderLeft: '3px solid var(--red)',
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: '13px',
                color: 'var(--ink)',
                background: 'var(--paper-2)',
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </Deeper>
    </Page>
  );
}
