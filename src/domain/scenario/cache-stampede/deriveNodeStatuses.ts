import type { IncidentState, NodeStatus } from "@/domain/incident/types";
import { cacheStampedeMetricIds as ids, cacheStampedeNodeIds as nodes } from "./data";

export function deriveCacheStampedeNodeStatuses(state: IncidentState): Record<string, NodeStatus> {
  const connections = state.metrics[ids.databaseConnections].value;
  const latency = state.metrics[ids.databaseLatency].value;
  const outage = connections >= 100 || latency > 700;
  return {
    [nodes.webCheckout]: outage ? "critical" : state.flags.trafficThrottled ? "isolated" : "healthy",
    [nodes.checkoutApi]: outage ? "critical" : latency > 300 ? "warning" : "healthy",
    [nodes.productCache]: state.flags.cacheWarmed || state.flags.requestCoalescingEnabled ? "recovering" : "critical",
    [nodes.catalogApi]: outage ? "critical" : state.flags.trafficThrottled ? "isolated" : "warning",
    [nodes.database]: outage ? "critical" : connections > 85 ? "warning" : "recovering",
    [nodes.inventoryService]: outage ? "warning" : "healthy",
    [nodes.recommendationService]: outage ? "warning" : "healthy",
  };
}
