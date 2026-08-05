import { applyIncidentAction } from "@/domain/incident/incidentEngine";
import type { IncidentActionResult, IncidentState } from "@/domain/incident/types";
import type { IncidentPersistence } from "@/infrastructure/persistence/incidentPersistence";
import { getScenario, type ScenarioRegistry } from "@/domain/scenario/registry";

const DEFAULT_SCENARIO_ID = "retry-storm";

export function createIncidentApplication(persistence: IncidentPersistence, registry: ScenarioRegistry) {
  const fallbackScenario = getScenario(registry, DEFAULT_SCENARIO_ID);
  if (!fallbackScenario) throw new Error(`Missing default scenario: ${DEFAULT_SCENARIO_ID}`);
  const resolveScenario = (scenarioId?: string) => getScenario(registry, scenarioId ?? DEFAULT_SCENARIO_ID) ?? fallbackScenario;

  return {
    startIncident(scenarioId = DEFAULT_SCENARIO_ID): IncidentState {
      const state = resolveScenario(scenarioId).createInitialState();
      persistence.save(state);
      return state;
    },
    performIncidentAction(state: IncidentState, actionId: string): IncidentActionResult {
      const result = applyIncidentAction(state, resolveScenario(state.scenarioId), actionId);
      if (result.accepted) persistence.save(result.state);
      return result;
    },
    restoreIncident(): IncidentState | null {
      const restored = persistence.load();
      if (!restored) return null;
      const normalized = { ...restored, scenarioId: restored.scenarioId ?? DEFAULT_SCENARIO_ID };
      persistence.save(normalized);
      return normalized;
    },
    restartIncident(scenarioId = DEFAULT_SCENARIO_ID): IncidentState {
      persistence.clear();
      return this.startIncident(scenarioId);
    },
  };
}
