import type { IncidentState, OutcomeId } from "@/domain/incident/types";
import { metricIds as ids } from "./data";

export function calculateQueueConsumerLagOutcome(state: IncidentState): OutcomeId | undefined {
  if (state.flags.producersPaused) return "emergency-containment";
  if (state.metrics[ids.queueDepth].value >= 20000 || state.metrics[ids.consumerLag].value > 180) return "major-outage";
  if (state.flags.consumersScaled && state.flags.backpressureApplied && state.metrics[ids.queueDepth].value < 12000) return "excellent-containment";
  if (state.flags.consumersScaled || state.flags.backpressureApplied || state.flags.rollbackApplied) return "partial-recovery";
  return undefined;
}
