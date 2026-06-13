// P02 — Nobody calls anyone.
//
// The activity is a drawn repo-coordination map. The terrain (a panel of
// artifact tiles) sits at the center; five loop glyphs ring it. Selecting any
// event in the ten-day strip walks causalChain() backward and draws each hop
// as a glowing READ arrow (tile → the loop that read it) paired with the WRITE
// arrow (the loop that wrote it → the tile). Every arrow touches a terrain
// tile; none ever connects two loops. There is no CALL to draw — the page's
// whole point, made geometric. Commit first, then fail to find the caller.
//
// Physics: causalChain() in src/engine/scenarios/traceCause.js.

import React from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, Commit, Mark, ModelNotes, glassSlice } from '../components/kit.jsx';
import { causalChain, events } from '../engine/scenarios/traceCause.js';
import traceCauseRaw from '../engine/scenarios/traceCause.js?raw';

const { useMemo, useState } = React;

const CANONICAL = 'dc-removal-merge'; // the coordinated outcome at rest, fully traced
const eventById = new Map(events.map((e) => [e.id, e]));

// ── Geometry ───────────────────────────────────────────────────────────
// One viewBox the SVG scales to fill the Activity width. Loop anchors ring a
// central terrain panel; each artifact's first-written tile gets a fixed slot.
const VB = { w: 760, h: 392 };
// The panel wraps the trimmed tile grid: 4 rows + a top band for the terrain
// actor's dock and the title, recentred against the ring of loop glyphs.
const TILE_TOP = 30; // tile grid's inset below the panel's top edge
const TERRAIN = { x: 250, y: 132, w: 260, h: 222 };

// Loop glyph anchors — the docking point arrows touch. dead-code appears twice
// in the cast but is one loop with one node.
const LOOP_NODES = {
  'dep-patch': { x: 120, y: 162, side: 'right' },
  'flaky-test': { x: 120, y: 243, side: 'right' },
  triage: { x: 120, y: 324, side: 'right' },
  'dead-code': { x: 640, y: 190, side: 'left' },
  'doc-refresh': { x: 640, y: 300, side: 'left' },
  // The terrain actor (nightly registry sync + the CI oracle) is ground, not a
  // loop — it writes signals too, so it gets a docking node up top, seated over
  // the signal tiles it owns rather than across the panel title.
  terrain: { x: 380, y: 92, side: 'down' },
};
// Where the terrain-actor band's arrows dock onto the panel: the top edge,
// above its own signal tiles, clear of the centered title.
const TERRAIN_ACTOR_DOCK = { x: 416, y: TERRAIN.y };
const LOOP_META = {
  'dep-patch': { name: 'dependency-patch', color: 'var(--c-deppatch)' },
  'flaky-test': { name: 'flaky-test', color: 'var(--c-flaky)' },
  triage: { name: 'triage', color: 'var(--c-triage)' },
  'dead-code': { name: 'dead-code', color: 'var(--c-deadcode)' },
  'doc-refresh': { name: 'doc-refresh', color: 'var(--c-docs)' },
  terrain: { name: 'registry sync · CI oracle', color: 'var(--ink-faint)' },
};

// Each artifact's tile lives at a fixed slot inside the terrain panel. Only
// the tiles a backward walk can actually reach are drawn — every artifact
// here is read by some event, so an arrow can dock on it. Write-only
// artifacts (a closed branch, a ledger row nothing reads back) are left out:
// they would sit dark forever and only crowd the panel.
const TILE_ORDER = [
  ['signals/deps.outdated', 'deps.outdated', 'sig-zod-patch'],
  ['repo/pr-481', 'pr #481', 'dp-open'],
  ['signals/ci.status/pr-481', 'ci.status #481', 'ci-pr481'],
  ['signals/ci.flakiness', 'ci.flakiness', 'ci-pr481'],
  ['repo/main', 'main', 'dp-merge'],
  ['signals/docs.freshness', 'docs.freshness', 'dp-merge'],
  ['signals/deadness', 'deadness', 'graph-scan'],
  ['signals/queue.ranked', 'queue.ranked', 'triage-rank'],
];
const TILE = { w: 116, h: 30, gap: 12 };
const tileAt = (i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  return {
    x: TERRAIN.x + 10 + col * (TILE.w + 8),
    y: TERRAIN.y + TILE_TOP + row * (TILE.h + TILE.gap),
    w: TILE.w,
    h: TILE.h,
  };
};
const tileBox = new Map();
TILE_ORDER.forEach(([art], i) => tileBox.set(art, tileAt(i)));

