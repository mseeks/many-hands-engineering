import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ACTS, CHAPTERS, actOfChapter, chaptersInAct, totalMinutes } from './chapters/registry.js';

// One chunk per act so the book's first paint stays light.
const actModule = (k) => lazy(() => import(`./chapters/act${k}/index.jsx`));
const ACT_COMPONENTS = ACTS.map((a) => actModule(a.act));

function chapterFromHash() {
  const m = window.location.hash.match(/ch-(\d+)/);
  if (!m) return 0;
  const n = Number(m[1]);
  return CHAPTERS.some((ch) => ch.n === n) ? n : 0;
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
      /* private browsing: theme just doesn't persist */
    }
    return () => mq.removeEventListener('change', apply);
  }, [pick]);
  const cycle = () =>
    setPick((p) => (p === 'system' ? 'light' : p === 'light' ? 'dark' : 'system'));
  return [pick, cycle];
}

function useReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = document.documentElement;
        const max = el.scrollHeight - el.clientHeight;
        setPct(max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 0);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return pct;
}

export default function App() {
  const [activeChapter, setActiveChapter] = useState(chapterFromHash);
  const [navOpen, setNavOpen] = useState(false);
  const [pick, cycleTheme] = useTheme();
  const progress = useReadingProgress();
  const mainRef = useRef(null);
  const activeAct = actOfChapter(activeChapter);
  const ActBody = ACT_COMPONENTS[activeAct];

  const go = useCallback((n) => {
    setActiveChapter(n);
    setNavOpen(false);
    window.history.pushState(null, '', `#ch-${n}`);
  }, []);

  // Browser back/forward: the hash is the single source of truth.
  useEffect(() => {
    const onPop = () => setActiveChapter(chapterFromHash());
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
    };
  }, []);

  // After the act mounts, land on the requested chapter.
  useEffect(() => {
    const id = `ch-${activeChapter}`;
    let tries = 0;
    const seek = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ block: 'start' });
        el.focus({ preventScroll: true });
      } else if (tries++ < 40) {
        setTimeout(seek, 50);
      }
    };
    seek();
  }, [activeChapter, activeAct]);

  // While the reader scrolls inside an act, keep the rail and hash current.
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('.mh-chapter'));
    if (!sections.length || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (!hit) return;
        const n = Number(hit.target.id.replace('ch-', ''));
        if (!Number.isNaN(n)) {
          setActiveChapter((prev) => (prev === n ? prev : n));
          window.history.replaceState(null, '', `#ch-${n}`);
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [activeAct]);

  const doc = useMemo(() => CHAPTERS.find((c) => c.n === activeChapter), [activeChapter]);
  useEffect(() => {
    document.title = doc ? `${doc.title} · Many Hands` : 'Many Hands — the handbook, run';
  }, [doc]);

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return (
    <div className="mh-root">
      <div className="mh-progress" aria-hidden="true">
        <div className="mh-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <header className="mh-topbar">
        <button
          type="button"
          className="mh-nav-toggle"
          aria-expanded={navOpen}
          aria-controls="mh-rail"
          onClick={() => setNavOpen((v) => !v)}
        >
          Contents
        </button>
        <a className="mh-wordmark" href="#ch-0" onClick={() => go(0)}>
          Many Hands
        </a>
        <button
          type="button"
          className="mh-theme-toggle"
          onClick={cycleTheme}
          aria-label={`Theme: ${pick}. Activate to change.`}
        >
          {pick === 'system' ? 'System' : pick === 'light' ? 'Light' : 'Dark'}
        </button>
      </header>

      <nav id="mh-rail" className={`mh-rail${navOpen ? ' open' : ''}`} aria-label="Chapters">
        <div className="mh-rail-head">
          <span className="mh-eyebrow">Sullivan · 2026 · The handbook, run</span>
          <span className="mh-rail-total">
            {hours}h{mins ? ` ${mins}m` : ''} · ⚡ marks the fast path
          </span>
        </div>
        {ACTS.map((a) => (
          <div key={a.act} className="mh-rail-act">
            <div className="mh-rail-act-title">
              <span className="mh-rail-act-num">Act {['0', 'I', 'II', 'III', 'IV'][a.act]}</span>
              {a.title}
            </div>
            <ul>
              {chaptersInAct(a.act).map((ch) => (
                <li key={ch.n}>
                  <a
                    href={`#ch-${ch.n}`}
                    aria-current={ch.n === activeChapter ? 'true' : undefined}
                    className={ch.n === activeChapter ? 'active' : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      go(ch.n);
                    }}
                  >
                    <span className="mh-rail-n">{ch.n}</span>
                    <span className="mh-rail-title">{ch.title}</span>
                    <span className="mh-rail-min">
                      {ch.fast ? '⚡' : ''}
                      {ch.minutes}m
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <main ref={mainRef} className="mh-main" aria-label={doc ? doc.title : 'Many Hands'}>
        <Suspense fallback={<div className="mh-loading">Setting the bench…</div>}>
          <ActBody />
        </Suspense>
        <footer className="mh-footer">
          <ActFooter act={activeAct} onGo={go} />
        </footer>
      </main>
    </div>
  );
}

function ActFooter({ act, onGo }) {
  const prev = act > 0 ? chaptersInAct(act - 1).at(-1) : null;
  const next = act < ACTS.length - 1 ? chaptersInAct(act + 1)[0] : null;
  return (
    <div className="mh-actnav">
      {prev ? (
        <a
          href={`#ch-${prev.n}`}
          onClick={(e) => {
            e.preventDefault();
            onGo(prev.n);
          }}
        >
          ← {ACTS[act - 1].title}
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a
          href={`#ch-${next.n}`}
          onClick={(e) => {
            e.preventDefault();
            onGo(next.n);
          }}
        >
          {ACTS[act + 1].title} →
        </a>
      ) : (
        <span />
      )}
    </div>
  );
}
