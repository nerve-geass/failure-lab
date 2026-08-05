# Failure Lab — Interactive Incident Investigation

## Objective

Build a polished, interactive web application where users learn how complex software systems fail by investigating a simulated production incident.

The MVP must be small, fast to implement, and immediately usable.

The user is **not** assisted by a chatbot. The experience should feel like an interactive investigation: inspect signals, take actions, advance the incident timeline, and discover where the failure chain could have been interrupted.

---

## Product concept

**Failure Lab** teaches software reliability through short, interactive incident scenarios.

Each scenario presents:

- a simplified system map;
- live operational signals;
- a timeline of events;
- a limited set of actions;
- consequences caused by the user's choices;
- a final incident autopsy.

The core question is:

> At which point could you have broken the chain of failure?

The MVP contains one complete scenario: **Retry Storm**.

---

## MVP constraints

Keep the implementation deliberately narrow.

### Include

- one playable incident;
- one system map;
- one timeline;
- a small set of user actions;
- deterministic branching outcomes;
- an incident clock;
- a final report;
- responsive desktop and tablet layouts;
- local persistence of progress;
- subtle animations and polished UI.

### Do not include

- authentication;
- backend services;
- databases;
- AI assistants;
- chat interfaces;
- user-generated incidents;
- multiplayer;
- payments;
- complex analytics;
- admin panels;
- real infrastructure integrations.

All content and scenario logic must live locally in TypeScript or JSON files.

---

## Recommended stack

Use:

- Next.js with App Router;
- TypeScript;
- Tailwind CSS;
- shadcn/ui;
- Lucide icons;
- Framer Motion for restrained transitions;
- Zustand for incident state;
- localStorage for progress persistence;
- Vitest for logic tests;
- Playwright for one critical end-to-end flow.

Prefer the latest stable versions already supported by the environment.

Do not introduce additional libraries unless they materially reduce implementation time.

---

## Primary user flow

1. The user opens the landing page.
2. The user selects the only available incident: **Retry Storm**.
3. A short briefing explains the system and the operational objective.
4. The incident starts at `09:42`.
5. The user sees:
   - the system topology;
   - current health signals;
   - the incident timeline;
   - available actions;
   - remaining investigation budget.
6. The user inspects signals and takes actions.
7. Each action advances the clock and changes the incident state.
8. New events, signals, and actions become available.
9. The incident ends when:
   - the system is stabilized;
   - the system suffers a major outage;
   - the user exhausts the action budget.
10. The app shows an autopsy report explaining:
    - what happened;
    - which signals mattered;
    - which decisions helped or hurt;
    - where the failure chain could have been broken;
    - the reliability concepts involved.

---

## Scenario: Retry Storm

### Narrative

A checkout platform has recently deployed a small change to its payment orchestration service.

At `09:42`, payment failures begin to rise.

The CPU and memory usage of the payment service look normal. However, latency increases and the event queue starts growing.

The real problem is a downstream payment provider returning intermittent timeouts. The payment service automatically retries failed requests without exponential backoff or jitter. The retries multiply traffic, consume connection pools, increase queue depth, and eventually affect unrelated checkout requests.

### Learning goals

The scenario should teach:

- retry amplification;
- exponential backoff;
- jitter;
- queue saturation;
- connection pool exhaustion;
- circuit breakers;
- blast radius;
- rollback limitations;
- mitigation before root-cause certainty.

### System topology

Display these nodes:

- Web Checkout
- Checkout API
- Payment Orchestrator
- Payment Provider
- Event Queue
- Order Service
- Database

Display directional connections between them.

Each node has one of these statuses:

- healthy;
- warning;
- critical;
- isolated;
- recovering.

The topology should be simple and readable, not a full observability dashboard.

---

## Initial incident state

At `09:42`:

- payment success rate: `94%`;
- checkout latency p95: `1.8s`;
- payment service CPU: `43%`;
- payment service memory: `51%`;
- queue depth: `1,240`;
- provider timeout rate: `6%`;
- retry rate: `320/min`;
- open payment connections: `68%`;
- customer impact: low.

The user starts with:

- 6 action points;
- 0 confirmed hypotheses;
- access to basic metrics;
- access to recent deploy information;
- no access to detailed provider traces until unlocked.

---

## User actions

Each action costs one action point unless otherwise specified.

