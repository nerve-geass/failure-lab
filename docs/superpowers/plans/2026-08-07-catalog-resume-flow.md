# Catalog-first Resume Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the catalog the app’s stable entry point while allowing learners to resume or immediately abandon a persisted exercise.

**Architecture:** Restore the latest incident snapshot into the store without changing the initial screen from `landing`. Keep the persistence contract unchanged, add explicit store commands for resuming and abandoning, and make the landing page render a contextual continuation card above the scenario catalog. The future random mode is represented only by product copy direction (`Test my instincts`) and is not implemented here.

**Tech Stack:** React, TypeScript, Zustand, Vitest, Playwright, Tailwind CSS, localStorage persistence.

## Global Constraints

- Opening or refreshing the app always shows the catalog landing page.
- `Abandon and choose another` clears the saved exercise immediately without a confirmation dialog.
- The future generated-scenario CTA is named `Test my instincts`, but random generation is out of scope.
- Existing scenario selection, briefing, incident, report, persistence, and end-to-end flows must remain functional.
- Do not add streaks, badges, leaderboards, or other progression mechanics in this slice.

---

### Task 1: Define catalog continuation state and store transitions

**Files:**
- Modify: `src/application/incident/incidentStore.ts`
- Modify: `src/application/incident/incidentApplication.ts`
- Test: `src/application/incident/incidentApplication.test.ts`

**Interfaces:**
- Consumes: `IncidentState`, `ScenarioDefinition`, the existing `IncidentPersistence`, and the scenario registry.
- Produces: store actions `resumeInvestigation()` and `abandonInvestigation()`; restoration that hydrates the snapshot while preserving `screen: "landing"`.

- [ ] **Step 1: Write failing application tests for restore and abandonment**

Add tests covering the application-level contract:

```ts
it("restores an active incident without deciding the UI screen", () => {
  const persistence = memoryPersistence();
  const application = createIncidentApplication(persistence, scenarioRegistry);
  const state = application.startIncident("cache-stampede");

  expect(application.restoreIncident()).toEqual(state);
});

it("clears the persisted incident when it is abandoned", () => {
  const persistence = memoryPersistence();
  const application = createIncidentApplication(persistence, scenarioRegistry);
  application.startIncident("cache-stampede");

  application.abandonIncident();

  expect(application.restoreIncident()).toBeNull();
});
```

Keep the persistence implementation generic; `abandonIncident()` should call the existing `persistence.clear()` and return no scenario state.

- [ ] **Step 2: Run the focused tests and verify the new API fails**

Run:

```bash
ASDF_NODEJS_VERSION=23.1.0 npm test -- src/application/incident/incidentApplication.test.ts
```

Expected: FAIL because `abandonIncident` does not exist yet.

- [ ] **Step 3: Implement application and store transitions**

Add to `createIncidentApplication`:

```ts
abandonIncident(): void {
  persistence.clear();
}
```

In `createIncidentStore`:

- Change `restore()` so a restored snapshot selects the matching scenario but always sets `screen: "landing"`.
- Add `resumeInvestigation()` to set `screen: "incident"` for an active snapshot or `screen: "report"` for a resolved/failed snapshot.
- Add `abandonInvestigation()` to call `application.abandonIncident()`, reset the in-memory incident to the default scenario, select that default scenario, and keep `screen: "landing"`.
- Ensure abandoning clears `pendingActionId`, `selectedNodeId`, and `toast`.

- [ ] **Step 4: Run the focused tests and verify they pass**

Run:

```bash
ASDF_NODEJS_VERSION=23.1.0 npm test -- src/application/incident/incidentApplication.test.ts src/infrastructure/persistence/localStorageIncidentPersistence.test.ts
```

Expected: all focused tests pass.

---

### Task 2: Add landing continuation cards and generic hero copy

**Files:**
- Modify: `src/presentation/app/App.tsx`
- Modify: `src/presentation/landing/LandingPage.tsx`
- Create: `src/presentation/landing/ContinueInvestigationCard.tsx`
- Test: `src/presentation/landing/LandingPage.test.tsx`

**Interfaces:**
- Consumes: `incident`, `scenario`, `resumeInvestigation`, and `abandonInvestigation` from `useIncidentStore`.
- Produces: a landing page that renders the correct continuation state and no longer presents the selected scenario as the hero identity.

Use explicit props so the continuation card remains presentational:

```ts
type LandingPageProps = {
  incident: IncidentState;
  scenario: ScenarioDefinition;
  onStart: () => void;
  onResume: () => void;
  onAbandon: () => void;
  onSelectScenario: (scenarioId: string) => void;
};
```

- [ ] **Step 1: Write failing landing tests for all snapshot states**

Render `LandingPage` with injected props and a real `IncidentState`, avoiding a store mock. Cover these cases:

```ts
it("shows resume and abandon controls for an active investigation", () => {
  render(<LandingPage {...activeLandingProps} />);

  expect(screen.getByRole("button", { name: "Resume investigation" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Abandon and choose another" })).toBeVisible();
});

it("shows report review and a new investigation action after completion", () => {
  render(<LandingPage {...completedLandingProps} />);

  expect(screen.getByRole("button", { name: "Review report" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Start another investigation" })).toBeVisible();
});

it("uses generic hero copy instead of the selected scenario title", () => {
  render(<LandingPage {...emptyLandingProps} scenario={cacheStampedeDefinition} />);

  expect(screen.getByRole("heading", { name: /find the moment/i })).not.toBeInTheDocument();
  expect(screen.getByText("Train your instincts. Learn from failure.")).toBeVisible();
});
```

