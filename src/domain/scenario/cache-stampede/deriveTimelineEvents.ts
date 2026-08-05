import type { IncidentAction, IncidentEvent, IncidentState } from "@/domain/incident/types";
import { cacheStampedeNodeIds as nodes } from "./data";

export function deriveCacheStampedeTimelineEvents(state: IncidentState, action: IncidentAction): IncidentEvent[] {
  const events: IncidentEvent[] = [{ id: `${action.id}-${state.currentMinute}`, minute: state.currentMinute, title: action.title, description: action.consequence, severity: action.id === "warm-cache" || action.id === "enable-request-coalescing" ? "success" : "info", relatedNodeIds: [] }];
  if (state.metrics.databaseConnections.value >= 90) events.push({ id: `database-pool-warning-${state.currentMinute}`, minute: state.currentMinute, title: "Database connections are nearing exhaustion", description: "The cache miss burst is consuming shared database capacity.", severity: "critical", relatedNodeIds: [nodes.database] });
  if (state.metrics.cacheMisses.value > 3000) events.push({ id: `cache-stampede-${state.currentMinute}`, minute: state.currentMinute, title: "Cache stampede accelerates", description: "Concurrent misses are multiplying database reads.", severity: "critical", relatedNodeIds: [nodes.productCache, nodes.database] });
  return events;
}
