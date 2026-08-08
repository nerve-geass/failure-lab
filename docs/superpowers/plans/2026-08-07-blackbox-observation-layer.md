# Blackbox Observation Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic Blackbox simulation contract where a hidden infrastructure state is projected into difficulty-aware signals and exposed through a small playable checkout target.

**Architecture:** Keep the complete simulated system state private to a Blackbox engine. An observation policy projects that state into typed signals and surfaces such as dashboards and endpoint responses. Player actions enter through the engine, advance time, mutate the hidden system, and return observable consequences; the existing guided `ScenarioDefinition` flow remains unchanged in this slice.

**Tech Stack:** TypeScript, React, Zustand, Vitest, Playwright, Tailwind CSS.

## Global Constraints

- The simulator is deterministic and accepts an explicit seed.
- The UI never reads or renders the hidden simulation state directly.
- Logs are one optional signal source, not the foundation of the contract.
- The first target is local and sandboxed; no real network, credentials, exploit payloads, or external services are permitted.
- Difficulty changes observation visibility and feedback fidelity, not the underlying simulation rules.
- Random exercise selection, persistence/replay, hacking scenarios, streaks, badges, and leaderboards are out of scope.
- Existing guided scenarios and the catalog flow must remain unchanged.

---

### Task 1: Define the Blackbox domain contracts

**Files:**
- Create: `src/domain/blackbox/types.ts`
- Create: `src/domain/blackbox/observationPolicy.ts`
- Test: `src/domain/blackbox/observationPolicy.test.ts`

**Interfaces:**
- Consumes: `ScenarioSeed` and the existing incident severity vocabulary.
- Produces: `SimulationState`, `Signal`, `ObservationSurface`, `ObservationPolicy`, `BlackboxAction`, and `BlackboxActionResult` types used by all later tasks.

- [ ] **Step 1: Write failing contract tests**

Define tests that establish the public shape without exposing internal state:

```ts
it("projects only allowed surfaces for each difficulty", () => {
  expect(createObservationPolicy("beginner").visibleSurfaces).toEqual([
    "dashboard",
    "alert-feed",
  ]);
  expect(createObservationPolicy("blackbox").visibleSurfaces).toEqual([
    "endpoint",
    "service-console",
  ]);
});

it("keeps advanced feedback non-guiding", () => {
  expect(createObservationPolicy("advanced")).toMatchObject({
    revealHints: false,
    allowTentativeActions: true,
    feedbackFidelity: "minimal",
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
ASDF_NODEJS_VERSION=23.1.0 npm test -- src/domain/blackbox/observationPolicy.test.ts
```

Expected: FAIL because the Blackbox contracts and policy factory do not exist.

- [ ] **Step 3: Implement the domain types and policy factory**

Add these exact public concepts:

```ts
export type BlackboxDifficulty = "beginner" | "intermediate" | "advanced" | "blackbox";

export type ObservationSurfaceType =
  | "dashboard"
  | "service-console"
  | "endpoint"
  | "trace-explorer"
  | "alert-feed";

export type Signal = {
  id: string;
  source: string;
  kind: "metric" | "alert" | "trace" | "endpoint" | "ui";
  title: string;
  value?: string | number;
  severity: "info" | "warning" | "critical" | "success";
  explanation?: string;
};

export type ObservationSurface =
  | { type: "dashboard"; signals: Signal[] }
  | { type: "service-console"; serviceId: string; signals: Signal[] }
  | { type: "endpoint"; request: string; response: string; signals: Signal[] }
  | { type: "trace-explorer"; traces: Signal[] }
  | { type: "alert-feed"; alerts: Signal[] };

export type ObservationPolicy = {
  difficulty: BlackboxDifficulty;
  visibleSurfaces: ObservationSurfaceType[];
  revealHints: boolean;
  allowTentativeActions: boolean;
  feedbackFidelity: "explicit" | "partial" | "minimal";
};

export type BlackboxObservation = {
  surfaces: ObservationSurface[];
  timeline: Signal[];
  currentMinute: number;
  actionPoints: number;
  status: "active" | "contained" | "failed";
};

export type BlackboxAction = {
  id: "probe-checkout" | "inspect-service" | "reduce-load" | "restore-dependency";
  input: string;
};

export type BlackboxActionResult = {
  accepted: boolean;
  observation: BlackboxObservation;
  message: string;
};
```

