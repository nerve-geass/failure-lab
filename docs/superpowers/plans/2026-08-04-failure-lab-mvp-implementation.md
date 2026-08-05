# Failure Lab MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete lightweight Vite + React Failure Lab MVP for the deterministic Retry Storm incident.

**Architecture:** A domain-driven SPA separates pure incident rules from application orchestration, browser persistence, and React presentation. The domain exposes immutable state transitions; the application layer wraps them in Zustand commands; presentation renders the four screens and responsive incident workspace.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, shadcn/ui-style local components, Lucide React, Framer Motion, Zustand, Vitest, Testing Library, Playwright.

## Global Constraints

- Use Vite + React rather than Next.js.
- Keep all incident content and rules local in TypeScript.
- `domain` must not import React, Zustand, or browser APIs.
- Use localStorage only through an infrastructure adapter.
- Implement one complete `Retry Storm` incident; no backend, auth, database, AI, chat, analytics, or extra scenarios.
- Use regular HTML and SVG for the topology; do not add a canvas library.
- Keep motion restrained and support `prefers-reduced-motion`.
- Status must be communicated with text and icon as well as color.
- Follow TDD for every domain/application behavior: failing test, observed failure, minimal implementation, passing test.
- The current folder is not a Git repository, so implementation verification will use filesystem state and test commands; commits are unavailable until a repository is initialized.

---

## File map

```text
index.html
package.json
tsconfig.json
vite.config.ts
tailwind.config.ts
postcss.config.js
src/
  main.tsx
  index.css
  domain/
    incident/types.ts
    incident/constants.ts
    incident/createInitialIncident.ts
    incident/deriveMetrics.ts
    incident/deriveNodeStatuses.ts
    incident/deriveTimelineEvents.ts
    incident/applyIncidentAction.ts
    incident/calculateOutcome.ts
    incident/calculateScore.ts
    incident/incident.test.ts
    scenario/retryStorm.ts
  application/incident/
    incidentApplication.ts
    incidentStore.ts
  infrastructure/persistence/
    incidentPersistence.ts
    localStorageIncidentPersistence.ts
  presentation/
    app/App.tsx
    app/routes.ts
    shared/ui.tsx
    shared/motion.ts
    landing/LandingPage.tsx
    briefing/BriefingPage.tsx
    incident/IncidentWorkspace.tsx
    incident/IncidentHeader.tsx
    incident/SystemMap.tsx
    incident/MetricsPanel.tsx
    incident/HypothesisPanel.tsx
    incident/IncidentTimeline.tsx
    incident/ActionPanel.tsx
    incident/ActionCard.tsx
    incident/ConsequenceToast.tsx
    report/AutopsyReport.tsx
tests/
  e2e/retry-storm.spec.ts
```

### Task 1: Scaffold the Vite application and test toolchain

**Files:** Create the root Vite/config files, `src/main.tsx`, `src/index.css`, and a minimal test setup file if required by the selected Vitest configuration. Modify only the new `package.json` scripts and configs.

**Interfaces:** Produces the commands `npm run dev`, `npm run build`, `npm run test`, and `npm run test:e2e`.

- [ ] Write the Vite React TypeScript scaffold with scripts for `dev`, `build`, `test`, `test:watch`, and `test:e2e`.
- [ ] Add only the required dependencies: React, React DOM, Zustand, Framer Motion, Lucide React, Tailwind/PostCSS tooling, Vitest, Testing Library, jsdom, and Playwright.
- [ ] Configure TypeScript strict mode, Vitest with jsdom, and a Vite alias `@` to `src`.
- [ ] Add the dark base CSS, font stack, color tokens, focus ring, reduced-motion rule, and responsive body defaults.
- [ ] Run `npm install`, `npm run build`, and `npm run test`; expect a successful empty test run and a production build.

### Task 2: Define the domain model and initial Retry Storm scenario

