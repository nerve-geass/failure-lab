import type { IncidentState, OutcomeId } from "@/domain/incident/types";
import { metricIds as ids } from "./data";

export function calculateConnectionPoolExhaustionOutcome(state: IncidentState): OutcomeId | undefined {
  if (state.flags.trafficShed) return "emergency-containment";
  if (state.metrics[ids.poolUtilization].value >= 100 || state.metrics[ids.poolWait].value > 1600) return "major-outage";
  if (state.flags.leakDetectionEnabled && state.flags.concurrencyCapped && state.metrics[ids.poolUtilization].value < 90) return "excellent-containment";
  if (state.flags.concurrencyCapped || state.flags.leakDetectionEnabled || state.flags.queriesTuned || state.flags.rollbackApplied || state.flags.workersRestarted) return "partial-recovery";
  return undefined;
}