// Dock an arrow on the terrain edge nearest a loop, then run to the tile.
const loopDock = (id) => {
  const n = LOOP_NODES[id];
  if (n.side === 'right') return { x: n.x + 56, y: n.y };
  if (n.side === 'left') return { x: n.x - 56, y: n.y };
  return TERRAIN_ACTOR_DOCK; // the terrain actor docks on the panel's top edge
};
const tileEdge = (art, toward) => {
  const b = tileBox.get(art);
  if (toward.x < b.x) return { x: b.x, y: b.y + b.h / 2 }; // left
  if (toward.x > b.x + b.w) return { x: b.x + b.w, y: b.y + b.h / 2 }; // right
  return { x: b.x + b.w / 2, y: toward.y < b.y ? b.y : b.y + b.h }; // top/bot
};

// Short feed titles; engine captions stay the long form below the strip.
const TITLES = {
  'sig-zod-patch': 'registry sync writes outdated-deps: zod 3.24.1 → 3.24.2',
  'dp-open': 'pr #481 opened — bump zod, lockfile only',
  'ci-pr481': 'CI green on #481; pass/fail record refreshed',
  'dp-merge': 'pr #481 merges; ledger row; doc-freshness decays',
  'ft-fix': 'pr #482 — seed-isolation fix for schema-fixture.spec',
  'graph-scan': 'deadness map recomputed: zero zod imports left',
  'dc-propose': 'pr #487 — remove zod entirely',
  'dr-rewrite': 'pr #488 — validation.md rewritten',
  'triage-rank': 'ranked queue written: removal, flaky fix, docs',
  'dc-removal-merge': 'zod removal merges off the ranked queue',
};

const actorOf = (id) => eventById.get(id).loop;

