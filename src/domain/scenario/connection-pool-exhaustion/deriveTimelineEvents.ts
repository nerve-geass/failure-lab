import type { IncidentAction, IncidentEvent, IncidentState } from "@/domain/incident/types";
import { nodeIds } from "./data";

export function deriveConnectionPoolExhaustionTimelineEvents(state: IncidentState, action: IncidentAction): IncidentEvent[] {
  const events: IncidentEvent[] = [{ id: `${action.id}-${state.currentMinute}`, minute: state.currentMinute, title: action.title, description: action.consequence, severity: action.id === "enable-leak-detection" || action.id === "cap-concurrency" ? "success" : "info", relatedNodeIds: [] }];
  if (state.metrics.poolUtilization.value >= 90) events.push({ id: `pool-warning-${state.currentMinute}`, minute: state.currentMinute, title: "Connection pool is nearing exhaustion", description: "Workers are waiting for scarce connections and checkout latency is spreading.", severity: "critical", relatedNodeIds: [nodeIds.connectionPool, nodeIds.workerPool] });
  if (state.metrics.leakedConnections.value > 1) events.push({ id: `connection-leak-${state.currentMinute}`, minute: state.currentMinute, title: "Leaked connections accumulate", description: "Restarting workers may clear symptoms, but the lifecycle leak remains active.", severity: "critical", relatedNodeIds: [nodeIds.connectionPool, nodeIds.telemetry] });
  return events;
}
