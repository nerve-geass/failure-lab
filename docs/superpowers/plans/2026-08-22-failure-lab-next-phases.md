# Failure Lab Next Phases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Failure Lab from four authored incidents into a deeper learning path, then expose Blackbox and deterministic procedural replay as first-class product capabilities.

**Architecture:** Continue using the existing scenario-agnostic `ScenarioDefinition` contract for authored incidents. Each new scenario remains self-contained under `src/domain/scenario/<id>/`, while shared application, presentation, persistence, catalog, and report code consume scenario metadata without scenario-specific branching. Blackbox integration and procedural generation are separate phases after the authored scenario path is stable.

**Tech Stack:** TypeScript, React, Zustand, Vitest, Playwright, Vite, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-08-05-procedural-scenarios-roadmap.md` and the scenario-specific specs listed below.

## Global Constraints

- Preserve deterministic local execution; no backend, authentication, external infrastructure, credentials, or real network targets.
- Keep every scenario solvable, replayable, and understandable through signals, consequences, and the final autopsy.
- Keep scenario rules inside their scenario module; shared UI must consume metadata and generic incident state.
- Preserve existing scenario selection, persistence, catalog resume, report, unit-test, and Playwright flows.
- Do not add random exercise selection until seeded generation and validation are implemented.
- Keep Blackbox mode sandboxed and separate from authored incident rules until its catalog entry is explicitly designed.

---

### Phase 1: Add Bad Deployment

**Outcome:** An intermediate scenario teaching canary analysis, partial blast radius, feature flags, rollback risk, and mitigation before certainty.

**Plan:** Execute `docs/superpowers/plans/2026-08-22-bad-deployment.md`.

**Exit criteria:** The scenario is available in the catalog, has deterministic domain tests, application coverage, and a critical Playwright path. The full existing suite remains green.

### Phase 2: Add Memory Leak

**Outcome:** A gradual degradation scenario teaching heap growth, garbage collection, profiling, restart trade-offs, and lost work.

**Source design:** `docs/superpowers/specs/` currently contains the catalog entry but no dedicated design spec; write and approve `memory-leak-design.md` before implementation.

**Required work:** Define the causal chain and initial metrics, implement a self-contained `ScenarioDefinition`, register it after Bad Deployment, add catalog metadata, domain/application tests, and one browser flow.

**Exit criteria:** The scenario presents a distinct learning problem from Connection Pool Exhaustion and has at least one safe mitigation path plus reachable degraded and failed outcomes.

### Phase 3: Make Blackbox a first-class learning mode

**Outcome:** The existing `?mode=blackbox` experience becomes discoverable and intentional without leaking hidden simulation state.

**Required work:** Define the catalog/product entry and launch flow, choose whether Blackbox is a separate mode or difficulty track, add a short briefing and exit/resume behavior, then cover it with Playwright.

**Constraints:** Keep the current observation policy contract; do not expose hidden causes, add real targets, or couple Blackbox internals to authored `IncidentState` rules.

**Exit criteria:** A learner can discover, start, play, leave, and return to Blackbox through supported UI; authored incident flows remain unchanged.

### Phase 4: Parameterize one authored scenario

**Outcome:** One incident family can produce multiple deterministic variants from a seed.

**Recommendation:** Start with Retry Storm because its causal chain and action effects are already explicit; Cache Stampede is the second-best candidate.

**Required work:** Define family parameters and safe ranges, generate a complete scenario definition before start, persist the seed, and prove that the same seed reproduces the same briefing, metrics, events, outcomes, and score.

**Exit criteria:** Generated variants remain solvable and pedagogically coherent under validation; existing authored scenarios still use their current stable definitions.

### Phase 5: Add validation and generated replay

**Outcome:** Procedural exercises cannot be published or played when their causal chain, action budget, or outcomes are incoherent.

**Required work:** Implement validation for solvability, inferable evidence, action costs/prerequisites, consequences, reachable outcomes, budget feasibility, and metric consistency. Add seed persistence and replay coverage.

**Exit criteria:** Invalid generated definitions fail before entering the catalog or session; valid seeds can be resumed and replayed exactly.

### Phase 6: Expand advanced scenario coverage

**Order:** Database Lock Storm → Hot Partition → Cascading Failure → Distributed Incident.

**Rationale:** The order progresses from a focused resource-contention problem to skewed distributed state, then multi-service propagation, and finally competing hypotheses and incident-command decisions.

**Exit criteria for each scenario:** Dedicated design spec, self-contained definition, catalog integration, domain tests, application regression coverage, and a critical browser path.

### Cross-phase verification

- After each authored scenario: `npm test`, `npm run build`, and the relevant Playwright spec.
- After Blackbox integration: run the existing Blackbox unit/component tests plus catalog and browser regression tests.
- After generation: run deterministic seed, validator, persistence, replay, full unit, build, and end-to-end suites.
- Before declaring a phase complete: inspect the diff for scenario-specific logic leaking into shared presentation or application code.
