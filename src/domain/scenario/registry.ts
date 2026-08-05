import type { ScenarioDefinition } from "./types";
import { cacheStampedeDefinition } from "./cache-stampede/definition";
import { retryStormDefinition } from "./retry-storm/definition";

export type ScenarioRegistry = Record<string, ScenarioDefinition>;

export const scenarioRegistry: ScenarioRegistry = {
  [retryStormDefinition.id]: retryStormDefinition,
  [cacheStampedeDefinition.id]: cacheStampedeDefinition,
};

export function getScenario(registry: ScenarioRegistry, id: string): ScenarioDefinition | undefined {
  return registry[id];
}

export function listScenarios(registry: ScenarioRegistry): ScenarioDefinition[] {
  return Object.values(registry);
}