Also define `SimulationState` as an internal-only shape. Keep action costs in the private simulation/action catalog rather than exposing them as a requirement in the public action input. Do not include `SimulationState` in `ObservationSurface` or `BlackboxActionResult`.

- [ ] **Step 4: Run the focused test and verify it passes**

Run the same command. Expected: all policy tests pass.

---

### Task 2: Implement the deterministic simulation and observation projection

**Files:**
- Create: `src/domain/blackbox/blackboxEngine.ts`
- Create: `src/domain/blackbox/observationProjector.ts`
- Create: `src/domain/blackbox/seededSimulation.ts`
- Test: `src/domain/blackbox/blackboxEngine.test.ts`

**Interfaces:**
- Consumes: the contracts and policy from Task 1, plus the existing seeded RNG in `src/domain/scenario/generation/random.ts`.
- Produces: `createBlackboxSession(seed, policy)`, `observe(session)`, and `applyBlackboxAction(session, action)`.

- [ ] **Step 1: Write failing determinism and privacy tests**

Cover these behaviors:

```ts
it("recreates the same observations from the same seed", () => {
  const first = createBlackboxSession(42, createObservationPolicy("intermediate"));
  const second = createBlackboxSession(42, createObservationPolicy("intermediate"));

  expect(observe(first)).toEqual(observe(second));
});

it("does not expose hidden cause through observations", () => {
  const session = createBlackboxSession(42, createObservationPolicy("blackbox"));
  const observation = observe(session);

  expect(JSON.stringify(observation)).not.toContain("hiddenCause");
  expect(JSON.stringify(observation)).not.toContain("database saturation");
});

it("returns observable consequences after an action", () => {
  const session = createBlackboxSession(42, createObservationPolicy("intermediate"));
  const result = applyBlackboxAction(session, { id: "probe-checkout", input: "GET /checkout" });

  expect(result.accepted).toBe(true);
  expect(result.observation.surfaces.length).toBeGreaterThan(0);
  expect(result.observation.timeline[0].title).toMatch(/checkout/i);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
ASDF_NODEJS_VERSION=23.1.0 npm test -- src/domain/blackbox/blackboxEngine.test.ts
```

Expected: FAIL because the session factory and engine do not exist.

- [ ] **Step 3: Implement the hidden checkout simulation**

Create a seeded session with an internal target containing:

- checkout service latency and error rate;
- catalog dependency latency and availability;
- request volume and capacity headroom;
- a hidden causal chain linking dependency degradation to checkout impact;
- elapsed time, action points, and a deterministic timeline.

Keep this state private inside the session object. The simulator should support at least these actions:

```ts
type BlackboxAction = {
  id: "probe-checkout" | "inspect-service" | "reduce-load" | "restore-dependency";
  input: string;
};
```

Each accepted action advances time and updates the hidden state. `reduce-load` must produce a visible customer-cost signal; `restore-dependency` must only succeed when the player has supplied the required input or reached the relevant surface, depending on policy. Advanced and Blackbox policies must allow attempted actions and return consequences instead of hard-disabling them.

- [ ] **Step 4: Implement observation projection**

Project the hidden state into signals without leaking causal labels. The projector must:

- emit only surfaces allowed by `ObservationPolicy.visibleSurfaces`;
- use explicit signals for beginner dashboards;
- provide partial evidence for intermediate difficulty;
- provide minimal, non-explanatory feedback for advanced and Blackbox difficulty;
- include observable timeline events without exposing the hidden cause;
- preserve deterministic ordering and values for the same seed and action sequence.

- [ ] **Step 5: Run focused tests and verify they pass**

Run:

```bash
ASDF_NODEJS_VERSION=23.1.0 npm test -- src/domain/blackbox/observationPolicy.test.ts src/domain/blackbox/blackboxEngine.test.ts
```

Expected: all contract, determinism, privacy, and consequence tests pass.

---

### Task 3: Add a presentational Blackbox workspace

**Files:**
- Create: `src/presentation/blackbox/BlackboxWorkspace.tsx`
- Create: `src/presentation/blackbox/SignalSurface.tsx`
- Create: `src/presentation/blackbox/BlackboxWorkspace.test.tsx`

**Interfaces:**
- Consumes: the public observation and action contracts from Task 2.
- Produces: a UI that renders surfaces and lets the learner attempt Blackbox actions without reading hidden state.

- [ ] **Step 1: Write failing component tests**

Cover:

