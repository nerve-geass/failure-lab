import type { IncidentAction, IncidentEvent, IncidentState } from "@/domain/incident/types";
import { nodeIds } from "./data";

export function deriveQueueConsumerLagTimelineEvents(state: IncidentState, action: IncidentAction): IncidentEvent[] {
  const events: IncidentEvent[] = [{ id: `${action.id}-${state.currentMinute}`, minute: state.currentMinute, title: action.title, description: action.consequence, severity: action.id === "scale-consumers" || action.id === "apply-backpressure" ? "success" : "info", relatedNodeIds: [] }];
  if (state.metrics.queueDepth.value >= 10000) events.push({ id: `queue-lag-warning-${state.currentMinute}`, minute: state.currentMinute, title: "Queue lag is spreading", description: "Order updates are waiting behind an increasingly old backlog.", severity: "critical", relatedNodeIds: [nodeIds.eventQueue, nodeIds.orderService] });
  if (state.metrics.retryQueueDepth.value > 1000) events.push({ id: `retry-replay-warning-${state.currentMinute}`, minute: state.currentMinute, title: "Retry queue replay adds pressure", description: "Failed events are competing with fresh work for the same consumers.", severity: "critical", relatedNodeIds: [nodeIds.retryQueue, nodeIds.consumerGroup] });
  return events;
}
