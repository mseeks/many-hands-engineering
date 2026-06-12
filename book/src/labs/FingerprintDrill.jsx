// LAB 07·A — The fingerprint drill (Ch 7, mechanism register).
// Reverse inference on fingerprintScenarios(): the reader is shown a
// degradation trace (quality / noise / cruft over 30 weeks, plus the
// steward's log) and names the missing Ostrom principle. No principle
// toggles anywhere: governance is not a switch. The traces are prepared,
// deterministic runCommons runs with exactly one principle absent.

import { useState } from 'react';
import { LabFrame, Commit, Mark, glassSlice } from '../components/kit.jsx';
import { fingerprintScenarios, PRINCIPLE_LABELS } from '../engine/commons.js';
import commonsRaw from '../engine/commons.js?raw';

const SCENARIOS = fingerprintScenarios();

// runCommons is the physics: every distortion the drill asks the reader to
// recognize is a branch in this one function. glassSlice ends at the return
// line, so the closing brace (the literal next line of source) is appended.
const GLASS =
  glassSlice(commonsRaw, 'export function runCommons', 'return { series, events };') + '\n}';

// One shared scale per line across all six traces, so shapes compare
// honestly from trace to trace.
const allValues = (key) => SCENARIOS.flatMap((s) => s.series[key]);
const QUALITY_LO = Math.max(0, Math.min(...allValues('quality')) - 0.04);
const QUALITY_HI = Math.min(1, Math.max(...allValues('quality')) + 0.04);
const NOISE_HI = Math.max(...allValues('noise')) * 1.08;
const CRUFT_HI = Math.max(...allValues('cruft')) * 1.08;

