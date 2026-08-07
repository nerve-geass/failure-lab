# Failure Lab

### Learn how systems fail by investigating them.

Failure Lab is an interactive reliability training game built around one deceptively simple question:

> **At which point could you have broken the chain of failure?**

Instead of reading another postmortem or watching another dashboard demo, you step into a simulated production incident. You inspect signals, form hypotheses, choose interventions, spend a limited investigation budget, and live with the consequences.

No chatbot. No hand-holding. Just the pressure of making a good decision with incomplete information.

## Why try it?

Real incidents rarely announce their root cause. A downstream timeout looks like a local latency spike. A cache expiry looks like normal traffic. A queue backlog looks harmless—until it is not.

Failure Lab turns those moments into short, replayable exercises where you can practice:

- reading operational signals instead of chasing the loudest metric;
- separating symptoms from causes;
- mitigating blast radius before diagnosis is perfect;
- understanding retries, queues, caches, pools, backpressure, and graceful degradation;
- seeing how a reasonable action can still make an incident worse.

## The investigation loop

```text
Inspect signals → form a hypothesis → choose an action → advance time
       ↑                                               ↓
       └────────────── autopsy the outcome ←───────────┘
```

Every scenario gives you:

- a readable system topology;
- live metrics with trends and severity;
- a timeline that evolves with your decisions;
- actions with costs, prerequisites, and consequences;
- deterministic outcomes you can replay and understand;
- a final incident autopsy explaining what mattered and where the chain could have been interrupted.

## Playable scenarios

| Scenario | What it teaches | Difficulty |
| --- | --- | --- |
| **Retry Storm** | Retry amplification, circuit breakers, blast radius | Beginner |
| **Cache Stampede** | TTLs, cache warming, request coalescing | Beginner |
| **Queue Consumer Lag** | Throughput, backpressure, consumer lag | Beginner |
| **Connection Pool Exhaustion** | Resource leaks, query latency, concurrency limits | Intermediate |

More scenarios are planned, including memory leaks, bad deployments, database lock storms, hot partitions, and distributed incidents.

## Run it locally

Failure Lab is local-first and needs no backend, account, API key, or external service.

### Prerequisites

- [asdf](https://asdf-vm.com/) with the Node.js plugin;
- npm.

The repository includes a `.tool-versions` file, so asdf selects the expected Node.js version automatically.

```bash
asdf install
npm install
npm run dev
```

Open the local URL shown by Vite and start investigating.

## Verify the experience

Run the full local test suite:

```bash
npm test
npm run build
npm run test:e2e
```

The project uses Vitest for deterministic incident rules and Playwright for critical playable paths.

## Design principles

Failure Lab is deliberately opinionated:

- **Signals before certainty.** You should be able to mitigate while the root cause is still a hypothesis.
- **Consequences over decoration.** Actions change time, metrics, topology, and outcomes.
- **Difficulty through agency.** Beginner scenarios explain locked actions; advanced scenarios will let you try risky actions and penalize poor reasoning.
- **Replay is part of learning.** The point is not simply to win—it is to compare decisions and understand the counterfactual.
- **Safe by construction.** Future blackbox and hacking exercises will run against deterministic local simulations, never real infrastructure.

## What is next?

The long-term direction is a seeded scenario generator that can create fresh exercises from validated incident families. A generated scenario will still need a causal chain, evidence, solvable paths, coherent costs, and reachable outcomes before it can be played.

That makes Failure Lab useful in two modes:

1. authored incident investigations for focused learning;
2. procedural blackbox exercises for repeated practice and exploration.

## Project status

Failure Lab is an evolving educational prototype. The core incident engine, four playable scenarios, local persistence, scenario-aware UI, and critical browser flows are in place.

Built to make reliability engineering feel less like memorizing rules—and more like learning to see the system.
