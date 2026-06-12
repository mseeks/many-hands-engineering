// @vitest-environment jsdom
// kit.test.jsx — render-and-assert basics for the component kit.
// No testing-library in this project: render via react-dom/client inside
// React's act(), drive controls with real DOM events.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';

// The eslint config runs the classic-runtime react-in-jsx-scope rule;
// pulling act off the default import keeps React in scope and used.
const { act } = React;
import {
  Chapter,
  Commit,
  Walkthrough,
  Drill,
  Quadrant,
  Term,
  glassSlice,
} from '../src/components/kit.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no matchMedia; usePrefersReducedMotion needs a stub. The flag is
// mutable so individual tests can flip reduced motion on.
let reducedMotion = false;
window.matchMedia = (query) => ({
  matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
});

let container;
let root;

beforeEach(() => {
  reducedMotion = false;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(ui) {
  act(() => {
    root.render(ui);
  });
}

function click(el) {
  act(() => {
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

function byText(selector, text) {
  return Array.from(container.querySelectorAll(selector)).find((el) =>
    el.textContent.includes(text),
  );
}

describe('Chapter', () => {
  it('renders the section wrapper, registry eyebrow, and registry title', () => {
    render(
      <Chapter n={5} covers="§2.3">
        <p>Body prose.</p>
      </Chapter>,
    );
    const sec = container.querySelector('section.mh-chapter');
    expect(sec).not.toBeNull();
    expect(sec.id).toBe('ch-5');
    expect(sec.tabIndex).toBe(-1);
    expect(sec.querySelector('h2.mh-ch-title').textContent).toBe('Placement');
    const eyebrow = sec.querySelector('.mh-ch-eyebrow');
    expect(eyebrow.textContent).toContain('CH 05');
    expect(eyebrow.textContent).toContain('14 MIN');
    expect(eyebrow.querySelector('.covers').textContent).toBe('COVERS §2.3');
    expect(sec.textContent).toContain('Body prose.');
  });
});

describe('Commit', () => {
  const options = [
    { id: 'review', label: 'Review cost' },
    { id: 'defects', label: 'Defects' },
  ];

  it('shows no feedback and fires no reveal before a commitment', () => {
    const onReveal = vi.fn();
    render(
      <Commit prompt="Which line moves first?" options={options} onReveal={onReveal}>
        {(id) => <span>You committed to {id}.</span>}
      </Commit>,
    );
    expect(container.querySelector('.mh-feedback')).toBeNull();
    expect(onReveal).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Predict first');
  });

  it('reveals children(id) once an option is chosen, and the commitment is final', () => {
    const onReveal = vi.fn();
    render(
      <Commit prompt="Which line moves first?" options={options} onReveal={onReveal}>
        {(id) => <span>You committed to {id}.</span>}
      </Commit>,
    );
    click(byText('button', 'Review cost'));
    expect(onReveal).toHaveBeenCalledExactlyOnceWith('review');
    expect(container.querySelector('.mh-feedback').textContent).toContain(
      'You committed to review.',
    );
    // The other chip is disabled; clicking it changes nothing.
    const other = byText('button', 'Defects');
    expect(other.disabled).toBe(true);
    click(other);
    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.mh-feedback').textContent).toContain(
      'You committed to review.',
    );
  });
});

describe('Walkthrough', () => {
  const trace = {
    seed: 7,
    steps: [
      { label: 'signal', caption: 'The staleness marker fires.', data: {} },
      { label: 'action', caption: 'The loop opens a bounded PR.', data: {} },
      { label: 'verification', caption: 'CI runs the full suite.', data: {} },
    ],
  };
  const now = () => container.querySelector('.mh-trace-step.now');

  it('starts on step one with every caption visible', () => {
    render(<Walkthrough trace={trace} />);
    expect(now().textContent).toContain('The staleness marker fires.');
    // Captions always visible, not just the current one.
    expect(container.textContent).toContain('The loop opens a bounded PR.');
    expect(container.textContent).toContain('CI runs the full suite.');
    expect(byText('button', 'Prev').disabled).toBe(true);
    expect(byText('button', 'Play')).toBeDefined();
  });

  it('advances and rewinds the current caption with Next and Prev', () => {
    render(<Walkthrough trace={trace} />);
    click(byText('button', 'Next'));
    expect(now().textContent).toContain('The loop opens a bounded PR.');
    click(byText('button', 'Next'));
    expect(now().textContent).toContain('CI runs the full suite.');
    expect(byText('button', 'Next').disabled).toBe(true);
    click(byText('button', 'Prev'));
    expect(now().textContent).toContain('The loop opens a bounded PR.');
  });

  it('passes the current step to renderStep', () => {
    render(<Walkthrough trace={trace} renderStep={(s) => <em>snapshot: {s.label}</em>} />);
    expect(container.textContent).toContain('snapshot: signal');
    click(byText('button', 'Next'));
    expect(container.textContent).toContain('snapshot: action');
  });

  it('drops Play under reduced motion; manual stepping still works', () => {
    reducedMotion = true;
    render(<Walkthrough trace={trace} />);
    expect(byText('button', 'Play')).toBeUndefined();
    click(byText('button', 'Next'));
    expect(now().textContent).toContain('The loop opens a bounded PR.');
  });
});

describe('Quadrant', () => {
  it('renders four quadrants with the selection following value', () => {
    const onChange = vi.fn();
    render(<Quadrant value="planned" onChange={onChange} />);
    const buttons = container.querySelectorAll('.mh-quadrant button');
    expect(buttons.length).toBe(4);
    const selected = container.querySelector('.mh-quadrant button.selected');
    expect(selected.textContent).toBe('Planned');
    expect(selected.getAttribute('aria-pressed')).toBe('true');
    // Axes are labeled.
    expect(container.textContent).toContain('Irreversible');
    expect(container.textContent).toContain('Reversible');
    expect(container.textContent).toContain('Well-specified');
    expect(container.textContent).toContain('Exploratory');
  });

  it('reports clicks through onChange and restyles when value moves', () => {
    const onChange = vi.fn();
    render(<Quadrant value="planned" onChange={onChange} />);
    click(container.querySelector('.mh-quadrant button.danger'));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('danger');
    render(<Quadrant value="danger" onChange={onChange} />);
    const selected = container.querySelector('.mh-quadrant button.selected');
    expect(selected.classList.contains('danger')).toBe(true);
    expect(selected.textContent).toBe('Danger zone');
  });
});

describe('Drill', () => {
  const cases = [
    {
      id: 'c1',
      kind: 'gate',
      surface: 'A mobile release train',
      prompt: 'Where does the gate sit?',
      evidence: [{ label: 'Undo', text: 'A pulled release costs a store review cycle.' }],
      options: [
        { id: 'above', label: 'Gate above' },
        { id: 'below', label: 'Gate below' },
      ],
      answer: 'above',
      feedback: {
        above: 'The undo cost argues for a gate above: a store cycle is not cheap.',
        below: 'Below leans on a reversibility the store review cycle does not offer.',
      },
      fromChapter: 18,
    },
    {
      id: 'c2',
      kind: 'placement',
      surface: 'An eval-harness schema change',
      prompt: 'Where does this decision live?',
      evidence: [{ label: 'Coupling', text: 'Three teams read the schema; one writes it.' }],
      options: [
        { id: 'planned', label: 'Planned' },
        { id: 'emergent', label: 'Emergent' },
      ],
      contested: true,
      feedback: {
        planned:
          'Read the coupling as tight and planned is defensible; it commits you to a slower schema.',
        emergent:
          'Read the coupling as loose and emergent is defensible; it commits you to contract tests.',
      },
      fromChapter: 5,
    },
  ];

  it('shows evidence and quiet progress, with no feedback before commitment', () => {
    render(<Drill cases={cases} title="Retrieval" />);
    expect(container.textContent).toContain('Case 1 of 2');
    expect(container.textContent).toContain('A pulled release costs a store review cycle.');
    expect(container.querySelector('.mh-feedback')).toBeNull();
  });

  it('argues the feedback after commitment, never says wrong, and marks contested calls', () => {
    render(<Drill cases={cases} title="Retrieval" />);
    click(byText('button', 'Gate below'));
    const feedback = container.querySelector('.mh-feedback');
    expect(feedback.textContent).toContain('Below leans on a reversibility');
    expect(feedback.textContent.toLowerCase()).not.toContain('wrong');
    expect(container.textContent).not.toContain('Contested call');

    click(byText('button', 'Next case'));
    expect(container.textContent).toContain('Case 2 of 2');
    expect(container.querySelector('.mh-feedback')).toBeNull();

    click(byText('button', 'Emergent'));
    expect(container.textContent).toContain('Contested call');
    expect(container.querySelector('.mh-feedback').textContent).toContain(
      'commits you to contract tests',
    );

    click(byText('button', 'Finish'));
    expect(container.textContent).toContain('No score');
    expect(container.textContent).toContain('2 cases');
  });
});

describe('Term', () => {
  it('renders the glossary chip with the handbook definition and analog in the tooltip', () => {
    render(<Term id="signal" />);
    const chip = container.querySelector('.mh-term');
    expect(chip.textContent).toBe('signal');
    expect(chip.title).toContain('A decaying piece of metadata');
    expect(chip.title).toContain('stigmergy');
  });

  it('falls back to plain text for unknown ids', () => {
    render(<Term id="nope">plain words</Term>);
    expect(container.querySelector('.mh-term')).toBeNull();
    expect(container.textContent).toBe('plain words');
  });
});

describe('glassSlice', () => {
  const src = [
    '// engine header',
    'export function alpha() {',
    '  return 1;',
    '}',
    '',
    '/** the core step */',
    'export function stepField(field, params, rng) {',
    '  return field;',
    '}',
    '',
    'export function omega() {}',
  ].join('\n');

  it('slices from the start line through the end line, one function only', () => {
    const out = glassSlice(src, '/** the core step', '\n}');
    expect(out).toContain('stepField');
    expect(out).toContain('return field;');
    expect(out.trimEnd().endsWith('}')).toBe(true);
    expect(out).not.toContain('alpha');
    expect(out).not.toContain('omega');
  });

  it('falls back to showing more, never less, when markers are missing', () => {
    expect(glassSlice(src, 'not-in-source', '\n}')).toBe(src);
    expect(glassSlice(src, 'export function omega', 'no-such-end')).toBe(
      'export function omega() {}',
    );
  });
});
