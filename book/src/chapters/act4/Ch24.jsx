// Ch 24 · The backbone, held honestly — each §4.3 result as a card: what the
// theorem proves, which bench borrowed its shape, where the bridge is
// informal. Every card with an engine behind it opens a glass flap onto the
// toy form the book actually runs, so the gap between the math and the model
// stays visible. Covers §4.3.

import {
  Badge,
  Chapter,
  Coda,
  DecisionCard,
  Drill,
  Lede,
  Pull,
  glassSlice,
} from '../../components/kit.jsx';
import { CASES } from '../../engine/cases.js';
import fieldRaw from '../../engine/field.js?raw';

/* ── The toy forms, sliced verbatim from the engine ──────────────────── */

const GLASS = {
  keller: glassSlice(fieldRaw, 'export function stepField', '\n}'),
  bifurcation: glassSlice(fieldRaw, 'function expectedGain', '\n}'),
  meanField: glassSlice(fieldRaw, 'function pickBySignal', '\n}'),
  aco: glassSlice(fieldRaw, '// 1) Work selection', '\n  }'),
  ashby: glassSlice(fieldRaw, 'export function fieldMetrics', '\n}'),
};

/* ── The seven results of §4.3 ───────────────────────────────────────── */

const BACKBONE = [
  {
    id: 'keller',
    title: 'Reaction–diffusion / Keller–Segel',
    proves:
      'In a population that aggregates by following its own deposits, insufficient decay produces finite-time blow-up. Runaway is a theorem, not an anecdote.',
    borrowed:
      "The Signal Field's decay knob (Ch 8) and the retry storm (Ch 9). In the engine, decay is the only way signal leaves the field; you watched what happened when it lost.",
    bridge:
      'Keller–Segel is a partial differential equation about continuous densities. Your platform is discrete PRs and queues. The existence of blow-up transfers as instinct; no mapping carries your repo into the equation.',
    glass: GLASS.keller,
  },
  {
    id: 'bifurcation',
    title: 'Bifurcation',
    proves:
      'Self-reinforcing dynamics change qualitatively, not gradually, at critical parameter values. The canonical form of trail formation in emergent systems.',
    borrowed:
      "Ch 8's phase boundary and Ch 9's storm threshold: a gain readout crossing 1, the flip you found by hand.",
    bridge:
      'The theorem guarantees a threshold exists in models shaped like these. It says nothing about where yours sits. §4.5 files the real numbers under open questions, and Chapter 25 leaves that bench unbuilt.',
    glass: GLASS.bifurcation,
  },
  {
    id: 'mean-field',
    title: 'Mean-field game theory (Lasry–Lions; Huang–Malhamé–Caines)',
    proves:
      "Many strategic agents interacting through aggregate effects admit equilibrium analysis as a consistency fixed-point: each agent best-responds to a field made of everyone's behavior.",
    borrowed:
      'The architecture of every field lab: workers in Ch 8 and the mapper population in Ch 15 read one aggregate, the signal field, instead of each other.',
    bridge:
      'The engines never compute an equilibrium; they just run forward and let you watch. What was borrowed is the interaction-through-aggregates shape, not the solution concept.',
    glass: GLASS.meanField,
  },
  {
    id: 'aco',
    title: 'ACO convergence (Gutjahr; Stützle–Dorigo)',
    proves:
      'Reinforcement-driven search converges to the optimum only with a positive lower bound preserving exploration. The floor is not decorative.',
    borrowed:
      'The exploration knob in Ch 8\'s lock-in task, and "inject variety" on Ch 9\'s remedy palette.',
    bridge:
      "The convergence theorems govern optimization runs against fixed objectives; a platform's objective moves. What transfers is the design rule: never let the floor reach zero.",
    glass: GLASS.aco,
  },
  {
    id: 'impossibility',
    title: 'CAP / PACELC / FLP',
    proves:
      'Consistency, availability, and partition-tolerance cannot all be promised at once; latency trades against consistency even without partitions; deterministic asynchronous consensus tolerates no failures.',
    borrowed:
      "Nothing ran here. Ch 8 carried these as cards and pointed at the collection's own CAP lesson; this book does not simulate impossibility results.",
    bridge:
      'Inverted, for once. The theorems genuinely constrain any distributed system, your agent fleet included; that end is the firmest on the shelf. The informal step is rhetorical: reading "you cannot have everything" as a license for specific trade-offs the theorems never mention.',
    noEngine:
      'no engine, on purpose: a simulation of an impossibility result either restates the proof or misleads',
  },
  {
    id: 'ashby',
    title: "Ashby's Law of requisite variety",
    proves:
      'A regulator must match the regulated system in distinguishable states; below that bound, control fails by arithmetic, not by effort.',
    borrowed:
      "The variety gauge on the field's instrument row (Ch 8, 13), and the grading of Ch 11: a one-state guardrail against a many-state failure grades decorative.",
    bridge:
      'Nobody can count the distinguishable states of a real platform. The law licenses a comparison ("this guardrail is less differentiated than what it guards"), never a measurement.',
    glass: GLASS.ashby,
  },
  {
    id: 'coordination',
    title: 'Coordination complexity',
    proves:
      'Full-mesh coordination grows as N² (ten hands, 45 pairwise channels; fifty hands, 1,225); a shared medium grows as N (ten, and fifty).',
    borrowed:
      "Ch 3's trace-the-cause probe: the reason every hop in the chain read READ or WRITE and never CALL.",
    bridge:
      "The narrowest gap on the list; the handbook's own words are \"combinatorial, not ideological.\" The informal residue is the assumption that channels cost alike. They don't, and the steward's channel costs most.",
    noEngine: 'no engine: the arithmetic fits in a sentence, and a sentence is its honest form',
  },
];

