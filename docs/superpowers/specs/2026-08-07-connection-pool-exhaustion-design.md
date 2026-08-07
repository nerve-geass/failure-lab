# Connection Pool Exhaustion Scenario Design

## Goal

Add Connection Pool Exhaustion as the fourth playable incident and first Intermediate exercise.

## Scenario

At 12:14, a slow query path and a connection leak gradually consume the shared database pool. Application CPU remains moderate, but pool wait time and request latency rise until healthy workers cannot acquire connections.

## Gameplay

- Intermediate difficulty, six action points, hard prerequisites.
- Initial signals: open connections 74%, pool wait 420 ms, checkout p95 2.4 s, database query latency 180 ms, active workers 48, leaked connections 0.8/min.
- Actions: inspect pool metrics, inspect query latency, inspect recent deployment, enable leak detection, cap request concurrency, restart workers, increase pool size, tune slow queries, rollback deployment, and shed traffic.
- Best containment: identify pool pressure, cap concurrency, and enable leak detection before the pool reaches 100%.
- Mistakes should teach that increasing pool size can move pressure to the database and restarting workers clears symptoms without fixing the leak.

## Integration

Implement a self-contained `connection-pool-exhaustion` `ScenarioDefinition`, register it after Queue Consumer Lag, mark the catalog entry available, and add application and Playwright coverage. Shared presentation consumes scenario metadata only.
