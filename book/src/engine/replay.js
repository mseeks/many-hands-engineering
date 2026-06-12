// Recorded runs — the book's workhorse delivery format.
// A Trace is a seeded, deterministic step list with reader-facing captions.
// Scenario builders execute real engines and record what happened; the
// Walkthrough component replays the steps. The captions are part of the
// book's text: write them for the reader, not the debugger.

/**
 * @typedef {{ label: string, caption: string, data: object }} Step
 * @typedef {{ seed: number, steps: Step[] }} Trace
 */

/**
 * @param {number} seed
 * @returns {Trace}
 */
export function makeTrace(seed) {
  return { seed, steps: [] };
}

/**
 * Append a step. Returns the trace for chaining.
 * @param {Trace} trace
 * @param {Step} step
 */
export function pushStep(trace, step) {
  trace.steps.push({ label: step.label, caption: step.caption, data: step.data ?? {} });
  return trace;
}
