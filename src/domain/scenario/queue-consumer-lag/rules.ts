import type { IncidentAction, IncidentState } from "@/domain/incident/types";
import type { DerivedIncidentState, ScenarioActionEffect } from "../types";
import { deriveQueueConsumerLagMetrics } from "./deriveMetrics";
import { deriveQueueConsumerLagNodeStatuses } from "./deriveNodeStatuses";
import { deriveQueueConsumerLagTimelineEvents } from "./deriveTimelineEvents";

const flagByAction: Partial<Record<string, string>> = { "inspect-queue": "queueMetricsInspected", "inspect-consumers": "consumerMetricsInspected", "inspect-deployment": "deploymentInspected", "scale-consumers": "consumersScaled", "apply-backpressure": "backpressureApplied", "increase-batch-size": "batchSizeIncreased", "replay-retry-queue": "retryQueueReplayed", "pause-producers": "producersPaused" };
const hypothesesByAction: Partial<Record<string, string>> = { "inspect-queue": "Arrival rate exceeds consumer throughput", "inspect-consumers": "Consumer processing slowed after deployment", "inspect-deployment": "Batching change increased processing time" };

export function resolveQueueConsumerLagAction(state: IncidentState, action: IncidentAction): ScenarioActionEffect {
  const flag = flagByAction[action.id];
  const flags = flag ? { [flag]: true } : {};
  const hypothesis = hypothesesByAction[action.id];
  const next = { ...state, flags: { ...state.flags, ...flags } };
  return { flags, hypotheses: hypothesis ? [hypothesis] : [], events: deriveQueueConsumerLagTimelineEvents({ ...next, metrics: deriveQueueConsumerLagMetrics(next) }, action), message: action.consequence };
}

export function deriveQueueConsumerLagState(state: IncidentState): DerivedIncidentState {
  const metrics = deriveQueueConsumerLagMetrics(state);
  return { metrics, nodeStatuses: deriveQueueConsumerLagNodeStatuses({ ...state, metrics }) };
}
