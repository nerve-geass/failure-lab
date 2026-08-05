import type { ScenarioDefinition } from "../scenario/types";
import type { IncidentActionResult, IncidentState } from "./types";

export function createInitialIncident(scenario: ScenarioDefinition): IncidentState {
  return structuredClone(scenario.createInitialState());
}

export function applyIncidentAction(state: IncidentState, scenario: ScenarioDefinition, actionId: string): IncidentActionResult {
  const action = scenario.actions.find((candidate) => candidate.id === actionId);
  if (!action) return { state, action: { id: actionId, title: "Unknown action", description: "", consequence: "", actionPointCost: 0, timeCostMinutes: 0 }, accepted: false, message: "Action not found." };
  const prerequisites = action.prerequisites ?? [];
  const hasPrerequisites = action.prerequisiteMode === "any"
    ? prerequisites.some((prerequisite) => state.completedActionIds.includes(prerequisite))
    : prerequisites.every((prerequisite) => state.completedActionIds.includes(prerequisite));
  const alreadyCompleted = !action.repeatable && state.completedActionIds.includes(action.id);
  const affordable = state.actionPoints >= action.actionPointCost;
  if (state.status !== "active" || !hasPrerequisites || alreadyCompleted || !affordable) {
    const message = state.status !== "active" ? "The incident is no longer active." : alreadyCompleted ? "This action is already complete." : !hasPrerequisites ? "Inspect a relevant signal first." : "Not enough action points.";
    return { state, action, accepted: false, message };
  }

  const nextBase: IncidentState = {
    ...state,
    currentMinute: state.currentMinute + action.timeCostMinutes,
    actionPoints: state.actionPoints - action.actionPointCost,
    completedActionIds: [...state.completedActionIds, action.id],
  };
  const effect = scenario.resolveAction(nextBase, action);
  const withEffects: IncidentState = {
    ...nextBase,
    flags: { ...nextBase.flags, ...effect.flags },
    hypotheses: [...new Set([...nextBase.hypotheses, ...effect.hypotheses])],
    timeline: [...nextBase.timeline, ...effect.events],
  };
  const derived = scenario.deriveState(withEffects);
  const derivedState: IncidentState = { ...withEffects, ...derived };
  const outcome = scenario.calculateOutcome(derivedState);
  const status = outcome === "major-outage" ? "failed" : outcome === "excellent-containment" || outcome === "emergency-containment" ? "resolved" : "active";
  return { state: { ...derivedState, outcome, status, score: outcome ? scenario.calculateScore(derivedState) : undefined }, action, accepted: true, message: effect.message ?? action.consequence };
}
