# Scenario-Agnostic Incident Engine Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple the incident engine and presentation from Retry Storm while preserving the current MVP behavior.

**Architecture:** Generic incident mechanics move into `domain/incident/incidentEngine.ts`; Retry Storm behavior moves into `domain/scenario/retry-storm/rules.ts` and `definition.ts`. A registry and active scenario in Zustand supply the definition to application and presentation layers.

**Tech Stack:** Existing Vite, React, TypeScript, Zustand, Vitest, Playwright stack; no additional dependencies.

## Global Constraints

- The domain must not import React, Zustand, or browser APIs.
- `applyIncidentAction` must receive a scenario definition and must not import Retry Storm.
- Retry Storm behavior, outcomes, score, and existing e2e flow must remain unchanged.
- Legacy localStorage snapshots without `scenarioId` must restore as Retry Storm.
- Add no user-facing second scenario in this refactor.
- Follow TDD for new generic behavior: failing test, observed failure, minimal implementation, passing test.

---

### Task 1: Generalize domain types and add scenario contracts

**Files:** Modify `src/domain/incident/types.ts`; create `src/domain/scenario/types.ts`, `src/domain/scenario/registry.ts`, and `src/domain/scenario/registry.test.ts`.

**Interfaces:** `ScenarioDefinition`, `ScenarioActionEffect`, `DerivedIncidentState`, and `scenarioRegistry`.

- [ ] Write a failing registry test with a tiny synthetic scenario asserting the registry can return it by ID and list definitions.
- [ ] Run the focused test and observe failure because the scenario contract/registry is missing.
- [ ] Add `scenarioId` to `IncidentState`, change flags to `Record<string, boolean>`, and define the scenario contract with `createInitialState`, `resolveAction`, `deriveState`, `calculateOutcome`, and `calculateScore`.
- [ ] Implement the registry with `getScenario(id)` and `listScenarios()`.
- [ ] Run the focused test and the existing domain tests; update only type-dependent fixtures needed for compilation.

### Task 2: Extract the generic incident engine

**Files:** Create `src/domain/incident/incidentEngine.ts` and `src/domain/incident/incidentEngine.test.ts`; modify `src/domain/incident/applyIncidentAction.ts` and `createInitialIncident.ts`.

**Interfaces:** `createInitialIncident(scenario): IncidentState`; `applyIncidentAction(state, scenario, actionId): IncidentActionResult`.

- [ ] Write failing tests using the synthetic scenario for generic point/time costs, prerequisite rejection, duplicate action rejection, and scenario-provided action effects.
- [ ] Run the focused tests and verify they fail because the engine does not exist.
- [ ] Implement generic validation, state copy, action-point deduction, time advancement, completed action tracking, scenario effect application, timeline append, derived state merge, outcome, and terminal status.
- [ ] Keep `applyIncidentAction.ts` as a compatibility re-export or thin wrapper only if existing imports require it; it must not import Retry Storm.
- [ ] Run generic and existing tests; expect all behavior tests to remain green.

### Task 3: Move Retry Storm rules behind the scenario definition

**Files:** Create `src/domain/scenario/retry-storm/definition.ts` and `rules.ts`; move or adapt logic from `src/domain/scenario/retryStorm.ts`, `deriveMetrics.ts`, `deriveNodeStatuses.ts`, `deriveTimelineEvents.ts`, `calculateOutcome.ts`, and `calculateScore.ts`; update `src/domain/incident/incident.test.ts`.

**Interfaces:** `retryStormDefinition: ScenarioDefinition`; compatibility export `retryStormScenario`; Retry Storm rules implement the scenario contract.

- [ ] Add failing assertions that the generic engine can run Retry Storm through `retryStormDefinition` and that the excellent, partial, emergency, and major outcomes remain unchanged.
- [ ] Move action metadata, topology, initial metrics, flags, and event data into the Retry Storm definition/rules without changing values or IDs.
- [ ] Implement Retry Storm `resolveAction`, `deriveState`, outcome, and score adapters using the extracted logic.
- [ ] Update existing tests to import the definition or compatibility alias and verify all current assertions remain valid.
- [ ] Run all Vitest tests and confirm no domain module imports the concrete Retry Storm scenario from the generic engine.

### Task 4: Make application and persistence scenario-aware

**Files:** Modify `src/application/incident/incidentApplication.ts`, `incidentStore.ts`, `src/infrastructure/persistence/localStorageIncidentPersistence.ts`, and related tests.

**Interfaces:** `createIncidentApplication(persistence, scenarioRegistry)`; store state includes `scenario: ScenarioDefinition` and `selectScenario(id)`.

- [ ] Write failing tests for starting a selected scenario, persisting/restoring `scenarioId`, and migrating a legacy snapshot without `scenarioId` to Retry Storm.
- [ ] Pass the active definition into initial state creation and engine action application.
- [ ] Add registry lookup failure fallback to Retry Storm without crashing the app.
- [ ] Preserve current `startInvestigation`, `enterIncident`, `restart`, replay, and invalid-storage behavior.
- [ ] Run application, persistence, domain, and build checks.

### Task 5: Remove concrete scenario imports from presentation

**Files:** Modify `LandingPage.tsx`, `BriefingPage.tsx`, `SystemMap.tsx`, `ActionPanel.tsx`, `AutopsyReport.tsx`, `IncidentHeader.tsx`, and `App.tsx` as needed.

**Interfaces:** Presentation receives `scenario` from the store or props and renders `scenario.title`, `scenario.nodes`, `scenario.actions`, `scenario.concepts`, and scenario report metadata.

- [ ] Write a focused presentation test or type-level compile check proving components render from a supplied definition.
- [ ] Replace direct `retryStormScenario` imports with active scenario selectors.
- [ ] Keep visible copy and behavior unchanged for the current scenario.
- [ ] Update landing/briefing metadata to come from the definition where practical.
- [ ] Run build and the full Vitest suite.

### Task 6: Verify regression safety and extension point

**Files:** Modify `tests/e2e/retry-storm.spec.ts` only if selectors require it; add no production second scenario.

- [ ] Run the full Vitest suite.
- [ ] Run `npm run build`.
- [ ] Run the Playwright critical path.
- [ ] Use `rg` to verify `applyIncidentAction.ts`, `incidentEngine.ts`, and generic domain files do not import `retryStorm`.
- [ ] Confirm the registry contains one user-facing scenario and a synthetic scenario is used only in unit tests.
