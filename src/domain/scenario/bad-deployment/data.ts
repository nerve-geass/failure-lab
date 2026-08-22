import type { IncidentAction, IncidentEvent, Metric, NodeStatus, SystemNode } from "@/domain/incident/types";

export const metricIds = { checkoutErrorRate: "checkoutErrorRate", checkoutLatencyP95: "checkoutLatencyP95", canaryErrorRate: "canaryErrorRate", healthyTrafficErrorRate: "healthyTrafficErrorRate", rolloutExposure: "rolloutExposure", requestRate: "requestRate", databaseErrors: "databaseErrors" } as const;
export const nodeIds = { webCheckout: "web-checkout", checkoutApi: "checkout-api", canary: "canary", stable: "stable", featureFlag: "feature-flag", database: "database", telemetry: "telemetry" } as const;
const metric = (id: string, label: string, value: number, unit: string, severity: Metric["severity"], explanation: string): Metric => ({ id, label, value, unit, trend: "flat", severity, explanation });

export const initialMetrics: Record<string, Metric> = {
  [metricIds.checkoutErrorRate]: metric(metricIds.checkoutErrorRate, "Checkout error rate", 4.8, "%", "warning", "The aggregate error rate is elevated but does not reveal which release is affected."),
  [metricIds.checkoutLatencyP95]: metric(metricIds.checkoutLatencyP95, "Checkout latency p95", 2.9, "s", "warning", "A subset of requests is slower than the normal checkout baseline."),
  [metricIds.canaryErrorRate]: metric(metricIds.canaryErrorRate, "Canary error rate", 18, "%", "critical", "The canary receives only part of traffic, so its failure is diluted in aggregate metrics."),
  [metricIds.healthyTrafficErrorRate]: metric(metricIds.healthyTrafficErrorRate, "Stable version errors", 1.1, "%", "info", "The previous version remains within its normal error range."),
  [metricIds.rolloutExposure]: metric(metricIds.rolloutExposure, "New version exposure", 25, "%", "warning", "Only a quarter of traffic is on the new release."),
  [metricIds.requestRate]: metric(metricIds.requestRate, "Checkout request rate", 860, "/min", "info", "Traffic volume is normal for this time of day."),
  [metricIds.databaseErrors]: metric(metricIds.databaseErrors, "Database errors", 0.4, "%", "info", "The database is not the primary failing component."),
};

export const nodes: Record<string, SystemNode> = {
  [nodeIds.webCheckout]: { id: nodeIds.webCheckout, name: "Web Checkout", description: "Customer-facing checkout flow." },
  [nodeIds.checkoutApi]: { id: nodeIds.checkoutApi, name: "Checkout API", description: "Routes traffic across release versions." },
  [nodeIds.canary]: { id: nodeIds.canary, name: "Canary v2.4.0", description: "New release receiving a partial traffic slice." },
  [nodeIds.stable]: { id: nodeIds.stable, name: "Stable v2.3.9", description: "Previous release serving the majority of traffic." },
  [nodeIds.featureFlag]: { id: nodeIds.featureFlag, name: "Checkout flag", description: "Controls the changed payment flow." },
  [nodeIds.database]: { id: nodeIds.database, name: "Database", description: "Shared persistence system downstream of checkout." },
  [nodeIds.telemetry]: { id: nodeIds.telemetry, name: "Telemetry", description: "Collects version-aware operational signals." },
};
export const connections = [{ from: nodeIds.webCheckout, to: nodeIds.checkoutApi }, { from: nodeIds.checkoutApi, to: nodeIds.canary }, { from: nodeIds.checkoutApi, to: nodeIds.stable }, { from: nodeIds.canary, to: nodeIds.featureFlag }, { from: nodeIds.stable, to: nodeIds.featureFlag }, { from: nodeIds.checkoutApi, to: nodeIds.database }, { from: nodeIds.checkoutApi, to: nodeIds.telemetry }];
export const actions: IncidentAction[] = [
  { id: "inspect-deployment", title: "Inspect recent deployment", description: "Compare release versions, exposure, and canary health.", consequence: "The new version is failing disproportionately while stable traffic remains healthy.", actionPointCost: 1, timeCostMinutes: 2 },
  { id: "inspect-checkout-slice", title: "Compare traffic slices", description: "Break aggregate metrics down by release version.", consequence: "Failures correlate with the canary slice rather than the entire checkout fleet.", actionPointCost: 1, timeCostMinutes: 1 },
  { id: "disable-feature", title: "Disable changed feature", description: "Turn off the new checkout behavior while keeping the release available.", consequence: "Affected requests fall back to the stable behavior and error rates begin to recover.", actionPointCost: 1, timeCostMinutes: 2, prerequisites: ["inspect-deployment"], prerequisiteMode: "any" },
  { id: "reduce-exposure", title: "Reduce canary exposure", description: "Route the canary traffic slice back to the stable version.", consequence: "The blast radius shrinks, but the faulty release remains deployed for investigation.", actionPointCost: 1, timeCostMinutes: 1, prerequisites: ["inspect-deployment", "inspect-checkout-slice"], prerequisiteMode: "any" },
  { id: "rollback-deployment", title: "Rollback deployment", description: "Replace the new release with the previous version.", consequence: "Rollback starts while mixed-version state is still present; errors briefly increase during convergence.", actionPointCost: 1, timeCostMinutes: 3 },
  { id: "check-schema-compatibility", title: "Check schema compatibility", description: "Verify that old and new versions can safely share persisted state.", consequence: "The release is compatible with the current schema, making rollback safer.", actionPointCost: 1, timeCostMinutes: 2, prerequisites: ["inspect-deployment"] },
  { id: "advance-time", title: "Advance incident timeline", description: "Wait and observe whether the current mitigation is holding.", consequence: "The rollout continues to affect customers if exposure is not reduced.", actionPointCost: 1, timeCostMinutes: 2 },
];
export const initialStatuses: Record<string, NodeStatus> = { [nodeIds.webCheckout]: "warning", [nodeIds.checkoutApi]: "warning", [nodeIds.canary]: "critical", [nodeIds.stable]: "healthy", [nodeIds.featureFlag]: "warning", [nodeIds.database]: "healthy", [nodeIds.telemetry]: "warning" };
export const initialEvent: IncidentEvent = { id: "bad-deployment-started", minute: 0, title: "Release v2.4.0 enters canary", description: "Checkout errors rise shortly after a new version begins serving a limited traffic slice.", severity: "warning", relatedNodeIds: [nodeIds.checkoutApi, nodeIds.canary] };
