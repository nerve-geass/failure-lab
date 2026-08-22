# Blackbox First-Class Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the deterministic Blackbox exercise discoverable and supported as a first-class learning mode with briefing, launch, exit, resume, and browser coverage.

**Architecture:** Keep the Blackbox simulator and observation projector separate from authored `IncidentState` scenarios. Add a small Blackbox application store responsible for session lifecycle and local persistence, a dedicated briefing screen, and a catalog mode card that launches the mode through application state rather than a hidden query-string entry point. The existing `BlackboxWorkspace` remains presentational and receives only public observations and actions.

**Tech Stack:** TypeScript, React, Zustand, Vitest, Playwright, Vite, Tailwind CSS, localStorage.

**Spec:** `docs/superpowers/specs/2026-08-05-procedural-scenarios-roadmap.md`, especially the Blackbox mode contract.

## Global Constraints

- The simulation remains deterministic and local; no real network targets, credentials, exploit payloads, or external services.
- The UI never reads or renders `SimulationState.hiddenCause` or any other hidden state.
- Difficulty continues to control observation policy, not simulation rules.
- Existing authored scenarios, catalog resume, reports, and `?mode=blackbox` compatibility must remain functional during migration.
- Blackbox persistence must be separate from authored incident persistence and must not overwrite an active authored investigation.
- A learner must be able to leave Blackbox and return to the catalog without losing the saved authored investigation.

---

### Task 1: Define Blackbox session persistence and lifecycle

**Files:**
- Create: `src/infrastructure/persistence/blackboxPersistence.ts`
- Modify: `src/application/blackbox/blackboxStore.ts`
- Test: `src/infrastructure/persistence/blackboxPersistence.test.ts`
- Test: `src/application/blackbox/blackboxStore.test.ts`

**Interfaces:**
- Consumes: `BlackboxSession`, `BlackboxObservation`, `BlackboxDifficulty`, and the existing seeded session factory.
- Produces: `loadBlackboxSnapshot()`, `saveBlackboxSnapshot()`, `clearBlackboxSnapshot()`, `resume()`, `abandon()`, and `hasSavedSession`.

- [ ] **Step 1: Write failing persistence tests**

Cover an isolated localStorage contract:

```ts
it("stores and restores a Blackbox snapshot without exposing hidden state", () => {
  const persistence = createMemoryBlackboxPersistence();
  const snapshot = createBlackboxSnapshot(42, "intermediate");

  persistence.save(snapshot);

  expect(persistence.load()).toEqual(snapshot);
  expect(JSON.stringify(persistence.load())).not.toContain("hiddenCause");
});

it("clears only the Blackbox snapshot", () => {
  const persistence = createMemoryBlackboxPersistence();
  persistence.save(createBlackboxSnapshot(42, "intermediate"));

  persistence.clear();

  expect(persistence.load()).toBeNull();
});
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `npm test -- src/infrastructure/persistence/blackboxPersistence.test.ts src/application/blackbox/blackboxStore.test.ts`

Expected: FAIL because Blackbox persistence and lifecycle commands do not exist.

- [ ] **Step 3: Implement a public snapshot shape**

Persist only the information needed to reconstruct a deterministic session:

```ts
type BlackboxSnapshot = {
  version: 1;
  seed: number;
  difficulty: BlackboxDifficulty;
  actionSequence: BlackboxAction["id"][];
};
```

Recreate the session from `seed`, `difficulty`, and `actionSequence` rather than serializing hidden simulation state. Replay actions in order through the engine and persist after every accepted action.

- [ ] **Step 4: Add store lifecycle commands**

Extend `createBlackboxStore` with:

```ts
type BlackboxStore = {
  hasSavedSession: boolean;
  start: () => void;
  resume: () => void;
  performAction: (actionId: BlackboxAction["id"]) => void;
  abandon: () => void;
};
```

`start()` creates a fresh seeded session and saves an empty action sequence. `resume()` reconstructs the saved session. `abandon()` clears the Blackbox key and starts no new session. A completed or failed session remains reviewable in the workspace until the learner exits or abandons it.

- [ ] **Step 5: Run focused tests and verify they pass**

Run the same focused command. Expected: persistence, deterministic reconstruction, action saving, resume, and abandon tests pass.

- [ ] **Step 6: Commit the Blackbox lifecycle foundation**

```bash
git add src/infrastructure/persistence/blackboxPersistence.ts src/infrastructure/persistence/blackboxPersistence.test.ts src/application/blackbox/blackboxStore.ts src/application/blackbox/blackboxStore.test.ts
git commit -m "feat: persist blackbox sessions"
```

### Task 2: Add a dedicated Blackbox briefing and route state

**Files:**
- Create: `src/presentation/blackbox/BlackboxBriefing.tsx`
- Create: `src/presentation/blackbox/BlackboxBriefing.test.tsx`
- Modify: `src/presentation/app/App.tsx`
- Modify: `src/presentation/app/routes.ts`

**Interfaces:**
- Consumes: Blackbox store lifecycle commands and current saved-session state.
- Produces: `landing → blackbox-briefing → blackbox` flow with explicit back and start/resume actions.

- [ ] **Step 1: Write failing component tests**

Cover:

```ts
it("explains Blackbox without revealing the hidden cause", () => {
  render(<BlackboxBriefing hasSavedSession={false} onStart={vi.fn()} onResume={vi.fn()} onBack={vi.fn()} />);

  expect(screen.getByRole("heading", { name: /checkout blackbox/i })).toBeVisible();
  expect(screen.getByText(/signals, interfaces, and consequences/i)).toBeVisible();
  expect(screen.queryByText(/hidden cause|database saturation/i)).not.toBeInTheDocument();
});

