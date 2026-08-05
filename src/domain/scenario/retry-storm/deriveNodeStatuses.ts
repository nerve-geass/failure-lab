import { metricIds, nodeIds } from "@/domain/incident/constants";
import type { IncidentState, NodeStatus } from "@/domain/incident/types";

export function deriveRetryStormNodeStatuses(state: IncidentState): Record<string, NodeStatus> {
  const { flags, metrics } = state;
  const queue = metrics[metricIds.queueDepth].value;
  const connections = metrics[metricIds.openConnections].value;
  const outage = connections >= 100 || queue > 20000;

  return {
    [nodeIds.webCheckout]: outage ? "critical" : flags.trafficPaused ? "isolated" : "healthy",
    [nodeIds.checkoutApi]: outage ? "critical" : metrics[metricIds.checkoutLatency].value > 3 ? "warning" : "healthy",
    [nodeIds.paymentOrchestrator]: outage ? "critical" : flags.retriesDisabled ? "recovering" : "warning",
    [nodeIds.paymentProvider]: flags.circuitBreakerEnabled ? "isolated" : "warning",
    [nodeIds.eventQueue]: queue > 20000 ? "critical" : queue > 5000 ? "warning" : flags.retriesDisabled ? "recovering" : "warning",
    [nodeIds.orderService]: outage ? "warning" : "healthy",
    [nodeIds.database]: outage ? "warning" : "healthy",
  };
}
