import type { ScenarioDefinition } from "../types";
import { calculateConnectionPoolExhaustionOutcome } from "./calculateOutcome";
import { calculateConnectionPoolExhaustionScore } from "./calculateScore";
import { actions, connections, initialEvent, initialMetrics, initialStatuses, nodes } from "./data";
import { deriveConnectionPoolExhaustionState, resolveConnectionPoolExhaustionAction } from "./rules";

const initialFlags = { poolMetricsInspected: false, queryMetricsInspected: false, deploymentInspected: false, leakDetectionEnabled: false, concurrencyCapped: false, workersRestarted: false, poolResized: false, queriesTuned: false, rollbackApplied: false, trafficShed: false };
export const connectionPoolExhaustionDefinition: ScenarioDefinition = {
  id: "connection-pool-exhaustion", title: "Connection Pool Exhaustion", summary: "Slow queries and unreleased connections starve otherwise healthy application workers.", nodes, connections, actions,
  concepts: ["Connection pools", "Timeouts", "Resource leaks", "Query latency", "Concurrency limits", "Blast radius"], prerequisitePolicy: "hard",
  content: {
    startMinute: 734, durationMinutes: 10, difficulty: "Intermediate", impact: { metricId: "poolUtilization", growingAt: 80, highAt: 90, severeFlag: "trafficShed" }, topologyNote: "Workers compete for a finite connection pool",
    briefing: { eyebrow: "Incident briefing", title: "Healthy workers, no connections.", description: "At 12:14, checkout latency rises while application workers look normal. A slow query path and a connection leak are consuming the shared pool one connection at a time.", objective: "Protect the pool and identify the lifecycle leak before healthy work is starved.", capability: "Compare pool pressure with query behavior, then choose containment without hiding the cause.", learning: "Why finite pools, slow queries, and resource leaks turn normal concurrency into a cascading outage." },
    report: { rootCauseTitle: "Leaked database connections", rootCauseDescription: "A recently deployed path failed to return connections reliably while slow queries held others longer. The finite pool exhausted before CPU or memory looked abnormal.", bestIntervention: "Before pool utilization exceeds 90%", missedOpportunities: [{ flag: "leakDetectionEnabled", label: "Enable leak detection" }, { flag: "concurrencyCapped", label: "Cap request concurrency" }, { flag: "poolMetricsInspected", label: "Inspect pool metrics" }] },
    outcomeMessages: {
      "excellent-containment": { eyebrow: "Excellent containment", title: "The pool has headroom again.", body: "You reduced contention and identified the leak without hiding the resource bottleneck behind a larger pool.", tone: "text-emerald-300" },
      "partial-recovery": { eyebrow: "Partial recovery", title: "Workers recovered, the leak remains.", body: "You reduced immediate pressure, but the underlying connection lifecycle problem still threatens the next wave.", tone: "text-amber-200" },
      "emergency-containment": { eyebrow: "Emergency containment", title: "The pool survived at a customer cost.", body: "Traffic shedding protected the database while making checkout less available.", tone: "text-amber-200" },
      "major-outage": { eyebrow: "Major outage", title: "The pool was exhausted.", body: "Workers could no longer acquire connections and checkout latency spread across the system.", tone: "text-red-300" },
    },
  },
  createInitialState: () => ({ scenarioId: "connection-pool-exhaustion", currentMinute: 0, actionPoints: 6, flags: { ...initialFlags }, metrics: structuredClone(initialMetrics), nodeStatuses: { ...initialStatuses }, completedActionIds: [], hypotheses: [], timeline: [structuredClone(initialEvent)], status: "active" }),
  resolveAction: resolveConnectionPoolExhaustionAction, deriveState: deriveConnectionPoolExhaustionState, calculateOutcome: calculateConnectionPoolExhaustionOutcome, calculateScore: calculateConnectionPoolExhaustionScore,
};
