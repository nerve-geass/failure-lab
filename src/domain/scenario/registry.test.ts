import { describe, expect, it } from "vitest";
import { getScenario, listScenarios, scenarioRegistry } from "./registry";
import type { ScenarioDefinition } from "./types";

const syntheticScenario: ScenarioDefinition = {
  id: "synthetic",
  title: "Synthetic scenario",
  summary: "A test scenario.",
  nodes: {},
  connections: [],
  actions: [],
  concepts: [],
  content: { durationMinutes: 5, difficulty: "Introductory", briefing: { eyebrow: "Synthetic", title: "Synthetic briefing", description: "Synthetic description.", objective: "Synthetic objective.", capability: "Synthetic capability.", learning: "Synthetic learning." }, report: { rootCauseTitle: "Synthetic cause", rootCauseDescription: "Synthetic root cause.", bestIntervention: "Immediately" }, outcomeMessages: {} },
  createInitialState: () => ({
    scenarioId: "synthetic",
    currentMinute: 0,
    actionPoints: 1,
    flags: {},
    metrics: {},
    nodeStatuses: {},
    completedActionIds: [],
    hypotheses: [],
    timeline: [],
    status: "active",
  }),
  resolveAction: () => ({ flags: {}, hypotheses: [], events: [] }),
  deriveState: (state) => ({ metrics: state.metrics, nodeStatuses: state.nodeStatuses }),
  calculateOutcome: () => undefined,
  calculateScore: () => 0,
};

describe("scenario registry", () => {
  it("returns a registered definition and lists its scenarios", () => {
    const registry = { synthetic: syntheticScenario };

    expect(getScenario(registry, "synthetic")).toBe(syntheticScenario);
    expect(listScenarios(registry)).toEqual([syntheticScenario]);
  });

  it("exposes the application registry object", () => {
    expect(scenarioRegistry).toBeDefined();
  });

  it("keeps scenario narrative content with the definition", () => {
    expect(syntheticScenario.content.briefing.title).toBe("Synthetic briefing");
    expect(syntheticScenario.content.durationMinutes).toBe(5);
  });
});