**Files:** Create `src/domain/incident/types.ts`, `src/domain/incident/constants.ts`, `src/domain/scenario/retryStorm.ts`, `src/domain/incident/createInitialIncident.ts`, and `src/domain/incident/incident.test.ts`.

**Interfaces:** `createInitialIncident(): IncidentState`; scenario exports `retryStormScenario`; domain types include `IncidentState`, `IncidentAction`, `Metric`, `IncidentEvent`, `SystemNode`, `NodeStatus`, `IncidentFlags`, `OutcomeId`, and `IncidentActionResult`.

- [ ] Write failing tests asserting the initial clock is 09:42, action points are 6, retries are enabled, initial metrics match the README, and all seven topology nodes are present.
- [ ] Run `npm run test -- src/domain/incident/incident.test.ts`; verify failure because the domain modules do not exist.
- [ ] Implement the typed scenario data, immutable initial flags, initial metrics, initial statuses, initial timeline event, action metadata, concepts, and topology connections.
- [ ] Run the focused test and then the full test command; expect all tests to pass.

### Task 3: Implement deterministic incident transitions and outcome scoring

**Files:** Create `src/domain/incident/deriveMetrics.ts`, `deriveNodeStatuses.ts`, `deriveTimelineEvents.ts`, `applyIncidentAction.ts`, `calculateOutcome.ts`, and `calculateScore.ts`. Extend `src/domain/incident/incident.test.ts`.

**Interfaces:** `applyIncidentAction(state: IncidentState, actionId: string): IncidentActionResult`; `deriveMetrics(state): Record<string, Metric>`; `deriveNodeStatuses(state): Record<string, NodeStatus>`; `calculateOutcome(state): OutcomeId | undefined`; `calculateScore(state): number`.

- [ ] Write failing tests for locked provider traces, action-point costs, time costs, deployment inspection unlocking rollback, queue inspection accelerating the queue hypothesis, and provider trace discovery.
- [ ] Write failing tests for disabling retries reducing retry pressure, circuit breaker isolating the provider, scaling workers worsening an active retry storm, pausing traffic consuming two points, and duplicate non-repeatable actions being rejected.
- [ ] Write failing tests for excellent containment, partial recovery, emergency containment, and major outage, including connection pool exhaustion and action-budget depletion.
- [ ] Run the focused tests and verify they fail for missing transition behavior.
- [ ] Implement the smallest pure transition pipeline: validate action, update flags/hypotheses, subtract points, advance time, derive metrics/statuses, append deterministic events, then evaluate terminal state.
- [ ] Encode the README thresholds: post-09:48 acceleration, 100% connections, queue depth over 20,000, mitigation before 90%, and the four outcome precedence rules.
- [ ] Implement score bonuses and penalties from the README, clamped to 0–100, with labels derived by a pure helper.
- [ ] Run focused and full Vitest suites; refactor only while green.

### Task 4: Add application orchestration and local persistence

**Files:** Create `src/infrastructure/persistence/incidentPersistence.ts`, `localStorageIncidentPersistence.ts`, `src/application/incident/incidentApplication.ts`, and `src/application/incident/incidentStore.ts`; add application tests alongside the domain tests.

**Interfaces:** `IncidentPersistence` exposes `load(): IncidentState | null`, `save(state): void`, and `clear(): void`; the Zustand store exposes `screen`, `incident`, `selectedNodeId`, `pendingActionId`, `toast`, `startInvestigation()`, `enterIncident()`, `requestAction()`, `confirmAction()`, `cancelAction()`, `restart()`, `selectNode()`, and `restore()`.

- [ ] Write failing tests for saving/restoring a valid incident snapshot, falling back safely when JSON is invalid, and keeping the current in-memory state usable when storage throws.
- [ ] Write failing tests for the screen transitions landing → briefing → incident → report and for replay resetting to the briefing state.
- [ ] Run tests and verify they fail before implementation.
- [ ] Implement the persistence interface and browser localStorage adapter with a versioned key and defensive parsing.
- [ ] Implement application commands that call domain functions and persist successful transitions; store only serializable state and transient UI values separately.
- [ ] Run all Vitest tests and verify persistence and transitions pass.

