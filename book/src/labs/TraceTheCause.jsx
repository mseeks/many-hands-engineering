// TraceTheCause — Chapter 3's conceptual-change probe.
//
// Beat one: commit to the thing that decided the coordination. Beat two:
// fail to find it. Click any event in the ten-day history and walk its
// causal chain backward, hop by hop; every hop is labeled READ or WRITE,
// never CALL, and the chain always ends in a signal in the terrain.
// Physics: causalChain() in src/engine/scenarios/traceCause.js.

import { useMemo, useState } from 'react';
import { Badge, Commit, LabFrame, Mark, glassSlice } from '../components/kit.jsx';
import { causalChain, events, loops } from '../engine/scenarios/traceCause.js';
import traceCauseRaw from '../engine/scenarios/traceCause.js?raw';

const CANONICAL = 'dc-removal-merge'; // the coordinated outcome: the zod removal merging

const eventById = new Map(events.map((e) => [e.id, e]));
const TERRAIN_ACTOR = { id: 'terrain', name: 'terrain', color: 'var(--ink-faint)' };

function actorOf(eventId) {
  const e = eventById.get(eventId);
  return loops.find((l) => l.id === e.loop) ?? TERRAIN_ACTOR;
}

// Short feed titles for the timeline; the engine captions stay the long form.
const TITLES = {
  'sig-zod-patch': 'outdated-deps signal: zod 3.24.1 → 3.24.2',
  'dp-open': 'PR #481 opened — bump zod, lockfile only',
  'ci-pr481': 'CI green on #481; pass/fail record refreshed',
  'dp-merge': 'PR #481 merges; ledger row; doc-freshness decays',
  'ft-fix': 'PR #482 opened — seed-isolation fix for schema-fixture.spec',
  'graph-scan': 'deadness map recomputed: zero zod imports left',
  'dc-propose': 'PR #487 opened — remove zod entirely',
  'dr-rewrite': 'PR #488 opened — validation.md rewritten',
  'triage-rank': 'ranked queue written: removal, flaky fix, docs',
  'dc-removal-merge': 'zod removal merges off the ranked queue',
};

const DECIDERS = [
  { id: 'dep-patch', label: 'dependency-patch — it moved first' },
  { id: 'triage', label: 'triage — it ranked the work' },
  { id: 'steward', label: 'the steward — a human sequenced it' },
  { id: 'scheduler', label: 'a scheduler offstage' },
  { id: 'terrain', label: 'nothing did — the cluster is in the terrain' },
];

const DECIDER_FEEDBACK = {
  'dep-patch': (
    <>
      It moved first, and its merge wrote artifacts three later events read: <code>main</code>, the
      ledger, the doc-freshness field. But writing the terrain is not commanding it. Trace
      flaky-test's PR #482 below: the chain reaches dependency-patch only through CI's pass/fail
      record — a verdict CI wrote into the open, addressed to no one. First mover, yes. Decider, no
      — it read one signal, bumped one package, and stopped.
    </>
  ),
  triage: (
    <>
      The closest thing to a coordinator on stage, so check what it actually did: on day 7 it read
      three signals, wrote one ranking, and stopped. Eight of the ten events were already on the
      board before it acted. dead-code read the ranking the way it reads any signal — a ranker that
      writes to the terrain is one more loop, not an orchestrator.
    </>
  ),
  steward: (
    <>
      The steward appears exactly once, on day 9, working a queue that triage had already written
      into the terrain. That is downstream of the coordination, not upstream of it. The approval is
      the visible act; the terrain did the sequencing.
    </>
  ),
  scheduler: (
    <>
      That is the prior this chapter exists to meet: <strong>someone must be driving</strong>. So go
      look for the driver. A scheduler's instruction would have to arrive as a hop, and every hop
      this history can carry is a READ or a WRITE of a terrain artifact. There is no channel a call
      could have traveled.
    </>
  ),
  terrain: (
    <>
      Then point at where the decision lives. Trace any event below and the chain bottoms out in{' '}
      <code>signals/deps.outdated</code>, written by the nightly registry sync — no loop. The
      "decision" is five loops reading shared state: N channels through the terrain, where direct
      coordination would need N². Combinatorial, not ideological.
    </>
  ),
};

