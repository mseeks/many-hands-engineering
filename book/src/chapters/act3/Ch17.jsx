// Ch 17 — The steward. Covers §3.5.
// The reallocation as a static signaled diagram, the four human-factors
// failures from aviation and medicine (Ⓔ), the rubber-stamp divergence
// chart (FIG 17·A, named export of the Gate Console), and the defenses as
// terrain — including two practice cases, administered here.

import {
  Badge,
  Chapter,
  Coda,
  DecisionCard,
  Drill,
  Lede,
  Pull,
  Term,
} from '../../components/kit.jsx';
import { DivergenceChart } from '../../labs/GateConsole.jsx';
import { CASES } from '../../engine/cases.js';

// The defenses include practice cases: deliberately working hard examples
// even when none arrive. Two administered here — gt-03 is this chapter's
// own instrument turned into a call; sp-01 reaches back to Ch 13 (the
// healthy backpressure loop that looks like a storm).
const PRACTICE = ['gt-03', 'sp-01'].map((id) => CASES.find((c) => c.id === id));

// §3.5's six places the steward's work goes.
const WORK = [
  {
    where: 'Upstream: intent, taste, and the terrain itself.',
    text: "Agents don't generate purpose; they pursue it. Someone decides what good means, where acceptable variance falls, what the system is for. This work can't be delegated, because it's the work that defines what delegation means.",
  },
  {
    where: 'At pace-layer boundaries: codifying norms.',
    text: 'When an agent practice consolidates into a convention, the steward notices, ratifies, and promotes it from emergent practice to explicit rule — how emergent work ratchets forward instead of drifting nowhere. You did this yourself in Chapter 6.',
  },
  {
    where: 'At boundaries: curating contracts.',
    text: 'Every interface between planned and emergent is a living contract. Maintaining it means understanding both sides and revising ahead of breakage. Invisible when done well, catastrophic when done poorly.',
  },
  {
    where: 'Downstream: adjudication.',
    text: "The autonomy envelope is deliberately set so some cases escalate. When they do, the steward's judgment defines how similar cases will be handled going forward.",
  },
  {
    where: 'Periodically: deliberate disturbance.',
    text: "Scheduling adversarial pressure even when nothing seems wrong — especially when nothing seems wrong. A system that hasn't been disturbed in months has accumulated dependencies the steward doesn't yet know about (§2.11; you ran game day in Chapter 12).",
  },
  {
    where: 'Throughout: veto on the irreversible.',
    text: "Production deploys, data deletions, external calls with cost, legal commitments. The platform proposes; only a human approves. Not a position on AI's limits — a position on the cost of being wrong.",
  },
];

// The four human-factors failures, Ⓔ: aviation and medicine automated
// decades before software, and converged on the same observations.
const FAILURES = [
  {
    name: 'Automation bias',
    text: 'When a system is mostly right, humans stop checking — accepting what it says even when something else in front of them disagrees. Stewards reviewing at high volume and high approval rate drift into this without noticing.',
  },
  {
    name: 'Skill atrophy on rare failures',
    text: "The cases that need a human are, by construction, rare and unusual: exactly the cases the human now has the least practice on. A steward who hasn't worked a hard case in months is not as sharp on it as one who used to do that work daily.",
  },
  {
    name: 'Monitoring fatigue',
    text: 'Watching a system that mostly works is harder than working. Attention drifts; anomalies that would jump out to a fresh observer slide past a saturated one.',
  },
  {
    name: 'Substitution illusion',
    text: "Adding automation often doesn't reduce human work — it changes its shape, and the new shape is sometimes harder. The steward role isn't a smaller engineer role; it's a different role with its own cognitive demands.",
  },
];

