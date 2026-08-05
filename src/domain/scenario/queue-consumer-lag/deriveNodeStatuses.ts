import type { IncidentState, NodeStatus } from "@/domain/incident/types";
import { metricIds as ids, nodeIds } from "./data";

export function deriveQueueConsumerLagNodeStatuses(state: IncidentState): Record<string, NodeStatus> {
  const queue = state.metrics[ids.queueDepth].value;
  const lag = state.metrics[ids.consumerLag].value;
  const outage = queue >= 20000 || lag > 180;
  return { [nodeIds.webCheckout]: outage ? "warning" : "healthy", [nodeIds.eventQueue]: outage ? "critical" : queue > 8000 ? "warning" : "recovering", [nodeIds.consumerGroup]: outage ? "critical" : state.flags.consumersScaled ? "recovering" : "warning", [nodeIds.retryQueue]: outage ? "critical" : "warning", [nodeIds.orderService]: outage ? "critical" : "warning", [nodeIds.database]: outage ? "critical" : "warning", [nodeIds.producer]: state.flags.producersPaused ? "isolated" : "healthy" };
}
