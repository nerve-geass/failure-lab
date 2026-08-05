# Cache Stampede Scenario Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Cache Stampede as the second playable scenario without changing the shared incident engine or Retry Storm behavior.

**Architecture:** Cache Stampede owns its definition, initial state, action effects, derived metrics, node statuses, timeline events, outcome, and score under `src/domain/scenario/cache-stampede/`. The registry exposes both definitions; the landing catalog marks Cache Stampede available and the store selects it by ID. Shared presentation continues to consume `ScenarioDefinition`.

**Tech Stack:** Existing React, TypeScript, Zustand, Vitest, Playwright, and Vite stack; no new dependencies.

## Global Constraints

- Keep Retry Storm outcomes, scoring, selectors, and e2e behavior unchanged.
- Do not add scenario-specific branches to the generic incident engine.
- Keep all Cache Stampede rules pure and browser-independent.
- Use six action points and the standard outcome IDs.
- Preserve local persistence and scenario ID migration behavior.

---

### Task 1: Define Cache Stampede data and rules

**Files:** Create `src/domain/scenario/cache-stampede/definition.ts`, `rules.ts`, `deriveMetrics.ts`, `deriveNodeStatuses.ts`, `deriveTimelineEvents.ts`, `calculateOutcome.ts`, `calculateScore.ts`, and `cacheStampede.test.ts`.

- [x] Write failing tests for the initial 10:16 state, seven topology nodes, action metadata, locked diagnostics, cache warming, request coalescing, and traffic throttling.
- [x] Run the focused test and observe failure because the definition is not registered/implemented.
- [x] Implement the definition and pure rules using the existing `ScenarioDefinition` contract.
- [x] Encode deterministic thresholds: database connections at 90% for the best-intervention boundary and 100%/database saturation for major outage.
- [x] Add outcome and score tests for excellent, partial, emergency, and major paths.
- [x] Run the focused test and the existing Retry Storm domain tests.

### Task 2: Register and expose the scenario

**Files:** Modify `src/domain/scenario/registry.ts`, `src/domain/catalog/scenarioCatalog.ts`, `src/application/incident/incidentStore.ts`, `src/presentation/landing/ScenarioCatalog.tsx`, and relevant tests.

- [x] Add Cache Stampede to the registry and assert both definitions are listed.
- [x] Mark the catalog entry available while leaving later scenarios planned.
- [x] Make the landing catalog accept the active scenario and call `selectScenario` when the Cache Stampede card is selected.
- [x] Preserve Retry Storm as the default and verify scenario selection initializes the correct state.

### Task 3: Verify persistence and presentation integration

**Files:** Modify/add application and persistence tests; update `tests/e2e/cache-stampede.spec.ts`.

- [x] Test starting, restoring, and restarting Cache Stampede by `scenarioId`.
- [x] Test the UI path: landing → Cache Stampede briefing → incident → excellent report.
- [x] Keep the existing Retry Storm Playwright test unchanged and passing.
- [x] Run full Vitest, build, both Playwright paths, and an import-boundary check.
