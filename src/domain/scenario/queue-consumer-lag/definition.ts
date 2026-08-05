import type { ScenarioDefinition } from "../types";
import { calculateQueueConsumerLagOutcome } from "./calculateOutcome";
import { calculateQueueConsumerLagScore } from "./calculateScore";
import { actions, connections, initialEvent, initialMetrics, initialStatuses, nodes } from "./data";
import { deriveQueueConsumerLagState, resolveQueueConsumerLagAction } from "./rules";

const initialFlags = { queueMetricsInspected: false, consumerMetricsInspected: false, deploymentInspected: false, consumersScaled: false, backpressureApplied: false, batchSizeIncreased: false, retryQueueReplayed: false, producersPaused: false, rollbackApplied: false };

export const queueConsumerLagDefinition: ScenarioDefinition = {
  id: "queue-consumer-lag",
  title: "Queue Consumer Lag",
  summary: "Message arrival outpaces consumers and operational delay quietly compounds.",
  nodes,
  connections,
  actions,
  concepts: ["Throughput", "Backpressure", "Consumer lag", "Autoscaling", "Retry queues", "Queue saturation"],
  prerequisitePolicy: "hard",
  content: {
    startMinute: 663,
    durationMinutes: 9,
    difficulty: "Beginner",
    impact: { metricId: "queueDepth", growingAt: 8000, highAt: 15000, severeFlag: "producersPaused" },
    topologyNote: "Queue pressure grows as producers outpace consumers",
    briefing: { eyebrow: "Incident briefing", title: "A quiet lag becomes a backlog crisis.", description: "At 11:03, event producers continue at a normal rate while a consumer deployment processes fewer messages. The queue grows quietly until order updates begin to fall behind.", objective: "Restore sustainable throughput before lag spreads into customer-visible delays.", capability: "Compare arrival and processing rates, then choose scaling or backpressure deliberately.", learning: "Why throughput, backpressure, and retry queues determine whether a backlog recovers or compounds." },
    report: { rootCauseTitle: "Consumer throughput regression", rootCauseDescription: "A batching change increased processing time per event. Producers stayed steady, so the consumer group fell behind and queue lag compounded.", bestIntervention: "Before queue depth exceeds 12,000 messages", missedOpportunities: [{ flag: "consumersScaled", label: "Scale consumers" }, { flag: "backpressureApplied", label: "Apply backpressure" }, { flag: "consumerMetricsInspected", label: "Inspect consumer metrics" }] },
    outcomeMessages: {
      "excellent-containment": { eyebrow: "Excellent containment", title: "The backlog is recovering.", body: "You increased sustainable throughput and applied backpressure before lag spread into order processing.", tone: "text-emerald-300" },
      "partial-recovery": { eyebrow: "Partial recovery", title: "The queue is slowing, not safe yet.", body: "You reduced pressure, but the system still needs a sustainable throughput margin.", tone: "text-amber-200" },
      "emergency-containment": { eyebrow: "Emergency containment", title: "The backlog stopped growing at a customer cost.", body: "Pausing producers protected the queue and delayed new updates.", tone: "text-amber-200" },
      "major-outage": { eyebrow: "Major outage", title: "The backlog became the incident.", body: "Queue lag exhausted processing headroom and order updates could no longer keep up.", tone: "text-red-300" },
    },
  },
  createInitialState: () => ({ scenarioId: "queue-consumer-lag", currentMinute: 0, actionPoints: 6, flags: { ...initialFlags }, metrics: structuredClone(initialMetrics), nodeStatuses: { ...initialStatuses }, completedActionIds: [], hypotheses: [], timeline: [structuredClone(initialEvent)], status: "active" }),
  resolveAction: resolveQueueConsumerLagAction,
  deriveState: deriveQueueConsumerLagState,
  calculateOutcome: calculateQueueConsumerLagOutcome,
  calculateScore: calculateQueueConsumerLagScore,
};