function KindTag({ children }) {
  return (
    <span
      style={{
        border: '1px solid var(--line)',
        borderRadius: 3,
        padding: '0 5px',
        fontSize: 9.5,
        letterSpacing: '0.1em',
        color: 'var(--ink)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function ActorChip({ id }) {
  const actor = actorOf(id);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
      <span
        aria-hidden="true"
        style={{ width: 7, height: 7, borderRadius: '50%', background: actor.color }}
      />
      <span style={{ color: 'var(--ink)' }}>{id}</span>
    </span>
  );
}

function ChainProbe() {
  const [eventId, setEventId] = useState(CANONICAL);
  const [revealed, setRevealed] = useState(Number.POSITIVE_INFINITY);

  const chain = useMemo(() => causalChain(eventId), [eventId]);
  const selected = eventById.get(eventId);
  const total = chain.hops.length;
  const shown = Math.min(revealed, total);
  const done = shown === total;
  const visibleHops = chain.hops.slice(0, shown);

  // Events touched by the hops traced so far light up on the timeline, so the
  // backward walk is visible against the history it walks through.
  const lit = new Set([eventId]);
  for (const hop of visibleHops) {
    lit.add(hop.from);
    lit.add(hop.to);
  }

  const select = (id) => {
    setEventId(id);
    setRevealed(0);
  };
  const reset = () => {
    setEventId(CANONICAL);
    setRevealed(Number.POSITIVE_INFINITY);
  };
  const atRest = eventId === CANONICAL && done;

  return (
    <div className="mh-bench">
      <div className="mh-trace">
        <span className="mh-kicker" style={{ display: 'block', marginBottom: 8 }}>
          The history · days 0–9 · pick an outcome to trace
        </span>
        <ol
          aria-label="Coordination history, days 0 through 9; choose the event to trace backward"
          style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}
        >
          {events.map((e) => {
            const actor = actorOf(e.id);
            const isSelected = eventId === e.id;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => select(e.id)}
                  aria-pressed={isSelected}
                  aria-label={`Trace backward from day ${e.day}, ${actor.name}: ${TITLES[e.id]}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 10px 1fr',
                    gap: 8,
                    alignItems: 'baseline',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 8px',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--line-soft)',
                    borderRadius: 3,
                    background: lit.has(e.id) ? 'var(--accent-soft)' : 'var(--paper)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11.5,
                    lineHeight: 1.5,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: 'var(--ink-faint)' }}>d{e.day}</span>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: actor.color,
                      display: 'inline-block',
                    }}
                  />
                  <span>
                    <span style={{ color: 'var(--ink-2)' }}>
                      {actor.name} · <span style={{ color: 'var(--ink-faint)' }}>{e.id}</span>
                    </span>
                    <span style={{ display: 'block', color: 'var(--ink)' }}>{TITLES[e.id]}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mh-trace">
        <span className="mh-kicker" style={{ display: 'block', marginBottom: 8 }}>
          The chain · walked backward from {eventId}
        </span>
        <p
          style={{ margin: '0 0 8px', fontSize: 13.5, fontStyle: 'italic', color: 'var(--ink-2)' }}
        >
          {selected.caption}
        </p>
        <div className="mh-controls">
          <button
            type="button"
            className="mh-btn"
            onClick={() => setRevealed(shown + 1)}
            disabled={done}
            aria-label="Reveal the next hop in the causal chain"
          >
            Trace one hop back
          </button>
          <button
            type="button"
            className="mh-btn"
            onClick={() => setRevealed(Number.POSITIVE_INFINITY)}
            disabled={done}
            aria-label="Reveal every remaining hop down to the root"
          >
            Trace to the root
          </button>
          <button
            type="button"
            className="mh-btn"
            onClick={reset}
            disabled={atRest}
            aria-label="Return to the zod removal merge, fully traced"
          >
            Reset to the merge
          </button>
        </div>
        <div className="mh-readout">
          <div className="mh-stat">
            <span className="k">Hops traced</span>
            <span className="v" aria-live="polite">
              {shown} of {total}
            </span>
          </div>
          <div className="mh-stat">
            <span className="k">READ labels</span>
            <span className="v">{shown}</span>
          </div>
          <div className="mh-stat">
            <span className="k">WRITE labels</span>
            <span className="v">{shown}</span>
          </div>
          <div
            className="mh-stat"
            title="CALL is not a hop kind this history can represent — the chapter's point."
          >
            <span className="k">CALL labels</span>
            <span className="v good">0</span>
          </div>
        </div>
        {total === 0 ? (
          <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ink-2)' }}>
            You started at the bottom. This event read nothing; it is a signal in the terrain.
          </p>
        ) : null}
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {visibleHops.map((hop, k) => (
            <li
              key={`${hop.from}-${hop.artifact}`}
              title={hop.label}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                alignItems: 'baseline',
                padding: '5px 0',
                borderBottom: '1px solid var(--line-soft)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11.5,
              }}
            >
              <span style={{ color: 'var(--ink-faint)', minWidth: 16 }}>{k + 1}</span>
              <ActorChip id={hop.from} />
              <KindTag>{hop.kind}</KindTag>
              <code style={{ color: 'var(--accent-ink)' }}>{hop.artifact}</code>
              <KindTag>WRITE</KindTag>
              <span style={{ color: 'var(--ink-faint)' }}>by</span>
              <ActorChip id={hop.to} />
              <span style={{ color: 'var(--ink-faint)' }}>d{eventById.get(hop.to).day}</span>
            </li>
          ))}
        </ol>
        {!done ? (
          <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--ink-faint)' }}>
            {total - shown} {total - shown === 1 ? 'hop' : 'hops'} still below. Keep walking, or
            trace to the root.
          </p>
        ) : (
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
              Root reached
            </span>
            <code>{chain.terminal.artifact}</code> — {chain.terminal.note}
          </div>
        )}
      </div>
    </div>
  );
}

const NOTES = [
  'The shape is documented-real (froot, 2026): a zod bump merged by dependency-patch, then an ' +
    'independent proposal from dead-code to remove the package days later, with no call between ' +
    'them. The ten events here are the teaching reconstruction of it on a compressed clock.',
  'Each read points at the single event that wrote the artifact. Real terrain keeps write ' +
    'histories; attribution there is a query against logs, not a property of the data.',
  'causalChain() walks reads breadth-first to the roots. CALL is not a hop kind the data can ' +
    'represent, because the loops that produced the real sequence have no channel to carry one.',
];

export default function TraceTheCause() {
  return (
    <LabFrame
      tag="LAB 03·A — TRACE THE CAUSE"
      register="mechanism"
      question="Ten days, five loops, one coordinated outcome — a zod bump merged, and three days later a proposal to delete zod entirely. Where is the call that arranged it?"
      payoff={
        <>
          Walk any outcome backward: every hop is a READ or a WRITE of a terrain artifact, and the
          chain always ends in a signal in the terrain, written by no loop. There is no CALL to
          find. Coordination through shared state costs N channels where direct messaging costs N²{' '}
          <Badge
            layer="E"
            note="coordination cost is topological: N shared-state channels versus N² direct ones (§2.8). Combinatorial, not ideological."
          />{' '}
          — the coordinator you keep reaching for is the terrain itself.
        </>
      }
      notes={NOTES}
      cannotShow="a system where the orchestrator does exist. This history was produced by terrain-coordinated loops, so finding no call here cannot prove your system has none; it shows what full coordination looks like when nothing is driving."
      glass={glassSlice(traceCauseRaw, 'export function causalChain', '\n  };\n}')}
    >
      <p className="mono" style={{ fontSize: 12.5, color: 'var(--ink-faint)', margin: '0 0 12px' }}>
        <Mark kind="real" note="the zod sequence happened (froot, 2026)" /> the shape is real ·{' '}
        <Mark kind="made" note="ten events on a compressed ten-day clock" /> these events are its
        teaching reconstruction
      </p>
      <Commit
        prompt="Work just clustered around the fragile module; point at the thing that decided that."
        options={DECIDERS}
      >
        {(picked) => (
          <>
            {DECIDER_FEEDBACK[picked]}
            <p style={{ margin: '8px 0 0' }}>
              Now check it against the history. The merge is traced below; click any other event and
              walk its chain back yourself, one hop at a time.
            </p>
          </>
        )}
      </Commit>
      <ChainProbe />
    </LabFrame>
  );
}
