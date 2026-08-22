# Memory Leak Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic intermediate incident where gradual heap growth turns normal checkout traffic into garbage-collection pressure, repeated restarts, and lost work.

**Architecture:** Implement `memory-leak` as a self-contained `ScenarioDefinition` under `src/domain/scenario/memory-leak/`, following the existing scenario modules. Reuse the generic incident engine, action availability, topology, timeline, persistence, catalog, and report UI; expose scenario-specific behavior only through definition metadata and derived state.

**Tech Stack:** TypeScript, React, Zustand, Vitest, Playwright, Vite, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-08-05-procedural-scenarios-roadmap.md`; catalog contract in `src/domain/catalog/scenarioCatalog.ts`.

## Global Constraints

- Keep the simulation deterministic, local, and replayable; no real process inspection or external infrastructure.
- Preserve all existing scenario, persistence, catalog-resume, Blackbox, build, and E2E behavior.
- Keep scenario rules inside `src/domain/scenario/memory-leak/`; do not add `scenario.id` branches to shared components.
- Make the causal chain inferable from trends and events before the root cause is fully confirmed.
- Include at least one safe mitigation, one customer-cost emergency action, and one harmful action with observable consequences.
- Register Memory Leak as available only after Bad Deployment; keep later planned scenarios unchanged.

---

### Task 1: Define the initial scenario contract and learning narrative

**Files:**
- Create: `src/domain/scenario/memory-leak/data.ts`
- Create: `src/domain/scenario/memory-leak/definition.ts`
- Create: `src/domain/scenario/memory-leak/rules.ts`
- Create: `src/domain/scenario/memory-leak/memoryLeak.test.ts`

**Interfaces:**
- Consumes: `ScenarioDefinition`, `IncidentState`, `IncidentAction`, `Metric`, `NodeStatus`, and `IncidentEvent`.
- Produces: `memoryLeakDefinition`, initial flags, actions, topology, briefing/report copy, and rule functions.

- [ ] **Step 1: Write failing tests for the initial contract**

Add tests that establish a gradual degradation rather than an immediate outage:

```ts
it("starts with normal traffic and rising heap pressure", () => {
  const state = memoryLeakDefinition.createInitialState();

  expect(state.metrics.heapUsed.value).toBeGreaterThan(50);
  expect(state.metrics.heapGrowthRate.value).toBeGreaterThan(0);
  expect(state.metrics.requestRate.value).toBeGreaterThan(0);
  expect(state.timeline[0].title).toMatch(/heap|memory|growth/i);
});

