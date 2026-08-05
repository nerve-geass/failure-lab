import { describe, expect, it } from "vitest";
import { createInitialIncident } from "./createInitialIncident";
import { retryStormScenario } from "../scenario/retryStorm";
import { applyIncidentAction as applyWithScenario } from "./applyIncidentAction";
import { retryStormDefinition } from "../scenario/retry-storm/definition";
import { calculateRetryStormOutcome as calculateOutcome } from "../scenario/retry-storm/calculateOutcome";
import { calculateRetryStormScore as calculateScore, scoreLabel } from "../scenario/retry-storm/calculateScore";

const createRetryStormIncident = () => createInitialIncident(retryStormDefinition);
const applyIncidentAction = (state: ReturnType<typeof createRetryStormIncident>, actionId: string) => applyWithScenario(state, retryStormDefinition, actionId);

describe("Retry Storm initial incident", () => {
  it("exposes Retry Storm through the generic scenario contract", () => {
    const state = retryStormDefinition.createInitialState();
    const result = retryStormDefinition.resolveAction(state, retryStormDefinition.actions.find((action) => action.id === "disable-retries")!, { prerequisitesMet: true, missingPrerequisites: [] });

    expect(state.scenarioId).toBe("retry-storm");
    expect(result.flags.retriesDisabled).toBe(true);
    expect(retryStormDefinition.calculateScore(state)).toBe(20);
  });

  it("starts at 09:42 with the README baseline", () => {
    const state = createRetryStormIncident();

    expect(state.currentMinute).toBe(0);
    expect(state.actionPoints).toBe(6);
    expect(state.flags.retriesDisabled).toBe(false);
    expect(state.metrics.paymentSuccessRate.value).toBe(94);
    expect(state.metrics.checkoutLatency.value).toBe(1.8);
    expect(state.metrics.paymentCpu.value).toBe(43);
    expect(state.metrics.paymentMemory.value).toBe(51);
    expect(state.metrics.queueDepth.value).toBe(1240);
    expect(state.metrics.providerTimeoutRate.value).toBe(6);
    expect(state.metrics.retryRate.value).toBe(320);
    expect(state.metrics.openConnections.value).toBe(68);
  });

  it("contains the seven connected system nodes and all initial actions", () => {
    const state = createRetryStormIncident();

    expect(Object.keys(retryStormScenario.nodes)).toHaveLength(7);
    expect(retryStormScenario.connections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: "web-checkout", to: "checkout-api" }),
        expect.objectContaining({ from: "payment-orchestrator", to: "payment-provider" }),
      ]),
    );
    expect(retryStormScenario.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "inspect-deployment" }),
        expect.objectContaining({ id: "disable-retries" }),
        expect.objectContaining({ id: "enable-circuit-breaker" }),
      ]),
    );
    expect(state.nodeStatuses["payment-provider"]).toBe("warning");
    expect(state.status).toBe("active");
  });
});

describe("Retry Storm deterministic actions", () => {
  it("charges time and points, and unlocks deployment findings", () => {
    const result = applyIncidentAction(createRetryStormIncident(), "inspect-deployment");

    expect(result.accepted).toBe(true);
    expect(result.state.currentMinute).toBe(2);
    expect(result.state.actionPoints).toBe(5);
    expect(result.state.flags.deploymentInspected).toBe(true);
    expect(result.state.completedActionIds).toContain("inspect-deployment");
    expect(result.state.hypotheses).toContain("Retry configuration changed");
  });

  it("keeps provider traces locked until a relevant signal is inspected", () => {
    const initial = applyIncidentAction(createRetryStormIncident(), "inspect-provider-traces");

    expect(initial.accepted).toBe(false);
    expect(initial.state.currentMinute).toBe(0);

    const unlocked = applyIncidentAction(createRetryStormIncident(), "inspect-queue");
    const traces = applyIncidentAction(unlocked.state, "inspect-provider-traces");

    expect(traces.accepted).toBe(true);
    expect(traces.state.flags.providerTracesInspected).toBe(true);
    expect(traces.state.hypotheses).toContain("Downstream instability");
    expect(traces.state.metrics.providerTimeoutRate.value).toBeGreaterThan(6);
  });

  it("makes mitigation possible before perfect diagnosis", () => {
    const disabled = applyIncidentAction(createRetryStormIncident(), "disable-retries");
    const contained = applyIncidentAction(disabled.state, "enable-circuit-breaker");

    expect(contained.state.flags.retriesDisabled).toBe(true);
    expect(contained.state.flags.circuitBreakerEnabled).toBe(true);
    expect(contained.state.metrics.openConnections.value).toBeLessThan(90);
    expect(calculateOutcome(contained.state)).toBe("excellent-containment");
  });

  it("makes scaling workers worsen an active retry storm", () => {
    const scaled = applyIncidentAction(createRetryStormIncident(), "scale-workers");

    expect(scaled.state.flags.workersScaled).toBe(true);
    expect(scaled.state.metrics.retryRate.value).toBeGreaterThan(320);
    expect(scaled.state.metrics.queueDepth.value).toBeGreaterThan(1240);
  });

  it("rejects a second use of a non-repeatable action", () => {
    const first = applyIncidentAction(createRetryStormIncident(), "inspect-queue");
    const second = applyIncidentAction(first.state, "inspect-queue");

    expect(second.accepted).toBe(false);
    expect(second.state.actionPoints).toBe(5);
  });
});

describe("Retry Storm outcomes", () => {
  it("classifies partial recovery when retries stop without isolation", () => {
    const result = applyIncidentAction(createRetryStormIncident(), "disable-retries");

    expect(calculateOutcome(result.state)).toBe("partial-recovery");
  });

  it("classifies paused traffic as emergency containment", () => {
    const result = applyIncidentAction(createRetryStormIncident(), "pause-checkout");

    expect(calculateOutcome(result.state)).toBe("emergency-containment");
  });

  it("classifies an exhausted connection pool as major outage", () => {
    let state = createRetryStormIncident();
    for (const actionId of ["scale-workers", "increase-queue-retention", "inspect-queue", "inspect-deployment", "rollback-deployment"]) {
      state = applyIncidentAction(state, actionId).state;
    }

    expect(state.metrics.openConnections.value).toBeGreaterThanOrEqual(100);
    expect(calculateOutcome(state)).toBe("major-outage");
    expect(state.status).toBe("failed");
  });
});

describe("Retry Storm scoring", () => {
  it("rewards the excellent containment path", () => {
    let state = createRetryStormIncident();
    state = applyIncidentAction(state, "inspect-deployment").state;
    state = applyIncidentAction(state, "inspect-provider-traces").state;
    state = applyIncidentAction(state, "disable-retries").state;
    state = applyIncidentAction(state, "enable-circuit-breaker").state;

    expect(calculateScore(state)).toBeGreaterThanOrEqual(90);
    expect(scoreLabel(calculateScore(state))).toBe("Incident Commander");
  });

  it("clamps poor responses to zero and labels them clearly", () => {
    const state = applyIncidentAction(createRetryStormIncident(), "scale-workers").state;

    expect(calculateScore({ ...state, metrics: { ...state.metrics, openConnections: { ...state.metrics.openConnections, value: 100 } } })).toBe(0);
    expect(scoreLabel(42)).toBe("Failure Chain Unbroken");
  });
});