```ts
it("renders only surfaces present in the observation", () => {
  render(<BlackboxWorkspace {...intermediateWorkspaceProps} />);

  expect(screen.getByText("Checkout dashboard")).toBeInTheDocument();
  expect(screen.queryByText("Hidden causal chain")).not.toBeInTheDocument();
});

it("shows consequences after an attempted action", async () => {
  const onAction = vi.fn();
  render(<BlackboxWorkspace {...intermediateWorkspaceProps} onAction={onAction} />);

  await userEvent.click(screen.getByRole("button", { name: /probe checkout/i }));

  expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: "probe-checkout" }));
});
```

- [ ] **Step 2: Run the focused component test and verify it fails**

Run:

```bash
ASDF_NODEJS_VERSION=23.1.0 npm test -- src/presentation/blackbox/BlackboxWorkspace.test.tsx
```

Expected: FAIL because the workspace does not exist.

- [ ] **Step 3: Implement signal surfaces and action controls**

Render each public surface with clear labels and severity styling. The component must accept:

```ts
type BlackboxWorkspaceProps = {
  observation: BlackboxObservation;
  actions: BlackboxAction[];
  onAction: (action: BlackboxAction) => void;
};
```

The workspace must not import or reference `SimulationState`. Use an action confirmation only when the policy requires it; in advanced and Blackbox modes, actions remain clickable and the result communicates the consequence after execution.

- [ ] **Step 4: Run focused component tests and verify they pass**

Run the same command. Expected: all workspace tests pass.

---

### Task 4: Connect one playable Blackbox target without changing the guided catalog

**Files:**
- Create: `src/application/blackbox/blackboxStore.ts`
- Modify: `src/presentation/app/App.tsx`
- Create: `tests/e2e/blackbox-checkout.spec.ts`
- Test: `src/application/blackbox/blackboxStore.test.ts`

**Interfaces:**
- Consumes: the deterministic engine and presentational workspace from Tasks 2–3.
- Produces: a development-accessible Blackbox route or screen for the single checkout target; no generated random CTA yet.

- [ ] **Step 1: Write failing store and browser-flow tests**

The application store must create one deterministic session, expose its public observation, apply actions, and keep the session active until the simulation reports an outcome. The browser test should verify:

1. the target opens with visible signals but no hidden cause;
2. `Probe checkout` produces a new observable event;
3. an attempted load-reduction action shows customer cost;
4. the session can reach a contained or failed outcome.

- [ ] **Step 2: Run focused tests and verify they fail**

Run:

```bash
ASDF_NODEJS_VERSION=23.1.0 npm test -- src/application/blackbox/blackboxStore.test.ts
```

Expected: FAIL because the Blackbox store does not exist.

- [ ] **Step 3: Implement the application store and temporary entry point**

Create one fixed seed and one fixed intermediate policy for the first vertical slice. Keep the entry point explicit and easy to remove or replace; do not add `Test my instincts` to the catalog yet. The store should expose `observation`, `actions`, `start`, and `performAction`.

- [ ] **Step 4: Implement the browser flow**

Add `tests/e2e/blackbox-checkout.spec.ts` and verify the user can observe, act, and receive consequences through the public UI only.

- [ ] **Step 5: Run the complete verification suite**

Run:

```bash
ASDF_NODEJS_VERSION=23.1.0 npm test
ASDF_NODEJS_VERSION=23.1.0 npm run build
ASDF_NODEJS_VERSION=23.1.0 npm run test:e2e
```

Expected: all existing guided scenario tests plus the new Blackbox tests pass. Confirm that the predefined catalog and its persistence behavior are unchanged.

---

### Task 5: Document the extension seam and review the scope boundary

**Files:**
- Modify: `docs/superpowers/specs/2026-08-05-procedural-scenarios-roadmap.md`
- Modify: `README-failure-lab.md` only if the project’s technical documentation should mention the new Blackbox contract.

- [ ] **Step 1: Document the observation-layer contract**

Record that future scenario families can provide different hidden simulation states and observation surfaces while reusing the same engine contract. Explicitly document that real network targets and executable exploit payloads remain prohibited.

- [ ] **Step 2: Review the generated-scenario boundary**

Confirm that the first Blackbox target uses a fixed seed and does not enter the catalog. The next roadmap phase remains generated exercise selection, replay, seed persistence, and the eventual `Test my instincts` CTA.

- [ ] **Step 3: Run the final diff review**

Confirm the diff contains only the Blackbox contract, simulator, observation projection, first target, tests, and focused documentation. Do not add random generation, real hacking targets, or progression mechanics in this plan.
