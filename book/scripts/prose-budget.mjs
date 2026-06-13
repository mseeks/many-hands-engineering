// Prose budget checker — the wall-of-text guard.
// Counts visible words in a page file OUTSIDE <Deeper> folds. The budget is a
// hard gate: a page that fails here is a page that lectures.
// Usage: node scripts/prose-budget.mjs [src/pages/P04.jsx ...]   (default: all)
import { readFileSync, readdirSync } from 'node:fs';

const BUDGET = Number(process.env.PROSE_BUDGET || 230);
const dir = new URL('../src/pages/', import.meta.url).pathname;
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(dir)
      .filter((f) => /^P\d\d\.jsx$/.test(f))
      .map((f) => dir + f);

let failed = false;
for (const file of files) {
  let src = readFileSync(file, 'utf8');
  // Drop fold content — depth lives there on purpose.
  src = src.replace(/<Deeper[\s\S]*?<\/Deeper>/g, '');
  // Drop code: imports, comments, attribute values stay; we only want JSX text
  // nodes and obvious prose-bearing string props (claim=, payoff lines).
  src = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const texts = [];
  // JSX text nodes: between > and < with at least one letter.
  for (const m of src.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)) texts.push(m[1]);
  // Prose-bearing string props.
  for (const m of src.matchAll(/(?:claim|payoff|question|caption|prompt)=\{?["'`]([^"'`]+)["'`]/g))
    texts.push(m[1]);
  const words = texts
    .join(' ')
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w)).length;
  const short = file.split('/').pop();
  const ok = words <= BUDGET;
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'OVER'}  ${short}  ${words} words (budget ${BUDGET})`);
}
process.exit(failed ? 1 : 0);
