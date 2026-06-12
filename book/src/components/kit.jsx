// kit.jsx — the book's component grammar, one barrel.
// Every chapter and lab renders through these. The contracts are frozen in
// STYLEGUIDE.md ("Component contracts"); do not add required props. All
// classes come from book.css; anything beyond them is minimal inline style.

import React from 'react';
import { chapterById } from '../chapters/registry.js';
import { usePrefersReducedMotion } from '../shared/usePrefersReducedMotion.js';
import { glossaryEntry } from './glossary.js';

// The eslint config runs the classic-runtime React rules (react-in-jsx-scope),
// while Vite compiles with the automatic runtime. Destructuring the hooks off
// the default import satisfies both: React is in scope and genuinely used.
const { useEffect, useState } = React;

/* ── Chapter grammar ─────────────────────────────────────────────────── */

export function Chapter({ n, covers, children }) {
  const meta = chapterById(n) ?? { title: '', minutes: 0 };
  return (
    <section className="mh-chapter" id={`ch-${n}`} tabIndex={-1}>
      <div className="mh-ch-eyebrow">
        <span>
          CH {String(n).padStart(2, '0')} · {meta.minutes} MIN
        </span>
        {covers ? <span className="covers">COVERS {covers}</span> : null}
      </div>
      <h2 className="mh-ch-title">{meta.title}</h2>
      {children}
    </section>
  );
}

export function Lede({ children }) {
  return <p className="mh-lede">{children}</p>;
}

export function Pull({ badge, children }) {
  return (
    <blockquote className="mh-pull" style={{ marginLeft: 0, marginRight: 0 }}>
      {children}
      {badge ? (
        <>
          {' '}
          <Badge layer={badge} />
        </>
      ) : null}
    </blockquote>
  );
}