### Inspect recent deployment

Effect:

- reveals that retry defaults changed in the latest release;
- unlocks `Rollback deployment`;
- advances time by 2 minutes.

### Inspect queue metrics

Effect:

- reveals that queue growth is accelerating;
- adds the hypothesis `Consumers cannot keep up`;
- advances time by 1 minute.

### Inspect provider traces

Initially locked.

Unlock when the user inspects either the recent deployment or queue metrics.

Effect:

- reveals intermittent provider timeouts;
- adds the hypothesis `Downstream instability`;
- advances time by 2 minutes.

### Rollback deployment

Effect:

- restores the old retry configuration for new application instances;
- does not immediately remove requests already in flight;
- reduces retry growth, but does not stabilize the system alone;
- advances time by 4 minutes.

### Disable automatic retries

Effect:

- sharply reduces generated traffic;
- temporarily increases visible payment failures;
- prevents connection pool exhaustion;
- advances time by 2 minutes.

### Enable circuit breaker

Effect:

- isolates the unstable provider;
- fails some payments quickly;
- protects the rest of checkout;
- advances time by 2 minutes.

### Scale payment workers

Effect:

- temporarily increases throughput;
- also increases downstream retry pressure;
- looks helpful at first but worsens the incident if retries remain enabled;
- advances time by 3 minutes.

### Increase queue retention

Effect:

- delays message loss;
- does not address retry amplification;
- advances time by 2 minutes.

### Pause checkout traffic

Cost: 2 action points.

Effect:

- stops most customer traffic;
- stabilizes infrastructure;
- causes severe business impact;
- should be classified as an emergency containment action rather than the best solution;
- advances time by 1 minute.

---

## Incident progression

Use a deterministic state machine rather than a physics simulation.

The incident state should be derived from:

- elapsed incident time;
- actions already taken;
- whether retries are enabled;
- whether the circuit breaker is enabled;
- whether the deployment was rolled back;
- whether traffic was paused;
- whether workers were scaled.

### Important progression rules

1. If retries remain enabled after `09:48`, queue depth and open connections accelerate.
2. Scaling workers while retries remain enabled increases retry traffic.
3. A rollback alone slows degradation but does not clear in-flight retries.
4. Disabling retries prevents the worst outcome.
5. Enabling the circuit breaker after disabling retries produces the best outcome.
6. Pausing traffic always prevents infrastructure collapse but produces high business impact.
7. If open connections reach `100%`, the incident ends in a major outage.
8. If queue depth exceeds `20,000`, order processing becomes critically delayed.
9. The best outcome should remain possible without inspecting every signal.
10. Users should be rewarded for mitigation before perfect diagnosis.

---

## Outcomes

Implement at least four final outcomes.

### Excellent containment

Conditions:

- retries disabled;
- circuit breaker enabled;
- traffic not paused;
- connection pool below critical level.

Message:

The user interrupted the amplification loop, isolated the unstable dependency, and preserved the rest of checkout.

### Partial recovery

Conditions:

- retries disabled or deployment rolled back;
- system avoids full collapse;
- circuit breaker not enabled.

Message:

The immediate pressure was reduced, but the downstream dependency remained insufficiently isolated.

### Emergency containment

Conditions:

- checkout traffic paused.

Message:

The infrastructure survived, but the chosen containment caused avoidable business impact.

### Major outage

Conditions:

- connection pool exhausted or action budget depleted while the system is critical.

Message:

Retry amplification exhausted shared resources and spread the incident beyond the original dependency.

---

## Scoring

Score the user from 0 to 100.

Suggested scoring:

- `+30` disable automatic retries;
- `+25` enable circuit breaker;
- `+15` inspect provider traces;
- `+10` inspect recent deployment;
- `+10` mitigate before open connections exceed 90%;
- `+10` avoid pausing all checkout traffic;
- `-15` scale workers while retries are enabled;
- `-10` spend actions only on low-impact investigation;
- `-20` allow connection pool exhaustion.

Clamp the final score between 0 and 100.

Display a label:

- 90–100: Incident Commander
- 70–89: Strong Response
- 50–69: Partial Containment
- 0–49: Failure Chain Unbroken

The score is secondary. The autopsy explanation is the primary learning output.

---

## Required screens

### 1. Landing page

Content:

