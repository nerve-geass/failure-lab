import { describe, expect, it } from "vitest";
import { applyIncidentAction } from "@/domain/incident/incidentEngine";
import { connectionPoolExhaustionDefinition } from "./definition";

const start = () => connectionPoolExhaustionDefinition.createInitialState();
const act = (state: ReturnType<typeof start>, actionId: string) => applyIncidentAction(state, connectionPoolExhaustionDefinition, actionId);

describe("Connection Pool Exhaustion scenario", () => {
  it("starts with pool pressure visible while CPU remains ordinary", () => {
    const state = start();
    expect(state.scenarioId).toBe("connection-pool-exhaustion");
    expect(state.actionPoints).toBe(6);
    expect(state.metrics.poolUtilization.value).toBe(74);
    expect(state.metrics.poolWait.value).toBe(420);
    expect(state.metrics.leakedConnections.value).toBe(0.8);
    expect(Object.keys(connectionPoolExhaustionDefinition.nodes)).toHaveLength(7);
  });

  it("requires pool evidence before leak detection", () => {
    const locked = act(start(), "enable-leak-detection");
    const inspected = act(start(), "inspect-pool");
    const unlocked = act(inspected.state, "enable-leak-detection");
    expect(locked.accepted).toBe(false);
    expect(unlocked.accepted).toBe(true);
    expect(unlocked.state.flags.leakDetectionEnabled).toBe(true);
  });

  it("reaches excellent containment by detecting leaks and capping concurrency", () => {
    let state = act(start(), "inspect-pool").state;
    state = act(state, "enable-leak-detection").state;
    const result = act(state, "cap-concurrency");
    expect(result.state.metrics.poolUtilization.value).toBeLessThan(90);
    expect(result.state.outcome).toBe("excellent-containment");
    expect(result.state.status).toBe("resolved");
    expect(result.state.score).toBeGreaterThanOrEqual(90);
  });

  it("shows that restarting workers only provides partial recovery", () => {
    const inspected = act(start(), "inspect-pool");
    const restarted = act(inspected.state, "restart-workers");
    expect(restarted.state.flags.workersRestarted).toBe(true);
    expect(restarted.state.outcome).toBe("partial-recovery");
  });

  it("makes increasing the pool size exhaust the database capacity", () => {
    const inspected = act(start(), "inspect-pool");
    const resized = act(inspected.state, "increase-pool-size");
    expect(resized.state.metrics.poolUtilization.value).toBeGreaterThanOrEqual(100);
    expect(resized.state.outcome).toBe("major-outage");
    expect(resized.state.status).toBe("failed");
  });

  it("classifies shedding traffic as emergency containment", () => {
    const result = act(start(), "shed-traffic");
    expect(result.state.outcome).toBe("emergency-containment");
    expect(result.state.status).toBe("resolved");
  });
});
