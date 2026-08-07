import type { IncidentState, Metric } from "@/domain/incident/types";
import { initialMetrics, metricIds as ids } from "./data";

export function deriveConnectionPoolExhaustionMetrics(state: IncidentState): Record<string, Metric> {
  const elapsed = state.currentMinute;
  const shed = state.flags.trafficShed;
  const leakDetection = state.flags.leakDetectionEnabled;
  const concurrencyCapped = state.flags.concurrencyCapped;
  const restarted = state.flags.workersRestarted;
  const poolResized = state.flags.poolResized;
  const queriesTuned = state.flags.queriesTuned;
  const rolledBack = state.flags.rollbackApplied;
  const utilization = shed ? 34 : Math.min(100, 74 + elapsed * 6 + (poolResized ? 18 : 0) - (concurrencyCapped ? 26 : 0) - (restarted ? 16 : 0) - (queriesTuned ? 14 : 0) - (rolledBack ? 10 : 0) - (leakDetection ? 8 : 0));
  const leaked = shed ? 0.2 : Math.max(0.1, 0.8 + elapsed * 0.2 - (leakDetection ? 0.7 : 0) - (rolledBack ? 0.4 : 0));
  const poolWait = shed ? 90 : Math.max(40, 420 + elapsed * 100 + (poolResized ? 140 : 0) - (concurrencyCapped ? 260 : 0) - (restarted ? 150 : 0) - (queriesTuned ? 180 : 0) - (leakDetection ? 80 : 0));
  const queryLatency = Math.max(90, 180 + elapsed * 20 + (poolResized ? 160 : 0) - (queriesTuned ? 80 : 0));
  const checkoutLatency = shed ? 1.2 : Number((2.1 + poolWait / 1000).toFixed(1));
  const errors = shed ? 1.1 : Math.max(0.4, 3.2 + (utilization - 74) * 0.18);
  return {
    ...initialMetrics,
    [ids.poolUtilization]: { ...initialMetrics[ids.poolUtilization], value: Math.round(utilization), trend: utilization < 74 ? "down" : "up", severity: utilization >= 100 ? "critical" : utilization > 85 ? "warning" : "success" },
    [ids.poolWait]: { ...initialMetrics[ids.poolWait], value: Math.round(poolWait), trend: poolWait < 420 ? "down" : "up", severity: poolWait > 1000 ? "critical" : "warning" },
    [ids.checkoutLatency]: { ...initialMetrics[ids.checkoutLatency], value: checkoutLatency, trend: checkoutLatency < 2.4 ? "down" : "up", severity: checkoutLatency > 4 ? "critical" : "warning" },
    [ids.queryLatency]: { ...initialMetrics[ids.queryLatency], value: Math.round(queryLatency), trend: queryLatency < 180 ? "down" : "up", severity: queryLatency > 500 ? "critical" : "warning" },
    [ids.activeWorkers]: { ...initialMetrics[ids.activeWorkers], value: 48, trend: "flat", severity: "info" },
    [ids.leakedConnections]: { ...initialMetrics[ids.leakedConnections], value: Number(leaked.toFixed(1)), trend: leaked < 0.8 ? "down" : "up", severity: leaked > 1 ? "critical" : "warning" },
    [ids.errorRate]: { ...initialMetrics[ids.errorRate], value: Number(errors.toFixed(1)), trend: errors < 3.2 ? "down" : "up", severity: errors > 6 ? "critical" : "warning" },
  };
}
