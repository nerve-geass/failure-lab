import type { IncidentState } from "@/domain/incident/types";
import { cacheStampedeMetricIds as ids } from "./data";

export function calculateCacheStampedeScore(state: IncidentState): number {
  const { flags, completedActionIds, metrics } = state;
  let score = 0;
  if (flags.cacheWarmed) score += 30;
  if (flags.requestCoalescingEnabled) score += 30;
  if (flags.cacheMetricsInspected) score += 15;
  if (flags.deploymentInspected) score += 10;
  if (metrics[ids.databaseConnections].value < 90) score += 10;
  if (!flags.trafficThrottled) score += 10;
  if (flags.trafficThrottled) score -= 20;
  if (completedActionIds.length > 4 && !flags.requestCoalescingEnabled) score -= 10;
  return Math.max(0, Math.min(100, score));
}
