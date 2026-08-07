import { describe, expect, it } from "vitest";
import { cacheStampedeFamily } from "../cache-stampede/generator";
import { validateScenarioDefinition } from "./scenarioValidator";

describe("seeded scenario generation", () => {
  it("recreates the same Cache Stampede exercise from the same seed", () => {
    const first = cacheStampedeFamily.generate(42);
    const second = cacheStampedeFamily.generate(42);

    expect(first.seed).toBe(42);
    expect(first.createInitialState()).toEqual(second.createInitialState());
    expect(first.actions).toEqual(second.actions);
  });

  it("changes controlled starting conditions when the seed changes", () => {
    const first = cacheStampedeFamily.generate(42).createInitialState();
    const second = cacheStampedeFamily.generate(43).createInitialState();

    expect(second.metrics).not.toEqual(first.metrics);
    expect(second.scenarioId).toBe(first.scenarioId);
  });

  it("validates generated scenarios as structurally coherent and solvable", () => {
    const result = validateScenarioDefinition(cacheStampedeFamily.generate(2026));

    expect(result).toEqual({ valid: true, errors: [] });
  });
});
