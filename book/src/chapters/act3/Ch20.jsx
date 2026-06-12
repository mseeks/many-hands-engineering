// Ch20.jsx — Measurement, correctness, security (covers §3.8–3.9).
// The Goodhart bench carries §3.8's mechanism (one target gamed; triangulation
// pricing it; the blank gauges). §3.9 lands mostly in prose, as the handbook
// holds it: the Böckeler gap named as a gap, behavioral-vs-specified tests as
// one paired artifact, security as a second trust ledger, and the
// oracle-strength principle as a froot field extension. The closing drill
// reaches back to Ch 17 (gt-03) and Ch 9 (sp-02).

import {
  Artifact,
  Badge,
  Chapter,
  Coda,
  DecisionCard,
  Drill,
  FieldSpecimen,
  Lede,
  Pull,
} from '../../components/kit.jsx';
import GoodhartBench from '../../labs/GoodhartBench.jsx';
import { CASES } from '../../engine/cases.js';

const byId = (id) => CASES.find((c) => c.id === id);

/* ── The paired test: one body, two markings ───────────────────────────── */

const TEST_BODY = [
  { no: 3, text: "test('export batches at 500 rows', () => {" },
  { no: 4, text: '  const batches = exportRows(fixture(1700));' },
  { no: 5, text: '  expect(batches.map((b) => b.length))' },
  { no: 7, text: '});' },
];

const BEHAVIORAL_LINES = [
  { no: 1, text: '# test-backfill loop · generated 2026-04-12', kind: 'comment' },
  {
    no: 2,
    text: 'marked: behavioral',
    kind: 'key',
    hot: true,
    annot: 'a photograph of what the code does today',
  },
  ...TEST_BODY.slice(0, 3),
  { no: 6, text: '    .toEqual([500, 500, 500, 200]);', annot: 'true because the code says 500' },
  TEST_BODY[3],
];

const SPECIFIED_LINES = [
  { no: 1, text: '# billing contract INV-209 · invoices cap at 500 lines', kind: 'comment' },
  {
    no: 2,
    text: 'marked: specified',
    kind: 'key',
    hot: true,
    annot: 'a promise about what the code must do',
  },
  ...TEST_BODY.slice(0, 3),
  {
    no: 6,
    text: '    .toEqual([500, 500, 500, 200]);',
    annot: 'true because the contract says 500',
  },
  TEST_BODY[3],
];

/* ── The injection-surface case ────────────────────────────────────────── */

const INJECTION_CASE = {
  id: 'sec-01',
  surface:
    'Support tooling: the reply-drafting agent holds auto-send on order-status replies. A new feature folds customer-uploaded attachments into its context.',
  prompt: '238 sent, zero escalations. Does the record cover the new surface?',
  evidence: [
    {
      label: 'The functional record',
      text: '238 auto-sent order-status replies over 11 weeks, zero complaints, earned entirely under text-only context drawn from the order database.',
    },
    {
      label: 'The change',
      text: 'Attachments now render into the prompt: PDFs, OCRed images, forwarded email threads. Same class key, "order-status replies."',
    },
    {
      label: 'The surface',
      text: 'An attachment is attacker-authored input sitting in the same context window as the send authority. Nothing in 11 weeks of history contained one.',
    },
  ],
  options: [
    {
      id: 'covered',
      label: 'Covered: the class is order-status replies, and these are still order-status replies',
    },
    {
      id: 'new-surface',
      label:
        'Not covered: the security record for attacker-authored context is empty; auto-send resets for the attachment path',
    },
    {
      id: 'sanitize',
      label: 'Keep auto-send; add a filter that strips suspicious attachments first',
    },
  ],
  answer: 'new-surface',
  feedback: {
    'new-surface':
      'The functional column is full and the security column for this surface is empty: 238 sends prove the agent drafts good replies from trusted context, and say nothing about what it does when the context itself is adversarial. The two ledgers fail differently, too. Reply quality fails loudly, to a complaint; an injection fails silently, to an attacker holding the send grant. Propose-only on anything whose context includes an attachment, until a red-teamed record exists, and run the red team at agent cadence, because that is the cadence the attacker runs at.',
    covered:
      'The class key says replies; the failure modes say two classes. Under text-only context the worst input was a confused customer. An attachment is authored by whoever wants the agent to act on their behalf, and "did it draft a good reply" and "did it follow instructions hidden in a PDF" are verified by different oracles entirely. The five properties apply separately to security posture: same class name, different ledger, and this ledger has zero rows.',
    sanitize:
      'A filter in front of an injection surface is a guardrail, so grade it the way chapter 11 graded guardrails: by its failure mode. It must recognize attacks the record has never seen, and it sits in the exact path it protects, which is the dependent-circuit-breaker shape, likeliest to fail when needed most. Keep the filter as one triangulating layer if you like; it does not substitute for resetting the authority while the security record accrues.',
  },
};