it("offers resume when a Blackbox session is saved", () => {
  render(<BlackboxBriefing hasSavedSession onStart={vi.fn()} onResume={vi.fn()} onBack={vi.fn()} />);

  expect(screen.getByRole("button", { name: "Resume Blackbox" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Start new Blackbox" })).toBeVisible();
});
```

- [ ] **Step 2: Run focused component tests and verify they fail**

Run: `npm test -- src/presentation/blackbox/BlackboxBriefing.test.tsx`

Expected: FAIL because the briefing component and route state do not exist.

- [ ] **Step 3: Implement the briefing screen**

Use copy that explains:

- the target is a local deterministic checkout simulation;
- only observable signals and consequences are available;
- the learner must form hypotheses and experiment;
- the objective is to stabilize the target, not to guess a hidden answer.

Do not render `SimulationState`, `hiddenCause`, or internal action costs.

- [ ] **Step 4: Replace the primary query-string launch path**

Add an explicit application mode such as `blackbox-briefing` and `blackbox`. The catalog’s Blackbox card should call a store/app callback that opens the briefing. Keep `?mode=blackbox` as a compatibility redirect to the new briefing/launch flow rather than deleting it abruptly.

- [ ] **Step 5: Run focused tests and verify they pass**

Run: `npm test -- src/presentation/blackbox/BlackboxBriefing.test.tsx src/presentation/blackbox/BlackboxWorkspace.test.tsx`

Expected: briefing and existing workspace tests pass.

- [ ] **Step 6: Commit the briefing flow**

```bash
git add src/presentation/blackbox/BlackboxBriefing.tsx src/presentation/blackbox/BlackboxBriefing.test.tsx src/presentation/app/App.tsx src/presentation/app/routes.ts
git commit -m "feat: add blackbox briefing flow"
```

### Task 3: Add catalog launch, exit, and authored-investigation isolation

**Files:**
- Modify: `src/presentation/landing/ScenarioCatalog.tsx`
- Modify: `src/presentation/landing/LandingPage.tsx`
- Modify: `src/presentation/app/App.tsx`
- Modify: `src/application/blackbox/blackboxStore.ts`
- Test: `src/presentation/landing/ScenarioCatalog.test.tsx`
- Test: `src/application/blackbox/blackboxStore.test.ts`

**Interfaces:**
- Consumes: the briefing route and Blackbox lifecycle from Tasks 1–2.
- Produces: a discoverable Blackbox mode card, explicit navigation back to catalog, and no mutation of authored incident persistence.

- [ ] **Step 1: Write failing catalog and isolation tests**

Verify:

```ts
it("labels Blackbox as a playable practice mode", () => {
  render(<ScenarioCatalog onSelectScenario={vi.fn()} onSelectBlackbox={vi.fn()} />);

  expect(screen.getByRole("button", { name: "Enter Checkout Blackbox" })).toBeVisible();
  expect(screen.getByText("Playable now")).toBeVisible();
});

it("leaving Blackbox does not clear an authored incident snapshot", () => {
  const incidentPersistence = memoryPersistenceWithActiveIncident();
  const blackboxStore = createBlackboxStore(42, "intermediate", blackboxPersistence);

  blackboxStore.getState().start();
  blackboxStore.getState().abandon();

  expect(incidentPersistence.load()).not.toBeNull();
});
```

- [ ] **Step 2: Run focused tests and verify they fail**

Run: `npm test -- src/presentation/landing/ScenarioCatalog.test.tsx src/application/blackbox/blackboxStore.test.ts`

Expected: FAIL until the launch callback and isolated persistence are wired.

- [ ] **Step 3: Wire the catalog card to the briefing**

Use an explicit accessible label such as `Enter Checkout Blackbox`. Keep authored scenario cards unchanged. The card should describe Blackbox as a practice mode, not as scenario 11 in the authored learning path.

- [ ] **Step 4: Add catalog exit behavior to the workspace**

`Back to catalog` must clear only transient Blackbox route state, preserve the saved Blackbox snapshot for resume, and leave authored incident persistence untouched. Add a separate `Abandon Blackbox` control only if needed to make clearing the snapshot explicit; do not make the normal back action destructive.

- [ ] **Step 5: Run focused tests and verify they pass**

Run the same focused command. Expected: catalog, navigation, and persistence-isolation tests pass.

- [ ] **Step 6: Commit catalog integration**

```bash
git add src/presentation/landing src/presentation/app/App.tsx src/application/blackbox src/presentation/landing/ScenarioCatalog.test.tsx
git commit -m "feat: expose blackbox from catalog"
```

### Task 4: Add resume/exit browser coverage and verify the full product

**Files:**
- Modify: `tests/e2e/blackbox-checkout.spec.ts`
- Create or modify: `tests/e2e/blackbox-catalog-flow.spec.ts`
- Modify only if required: shared UI components.

**Interfaces:**
- Consumes: catalog launch, briefing, workspace, persistence, and exit behavior from Tasks 1–3.
- Produces: browser proof of first-class discovery, resume, exit, and authored-flow isolation.

- [ ] **Step 1: Write failing E2E coverage**

Cover this sequence:

```ts
test("launches Blackbox from the catalog and resumes it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Enter Checkout Blackbox" }).click();
  await expect(page.getByRole("heading", { name: /Checkout Blackbox/i })).toBeVisible();
  await page.getByRole("button", { name: /Start Blackbox/i }).click();
  await page.getByRole("button", { name: "Inspect catalog dependency" }).click();
  await page.getByRole("button", { name: "Back to catalog" }).click();
  await page.getByRole("button", { name: "Enter Checkout Blackbox" }).click();
  await expect(page.getByRole("button", { name: "Resume Blackbox" })).toBeVisible();
});

