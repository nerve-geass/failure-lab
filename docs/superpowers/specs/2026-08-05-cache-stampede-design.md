# Cache Stampede Scenario Design

## Goal

Add Cache Stampede as the second playable Failure Lab incident while preserving Retry Storm behavior and the generic scenario engine.

## Scenario

At 10:16, a popular product cache entry expires immediately after a deployment. Requests miss the cache together, hit the database, and create a stampede. Aggregate application CPU remains moderate while database latency, connection usage, and checkout latency rise.

Learning goals: TTL coordination, cache warming, request coalescing, database protection, and mitigation before root-cause certainty.

## Gameplay

- Six action points and a deterministic incident clock.
- Initial signals: cache hit rate 71%, database query latency 180 ms, database connections 62%, checkout p95 1.6 s, request rate 4,800/min, cache misses 1,390/min.
- Actions: inspect cache metrics, inspect recent deployment, inspect database metrics, warm the cache, enable request coalescing, throttle catalog traffic, and rollback deployment.
- Inspecting cache metrics or the recent deployment unlocks database metrics and the mitigation actions.
- Best containment is to inspect cache metrics, warm the cache, and enable request coalescing before database connections exceed 90%.
- Outcomes remain the engine’s standard four IDs: excellent containment, partial recovery, emergency containment, and major outage.

## Architecture

Implement a `cache-stampede` `ScenarioDefinition` under `src/domain/scenario/cache-stampede/`. Keep all scenario data and rules in that module. Register it beside Retry Storm, expose it through the existing landing catalog, and keep persistence keyed by the serialized `scenarioId` using the existing storage adapter.

The shared engine, store, presentation primitives, and Retry Storm rules should not gain scenario-specific branches.

## Verification

- Unit tests cover initial metrics, unlocks, action effects, outcome precedence, scoring, and registry membership.
- Existing Vitest tests and Retry Storm behavior remain green.
- Playwright covers selecting Cache Stampede, entering the incident, following the excellent containment path, and reaching the report.
