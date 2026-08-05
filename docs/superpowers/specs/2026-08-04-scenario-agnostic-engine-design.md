# Scenario-Agnostic Incident Engine Design

## Goal

Refactor Failure Lab so the incident engine is reusable across multiple local scenarios while preserving the current Retry Storm behavior and UI.

## Design

The shared incident engine owns generic mechanics: action lookup, prerequisites, action-point costs, simulated time, completed actions, timeline append, and persistence-compatible state shape. Each scenario definition owns its content and domain rules: initial state, action effects, metric derivation, node statuses, outcome, score, and learning copy.

```text
scenario registry
  → active ScenarioDefinition
  → incident engine
  → generic IncidentState + scenario-specific flags/metrics
  → application store
  → presentation
```

### Shared types

`IncidentState` gains `scenarioId` and changes `flags` to `Record<string, boolean>`. This prevents Retry Storm-specific flags from becoming a global domain contract. `ScenarioDefinition` exposes:

```ts
type ScenarioDefinition = {
  id: string;
  title: string;
  summary: string;
  nodes: Record<string, SystemNode>;
  connections: Connection[];
  actions: IncidentAction[];
  concepts: string[];
  createInitialState(): IncidentState;
  resolveAction(state: IncidentState, action: IncidentAction): ScenarioActionEffect;
  deriveState(state: IncidentState): DerivedIncidentState;
  calculateOutcome(state: IncidentState): OutcomeId | undefined;
  calculateScore(state: IncidentState): number;
};
```

The engine receives a definition explicitly: `applyIncidentAction(state, scenario, actionId)`. It never imports a concrete scenario.

### Retry Storm migration

Retry Storm moves under `domain/scenario/retry-storm/`:

- `definition.ts`: metadata, topology, actions, initial state, and public definition;
- `rules.ts`: flag mapping, hypotheses, metrics, node statuses, timeline events, outcomes, and score.

Existing behavior and test expectations remain unchanged. The current `retryStormScenario` export remains as a compatibility alias to the new definition while presentation migrates to the registry/active scenario.

### Registry and application

`scenarioRegistry` maps scenario IDs to definitions. The application starts and restores using the selected/serialized `scenarioId`; localStorage snapshots with no scenario ID are treated as legacy Retry Storm snapshots and migrated safely.

The Zustand store exposes `scenario` alongside `incident`, and presentation components consume it rather than importing Retry Storm directly. Landing can enumerate registry entries even while only one scenario is available.

## Constraints

- No new runtime dependency.
- Domain files remain independent of React, Zustand, and browser APIs.
- Existing Retry Storm outcomes and scoring remain deterministic.
- Add a second synthetic scenario definition only in tests to prove the engine is generic; do not add a second user-facing incident yet.
- Preserve all existing routes, local persistence behavior, and Playwright flow.