test("Blackbox exit preserves an authored investigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start investigation" }).click();
  await page.getByRole("button", { name: /Back to catalog/i }).click();
  await page.getByRole("button", { name: "Enter Checkout Blackbox" }).click();
  await page.getByRole("button", { name: /Start Blackbox/i }).click();
  await page.getByRole("button", { name: "Back to catalog" }).click();
  await expect(page.getByRole("button", { name: "Resume investigation" })).toBeVisible();
});
```

- [ ] **Step 2: Run focused E2E tests and verify they fail**

Run: `npm run test:e2e -- tests/e2e/blackbox-catalog-flow.spec.ts`

Expected: FAIL because catalog launch currently jumps directly to the query-string workspace and has no briefing/resume lifecycle.

- [ ] **Step 3: Implement the smallest navigation fixes required by the failing flow**

Keep the workspace’s existing observable surfaces and action behavior unchanged. Only add route/lifecycle plumbing and accessible controls.

- [ ] **Step 4: Run focused E2E tests and verify they pass**

Run the same command. Expected: both discovery/resume and authored-isolation flows pass.

- [ ] **Step 5: Run complete verification**

```bash
npm test
npm run build
npm run test:e2e
```

Expected: all existing tests plus the new Blackbox catalog tests pass.

- [ ] **Step 6: Commit the verified feature**

```bash
git add src tests/e2e/blackbox-catalog-flow.spec.ts
git commit -m "feat: make blackbox a first-class learning mode"
```

## Completion Checklist

- [ ] Blackbox is discoverable from the catalog as a practice mode.
- [ ] A dedicated briefing explains the interaction without exposing the hidden cause.
- [ ] Start, resume, back-to-catalog, and abandon semantics are explicit.
- [ ] Blackbox snapshots reconstruct from seed and action sequence only.
- [ ] Blackbox persistence cannot overwrite authored incident persistence.
- [ ] The legacy `?mode=blackbox` entry remains compatible or redirects safely.
- [ ] Existing authored scenarios and current Blackbox signals/consequences remain unchanged.
- [ ] Full unit, build, and Playwright suites pass.
