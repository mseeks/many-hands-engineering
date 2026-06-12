// Ch19.jsx — Trust (covers §3.7).
// The Trust Ledger lab carries the five properties as mechanisms and the
// authority ladder; the chapter carries the practical rule, the
// irreversibility definition, froot's failure-disposition asymmetry, and the
// four ways trust comes apart as an identification drill (the chapter's
// retrieval rail: two of its four cases reach back to Ch 17 and 18).

import {
  Badge,
  Chapter,
  Coda,
  DecisionCard,
  Drill,
  FieldSpecimen,
  Lede,
  Pull,
} from '../../components/kit.jsx';
import TrustLedgerLab from '../../labs/TrustLedgerLab.jsx';

/* ── The four ways trust comes apart, as cases ─────────────────────────── */

const DECAY_OPTIONS = [
  { id: 'drift', label: 'Silent environmental drift' },
  { id: 'erosion', label: 'Class boundary erosion' },
  { id: 'stamp', label: 'Invisible rubber-stamping' },
  { id: 'drag', label: 'Reputation drag' },
];

const FOUR_WAYS = [
  {
    id: 'fw-01',
    surface:
      'Agent fleet ops: the harness release over the weekend swapped the sandbox package resolver. Nobody re-read the trust grants.',
    prompt: 'Nothing has failed. Which decay is this?',
    evidence: [
      {
        label: 'The change',
        text: 'Harness 2.4 ships a different package resolver in the dep-patch sandbox. The release notes mention it; no one read them against the autonomy envelopes.',
      },
      {
        label: 'The grants',
        text: 'Auto-merge on patch bumps, earned over 14 weeks, every row stamped with the old toolchain.',
      },
      {
        label: 'The tell',
        text: 'Lockfile diffs run slightly larger since Monday. The approval rate has not moved.',
      },
    ],
    options: DECAY_OPTIONS,
    answer: 'drift',
    feedback: {
      drift:
        'The environment moved (tools are part of the stamp, next to model and permissions) and the envelopes that assumed the old environment are still wide open. No failure is required for this to be live: the grants now describe a system that no longer exists, which is the swap from the lab wearing a smaller disguise. The counter is the same: reset the affected classes to propose-plus-review and let the new toolchain re-earn, fast, on its own rows.',
      erosion:
        'Erosion is the work drifting to an adjacent class while the grant stays keyed wide; here the class is exactly what it was, patch bumps, and the work has not moved an inch. What moved is underneath the work: the toolchain that produces the proposals. Check what changed, not what the agent is doing, and this reads as drift.',
      stamp:
        'Rubber-stamping shows up in the review texture: time-in-review collapsing while the rate holds. Nothing in this trace says the stewards changed how they read; the proposals changed how they are made. The decay is in the environment stamp, not the human.',
      drag: 'Drag needs a difficulty gradient inside the class: easy instances training the steward to wave the hard ones through. No gradient appears here. The instances are the same; the resolver that assembles them is not, and that is an environment question.',
    },
  },
  {
    id: 'fw-02',
    surface:
      'Test-backfill loop: trusted on unit tests for pure utility modules, its last nine PRs add tests around I/O code, heavy with mocked clocks.',
    prompt: 'The grant is keyed to "test files only." Which decay is this?',
    evidence: [
      {
        label: 'The record',
        text: 'Auto-merge on utils/ test backfill: 96% over 12 weeks, earned on pure functions with cheap, exact assertions.',
      },
      {
        label: 'The drift',
        text: 'Nine recent PRs touch io/ with mocked clocks and stubbed sockets. They auto-merged, because the grant says "test files," not "utils/."',
      },
      {
        label: 'The tell',
        text: 'Two flaky tests this week traced to mocked-clock assumptions. Zero reverts on the ledger.',
      },
    ],
    options: DECAY_OPTIONS,
    answer: 'erosion',
    feedback: {
      erosion:
        'The work walked next door while the grant stayed keyed to the building. Tests for pure functions and tests for I/O have different failure modes: one fails loud and exact, the other rots into flake. The record does not transfer, but the auto-merge was never tightened, so adjacent work rides a reputation it did not earn. Re-key the grant to what was actually earned and start io/ at proposal-only.',
      drift:
        'Drift is the environment changing under constant work: model, tools, permissions. Here the environment is exactly January, and the work is what moved, out of utils/ and into io/, one near-identical-looking PR at a time. The stamp is fine; the key is too wide.',
      stamp:
        'The stewards are not in this loop at all. That is the point: the class auto-merges, so no one is skimming anything. The decay happened in the grant key, which let a neighboring class ride without a single human in the path.',
      drag: "Drag would mean hard instances of the same class coasting on easy ones. These are not hard instances of utils/ testing; they are a different class with a different verification story, wearing the same file extension. The boundary moved, not the difficulty. That is erosion's signature.",
    },
  },
  {
    id: 'fw-03',
    surface:
      'Steward console, week 38: the migration-helper class holds 97% approval all quarter. Median time-in-review fell from 9 minutes to 50 seconds.',
    prompt: 'The rate never moved. Which decay is this?',
    evidence: [
      {
        label: 'The headline',
        text: 'Approval steady at 97% for thirteen weeks. On the board it is the most stable class.',
      },
      {
        label: 'The texture',
        text: 'Median time-in-review: 9 minutes in week 25, 50 seconds in week 38. The queue doubled in week 30.',
      },
      {
        label: 'Triangulation',
        text: 'Sampled deep review agrees with the on-the-spot yes 79% of the time, down from 95%.',
      },
    ],
    options: DECAY_OPTIONS,
    answer: 'stamp',
    feedback: {
      stamp:
        'The chapter 17 divergence chart, live: the rate held while the meaning under it drained out. Fifty-second reviews are not reviews, so 97% now measures the skim, not the work, and the deep-review sample is the instrument that catches it (79% and falling). The number no longer means what it used to. Restore considered review on a sampled slice and re-base before any gate decision touches this class.',
      drift:
        'Check the stamps first, and here they hold: same model, same tools, same repo shape all quarter. What changed is on the human side of the gate. The proposals are produced the same way; they are read differently, which is a steward decay, not an environment one.',
      erosion:
        'Erosion needs the work itself to wander out of class, and nothing in evidence says migration-helper proposals changed shape. The class is the class. What hollowed is the yes: the same work, skimmed where it used to be read.',
      drag: 'Close, and worth separating: drag is a difficulty story (easy instances training the steward before hard ones arrive), and no difficulty gradient appears in this trace. What appears is queue pressure, week 30, and the review time collapsing after it. Pressure-driven skimming is the rubber stamp; the rate just kept smiling.',
    },
  },
  {
    id: 'fw-04',
    surface:
      'Schema-migration loop: auto-merge earned on a quarter of additive column adds. This month the same class is delivering backfills and index rebuilds on hot tables.',
    prompt: 'Stewards wave them through; the class "runs at 98%." Which decay is this?',
    evidence: [
      {
        label: 'How the record was built',
        text: 'Thirteen weeks of additive column adds: trivially green, trivially reversible, 98% approval.',
      },
      {
        label: 'What arrives now',
        text: 'Backfills and locking index rebuilds on the orders table, inside the same class key, reviewed in under a minute "because the class runs at 98%."',
      },
      {
        label: 'The asymmetry',
        text: 'A bad column add reverts in one migration. A bad backfill on a hot table is an incident.',
      },
    ],
    options: DECAY_OPTIONS,
    answer: 'drag',
    feedback: {
      drag: 'The easy instances built the number, and the number now reviews the hard ones. That is reputation drag: 98% was earned where mistakes were cheap, and it buys fast approvals exactly where mistakes are expensive. The class key is technically honest (it is all schema migration), which is why drag survives audits that erosion would fail. Split the class along the difficulty line, additive adds one side, backfills and rebuilds the other, and let each earn its own rate.',
      erosion:
        'Fair instinct, and the line between them is worth drawing once: erosion crosses a class boundary; drag exploits the spread inside one. Backfills are still schema migrations, so no key was violated. The record is real, the class is honest, and the trust still misleads, because the record was built at the cheap end of the class. The fix is the same shape though: draw a finer boundary.',
      stamp:
        'The under-a-minute reviews are real, but notice what produces them: not queue pressure, the record itself. The stewards are not skimming everything; they are extending a class-level trust built on the easy instances to the hard ones. The stamp is a symptom here; the drag is the cause.',
      drift:
        'Every stamp on this ledger still matches: same model, same tools, same repo shape. The environment held; the difficulty distribution inside the class did not. When the cause lives in what the work costs to get wrong rather than in what produces the work, you are reading drag, not drift.',
    },
  },
];

