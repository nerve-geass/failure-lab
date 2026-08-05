import { INCIDENT_START_MINUTE, INITIAL_ACTION_POINTS } from "@/domain/incident/constants";
import { retryStormScenario as scenarioData } from "../retryStorm";
import type { ScenarioDefinition } from "../types";
import { calculateRetryStormOutcome } from "./calculateOutcome";
import { calculateRetryStormScore } from "./calculateScore";
import { deriveRetryStormState, resolveRetryStormAction } from "./rules";

const initialFlags = {
  deploymentInspected: false,
  queueInspected: false,
  providerTracesInspected: false,
  rollbackApplied: false,
  retriesDisabled: false,
  circuitBreakerEnabled: false,
  workersScaled: false,
  queueRetentionIncreased: false,
  trafficPaused: false,
};

export const retryStormDefinition: ScenarioDefinition = {
  id: scenarioData.id,
  title: scenarioData.title,
  summary: "A payment provider timeout becomes a retry storm across checkout.",
  nodes: scenarioData.nodes,
  connections: scenarioData.connections,
  actions: scenarioData.actions,
  concepts: scenarioData.concepts,
  content: {
    durationMinutes: 8,
    difficulty: "Beginner",
    briefing: {
      eyebrow: "Incident briefing",
      title: "A small timeout becomes a system-wide problem.",
      description: "At 09:42, payments begin failing intermittently. The obvious CPU and memory signals look normal, but latency and queue depth are moving in the wrong direction.",
      objective: "Break the amplification loop before it spreads beyond payments.",
      capability: "Inspect signals, mitigate pressure, and protect the rest of checkout.",
      learning: "Why retries, queues, and shared pools turn a small fault into a blast radius.",
    },
    report: {
      rootCauseTitle: "Retry amplification",
      rootCauseDescription: "The payment provider returned intermittent timeouts. The payment service retried without exponential backoff or jitter, multiplying traffic and consuming connection pools.",
      bestIntervention: "Before connections exceed 90%",
    },
    outcomeMessages: {
      "excellent-containment": { eyebrow: "Excellent containment", title: "The chain was interrupted.", body: "You stopped retry amplification, isolated the unstable dependency, and preserved the rest of checkout.", tone: "text-emerald-300" },
      "partial-recovery": { eyebrow: "Partial recovery", title: "The pressure was reduced, not isolated.", body: "You slowed the immediate degradation, but the downstream dependency remained part of the blast radius.", tone: "text-amber-200" },
      "emergency-containment": { eyebrow: "Emergency containment", title: "Infrastructure survived at a cost.", body: "Pausing checkout protected shared resources, but the containment caused severe business impact.", tone: "text-amber-200" },
      "major-outage": { eyebrow: "Major outage", title: "The failure chain completed.", body: "Retry amplification exhausted shared resources and spread the incident beyond the original dependency.", tone: "text-red-300" },
    },
  },
  createInitialState: () => ({
    scenarioId: scenarioData.id,
    currentMinute: INCIDENT_START_MINUTE,
    actionPoints: INITIAL_ACTION_POINTS,
    flags: { ...initialFlags },
    metrics: structuredClone(scenarioData.initialMetrics),
    nodeStatuses: { ...scenarioData.initialStatuses },
    completedActionIds: [],
    hypotheses: [],
    timeline: [structuredClone(scenarioData.initialEvent)],
    status: "active",
  }),
  resolveAction: resolveRetryStormAction,
  deriveState: deriveRetryStormState,
  calculateOutcome: calculateRetryStormOutcome,
  calculateScore: calculateRetryStormScore,
};

export const retryStormScenario = scenarioData;
