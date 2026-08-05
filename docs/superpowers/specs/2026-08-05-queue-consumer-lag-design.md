# Queue Consumer Lag Scenario Design

## Goal

Add Queue Consumer Lag as the third playable Failure Lab incident, teaching throughput, backpressure, consumer lag, and safe scaling.

## Scenario

At 11:03, producers continue publishing order events at a normal rate while a consumer deployment reduces processing throughput. Queue depth and consumer lag rise even though application traffic looks stable. The retry queue is small at first but becomes a second amplifier when replayed too early.

## Gameplay

- Beginner scenario with six action points and hard prerequisites.
- Initial signals: queue depth 4,200 messages, consumer lag 38 seconds, consumer throughput 5,200/min, producer rate 5,600/min, retry queue 380 messages, database latency 220 ms.
- Actions: inspect queue metrics, inspect consumer metrics, inspect recent deployment, scale consumers, apply backpressure, increase batch size, replay retry queue, and pause producers.
- Best containment: inspect the queue and consumer group, scale consumers, then apply backpressure before lag becomes an outage.
- Outcomes use the standard excellent, partial, emergency, and major IDs.

## Architecture

Implement a self-contained `queue-consumer-lag` `ScenarioDefinition` under `src/domain/scenario/queue-consumer-lag/`. Register it and mark the catalog entry available. Shared presentation consumes the scenario metadata for impact metric, start time, topology note, and missed opportunities.

## Verification

- Unit tests cover baseline signals, unlocks, scaling/backpressure, risky replay, outcome precedence, and scoring.
- Application tests cover starting and restoring by scenario ID.
- Playwright covers the excellent containment path and preserves both earlier scenario paths.