- product name;
- one-sentence explanation;
- a prominent `Start investigation` button;
- a card for the Retry Storm scenario;
- estimated duration: 8 minutes;
- difficulty: Intermediate;
- concepts covered.

The page should feel editorial and cinematic, not like a SaaS dashboard.

### 2. Scenario briefing

Content:

- incident summary;
- operational objective;
- simplified architecture preview;
- learning goals;
- `Enter incident` button.

### 3. Incident workspace

Use a three-column desktop layout:

- left: system topology;
- center: incident timeline and event feed;
- right: metrics, hypotheses, and actions.

Include a top bar with:

- incident title;
- current simulated time;
- action points;
- customer impact level;
- restart button.

On smaller screens, convert the three areas into tabs.

### 4. Final autopsy

Content:

- outcome;
- score;
- incident timeline;
- actions taken;
- missed opportunities;
- root cause;
- contributing factors;
- best intervention point;
- concepts learned;
- `Replay incident` button.

---

## Interaction design

### System map

- Nodes react visually to status changes.
- Connections can pulse when traffic rises.
- Selecting a node opens a compact detail panel.
- Avoid free-form dragging.
- Avoid canvas libraries unless necessary.
- Prefer regular HTML and SVG.

### Timeline

Every event includes:

- simulated time;
- title;
- short description;
- severity;
- related system node.

New events should animate in gently.

### Metrics

Show only the most useful metrics.

Each metric has:

- current value;
- trend indicator;
- state label;
- optional one-line explanation.

Do not use complicated charts in the MVP. Sparklines are optional.

### Actions

Each action card includes:

- action name;
- short expected purpose;
- time cost;
- action-point cost;
- locked, available, or completed state.

Do not reveal the exact consequence before the action is selected.

When the user clicks an action:

1. show a confirmation dialog;
2. apply the action;
3. advance simulated time;
4. update metrics and topology;
5. append timeline events;
6. show a concise consequence notification.

---

## Visual direction

Aim for:

- dark operational interface;
- strong typography;
- restrained red, amber, green, and cyan status accents;
- subtle grid or topology background;
- rounded panels;
- thin borders;
- high information clarity;
- cinematic incident atmosphere.

Avoid:

- excessive gradients;
- neon cyberpunk styling;
- tiny dashboard text;
- dense enterprise monitoring visuals;
- gamified badges everywhere;
- generic AI-product aesthetics.

Use motion only to communicate state changes.

---

## Accessibility

Required:

- keyboard-accessible actions;
- visible focus states;
- sufficient color contrast;
- status conveyed by text and icon, not color alone;
- reduced-motion support;
- semantic headings;
- descriptive button labels;
- responsive text sizes.

---

## Suggested data model

```ts
type NodeStatus =
  | "healthy"
  | "warning"
  | "critical"
  | "isolated"
  | "recovering";

type Severity = "info" | "warning" | "critical" | "success";

type SystemNode = {
  id: string;
  name: string;
  description: string;
  status: NodeStatus;
};

type Metric = {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "flat";
  severity: Severity;
};

type IncidentEvent = {
  id: string;
  minute: number;
  title: string;
  description: string;
  severity: Severity;
  relatedNodeIds: string[];
};

type IncidentAction = {
  id: string;
  title: string;
  description: string;
  actionPointCost: number;
  timeCostMinutes: number;
  prerequisites?: string[];
  repeatable?: boolean;
};

type IncidentFlags = {
  deploymentInspected: boolean;
  queueInspected: boolean;
  providerTracesInspected: boolean;
  rollbackApplied: boolean;
  retriesDisabled: boolean;
  circuitBreakerEnabled: boolean;
  workersScaled: boolean;
  queueRetentionIncreased: boolean;
  trafficPaused: boolean;
};

type IncidentState = {
  currentMinute: number;
  actionPoints: number;
  flags: IncidentFlags;
  metrics: Record<string, Metric>;
  nodeStatuses: Record<string, NodeStatus>;
  completedActionIds: string[];
  hypotheses: string[];
  timeline: IncidentEvent[];
  status: "briefing" | "active" | "resolved" | "failed";
};
```

---

## Architecture

Use simple separation of responsibilities.

