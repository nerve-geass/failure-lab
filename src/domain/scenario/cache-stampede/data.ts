import type { IncidentAction, IncidentEvent, Metric, NodeStatus, SystemNode } from "@/domain/incident/types";

export const cacheStampedeMetricIds = {
  cacheHitRate: "cacheHitRate",
  databaseLatency: "databaseLatency",
  databaseConnections: "databaseConnections",
  checkoutLatency: "checkoutLatency",
  requestRate: "requestRate",
  cacheMisses: "cacheMisses",
} as const;

export const cacheStampedeNodeIds = {
  webCheckout: "web-checkout",
  checkoutApi: "checkout-api",
  productCache: "product-cache",
  catalogApi: "catalog-api",
  database: "database",
  inventoryService: "inventory-service",
  recommendationService: "recommendation-service",
} as const;

const metric = (id: string, label: string, value: number, unit: string, severity: Metric["severity"], explanation: string): Metric => ({ id, label, value, unit, trend: "flat", severity, explanation });

export type CacheStampedeParameters = {
  startMinute: number;
  cacheHitRate: number;
  databaseLatency: number;
  databaseConnections: number;
  requestRate: number;
  cacheMisses: number;
  pressureMultiplier: number;
};

export type CacheStampedeRuntime = {
  parameters: CacheStampedeParameters;
  initialMetrics: Record<string, Metric>;
};

export const defaultParameters: CacheStampedeParameters = {
  startMinute: 34,
  cacheHitRate: 71,
  databaseLatency: 180,
  databaseConnections: 62,
  requestRate: 4800,
  cacheMisses: 1390,
  pressureMultiplier: 8,
};

export function createInitialMetrics(parameters: CacheStampedeParameters = defaultParameters): Record<string, Metric> {
  return {
    [cacheStampedeMetricIds.cacheHitRate]: metric(cacheStampedeMetricIds.cacheHitRate, "Cache hit rate", parameters.cacheHitRate, "%", "warning", "A popular key is missing more often than expected."),
    [cacheStampedeMetricIds.databaseLatency]: metric(cacheStampedeMetricIds.databaseLatency, "Database query latency", parameters.databaseLatency, "ms", "warning", "The database is absorbing the cache misses."),
    [cacheStampedeMetricIds.databaseConnections]: metric(cacheStampedeMetricIds.databaseConnections, "Database connections", parameters.databaseConnections, "%", "warning", "Shared database capacity is the main risk."),
    [cacheStampedeMetricIds.checkoutLatency]: metric(cacheStampedeMetricIds.checkoutLatency, "Checkout latency p95", 1.6, "s", "warning", "Customer latency is rising but has not yet spread everywhere."),
    [cacheStampedeMetricIds.requestRate]: metric(cacheStampedeMetricIds.requestRate, "Catalog request rate", parameters.requestRate, "/min", "info", "Traffic volume is normal for this time of day."),
    [cacheStampedeMetricIds.cacheMisses]: metric(cacheStampedeMetricIds.cacheMisses, "Cache misses", parameters.cacheMisses, "/min", "critical", "Misses are concentrated on one popular product key."),
  };
}

export const initialMetrics = createInitialMetrics();
export const defaultRuntime: CacheStampedeRuntime = { parameters: defaultParameters, initialMetrics };

export const nodes: Record<string, SystemNode> = {
  [cacheStampedeNodeIds.webCheckout]: { id: cacheStampedeNodeIds.webCheckout, name: "Web Checkout", description: "Customer-facing shopping flow." },
  [cacheStampedeNodeIds.checkoutApi]: { id: cacheStampedeNodeIds.checkoutApi, name: "Checkout API", description: "Coordinates customer and catalog requests." },
  [cacheStampedeNodeIds.productCache]: { id: cacheStampedeNodeIds.productCache, name: "Product Cache", description: "Stores hot product and catalog responses." },
  [cacheStampedeNodeIds.catalogApi]: { id: cacheStampedeNodeIds.catalogApi, name: "Catalog API", description: "Reads product data when cache entries miss." },
  [cacheStampedeNodeIds.database]: { id: cacheStampedeNodeIds.database, name: "Database", description: "Shared product and inventory persistence." },
  [cacheStampedeNodeIds.inventoryService]: { id: cacheStampedeNodeIds.inventoryService, name: "Inventory Service", description: "Checks availability during checkout." },
  [cacheStampedeNodeIds.recommendationService]: { id: cacheStampedeNodeIds.recommendationService, name: "Recommendation Service", description: "Consumes catalog reads for suggestions." },
};

