import type { IncidentAction, IncidentState } from "@/domain/incident/types";
import type { DerivedIncidentState, ScenarioActionEffect } from "../types";
import { retryStormScenario } from "../retryStorm";
import { calculateRetryStormOutcome } from "./calculateOutcome";
import { deriveRetryStormMetrics } from "./deriveMetrics";
import { deriveRetryStormNodeStatuses } from "./deriveNodeStatuses";
import { deriveRetryStormTimelineEvents } from "./deriveTimelineEvents";

const flagByAction: Partial<Record<string, string>> = {
  "inspect-deployment": "deploymentInspected",
  "inspect-queue": "queueInspected",
  "inspect-provider-traces": "providerTracesInspected",
  "rollback-deployment": "rollbackApplied",
  "disable-retries": "retriesDisabled",
  "enable-circuit-breaker": "circuitBreakerEnabled",
  "scale-workers": "workersScaled",
  "increase-queue-retention": "queueRetentionIncreased",
  "pause-checkout": "trafficPaused",
};

const hypothesesByAction: Partial<Record<string, string>> = {
  "inspect-deployment": "Retry configuration changed",
  "inspect-queue": "Consumers cannot keep up",
  "inspect-provider-traces": "Downstream instability",
};

export function resolveRetryStormAction(state: IncidentState, action: IncidentAction): ScenarioActionEffect {
  const flag = flagByAction[action.id];
  const flags = flag ? { [flag]: true } : {};
  const hypothesis = hypothesesByAction[action.id];
  const stateWithFlags = { ...state, flags: { ...state.flags, ...flags }, metrics: deriveRetryStormMetrics({ ...state, flags: { ...state.flags, ...flags } }, retryStormScenario.initialMetrics) };
  return { flags, hypotheses: hypothesis ? [hypothesis] : [], events: deriveRetryStormTimelineEvents(stateWithFlags, action), message: action.consequence };
}

export function deriveRetryStormState(state: IncidentState): DerivedIncidentState {
  const metrics = deriveRetryStormMetrics(state, retryStormScenario.initialMetrics);
  return { metrics, nodeStatuses: deriveRetryStormNodeStatuses({ ...state, metrics }) };
}

export { calculateRetryStormOutcome };
