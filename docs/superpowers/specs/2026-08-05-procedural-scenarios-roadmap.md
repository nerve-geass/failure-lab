# Procedural Scenarios and Blackbox Exercises Roadmap

## Is the exercise list enough?

No. The catalog defines the learning roadmap and rough subject areas, but a reliable generator also needs structured scenario families, parameter ranges, invariants, and validation rules. Without those constraints, random scenarios may be incoherent, unsolvable, or accidentally teach the wrong lesson.

## Generation model

Keep `ScenarioDefinition` as the runtime contract. Add a generator layer that produces a complete definition before an exercise starts:

```text
Scenario family + seed + difficulty
        ↓
parameter generator
        ↓
scenario definition + hidden cause + validation
        ↓
generic incident engine
```

The seed must be persisted so a refresh or replay reconstructs the same exercise. Randomness belongs in generation, never inside action application or state derivation.

## Required generator inputs

Each scenario family should define:

- learning objectives and concepts;
- system topology templates;
- tunable parameters and safe ranges;
- initial metrics and normal baselines;
- hidden causal chain;
- available actions and their costs;
- hard/soft prerequisite policy;
- valid mitigation paths and bad-choice consequences;
- outcome thresholds and score rubric;
- narrative templates for briefing, events, and autopsy.

## Validation invariants

Every generated scenario must be checked before publication:

- at least one solvable path exists;
- the causal chain is inferable from available evidence;
- actions have coherent costs and prerequisites;
- wrong actions create observable consequences;
- all declared outcomes are reachable or explicitly excluded;
- the action budget cannot make every valid path impossible;
- metrics, node statuses, and timeline events remain internally consistent.

## Blackbox mode

Blackbox exercises should be a separate interaction policy over a simulated local system. The player sees only allowed inputs, outputs, logs, and side effects. Advanced scenarios use soft prerequisites: actions are always tentable, but uninformed actions cost time/points or worsen the simulated system.

Future hacking exercises must remain sandboxed and deterministic: no real network targets, credentials, or executable exploit payloads. They can teach reconnaissance, hypothesis testing, abuse cases, and threat modeling through a controlled state machine.

## Phased roadmap

1. Complete several hand-authored scenarios and stabilize the `ScenarioDefinition` contract.
2. Parameterize one family, starting with Retry Storm or Cache Stampede.
3. Add seeded generation and scenario validation tests.
4. Add a blackbox interaction contract and local simulated targets.
5. Add generated exercise selection, replay, and persistence.
