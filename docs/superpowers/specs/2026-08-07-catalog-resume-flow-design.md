# Catalog-first entry and exercise resume flow

## Goal

Make the catalog the stable entry point of Failure Lab while preserving the ability to resume an unfinished exercise. The landing experience should present Failure Lab as an educational game, not as a shortcut into whichever scenario happens to be selected internally.

## Approved product behavior

- Opening or refreshing the app always shows the catalog landing page.
- An active persisted exercise is restored in memory but does not automatically open the incident workspace.
- The landing page shows a contextual `Continue your investigation` card when an active exercise exists.
- `Resume investigation` opens the saved exercise.
- `Abandon and choose another` immediately clears the saved exercise and keeps the user in the catalog. No confirmation dialog is required.
- A completed or failed persisted exercise remains available as a report preview from the landing page, while the primary next action is `Start another investigation`.
- If there is no saved exercise, the landing page focuses on the learning path and available scenarios.

## Landing experience

The hero becomes scenario-neutral. It introduces the product with a message such as:

> Train your instincts. Learn from failure.

The catalog remains the primary selection surface for the predefined learning path. The future generated-scenario entry point will use the playful label `Test my instincts`; it is intentionally not part of this implementation slice.

## State and data flow

Persistence continues to store the latest incident snapshot. Restoration should resolve the scenario and hydrate the store, then leave `screen` set to `landing` for every snapshot state. The landing page decides which contextual card to show from the restored incident status:

```text
no snapshot       -> learning path
active snapshot   -> resume / abandon
resolved/failed   -> review report / start another
```

Starting another scenario replaces the current in-memory selection and begins from its briefing. Abandoning clears persistence and resets the in-memory incident to the default catalog context without entering a scenario.

## Gamification direction

The tone should frame actions as practice and judgment under pressure. Use outcome language already present in the product, such as `Excellent containment`, and reserve future progression mechanics for a separate slice. This change does not add streaks, badges, leaderboards, or random generation.

## Acceptance criteria

1. A refresh with an active saved incident lands on the catalog.
2. `Resume investigation` returns to the saved incident without resetting it.
3. `Abandon and choose another` removes the snapshot immediately and leaves the catalog visible.
4. A resolved or failed snapshot lands on the catalog and exposes report review plus a path to a new investigation.
5. The hero no longer depends on the currently selected scenario.
6. Existing scenario selection, briefing, incident, report, persistence, and end-to-end flows remain functional.
