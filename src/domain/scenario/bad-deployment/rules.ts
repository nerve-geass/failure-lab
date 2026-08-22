import type { IncidentAction, IncidentState } from "@/domain/incident/types";
import type { ScenarioActionEffect, DerivedIncidentState } from "../types";
import { deriveBadDeploymentMetrics } from "./deriveMetrics";
import { deriveBadDeploymentNodeStatuses } from "./deriveNodeStatuses";
import { deriveBadDeploymentTimelineEvents } from "./deriveTimelineEvents";

const flagsByAction: Record<string, string> = { "inspect-deployment": "deploymentInspected", "inspect-checkout-slice": "sliceInspected", "disable-feature": "featureDisabled", "reduce-exposure": "exposureReduced", "rollback-deployment": "rollbackApplied", "check-schema-compatibility": "schemaChecked" };
const hypothesesByAction: Record<string, string> = { "inspect-deployment": "Partial rollout regression", "inspect-checkout-slice": "Canary traffic carries the failures", "check-schema-compatibility": "Rollback compatibility is understood" };
export function resolveBadDeploymentAction(state: IncidentState, action: IncidentAction): ScenarioActionEffect {
  const flag = flagsByAction[action.id];
  const flags = flag ? { [flag]: true } : {};
  const next = { ...state, flags: { ...state.flags, ...flags } };
  return { flags, hypotheses: hypothesesByAction[action.id] ? [hypothesesByAction[action.id]] : [], events: deriveBadDeploymentTimelineEvents({ ...next, metrics: deriveBadDeploymentMetrics(next) }, action), message: action.consequence };
}
export function deriveBadDeploymentState(state: IncidentState): DerivedIncidentState { const metrics = deriveBadDeploymentMetrics(state); return { metrics, nodeStatuses: deriveBadDeploymentNodeStatuses({ ...state, metrics }) }; }