const DRILL_CASES = [INJECTION_CASE, byId('tr-04'), byId('gt-03'), byId('sp-02')];

/* ── The pace-layer panel ──────────────────────────────────────────────── */

const PACE_ROWS = [
  {
    layer: 'Invocation',
    metrics: 'latency, cost, error rate, rollback rate, tool-call failure, escalation rate',
    note: 'operational: is it working, and how expensively?',
  },
  {
    layer: 'Orchestration / agent',
    metrics: 'eval scores, eval drift, trajectory variety, ratio of autonomous to assisted',
    note: 'the last is the headline metric of the transition',
  },
  {
    layer: 'Capability',
    metrics: 'coverage, integration time, obsolescence rate',
    note: 'high inflow plus low retirement is accumulating cruft',
  },
  {
    layer: 'Architecture / governance',
    metrics: 'DORA metrics, SPACE-style orthogonal metrics',
    note: 'lagging and coarse, by design',
  },
];

/* ── The chapter ───────────────────────────────────────────────────────── */

export default function Ch20() {
  return (
    <Chapter n={20} covers="§3.8–3.9">
      <Lede>
        Sixteen weeks from now the headline number on your panel is up two-thirds, and it is the
        worst news on the board. The panel will call it progress, because the panel is what got
        gamed.
      </Lede>

      <p>
        Every metric is a proxy, and every proxy can be gamed. The two pure responses both fail:
        measure nothing and you fly blind; measure everything and you set a Goodhart buffet, every
        number a target, every target a seam. The handbook's position is the narrow path between
        them: measure a small number of things at each pace layer, triangulate anything used as a
        target, and reserve the important questions for judgment. The bench below earns each clause
        in that sentence the hard way. It charts one target, merged PRs per week, and asks you to
        commit, before it draws the line, to what the deep-review sample did while the target
        climbed. The sample was scored every week. It was charted nowhere. Predict first; the gap
        between the two lines is the chapter.
      </p>

      <GoodhartBench />

      <Pull badge="W">A proxy under targeting pressure stops measuring what it proxied.</Pull>

      <p>
        Hold on to what the second task did and did not do. Adding change-failure and rollback to
        the panel prevented nothing: the climb started identically, because the target still paid.
        What the two lines changed is that the gaming surfaced as visible cost, in numbers the gamer
        could not also inflate, soon enough to act on. That is the triangulation rule{' '}
        <Badge
          layer="W"
          note="§3.8 — if a metric will be used as a target, add at least two independent metrics that would be harmed by gaming it"
        />
        : velocity alone will be gamed; velocity plus change failure plus rollback cannot be gamed
        without the cost showing somewhere. It is the single most practical defense against Goodhart
        in a platform, and it costs two extra lines on a panel. Where those lines belong is a
        placement question, so the handbook places them by pace layer. Run your eye down the notes
        column: the bottom row is slow on purpose.
      </p>

      <table className="mh-table">
        <thead>
          <tr>
            <th>Pace layer</th>
            <th>Good metrics</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {PACE_ROWS.map((r) => (
            <tr key={r.layer}>
              <td style={{ color: 'var(--ink)' }}>{r.layer}</td>
              <td>{r.metrics}</td>
              <td>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        Coordination, maintainability, trust: everything the framework has built so far is
        necessary, and it is not sufficient. A platform whose loops compound and whose commons stays
        clean can still ship code that does the wrong thing, or opens a hole an attacker can walk
        through. Authority answers who is allowed to do what; correctness and security answer
        whether what got done was right. And here the handbook names an honest gap rather than
        papering over it{' '}
        <Badge
          layer="E"
          note="Birgitta Böckeler's early read of the OpenAI harness work; the handbook adopts the gap as its own (§3.9)"
        />
        : it is easier to specify how code is organized than whether it does what users actually
        need. Architectural rigor yields to mechanical enforcement. Functional correctness requires
        deeper feedback between the system and the world it claims to serve, and where this handbook
        does not address that in detail, it says so: a gap acknowledged, not hidden. The
        secure-by-design, adversarial-ML, and verification-aware-development literatures are the
        right place for the specifics; the framework's contribution is to insist these belong in the
        conversation, not at its edge. Three commitments follow.
      </p>

      <p>
        First: behavior verification, not just artifact verification. A test that pins current
        behavior is not a test that confirms intended behavior, and a terrain full of the first kind
        feels verified while binding nothing. Where the difference matters, the difference must be
        visible on the test itself. Read line 2 in each pane below; it is the only line that
        differs.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 14,
          margin: '12px 0',
        }}
      >
        <div>
          <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
            The same test, marked behavioral
          </span>
          <Artifact lines={BEHAVIORAL_LINES} />
        </div>
        <div>
          <span className="mh-kicker" style={{ display: 'block', marginBottom: 6 }}>
            The same test, marked specified
          </span>
          <Artifact lines={SPECIFIED_LINES} />
        </div>
      </div>

      <p>
        Both runs are green today, and the green means different things. When a future change flips
        the left test, the marking says: the photograph is stale, regenerate it. When the same
        change flips the right test, the marking says: someone is about to break the billing
        contract, escalate. Same assertion, same fixture, opposite escalation paths, and the marking
        is what routes them. This is why the test-backfill loop from chapter 15 marks every test it
        generates as behavioral, explicitly: a loop can photograph behavior at scale, and only a
        human, or a contract, can promote a photograph into a promise.
      </p>

      <p>
        Second: security is a distinct dimension of trust, which means the chapter 19 ledger runs
        twice. The five properties apply to functional correctness; they apply again, separately, to
        security posture, and the second ledger starts emptier than you think. An agent earned
        auto-merge on a class of changes. Did its track record cover injection-prone surfaces?
        Authorization-sensitive ones? Did the model that earned the trust have the same security
        training as the one running today? These are different questions from the functional ones,
        and they fail differently: a functional miss fails loudly, to a revert; a security miss
        fails silently, to whoever found the hole. A clean record meeting an injection-prone surface
        its history never covered is not a trusted system. It is an unmeasured one wearing a trusted
        system's number.
      </p>
      <p>
        Third: adversarial pressure on outputs, not just on infrastructure. Chapter 12's disturbance
        practice shakes the terrain; the same posture has to reach the changes the system ships.
        Red-team the outputs: adversarial probes, fuzzing, mutation tests, security scans, at agent
        cadence, not at quarterly-audit cadence, because the attackers are using the same tools as
        the defenders and their loop already runs continuously. Correctness and security are
        first-class concerns, not downstream consequences of good coordination.
      </p>

      <FieldSpecimen source="froot · loop ledger, oracle column · 2026-05">
        <pre>{`loop                 oracle                            autonomy ceiling

dep-patch            target repo CI (red/green)        acting gate, allowlisted repos
determinism-review   local judge model                 advisory: PR comment, forever
a11y-review          local judge + static checks       advisory, off by default`}</pre>
      </FieldSpecimen>

      <p>
        One fleet's answer to a question the handbook leaves open, offered as a working extension{' '}
        <Badge layer="W" note="field extension, N=1: autonomy ordered by oracle strength" />: a loop
        earns autonomy only as far as its oracle can be trusted. The dep-patch loop can earn an
        acting gate because its oracle is the target repo's CI, outside the loop and outside the
        model. The review loops score against a local judge model, so their output stays advice no
        matter how good their track record looks, because that record measures agreement with a
        judge nobody has audited at acting strength. The strength of the oracle, not the strength of
        the agent, sets the ceiling.
      </p>

      <p>
        Four cases to close, surfaces deliberately far apart: an injection surface meeting a clean
        ledger, a vendor's "identical weights" bulletin, a 99.2% approval rate, and an eval that
        climbs while defects double. One question runs under all four: what does this number
        actually let you conclude?
      </p>

      <Drill title="Retrieval · what the number lets you conclude" cases={DRILL_CASES} />

      <DecisionCard
        title="Before a number goes on the panel"
        items={[
          'Will it be used as a target? Then add at least two independent metrics that gaming it would damage, and check the independence, not just the count.',
          'Place it on its pace layer: invocation numbers answer "is it working"; governance numbers are lagging and coarse on purpose.',
          'If the question is abstractions, direction, taste, or norms: no number. Assign it to a human, and trust the judgment.',
          'Mark every test behavioral or specified. The marking decides what a red run means and where it escalates.',
          'Run the trust ledger twice: the functional record and the security record are separate columns, and they fail differently.',
          'Red-team outputs at agent cadence: probes, fuzzing, mutation tests, scans, continuously, because that is the cadence the attacker runs at.',
          'Cap autonomy at oracle strength: a loop scored by an unaudited judge stays advisory, whatever its rate reads.',
        ]}
      />

      <Coda
        line="What the panel carries decides what gaming costs; what it leaves blank is a design decision too."
        next="Chapter 21 turns the same honesty on the framework itself: where Many Hands does not apply, and how to decline well."
      />
    </Chapter>
  );
}
