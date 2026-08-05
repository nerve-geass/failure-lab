# Failure Lab MVP Design

## Goal

Build a visually polished, lightweight single-page web application that teaches incident response through one deterministic, replayable `Retry Storm` scenario.

The MVP must include the complete flow from landing page to briefing, playable investigation, and final autopsy report. It must work without a backend, authentication, database, AI assistant, or external infrastructure integration.

## Success criteria

- A user can start, understand, play, finish, and replay the incident in one session.
- All actions and outcomes described in `README-failure-lab.md` are represented.
- The best outcome is possible through mitigation before perfect diagnosis.
- The simulation is deterministic and independently unit-testable.
- Progress survives reloads through localStorage.
- The interface feels editorial and cinematic while remaining readable and accessible.
- The main flow works on desktop and tablet layouts.

## Technical approach

Use a Vite + React + TypeScript SPA. Keep the domain independent of React and browser APIs. Zustand coordinates application state, while an infrastructure adapter persists and restores snapshots from localStorage. Framer Motion is limited to state-change transitions and respects reduced-motion preferences.

### Domain-driven folder structure

```text
src/
  domain/
    incident/
      types.ts
      constants.ts
      createInitialIncident.ts
      applyIncidentAction.ts
      deriveMetrics.ts
      deriveNodeStatuses.ts
      deriveTimelineEvents.ts
      calculateOutcome.ts
      calculateScore.ts
      incident.test.ts
    scenario/
      retryStorm.ts
  application/
    incident/
      startIncident.ts
      performIncidentAction.ts
      restartIncident.ts
      incidentStore.ts
  infrastructure/
    persistence/
      incidentPersistence.ts
      localStorageIncidentPersistence.ts
    browser/
      storage.ts
  presentation/
    app/
      App.tsx
      routes.ts
    landing/
    briefing/
    incident/
    report/
    shared/
      ui/
      motion/
  main.tsx

tests/
  e2e/
```

The boundaries are intentionally lightweight:

- `domain` owns incident concepts, invariants, transitions, metrics, events, outcome, and score. It cannot import React, Zustand, or browser APIs.
- `application` exposes user-intent use cases and coordinates domain operations with persistence. Zustand lives here as an application adapter, not in the domain.
- `infrastructure` implements browser-specific persistence behind an interface so the domain and use cases remain testable.
- `presentation` renders state and dispatches application commands. It contains no incident rules.

## Domain model

The domain uses the types from the README with small additions needed for the UI and report:

```ts
type IncidentStatus = "briefing" | "active" | "resolved" | "failed";
type OutcomeId = "excellent-containment" | "partial-recovery" | "emergency-containment" | "major-outage";

type IncidentState = {
  currentMinute: number;
  actionPoints: number;
  flags: IncidentFlags;
  metrics: Record<string, Metric>;
  nodeStatuses: Record<string, NodeStatus>;
  completedActionIds: string[];
  hypotheses: string[];
  timeline: IncidentEvent[];
  status: IncidentStatus;
  outcome?: OutcomeId;
};
```

State transitions are pure. Each action validates prerequisites and available action points, applies its flag changes, advances time, derives metrics and node statuses, appends events, then evaluates terminal conditions. A two-point action consumes two points atomically. Completed non-repeatable actions cannot be applied again.

The scenario data defines nodes, connections, action metadata, initial metrics, event copy, hypotheses, and learning concepts. The domain transition functions interpret that data and the current flags.

## Application flow

The application layer exposes:

- `startIncident()`: creates the initial active state and persists it;
- `performIncidentAction(actionId)`: loads current state, calls the pure domain transition, persists the result, and returns a consequence summary;
- `restartIncident()`: clears the snapshot and starts from the briefing/initial state;
- `restoreIncident()`: hydrates a valid local snapshot, otherwise falls back to initial state.

The store exposes current state, current screen, selected node, pending confirmation action, and these commands. Persistence failures do not break play: the in-memory state remains usable and the UI can show no blocking error.

## Screens and interaction

- Landing: product title, short promise, Retry Storm card, duration, difficulty, concepts, and `Start investigation`.
- Briefing: incident summary, objective, architecture preview, learning goals, and `Enter incident`.
- Workspace: header plus topology, timeline/event feed, metrics, hypotheses, and action cards. Desktop uses three columns; tablet uses accessible tabs or stacked sections.
- Report: outcome, score, decision review, timeline, missed opportunities, root cause, contributing factors, best intervention point, concepts, and replay.

Action cards display purpose, time cost, point cost, and lock/completed state. Selecting an available action opens a confirmation dialog before mutating state. Consequences are shown after the transition in a concise toast/banner and through the updated metrics, topology, and timeline.

Selecting a topology node opens a compact semantic detail panel. The map uses regular HTML and SVG connections; it does not use a canvas or drag interaction.

## Visual and accessibility direction

Use a dark operational palette with layered panels, thin borders, strong headings, restrained cyan/amber/red/green accents, and a subtle grid/topology background. Use motion for new events, status transitions, and confirmation feedback only. Disable or reduce nonessential motion under `prefers-reduced-motion`.

Every status has text and an icon in addition to color. Buttons and tabs are keyboard-accessible, focus rings are visible, headings are semantic, labels are descriptive, and typography remains readable at tablet widths.

## Testing strategy

- Vitest tests cover initial state, action prerequisites and costs, each high-value mitigation, time progression, terminal conditions, outcomes, and score boundaries.
- Playwright covers one critical happy path: landing → briefing → inspect deployment → inspect provider traces → disable retries → enable circuit breaker → report.
- Manual visual verification checks desktop and tablet layouts, confirmation dialog behavior, reduced-motion behavior, reload persistence, and replay.

## Explicit scope exclusions

No backend, authentication, database, analytics, chat, AI, multiplayer, payments, admin tooling, user-generated incidents, real observability integrations, complex charts, canvas map, or additional scenario editor will be added to the MVP.
