// EvidenceSort.jsx — LAB 25·A, the epistemic capstone (Ch 25, DESIGN §8).
//
// Sixteen of the book's own claims, badges stripped, dealt one at a time.
// The reader shelves each onto Part I's three shelves (evidence-backed /
// working design principle / organizing metaphor), commits the whole sort,
// then reads the author's sort with every delta argued from the handbook's
// own sentences. The closer is the §4.4 distribution, drawn: structural
// claims cluster very-strong-to-strong, the named operational
// recommendations sit strong-to-mixed, and nothing load-bearing rests on
// sparse evidence.
//
// Bet register, and honestly so: no engine runs here. The physics is the
// CLAIMS table itself (sliced verbatim into the glass), and the sort the
// reader is checked against is the author grading his own claims — a bet
// like any other in this register. The contested rows are the model
// dissent: places where the handbook shelves a claim two ways.

import { useState } from 'react';
import { Badge, LabFrame, glassSlice } from '../components/kit.jsx';
import selfRaw from './EvidenceSort.jsx?raw';

/* ── The shelves (Part I, "What kind of claim is this?") ─────────────── */

const SHELVES = [
  {
    id: 'E',
    glyph: 'Ⓔ',
    name: 'Evidence-backed',
    rule: 'Established by empirical research or hard-won industrial experience. "These are load-bearing."',
  },
  {
    id: 'W',
    glyph: 'Ⓦ',
    name: 'Working design principle',
    rule: 'Follows from the observations, holds across the studied cases. "Not because the science is settled."',
  },
  {
    id: 'M',
    glyph: 'Ⓜ',
    name: 'Organizing metaphor',
    rule: 'Language that helps think clearly. "They earn their place by clarifying. They are not theorems."',
  },
];

const SHELF_NAME = Object.fromEntries(SHELVES.map((s) => [s.id, s.name]));

/* ── The claims table — this lab's entire physics ────────────────────────
   Each row carries the shelf (`author`) and the §4.4 band the handbook
   assigns it. `band: 'held'` means the claim touches sparse territory and
   is held as an open question, not rested on. `band: 'off'` means the row
   is a metaphor and takes no evidence grade at all. */

