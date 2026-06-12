// Ch 23 · Provenance — the lineage, the harness-engineering chronology, and
// the §4.4 evidence distribution. Static and signaled: taxonomies don't need
// animation. Covers §4.1, §4.2, §4.4.

import {
  Badge,
  Chapter,
  Coda,
  DecisionCard,
  Drill,
  Lede,
  Mark,
  Pull,
} from '../../components/kit.jsx';
import { CASES } from '../../engine/cases.js';

/* ── §4.1 — the lineage ledger ───────────────────────────────────────── */

const TONE = {
  strong: 'var(--accent-ink)',
  hedged: 'var(--amber)',
  total: 'var(--ink)',
};

const LINEAGE = [
  {
    id: 'swarm',
    tradition: 'Biology and swarm intelligence',
    sources: "Grassé's stigmergie (1959) · Theraulaz & Bonabeau · Dorigo's ACO (1992 on)",
    gave: 'The signal mechanism itself: coordination through marks in a shared medium, no caller anywhere. The four dynamics and the exploration floor (Ch 8, 9).',
    weight: 'strong evidence',
    tone: 'strong',
  },
  {
    id: 'economics',
    tradition: 'Economics and distributed knowledge',
    sources: 'Hayek (1945) · Ostrom, Governing the Commons (1990)',
    gave: 'Prices as compressed signals of dispersed knowledge; how decentralized institutions succeed where markets and central planning fail. The whole of Ch 7.',
    weight: 'strong · one of the most empirically grounded bodies in social science',
    tone: 'strong',
  },
  {
    id: 'open-source',
    tradition: 'Open source',
    sources: 'Raymond, The Cathedral and the Bazaar (1997, 1999)',
    gave: 'The planned/emergent vocabulary itself, renamed from cathedral/bazaar so the distinction travels beyond open source (Ch 2, 4).',
    weight: 'the conceptual debt is total',
    tone: 'total',
  },
  {
    id: 'organizations',
    tradition: 'Organizations',
    sources: 'Conway (1968) · Simon (1962) · Brand (1994)',
    gave: 'Communication structure becomes system structure; near-decomposability at the boundaries; the pace layers under Ch 6.',
    weight: 'strong across decades',
    tone: 'strong',
  },
  {
    id: 'cybernetics',
    tradition: 'Cybernetics',
    sources: 'Ashby (1956) · Beer, viable system model',
    gave: 'Requisite variety as a lower bound on regulation: the floor under every guardrail you graded in Ch 11.',
    weight: 'strong theoretically · mixed in institutional application',
    tone: 'hedged',
  },
  {
    id: 'military',
    tradition: 'Military command',
    sources: 'Prussian Auftragstaktik · modern mission command',
    gave: "Specify intent, delegate means, trust the unit: the steward's grammar of Ch 17.",
    weight: 'strong historical evidence',
    tone: 'strong',
  },
  {
    id: 'software',
    tradition: 'Software and systems',
    sources:
      'Brooks (1975) · CAP, CRDTs, reconciliation, gossip · TLA+, B method, property-based testing',
    gave: 'Planned-mode pathologies (Ch 10); the engineering vocabulary for emergent coordination and for planned guarantees, one canon per pole.',
    weight: 'strong both directions',
    tone: 'strong',
  },
  {
    id: 'human-factors',
    tradition: 'Human factors',
    sources:
      'Bainbridge, the ironies of automation (1983) · automation bias, complacency, skill atrophy',
    gave: "The steward's four failure modes and the rubber-stamp divergence chart (Ch 17).",
    weight: 'strong across aviation, medicine, and now AI-assisted engineering',
    tone: 'strong',
  },
  {
    id: 'security',
    tradition: 'Security and authority',
    sources:
      'Saltzer & Schroeder (1975) · Dennis & Van Horn capabilities (1966) · NIST SP 800-207 zero trust (2020)',
    gave: 'Least privilege, capability grants, never-implicit trust: §3.7 is a direct adaptation, and Ch 19 ran it as a ledger.',
    weight: 'strong',
    tone: 'strong',
  },
  {
    id: 'complexity',
    tradition: 'Philosophy of complexity',
    sources: 'Scott, Seeing Like a State (1998) · Alexander, "A City is Not a Tree" (1965)',
    gave: 'Legibility versus metis: the axis you could be wrong about in Ch 5, and the warning about tidy maps over living systems (Ch 10).',
    weight: 'mixed-to-strong, depending on the claim',
    tone: 'hedged',
  },
];

