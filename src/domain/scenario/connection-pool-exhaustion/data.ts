import type { IncidentAction, IncidentEvent, Metric, NodeStatus, SystemNode } from "@/domain/incident/types";

export const metricIds = { poolUtilization: "poolUtilization", poolWait: "poolWait", checkoutLatency: "checkoutLatency", queryLatency: "queryLatency", activeWorkers: "activeWorkers", leakedConnections: "leakedConnections", errorRate: "errorRate" } as const;
export const nodeIds = { webCheckout: "web-checkout", checkoutApi: "checkout-api", workerPool: "worker-pool", connectionPool: "connection-pool", queryService: "query-service", database: "database", telemetry: "telemetry" } as const;
const metric = (id: string, label: string, value: number, unit: string, severity: Metric["severity"], explanation: string): Metric => ({ id, label, value, unit, trend: "flat", severity, explanation });
export const initialMetrics: Record<string, Metric> = {
  [metricIds.poolUtilization]: metric(metricIds.poolUtilization, "Pool utilization", 74, "%", "warning", "Most connections are occupied and headroom is narrowing."),
  [metricIds.poolWait]: metric(metricIds.poolWait, "Pool wait time", 420, "ms", "warning", "Workers are waiting longer to acquire a database connection."),
  [metricIds.checkoutLatency]: metric(metricIds.checkoutLatency, "Checkout latency p95", 2.4, "s", "warning", "Requests are slowing before database work even begins."),
  [metricIds.queryLatency]: metric(metricIds.queryLatency, "Query latency p95", 180, "ms", "warning", "Some queries are holding connections longer than normal."),
  [metricIds.activeWorkers]: metric(metricIds.activeWorkers, "Active workers", 48, "workers", "info", "Worker count looks normal, masking the pool bottleneck."),
  [metricIds.leakedConnections]: metric(metricIds.leakedConnections, "Leaked connections", 0.8, "/min", "critical", "Connections are not being returned to the pool reliably."),
  [metricIds.errorRate]: metric(metricIds.errorRate, "Connection errors", 3.2, "%", "warning", "Acquisition failures are beginning to reach customers."),
};
export const nodes: Record<string, SystemNode> = {
  [nodeIds.webCheckout]: { id: nodeIds.webCheckout, name: "Web Checkout", description: "Customer-facing checkout flow." },
  [nodeIds.checkoutApi]: { id: nodeIds.checkoutApi, name: "Checkout API", description: "Coordinates requests to worker services." },
  [nodeIds.workerPool]: { id: nodeIds.workerPool, name: "Worker Pool", description: "Application workers that acquire database connections." },
  [nodeIds.connectionPool]: { id: nodeIds.connectionPool, name: "Connection Pool", description: "Shared finite pool of database connections." },
  [nodeIds.queryService]: { id: nodeIds.queryService, name: "Query Service", description: "Executes reads and writes against the database." },
  [nodeIds.database]: { id: nodeIds.database, name: "Database", description: "Shared persistence system downstream of the pool." },
  [nodeIds.telemetry]: { id: nodeIds.telemetry, name: "Telemetry", description: "Collects pool and query diagnostics." },
};
export const connections = [{ from: nodeIds.webCheckout, to: nodeIds.checkoutApi }, { from: nodeIds.checkoutApi, to: nodeIds.workerPool }, { from: nodeIds.workerPool, to: nodeIds.connectionPool }, { from: nodeIds.connectionPool, to: nodeIds.queryService }, { from: nodeIds.queryService, to: nodeIds.database }, { from: nodeIds.connectionPool, to: nodeIds.telemetry }];
export const actions: IncidentAction[] = [
  { id: "inspect-pool", title: "Inspect pool metrics", description: "Measure utilization, wait time, and acquisition failures.", consequence: "The pool is near saturation and acquisition waits are rising.", actionPointCost: 1, timeCostMinutes: 1 },
  { id: "inspect-query", title: "Inspect query latency", description: "Find queries that hold connections longer than expected.", consequence: "A slow query path is holding connections while a leak keeps some permanently occupied.", actionPointCost: 1, timeCostMinutes: 2 },
  { id: "inspect-deployment", title: "Inspect recent deployment", description: "Check whether connection lifecycle behavior changed.", consequence: "The latest release introduced a path that does not always release connections.", actionPointCost: 1, timeCostMinutes: 2 },
  { id: "enable-leak-detection", title: "Enable leak detection", description: "Track connections that exceed their expected checkout lifetime.", consequence: "Leak detection identifies the unreleased connection path for the next deploy.", actionPointCost: 1, timeCostMinutes: 2, prerequisites: ["inspect-pool", "inspect-deployment"], prerequisiteMode: "any" },
  { id: "cap-concurrency", title: "Cap request concurrency", description: "Limit simultaneous work before the pool is exhausted.", consequence: "Fewer workers contend for the pool and acquisition waits begin to recover.", actionPointCost: 1, timeCostMinutes: 2, prerequisites: ["inspect-pool", "inspect-query"], prerequisiteMode: "any" },
  { id: "restart-workers", title: "Restart workers", description: "Clear currently held connections by recycling workers.", consequence: "Held connections are released temporarily, but the leak remains in the new workers.", actionPointCost: 1, timeCostMinutes: 3, prerequisites: ["inspect-pool"] },
  { id: "increase-pool-size", title: "Increase pool size", description: "Allow more concurrent database connections.", consequence: "The application gets more connections, but database contention rises with it.", actionPointCost: 1, timeCostMinutes: 2, prerequisites: ["inspect-pool"] },
  { id: "tune-queries", title: "Tune slow queries", description: "Reduce the time each query holds a connection.", consequence: "The slow path improves, but leaked connections still accumulate.", actionPointCost: 1, timeCostMinutes: 3, prerequisites: ["inspect-query"] },
  { id: "rollback-deployment", title: "Rollback deployment", description: "Restore the previous connection lifecycle behavior.", consequence: "New workers stop using the leaking path, but already held connections need time to clear.", actionPointCost: 1, timeCostMinutes: 4, prerequisites: ["inspect-deployment"] },
  { id: "shed-traffic", title: "Shed checkout traffic", description: "Reduce customer load as an emergency containment measure.", consequence: "The pool is protected at a severe business impact.", actionPointCost: 2, timeCostMinutes: 1 },
];
export const initialStatuses: Record<string, NodeStatus> = { [nodeIds.webCheckout]: "warning", [nodeIds.checkoutApi]: "warning", [nodeIds.workerPool]: "warning", [nodeIds.connectionPool]: "critical", [nodeIds.queryService]: "warning", [nodeIds.database]: "warning", [nodeIds.telemetry]: "healthy" };
export const initialEvent: IncidentEvent = { id: "pool-exhaustion-started", minute: 0, title: "Connection acquisition waits rise", description: "Workers remain healthy, but the shared connection pool is nearing exhaustion.", severity: "warning", relatedNodeIds: [nodeIds.workerPool, nodeIds.connectionPool] };
