import { metricIds } from "@/domain/incident/constants";
import type { IncidentState, Metric } from "@/domain/incident/types";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function deriveRetryStormMetrics(state: IncidentState, initialMetrics: Record<string, Metric>): Record<string, Metric> {
  const { flags, currentMinute } = state;
  const elapsedPressure = Math.max(0, currentMinute - 2);
  const stormMultiplier = flags.workersScaled ? 1.35 : 1;
  const rollbackMultiplier = flags.rollbackApplied ? 0.68 : 1;
  const pressure = elapsedPressure * stormMultiplier * rollbackMultiplier;
  const protectedTraffic = flags.retriesDisabled || flags.trafficPaused;

  const queueDepth = flags.trafficPaused
    ? Math.max(180, 1240 - currentMinute * 180)
    : protectedTraffic
      ? Math.max(420, 1240 - currentMinute * 70)
      : 1240 + pressure * 1450;
  const retryRate = flags.trafficPaused ? 0 : flags.retriesDisabled ? 40 : 320 + pressure * 58;
  const openConnections = flags.trafficPaused
    ? 36
    : flags.retriesDisabled
      ? Math.max(38, 68 - currentMinute * 3)
      : clamp(68 + pressure * 6, 0, 100);
  const timeoutRate = flags.circuitBreakerEnabled ? 18 : flags.providerTracesInspected ? 9 : 6;
  const successRate = flags.trafficPaused ? 0 : flags.circuitBreakerEnabled ? 84 : clamp(94 - pressure * 1.7, 24, 94);
  const latency = flags.trafficPaused ? 0.2 : flags.circuitBreakerEnabled ? 1.3 : Number((1.8 + queueDepth / 4200).toFixed(1));

  return {
    ...initialMetrics,
    [metricIds.paymentSuccessRate]: { ...initialMetrics[metricIds.paymentSuccessRate], value: Number(successRate.toFixed(1)), trend: successRate < 90 ? "down" : "flat", severity: successRate < 70 ? "critical" : "warning" },
    [metricIds.checkoutLatency]: { ...initialMetrics[metricIds.checkoutLatency], value: latency, trend: latency > 2 ? "up" : "down", severity: latency > 5 ? "critical" : "warning" },
    [metricIds.paymentCpu]: { ...initialMetrics[metricIds.paymentCpu], value: flags.workersScaled ? 72 : 43, trend: flags.workersScaled ? "up" : "flat", severity: flags.workersScaled ? "warning" : "info" },
    [metricIds.paymentMemory]: { ...initialMetrics[metricIds.paymentMemory], value: flags.workersScaled ? 64 : 51, trend: flags.workersScaled ? "up" : "flat", severity: "info" },
    [metricIds.queueDepth]: { ...initialMetrics[metricIds.queueDepth], value: Math.round(queueDepth), trend: queueDepth > 1240 ? "up" : "down", severity: queueDepth > 20000 ? "critical" : queueDepth > 5000 ? "warning" : "info" },
    [metricIds.providerTimeoutRate]: { ...initialMetrics[metricIds.providerTimeoutRate], value: timeoutRate, trend: flags.circuitBreakerEnabled ? "down" : "up", severity: flags.circuitBreakerEnabled ? "success" : "warning" },
    [metricIds.retryRate]: { ...initialMetrics[metricIds.retryRate], value: Math.round(retryRate), trend: retryRate > 320 ? "up" : "down", severity: retryRate > 700 ? "critical" : "warning" },
    [metricIds.openConnections]: { ...initialMetrics[metricIds.openConnections], value: Math.round(openConnections), trend: openConnections > 68 ? "up" : "down", severity: openConnections >= 100 ? "critical" : openConnections > 85 ? "warning" : "success" },
  };
}