// The reallocation, drawn: not less human involvement — the same involvement
// moved from the high-volume middle to both ends. Static and signaled;
// there is nothing here to simulate.
function ReallocationFigure() {
  const seg = (label, flex, kind) => ({ label, flex, kind });
  const rows = [
    {
      role: 'the engineering role, traditionally',
      segs: [
        seg('upstream · design', 1.2, 'end'),
        seg('execution — write, review, ship, repeat', 5, 'mid'),
        seg('hard calls', 1, 'end'),
      ],
    },
    {
      role: 'the steward',
      segs: [
        seg('upstream — intent, taste, terrain, contracts', 3, 'end'),
        seg('the loops run the middle', 1.6, 'mid'),
        seg('downstream — adjudication, veto on the irreversible', 2.8, 'end'),
      ],
    },
  ];
  return (
    <figure
      style={{ margin: '18px 0' }}
      role="img"
      aria-label="Reallocation diagram. Traditionally, most of the role's weight sits in the high-volume execution middle, with thin slices upstream and downstream. The steward's weight inverts: wide upstream and downstream bands, while the middle — run by the loops — narrows."
    >
      <div aria-hidden="true" style={{ display: 'grid', gap: 10 }}>
        {rows.map((row) => (
          <div key={row.role}>
            <span className="mh-kicker" style={{ display: 'block', marginBottom: 4 }}>
              {row.role}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {row.segs.map((s) => (
                <div
                  key={s.label}
                  className="mono"
                  style={{
                    flex: s.flex,
                    minWidth: 0,
                    padding: '8px 8px',
                    fontSize: '10.5px',
                    borderRadius: 3,
                    border:
                      s.kind === 'end' ? '1px solid var(--accent)' : '1px dashed var(--line-soft)',
                    background: s.kind === 'end' ? 'var(--accent-soft)' : 'var(--paper-3)',
                    color: s.kind === 'end' ? 'var(--accent-ink)' : 'var(--ink-faint)',
                  }}
                >
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <figcaption style={{ fontSize: '12.5px', color: 'var(--ink-2)', margin: '8px 0 0' }}>
        The reallocation: from the high-volume, low-stakes middle to both ends. The middle doesn't
        disappear — it stops being yours.
      </figcaption>
    </figure>
  );
}

export default function Ch17() {
  return (
    <Chapter n={17} covers="§3.5">
      <Lede>
        Many-hands systems do not reduce human involvement. They reallocate it — and the failure
        modes of the human in the new shape are documented, decades deep, in fields that automated
        first.
      </Lede>

      <p>
        The single most persistent misconception about these systems is that they shrink the human
        role. The handbook's answer is one verb: they <em>reallocate</em> it, from the high-volume,
        low-stakes middle to both ends — upstream to the design of the conditions, downstream to the
        adjudication of cases that exceed autonomy. You have already done most of the upstream work
        in this book without the job title: placed decisions, ratified a convention, graded
        guardrails, scheduled a disturbance. This chapter names the role those acts belong to, and
        spends most of its time on the part the org chart never shows: what the role does to the
        person in it.
      </p>

      <ReallocationFigure />

      <p>Where the work goes, end to end:</p>
      <ul style={{ fontSize: '15px', color: 'var(--ink-2)', paddingLeft: 20 }}>
        {WORK.map((w) => (
          <li key={w.where} style={{ margin: '6px 0' }}>
            <strong>{w.where}</strong> {w.text}
          </li>
        ))}
      </ul>

      <p>
        The shape that falls out: lower-frequency, higher-authority than the traditional engineering
        role. Fewer actions, each with more weight — if engineers in a mature platform find
        themselves doing more execution and less decision, the ratios are inverted. And the atomic
        unit of the <Term id="steward" />
        's authority is the considered thumbs-up: not rubber-stamped, not reflexive, the deliberate
        approval at the moments that matter, backed by the upstream work that made the moment
        considerable.
      </p>

      <Pull badge="W">
        A steward who approves everything isn't stewarding. A steward who approves nothing hasn't
        built the terrain to trust.
      </Pull>

      <p>
        Now the hard part. The role is harder than it looks, and the ways it fails are not software
        speculation — aviation and medicine automated decades before software did, watched humans
        supervise mostly-right systems at volume, and converged on the same four observations{' '}
        <Badge
          layer="E"
          note="human-factors literature from aviation and medicine; the four failures below are its converged findings"
        />
        . They transfer because the conditions transfer: high volume, high approval rate, rare
        consequential exceptions.
      </p>

      <div className="mh-cardgrid">
        {FAILURES.map((f) => (
          <div className="mh-card" key={f.name}>
            <span className="mh-kicker">
              documented failure <Badge layer="E" note="aviation and medicine, converged" />
            </span>
            <h4>{f.name}</h4>
            <p style={{ margin: 0 }}>{f.text}</p>
          </div>
        ))}
      </div>

      <p>
        The first of those — automation bias — has a signature an instrument can catch, and the
        figure below renders it. Twelve saturated weeks; two lines. Watch the gap, not either line:
        the approval rate climbing while sampled deep-review agreement falls is a steward eroding,
        drawn as the divergence of the system's self-report from a second considered look. Flip to
        the dissent run before you trust the instrument, because the same saturation can wear the
        other temperament and leave this chart silent while the queue eats the bill.
      </p>

      <DivergenceChart />

      <p>
        Notice what the figure never asked of anyone: vigilance. That is §3.5's closing move, and it
        is the chapter's. The defense isn't willpower. It's terrain. <strong>Triangulation</strong>{' '}
        — multiple metrics, sampled deep review, adversarial probing — catches what a tired steward
        misses; you just used it. <strong>Rotation</strong> prevents any one person from carrying
        the role too long; the saturated observer is the last to notice saturation.{' '}
        <strong>Practice cases</strong> — deliberately working through hard examples even when none
        arrive — keep the rare-failure skills warm. <strong>Time upstream</strong>, explicitly
        budgeted for terrain design rather than approval, is what makes the role sustainable at all.
        The steward's job, said once and meant structurally: build a system where the human in it
        can succeed.
      </p>

      <p>
        No hard case arrived this chapter. Per the discipline, here are two anyway — one on this
        chapter's own instrument, one reaching back four chapters to a trace that looks worse than
        it is.
      </p>

      <Drill cases={PRACTICE} title="Practice cases · administered, none having arrived" />

      <DecisionCard
        title="Before you take the steward rotation"
        items={[
          'Count last week\'s considered approvals. If the number embarrasses the word "considered," the gates are misplaced, not your attention — Chapter 18 is the fix.',
          'Triangulate by default: a second metric, a sampled deep look, one adversarial probe. Never let one rate testify alone.',
          'Rotate on a schedule, not on burnout. The saturated observer is the last to notice saturation.',
          'Run one hard case on purpose in every week none arrives; rare failures are exactly what you are not practicing.',
          'Budget upstream time as a line item. Zero upstream weeks are the saturation signature, not a productivity win.',
          'Hold the veto on the irreversible personally. That one does not delegate, and the next chapter prices everything else.',
        ]}
      />

      <Coda
        line="The defense is not willpower. It is terrain — a role built so the human inside it can succeed."
        next="Chapter 18 gives the role its arithmetic: the gate, the rate, and the budget the whole chapter kept gesturing at."
      />
    </Chapter>
  );
}