```text
app/
  page.tsx
  incidents/
    retry-storm/
      page.tsx
      briefing/
        page.tsx
      report/
        page.tsx

components/
  landing/
  incident/
    IncidentHeader.tsx
    SystemMap.tsx
    SystemNodeCard.tsx
    MetricsPanel.tsx
    ActionPanel.tsx
    ActionCard.tsx
    IncidentTimeline.tsx
    HypothesisPanel.tsx
    ConsequenceToast.tsx
  report/
    OutcomeSummary.tsx
    DecisionReview.tsx
    LearningPoints.tsx

data/
  retry-storm.ts

engine/
  types.ts
  initializeIncident.ts
  applyAction.ts
  advanceIncident.ts
  deriveMetrics.ts
  deriveNodeStatuses.ts
  calculateOutcome.ts
  calculateScore.ts

store/
  incidentStore.ts

tests/
  engine/
  e2e/
```

The incident engine must remain independent from React.

Given an incident state and an action, it should return the next state deterministically.

---

## Engine contract

Implement a pure function:

```ts
function applyIncidentAction(
  state: IncidentState,
  actionId: string
): IncidentState
```

Responsibilities:

- validate action availability;
- subtract action points;
- apply action flags;
- advance simulated time;
- derive new metrics;
- derive node statuses;
- generate new timeline events;
- determine whether the incident has ended;
- persist the updated state.

Do not put business rules inside UI components.

---

## Persistence

Use localStorage.

Persist:

- current incident state;
- whether the briefing was viewed;
- best score;
- completed outcomes.

Provide:

- resume incident;
- restart incident;
- replay after final report.

Handle corrupt or incompatible saved state by resetting safely.

Include a schema version in persisted data.

---

## Testing requirements

### Unit tests

Test the engine, not UI details.

Minimum cases:

1. disabling retries reduces retry growth;
2. scaling workers while retries are enabled worsens retry traffic;
3. rollback alone does not produce the best outcome;
4. disabling retries plus enabling the circuit breaker produces excellent containment;
5. pausing traffic produces emergency containment;
6. connection exhaustion produces a major outage;
7. score always stays between 0 and 100;
8. unavailable actions cannot be executed.

### End-to-end test

Create one Playwright flow:

- open landing page;
- start Retry Storm;
- enter incident;
- inspect deployment;
- inspect provider traces;
- disable retries;
- enable circuit breaker;
- reach the excellent containment report.

---

## Acceptance criteria

The MVP is complete when:

- the app runs locally with a single documented command;
- the landing page is polished and responsive;
- the Retry Storm scenario is fully playable;
- each action visibly changes the incident;
- the timeline updates after every action;
- the topology reflects node health;
- at least four distinct outcomes are reachable;
- restarting clears the active incident correctly;
- progress survives a page reload;
- the final report explains the failure chain;
- the engine has meaningful unit tests;
- the primary Playwright flow passes;
- there are no TypeScript errors;
- there are no obvious console errors;
- mobile and tablet layouts remain usable.

---

## Implementation order

Codex should work in this order:

1. scaffold the application;
2. install only required dependencies;
3. create the types and static scenario data;
4. implement the deterministic incident engine;
5. add unit tests for the engine;
6. build the landing and briefing screens;
7. build the incident workspace;
8. connect UI actions to the engine;
9. implement persistence;
10. build the final report;
11. add responsive behavior and accessibility;
12. add restrained animations;
13. add the Playwright happy-path test;
14. run lint, type checking, unit tests, and end-to-end tests;
15. fix all failures before stopping.

---

## Commands

Use the package manager already available in the repository.

Expected commands should be equivalent to:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

Add missing scripts to `package.json`.

---

## Instructions for Codex

Build the complete MVP described in this file.

Rules:

1. Do not expand the scope.
2. Do not add authentication or a backend.
3. Do not replace the incident experience with quizzes.
4. Do not add a chatbot or AI assistant.
5. Keep the incident engine deterministic.
6. Keep scenario rules outside React components.
7. Prefer clear, maintainable code over clever abstractions.
8. Reuse components only where it reduces duplication.
9. Avoid premature generic scenario-builder architecture.
10. Make the single included incident feel complete and polished.
11. Run all verification commands before declaring completion.
12. If the repository already contains code, preserve its conventions unless they conflict with this specification.

At completion, provide:

- a concise implementation summary;
- the final file tree;
- commands used for verification;
- test results;
- any known limitations.
