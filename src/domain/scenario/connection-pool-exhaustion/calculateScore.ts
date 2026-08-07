import type { IncidentState } from "@/domain/incident/types";
import { metricIds as ids } from "./data";

export function calculateConnectionPoolExhaustionScore(state: IncidentState): number {
  const { flags, completedActionIds, metrics } = state;
  let score = 0;
  if (flags.leakDetectionEnabled) score += 30;
  if (flags.concurrencyCapped) score += 30;
  if (flags.poolMetricsInspected) score += 15;
  if (flags.queryMetricsInspected) score += 10;
  if (metrics[ids.poolUtilization].value < 90) score += 10;
  if (!flags.trafficShed) score += 10;
  if (flags.poolResized) score -= 25;
  if (flags.workersRestarted && !flags.leakDetectionEnabled) score -= 10;
  if (completedActionIds.length > 5 && !flags.concurrencyCapped) score -= 10;
  return Math.max(0, Math.min(100, score));
}
