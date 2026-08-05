import { metricIds } from "@/domain/incident/constants";
import type { IncidentState, OutcomeId } from "@/domain/incident/types";

export function calculateRetryStormOutcome(state: IncidentState): OutcomeId | undefined {
  if (state.flags.trafficPaused) return "emergency-containment";
  if (state.metrics[metricIds.openConnections].value >= 100 || state.metrics[metricIds.queueDepth].value > 20000) return "major-outage";
  if (state.flags.retriesDisabled && state.flags.circuitBreakerEnabled && state.metrics[metricIds.openConnections].value < 90) return "excellent-containment";
  if (state.flags.retriesDisabled || state.flags.rollbackApplied) return "partial-recovery";
  return undefined;
}
