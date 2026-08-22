import type { ScenarioDefinition } from "./types";
import { cacheStampedeDefinition } from "./cache-stampede/definition";
import { connectionPoolExhaustionDefinition } from "./connection-pool-exhaustion/definition";
import { badDeploymentDefinition } from "./bad-deployment/definition";
import { queueConsumerLagDefinition } from "./queue-consumer-lag/definition";
import { retryStormDefinition } from "./retry-storm/definition";

export type ScenarioRegistry = Record<string, ScenarioDefinition>;

export const scenarioRegistry: ScenarioRegistry = {
  [retryStormDefinition.id]: retryStormDefinition,
  [cacheStampedeDefinition.id]: cacheStampedeDefinition,
  [queueConsumerLagDefinition.id]: queueConsumerLagDefinition,
  [connectionPoolExhaustionDefinition.id]: connectionPoolExhaustionDefinition,
  [badDeploymentDefinition.id]: badDeploymentDefinition,
};

export function getScenario(registry: ScenarioRegistry, id: string): ScenarioDefinition | undefined {
  return registry[id];
}

export function listScenarios(registry: ScenarioRegistry): ScenarioDefinition[] {
  return Object.values(registry);
}
