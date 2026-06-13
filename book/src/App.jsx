import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { GROUPS, PAGES, pageByN, pagesInGroup, totalMinutes } from './pages/registry.js';

// One chunk per page; a page is one screen with one activity.
const pageModule = (n) => lazy(() => import(`./pages/P${String(n).padStart(2, '0')}.jsx`));
const PAGE_COMPONENTS = PAGES.map((p) => pageModule(p.n));

function pageFromHash() {
  const m = window.location.hash.match(/p-(\d+)/);
  if (!m) return 0;
  const n = Number(m[1]);
  return PAGES.some((p) => p.n === n) ? n : 0;
}

function useTheme() {
  const [pick, setPick] = useState(() => {
    try {
      const stored = localStorage.getItem('mh-theme');
      return stored === 'light' || stored === 'dark' ? stored : 'system';
    } catch {
      return 'system';
    }
  });
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      const theme = pick === 'system' ? (mq.matches ? 'light' : 'dark') : pick;
      document.documentElement.setAttribute('data-theme', theme);
    };
    apply();
    mq.addEventListener('change', apply);
    try {
      if (pick === 'system') localStorage.removeItem('mh-theme');
      else localStorage.setItem('mh-theme', pick);
    } catch {
      /* private browsing: the pick just doesn't persist */
    }
    return () => mq.removeEventListener('change', apply);
  }, [pick]);
  const cycle = () =>
    setPick((p) => (p === 'system' ? 'light' : p === 'light' ? 'dark' : 'system'));
  return [pick, cycle];
}

export default function App() {
  const [active, setActive] = useState(pageFromHash);
  const [navOpen, setNavOpen] = useState(false);
  const [pick, cycleTheme] = useTheme();
  const meta = pageByN(active);
  const Body = PAGE_COMPONENTS[active];

  const go = useCallback((n) => {
    setActive(n);
    setNavOpen(false);
    window.history.pushState(null, '', `#p-${n}`);
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => {
      const el = document.getElementById(`p-${n}`);
      if (el) el.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    const onPop = () => {
      setActive(pageFromHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
    };
  }, []);

  useEffect(() => {
    document.title = meta ? `${meta.title} · Many Hands` : 'Many Hands';
  }, [meta]);

  return (
    <div className="mh-root">
      <header className="mh-topbar">
        <button
          type="button"
          className="mh-ghostbtn mh-nav-toggle"
          aria-expanded={navOpen}
          aria-controls="mh-rail"
          onClick={() => setNavOpen((v) => !v)}
        >
          Contents
        </button>
        <a
          className="mh-wordmark"
          href="#p-0"
          onClick={(e) => {
            e.preventDefault();
            go(0);
          }}
        >
          Many Hands
        </a>
        <span className="mh-topbar-pos mono">
          {String(active).padStart(2, '0')} / {PAGES.length - 1}
        </span>
        <button
          type="button"
          className="mh-ghostbtn"
          onClick={cycleTheme}
          aria-label={`Theme: ${pick}. Activate to change.`}
        >
          {pick === 'system' ? 'Auto' : pick === 'light' ? 'Light' : 'Dark'}
        </button>
      </header>

      <nav id="mh-rail" className={`mh-rail${navOpen ? ' open' : ''}`} aria-label="Pages">
        <p className="mh-rail-head mono">
          The handbook, run · ~{Math.round(totalMinutes / 5) * 5} min
        </p>
        {GROUPS.map((g) => (
          <div key={g.id} className="mh-rail-group">
            <p className="mh-rail-group-title mono">{g.title}</p>
            <ul>
              {pagesInGroup(g.id).map((p) => (
                <li key={p.n}>
                  <a
                    href={`#p-${p.n}`}
                    aria-current={p.n === active ? 'true' : undefined}
                    className={p.n === active ? 'active' : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      go(p.n);
                    }}
                  >
                    <span className="mono mh-rail-n">{String(p.n).padStart(2, '0')}</span>
                    <span>{p.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <main className="mh-main">
        <Suspense fallback={<div className="mh-loading mono">setting the bench…</div>}>
          <Body />
        </Suspense>
        <nav className="mh-pagenav" aria-label="Previous and next page">
          {active > 0 ? (
            <button type="button" className="mh-btn" onClick={() => go(active - 1)}>
              ← {pageByN(active - 1).title}
            </button>
          ) : (
            <span />
          )}
          {active < PAGES.length - 1 ? (
            <button type="button" className="mh-btn mh-btn-primary" onClick={() => go(active + 1)}>
              {pageByN(active + 1).title} →
            </button>
          ) : (
            <span />
          )}
        </nav>
      </main>
    </div>
  );
}
