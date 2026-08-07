import { applyIncidentAction } from "@/domain/incident/incidentEngine";
import type { ScenarioDefinition } from "../types";
import type { ScenarioValidationResult } from "./types";

export function validateScenarioDefinition(scenario: ScenarioDefinition): ScenarioValidationResult {
  const errors: string[] = [];
  const actionIds = new Set(scenario.actions.map((action) => action.id));
  const initialState = scenario.createInitialState();

  if (!scenario.id || !scenario.title) errors.push("Scenario must have an id and title.");
  if (scenario.actions.length === 0) errors.push("Scenario must define at least one action.");
  if (initialState.scenarioId !== scenario.id) errors.push("Initial state scenarioId must match the definition id.");
  if (initialState.actionPoints < 0) errors.push("Initial action points cannot be negative.");

  for (const action of scenario.actions) {
    if (action.actionPointCost < 0 || action.timeCostMinutes < 0) errors.push(`Action ${action.id} has a negative cost.`);
    for (const prerequisite of action.prerequisites ?? []) {
      if (!actionIds.has(prerequisite)) errors.push(`Action ${action.id} references unknown prerequisite ${prerequisite}.`);
    }
  }

  if (!errors.length && !hasExcellentPath(scenario, initialState)) {
    errors.push("No excellent-containment path is reachable from the initial state.");
  }

  return { valid: errors.length === 0, errors };
}

function hasExcellentPath(scenario: ScenarioDefinition, initialState: ReturnType<ScenarioDefinition["createInitialState"]>): boolean {
  const queue = [initialState];
  const visited = new Set<string>();

  while (queue.length > 0 && visited.size < 10000) {
    const state = queue.shift();
    if (!state) continue;
    const key = `${state.completedActionIds.join(",")}|${state.currentMinute}|${state.actionPoints}|${state.status}|${state.outcome ?? ""}`;
    if (visited.has(key)) continue;
    visited.add(key);

    for (const action of scenario.actions) {
      const result = applyIncidentAction(state, scenario, action.id);
      if (!result.accepted) continue;
      if (result.state.outcome === "excellent-containment") return true;
      if (result.state.status === "active") queue.push(result.state);
    }
  }

  return false;
}
