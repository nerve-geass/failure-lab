import type { IncidentState, OutcomeId } from "@/domain/incident/types";
import { cacheStampedeMetricIds as ids } from "./data";

export function calculateCacheStampedeOutcome(state: IncidentState): OutcomeId | undefined {
  if (state.flags.trafficThrottled) return "emergency-containment";
  if (state.metrics[ids.databaseConnections].value >= 100 || state.metrics[ids.databaseLatency].value > 700) return "major-outage";
  if (state.flags.cacheWarmed && state.flags.requestCoalescingEnabled && state.metrics[ids.databaseConnections].value < 90) return "excellent-containment";
  if (state.flags.cacheWarmed || state.flags.requestCoalescingEnabled || state.flags.rollbackApplied) return "partial-recovery";
  return undefined;
}
