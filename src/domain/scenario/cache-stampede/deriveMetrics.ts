import type { IncidentState, Metric } from "@/domain/incident/types";
import { cacheStampedeMetricIds as ids, initialMetrics } from "./data";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function deriveCacheStampedeMetrics(state: IncidentState): Record<string, Metric> {
  const elapsed = state.currentMinute;
  const pressure = elapsed * 8;
  const throttled = state.flags.trafficThrottled;
  const protectedReads = state.flags.cacheWarmed || state.flags.requestCoalescingEnabled;
  const connections = throttled ? 30 : clamp(62 + pressure - (state.flags.cacheWarmed ? 28 : 0) - (state.flags.requestCoalescingEnabled ? 18 : 0), 25, 100);
  const databaseLatency = throttled ? 95 : Math.max(80, 180 + elapsed * 45 - (state.flags.cacheWarmed ? 90 : 0) - (state.flags.requestCoalescingEnabled ? 70 : 0));
  const cacheHitRate = throttled ? 84 : protectedReads ? 94 : Math.max(32, 71 - elapsed * 3);
  const cacheMisses = throttled ? 420 : protectedReads ? 180 : 1390 + elapsed * 650;
  const checkoutLatency = throttled ? 2.1 : Number((1.6 + databaseLatency / 1000).toFixed(1));

  return {
    ...initialMetrics,
    [ids.cacheHitRate]: { ...initialMetrics[ids.cacheHitRate], value: cacheHitRate, trend: cacheHitRate > 80 ? "up" : "down", severity: cacheHitRate < 50 ? "critical" : "warning" },
    [ids.databaseLatency]: { ...initialMetrics[ids.databaseLatency], value: Math.round(databaseLatency), trend: databaseLatency < 180 ? "down" : "up", severity: databaseLatency > 500 ? "critical" : "warning" },
    [ids.databaseConnections]: { ...initialMetrics[ids.databaseConnections], value: Math.round(connections), trend: connections < 62 ? "down" : "up", severity: connections >= 100 ? "critical" : connections > 85 ? "warning" : "success" },
    [ids.checkoutLatency]: { ...initialMetrics[ids.checkoutLatency], value: checkoutLatency, trend: checkoutLatency < 2 ? "down" : "up", severity: checkoutLatency > 4 ? "critical" : "warning" },
    [ids.requestRate]: { ...initialMetrics[ids.requestRate], value: throttled ? 2400 : 4800, trend: throttled ? "down" : "flat", severity: throttled ? "warning" : "info" },
    [ids.cacheMisses]: { ...initialMetrics[ids.cacheMisses], value: Math.round(cacheMisses), trend: cacheMisses < 1390 ? "down" : "up", severity: cacheMisses > 4000 ? "critical" : "warning" },
  };
}