const CLAIMS = [
  {
    id: 'conway',
    title: "Conway's Law",
    claim:
      'Communication structure becomes system structure: a platform takes the shape of the ' +
      'channels that built it.',
    source: 'Part I · §4.4',
    author: 'E',
    band: 'very-strong',
    kind: 'structural',
    contested: false,
  },
  {
    id: 'terrain',
    title: 'Terrain',
    claim:
      'The platform is terrain: ground that holds signals, decays them, and shapes where ' +
      'autonomous work flows.',
    source: 'Part I · §2.1',
    author: 'M',
    band: 'off',
    kind: 'metaphor',
    contested: false,
  },
  {
    id: 'placement',
    title: 'Placement',
    claim:
      'Ask where before what: placement on the spectrum is the central discipline, and three ' +
      'empirical axes decide it.',
    source: '§2.3 · Part I · §4.4',
    author: 'W',
    band: 'strong-mixed',
    kind: 'operational',
    contested: false,
  },
  {
    id: 'ostrom-principles',
    title: "Ostrom's eight",
    claim:
      'Commons that survive share eight design principles: boundaries, congruence, collective ' +
      'choice, monitoring, graduated sanctions, cheap conflict resolution, rights to organize, ' +
      'nested layers.',
    source: '§2.6 · §4.4',
    author: 'E',
    band: 'very-strong',
    kind: 'structural',
    contested: false,
  },
  {
    id: 'ostrom-mapping',
    title: 'The repo as commons',
    claim:
      'A shared repository and its signal field are a commons, and the same eight principles ' +
      'govern them.',
    source: '§2.6 · Part I',
    author: 'W',
    band: 'strong',
    kind: 'operational',
    contested: false,
  },
  {
    id: 'runaway',
    title: 'Positive feedback is dangerous',
    claim: 'Reinforcement that outruns decay grows without bound; runaway is structural, not rare.',
    source: 'Part I · §2.8 · §4.3',
    author: 'E',
    band: 'very-strong',
    kind: 'structural',
    contested: false,
  },
  {
    id: 'staging',
    title: 'The staged transition',
    claim:
      'Trust is grown in stages: terrain before loops, propose-only before auto-merge, one ' +
      'narrow class at a time.',
    source: '§3.4 · §4.5',
    author: 'W',
    band: 'strong-mixed',
    kind: 'operational',
    contested: false,
  },
  {
    id: 'four-forces',
    title: 'The four dynamics',
    claim:
      'Four forces (spread, decay, reinforcement, exploration) are the dynamics under every ' +
      'signal field.',
    source: 'Part I · §2.8',
    author: 'M',
    band: 'off',
    kind: 'metaphor',
    contested: true,
  },
  {
    id: 'automation-bias',
    title: 'Automation bias',
    claim:
      'When a system is mostly right, humans stop checking: stewards reviewing at high volume ' +
      'and high approval rate drift into rubber-stamping without noticing.',
    source: '§3.5 · Part I · §4.4',
    author: 'E',
    band: 'very-strong',
    kind: 'structural',
    contested: false,
  },
  {
    id: 'trust-properties',
    title: 'The five properties of trust',
    claim: 'Real trust is earned, narrow, conditional, revocable, and expiring.',
    source: '§3.7 · Part I · §4.4',
    author: 'W',
    band: 'strong-mixed',
    kind: 'operational',
    contested: true,
  },
  {
    id: 'spectrum',
    title: 'The spectrum is real',
    claim: 'Planned and emergent are ends of one real spectrum, not a rhetorical device.',
    source: '§2.2 · Part I',
    author: 'E',
    band: 'strong',
    kind: 'structural',
    contested: false,
  },
  {
    id: 'immune',
    title: 'The immune system',
    claim: "Guardrails are the platform's immune response.",
    source: '§2.10 · Part I',
    author: 'M',
    band: 'off',
    kind: 'metaphor',
    contested: false,
  },
  {
    id: 'economics',
    title: 'Gate, rate, budget',
    claim:
      'Approval is scarce by design and managed in three terms: gates placed per class, rates ' +
      'earned by track record, one budget as the binding constant.',
    source: '§3.6 · Part I · §4.4',
    author: 'W',
    band: 'strong-mixed',
    kind: 'operational',
    contested: false,
  },
  {
    id: 'variety',
    title: 'Variety must match variety',
    claim:
      'A regulator must match the variety of what it regulates: guardrails at least as ' +
      'differentiated as the failures they guard.',
    source: '§2.8 · §4.3 · Part I',
    author: 'E',
    band: 'very-strong',
    kind: 'structural',
    contested: true,
  },
  {
    id: 'approval-moment',
    title: 'The considered yes',
    claim: 'The approval is the load-bearing moment: the place where autonomous work becomes real.',
    source: 'Part I, "Why approval matters"',
    author: 'W',
    band: 'strong-mixed',
    kind: 'operational',
    contested: false,
  },
  {
    id: 'skill-atrophy',
    title: 'Skill atrophy',
    claim:
      'The cases that need a human are by construction rare, exactly the cases the human has ' +
      'least practice on; heavy agent reliance will cost supervising skill over time.',
    source: '§3.5 · §4.4 · §4.5',
    author: 'W',
    band: 'held',
    kind: 'operational',
    contested: true,
  },
];

// Compare a reader's sort to the author's. A delta is not an error: on a
// contested row the handbook itself shelves the claim two ways.
function compareSorts(picks) {
  return CLAIMS.map((c) => ({
    id: c.id,
    yours: picks[c.id],
    authors: c.author,
    delta: picks[c.id] !== c.author,
    contested: c.contested,
  }));
}

const GLASS =
  glassSlice(selfRaw, 'const CLAIMS = [', '\n];') +
  '\n\n' +
  glassSlice(selfRaw, 'function compareSorts', '\n}');

/* ── The argued deltas — every row quotes the handbook's own weighting ── */

