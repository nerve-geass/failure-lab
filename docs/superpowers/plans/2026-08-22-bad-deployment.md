# Bad Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic intermediate incident in which a partial rollout causes checkout failures, forcing the learner to distinguish deployment scope from system-wide symptoms and choose between mitigation, feature flags, and rollback.

**Architecture:** Implement `bad-deployment` as a self-contained `ScenarioDefinition` under `src/domain/scenario/bad-deployment/`, following the existing scenario modules. Reuse the generic incident engine, action panel, topology, timeline, persistence, catalog, and autopsy presentation; expose scenario-specific content only through definition metadata and rule-derived state.

**Tech Stack:** TypeScript, React, Zustand, Vitest, Playwright, Vite, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-08-05-procedural-scenarios-roadmap.md` plus the catalog contract in `src/domain/catalog/scenarioCatalog.ts`.

## Global Constraints

- Keep the scenario deterministic and local; no real deployment systems or network calls.
- Do not add scenario-specific conditionals to shared UI or the incident engine.
- Preserve the current action-point, persistence, catalog-resume, and report contracts.
- Actions must have observable consequences, coherent prerequisites, and at least one solvable path.
- The scenario must teach that rollback is not automatically safe when a release has partial traffic exposure or state/schema risk.

---

### Task 1: Define the scenario contract and narrative data

**Files:**
- Create: `src/domain/scenario/bad-deployment/data.ts`
- Create: `src/domain/scenario/bad-deployment/definition.ts`
- Create: `src/domain/scenario/bad-deployment/rules.ts`
- Test: `src/domain/scenario/bad-deployment/badDeployment.test.ts`

**Interfaces:**
- Consumes: existing `ScenarioDefinition`, `IncidentState`, `IncidentAction`, and scenario metadata types.
- Produces: `badDeploymentScenario`, its initial state, action catalog, flags, and deterministic rule inputs.

- [ ] **Step 1: Write failing tests for the initial incident contract**

Cover:

```ts
it("starts with partial rollout symptoms rather than global failure", () => {
  const state = badDeploymentScenario.createInitialState();
  expect(state.metrics).toEqual(expect.objectContaining({
    checkoutErrorRate: expect.any(Number),
    checkoutLatencyP95: expect.any(Number),
  }));
  expect(state.timeline[0].title).toMatch(/release|deploy/i);
});