/* ── §4.4 — the evidence bands ───────────────────────────────────────── */

const BANDS = [
  {
    id: 'very-strong',
    label: 'Very strong',
    tone: 'var(--accent-ink)',
    items:
      "The mathematical results; the distributed-systems impossibility theorems; the empirical record of major failures (Knight Capital, AWS US-EAST-1, Meta BGP 2021, CrowdStrike 2024, XZ Utils, NPfIT, Healthcare.gov); automation-bias research; the DORA practice-performance correlations; Conway's Law; Ostrom's design principles.",
  },
  {
    id: 'strong',
    label: 'Strong',
    tone: 'var(--accent-ink)',
    items:
      'The shape of effective engineering practice (CI, small batches, observability, progressive delivery); formal methods in safety-critical domains; the broad outline of where autonomous coding agents succeed (narrow, reversible, well-tested) and fail (ambiguous, cross-cutting, novel).',
  },
  {
    id: 'mixed',
    label: 'Mixed',
    tone: 'var(--amber)',
    items:
      'Vendor productivity claims for AI coding assistants; benchmark numbers for autonomous agents; multi-agent orchestration patterns versus strong single-agent baselines at equal compute; the Spotify model; "edge of chaos" as a design principle.',
  },
  {
    id: 'sparse',
    label: 'Sparse',
    tone: 'var(--ink-faint)',
    items:
      'Long-term skill-atrophy effects; optimal human intervention frequencies; spec-driven development with AI at industrial scale; adversarial spec testing case studies; industry-wide failure telemetry for autonomous coding agents.',
  },
];

/* ── §4.2 — the harness-engineering chronology, dated ────────────────── */

const CHRONOLOGY = [
  {
    date: 'Feb 5, 2026',
    text: 'Mitchell Hashimoto publishes the originating definition: "anytime you find an agent makes a mistake, you take the time to engineer a solution such that the agent never makes that mistake again."',
  },
  {
    date: 'Feb 11',
    text: 'OpenAI\'s "Harness Engineering: Leveraging Codex in an Agent-First World" documents an internal experiment shipping roughly a million lines of production code with no human-typed source.',
  },
  {
    date: 'Feb 17',
    text: 'Birgitta Böckeler (Thoughtworks) publishes the first analysis memo identifying the convergence and naming the gaps: maintainability is addressed; functional correctness is not.',
  },
  {
    date: 'Mar 2',
    text: 'Stripe documents an evaluation harness for coding agents.',
  },
  {
    date: 'Mar 12',
    text: 'HumanLayer publishes on coding-agent harness configuration.',
  },
  {
    date: 'Mar 24',
    text: 'Anthropic publishes design notes for long-running application harnesses.',
  },
  {
    date: 'Apr 2',
    text: 'Böckeler publishes a fuller framework, with categories of guides, sensors, and harness templates.',
  },
];

/* ── §4.2 — the strata, top to bottom ────────────────────────────────── */

const STRATA = [
  {
    id: 'stewardship',
    layer: 'Stewardship',
    owns: 'Placement calls, gate tables, approval budgets, intent',
    discipline: 'Many Hands · the human rate (Ch 17, 18)',
    seam: false,
  },
  {
    id: 'terrain',
    layer: 'Shared terrain',
    owns: 'The commons: signal field, trust ledgers, gate policies, boundaries between regions',
    discipline: 'Many Hands · where loops compound (Ch 7, 8, 19)',
    seam: false,
  },
  {
    id: 'harness',
    layer: 'Per-agent harness',
    owns: 'Tools, context architecture, structured documentation, architectural constraints, custom linters, garbage-collection loops',
    discipline: 'Harness engineering · Stage 0 of the staged transition (Ch 16)',
    seam: true,
  },
  {
    id: 'agent',
    layer: 'The agent',
    owns: 'Model, prompts, execution sandbox',
    discipline: "The vendor's layer, harnessed from above",
    seam: false,
  },
];

const DRILL_IDS = ['sp-03', 'gt-03', 'tr-01'];

