// @vitest-environment jsdom
// smoke.test.jsx — boot the whole book: render <App/> and assert the chapter
// rail lists every chapter from the registry. Act bodies are lazy and may
// suspend; the rail plus the registry is the contract this smoke pins.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';

const { act } = React;
import App from '../src/App.jsx';
import { CHAPTERS, ACTS } from '../src/chapters/registry.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom gaps: matchMedia (theme + reduced motion) and scrollIntoView (chapter seek).
window.matchMedia = (query) => ({
  matches: false,
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
});
Element.prototype.scrollIntoView = () => {};

let container;
let root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  window.location.hash = '';
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('smoke: the book boots', () => {
  it('renders <App/> without throwing and shows all 26 chapters in the rail', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<App />);
    });

    const rail = container.querySelector('#mh-rail');
    expect(rail).toBeTruthy();

    expect(CHAPTERS).toHaveLength(26);
    const links = rail.querySelectorAll('li a[href^="#ch-"]');
    expect(links).toHaveLength(CHAPTERS.length);

    const railText = rail.textContent;
    for (const ch of CHAPTERS) {
      expect(railText).toContain(ch.title);
      const link = rail.querySelector(`a[href="#ch-${ch.n}"]`);
      expect(link, `rail link for chapter ${ch.n}`).toBeTruthy();
    }

    // Every act appears as a rail group with its registry title.
    const actTitles = Array.from(rail.querySelectorAll('.mh-rail-act-title')).map(
      (el) => el.textContent,
    );
    expect(actTitles).toHaveLength(ACTS.length);
    for (const [i, a] of ACTS.entries()) {
      expect(actTitles[i]).toContain(a.title);
    }
  });
});