function BackboneCard({ index, result }) {
  return (
    <article className="mh-card" style={{ margin: '0 0 14px' }}>
      <span className="mh-kicker">Backbone · {String(index + 1).padStart(2, '0')}</span>
      <h4>{result.title}</h4>
      <p style={{ margin: '0 0 8px' }}>
        <strong>Proves.</strong> {result.proves}
      </p>
      <p style={{ margin: '0 0 8px' }}>
        <strong>Borrowed by.</strong> {result.borrowed}
      </p>
      <p style={{ margin: 0 }}>
        <strong>The bridge.</strong> {result.bridge}
      </p>
      {result.glass ? (
        <details className="mh-notes">
          <summary>Glass · the toy form this book actually runs</summary>
          <div className="mh-notes-body">
            <div className="mh-glass">
              <pre>
                <code>{result.glass}</code>
              </pre>
            </div>
          </div>
        </details>
      ) : (
        <p
          className="mono"
          style={{ margin: '12px 0 0', fontSize: '11.5px', color: 'var(--ink-faint)' }}
        >
          {result.noEngine}
        </p>
      )}
    </article>
  );
}

const DRILL_IDS = ['sp-01', 'sp-06', 'sp-04'];

export default function Ch24() {
  const drillCases = DRILL_IDS.map((id) => CASES.find((c) => c.id === id));
  return (
    <Chapter n={24} covers="§4.3">
      <Lede>
        Seven mathematical results sit under this book's engines. The theorems are real. The honest
        question is what they license here, and the answer is less than the curves made it feel.
      </Lede>

      <p>
        In Chapter 9 you ran the shipped retry policy, five per request, and watched a queue eat its
        own retries. The dials felt like physics because behind them sat a ratio, reinforcement
        inflow over decay outflow, and a theorem family that says what happens when that ratio stays
        above 1 <Badge layer="E" note="the mathematics is real; §4.4 prices it very strong" />. That
        feeling is exactly the hazard §4.3 opens by disarming. CAP and FLP genuinely constrain what
        distributed systems can promise. Keller–Segel genuinely produces blow-up without decay.
        Mean-field games genuinely model populations interacting through aggregates. But in this
        framework the results function as analogies and design intuitions, not as predictive models
        a team can compute against; the bridge from the math to a specific operational decision in
        your platform is currently informal{' '}
        <Badge layer="W" note="§4.3: the bridge is informal, and the handbook says so" />, and the
        handbook declines to pretend otherwise. Its instruction: "Treat these as the substrate of
        why the framework's instincts hold up, not as equations to solve." Each card below holds one
        result to that standard: what the theorem proves, which bench borrowed its shape, and a
        plain sentence on where the bridge is informal. Open a card's glass and you get the toy the
        book actually ran, so the gap between the math and the model is itself on display.
      </p>

      <Pull>
        These engines show shapes, not thresholds. No bench in this book predicts a real system's
        critical values.
      </Pull>

      {BACKBONE.map((result, i) => (
        <BackboneCard key={result.id} index={i} result={result} />
      ))}

      <p>
        Open the glass on the first card and count the lines. Not a partial differential equation: a
        twelve-node ring, one decay constant, one saturation cap, work deposited where it lands. The
        distance between Keller–Segel and those lines is the same kind of distance as between those
        lines and your platform. Two informal bridges, stacked, and the book stands on the middle
        span. What survives both crossings is the shape: divergence needs gain above 1, control
        needs variety, reinforcement needs a floor, and the change at the boundary is qualitative.
        What does not survive is any number. When the retry-pressure readout in Chapter 9 pinned at
        6.0, the 6.0 belonged to the engine, its 300-job retry cap speaking rather than any
        equilibrium; the "above 1" belonged to the mathematics. Keep the two separate and both stay
        useful.
      </p>

      <p>
        The backbone earns its keep as reflex, so close with one. Three traces you have read before,
        each carrying one measured number. Commit, and name the shape the number is wearing.
      </p>

      <Drill title="Shapes, read in the field" cases={drillCases} />

      <DecisionCard
        title="Before you compute against the backbone"
        items={[
          'Name the result under your instinct, and spend it on shape only: divergence needs gain above 1; control needs variety; reinforcement needs a floor.',
          "Never import a threshold from a model, this book's included. Instrument your own system for the ratio (created-per-shed, agreement-versus-approval) and read the trend.",
          'When someone hands you a critical value for your platform, ask which engine produced it and what that engine cannot show.',
          'The impossibility results are the exception: CAP, PACELC, and FLP bind whether or not you model anything. Spend their authority only on what they actually say.',
        ]}
      />

      <Coda
        line="The mathematics is real and the bridge is informal; what crosses intact is the shape, never the threshold."
        next="Chapter 25 turns the same honesty on what the framework cannot yet know at all."
      />
    </Chapter>
  );
}