const ARGUMENTS = {
  conway:
    "Part I's evidence-backed list names it outright, beside the impossibility theorems and " +
    'Ostrom\'s principles, and closes the list with the ruling: "these are load-bearing." §4.4 ' +
    "prices Conway's Law in the very strong band, alongside the mathematical results and the " +
    'major-failure record. The top shelf holds few claims; this is one of them.',
  terrain:
    'Terrain leads Part I\'s metaphor list: "language that helps think clearly without claiming ' +
    'to be literally true. Terrain." The shelf\'s rule follows two sentences later: "they earn ' +
    'their place by clarifying. They are not theorems." Notice what the word has done across ' +
    'this book: every control you touched was terrain, because the word moves your attention ' +
    'off the agent and onto the conditions. That is everything an organizing metaphor is for, ' +
    'and all it is for. The role claim it decorates (humans shift to lower-frequency, ' +
    'higher-authority work) is structural and well-supported; the picture is not the claim.',
  placement:
    'Part I shelves placement by name under working design principles and states the commitment ' +
    "plainly: \"I commit to these because they're the best framing I've found, not because the " +
    'science is settled." §4.4 prices the named operational recommendations strong-to-mixed. If ' +
    'you shelved it Ⓔ, the likely culprit is practice: twenty chapters of placing decisions can ' +
    'make a working principle feel like a law. One piece of it is checkable, though. The three ' +
    'axes are empirical, which is exactly why the framework routes arguments onto them. The ' +
    'axes are measurements; the discipline built on them is the bet.',
  'ostrom-principles':
    '§2.6 prices its own source: "Ostrom\'s work is among the most empirically grounded bodies ' +
    'in the social sciences." §4.4 holds the design principles in the very strong band, and ' +
    "Part I's evidence-backed list carries them by name. The evidence comes from irrigation " +
    'systems, fisheries, and forests, which is exactly why the next card exists.',
  'ostrom-mapping':
    'Same section of the handbook, second half of the sentence: "the mapping to software ' +
    'commons is more recent but the mechanism is the same." More recent is the flag. Ch 7 ' +
    'marked the mapping Ⓦ on the spot while the eight principles themselves wore Ⓔ. Two claims ' +
    'that travel as one sentence is the commonest way to mis-shelve, so the pair sits side by ' +
    "side here: the principles are evidence; their transfer to repositories is the framework's " +
    'working bet.',
  runaway:
    'Part I\'s closing paragraph counts "that positive feedback is dangerous" among the ' +
    'well-supported structural claims, and the mathematics underneath is as settled as ' +
    'mathematics gets: §4.3\'s Keller-Segel entry "genuinely produces blow-up without decay," ' +
    'and the ACO convergence results hold "only with a positive lower bound preserving ' +
    'exploration." What is not settled is where the threshold sits for any real platform; ' +
    "§4.5's first open question says the numbers aren't established. The shape is evidence; " +
    "your system's critical value is unknown, which is why the phase-transition bench in this " +
    'chapter stays unbuilt.',
  staging:
    '§4.5 says it without softening: "the staging in Part III is a principled proposal, not a ' +
    'validated one." Ch 16 drew the cost curve and labeled it the author\'s bet at the moment ' +
    'the skipped stage got punished. If the curve you watched bend carries more weight with you ' +
    'than that label, that is the laundering the register split exists to prevent, and this ' +
    'card is the recheck.',
  'four-forces':
    'The subtlest shelf in the sort, and the author follows Part I exactly: "the four dynamics" ' +
    'closes the metaphor list, beside terrain and the immune system. The case for Ⓔ is real. ' +
    "Ch 8's arithmetic is genuine dynamics, and §4.3's theorems are genuine mathematics, priced " +
    'very strong in §4.4. But the four-force frame is the packaging: the claim that exactly ' +
    'these four, named this way, are the forces of your platform. §2.8 says "you should know ' +
    'what the math says"; it does not say the math hands you a four-force ontology. The ' +
    'dynamics inside the model are mechanism; the frame around them is language that clarifies. ' +
    'Hold both, and know which one you are holding.',
  'automation-bias':
    '§3.5 imports it from "fields that automated decades before software did," Part I\'s ' +
    'evidence-backed list closes with "the human-factors literature on automation," and §4.4 ' +
    'holds automation-bias research in the very strong band. If you shelved it Ⓦ because ' +
    "Ch 17's drift curve was flagged as a modeling choice, you caught a real distinction and " +
    'aimed it one claim over: the drift function is the bet; the bias it renders is the ' +
    'finding. Separating a finding from the function drawn to display it is precisely the layer ' +
    'question this sort drills.',
  'trust-properties':
    "The handbook shelves this claim twice, and not on the same shelf. Part I's bullet list " +
    'places "the five properties of trust" under working design principles; three paragraphs ' +
    'later, the closing list counts "that trust must be earned, narrow, conditional, revocable, ' +
    'and expiring" among the well-supported structural claims. §4.4 settles the price at ' +
    'strong-to-mixed. The honest split: that trust must have this shape is structural; the five ' +
    'properties as operating mechanism (ledgers, expiry windows, reset on a model swap) are the ' +
    'bet. Whichever shelf you chose, the handbook agrees with you somewhere. This row is the ' +
    "sort's clearest model dissent: the source itself has freedom in it.",
  spectrum:
    'Part I\'s closing paragraph counts "that the spectrum is real" among the well-supported ' +
    'structural claims, and §2.2 opens with the same denial: "not a rhetorical device." If you ' +
    'shelved Ⓦ remembering Ch 4, you priced a neighboring claim: the strict ten-property ' +
    'co-variance, where every property drags the others. That worked model ran in bet register, ' +
    "dissent included. The spectrum's existence and the tightness of its coupling sit one shelf " +
    'apart.',
  immune:
    'Part I\'s metaphor list carries "the colony\'s immune system," and §2.10 wears it in its ' +
    'title. The four classes underneath (structural, reactive, dynamic, reflective) are a ' +
    'working taxonomy; you graded storms with it in Ch 11, and it sits on the middle shelf. The ' +
    'immune frame is what makes "without the reflective class the other three decay silently" ' +
    'feel inevitable instead of arbitrary. It clarifies. It proves nothing. That is the third ' +
    'shelf doing its job.',
  economics:
    '"The economics of approval" sits in Part I\'s working-principles list, and §4.4\'s summary ' +
    'prices the named recommendations strong-to-mixed. The queueing arithmetic inside the Gate ' +
    'Console needs no shelf; arithmetic is arithmetic. The claim that this trio is how the ' +
    'scarcity should be managed is the framing the author commits to, "not because the science ' +
    'is settled." One Ⓔ layer sits underneath it: the automation-bias record, which is what ' +
    'makes rubber-stamp drift worth instrumenting at all.',
  variety:
    'Ashby\'s Law is real mathematics, §2.8 calls the consequence "not negotiable," and ' +
    'Part I\'s structural list carries "that variety must match variety." So the author shelves ' +
    "it Ⓔ. If you shelved Ⓦ, you have read §4.3's preamble closely: the bridge from the theorem " +
    'to a specific operational decision "is currently informal." The law is evidence; sizing ' +
    "this quarter's gate table with it is a working move. This card said both halves at once, " +
    'which is why the row is marked contested.',
  'approval-moment':
    'Part I asserts this with full weight ("a framework that doesn\'t take this moment ' +
    'seriously isn\'t a framework for software in this era") and never badges it. The same ' +
    "pages tell you how to read an unbadged sentence: \"where I don't flag, I'm usually in the " +
    'second layer — describing what I think is the right move given what we currently know." ' +
    "The book's central image sits on the middle shelf by the handbook's own default rule. Ⓜ is " +
    'a tempting read, and "load-bearing" is structural language; but the claim underneath is ' +
    'operational: take this moment seriously, budget it, defend it.',
  'skill-atrophy':
    'Half of this card is on the record: §3.5 lists skill atrophy on rare failures among the ' +
    'four human failures "well-documented in fields that automated decades before software ' +
    'did." The forward half is priced honestly: §4.4 files "long-term skill-atrophy effects" ' +
    'under sparse, and §4.5 keeps it as an open question, where the parallels "suggest ' +
    'significant effects; whether they manifest in software, at what cadence, is unknown." So ' +
    'the author shelves the claim Ⓦ and hangs no recommendation on it. This is the one card ' +
    'that touches the sparse band, and it follows §4.4\'s closing rule to the letter: "where it ' +
    'touches sparse territory, I say so."',
};

