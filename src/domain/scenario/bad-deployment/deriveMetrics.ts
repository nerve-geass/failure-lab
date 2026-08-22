import type { IncidentState, Metric } from "@/domain/incident/types";
import { initialMetrics, metricIds as ids } from "./data";

export function deriveBadDeploymentMetrics(state: IncidentState): Record<string, Metric> {
  const elapsed = state.currentMinute;
  const mitigated = state.flags.featureDisabled || state.flags.exposureReduced;
  const rolledBack = state.flags.rollbackApplied;
  const compatibilityChecked = state.flags.schemaChecked;
  const canaryErrors = mitigated ? 2.1 : rolledBack && compatibilityChecked ? 1.4 : rolledBack ? 25 : Math.min(60, 18 + elapsed * 2.5);
  const aggregateErrors = mitigated ? 1.8 : rolledBack && compatibilityChecked ? 1.4 : rolledBack ? 7.8 : Math.min(22, 4.8 + elapsed * 0.8);
  const latency = mitigated ? 1.8 : rolledBack && compatibilityChecked ? 1.5 : rolledBack ? 4.2 : Math.min(8, 2.9 + elapsed * 0.3);
  const exposure = state.flags.exposureReduced || state.flags.featureDisabled || (rolledBack && compatibilityChecked) ? 0 : 25;
  return {
    ...initialMetrics,
    [ids.checkoutErrorRate]: { ...initialMetrics[ids.checkoutErrorRate], value: Number(aggregateErrors.toFixed(1)), trend: aggregateErrors < 4.8 ? "down" : "up", severity: aggregateErrors > 6 ? "critical" : aggregateErrors > 3 ? "warning" : "success" },
    [ids.checkoutLatencyP95]: { ...initialMetrics[ids.checkoutLatencyP95], value: Number(latency.toFixed(1)), trend: latency < 2.9 ? "down" : "up", severity: latency > 4 ? "critical" : latency > 2 ? "warning" : "success" },
    [ids.canaryErrorRate]: { ...initialMetrics[ids.canaryErrorRate], value: Number(canaryErrors.toFixed(1)), trend: canaryErrors < 18 ? "down" : "up", severity: canaryErrors > 20 ? "critical" : canaryErrors > 5 ? "warning" : "success" },
    [ids.rolloutExposure]: { ...initialMetrics[ids.rolloutExposure], value: exposure, trend: exposure < 25 ? "down" : "flat", severity: exposure === 0 ? "success" : "warning" },
  };
}
