import { describe, expect, it } from "vitest";
import { applyIncidentAction, createInitialIncident } from "./incidentEngine";
import type { IncidentAction, IncidentEvent, IncidentState } from "./types";
import type { ScenarioDefinition } from "../scenario/types";

const action: IncidentAction = { id: "mitigate", title: "Mitigate", description: "Stop pressure.", consequence: "Pressure drops.", actionPointCost: 1, timeCostMinutes: 2 };
const event: IncidentEvent = { id: "mitigated", minute: 2, title: "Mitigated", description: "The synthetic system recovered.", severity: "success", relatedNodeIds: [] };

const scenario: ScenarioDefinition = {
  id: "synthetic-engine",
  title: "Synthetic engine scenario",
  summary: "Tests generic mechanics.",
  nodes: {},
  connections: [],
  actions: [action],
  concepts: [],
  content: { startMinute: 0, durationMinutes: 5, difficulty: "Introductory", impact: { metricId: "", growingAt: 1, highAt: 2 }, topologyNote: "Synthetic signals", briefing: { eyebrow: "Synthetic", title: "Synthetic", description: "Synthetic", objective: "Synthetic", capability: "Synthetic", learning: "Synthetic" }, report: { rootCauseTitle: "Synthetic", rootCauseDescription: "Synthetic", bestIntervention: "Immediately", missedOpportunities: [] }, outcomeMessages: {} },
  createInitialState: () => ({ scenarioId: "synthetic-engine", currentMinute: 0, actionPoints: 2, flags: {}, metrics: {}, nodeStatuses: {}, completedActionIds: [], hypotheses: [], timeline: [], status: "active" }),
  resolveAction: () => ({ flags: { mitigated: true }, hypotheses: ["Synthetic cause"], events: [event], message: "Pressure drops." }),
  deriveState: (state: IncidentState) => ({ metrics: state.metrics, nodeStatuses: state.nodeStatuses }),
  calculateOutcome: (state) => state.flags.mitigated ? "excellent-containment" : undefined,
  calculateScore: (state) => state.flags.mitigated ? 100 : 0,
};

describe("generic incident engine", () => {
  it("creates state through the supplied scenario", () => {
    expect(createInitialIncident(scenario)).toEqual(scenario.createInitialState());
  });

  it("applies generic costs and scenario-specific effects", () => {
    const result = applyIncidentAction(scenario.createInitialState(), scenario, "mitigate");

    expect(result.accepted).toBe(true);
    expect(result.state.currentMinute).toBe(2);
    expect(result.state.actionPoints).toBe(1);
    expect(result.state.flags.mitigated).toBe(true);
    expect(result.state.hypotheses).toContain("Synthetic cause");
    expect(result.state.timeline).toHaveLength(1);
    expect(result.state.status).toBe("resolved");
    expect(result.state.outcome).toBe("excellent-containment");
  });

  it("rejects duplicate actions without mutating state", () => {
    const first = applyIncidentAction(scenario.createInitialState(), scenario, "mitigate");
    const second = applyIncidentAction(first.state, scenario, "mitigate");

    expect(second.accepted).toBe(false);
    expect(second.state).toEqual(first.state);
  });
});
