import { describe, expect, it } from "vitest";
import { applyIncidentAction, createInitialIncident } from "@/domain/incident/incidentEngine";
import { badDeploymentDefinition } from "./definition";

const runActions = (ids: string[]) => ids.reduce((state, id) => applyIncidentAction(state, badDeploymentDefinition, id).state, createInitialIncident(badDeploymentDefinition));

describe("Bad Deployment scenario", () => {
  it("starts with partial rollout symptoms rather than global failure", () => {
    const state = badDeploymentDefinition.createInitialState();
    expect(state.metrics).toEqual(expect.objectContaining({
      checkoutErrorRate: expect.any(Object),
      checkoutLatencyP95: expect.any(Object),
    }));
    expect(state.timeline[0].title).toMatch(/release|deploy/i);
  });

  it("exposes deployment investigation before rollback", () => {
    expect(badDeploymentDefinition.actions.find((action) => action.id === "inspect-deployment")).toBeDefined();
    expect(badDeploymentDefinition.actions.find((action) => action.id === "rollback-deployment")).toBeDefined();
  });

  it("reveals partial blast radius after deployment inspection", () => {
    const state = runActions(["inspect-deployment"]);
    expect(state.hypotheses).toContain("Partial rollout regression");
    expect(state.timeline.at(-1)?.title).toMatch(/canary|rollout|release/i);
  });

  it("makes disabling the changed behavior a safe mitigation", () => {
    const initialErrorRate = badDeploymentDefinition.createInitialState().metrics.checkoutErrorRate.value as number;
    const state = runActions(["inspect-deployment", "disable-feature"]);
    expect(state.status).not.toBe("failed");
    expect(state.metrics.checkoutErrorRate.value).toBeLessThan(initialErrorRate);
  });

  it("makes a premature rollback produce an observable complication", () => {
    const state = runActions(["rollback-deployment"]);
    expect(state.timeline.at(-1)?.title).toMatch(/rollback|migration|mixed/i);
    expect(state.metrics.checkoutErrorRate.value).toBeGreaterThan(badDeploymentDefinition.createInitialState().metrics.checkoutErrorRate.value);
  });

  it("can reach a stabilized outcome through mitigation", () => {
    const state = runActions(["inspect-deployment", "disable-feature", "advance-time"]);
    expect(state.status).toBe("resolved");
  });
});