it("exposes deployment investigation before rollback", () => {
  const state = badDeploymentScenario.createInitialState();
  expect(state.actions.find((action) => action.id === "inspect-deployment")).toBeDefined();
  expect(state.actions.find((action) => action.id === "rollback-deployment")).toBeDefined();
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- src/domain/scenario/bad-deployment/badDeployment.test.ts`

Expected: FAIL because the scenario module does not exist.

- [ ] **Step 3: Implement the minimum scenario data and definition**

Define a release that reaches only part of checkout traffic. Include:

- a healthy-looking aggregate CPU/memory signal;
- elevated errors and latency for the affected checkout slice;
- deployment metadata showing a recent release and partial exposure;
- a feature flag/canary control;
- a rollback action with an explicit risk or prerequisite;
- a mitigation path that reduces affected traffic or disables the changed behavior.

Use the existing action identifiers and state shapes wherever possible; add new identifiers only inside the scenario’s action union/configuration.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npm test -- src/domain/scenario/bad-deployment/badDeployment.test.ts`

Expected: all initial-contract tests pass.

- [ ] **Step 5: Commit the self-contained scenario contract**

Run:

```bash
git add src/domain/scenario/bad-deployment
git commit -m "feat: define bad deployment scenario"
```

### Task 2: Implement metrics, topology, timeline, outcomes, and score

**Files:**
- Create: `src/domain/scenario/bad-deployment/deriveMetrics.ts`
- Create: `src/domain/scenario/bad-deployment/deriveNodeStatuses.ts`
- Create: `src/domain/scenario/bad-deployment/deriveTimelineEvents.ts`
- Create: `src/domain/scenario/bad-deployment/calculateOutcome.ts`
- Create: `src/domain/scenario/bad-deployment/calculateScore.ts`
- Modify: `src/domain/scenario/bad-deployment/rules.ts`
- Test: `src/domain/scenario/bad-deployment/badDeployment.test.ts`

**Interfaces:**
- Consumes: the initial data and flags from Task 1.
- Produces: deterministic derived metrics, node statuses, events, reachable outcomes, and autopsy scoring.

- [ ] **Step 1: Write failing tests for branching consequences**

Cover these exact behaviors:

```ts
it("reveals partial blast radius after deployment inspection", () => {
  const state = runAction("inspect-deployment");
  expect(state.hypotheses).toContain("Partial rollout regression");
  expect(state.timeline.at(-1)?.title).toMatch(/canary|rollout|release/i);
});

it("makes disabling the changed behavior a safe mitigation", () => {
  const state = runActions(["inspect-deployment", "disable-feature"]).state;
  expect(state.status).not.toBe("failed");
  expect(state.metrics.checkoutErrorRate).toBeLessThan(initialErrorRate);
});

it("makes a premature rollback produce an observable complication", () => {
  const state = runAction("rollback-deployment");
  expect(state.timeline.at(-1)?.title).toMatch(/rollback|migration|mixed/i);
  expect(state.metrics.checkoutErrorRate).toBeGreaterThan(initialErrorRate);
});

it("can reach a stabilized outcome through mitigation", () => {
  const result = runActions(["inspect-deployment", "disable-feature", "advance-time"]);
  expect(result.state.status).toBe("resolved");
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- src/domain/scenario/bad-deployment/badDeployment.test.ts`

Expected: FAIL because branching derivations and outcomes are not implemented.

- [ ] **Step 3: Implement deterministic action effects**

Implement a causal chain such as:

```text
partial rollout
  → affected checkout slice shows elevated errors
  → aggregate metrics hide the blast radius
  → inspection reveals version/canary correlation
  → feature disable reduces impact safely
  → rollback before state compatibility is checked worsens mixed-version behavior
```

Ensure every accepted action advances time and consumes the existing budget. Locked actions must explain their prerequisite using the shared action-availability contract.

- [ ] **Step 4: Implement outcome and score rules**

Support at least:

- stabilized by disabling the feature or safely reducing exposure;
- partial recovery after a cautious rollback path;
- failed outcome after repeated inaction or harmful interventions;
- score bonuses for identifying the rollout slice and mitigating before certainty;
- score penalties for ignoring the canary signal or using rollback without checking risk.

- [ ] **Step 5: Run the focused test and verify it passes**

Run: `npm test -- src/domain/scenario/bad-deployment/badDeployment.test.ts`

Expected: all branching, metric, outcome, and scoring tests pass.

- [ ] **Step 6: Commit the scenario rules**

Run:

```bash
git add src/domain/scenario/bad-deployment
git commit -m "feat: add bad deployment incident rules"
```

### Task 3: Register the scenario and preserve application behavior

**Files:**
- Modify: `src/domain/scenario/registry.ts`
- Modify: `src/domain/catalog/scenarioCatalog.ts`
- Test: `src/domain/scenario/registry.test.ts`
- Test: `src/domain/catalog/scenarioCatalog.test.ts`
- Test: `src/application/incident/incidentApplication.test.ts`

**Interfaces:**
- Consumes: `badDeploymentScenario` from Task 2.
- Produces: registry lookup, catalog availability, and persistence-compatible scenario selection.

- [ ] **Step 1: Write failing registration and selection tests**

Verify:

```ts
expect(getScenarioDefinition("bad-deployment")).toBe(badDeploymentScenario);
expect(scenarioCatalog.find((entry) => entry.id === "bad-deployment")).toMatchObject({
  status: "available",
  difficulty: "Intermediate",
});
```

Also verify selecting `bad-deployment` enters briefing and starting it persists `scenarioId: "bad-deployment"`.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- src/domain/scenario/registry.test.ts src/domain/catalog/scenarioCatalog.test.ts src/application/incident/incidentApplication.test.ts`

Expected: FAIL because the scenario is not registered or available.

- [ ] **Step 3: Register it after Connection Pool Exhaustion**

Replace the catalog entry’s `planned` status with `available`, keep order `6`, and preserve its prerequisites. Add the definition to the existing registry without adding shared scenario branches.

- [ ] **Step 4: Run focused tests and verify success**

Run the same focused command. Expected: all registration, catalog, selection, and persistence tests pass.

- [ ] **Step 5: Commit integration**

Run:

```bash
git add src/domain/scenario/registry.ts src/domain/catalog/scenarioCatalog.ts src/domain/scenario/registry.test.ts src/domain/catalog/scenarioCatalog.test.ts src/application/incident/incidentApplication.test.ts
git commit -m "feat: register bad deployment scenario"
```

### Task 4: Verify shared presentation and add the critical browser path

**Files:**
- Modify only if required: `src/presentation/landing/ScenarioCatalog.tsx`, shared action/report components.
- Create: `tests/e2e/bad-deployment.spec.ts`
- Test: existing shared presentation tests where behavior changes.

**Interfaces:**
- Consumes: registered scenario metadata and generic incident state.
- Produces: a playable catalog-to-report browser flow with no Bad Deployment-specific UI branch.

- [ ] **Step 1: Write the failing Playwright flow**

Cover:

```ts
test("plays bad deployment through a safe mitigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /bad deployment/i }).click();
  await page.getByRole("button", { name: /start investigation/i }).click();
  await page.getByRole("button", { name: /inspect deployment/i }).click();
  await page.getByRole("button", { name: /disable feature|reduce exposure/i }).click();
  await expect(page.getByText(/incident stabilized|resolved/i)).toBeVisible();
});
```

- [ ] **Step 2: Run the focused browser test and verify it fails**

Run: `npm run test:e2e -- tests/e2e/bad-deployment.spec.ts`

Expected: FAIL until the scenario is integrated and the action labels are available.

- [ ] **Step 3: Make only necessary shared presentation adjustments**

Use scenario metadata for title, impact metric, topology note, and report content. Do not add checks such as `scenario.id === "bad-deployment"` to shared components unless the generic contract is genuinely missing; prefer extending the metadata type.

- [ ] **Step 4: Run the focused browser test and verify it passes**

Run the same command. Expected: the safe mitigation path reaches the report or resolved state and exposes the scenario autopsy.

- [ ] **Step 5: Run the complete verification suite**

Run:

```bash
npm test
npm run build
npm run test:e2e
```

Expected: all unit tests, TypeScript build, and existing plus new browser flows pass.

- [ ] **Step 6: Commit the verified feature**

Run:

```bash
git add src tests/e2e/bad-deployment.spec.ts
git commit -m "feat: ship bad deployment learning scenario"
```

## Completion Checklist

- [ ] Bad Deployment is available after Connection Pool Exhaustion in the catalog.
- [ ] Initial symptoms show partial rollout impact, not a generic outage.
- [ ] Deployment inspection reveals the relevant release/canary evidence.
- [ ] Safe mitigation and harmful rollback paths have distinct observable consequences.
- [ ] Stabilized and failed outcomes are reachable and scored.
- [ ] Persistence and catalog resume work with `scenarioId: "bad-deployment"`.
- [ ] The critical Playwright path passes.
- [ ] Full test, build, and end-to-end suites pass.
