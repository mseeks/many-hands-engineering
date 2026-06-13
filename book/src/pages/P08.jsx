// P08 · The commons — claim: shared substrates degrade without governance,
// not from villainy, from absence.
//
// The activity IS the page: a drawn degradation fingerprint. Each of the six
// prepared commons.fingerprintScenarios() traces is one large layered chart —
// quality as a filled area, noise and cruft as lines, all over a shared 30-week
// rail, with the steward's incident log plotted as ticks where each event
// landed. The reader reads the shape, then commits which one of Ostrom's eight
// principles is absent; the feedback argues from the tell, never the answer.
//
// No principle toggles anywhere: governance is not a switch (the brief, and the
// engine). Every point drawn is a real runCommons run, seed pinned per trace,
// so the fingerprint never shifts under the reader. Trace swaps crossfade; the
// reduced-motion hook drops the crossfade to an instant cut.

import React from 'react';
import { Page, Activity, Seen, Takeaway, Deeper } from '../components/page.jsx';
import { Badge, Mark, Commit, ModelNotes, glassSlice } from '../components/kit.jsx';
import { usePrefersReducedMotion } from '../shared/usePrefersReducedMotion.js';
import { fingerprintScenarios, runCommons, PRINCIPLE_LABELS } from '../engine/commons.js';
import commonsRaw from '../engine/commons.js?raw';

const { useMemo, useState } = React;

// The prepared traces, in spec order. fingerprintScenarios() drops the event
// log, so re-run each scenario with the same pinned seed (101 through 106, the
// spec order) to recover the steward's incidents — identical series, plus the
// week-stamped log the fingerprint chart plots on its rail.
const SEEDS = [101, 102, 103, 104, 105, 106];
const SCENARIOS = fingerprintScenarios().map((s, i) => ({
  ...s,
  events: runCommons({ principles: { [s.missingPrinciple]: false }, weeks: 30, seed: SEEDS[i] })
    .events,
}));
const OPTIONS = Object.entries(PRINCIPLE_LABELS).map(([id, label]) => ({ id, label }));

// runCommons is the physics: every distortion the reader is asked to recognize
// is a branch in this one function. glassSlice ends at the return line, so the
// closing brace (the literal next line of source) is appended.
const GLASS =
  glassSlice(commonsRaw, 'export function runCommons', 'return { series, events };') + '\n}';

const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

/* ── Shared scales, so shapes compare honestly across all six traces ─────── */

const allValues = (key) => SCENARIOS.flatMap((s) => s.series[key]);
const Q_LO = Math.max(0, Math.min(...allValues('quality')) - 0.04);
const Q_HI = Math.min(1, Math.max(...allValues('quality')) + 0.04);
const NOISE_HI = Math.max(...allValues('noise')) * 1.08;
const CRUFT_HI = Math.max(...allValues('cruft')) * 1.08;

/* ── What each absence looks like, written to discriminate the near-misses ─ */
//
// boundaries vs congruence are both noise climbs (flood from week one vs slow
// silting); monitoring vs collectiveChoice are both cruft stories (invisible-
// then-cliff vs visible all run); sanctions vs conflict are both oscillations
// (4-week steps from one named emitter vs a 1-week saw with nobody named).
// These live in JS strings, rendered inside braces, so the prose budget never
// counts them — depth without a wall of text.