export default function Ch23() {
  const drillCases = DRILL_IDS.map((id) => CASES.find((c) => c.id === id));
  return (
    <Chapter n={23} covers="§4.1 · §4.2 · §4.4">
      <Lede>
        Every badge you have tapped since Chapter 0 was an IOU: a promise that the claim traces back
        to something older and harder than this book. This chapter is the room the IOUs point into.
      </Lede>

      <p>
        Start with the dates. The oldest load-bearing source in the framework's foundations is from
        1945: Hayek, on prices as compressed signals of dispersed knowledge. The newest is from
        2020: NIST SP 800-207, zero trust. Between them sit 1956, 1959, 1962, 1965, 1966, 1968,
        1975, 1983, 1990, 1992, 1994, 1997, 1998, and 1999. The handbook's front matter declares
        what that spread implies: "The name is mine. The ideas are not." Ten traditions feed the
        framework, and Part IV tracks the debt openly, with a weight on each. The table below is
        that ledger, compressed. Read it like one: the middle column is what was borrowed and where
        you already used it, the right column is what the borrowing is worth, in the handbook's own
        grading. Notice what no row says. None of them says proven about anything this book asked
        you to <em>do</em>.
      </p>

      <table className="mh-table">
        <thead>
          <tr>
            <th scope="col">Tradition</th>
            <th scope="col">What it gave the framework</th>
            <th scope="col">Weight</th>
          </tr>
        </thead>
        <tbody>
          {LINEAGE.map((row) => (
            <tr key={row.id}>
              <td>
                <strong>{row.tradition}</strong>
                <br />
                <span className="mono" style={{ fontSize: '11.5px', color: 'var(--ink-faint)' }}>
                  {row.sources}
                </span>
              </td>
              <td>{row.gave}</td>
              <td>
                <span
                  className="mono"
                  style={{ fontSize: '11.5px', color: TONE[row.tone] }}
                  title={
                    row.tone === 'hedged'
                      ? 'A hedge in the source; read the whole grade'
                      : undefined
                  }
                >
                  {row.weight}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        Read the weight column bottom to top. Two rows wear amber: cybernetics is strong in theory
        and mixed where institutions tried to run it, and the philosophy-of-complexity shelf moves
        between mixed and strong depending on the claim. Everything else grades strong, and one row
        refuses the scale entirely. For open source the handbook writes "the conceptual debt is
        total": the framework's central vocabulary is Raymond's cathedral and bazaar renamed,
        because planned and emergent travel better across technical audiences and across every
        application of the distinction beyond open source itself. The renames are declared, every
        one. Signal where the stigmergy literature says pheromone. Boundary as the umbrella over
        contracts, gates, scopes, and zones. Placement and steward, coined outright, because the
        concepts are real and no existing word carries them.
      </p>

      <p>
        This table is where every badge in the book funnels. When a chip in Chapter 7 read{' '}
        <Badge layer="E" note="Ostrom's design principles, §4.4 very strong" />, it meant a row
        here: Ostrom, strong, one of the most empirically grounded bodies in social science. When
        the same chapter marked the software mapping{' '}
        <Badge layer="W" note="the repo-as-commons mapping, more recent than its source" />, it
        meant the bridge from that row to your repository, which no tradition can underwrite,
        because none of them watched a repo. Source and bridge, one grade each. The next figure
        prices the whole book that way.
      </p>

      <table className="mh-table">
        <thead>
          <tr>
            <th scope="col">Band</th>
            <th scope="col">What sits in it (§4.4, verbatim in substance)</th>
          </tr>
        </thead>
        <tbody>
          {BANDS.map((band) => (
            <tr key={band.id}>
              <td>
                <span
                  className="mono"
                  style={{
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: band.tone,
                  }}
                >
                  {band.label}
                </span>
              </td>
              <td>{band.items}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        Now the distribution, which is the chapter's real instrument. The structural claims (the
        spectrum is real, positive feedback is dangerous, commons need governance, variety must
        match variety) cluster in the top two bands. The named operational recommendations, the ones
        this book drilled you on (placement, the staged transition, approval economics, the five
        properties of trust), price strong-to-mixed, and the handbook calls them bets in as many
        words <Badge layer="W" note='"bets, informed by theory and early practice"' />. The bottom
        band holds none of the framework's weight: "None of the framework rests on sparse evidence;
        where it touches sparse territory, I say so." One claim touches it, long-term skill atrophy,
        and the framework hangs no recommendation on it; Chapter 25 leaves that bench deliberately
        unbuilt. A framework that grades its own sources this way has done something rarer than
        being right: it has told you exactly where to push.
      </p>

      <Pull>Nothing here is new except the assembly. The assembly is the claim.</Pull>

      <h3 className="mh-h3">The sibling discipline</h3>

      <p>
        One tradition is too young for the table. Across eight weeks of early 2026, a body of
        practice assembled itself in public under the name <strong>harness engineering</strong>, and
        the handbook treats the chronology as evidence in its own right: different shops arriving at
        similar conclusions, independently and quickly{' '}
        <Mark kind="real" note="the published record, dated" />. The dates carry the argument, so
        here they are.
      </p>

      <div
        role="list"
        aria-label="The harness-engineering chronology, 2026"
        style={{ margin: '18px 0' }}
      >
        {CHRONOLOGY.map((entry) => (
          <div
            role="listitem"
            key={entry.date}
            style={{
              display: 'grid',
              gridTemplateColumns: '92px 1fr',
              gap: 12,
              padding: '8px 0',
              borderTop: '1px solid var(--line-soft)',
            }}
          >
            <span
              className="mono"
              style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--amber)' }}
            >
              {entry.date}
            </span>
            <span style={{ fontSize: '14.5px', color: 'var(--ink-2)' }}>{entry.text}</span>
          </div>
        ))}
      </div>

      <p>
        The core observation across those seven entries matches the framework's: as agents take on
        more of the writing, the engineer's primary work shifts to designing the environment the
        agent operates in. OpenAI compressed it to "designing environments, feedback loops, and
        control systems," and the handbook answers with the strongest endorsement it gives anyone:
        "That sentence could be the spine of this framework." So the relationship is not rivalry. It
        is scope. A harness is a critical layer of terrain, specifically the per-agent layer, and
        the strata stack like this:
      </p>

      <table className="mh-table">
        <thead>
          <tr>
            <th scope="col">Layer</th>
            <th scope="col">Owns</th>
            <th scope="col">Discipline</th>
          </tr>
        </thead>
        <tbody>
          {STRATA.map((row) => (
            <tr key={row.id}>
              <td>
                <strong style={{ color: row.seam ? 'var(--amber)' : undefined }}>
                  {row.layer}
                </strong>
              </td>
              <td>{row.owns}</td>
              <td>
                <span className="mono" style={{ fontSize: '11.5px', color: 'var(--ink-faint)' }}>
                  {row.discipline}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        The amber row is the seam, and the two failure modes on either side of it are the reason
        both disciplines exist. A team with excellent harnesses but no shared terrain produces
        reliable per-agent work that fails to compound: fifty-odd scripts, zero shared signals, the
        amnesiac fleet from Chapter 14's specimens, the same pattern Chapter 15's composition lab
        rebuilt as its first run. A team with broad terrain but weak harnesses has agents that can't
        be trusted to do anything: the gate queue fills with proposals no oracle can clear. And the
        relationship comes with a deference clause, quoted exactly because frameworks rarely write
        one: "Where harness engineering is more developed, this framework defers to it." Harness
        practice is Stage 0 of Chapter 16's staging. Many Hands builds on that layer; it does not
        replace it.
      </p>

      <p>
        Three calls you have made before, back with their sources showing. As you commit, name the
        tradition doing the work underneath you: a planned-mode pathology Brooks documented in 1975,
        a divergence the automation-bias literature predicted before any coding agent existed, a
        reset the capability-security tradition designed into the grant.
      </p>

      <Drill title="The lineage, working" cases={drillCases} />

      <DecisionCard
        title="Before you lean on a borrowed claim"
        items={[
          'Name the tradition under it. If you cannot, you are probably holding the assembly itself, which the handbook declares a working hypothesis, not a proven methodology.',
          "Separate the source from the bridge: Ostrom's principles are evidence (Ⓔ); their mapping to your repository is a working bet (Ⓦ). Most mis-readings happen because the two travel in one sentence.",
          'Check the band: structural claims price very-strong-to-strong; the named operational moves (placement, staging, approval economics, the five properties) price strong-to-mixed.',
          'Sparse territory is flagged in the source: skill atrophy, intervention frequencies, spec-and-agent practice at scale. A derivative claim that does not flag it is overreaching its inheritance.',
        ]}
      />

      <Coda
        line="Nothing in the framework is new but the assembly, and the assembly is priced honestly: structural claims strong, operational moves strong-to-mixed, nothing resting on sparse."
        next="Chapter 24 opens the mathematical shelf of this inheritance and shows exactly where its bridge to your platform is informal."
      />
    </Chapter>
  );
}
