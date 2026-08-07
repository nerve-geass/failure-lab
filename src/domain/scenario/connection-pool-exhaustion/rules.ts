import type { IncidentAction, IncidentState } from "@/domain/incident/types";
import type { DerivedIncidentState, ScenarioActionEffect } from "../types";
import { deriveConnectionPoolExhaustionMetrics } from "./deriveMetrics";
import { deriveConnectionPoolExhaustionNodeStatuses } from "./deriveNodeStatuses";
import { deriveConnectionPoolExhaustionTimelineEvents } from "./deriveTimelineEvents";

const flagByAction: Partial<Record<string, string>> = { "inspect-pool": "poolMetricsInspected", "inspect-query": "queryMetricsInspected", "inspect-deployment": "deploymentInspected", "enable-leak-detection": "leakDetectionEnabled", "cap-concurrency": "concurrencyCapped", "restart-workers": "workersRestarted", "increase-pool-size": "poolResized", "tune-queries": "queriesTuned", "rollback-deployment": "rollbackApplied", "shed-traffic": "trafficShed" };
const hypothesesByAction: Partial<Record<string, string>> = { "inspect-pool": "The shared pool is the bottleneck", "inspect-query": "Slow queries are holding connections", "inspect-deployment": "A connection lifecycle leak shipped recently" };
export function resolveConnectionPoolExhaustionAction(state: IncidentState, action: IncidentAction): ScenarioActionEffect {
  const flag = flagByAction[action.id];
  const flags = flag ? { [flag]: true } : {};
  const hypothesis = hypothesesByAction[action.id];
  const next = { ...state, flags: { ...state.flags, ...flags } };
  return { flags, hypotheses: hypothesis ? [hypothesis] : [], events: deriveConnectionPoolExhaustionTimelineEvents({ ...next, metrics: deriveConnectionPoolExhaustionMetrics(next) }, action), message: action.consequence };
}
export function deriveConnectionPoolExhaustionState(state: IncidentState): DerivedIncidentState {
  const metrics = deriveConnectionPoolExhaustionMetrics(state);
  return { metrics, nodeStatuses: deriveConnectionPoolExhaustionNodeStatuses({ ...state, metrics }) };
}
