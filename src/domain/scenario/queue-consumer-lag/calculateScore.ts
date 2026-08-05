import type { IncidentState } from "@/domain/incident/types";
import { metricIds as ids } from "./data";

export function calculateQueueConsumerLagScore(state: IncidentState): number {
  const { flags, completedActionIds, metrics } = state;
  let score = 0;
  if (flags.consumersScaled) score += 30;
  if (flags.backpressureApplied) score += 30;
  if (flags.queueMetricsInspected) score += 15;
  if (flags.consumerMetricsInspected) score += 10;
  if (metrics[ids.queueDepth].value < 12000) score += 10;
  if (!flags.producersPaused) score += 10;
  if (flags.retryQueueReplayed) score -= 20;
  if (flags.batchSizeIncreased && !flags.consumersScaled) score -= 15;
  if (completedActionIds.length > 5 && !flags.backpressureApplied) score -= 10;
  return Math.max(0, Math.min(100, score));
}
