// Ch21.jsx — Where this doesn't work (covers §3.10).
// Boundary conditions as transfer training: the Decline Drill runs the case
// bank's five decline cases on novel surfaces; the single-expert-plus-one-agent
// mode is honored as the other mode; the capable-single-agent future is
// acknowledged with the handbook's own words, verbatim. The retrieval rail
// reaches back to Ch 19 (pl-03) and Ch 13 (sp-01).

import { Badge, Chapter, Coda, DecisionCard, Drill, Lede, Pull } from '../../components/kit.jsx';
import { CASES } from '../../engine/cases.js';

const DECLINE_CASES = CASES.filter((c) => c.kind === 'decline');
const RETRIEVAL_CASES = ['pl-03', 'sp-01'].map((id) => CASES.find((c) => c.id === id));

const COMPOUNDS = [
  'Greenfield or near-greenfield systems, where the terrain can be designed deliberately from the start.',
  'Codebases with strong, fast tests: cheap, reliable verification is the raw material every loop closes against.',
  'Domains where most changes are reversible and most decisions can live in the bazaar mode.',
  'Teams with the budget and discipline to invest in harnesses and terrain before scaling agents.',
  'Tasks that decompose cleanly into bounded loops with clear signals.',
];

const STRUGGLES = [
  'Brownfield codebases full of accumulated entropy, where building a legible terrain may cost more than doing the work the old way.',
  'Safety-critical and regulated domains (avionics, medical devices, financial settlement, nuclear), where the planned mode is correctly dominant, the verification regime is heavyweight by law, and emergent coordination is a category error rather than a tool.',
  'Highly ambiguous product work, where the question is not how do we build this but what should we build: human judgment carries most of the load, and many-hands compounding offers little.',
  'Verification-hard problems, where checking correctness is much harder than producing output (security-sensitive cryptography, novel ML architectures, complex distributed protocols). The framework still applies, but the gates stay tight and the budget stays small for a long time.',
];

const VERBATIM =
  '"There is also a possible future I want to acknowledge cleanly: capable enough single ' +
  'agents may eventually subsume some of what this framework addresses. If a single ' +
  'sufficiently-capable agent can hold the entire context, do the placement, run the loops, ' +
  "and exercise the judgment, the multi-hand coordination layer becomes thinner. I don't " +
  "think we're there. I think the framework is useful in the world we have, and probably in " +
  "the world we'll have for the meaningful future. But I'd rather name the possibility than " +
  'pretend it isn\'t on the horizon."';

export default function Ch21() {
  return (
    <Chapter n={21} covers="§3.10">
      <Lede>
        A framework that doesn't say where it doesn't apply is a framework that hasn't earned its
        claims. This chapter is the saying, and it trains the hardest transfer skill: declining.
      </Lede>

      <p>
        You have spent seven chapters learning to build the machinery. The matching skill is knowing
        when not to, because a judgment framework over-applied stops being judgment. The handbook
        draws its own boundary in two lists, and they are worth holding side by side. Where Many
        Hands tends to compound:
      </p>
      <ul>
        {COMPOUNDS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>Where it struggles, or is explicitly worse than the alternatives:</p>
      <ul>
        {STRUGGLES.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <p>
        Notice the last entry does not say decline; it says tight gates and a small budget for a
        long time. The boundary is not one line, and that is exactly why it has to be drilled rather
        than memorized. Reading a surface you have never seen and choosing full adoption, tight
        gates, or a clean decline is the same placement discipline from chapter 5 pointed at the
        framework itself, and the over-application error has been waiting for you since the book's
        first scheduled misconception list. Five engagements follow. None of them is a dependency
        bump. Two of them have answers the axes genuinely contest, and the feedback says so. Commit
        on each; the reasoning argues back from the boundary conditions, not from a key.
      </p>

      <Drill title="The decline drill" cases={DECLINE_CASES} />

      <p>
        One of those cases earned its decline for a reason worth naming on its own: the work already
        fit inside one expert and one agent, in flow. The handbook is specific about this, because
        it is the honesty that keeps the framework from becoming a hammer. Some of the most
        productive work its author has seen is exactly that mode: a skilled engineer pairing closely
        with a single capable agent for hours on a focused problem, no orchestration, no multi-agent
        coordination, no platform overhead. Many Hands does not replace that mode. It addresses the
        other one: when the work has scaled past what one expert and one agent can hold in a single
        session, when the team is shipping more than any individual reads, when coordination across
        loops is the bottleneck. Both modes will coexist, and choosing between them is a placement
        call, not a maturity ranking.
      </p>

      <Pull badge="W">
        A team that always works in the many-hands mode is over-engineering; a team that never does
        is leaving compounding on the table.
      </Pull>

      <p>
        There is one more boundary, further out, and the handbook names it in its own words rather
        than letting the book soften it{' '}
        <Badge layer="W" note="§3.10 — the author's acknowledgment, quoted verbatim" />:
      </p>

      <figure style={{ margin: '16px 0' }}>
        <span className="mh-kicker">The handbook, §3.10, verbatim</span>
        <blockquote
          style={{
            margin: '8px 0 0',
            padding: '2px 0 2px 16px',
            borderLeft: '3px solid var(--line)',
            color: 'var(--ink-2)',
            fontSize: '15px',
            lineHeight: 1.7,
          }}
        >
          {VERBATIM}
        </blockquote>
      </figure>

      <p>
        That is the right shape for the claim: a horizon named, not priced. If that future arrives,
        the coordination layer thins; the placement discipline, the trust ledger, and the considered
        yes do not obviously go with it. Until then, the skill this chapter trained decays like any
        other, so two cases from earlier benches close it: a deletion that looks reversible, and a
        queue that looks like a storm. Both are over-application traps, in opposite directions.
      </p>

      <Drill title="Retrieval · two traps from earlier benches" cases={RETRIEVAL_CASES} />

      <DecisionCard
        title="Before you adopt, or decline"
        items={[
          'Run the three axes over the whole surface, not the average case: one irreversible action class can set the posture for the entire catalog.',
          "Find the oracle first. If verification needs a human's hands, or hardware you don't have, loops have nothing to close against.",
          "Do the brownfield arithmetic out loud: terrain cost, amortized over remaining life and change volume. If it cannot repay, decline, and point the loops at what's next.",
          'In regulated and safety-critical domains, planned dominance is correct, not timid. Agents still help, as tools inside the planned process.',
          'Verification-hard does not mean decline. It means tight gates and a small budget, for a long time.',
          'Ask what the bottleneck actually is: if one expert and one agent can still hold the work in a session, that mode is the right one, and it is not the lesser one.',
          'Record the decline like a placement: written down, with its axes, re-run when the terrain changes.',
        ]}
      />

      <Coda
        line="The framework's last discipline is knowing where it stops."
        next="Chapter 22 stops teaching: a shop you have never seen, twelve steward actions, and the memo you carry out the door."
      />
    </Chapter>
  );
}
