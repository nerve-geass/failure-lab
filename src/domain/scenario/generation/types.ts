import type { ScenarioDefinition } from "../types";

export type ScenarioSeed = number;

export type ScenarioFamily = {
  id: string;
  generate(seed: ScenarioSeed): ScenarioDefinition;
};

export type ScenarioValidationResult = {
  valid: boolean;
  errors: string[];
};