/* ── The chapter ───────────────────────────────────────────────────────── */

export default function Ch19() {
  return (
    <Chapter n={19} covers="§3.7">
      <Lede>
        Forty-seven merged, zero rolled back, and tonight the judge behind that record upgrades to
        one strictly better on every eval you have. Whether the trust survives the upgrade is worth
        more than the upgrade.
      </Lede>

      <p>
        Useful is not the same as trusted, and readable is not the same as authoritative. A system
        can let an agent see something without letting it act on it. It can let an agent act in one
        region and not another. It can trust an agent's work on Tuesday and re-verify it on
        Wednesday because a dependency changed overnight. In a many-hands platform, authority is a
        design dimension, not an afterthought: chapter 11 covered the mechanics of containment; this
        chapter is the philosophy of trust, what it is, how it is earned, and how it comes apart.
      </p>
      <p>
        The handbook gives earned autonomy five properties: <strong>earned</strong> (track record,
        not fiat or vendor claim), <strong>narrow</strong> (one class buys nothing on another),{' '}
        <strong>conditional</strong> (the environment is part of the trust),{' '}
        <strong>revocable</strong> (withdrawn instantly on evidence), and <strong>expiring</strong>{' '}
        (decays without fresh record). Any missing one is a place where the system will eventually
        be surprised <Badge layer="W" note="§3.7 — the five properties of real trust" />. Read as a
        list, they are easy to nod at. So the bench runs them as code instead: every grant below is
        re-derived from an environment-stamped ledger on every ask, and the centerpiece wants your
        prediction before it fires. Commit before the swap; the ledger is cleaner than any you will
        meet at work.
      </p>

      <TrustLedgerLab />

      <p>
        What you watched is the practical rule: trust belongs to a task class in a specific
        environment, and when the environment changes, some trust resets{' '}
        <Badge layer="W" note="§3.7 — the practical rule, run by the lab's stamp check" />. Three
        changes trigger it, and you ran two. The model underneath changes, and autonomy drops to
        propose-plus-review until the new model re-earns it. The permission set changes, and the new
        surface starts at proposal-only while the old class keeps its grant. The repository itself
        changes, a major refactor, a framework jump, a migration that reshapes what a "patch bump"
        even means, and the old record stops predicting, so autonomy resets for a calibration
        window. None of the three requires detecting a failure first. The misconception this chapter
        exists to break is that trust attaches to the agent and travels with it; the ledger says
        trust attaches to a class-in-an-environment and travels nowhere.
      </p>
      <p>
        The lab closed on five rows, and they deserve a second read: read, write, commit, deploy,
        external, five separate grants, evaluated separately. The defaults are not symmetric, and
        that is the design. Read runs wide so agents have context, narrowed only around secrets,
        personal data, and competitive information. Write runs narrow and expands class by class.
        Commit starts at none and is earned per class through exactly the ledger you just used.
        Deploy is never autonomous on the irreversible. External, paid API calls, emails, filings,
        trades, is deploy with the world as the blast radius. None of this is bureaucracy. The blast
        radius of a wrong action depends on which grant is engaged, and treating one grant as if it
        implied the next is how many of the worst failures happen.
      </p>

      <FieldSpecimen source="froot · gate dispositions + shadow-gate blockers · 2026">
        <pre>{`disposition, by authority:

  advisory loops (determinism-review, a11y-review)
    on uncertainty -> comment anyway; a human weighs it    # advice fails open

  acting loop (dep-patch, allowlisted gate)
    on uncertainty -> refuse: "only 2/5 decided recently"  # authority fails closed
    on pending oracle -> refuse: "CI pending"`}</pre>
      </FieldSpecimen>

      <p>
        One fleet, one asymmetry, applied on purpose: advice fails open, authority fails closed. A
        review loop that is unsure still posts the comment, because the cost of a wrong comment is a
        human's minute. The acting loop that is unsure refuses, and says why in a blocker string,
        because the cost of a wrong merge is paid by the codebase. Where a loop sits on the
        authority ladder decides which way its uncertainty should fall.
      </p>

      <p>
        Every grant on that ladder eventually defers to one shared judgment: what counts as
        irreversible. The reversibility axis has been the spine of every placement call since
        chapter 5, and it only works if the team means the same thing by the word. The handbook's
        working definition is deliberately practical:
      </p>

      <Pull badge="W">An action is irreversible if undoing it costs more than not doing it.</Pull>

      <p>
        It covers the obvious cases: data deletion, external financial transactions, legal
        commitments, production traffic changes that reach customers. It also covers the cases that
        look reversible until you ask who else has a copy, the ones where the <em>information</em>{' '}
        released cannot be recalled: a leaked secret, a public announcement, an email sent. A
        soft-delete window restores your tables; it does not restore the partner's nightly export.
        The team should keep an explicit, written list of what counts as irreversible in its context
        and re-review it when the system changes, because the list is where the steward's veto
        lives. The veto applies to the irreversible. Everything else can, in principle, be delegated
        along the graduated trust progression you just ran.
      </p>

      <p>
        That leaves the steward's standing watch. Trust in a many-hands system decays in four
        predictable ways, and recognizing each from its trace, before the failure that would have
        announced it, is the job. The four cases below are the four ways. Two of them reach back to
        instruments you already own.
      </p>

      <Drill title="The four ways trust comes apart" cases={FOUR_WAYS} />

      <p>
        Four decays, one counter: triangulate the trust signal. Track record alone can lie, and
        every case above is a way it lies; track record plus sampled deep review plus adversarial
        probing plus post-merge defect rate cannot all lie at once. Chapter 12's deliberate
        disturbance is the systematic version, adversarial pressure applied to trust grants on a
        schedule, before the trust has had a chance to silently expire.
      </p>

      <DecisionCard
        title="Before you widen a grant"
        items={[
          'Name the class narrowly, by failure mode and verification story. A record on one class buys nothing on its neighbor, whatever the file extension says.',
          'Read the stamp: which model, tools, permissions, and repo shape earned this record, and do they still describe the proposer today?',
          'Check the window: fresh rows, or paper trust that outlived the conditions it was earned under?',
          'Set the revocation trigger before the grant, and make tolerance a count, not a ratio: one revert should outweigh forty-seven merges.',
          'Cross the irreversibles list: undoing costs more than not doing, including information that cannot be recalled. The steward holds the veto there, always.',
          'Triangulate before you trust any rate: record, sampled deep review, adversarial probing, post-merge defects. One number can lie; four cannot lie together.',
        ]}
      />

      <Coda
        line="A reset without failure is information, not punishment."
        next="Chapter 20 puts the numbers themselves on the bench: what a metric is worth once a fleet learns to feed it, and which questions should never get a number."
      />
    </Chapter>
  );
}