// ── The drawn scene ────────────────────────────────────────────────────
// Renders the terrain panel, the ringed loop glyphs, and — for the selected
// outcome — every hop as a paired READ/WRITE arrow. lit highlights what the
// backward walk has touched. Two arrow kinds, never a third.
function Scene({ chain, selectedId }) {
  const reader = actorOf;
  // Build arrow set: one READ (tile→reader) and one WRITE (writer→tile) per hop.
  const arrows = [];
  const litTiles = new Set();
  const litLoops = new Set([actorOf(selectedId)]);
  chain.hops.forEach((hop, k) => {
    const art = hop.artifact;
    litTiles.add(art);
    const fromLoop = reader(hop.from);
    const toLoop = reader(hop.to);
    litLoops.add(fromLoop);
    litLoops.add(toLoop);
    const rDock = loopDock(fromLoop);
    const rTileEdge = tileEdge(art, rDock);
    arrows.push({
      key: `r-${k}`,
      kind: 'READ',
      x1: rTileEdge.x,
      y1: rTileEdge.y,
      x2: rDock.x,
      y2: rDock.y,
      color: LOOP_META[fromLoop].color,
    });
    const wDock = loopDock(toLoop);
    const wTileEdge = tileEdge(art, wDock);
    arrows.push({
      key: `w-${k}`,
      kind: 'WRITE',
      x1: wDock.x,
      y1: wDock.y,
      x2: wTileEdge.x,
      y2: wTileEdge.y,
      color: LOOP_META[toLoop].color,
    });
  });

  return (
    <svg
      viewBox={`0 55 ${VB.w} ${VB.h - 55}`}
      width="100%"
      role="img"
      aria-label={`Coordination map for ${selectedId}: every traced hop is a read or a write of a terrain tile; no arrow connects two loops.`}
      style={{ display: 'block', maxHeight: 420 }}
    >
      <defs>
        <marker
          id="p02-head"
          viewBox="0 0 10 10"
          refX="8.5"
          refY="5"
          markerWidth="6.5"
          markerHeight="6.5"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
        </marker>
      </defs>

      {/* terrain panel — the shared environment the coordination lives in */}
      <rect
        x={TERRAIN.x}
        y={TERRAIN.y}
        width={TERRAIN.w}
        height={TERRAIN.h}
        rx="10"
        fill="var(--paper)"
        stroke="var(--line)"
      />
      <text
        x={TERRAIN.x}
        y={TERRAIN.y - 7}
        textAnchor="start"
        fontSize="10.5"
        letterSpacing="0.12em"
        fill="var(--ink-faint)"
        fontFamily="var(--font-mono)"
      >
        THE TERRAIN · SHARED STATE
      </text>

      {/* artifact tiles */}
      {TILE_ORDER.map(([art, label]) => {
        const b = tileBox.get(art);
        const on = litTiles.has(art);
        return (
          <g key={art}>
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx="4"
              fill={on ? 'var(--accent-soft)' : 'var(--paper-2)'}
              stroke={on ? 'var(--accent)' : 'var(--line-soft)'}
              style={{ transition: 'fill .25s ease, stroke .25s ease' }}
            />
            <text
              x={b.x + 7}
              y={b.y + b.h / 2 + 3.5}
              fontSize="9.5"
              fill={on ? 'var(--ink)' : 'var(--ink-2)'}
              fontFamily="var(--font-mono)"
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* loop glyphs around the ring */}
      {Object.keys(LOOP_NODES).map((id) => {
        const n = LOOP_NODES[id];
        const m = LOOP_META[id];
        const on = litLoops.has(id);
        const isActor = id === 'terrain';
        const r = isActor ? 0 : 30;
        return (
          <g key={id} style={{ transition: 'opacity .25s ease', opacity: on ? 1 : 0.4 }}>
            {isActor ? (
              <rect
                x={n.x - 95}
                y={n.y - 13}
                width="190"
                height="26"
                rx="13"
                fill="var(--paper-2)"
                stroke={on ? m.color : 'var(--line-soft)'}
                strokeWidth={on ? 1.6 : 1}
              />
            ) : (
              <>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r}
                  fill="var(--paper-2)"
                  stroke={on ? m.color : 'var(--line-soft)'}
                  strokeWidth={on ? 2.4 : 1.2}
                />
                {/* the loop's closing-cycle glyph */}
                <path
                  d={`M ${n.x - 12} ${n.y} A 12 12 0 1 1 ${n.x - 12} ${n.y + 0.01}`}
                  fill="none"
                  stroke={m.color}
                  strokeWidth="2"
                  opacity={on ? 0.9 : 0.5}
                />
                <path
                  d={`M ${n.x - 12} ${n.y - 4} L ${n.x - 12} ${n.y} L ${n.x - 7} ${n.y - 1}`}
                  fill="none"
                  stroke={m.color}
                  strokeWidth="2"
                  opacity={on ? 0.9 : 0.5}
                />
              </>
            )}
            <text
              x={n.x}
              y={isActor ? n.y + 3.5 : n.side === 'right' ? n.y - 40 : n.y + 47}
              textAnchor="middle"
              fontSize={isActor ? '9.5' : '10.5'}
              fontWeight="600"
              fill={on ? 'var(--ink)' : 'var(--ink-faint)'}
              fontFamily="var(--font-mono)"
            >
              {m.name}
            </text>
          </g>
        );
      })}

      {/* the hops — paired READ/WRITE arrows, drawn last so they glow on top.
          The kind is carried by the line style (dashed READ, solid WRITE), not
          a label box per arrow: stacking sixteen tiny labels at the docks was
          the whole tangle. One legend reads them all. */}
      {arrows.map((a) => (
        <line
          key={a.key}
          x1={a.x1}
          y1={a.y1}
          x2={a.x2}
          y2={a.y2}
          stroke={a.color}
          strokeWidth="2.6"
          strokeDasharray={a.kind === 'READ' ? '5 5' : undefined}
          markerEnd="url(#p02-head)"
          opacity="0.92"
          style={{ filter: `drop-shadow(0 0 2px ${a.color})`, transition: 'opacity .2s ease' }}
        />
      ))}

      {/* one legend for both arrow kinds, seated in the open lower-left */}
      <g fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-2)">
        <line
          x1="40"
          y1="368"
          x2="70"
          y2="368"
          stroke="var(--ink-2)"
          strokeWidth="2.4"
          strokeDasharray="5 5"
        />
        <text x="76" y="371.5">
          a loop READS
        </text>
        <line x1="40" y1="384" x2="70" y2="384" stroke="var(--ink-2)" strokeWidth="2.4" />
        <text x="76" y="387.5">
          a loop WROTE
        </text>
      </g>
    </svg>
  );
}

// Commit-first: name the decider, then fail to find it in the map.
const DECIDERS = [
  { id: 'dep-patch', label: 'dependency-patch — it moved first' },
  { id: 'triage', label: 'triage — it ranked the work' },
  { id: 'steward', label: 'the steward sequenced it' },
  { id: 'terrain', label: 'nothing — the cluster is in the terrain' },
];
const DECIDER_FEEDBACK = {
  'dep-patch': (
    <>
      It moved first and its merge wrote <code>main</code>, the ledger, the freshness field. But
      writing the terrain is not commanding it — trace any outcome and the chain reaches it through
      a tile, never a call.
    </>
  ),
  triage: (
    <>
      The closest thing to a coordinator, so check the map: triage read three tiles, wrote one
      ranking, stopped. A loop that writes a tile is one more loop, not an orchestrator.
    </>
  ),
  steward: (
    <>
      The steward appears once, on day 9, working a <code>queue.ranked</code> tile already in the
      terrain — downstream of the coordination. The approval is visible; the terrain sequenced it.
    </>
  ),
  terrain: (
    <>
      Then point at it. Every traced arrow touches a tile; the chain bottoms out at{' '}
      <code>deps.outdated</code>, written by the nightly sync — no loop. Five loops reading shared
      state: N channels where direct coordination needs N².{' '}
      <Badge
        layer="E"
        note="coordination cost is topological: N shared-state channels versus N² direct ones (§2.8). Combinatorial, not ideological."
      />
    </>
  ),
};

const GLASS = glassSlice(traceCauseRaw, 'export function causalChain', '\n  };\n}');

export default function P02() {
  const [selectedId, setSelectedId] = useState(CANONICAL);
  const [committed, setCommitted] = useState(false);

  const chain = useMemo(() => causalChain(selectedId), [selectedId]);
  const selected = eventById.get(selectedId);
  const readCount = chain.hops.length;

  return (
    <Page n={2} claim="The coordination is in the environment; there is no controller to find.">
      <Activity wide>
        <Commit
          prompt="Work just clustered on the fragile module. Point at the thing that decided that."
          options={DECIDERS}
          onReveal={() => setCommitted(true)}
        >
          {(picked) => (
            <>
              {DECIDER_FEEDBACK[picked]}
              <p style={{ margin: '8px 0 0' }}>
                Check it on the map: pick any outcome, watch its chain draw backward.
              </p>
            </>
          )}
        </Commit>

        <Scene chain={chain} selectedId={selectedId} />

        <div
          className="mh-readout"
          aria-live="polite"
          style={{ justifyContent: 'center', alignItems: 'center', gap: 36 }}
        >
          <div className="mh-stat" title="Each hop is one loop reading a tile another loop wrote.">
            <span className="k">read↔write edges</span>
            <span className="v">{readCount}</span>
          </div>
          <div
            className="mh-stat"
            title="CALL is not a hop kind this history can draw — the point."
            style={{ textAlign: 'center' }}
          >
            <span className="k" style={{ fontSize: 12 }}>
              call arrows
            </span>
            <span className="v good" style={{ fontSize: 34, fontWeight: 700, lineHeight: 1 }}>
              0
            </span>
          </div>
        </div>

        <p
          aria-live="polite"
          style={{
            margin: '4px 0 10px',
            textAlign: 'center',
            fontSize: 13,
            fontStyle: 'italic',
            color: 'var(--ink-2)',
          }}
        >
          {committed ? selected.caption : 'Choose an outcome above, then trace it here.'}
        </p>

        <div
          className="mh-chipset"
          role="group"
          aria-label="Coordination history, days 0 through 9; choose an outcome to trace"
          style={{ justifyContent: 'center', opacity: committed ? 1 : 0.55 }}
        >
          {events.map((e) => {
            const on = selectedId === e.id;
            return (
              <button
                key={e.id}
                type="button"
                className="mh-chip"
                aria-pressed={on}
                disabled={!committed}
                onClick={() => setSelectedId(e.id)}
                title={TITLES[e.id]}
                style={
                  on
                    ? { borderColor: LOOP_META[actorOf(e.id)].color, color: 'var(--ink)' }
                    : undefined
                }
              >
                <span style={{ color: LOOP_META[actorOf(e.id)].color, marginRight: 5 }}>●</span>d
                {e.day} · {e.id}
              </button>
            );
          })}
        </div>

        <ModelNotes
          register="mechanism"
          notes={[
            'The shape is documented-real (froot, 2026): a zod bump merged by dependency-patch, ' +
              'then an independent dead-code proposal to remove the package days later, with no ' +
              'call between them. The ten events are the teaching reconstruction on a compressed clock.',
            'causalChain() walks reads breadth-first to the roots. CALL is not a hop kind the data ' +
              'can represent — the loops that produced the real sequence share a terrain, not a channel.',
          ]}
          cannotShow="a system where an orchestrator does exist. Finding no call here cannot prove your system has none; it shows what coordination looks like when nothing is driving."
          glass={GLASS}
        />
      </Activity>

      <Seen>
        Every hop is a loop reading a tile and a loop having written it. No arrow joins two loops:
        the data has no way to draw a call.
      </Seen>

      <Takeaway>
        Stop hunting the orchestrator. The coordinator is the terrain itself — and it scales because
        shared state costs N channels where direct messaging costs N².
      </Takeaway>

      <Deeper title="Why shared-environment coordination scales (§2.8)">
        <p>
          <strong>Coordination cost is topological.</strong> Direct messaging among N agents needs
          N² channels; coordinating through a shared environment needs N. That is why colonies scale
          and tightly-coupled microservice meshes degrade above a few tens of services.
          Combinatorial, not ideological. <Badge layer="E" />
        </p>
        <TwoMesh />
        <p style={{ marginTop: 12 }}>
          The map above is the N case drawn out: five loops, each touching only the terrain. Wire
          them mouth-to-mouth instead and you would be drawing the mesh on the right — every pair
          its own channel, every new loop another column of edges to keep alive.
        </p>
      </Deeper>

      <Deeper title="How loops compose without calling (§3.3)">
        <p>
          Individual loops are useful; loops that read each other&apos;s signals are where
          compounding lives. The dead-code loop writes a map of cold regions. Triage reads that map
          as one input among several. The doc-refresh loop reads the freshness field the merge
          decayed. Each loop stays simple; the field of signals they collectively maintain is rich.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>No loop calls another.</strong> Each reads the terrain and writes to it. The
          coordination is in the environment, not in any orchestrator — which is also what makes any
          one loop swappable without renegotiating a protocol.{' '}
          <Mark kind="real" note="the zod sequence happened (froot, 2026)" /> shape real ·{' '}
          <Mark kind="made" note="ten events on a compressed ten-day clock" /> events reconstructed.
        </p>
      </Deeper>
    </Page>
  );
}

// Two small meshes: N shared-environment edges vs N² direct edges, for the same
// five agents. The contrast is the whole argument, so it is drawn, not stated.
function TwoMesh() {
  const N = 5;
  const ring = (cx, cy, r) =>
    Array.from({ length: N }, (_, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });
  const left = ring(70, 70, 42);
  const right = ring(230, 70, 42);
  const hub = { x: 70, y: 70 };
  const directEdges = [];
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++) directEdges.push([right[i], right[j]]);
  return (
    <svg
      viewBox="0 0 300 160"
      width="100%"
      role="img"
      aria-label="Left: five agents each linked to a central hub, five edges. Right: the same five agents linked pairwise, ten edges."
      style={{ maxWidth: 340, display: 'block', margin: '4px 0' }}
    >
      {/* N: hub-and-spoke (the terrain) */}
      <circle cx={hub.x} cy={hub.y} r="9" fill="var(--accent-soft)" stroke="var(--accent)" />
      <text
        x={hub.x}
        y={hub.y + 3}
        textAnchor="middle"
        fontSize="7"
        fill="var(--ink)"
        fontFamily="var(--font-mono)"
      >
        env
      </text>
      {left.map((p, i) => (
        <line
          key={`l${i}`}
          x1={hub.x}
          y1={hub.y}
          x2={p.x}
          y2={p.y}
          stroke="var(--accent)"
          strokeWidth="1.4"
          opacity="0.8"
        />
      ))}
      {left.map((p, i) => (
        <circle
          key={`ln${i}`}
          cx={p.x}
          cy={p.y}
          r="6"
          fill="var(--paper)"
          stroke="var(--ink-2)"
          strokeWidth="1.2"
        />
      ))}
      <text
        x="70"
        y="148"
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="700"
        fill="var(--accent-ink)"
        fontFamily="var(--font-mono)"
      >
        N = 5
      </text>
      <text
        x="70"
        y="158"
        textAnchor="middle"
        fontSize="8"
        fill="var(--ink-faint)"
        fontFamily="var(--font-mono)"
      >
        shared env
      </text>

      {/* N²: direct mesh */}
      {directEdges.map(([a, b], i) => (
        <line
          key={`d${i}`}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke="var(--red)"
          strokeWidth="1.1"
          opacity="0.6"
        />
      ))}
      {right.map((p, i) => (
        <circle
          key={`rn${i}`}
          cx={p.x}
          cy={p.y}
          r="6"
          fill="var(--paper)"
          stroke="var(--ink-2)"
          strokeWidth="1.2"
        />
      ))}
      <text
        x="230"
        y="148"
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="700"
        fill="var(--red)"
        fontFamily="var(--font-mono)"
      >
        N² = 10
      </text>
      <text
        x="230"
        y="158"
        textAnchor="middle"
        fontSize="8"
        fill="var(--ink-faint)"
        fontFamily="var(--font-mono)"
      >
        direct mesh
      </text>
    </svg>
  );
}
