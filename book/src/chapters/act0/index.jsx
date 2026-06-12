// Act 0 — The bench itself. The hero stage, the title block, then Ch 0:
// the reading contract installed before any simulation runs.

import Hero from '../../labs/Hero.jsx';
import Ch00 from './Ch00.jsx';

export default function Act0() {
  return (
    <>
      <header className="mh-hero">
        <Hero />
        <h1 className="mh-hero-title">Many Hands</h1>
        <p className="mh-hero-sub" style={{ margin: '0 0 10px' }}>
          The handbook, run.
        </p>
        <p style={{ margin: 0, fontSize: '15.5px', color: 'var(--ink-2)' }}>
          It used to be building the thing. Now it's building the thing that makes the thing.
        </p>
      </header>
      <Ch00 />
    </>
  );
}
