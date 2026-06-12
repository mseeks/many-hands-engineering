import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

// Gate for JS-driven motion (rAF loops, intervals, autoplay). CSS transitions are
// neutralized globally in book.css; this hook covers what CSS cannot reach.
// Motion the reader explicitly starts (a pressed play button) may keep animating.
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
