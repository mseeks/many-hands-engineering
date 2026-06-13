// The page grammar, second edition. One page = one activity.
// Prose is rationed by design: a one-sentence claim up top, a one-line
// takeaway at the bottom, captions in between. Handbook depth lives in
// <Deeper> folds, collapsed by default.

import { pageByN } from '../pages/registry.js';

/** Page shell: number chip, title, one-sentence claim, then the activity. */
export function Page({ n, claim, children }) {
  const meta = pageByN(n);
  return (
    <article className="mh-page" id={`p-${n}`} tabIndex={-1}>
      <header className="mh-page-head">
        <div className="mh-page-meta mono">
          <span className="mh-page-num">{String(n).padStart(2, '0')}</span>
          <span>{meta ? `${meta.minutes} min` : ''}</span>
        </div>
        <h2 className="mh-page-title">{meta ? meta.title : ''}</h2>
        {claim ? <p className="mh-claim">{claim}</p> : null}
      </header>
      {children}
    </article>
  );
}

/** The activity container — the centerpiece of every page. */
export function Activity({ children, wide = false }) {
  return <div className={`mh-activity${wide ? ' wide' : ''}`}>{children}</div>;
}

/** One-or-two-sentence caption strip naming what the reader just saw. */
export function Seen({ children }) {
  return <p className="mh-seen">{children}</p>;
}

/** The page's one idea, carried away. */
export function Takeaway({ children }) {
  return (
    <div className="mh-takeaway">
      <span className="mono tag">Takeaway</span>
      <div>{children}</div>
    </div>
  );
}

/** Collapsed depth: the handbook's tables, nuance, and provenance live here. */
export function Deeper({ title = 'From the handbook', children }) {
  return (
    <details className="mh-deeper">
      <summary>{title}</summary>
      <div className="mh-deeper-body">{children}</div>
    </details>
  );
}
