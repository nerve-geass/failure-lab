import type { IncidentState, NodeStatus } from "@/domain/incident/types";
import { metricIds as ids, nodeIds } from "./data";

export function deriveConnectionPoolExhaustionNodeStatuses(state: IncidentState): Record<string, NodeStatus> {
  const utilization = state.metrics[ids.poolUtilization].value;
  const wait = state.metrics[ids.poolWait].value;
  const outage = utilization >= 100 || wait > 1600;
  return { [nodeIds.webCheckout]: outage ? "critical" : "warning", [nodeIds.checkoutApi]: outage ? "critical" : "warning", [nodeIds.workerPool]: outage ? "critical" : state.flags.concurrencyCapped ? "recovering" : "warning", [nodeIds.connectionPool]: outage ? "critical" : utilization > 85 ? "warning" : "recovering", [nodeIds.queryService]: outage ? "critical" : "warning", [nodeIds.database]: outage ? "critical" : "warning", [nodeIds.telemetry]: state.flags.leakDetectionEnabled ? "recovering" : "healthy" };
}
