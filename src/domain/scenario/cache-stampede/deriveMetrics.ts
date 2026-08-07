import type { IncidentState, Metric } from "@/domain/incident/types";
import { cacheStampedeMetricIds as ids, defaultRuntime, type CacheStampedeRuntime } from "./data";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function deriveCacheStampedeMetrics(state: IncidentState, runtime: CacheStampedeRuntime = defaultRuntime): Record<string, Metric> {
  const base = runtime.parameters;
  const elapsed = state.currentMinute;
  const pressure = elapsed * base.pressureMultiplier;
  const throttled = state.flags.trafficThrottled;
  const protectedReads = state.flags.cacheWarmed || state.flags.requestCoalescingEnabled;
  const connections = throttled ? 30 : clamp(base.databaseConnections + pressure - (state.flags.cacheWarmed ? 28 : 0) - (state.flags.requestCoalescingEnabled ? 18 : 0), 25, 100);
  const databaseLatency = throttled ? 95 : Math.max(80, base.databaseLatency + elapsed * 45 - (state.flags.cacheWarmed ? 90 : 0) - (state.flags.requestCoalescingEnabled ? 70 : 0));
  const cacheHitRate = throttled ? 84 : protectedReads ? 94 : Math.max(32, base.cacheHitRate - elapsed * 3);
  const cacheMisses = throttled ? 420 : protectedReads ? 180 : base.cacheMisses + elapsed * 650;
  const checkoutLatency = throttled ? 2.1 : Number((1.6 + databaseLatency / 1000).toFixed(1));

  return {
    ...runtime.initialMetrics,
    [ids.cacheHitRate]: { ...runtime.initialMetrics[ids.cacheHitRate], value: cacheHitRate, trend: cacheHitRate > 80 ? "up" : "down", severity: cacheHitRate < 50 ? "critical" : "warning" },
    [ids.databaseLatency]: { ...runtime.initialMetrics[ids.databaseLatency], value: Math.round(databaseLatency), trend: databaseLatency < base.databaseLatency ? "down" : "up", severity: databaseLatency > 500 ? "critical" : "warning" },
    [ids.databaseConnections]: { ...runtime.initialMetrics[ids.databaseConnections], value: Math.round(connections), trend: connections < base.databaseConnections ? "down" : "up", severity: connections >= 100 ? "critical" : connections > 85 ? "warning" : "success" },
    [ids.checkoutLatency]: { ...runtime.initialMetrics[ids.checkoutLatency], value: checkoutLatency, trend: checkoutLatency < 2 ? "down" : "up", severity: checkoutLatency > 4 ? "critical" : "warning" },
    [ids.requestRate]: { ...runtime.initialMetrics[ids.requestRate], value: throttled ? base.requestRate * 0.5 : base.requestRate, trend: throttled ? "down" : "flat", severity: throttled ? "warning" : "info" },
    [ids.cacheMisses]: { ...runtime.initialMetrics[ids.cacheMisses], value: Math.round(cacheMisses), trend: cacheMisses < base.cacheMisses ? "down" : "up", severity: cacheMisses > 4000 ? "critical" : "warning" },
  };
}
