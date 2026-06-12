// glossary.js — the handbook's §2.1 vocabulary, quoted faithfully.
// Each entry carries the definition as the handbook gives it and the closest
// industry analog (the handbook's own cross-reference column, with lineage
// where the handbook names one). `analog` is null where the handbook offers
// none. <Term> in kit.jsx reads from here; keep ids stable.

export const GLOSSARY = {
  planned: {
    term: 'planned work',
    definition:
      'Specified in advance, decomposed into bounded tasks, executed against the spec, ' +
      'verified at scheduled checkpoints.',
    analog:
      'Industry: design-by-contract, formal methods, waterfall, milestone-driven delivery. ' +
      "Lineage: Raymond's cathedral (1997).",
  },
  emergent: {
    term: 'emergent work',
    definition:
      'Expressed as constraints and goals, coordinated through signals in a shared ' +
      'environment, integrated continuously, verified through convergence.',
    analog:
      'Industry: trunk-based development, reconciliation loops, bazaar-style open source. ' +
      "Lineage: Raymond's bazaar (1997); stigmergy (Grassé, 1959).",
  },
  loop: {
    term: 'loop',
    definition:
      'A closed cycle of work: signal → action → verification → commit or revert. ' +
      'The operating unit.',
    analog: 'Reconciliation loop, control loop, autonomous workflow.',
  },
  terrain: {
    term: 'terrain',
    definition:
      'The designed environment loops run in: substrate, signals, boundaries, and shared ' +
      'resources. Literal, not metaphor.',
    analog: 'Developer platform, substrate, the "environment" in an agent SDK.',
  },
  signal: {
    term: 'signal',
    definition:
      'A decaying piece of metadata in the terrain that biases the next action. Test status, ' +
      'staleness marker, telemetry, confidence score, ownership tag. The artifact is not the ' +
      'signal; the signal is what the artifact tells the next actor.',
    analog: 'Pheromone (stigmergy); state in reconciliation systems.',
  },
  boundary: {
    term: 'boundary',
    definition:
      'A designed edge between regions of the system. Contracts, review gates, capability ' +
      'scopes, trust zones. Where planned and emergent meet, a boundary holds the seam.',
    analog: 'API contract, bounded context, trust boundary, review gate.',
  },
  placement: {
    term: 'placement',
    definition:
      'The discipline of deciding, explicitly, where a decision lives on the planned/emergent ' +
      'spectrum. The placement is the decision; the implementation follows from it.',
    analog: 'ADR-level design — but sharper and earlier.',
  },
  steward: {
    term: 'steward',
    definition:
      'The human role: shapes terrain, sets intent, codifies norms, approves what crosses ' +
      'boundaries, holds veto on the irreversible.',
    analog:
      'Platform engineer, tech lead, architect — each partial; the steward is none of these alone.',
  },
  commons: {
    term: 'the commons',
    definition:
      'The shared substrates through which emergent work coordinates: the repository, the ' +
      'vector store, the eval harness, the deployment pipeline, the production namespace. ' +
      'Commons are governable resources, not passive storage. They degrade without governance.',
    analog: 'Lineage: Ostrom (1990).',
  },
  'pace-layers': {
    term: 'pace layers',
    definition:
      'The strata of a system, each with its own characteristic rate of change: governance ' +
      '(years), architecture (months), capabilities (weeks), orchestration (days), agents ' +
      '(hours), invocations (minutes). Each layer changes at its own pace. Mixing signals ' +
      'across layers is a category error.',
    analog: 'Lineage: Stewart Brand (1994).',
  },
  'four-forces': {
    term: 'the four forces',
    definition:
      'Reinforcement: a signal strengthens with use. Decay: a signal weakens with time. ' +
      'Runaway: reinforcement without counter-force. The death spiral. Drift: slow divergence ' +
      'between what the system measures and what the world rewards.',
    analog: null,
  },
};

export const GLOSSARY_IDS = Object.keys(GLOSSARY);

/**
 * @param {string} id
 * @returns {{ term: string, definition: string, analog: string|null } | null}
 */
export function glossaryEntry(id) {
  return GLOSSARY[id] ?? null;
}
