import type { IncidentState, OutcomeId } from "@/domain/incident/types";
import { metricIds as ids } from "./data";

export function calculateBadDeploymentOutcome(state: IncidentState): OutcomeId | undefined {
  if (state.metrics[ids.checkoutErrorRate].value >= 20 || (state.flags.rollbackApplied && !state.flags.schemaChecked && state.currentMinute >= 5)) return "major-outage";
  if ((state.flags.featureDisabled || state.flags.exposureReduced) && state.metrics[ids.checkoutErrorRate].value < 3 && state.currentMinute >= 5) return "excellent-containment";
  if (state.flags.rollbackApplied && state.flags.schemaChecked && state.metrics[ids.checkoutErrorRate].value < 3) return "partial-recovery";
  if (state.flags.featureDisabled || state.flags.exposureReduced || state.flags.rollbackApplied) return "partial-recovery";
  return undefined;
}