/* ── The distribution view (§4.4, drawn) ─────────────────────────────── */

const BANDS = [
  {
    id: 'very-strong',
    label: 'Very strong',
    note: 'The structural claims cluster here, on the mathematics, the failure record, the human-factors literature, and Ostrom.',
  },
  {
    id: 'strong',
    label: 'Strong',
    note: null,
  },
  {
    id: 'strong-mixed',
    label: 'Strong → mixed',
    note: '§4.4 prices the named operational recommendations here: "bets, informed by theory and early practice."',
  },
  {
    id: 'mixed',
    label: 'Mixed',
    note:
      'Thin territory the framework cites but stands lightly on: vendor productivity claims, ' +
      'agent benchmarks, orchestration patterns versus strong single agents, "edge of chaos." ' +
      'The thin end of strong-to-mixed reaches here; no claim of the book lives here outright.',
  },
  {
    id: 'sparse',
    label: 'Sparse',
    note:
      'Held, not resting: skill atrophy touches this band and is flagged as an open question. ' +
      '"None of the framework rests on sparse evidence; where it touches sparse territory, I ' +
      'say so."',
  },
];

const CHIP_STYLE = {
  structural: { color: 'var(--accent-ink)', border: '1px solid var(--accent)' },
  operational: { color: 'var(--amber)', border: '1px solid var(--amber)' },
  metaphor: { color: 'var(--ink-2)', border: '1px solid var(--line)' },
};

