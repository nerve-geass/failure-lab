import type { IncidentAction, IncidentEvent, IncidentState } from "@/domain/incident/types";

export function deriveRetryStormTimelineEvents(state: IncidentState, action: IncidentAction): IncidentEvent[] {
  const events: IncidentEvent[] = [{
    id: `${action.id}-${state.currentMinute}`,
    minute: state.currentMinute,
    title: action.title,
    description: action.consequence,
    severity: action.id === "disable-retries" || action.id === "enable-circuit-breaker" ? "success" : "info",
    relatedNodeIds: [],
  }];

  if (state.metrics.openConnections.value >= 90) {
    events.push({ id: `connection-pool-warning-${state.currentMinute}`, minute: state.currentMinute, title: "Connection pool pressure is critical", description: "Shared payment connections are nearing exhaustion.", severity: "critical", relatedNodeIds: ["payment-orchestrator"] });
  }
  if (state.metrics.queueDepth.value > 10000) {
    events.push({ id: `queue-saturation-${state.currentMinute}`, minute: state.currentMinute, title: "Queue saturation spreads delay", description: "Order processing is now critically delayed.", severity: "critical", relatedNodeIds: ["event-queue", "order-service"] });
  }
  return events;
}
