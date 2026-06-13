// @vitest-environment jsdom
// smoke.test.jsx — boot the whole book: render <App/> and assert the page
// rail lists every page from the registry. Page bodies are lazy and may
// suspend; the rail plus the registry is the contract this smoke pins.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';

const { act } = React;
import App from '../src/App.jsx';
import { PAGES, GROUPS } from '../src/pages/registry.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom gaps: matchMedia (theme + reduced motion) and scrollIntoView (page seek).
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
  it('renders <App/> without throwing and shows all 19 pages in the rail', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<App />);
    });

    const rail = container.querySelector('#mh-rail');
    expect(rail).toBeTruthy();

    expect(PAGES).toHaveLength(19);
    const links = rail.querySelectorAll('li a[href^="#p-"]');
    expect(links).toHaveLength(PAGES.length);

    const railText = rail.textContent;
    for (const p of PAGES) {
      expect(railText).toContain(p.title);
      const link = rail.querySelector(`a[href="#p-${p.n}"]`);
      expect(link, `rail link for page ${p.n}`).toBeTruthy();
    }

    // Every group appears as a rail group with its registry title.
    const groupTitles = Array.from(rail.querySelectorAll('.mh-rail-group-title')).map(
      (el) => el.textContent,
    );
    expect(groupTitles).toHaveLength(GROUPS.length);
    for (const [i, g] of GROUPS.entries()) {
      expect(groupTitles[i]).toContain(g.title);
    }
  });
});