### Task 5: Build the visual shell, landing, briefing, and shared UI

**Files:** Create `src/presentation/app/App.tsx`, `routes.ts`, `src/presentation/shared/ui.tsx`, `motion.ts`, `LandingPage.tsx`, and `BriefingPage.tsx`; update `src/main.tsx` and `src/index.css` as needed.

**Interfaces:** `App` selects the screen from the application store; landing and briefing components receive store command callbacks rather than owning incident rules.

- [ ] Add the shared `Panel`, `StatusBadge`, `IconLabel`, `PrimaryButton`, `SecondaryButton`, and `SectionHeading` primitives with accessible class names and focus states.
- [ ] Build the landing page with the product promise, Retry Storm scenario card, duration, difficulty, concepts, and start CTA.
- [ ] Build the briefing page with incident summary, objective, architecture preview using the same topology data, learning goals, and enter CTA.
- [ ] Add responsive layout tokens, subtle background grid, panel hierarchy, and restrained Framer Motion page/event transitions.
- [ ] Run `npm run build` and verify both screens render without console errors in the browser.

### Task 6: Build the incident workspace and interactive controls

**Files:** Create the components under `src/presentation/incident/` listed in the file map.

**Interfaces:** Components consume `IncidentState`, scenario data, and store selectors/callbacks. `ActionPanel` calls `requestAction(actionId)`; `ConsequenceToast` renders the transient store toast; `SystemMap` calls `selectNode(nodeId)`.

- [ ] Build `IncidentHeader` with simulated time, points, impact, incident status, and restart.
- [ ] Build `SystemMap` with semantic node buttons, SVG directional connections, status text/icons, pulse treatment for rising traffic, and a selected-node detail panel.
- [ ] Build `MetricsPanel`, `HypothesisPanel`, and `IncidentTimeline` with readable values, trend indicators, severity text, and animated event insertion.
- [ ] Build `ActionCard` and `ActionPanel` with locked/available/completed states, prerequisites, costs, confirmation dialog, keyboard handling, and disabled terminal behavior.
- [ ] Add desktop three-column layout and tablet tabs/stacked sections without duplicating incident logic.
- [ ] Manually verify the critical path and that every action changes the clock, metrics, node statuses, hypotheses, and timeline as defined by the domain.

### Task 7: Build the autopsy report and end-to-end verification

**Files:** Create `src/presentation/report/AutopsyReport.tsx`, `tests/e2e/retry-storm.spec.ts`, and any focused presentation test files needed for accessible labels.

**Interfaces:** `AutopsyReport` consumes the terminal `IncidentState`, scenario learning data, `calculateScore`, and replay callback.

- [ ] Build outcome summary with outcome label, score, score band, concise consequence, and clear next action.
- [ ] Build decision review, full incident timeline, missed opportunities, root cause, contributing factors, best intervention point, and concepts learned.
- [ ] Add `Replay incident` returning to briefing and clearing the persisted active snapshot.
- [ ] Write a Playwright test that starts the app, enters the incident, follows the excellent-containment path, and asserts the report outcome and score label.
- [ ] Run the Playwright test against the Vite preview server; fix selectors to use accessible names and roles.
- [ ] Run `npm run test`, `npm run build`, and `npm run test:e2e`; manually verify desktop/tablet layout, reload persistence, keyboard navigation, focus visibility, and reduced motion.

## Final verification checklist

- [ ] `npm run test` passes with domain and application coverage for all README rules.
- [ ] `npm run build` completes successfully.
- [ ] `npm run test:e2e` passes the critical path.
- [ ] No domain file imports React, Zustand, or browser APIs.
- [ ] The app has no backend or extra dependency outside the agreed stack unless required by the toolchain.
- [ ] The interface is usable at desktop and tablet widths and communicates status without color alone.
