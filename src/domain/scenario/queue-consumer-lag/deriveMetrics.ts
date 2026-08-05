import type { IncidentState, Metric } from "@/domain/incident/types";
import { initialMetrics, metricIds as ids } from "./data";

export function deriveQueueConsumerLagMetrics(state: IncidentState): Record<string, Metric> {
  const elapsed = state.currentMinute;
  const scaled = state.flags.consumersScaled;
  const backpressure = state.flags.backpressureApplied;
  const paused = state.flags.producersPaused;
  const replayed = state.flags.retryQueueReplayed;
  const batchIncreased = state.flags.batchSizeIncreased;
  const queueDepth = paused ? 900 : Math.max(240, 4200 + elapsed * 1600 + (replayed ? 5000 : 0) + (batchIncreased ? 3000 : 0) - (scaled ? 5000 : 0) - (backpressure ? 6000 : 0));
  const lag = paused ? 8 : Math.max(4, 38 + elapsed * 12 + (replayed ? 30 : 0) + (batchIncreased ? 24 : 0) - (scaled ? 42 : 0) - (backpressure ? 36 : 0));
  const throughput = paused ? 0 : 5200 + (scaled ? 1800 : 0) + (backpressure ? 600 : 0) - (batchIncreased ? 700 : 0);
  const producerRate = paused ? 0 : backpressure ? 3200 : 5600;
  const retryDepth = Math.max(80, 380 + (replayed ? 900 : 0) - (scaled ? 160 : 0));
  const databaseLatency = Math.max(120, 220 + elapsed * 18 + (batchIncreased ? 180 : 0) + (replayed ? 80 : 0) - (scaled ? 50 : 0) - (backpressure ? 60 : 0));
  return {
    ...initialMetrics,
    [ids.queueDepth]: { ...initialMetrics[ids.queueDepth], value: Math.round(queueDepth), trend: queueDepth < 4200 ? "down" : "up", severity: queueDepth >= 20000 ? "critical" : queueDepth > 8000 ? "warning" : "success" },
    [ids.consumerLag]: { ...initialMetrics[ids.consumerLag], value: Math.round(lag), trend: lag < 38 ? "down" : "up", severity: lag > 180 ? "critical" : "warning" },
    [ids.consumerThroughput]: { ...initialMetrics[ids.consumerThroughput], value: Math.round(throughput), trend: throughput > 5200 ? "up" : "down", severity: throughput > 6000 ? "success" : "warning" },
    [ids.producerRate]: { ...initialMetrics[ids.producerRate], value: producerRate, trend: producerRate < 5600 ? "down" : "flat", severity: paused ? "warning" : "info" },
    [ids.retryQueueDepth]: { ...initialMetrics[ids.retryQueueDepth], value: retryDepth, trend: retryDepth > 380 ? "up" : "down", severity: retryDepth > 1000 ? "critical" : "warning" },
    [ids.databaseLatency]: { ...initialMetrics[ids.databaseLatency], value: Math.round(databaseLatency), trend: databaseLatency < 220 ? "down" : "up", severity: databaseLatency > 500 ? "critical" : "warning" },
  };
}