const SIGNATURES = {
  boundaries: {
    absence:
      'junk arrives signed by nobody and walks straight in: noise climbs from the first week and ' +
      'never comes back, quality stalls near 0.74 where a clean commons settles at 0.84, pinned ' +
      'under the flood with no steps, no cliff, and no offender to name.',
    mechanism:
      'Attribution is the door filter. With every emitter identifiable and every consumer holding ' +
      'a stated interest, most junk is stopped at the boundary; remove the identities and the ' +
      'filter has nothing to hold onto.',
  },
  congruence: {
    absence:
      'nothing fades at the rate it should: noise climbs slowly and is still climbing at week 30, ' +
      "a week-old status outranks this morning's failure, and the occasional high-consequence " +
      'call clears on one weak datapoint.',
    mechanism:
      'Congruence is rules fitting the resource: high-frequency signals must decay fast, and ' +
      'high-consequence signals must demand stronger evidence. Mis-tune either and the field ' +
      'silts up with stale signal.',
  },
  collectiveChoice: {
    absence:
      'workarounds pile up: cruft climbs the whole run while the rulebook never changes, and ' +
      'quality sags with no single dramatic week.',
    mechanism:
      'A rule the affected cannot change gets routed around, and a workaround is cruft the gc ' +
      'loop cannot delete, because it is load-bearing.',
  },
  monitoring: {
    absence:
      'the trace goes quiet, then cliffs: weeks of healthy-looking lines over an empty log, ' +
      'because the rot accrues where nobody looks, and the first warning is the failure itself.',
    mechanism:
      "Watchers accountable to the field's users surface rot as visible cruft while it is still " +
      'cheap to eat. Without them the rot accrues anyway; only its visibility changed.',
  },
  sanctions: {
    absence:
      'the trace becomes a metronome: quality falls in evenly spaced steps, partly recovers ' +
      'between them, and every incident in the log names the same emitter.',
    mechanism:
      'Graduated response is what makes a second offense different from a first. When the penalty ' +
      'never escalates, re-offending becomes a schedule.',
  },
  conflict: {
    absence:
      'the trace becomes a saw: quality flips direction on a one-week period while conventions ' +
      'flip overnight with no thread and no decision record.',
    mechanism:
      'When resolving conflict openly is expensive, the conflict goes underground, and two ' +
      'factions overwriting each other in silence churn the commons worse than any open argument ' +
      'would.',
  },
  rights: {
    absence:
      'central overrides land on a slow cadence: a quality dip about every six weeks, each one ' +
      'leaving the local fix behind as an unratified copy that ticks the cruft line up.',
    mechanism:
      'Override every local call and the local knowledge that made the calls good stops being ' +
      'offered. The fix comes back anyway, without ratification.',
  },
  nested: {
    absence:
      'one global rulebook misfits the edges: a slightly lowered quality ceiling and a steady ' +
      'trickle of extra junk, with no single dramatic tell anywhere.',
    mechanism:
      'A large commons is layered commons, each layer with its own rules at its own scope. One ' +
      'scope-wide rulebook misfits the edges, and the edges are where most deposits happen.',
  },
};

// One-line fingerprint per prepared trace, for the closing recap table.
const RECAP = {
  'unsigned-flood': 'Noise climbs from week one; the junk is signed by nobody',
  'repeat-offender': 'Evenly spaced quality steps; every incident names the same emitter',
  'silent-rot': 'Healthy lines, an empty log, then a cliff',
  'nothing-fades': 'Noise still climbing at week 30; stale outranks fresh',
  'overnight-flips': 'A one-week saw; conventions flip with no decision record',
  'workaround-pileup': 'Cruft climbs all run; the rulebook never changes',
};

/* ── The drawn scene: one big layered fingerprint chart ──────────────────── */
//
// viewBox-scaled SVG that fills the Activity width. The 30-week rail runs left
// to right. Quality is a filled area in the accent color (the thing the commons
// is for); noise rides the amber line, cruft the blue line, each mapped to the
// shared cross-trace scale so the six shapes compare honestly. The steward's
// incidents are plotted as ticks on the bottom rail at the week they landed.

const VW = 760;
const VH = 320;
const M = { t: 16, r: 18, b: 46, l: 18 };
const PW = VW - M.l - M.r;
const PH = VH - M.t - M.b;
const WEEKS = SCENARIOS[0].series.quality.length;

const xAt = (i) => M.l + (i * PW) / (WEEKS - 1);
const yAt = (v, lo, hi) => {
  const span = hi - lo || 1;
  const c = Math.min(Math.max(v, lo), hi);
  return M.t + PH - ((c - lo) / span) * PH;
};