it("offers profiling, restart, and traffic controls", () => {
  const actionIds = memoryLeakDefinition.actions.map((action) => action.id);

  expect(actionIds).toEqual(expect.arrayContaining([
    "inspect-memory-metrics",
    "inspect-heap-profile",
    "restart-workers",
    "limit-cache",
    "shed-traffic",
  ]));
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- src/domain/scenario/memory-leak/memoryLeak.test.ts`

Expected: FAIL because the Memory Leak module does not exist.

- [ ] **Step 3: Implement the minimum data and definition**

Define these initial signals:

- heap used at a concerning but non-critical percentage;
- positive heap growth rate after garbage collection;
- GC pause time beginning to rise;
- normal CPU and request rate, to avoid making traffic the obvious cause;
- restart count at zero;
- customer error rate still low;
- application workers, heap, cache, database, and telemetry nodes.

Define actions with one action point and explicit time cost unless the action is an emergency:

- `inspect-memory-metrics` — expose post-GC heap growth;
- `inspect-heap-profile` — reveal a retained object/cache path;
- `limit-cache` — cap the leaking cache and slow growth;
- `restart-workers` — reclaim memory temporarily but lose in-flight work;
- `shed-traffic` — protect capacity at customer cost;
- `increase-memory` — create headroom without removing the leak;
- `advance-time` — observe continued growth.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npm test -- src/domain/scenario/memory-leak/memoryLeak.test.ts`

Expected: the initial contract tests pass.

- [ ] **Step 5: Commit the initial scenario contract**

```bash
git add src/domain/scenario/memory-leak
git commit -m "feat: define memory leak scenario"
```

### Task 2: Implement deterministic heap growth and action consequences

**Files:**
- Create: `src/domain/scenario/memory-leak/deriveMetrics.ts`
- Create: `src/domain/scenario/memory-leak/deriveNodeStatuses.ts`
- Create: `src/domain/scenario/memory-leak/deriveTimelineEvents.ts`
- Create: `src/domain/scenario/memory-leak/calculateOutcome.ts`
- Create: `src/domain/scenario/memory-leak/calculateScore.ts`
- Modify: `src/domain/scenario/memory-leak/rules.ts`
- Test: `src/domain/scenario/memory-leak/memoryLeak.test.ts`

**Interfaces:**
- Consumes: the state, flags, actions, and initial values from Task 1.
- Produces: derived metrics, node statuses, timeline events, outcome rules, and score rules.

- [ ] **Step 1: Write failing tests for the causal chain**

Cover the following behaviors:

```ts
it("shows heap growth after inspecting memory metrics", () => {
  const state = runActions(["inspect-memory-metrics"]);

  expect(state.hypotheses).toContain("Post-GC heap continues to grow");
  expect(state.timeline.at(-1)?.title).toMatch(/heap|GC|memory/i);
});

it("reveals retained objects through heap profiling", () => {
  const state = runActions(["inspect-memory-metrics", "inspect-heap-profile"]);

  expect(state.hypotheses).toContain("A retained cache path is leaking memory");
});

it("makes cache limiting a safe containment path", () => {
  const state = runActions(["inspect-memory-metrics", "limit-cache", "advance-time"]);

  expect(state.status).toBe("resolved");
  expect(state.metrics.heapUsed.value).toBeLessThan(initialHeapAfterGrowth);
});

it("makes restart recover memory but lose in-flight work", () => {
  const state = runActions(["restart-workers"]);

  expect(state.flags.workersRestarted).toBe(true);
  expect(state.metrics.heapUsed.value).toBeLessThan(initialHeapUsed);
  expect(state.timeline.at(-1)?.description).toMatch(/work|request/i);
});

it("makes added memory a temporary recovery rather than a root-cause fix", () => {
  const state = runActions(["increase-memory", "advance-time", "advance-time"]);

  expect(state.status).not.toBe("resolved");
  expect(state.metrics.heapGrowthRate.value).toBeGreaterThan(0);
});
```

Use named test constants derived from `memoryLeakDefinition.createInitialState()` rather than hard-coded production values.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- src/domain/scenario/memory-leak/memoryLeak.test.ts`

Expected: FAIL because derived metrics and action effects are incomplete.

- [ ] **Step 3: Implement deterministic derived metrics**

Model this causal chain:

```text
normal traffic
  → retained objects survive garbage collection
  → post-GC heap baseline rises
  → GC pauses increase
  → workers restart or become unavailable
  → requests fail and in-flight work is lost
```

Required metric behavior:

- without mitigation, post-GC heap and GC pause rise with elapsed time;
- `limit-cache` lowers the growth rate and allows recovery after observation time;
- `restart-workers` drops heap immediately but increments restart/lost-work signals;
- `increase-memory` raises the failure threshold but leaves growth positive;
- `shed-traffic` lowers pressure and customer availability simultaneously.

- [ ] **Step 4: Implement node statuses, timeline events, and outcomes**

Statuses should progress from warning heap/telemetry to critical workers and customer checkout as thresholds are crossed. Support these outcomes using the existing `OutcomeId` vocabulary:

- `excellent-containment`: cache limiting/profiling prevents critical growth without traffic shedding;
- `partial-recovery`: restart or added memory buys time but the leak remains;
- `emergency-containment`: traffic shedding protects workers with explicit customer cost;
- `major-outage`: heap/GC pressure exhausts worker capacity or the action budget is wasted.

Timeline events must distinguish temporary restart recovery from durable leak containment.

- [ ] **Step 5: Implement score rules**

Reward memory inspection, heap profiling, cache limiting, and keeping customer impact low. Penalize repeated restarts without diagnosis, increasing memory as the only intervention, and traffic shedding when a lower-cost mitigation was available.

- [ ] **Step 6: Run the focused test and verify it passes**

Run: `npm test -- src/domain/scenario/memory-leak/memoryLeak.test.ts`

Expected: all causal-chain, consequence, outcome, and scoring tests pass.

- [ ] **Step 7: Commit the scenario rules**

```bash
git add src/domain/scenario/memory-leak
git commit -m "feat: add memory leak incident rules"
```

### Task 3: Register Memory Leak and preserve the learning path

**Files:**
- Modify: `src/domain/scenario/registry.ts`
- Modify: `src/domain/catalog/scenarioCatalog.ts`
- Modify: `src/domain/scenario/registry.test.ts`
- Modify: `src/domain/catalog/scenarioCatalog.test.ts`
- Modify: `src/application/incident/incidentApplication.test.ts`

**Interfaces:**
- Consumes: `memoryLeakDefinition` from Task 2.
- Produces: registry lookup, available catalog entry, selection, briefing, and persistence-compatible `scenarioId` behavior.

- [ ] **Step 1: Write failing registration and persistence tests**

Verify:

```ts
expect(getScenario(scenarioRegistry, "memory-leak")).toBe(memoryLeakDefinition);
expect(scenarioCatalog.find((entry) => entry.id === "memory-leak")).toMatchObject({
  status: "available",
  difficulty: "Intermediate",
  prerequisites: ["bad-deployment"],
});
```

Also verify selecting Memory Leak enters briefing and starting it persists `scenarioId: "memory-leak"`.

- [ ] **Step 2: Run focused tests and verify they fail**

Run:

```bash
npm test -- src/domain/scenario/registry.test.ts src/domain/catalog/scenarioCatalog.test.ts src/application/incident/incidentApplication.test.ts
```

Expected: FAIL because Memory Leak is not registered or available.

- [ ] **Step 3: Register it after Bad Deployment**

Add the definition to the registry after Bad Deployment. Change the catalog entry with order `5` from `planned` to `available`, preserve its title, summary, difficulty, concepts, and estimated duration, and set prerequisites to `['bad-deployment']`.

- [ ] **Step 4: Update registry/catalog expectations**

Update expected available scenario IDs to include `memory-leak` immediately after `bad-deployment`, and reduce the planned count by one. Add an explicit test that Bad Deployment remains available before Memory Leak.

- [ ] **Step 5: Run focused tests and verify they pass**

Run the same focused command. Expected: registration, catalog order, selection, and persistence tests pass.

- [ ] **Step 6: Commit integration**

```bash
git add src/domain/scenario/registry.ts src/domain/catalog/scenarioCatalog.ts src/domain/scenario/registry.test.ts src/domain/catalog/scenarioCatalog.test.ts src/application/incident/incidentApplication.test.ts
git commit -m "feat: register memory leak scenario"
```

### Task 4: Add the critical browser flow and complete verification

**Files:**
- Create: `tests/e2e/memory-leak.spec.ts`
- Modify only if required: shared presentation components or scenario metadata types.

**Interfaces:**
- Consumes: the generic catalog, briefing, incident action, and report flows.
- Produces: browser coverage for diagnosis, safe containment, and autopsy review.

- [ ] **Step 1: Write the failing Playwright flow**

Cover a safe path:

```ts
test("contains Memory Leak through cache limiting", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Memory Leak/i }).click();
  await page.getByRole("button", { name: /Enter incident/i }).click();
  await page.getByRole("button", { name: /^Inspect memory metrics\b/i }).click();
  await page.getByRole("button", { name: /Commit action/i }).click();
  await page.getByRole("button", { name: /^Limit cache growth\b/i }).click();
  await page.getByRole("button", { name: /Commit action/i }).click();
  await page.getByRole("button", { name: /^Advance incident timeline\b/i }).click();
  await page.getByRole("button", { name: /Commit action/i }).click();
  await expect(page.getByText(/incident autopsy|heap pressure contained/i)).toBeVisible();
});
```

- [ ] **Step 2: Run the focused browser test and verify it fails**

Run: `npm run test:e2e -- tests/e2e/memory-leak.spec.ts`

Expected: FAIL because Memory Leak is not available and its action labels do not exist.

- [ ] **Step 3: Make only generic presentation adjustments if required**

Use scenario metadata for title, impact metric, topology note, and report content. Do not add a Memory Leak-specific conditional to shared presentation.

- [ ] **Step 4: Run the focused browser test and verify it passes**

Run the same command. Expected: the safe cache-limiting path reaches a resolved state/report.

- [ ] **Step 5: Run the complete verification suite**

```bash
npm test
npm run build
npm run test:e2e
```

Expected: all unit tests, TypeScript build, and existing plus new browser tests pass.

- [ ] **Step 6: Commit the verified feature**

```bash
git add src tests/e2e/memory-leak.spec.ts
git commit -m "feat: ship memory leak learning scenario"
```

## Completion Checklist

- [ ] Memory Leak is available after Bad Deployment and before Database Lock Storm.
- [ ] Initial signals show gradual post-GC heap growth with normal traffic.
- [ ] Heap profiling reveals a retained object/cache path without making the root cause obvious immediately.
- [ ] Cache limiting provides a durable safe mitigation.
- [ ] Restarting workers provides temporary recovery and shows lost work.
- [ ] Increasing memory is observable as a temporary measure, not a fix.
- [ ] Traffic shedding reaches emergency containment with customer cost.
- [ ] Resolved, partial, emergency, and failed outcomes are reachable and scored.
- [ ] Persistence and catalog resume work with `scenarioId: "memory-leak"`.
- [ ] The critical Playwright path passes.
- [ ] Full test, build, and E2E suites pass.
