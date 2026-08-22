import type { IncidentState, NodeStatus } from "@/domain/incident/types";
import { nodeIds } from "./data";
import { deriveBadDeploymentMetrics } from "./deriveMetrics";

export function deriveBadDeploymentNodeStatuses(state: IncidentState): Record<string, NodeStatus> {
  const metrics = deriveBadDeploymentMetrics(state);
  const healthy = metrics.checkoutErrorRate.value < 3;
  return { [nodeIds.webCheckout]: healthy ? "recovering" : "warning", [nodeIds.checkoutApi]: healthy ? "recovering" : metrics.checkoutErrorRate.value > 6 ? "critical" : "warning", [nodeIds.canary]: metrics.canaryErrorRate.value > 20 ? "critical" : metrics.canaryErrorRate.value > 5 ? "warning" : "recovering", [nodeIds.stable]: "healthy", [nodeIds.featureFlag]: state.flags.featureDisabled ? "isolated" : "warning", [nodeIds.database]: "healthy", [nodeIds.telemetry]: state.flags.deploymentInspected ? "healthy" : "warning" };
}