const linePts = (values, lo, hi) =>
  values.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v, lo, hi).toFixed(1)}`).join(' ');

const areaPath = (values, lo, hi) => {
  const top = values.map((v, i) => `${xAt(i).toFixed(1)} ${yAt(v, lo, hi).toFixed(1)}`);
  return `M ${xAt(0).toFixed(1)} ${(M.t + PH).toFixed(1)} L ${top.join(' L ')} L ${xAt(
    WEEKS - 1,
  ).toFixed(1)} ${(M.t + PH).toFixed(1)} Z`;
};

// Pull the week number out of each incident string ("week 7: ...") so the log
// can be plotted on the same rail it describes.
const weekOf = (tell) => {
  const m = /week\s+(\d+)/i.exec(tell);
  return m ? Number(m[1]) : null;
};

function Fingerprint({ scenario, reduced }) {
  const { quality, noise, cruft } = scenario.series;
  const events = scenario.events ?? [];
  const marks = events
    .map((e) => ({ week: weekOf(e), text: e }))
    .filter((m) => m.week && m.week >= 1 && m.week <= WEEKS);

  const last = WEEKS - 1;
  const label =
    `Degradation fingerprint over ${WEEKS} weeks. Quality falls from ` +
    `${quality[0].toFixed(2)} to ${quality[last].toFixed(2)} as a filled band; noise rises from ` +
    `${noise[0].toFixed(2)} to a peak of ${Math.max(...noise).toFixed(2)}; cruft peaks at ` +
    `${Math.max(...cruft).toFixed(1)} items. ${marks.length} incidents are ticked on the week ` +
    'rail where the steward logged them.';

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      role="img"
      aria-label={label}
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        background: 'var(--paper-3)',
        border: '1px solid var(--line-soft)',
        borderRadius: 8,
      }}
    >
      {/* week gridlines, every fifth week */}
      {Array.from({ length: WEEKS }, (_, i) => i).map((i) =>
        i % 5 === 0 ? (
          <line
            key={`g${i}`}
            x1={xAt(i)}
            y1={M.t}
            x2={xAt(i)}
            y2={M.t + PH}
            stroke="var(--line-soft)"
            strokeWidth="1"
          />
        ) : null,
      )}

      {/* The trace itself, keyed to the scenario so each swap remounts and the
          mount fade replays. SMIL drives the fade so it needs no book.css; under
          reduced motion the animate is omitted and the trace appears at once. */}
      <g key={scenario.id}>
        {!reduced ? (
          <animate attributeName="opacity" from="0" to="1" dur="0.28s" begin="0s" fill="freeze" />
        ) : null}

        {/* quality — the filled band; the thing the commons exists to hold */}
        <path d={areaPath(quality, Q_LO, Q_HI)} fill="var(--accent-soft)" stroke="none" />
        <polyline
          points={linePts(quality, Q_LO, Q_HI)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* noise — amber line rising as the field silts up */}
        <polyline
          points={linePts(noise, 0, NOISE_HI)}
          fill="none"
          stroke="var(--amber)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeDasharray="1 0"
        />

        {/* cruft — blue line, dead weight the watchers can see */}
        <polyline
          points={linePts(cruft, 0, CRUFT_HI)}
          fill="none"
          stroke="var(--blue)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeDasharray="5 4"
        />

        {/* the steward's incidents, ticked on the week rail */}
        {marks.map((m, k) => (
          <g key={`e${k}`}>
            <line
              x1={xAt(m.week - 1)}
              y1={M.t + PH}
              x2={xAt(m.week - 1)}
              y2={M.t + PH + 8}
              stroke="var(--red)"
              strokeWidth="2"
            />
            <circle cx={xAt(m.week - 1)} cy={M.t + PH + 8} r="2.6" fill="var(--red)">
              <title>{m.text}</title>
            </circle>
          </g>
        ))}
      </g>

      {/* week-rail labels */}
      {[1, 10, 20, 30].map((w) => (
        <text
          key={`w${w}`}
          x={xAt(w - 1)}
          y={M.t + PH + 30}
          fontSize="11"
          fontFamily="var(--font-mono)"
          fill="var(--ink-faint)"
          textAnchor="middle"
        >
          wk {w}
        </text>
      ))}

      {/* legend, top-right */}
      {[
        { c: 'var(--accent)', t: 'quality' },
        { c: 'var(--amber)', t: 'noise' },
        { c: 'var(--blue)', t: 'cruft' },
        { c: 'var(--red)', t: 'incident' },
      ].map((it, k) => (
        <g key={it.t} transform={`translate(${VW - M.r - 280 + k * 72}, ${M.t + 2})`}>
          <rect x="0" y="-7" width="9" height="9" rx="2" fill={it.c} />
          <text
            x="13"
            y="1"
            fontSize="11"
            fontFamily="var(--font-mono)"
            fill="var(--ink-2)"
            dominantBaseline="middle"
          >
            {it.t}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ── Argued feedback (engine-faithful, cites the log, never the answer) ──── */

function Feedback({ scenario, picked }) {
  const actual = scenario.missingPrinciple;
  const log = scenario.tells.join(' ');
  if (picked === actual) {
    return (
      <>
        <strong>{PRINCIPLE_LABELS[actual]}.</strong> That is the fingerprint, and the log carries
        the argument: {log} {SIGNATURES[actual].mechanism}
      </>
    );
  }
  return (
    <>
      <strong>{PRINCIPLE_LABELS[picked]} leaves a different mark.</strong> When it is the missing
      one, {SIGNATURES[picked].absence} Hold that against this log: {log} That is the fingerprint of
      missing {lower(PRINCIPLE_LABELS[actual])}. {SIGNATURES[actual].mechanism}
    </>
  );
}

/* ── The page ───────────────────────────────────────────────────────────── */

export default function P08() {
  const reduced = usePrefersReducedMotion();
  const [idx, setIdx] = useState(0); // pre-load trace 1: the clearest fingerprint
  const [done, setDone] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const scenario = SCENARIOS[idx];
  const isLast = idx === SCENARIOS.length - 1;

  const next = () => {
    if (isLast) {
      setDone(true);
    } else {
      setIdx(idx + 1);
      setRevealed(false);
    }
  };
  const startOver = () => {
    setDone(false);
    setIdx(0);
    setRevealed(false);
  };

  // Drawn once per trace; pure function of the pinned series.
  const scene = useMemo(
    () => <Fingerprint scenario={scenario} reduced={reduced} />,
    [scenario, reduced],
  );

  return (
    <Page
      n={8}
      claim="Shared substrates degrade without governance — not from villainy, from absence."
    >
      <Activity>
        {done ? (
          <div>
            <div className="mh-feedback" role="status">
              Six traces, six fingerprints, no score. The arguments are what you carry.
            </div>
            <table className="mh-table">
              <thead>
                <tr>
                  <th>The fingerprint</th>
                  <th>The missing principle</th>
                </tr>
              </thead>
              <tbody>
                {SCENARIOS.map((s) => (
                  <tr key={s.id}>
                    <td>{RECAP[s.id]}</td>
                    <td>{PRINCIPLE_LABELS[s.missingPrinciple]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-faint)', margin: '0 0 12px' }}>
              Two of the eight never deal here. Rights to organize:{' '}
              <span style={{ color: 'var(--ink-2)' }}>{SIGNATURES.rights.absence}</span> Nested
              enterprises:{' '}
              <span style={{ color: 'var(--ink-2)' }}>{SIGNATURES.nested.absence}</span>
            </p>
            <div className="mh-controls">
              <button type="button" className="mh-btn" onClick={startOver}>
                Run the six again
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mh-kicker" style={{ marginBottom: 8 }}>
              Trace {idx + 1} of {SCENARIOS.length} · 30 weeks · one principle absent · seed pinned
            </div>

            {scene}

            <div style={{ margin: '12px 0 4px' }}>
              <span className="mh-kicker">
                The steward&rsquo;s log{' '}
                <Mark kind="made" note="composite terrain; the emitters are cast" />
              </span>
              <ul
                className="mono"
                style={{
                  margin: '6px 0 0',
                  paddingLeft: 18,
                  fontSize: '12.5px',
                  lineHeight: 1.7,
                  color: 'var(--ink-2)',
                }}
              >
                {scenario.tells.map((tell) => (
                  <li key={tell}>{tell}</li>
                ))}
              </ul>
            </div>

            <Commit
              key={scenario.id}
              prompt="One of Ostrom's eight is absent from this commons. Name it from the shape."
              options={OPTIONS}
              onReveal={() => setRevealed(true)}
            >
              {(picked) => <Feedback scenario={scenario} picked={picked} />}
            </Commit>

            {revealed ? (
              <div className="mh-controls">
                <button type="button" className="mh-btn mh-btn-primary" onClick={next}>
                  {isLast ? 'Close the set' : 'Next trace'}
                </button>
              </div>
            ) : null}
          </div>
        )}

        <ModelNotes
          register="mechanism"
          notes={[
            'Every trace is a real runCommons run, 30 weeks, exactly one principle absent, the seed pinned (101 through 106), so the fingerprint never shifts under you.',
            'Quality is one scalar standing in for "usefulness of what the field holds." No real commons reduces to one number; the shape of the line is the teaching payload, never its value.',
            'All six traces share one scale per line, so the shapes compare honestly from trace to trace.',
            'One principle is absent at a time. Real failures stack: a commons that lost monitoring has usually let sanctions slide too, and stacked fingerprints smear.',
          ]}
          cannotShow="whether Ostrom's principles transfer to software commons at all. The eight are strong evidence from irrigation systems, fisheries, and forests; the mapping onto repositories and signal fields is the framework's working bet, and this engine encodes the bet rather than testing it."
          glass={GLASS}
        />
      </Activity>

      <Seen>
        Nobody set out to wreck the field. Each trace degrades because one rule of the commons was
        simply absent, and the absence leaves a shape a steward can read before the postmortem does.
      </Seen>

      <Takeaway>
        A commons degrades from <strong>absence of governance</strong>, not villainy. Eight
        principles keep it durable; each one missing leaves its own fingerprint on the trace.
      </Takeaway>

      <Deeper title="Ostrom's eight, mapped to the platform">
        <p>
          Every shared substrate is a commons: the repo, the vector store, the eval harness, the
          deploy pipeline, the production namespace. Many actors draw from it and deposit into it,
          and over-use degrades it for all. Elinor Ostrom&rsquo;s field research on common-pool
          resources produced eight principles long-enduring commons share. They translate to
          many-hands platforms almost line for line. <Badge layer="E" />
        </p>
        <table className="mh-table">
          <thead>
            <tr>
              <th>Principle</th>
              <th>On the platform</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Clear boundaries</td>
              <td>Every emitter has an attributable identity; every consumer a stated interest.</td>
            </tr>
            <tr>
              <td>Congruence</td>
              <td>
                Rules fit the resource. High-frequency signals decay faster; high-consequence
                signals need stronger evidence.
              </td>
            </tr>
            <tr>
              <td>Collective choice</td>
              <td>Those affected by a rule can modify it.</td>
            </tr>
            <tr>
              <td>Monitoring</td>
              <td>Watchers are accountable to users, not to a distant authority.</td>
            </tr>
            <tr>
              <td>Graduated sanctions</td>
              <td>
                A first offense is met lighter than a repeated one. Earned autonomy, narrowing
                envelopes after incidents.
              </td>
            </tr>
            <tr>
              <td>Low-cost conflict resolution</td>
              <td>
                If resolving conflict is expensive, conflict will be hidden, and that is worse.
              </td>
            </tr>
            <tr>
              <td>Rights to organize</td>
              <td>
                Teams and sub-platforms keep meaningful local autonomy; overriding every local call
                destroys the local knowledge that made it good.
              </td>
            </tr>
            <tr>
              <td>Nested enterprises</td>
              <td>Large commons are layered commons, each with its own rules at its own scope.</td>
            </tr>
          </tbody>
        </table>
        <p style={{ margin: 0 }}>
          Ignore these and the platform eventually exhibits the tragedy of the commons, not from
          villainy but from absence of governance. Embrace them and it becomes durable the way
          long-lived open-source projects and healthy markets are. Strong evidence: Ostrom&rsquo;s
          work is among the most empirically grounded bodies in the social sciences; the mapping to
          software commons is more recent, but the mechanism is the same. <Badge layer="E" />
        </p>
      </Deeper>

      <Deeper title="The goal, restated (§2.7)">
        <p>
          The goal isn&rsquo;t to build the product. It&rsquo;s to build the conditions under which
          the product gets produced. The engineer&rsquo;s attention moves upstream (the design of
          the terrain, the tuning of signals, the setting of norms, the placement of decisions)
          while the downstream work runs well enough not to demand it back.
        </p>
        <p style={{ margin: 0 }}>That reframes nearly every traditional metric:</p>
        <table className="mh-table">
          <thead>
            <tr>
              <th>Stop measuring</th>
              <th>Measure instead</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Velocity</td>
              <td>Ratio of autonomous to supervised throughput</td>
            </tr>
            <tr>
              <td>Test coverage</td>
              <td>Reversibility of the average change</td>
            </tr>
            <tr>
              <td>Lines of code</td>
              <td>Not really a signal at all</td>
            </tr>
          </tbody>
        </table>
      </Deeper>
    </Page>
  );
}