Use accessible names as the contract; exact visual classes are not part of the test.

- [ ] **Step 2: Run the focused landing tests and verify they fail**

Run:

```bash
ASDF_NODEJS_VERSION=23.1.0 npm test -- src/presentation/landing/LandingPage.test.tsx
```

Expected: FAIL because the continuation component and generic hero copy do not exist.

- [ ] **Step 3: Implement the contextual landing UI**

Create `ContinueInvestigationCard` with explicit variants:

- Active: show scenario title, current progress context, `Resume investigation`, and immediate `Abandon and choose another`.
- Resolved/failed: show scenario title and outcome context, `Review report`, and `Start another investigation`.
- No snapshot: render nothing so the learning path remains the primary content.

Change `LandingPage` so it receives `incident` and callbacks rather than using the selected scenario as the hero CTA. Replace scenario-specific hero copy with:

```text
Train your instincts. Learn from failure.
```

Keep scenario details in the learning-path cards. Do not add the future `Test my instincts` button yet.

- [ ] **Step 4: Wire callbacks through `App.tsx` and the store**

Pass the store’s `incident`, `resumeInvestigation`, and `abandonInvestigation` callbacks into `LandingPage`. `Review report` should call the same resume command for a completed/failed snapshot; `Start another investigation` should begin the currently selected catalog scenario through the existing briefing flow.

- [ ] **Step 5: Run focused landing tests and verify they pass**

Run:

```bash
ASDF_NODEJS_VERSION=23.1.0 npm test -- src/presentation/landing/LandingPage.test.tsx
```

Expected: all landing tests pass.

---

### Task 3: Preserve scenario selection and persistence behavior

**Files:**
- Modify: `src/application/incident/incidentStore.ts`
- Modify: `src/presentation/landing/ScenarioCatalog.tsx` only if the new continuation layout requires a small semantic adjustment.
- Test: `src/application/incident/incidentApplication.test.ts`
- Test: `src/domain/scenario/registry.test.ts`

**Interfaces:**
- Consumes: the store transitions from Task 1 and the continuation UI from Task 2.
- Produces: selected scenarios still enter briefing, while abandoning returns to the catalog with a clean default context.

- [ ] **Step 1: Add regression tests for selection and clean abandonment**

Verify that:

```ts
it("selects a scenario and starts it through briefing", () => {
  const store = createIncidentStore(memoryPersistence());
  store.getState().selectScenario("cache-stampede");

  expect(store.getState().screen).toBe("briefing");
  expect(store.getState().scenario.id).toBe("cache-stampede");
});

it("returns to the catalog with no saved snapshot after abandonment", () => {
  const persistence = memoryPersistence();
  const store = createIncidentStore(persistence);
  store.getState().startInvestigation();
  store.getState().abandonInvestigation();

  expect(store.getState().screen).toBe("landing");
  expect(persistence.load()).toBeNull();
});
```

- [ ] **Step 2: Run the regression tests and verify any missing transition fails**

Run:

```bash
ASDF_NODEJS_VERSION=23.1.0 npm test -- src/application/incident/incidentApplication.test.ts src/domain/scenario/registry.test.ts
```

- [ ] **Step 3: Adjust transitions without changing scenario domain rules**

Keep `selectScenario()` entering `briefing`, keep `startInvestigation()` creating a fresh persisted snapshot, and make abandonment the only operation that clears the snapshot from the catalog. Do not change action availability, scoring, outcome logic, or scenario registry ordering.

- [ ] **Step 4: Run the regression tests and verify they pass**

Run the same focused command. Expected: all application and registry tests pass.

---

### Task 4: Verify the complete catalog-first flow

**Files:**
- Modify: `tests/e2e/*.spec.ts` or the repository’s existing e2e spec file.
- No production file changes expected unless an e2e failure exposes a transition bug.

**Interfaces:**
- Consumes: the complete store, persistence, and landing UI behavior from Tasks 1–3.
- Produces: browser-level coverage for refresh, resume, abandon, scenario selection, and report review.

- [ ] **Step 1: Add browser scenarios**

Cover these flows:

1. Start an exercise, reload the page, and verify the catalog is shown with `Resume investigation`.
2. Click `Resume investigation` and verify the incident workspace opens with the same scenario.
3. Reload while the active exercise is saved, click `Abandon and choose another`, reload again, and verify no resume card is present.
4. Select another available scenario and verify the briefing page opens.

- [ ] **Step 2: Run the e2e suite**

Run:

```bash
ASDF_NODEJS_VERSION=23.1.0 npm run test:e2e
```

Expected: all browser scenarios pass. If the local environment cannot bind the preview port, report that environment limitation separately and retain the passing unit/build evidence.

- [ ] **Step 3: Run the full verification suite**

Run:

```bash
ASDF_NODEJS_VERSION=23.1.0 npm test
ASDF_NODEJS_VERSION=23.1.0 npm run build
```

Expected: all unit tests pass and the production build completes successfully.

- [ ] **Step 4: Review the final diff**

Confirm that the diff contains only catalog-first entry, resume/abandon behavior, generic hero copy, tests, and the implementation plan. Confirm that random generation and additional gamification mechanics remain untouched.