function ClaimChip({ c }) {
  const base = CHIP_STYLE[c.kind];
  const held = c.band === 'held';
  return (
    <span
      className="mono"
      style={{
        display: 'inline-block',
        fontSize: '11px',
        padding: '3px 9px',
        borderRadius: 12,
        margin: '2px 4px 2px 0',
        color: held ? 'var(--ink-faint)' : base.color,
        border: held ? '1px dashed var(--ink-faint)' : base.border,
      }}
    >
      {c.title}
    </span>
  );
}

function Distribution() {
  const metaphors = CLAIMS.filter((c) => c.band === 'off');
  return (
    <div role="group" aria-label="The §4.4 evidence distribution, every sorted claim on its band">
      <span className="mh-kicker" style={{ display: 'block', margin: '18px 0 4px' }}>
        The distribution · §4.4, drawn
      </span>
      <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--ink-faint)' }}>
        Claims colored by kind: <span style={{ color: 'var(--accent-ink)' }}>structural</span> ·{' '}
        <span style={{ color: 'var(--amber)' }}>operational</span> · metaphors take no band.
      </p>
      {BANDS.map((band) => {
        const here = CLAIMS.filter(
          (c) => c.band === band.id || (band.id === 'sparse' && c.band === 'held'),
        );
        return (
          <div
            key={band.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '110px 1fr',
              gap: 10,
              padding: '8px 0',
              borderTop: '1px solid var(--line-soft)',
            }}
          >
            <span className="mh-kicker" style={{ paddingTop: 4 }}>
              {band.label}
            </span>
            <div>
              {here.map((c) => (
                <ClaimChip key={c.id} c={c} />
              ))}
              {band.note ? (
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--ink-faint)' }}>
                  {band.note}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '110px 1fr',
          gap: 10,
          padding: '8px 0',
          borderTop: '1px solid var(--line-soft)',
        }}
      >
        <span className="mh-kicker" style={{ paddingTop: 4 }}>
          Off the bands
        </span>
        <div>
          {metaphors.map((c) => (
            <ClaimChip key={c.id} c={c} />
          ))}
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--ink-faint)' }}>
            Metaphors take no evidence grade. "They earn their place by clarifying. They are not
            theorems."
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── The shelf board: definitions plus everything placed so far ───────── */

function ShelfBoard({ picks, label }) {
  return (
    <div
      role="group"
      aria-label={label}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: 10,
        margin: '12px 0',
      }}
    >
      {SHELVES.map((s) => {
        const placed = CLAIMS.filter((c) => picks[c.id] === s.id);
        return (
          <div
            key={s.id}
            style={{
              border: '1px solid var(--line-soft)',
              borderRadius: 3,
              background: 'var(--paper)',
              padding: '10px 12px',
            }}
          >
            <span className="mh-kicker">
              {s.glyph} {s.name} · {placed.length}
            </span>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--ink-faint)' }}>
              {s.rule}
            </p>
            {placed.length ? (
              <ul
                className="mono"
                style={{
                  margin: '8px 0 0',
                  paddingLeft: 16,
                  fontSize: '12px',
                  lineHeight: 1.7,
                  color: 'var(--ink-2)',
                }}
              >
                {placed.map((c) => (
                  <li key={c.id}>{c.title}</li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* ── The reveal: every row argued, deltas open ─────────────────────────── */

function RevealRow({ c, row, defaultOpen }) {
  return (
    <details
      open={defaultOpen || undefined}
      style={{ borderTop: '1px solid var(--line-soft)', padding: '8px 0' }}
    >
      <summary style={{ cursor: 'pointer', fontSize: '14px', color: 'var(--ink)' }}>
        <strong>{c.title}</strong>
        <span style={{ color: 'var(--ink-faint)' }}>
          {' '}
          · yours <Badge layer={row.yours} /> · author <Badge layer={row.authors} />
        </span>{' '}
        <span
          className="mono"
          style={{
            fontSize: '10.5px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: row.delta ? 'var(--amber)' : 'var(--ink-faint)',
          }}
        >
          {row.delta ? 'differs' : 'same shelf'}
        </span>
        {c.contested ? (
          <span
            className="mono"
            style={{
              fontSize: '10.5px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--amber)',
              marginLeft: 8,
            }}
          >
            contested
          </span>
        ) : null}
      </summary>
      <div style={{ padding: '8px 0 4px', fontSize: '14px', color: 'var(--ink-2)' }}>
        <p
          style={{
            margin: '0 0 8px',
            fontStyle: 'italic',
            color: 'var(--ink-faint)',
            fontSize: '13px',
          }}
        >
          "{c.claim}" — {c.source}
        </p>
        <p style={{ margin: 0 }}>
          {row.delta ? (
            <>
              You shelved this as {SHELF_NAME[row.yours].toLowerCase()}; the author shelves it as{' '}
              {SHELF_NAME[row.authors].toLowerCase()}.{' '}
            </>
          ) : null}
          {ARGUMENTS[c.id]}
        </p>
      </div>
    </details>
  );
}

/* ── The lab ───────────────────────────────────────────────────────────── */

export default function EvidenceSort() {
  const [picks, setPicks] = useState({});
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const n = CLAIMS.length;
  const sorting = idx < n;
  const current = sorting ? CLAIMS[idx] : null;

  const place = (shelfId) => {
    if (!sorting) return;
    setPicks({ ...picks, [CLAIMS[idx].id]: shelfId });
    setIdx(idx + 1);
  };
  const back = () => {
    if (idx === 0 || revealed) return;
    const prev = CLAIMS[idx - 1];
    const nextPicks = { ...picks };
    delete nextPicks[prev.id];
    setPicks(nextPicks);
    setIdx(idx - 1);
  };
  const startOver = () => {
    setPicks({});
    setIdx(0);
    setRevealed(false);
  };

  const rows = revealed ? compareSorts(picks) : null;
  const deltaCount = rows ? rows.filter((r) => r.delta).length : 0;

  return (
    <LabFrame
      tag="LAB 25·A — THE EVIDENCE SORT"
      register="bet"
      question="Sixteen of this book's own claims, badges stripped. Part I hands you three shelves: evidence-backed, working design principle, organizing metaphor. Shelve each claim where you'd hold it, then set your sort against the author's. The deltas are the lesson, and some of them are the handbook arguing with itself."
      payoff="Sorted and priced, the book's claims land where §4.4 says they land. The structural claims (Conway, Ostrom's eight, positive feedback's danger, variety matching variety, the spectrum's reality) cluster in the very-strong-to-strong band. The named operational recommendations (placement, the staged transition, gate-rate-budget, the five properties of trust) sit strong-to-mixed, and the handbook calls them bets in as many words. The metaphors sit off the bands, priced in clarity. Nothing load-bearing rests on sparse evidence; the one sparse-touching claim, long-term skill atrophy, is held as an open question, and the handbook says so."
      notes={[
        'No engine runs behind this lab. The physics is the CLAIMS table in the glass: sixteen claims, each carrying the shelf and the §4.4 band the handbook assigns it. The sort you are checked against is the author grading his own claims, itself a bet, which is why this lab sits in the bet register.',
        "Claim wordings are compressed to fit a card. Every card cites the sections it compresses, and every argued row quotes the handbook's own sentence where one exists.",
        "Four rows are marked contested because the handbook shelves them ambiguously, trust's five properties most of all: structural in one paragraph of Part I, a working principle in another. The contested rows are this figure's model dissent, the places where the author's sort has visible freedom.",
        'The delta count is a count of differences, not a score. On a contested row, a delta can mean you read the handbook more strictly than the author does.',
      ]}
      cannotShow="whether the author's sort is right. These shelves are the author grading his own claims, and §4.4 is one person's weighting of his own sources; an independent reviewer might price placement higher or the spectrum lower. What the exercise installs is the habit: asking what layer a claim sits at, including about this book. It cannot certify the answers. A book that sorted its own claims and found them all evidence-backed should worry you more than this one."
      glass={GLASS}
    >
      {!revealed ? (
        <div>
          {sorting ? (
            <div className="mh-commit">
              <span className="mh-kicker">
                Predict first · claim {idx + 1} of {n}
              </span>
              <p style={{ margin: '0 0 4px', fontSize: '15px', color: 'var(--ink)' }}>
                {current.claim}
              </p>
              <p
                className="mono"
                style={{ margin: '0 0 10px', fontSize: '11.5px', color: 'var(--ink-faint)' }}
              >
                compresses {current.source}
              </p>
              <div className="mh-chipset" role="group" aria-label={`Shelve: ${current.title}`}>
                {SHELVES.map((s) => (
                  <button key={s.id} type="button" className="mh-chip" onClick={() => place(s.id)}>
                    {s.glyph} {s.name}
                  </button>
                ))}
              </div>
              <div className="mh-controls" style={{ margin: '10px 0 0' }}>
                <button
                  type="button"
                  className="mh-btn"
                  onClick={back}
                  disabled={idx === 0}
                  aria-label="Go back one claim and reshelve it"
                >
                  Back one
                </button>
              </div>
            </div>
          ) : (
            <div className="mh-commit">
              <span className="mh-kicker">All sixteen shelved</span>
              <p style={{ margin: '0 0 10px' }}>
                This is your sort. The reveal sets it against the author's, row by row, and argues
                every difference from the handbook's own sentences.
              </p>
              <div className="mh-controls">
                <button type="button" className="mh-btn" onClick={back}>
                  Back one
                </button>
                <button
                  type="button"
                  className="mh-btn mh-btn-primary"
                  onClick={() => setRevealed(true)}
                >
                  Reveal the author's sort
                </button>
              </div>
            </div>
          )}
          <ShelfBoard picks={picks} label="Your shelves so far" />
        </div>
      ) : (
        <div>
          <div className="mh-feedback" role="status">
            <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
              The author's sort · this sort is the author's bet, drawn
            </span>
            {deltaCount === 0 ? (
              <>
                You and the author land together on all {n}. Read the contested rows anyway: they
                are where the handbook argues with itself.
              </>
            ) : (
              <>
                You and the author land together on {n - deltaCount} of {n}; the{' '}
                {deltaCount === 1 ? 'delta carries' : `${deltaCount} deltas carry`} the arguments.
                The argued rows are open below.
              </>
            )}
          </div>
          <div style={{ margin: '12px 0' }}>
            {CLAIMS.map((c, i) => (
              <RevealRow
                key={c.id}
                c={c}
                row={rows[i]}
                defaultOpen={rows[i].delta || (deltaCount === 0 && c.contested)}
              />
            ))}
          </div>
          <Distribution />
          <div className="mh-controls" style={{ margin: '14px 0 0' }}>
            <button type="button" className="mh-btn" onClick={startOver}>
              Sort again
            </button>
          </div>
        </div>
      )}
    </LabFrame>
  );
}
