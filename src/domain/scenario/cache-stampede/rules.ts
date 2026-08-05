import type { IncidentAction, IncidentState } from "@/domain/incident/types";
import type { DerivedIncidentState, ScenarioActionEffect } from "../types";
import { calculateCacheStampedeOutcome } from "./calculateOutcome";
import { deriveCacheStampedeMetrics } from "./deriveMetrics";
import { deriveCacheStampedeNodeStatuses } from "./deriveNodeStatuses";
import { deriveCacheStampedeTimelineEvents } from "./deriveTimelineEvents";

const flagByAction: Partial<Record<string, string>> = {
  "inspect-cache-metrics": "cacheMetricsInspected",
  "inspect-deployment": "deploymentInspected",
  "inspect-database-metrics": "databaseMetricsInspected",
  "warm-cache": "cacheWarmed",
  "enable-request-coalescing": "requestCoalescingEnabled",
  "throttle-catalog-traffic": "trafficThrottled",
  "rollback-deployment": "rollbackApplied",
};

const hypothesesByAction: Partial<Record<string, string>> = {
  "inspect-cache-metrics": "Cache key concentration is driving misses",
  "inspect-deployment": "A TTL change triggered the stampede",
  "inspect-database-metrics": "Database load is absorbing the misses",
};

export function resolveCacheStampedeAction(state: IncidentState, action: IncidentAction): ScenarioActionEffect {
  const flag = flagByAction[action.id];
  const flags = flag ? { [flag]: true } : {};
  const hypothesis = hypothesesByAction[action.id];
  const next = { ...state, flags: { ...state.flags, ...flags } };
  return { flags, hypotheses: hypothesis ? [hypothesis] : [], events: deriveCacheStampedeTimelineEvents({ ...next, metrics: deriveCacheStampedeMetrics(next) }, action), message: action.consequence };
}

export function deriveCacheStampedeState(state: IncidentState): DerivedIncidentState {
  const metrics = deriveCacheStampedeMetrics(state);
  return { metrics, nodeStatuses: deriveCacheStampedeNodeStatuses({ ...state, metrics }) };
}

export { calculateCacheStampedeOutcome };