// What each principle's absence looks like on the trace. Written to
// discriminate the near-misses: boundaries vs congruence are both noise
// climbs (flood from week one vs slow silting), monitoring vs collective
// choice are both cruft stories (invisible-then-cliff vs visible all run),
// sanctions vs conflict are both oscillations (4-week steps from one named
// emitter vs a 1-week saw with nobody named).
const SIGNATURES = {
  boundaries: {
    absence:
      'junk arrives signed by nobody and walks straight in: noise climbs from the first week ' +
      'and never comes back, and quality stalls near 0.74 where a clean commons settles at ' +
      '0.84, pinned under the flood with no steps, no cliff, and no offender to name.',
    mechanism:
      'Attribution is the door filter. With every emitter identifiable and every consumer ' +
      'holding a stated interest, most junk is stopped at the boundary; remove the identities ' +
      'and the filter has nothing to hold onto.',
  },
  congruence: {
    absence:
      'nothing fades at the rate it should: noise climbs slowly and is still climbing at week ' +
      "30, a week-old status outranks this morning's failure, and the occasional " +
      'high-consequence call clears on one weak datapoint.',
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
      "Watchers accountable to the field's users surface rot as visible cruft while it is " +
      'still cheap to eat. Without them the rot accrues anyway; only its visibility changed.',
  },
  sanctions: {
    absence:
      'the trace becomes a metronome: quality falls in evenly spaced steps, partly recovers ' +
      'between them, and every incident in the log names the same emitter.',
    mechanism:
      'Graduated response is what makes a second offense different from a first. When the ' +
      'penalty never escalates, re-offending becomes a schedule.',
  },
  conflict: {
    absence:
      'the trace becomes a saw: quality flips direction on a one-week period while conventions ' +
      'flip overnight with no thread and no decision record.',
    mechanism:
      'When resolving conflict openly is expensive, the conflict goes underground, and two ' +
      'factions overwriting each other in silence churn the commons worse than any open ' +
      'argument would.',
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

// One-line fingerprint per prepared trace, for the closing recap.
const RECAP = {
  'unsigned-flood': 'Noise climbs from week one; the junk is signed by nobody',
  'repeat-offender': 'Evenly spaced quality steps; every incident names the same emitter',
  'silent-rot': 'Healthy lines, an empty log, then a cliff',
  'nothing-fades': 'Noise still climbing at week 30; stale outranks fresh',
  'overnight-flips': 'A one-week saw; conventions flip with no decision record',
  'workaround-pileup': 'Cruft climbs all run; the rulebook never changes',
};

const OPTIONS = Object.entries(PRINCIPLE_LABELS).map(([id, label]) => ({ id, label }));

const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

function Sparkline({ label, values, lo, hi, color, fmt, extreme }) {
  const W = 200;
  const H = 56;
  const P = 4;
  const n = values.length;
  const span = hi - lo || 1;
  const points = values
    .map((v, i) => {
      const x = P + (i * (W - 2 * P)) / (n - 1);
      const y = H - P - ((Math.min(Math.max(v, lo), hi) - lo) / span) * (H - 2 * P);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const first = values[0];
  const last = values[n - 1];
  const peak = Math.max(...values);
  const low = Math.min(...values);
  const ext = extreme === 'min' ? `low ${fmt(low)}` : `peak ${fmt(peak)}`;
  return (
    <div style={{ display: 'grid', gap: 3 }}>
      <span className="mh-kicker">{label}</span>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${label} over ${n} weeks: starts at ${fmt(first)}, ${ext}, ends at ${fmt(last)}`}
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--line-soft)',
          borderRadius: 3,
        }}
      >
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
      <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>
        wk 1 {fmt(first)} · {ext} · wk {n} {fmt(last)}
      </span>
    </div>
  );
}

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

export default function FingerprintDrill() {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

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

  return (
    <LabFrame
      tag="LAB 07·A — THE FINGERPRINT DRILL"
      register="mechanism"
      question="Six commons, each degrading for a different reason. You arrive after the fact; all you have is the trace and the log. Can you name the missing principle from the shape of the damage alone?"
      payoff="Each absent principle leaves its own fingerprint. Unattributable junk from week one means boundaries are off. One emitter re-offending on a schedule means sanctions never graduate. A cliff with an empty log behind it means monitoring is gone. Governance failures are diagnosable from the trace, so a steward can read which rule is missing before the postmortem says so."
      notes={[
        'Every trace is a real runCommons run, 30 weeks, with exactly one principle absent and the seed pinned (101 through 106), so the traces never shift under you.',
        'Constants are tuned so each fingerprint is findable inside a 30-week window: the junk inflow, the decay rates, the every-fourth-week repeat offender, the hidden-rot threshold of 24. Real commons degrade on slower, messier clocks.',
        'Quality is one scalar standing in for "usefulness of what the field holds." No real commons reduces to one number; the shape of the line is the teaching payload, never its value.',
        'All six traces share one scale per line, so shapes compare honestly from trace to trace.',
        'One principle is absent at a time. Real failures stack: a commons that lost monitoring has usually let sanctions slide too, and stacked fingerprints smear.',
      ]}
      cannotShow="whether Ostrom's principles transfer to software commons at all. The eight are strong evidence from irrigation systems, fisheries, and forests; the mapping onto repositories and signal fields is the framework's working bet, and this engine encodes the bet rather than testing it."
      glass={GLASS}
    >
      {done ? (
        <div>
          <div className="mh-feedback" role="status">
            That's the set: six traces, six fingerprints, no score. The arguments are what you
            carry.
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
          <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', margin: '0 0 12px' }}>
            Two of the eight never appeared. When rights to organize is the absent one,{' '}
            {SIGNATURES.rights.absence} When nested enterprises is the absent one,{' '}
            {SIGNATURES.nested.absence}
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
          <div
            role="group"
            aria-label={`Degradation trace ${idx + 1} of ${SCENARIOS.length}`}
            style={{ display: 'flex', gap: 14, flexWrap: 'wrap', margin: '0 0 10px' }}
          >
            <Sparkline
              label="Quality"
              values={scenario.series.quality}
              lo={QUALITY_LO}
              hi={QUALITY_HI}
              color="var(--accent)"
              fmt={(v) => v.toFixed(2)}
              extreme="min"
            />
            <Sparkline
              label="Noise"
              values={scenario.series.noise}
              lo={0}
              hi={NOISE_HI}
              color="var(--amber)"
              fmt={(v) => v.toFixed(2)}
              extreme="max"
            />
            <Sparkline
              label="Cruft (items)"
              values={scenario.series.cruft}
              lo={0}
              hi={CRUFT_HI}
              color="var(--blue)"
              fmt={(v) => v.toFixed(1)}
              extreme="max"
            />
          </div>
          <div style={{ margin: '0 0 12px' }}>
            <span className="mh-kicker">
              The steward's log <Mark kind="made" note="composite terrain; the emitters are cast" />
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
            prompt="One of Ostrom's eight principles is absent from this commons. Name it from the trace."
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
    </LabFrame>
  );
}
