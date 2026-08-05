import { metricIds } from "@/domain/incident/constants";
import type { IncidentState } from "@/domain/incident/types";

export type ScoreLabel = "Incident Commander" | "Strong Response" | "Partial Containment" | "Failure Chain Unbroken";

export function calculateRetryStormScore(state: IncidentState): number {
  const { flags, completedActionIds, metrics } = state;
  let score = 0;
  if (flags.retriesDisabled) score += 30;
  if (flags.circuitBreakerEnabled) score += 25;
  if (flags.providerTracesInspected) score += 15;
  if (flags.deploymentInspected) score += 10;
  if (metrics[metricIds.openConnections].value < 90) score += 10;
  if (!flags.trafficPaused) score += 10;
  if (flags.workersScaled && !flags.retriesDisabled) score -= 15;
  if (completedActionIds.length > 4 && !flags.retriesDisabled) score -= 10;
  if (metrics[metricIds.openConnections].value >= 100) score -= 20;
  return Math.max(0, Math.min(100, score));
}

export function scoreLabel(score: number): ScoreLabel {
  if (score >= 90) return "Incident Commander";
  if (score >= 70) return "Strong Response";
  if (score >= 50) return "Partial Containment";
  return "Failure Chain Unbroken";
}