export function DecisionCard({ title, items }) {
  return (
    <aside className="mh-decision" aria-label={title}>
      <span className="mh-kicker">{title}</span>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}

export function Coda({ line, next }) {
  return (
    <div className="mh-coda">
      <div className="mh-kicker">The one idea</div>
      <p style={{ margin: 0, color: 'var(--ink)' }}>{line}</p>
      {next ? (
        <p style={{ margin: '8px 0 0', fontSize: '13.5px', color: 'var(--ink-faint)' }}>
          Next: {next}
        </p>
      ) : null}
    </div>
  );
}

/* ── Epistemic grammar ───────────────────────────────────────────────── */

const LAYERS = {
  E: { glyph: 'Ⓔ', name: 'evidence-backed' },
  W: { glyph: 'Ⓦ', name: 'working design principle' },
  M: { glyph: 'Ⓜ', name: 'organizing metaphor' },
};

export function Badge({ layer, note }) {
  const meta = LAYERS[layer];
  if (!meta) return null;
  const tip = note ? `${meta.name}: ${note}` : meta.name;
  return (
    <span className={`mh-badge mh-badge-${layer.toLowerCase()}`} title={tip} aria-label={tip}>
      {meta.glyph}
    </span>
  );
}

const MARKS = {
  real: { glyph: '●', name: 'documented-real' },
  made: { glyph: '○', name: 'constructed-for-teaching' },
};

export function Mark({ kind, note }) {
  const meta = MARKS[kind];
  if (!meta) return null;
  const tip = note ? `${meta.name}: ${note}` : meta.name;
  return (
    <span className={`mh-mark mh-mark-${kind}`} title={tip} aria-label={tip}>
      {meta.glyph}
    </span>
  );
}

export function Term({ id, children }) {
  const entry = glossaryEntry(id);
  if (!entry) return <span>{children ?? id}</span>;
  const tip = entry.analog ? `${entry.definition} Analog: ${entry.analog}` : entry.definition;
  return (
    <span className="mh-term" title={tip}>
      {children ?? entry.term}
    </span>
  );
}

const SPECIMEN_BANNER =
  'N=1: one fleet, ~7 small repos, ~30 PRs, a local judge model — feasibility evidence, ' +
  'not at-scale proof.';

export function FieldSpecimen({ source, banner, children }) {
  return (
    <figure className="mh-specimen">
      <figcaption className="mh-specimen-head">
        <span>
          Field specimen <Mark kind="real" />
        </span>
        <span>{source}</span>
        <span className="mh-specimen-banner">{banner ?? SPECIMEN_BANNER}</span>
      </figcaption>
      {children}
    </figure>
  );
}

/* ── The glass law ───────────────────────────────────────────────────── */

/**
 * Slice a `?raw` engine import down to one function for the glass flap.
 * Returns from the start of the line containing `startMarker` through the
 * end of the line containing `endMarker`. Missing markers fall back to
 * showing more, never less: the glass law prefers too much source to none.
 *
 * @param {string} rawSource
 * @param {string} startMarker
 * @param {string} endMarker
 * @returns {string}
 */
export function glassSlice(rawSource, startMarker, endMarker) {
  const at = rawSource.indexOf(startMarker);
  if (at === -1) return rawSource;
  const from = rawSource.lastIndexOf('\n', at) + 1;
  const endAt = rawSource.indexOf(endMarker, at + startMarker.length);
  if (endAt === -1) return rawSource.slice(from);
  const lineEnd = rawSource.indexOf('\n', endAt + endMarker.length);
  return rawSource.slice(from, lineEnd === -1 ? rawSource.length : lineEnd);
}

export function ModelNotes({ register, notes, cannotShow, glass }) {
  return (
    <details className="mh-notes">
      <summary>{register ? `Model notes · ${register} register` : 'Model notes'}</summary>
      <div className="mh-notes-body">
        {notes && notes.length ? (
          <ul style={{ margin: '0 0 10px', paddingLeft: 18 }}>
            {notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        ) : null}
        {cannotShow ? (
          <p className="cannot" style={{ margin: 0 }}>
            What this cannot show: {cannotShow}
          </p>
        ) : null}
        {glass ? (
          <div className="mh-glass">
            <span className="mh-kicker" style={{ display: 'block', marginTop: 10 }}>
              The glass · engine source, verbatim
            </span>
            <pre>
              <code>{glass}</code>
            </pre>
          </div>
        ) : null}
      </div>
    </details>
  );
}

export function LabFrame({ tag, register, question, payoff, notes, cannotShow, glass, children }) {
  return (
    <section className="mh-labframe" aria-label={tag}>
      <div className="mh-lab-tag">
        <span>{tag}</span>
        {register ? <span className="register">{register} register</span> : null}
      </div>
      {question ? <p className="mh-lab-q">{question}</p> : null}
      {children}
      {payoff ? (
        <div className="mh-payoff">
          <span className="mh-kicker" style={{ display: 'block', marginBottom: 4 }}>
            The payoff
          </span>
          {payoff}
        </div>
      ) : null}
      <ModelNotes register={register} notes={notes} cannotShow={cannotShow} glass={glass} />
    </section>
  );
}

/* ── Commitment grammar ──────────────────────────────────────────────── */

// Commit-before-reveal. The commitment is final: once a chip is chosen the
// others disable, `onReveal(id)` fires once, and `children(id)` renders as
// argued feedback. No reveal without a commitment; no scoring anywhere.
export function Commit({ prompt, options, onReveal, children }) {
  const [picked, setPicked] = useState(null);
  const choose = (id) => {
    if (picked !== null) return;
    setPicked(id);
    if (onReveal) onReveal(id);
  };
  return (
    <div className="mh-commit">
      <span className="mh-kicker">Predict first</span>
      <p style={{ margin: '0 0 10px' }}>{prompt}</p>
      <div className="mh-chipset" role="group" aria-label={prompt}>
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className="mh-chip"
            aria-pressed={picked === opt.id}
            disabled={picked !== null && picked !== opt.id}
            onClick={() => choose(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {picked !== null ? (
        <div className="mh-feedback">
          {typeof children === 'function' ? children(picked) : children}
        </div>
      ) : null}
    </div>
  );
}

/* ── Recorded runs ───────────────────────────────────────────────────── */

const PLAY_INTERVAL_MS = 1400;

// Stepper over a replay.js Trace. Captions for every step stay visible; the
// current step wears `.now`. Play is gated by the reduced-motion hook: under
// reduced motion the button disappears and stepping is manual.
export function Walkthrough({ trace, renderStep }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = usePrefersReducedMotion();
  const steps = trace?.steps ?? [];
  const last = steps.length - 1;

  useEffect(() => {
    if (!playing || reduced) return undefined;
    if (i >= last) {
      setPlaying(false);
      return undefined;
    }
    const t = setTimeout(() => setI(i + 1), PLAY_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [playing, reduced, i, last]);

  if (!steps.length) return null;

  const togglePlay = () => {
    if (!playing && i >= last) setI(0);
    setPlaying((p) => !p);
  };

  return (
    <div className="mh-trace">
      <div className="mh-controls">
        <button
          type="button"
          className="mh-btn"
          onClick={() => setI(Math.max(0, i - 1))}
          disabled={i === 0}
          aria-label="Previous step"
        >
          Prev
        </button>
        <button
          type="button"
          className="mh-btn"
          onClick={() => setI(Math.min(last, i + 1))}
          disabled={i === last}
          aria-label="Next step"
        >
          Next
        </button>
        {!reduced ? (
          <button
            type="button"
            className="mh-btn"
            onClick={togglePlay}
            aria-pressed={playing}
            aria-label={playing ? 'Pause the recorded run' : 'Play the recorded run'}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
        ) : null}
        <span className="mh-kicker" aria-live="polite">
          Step {i + 1} of {steps.length}
        </span>
      </div>
      {renderStep ? <div style={{ margin: '8px 0' }}>{renderStep(steps[i])}</div> : null}
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {steps.map((step, k) => (
          <li
            key={k}
            className={k === i ? 'mh-trace-step now' : 'mh-trace-step'}
            aria-current={k === i ? 'step' : undefined}
          >
            <span className="idx">{k + 1}</span>
            <span className="cap">
              <strong>{step.label}.</strong> {step.caption}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Artifact({ lines }) {
  return (
    <div className="mh-artifact">
      {lines.map((line) => (
        <div key={line.no} className={line.hot ? 'ln hot' : 'ln'}>
          <span className="no">{line.no}</span>
          <span className={line.kind}>
            {line.text}
            {line.annot ? <span className="comment"> ← {line.annot}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Placement and drills ────────────────────────────────────────────── */

// Grid order is the contract: planned (top-left), emergent-spec (top-right),
// danger (bottom-left), emergent-explore (bottom-right).
const QUADRANTS = [
  { id: 'planned', label: 'Planned' },
  { id: 'emergent-spec', label: 'Emergent (specified)' },
  { id: 'danger', label: 'Danger zone' },
  { id: 'emergent-explore', label: 'Emergent (exploratory)' },
];

export function Quadrant({ value, onChange }) {
  return (
    <div style={{ maxWidth: 540, margin: '14px auto' }}>
      <div className="mh-kicker" style={{ textAlign: 'center' }}>
        Well-specified
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          gap: 8,
          margin: '6px 0',
        }}
      >
        <span
          className="mh-kicker"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Irreversible
        </span>
        <div
          className="mh-quadrant"
          style={{ margin: 0, maxWidth: 'none' }}
          role="group"
          aria-label="Placement quadrant: irreversible to reversible across, well-specified to exploratory down"
        >
          {QUADRANTS.map((q) => {
            const cls = [q.id === 'danger' ? 'danger' : '', value === q.id ? 'selected' : '']
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={q.id}
                type="button"
                className={cls || undefined}
                aria-pressed={value === q.id}
                onClick={() => onChange && onChange(q.id)}
              >
                {q.label}
              </button>
            );
          })}
        </div>
        <span className="mh-kicker" style={{ writingMode: 'vertical-rl' }}>
          Reversible
        </span>
      </div>
      <div className="mh-kicker" style={{ textAlign: 'center' }}>
        Exploratory
      </div>
    </div>
  );
}

// Sequential case player over cases.js shapes. Commitment is clicks only;
// feedback argues from the evidence; contested cases say so; progress is a
// quiet "case k of n" — no scores, no streaks.
export function Drill({ cases, title }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const n = cases.length;

  if (idx >= n) {
    return (
      <div className="mh-feedback" role="status">
        That's the set: {n} {n === 1 ? 'case' : 'cases'}. No score; the arguments are what you
        carry.
      </div>
    );
  }

  const c = cases[idx];
  const commitPick = (id) => {
    if (picked === null) setPicked(id);
  };
  const next = () => {
    setPicked(null);
    setIdx(idx + 1);
  };

  return (
    <div className="mh-commit" role="group" aria-label={title ?? 'Drill'}>
      <span className="mh-kicker">
        {title ? `${title} · ` : ''}Case {idx + 1} of {n}
      </span>
      {c.surface ? (
        <p
          className="mono"
          style={{ margin: '0 0 4px', fontSize: '12.5px', color: 'var(--ink-faint)' }}
        >
          {c.surface}
        </p>
      ) : null}
      <p style={{ margin: '0 0 8px' }}>{c.prompt}</p>
      {c.evidence && c.evidence.length ? (
        <ul style={{ margin: '0 0 10px', paddingLeft: 18, fontSize: '14.5px' }}>
          {c.evidence.map((ev) => (
            <li key={ev.label}>
              <strong>{ev.label}.</strong> {ev.text}
            </li>
          ))}
        </ul>
      ) : null}
      {c.quadrant ? (
        <Quadrant value={picked} onChange={commitPick} />
      ) : (
        <div className="mh-chipset" role="group" aria-label={c.prompt}>
          {(c.options ?? []).map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="mh-chip"
              aria-pressed={picked === opt.id}
              disabled={picked !== null && picked !== opt.id}
              onClick={() => commitPick(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {picked !== null ? (
        <div className="mh-feedback">
          {c.contested ? (
            <span
              className="mh-kicker"
              style={{ display: 'block', marginBottom: 6, color: 'var(--amber)' }}
            >
              Contested call
            </span>
          ) : null}
          {c.feedback?.[picked]}
          <div className="mh-controls" style={{ margin: '10px 0 0' }}>
            <button type="button" className="mh-btn mh-btn-primary" onClick={next}>
              {idx + 1 < n ? 'Next case' : 'Finish'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