export const connections = [
  { from: cacheStampedeNodeIds.webCheckout, to: cacheStampedeNodeIds.checkoutApi },
  { from: cacheStampedeNodeIds.checkoutApi, to: cacheStampedeNodeIds.productCache },
  { from: cacheStampedeNodeIds.productCache, to: cacheStampedeNodeIds.catalogApi },
  { from: cacheStampedeNodeIds.catalogApi, to: cacheStampedeNodeIds.database },
  { from: cacheStampedeNodeIds.checkoutApi, to: cacheStampedeNodeIds.inventoryService },
  { from: cacheStampedeNodeIds.checkoutApi, to: cacheStampedeNodeIds.recommendationService },
];

export const actions: IncidentAction[] = [
  { id: "inspect-cache-metrics", title: "Inspect cache metrics", description: "Check hit rate, misses, and key-level concentration.", consequence: "One popular key expired and misses are arriving in a synchronized burst.", actionPointCost: 1, timeCostMinutes: 1 },
  { id: "inspect-deployment", title: "Inspect recent deployment", description: "Check whether the release changed cache behavior.", consequence: "The latest release changed the TTL for a high-traffic product key.", actionPointCost: 1, timeCostMinutes: 2 },
  { id: "inspect-database-metrics", title: "Inspect database metrics", description: "Check whether the database is absorbing the cache misses.", consequence: "Database reads are queuing behind the stampede and connections are climbing.", actionPointCost: 1, timeCostMinutes: 1, prerequisites: ["inspect-cache-metrics", "inspect-deployment"], prerequisiteMode: "any" },
  { id: "warm-cache", title: "Warm the cache", description: "Preload the hot key from a controlled worker.", consequence: "The hot product key is repopulated and the miss burst drops sharply.", actionPointCost: 1, timeCostMinutes: 2, prerequisites: ["inspect-cache-metrics", "inspect-deployment"], prerequisiteMode: "any" },
  { id: "enable-request-coalescing", title: "Enable request coalescing", description: "Allow only one request to refill a missing key.", consequence: "Concurrent misses now share one refill instead of multiplying database reads.", actionPointCost: 1, timeCostMinutes: 2, prerequisites: ["inspect-cache-metrics", "inspect-deployment"], prerequisiteMode: "any" },
  { id: "throttle-catalog-traffic", title: "Throttle catalog traffic", description: "Reduce catalog load as an emergency protection measure.", consequence: "Catalog traffic is throttled and database capacity is protected at a visible customer cost.", actionPointCost: 2, timeCostMinutes: 1 },
  { id: "rollback-deployment", title: "Rollback deployment", description: "Restore the previous cache TTL configuration.", consequence: "New instances use the prior TTL, but the active miss burst still needs containment.", actionPointCost: 1, timeCostMinutes: 4, prerequisites: ["inspect-deployment"] },
];

export const initialStatuses: Record<string, NodeStatus> = {
  [cacheStampedeNodeIds.webCheckout]: "healthy",
  [cacheStampedeNodeIds.checkoutApi]: "warning",
  [cacheStampedeNodeIds.productCache]: "critical",
  [cacheStampedeNodeIds.catalogApi]: "warning",
  [cacheStampedeNodeIds.database]: "warning",
  [cacheStampedeNodeIds.inventoryService]: "healthy",
  [cacheStampedeNodeIds.recommendationService]: "healthy",
};

export const initialEvent: IncidentEvent = {
  id: "cache-incident-started",
  minute: 0,
  title: "A popular product key expires",
  description: "Catalog latency rises as a synchronized wave of cache misses reaches the database.",
  severity: "warning",
  relatedNodeIds: [cacheStampedeNodeIds.productCache, cacheStampedeNodeIds.database],
};
