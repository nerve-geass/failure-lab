import { describe, expect, it } from "vitest";
import { applyIncidentAction } from "@/domain/incident/incidentEngine";
import { cacheStampedeDefinition } from "./definition";

const start = () => cacheStampedeDefinition.createInitialState();
const act = (state: ReturnType<typeof start>, actionId: string) => applyIncidentAction(state, cacheStampedeDefinition, actionId);

describe("Cache Stampede scenario", () => {
  it("starts at 10:16 with cache and database pressure visible", () => {
    const state = start();

    expect(state.scenarioId).toBe("cache-stampede");
    expect(state.currentMinute).toBe(0);
    expect(state.actionPoints).toBe(6);
    expect(state.metrics.cacheHitRate.value).toBe(71);
    expect(state.metrics.databaseLatency.value).toBe(180);
    expect(state.metrics.databaseConnections.value).toBe(62);
    expect(Object.keys(cacheStampedeDefinition.nodes)).toHaveLength(7);
  });

  it("unlocks database metrics after inspecting a relevant signal", () => {
    const locked = act(start(), "inspect-database-metrics");
    const inspected = act(start(), "inspect-cache-metrics");
    const unlocked = act(inspected.state, "inspect-database-metrics");

    expect(locked.accepted).toBe(false);
    expect(unlocked.accepted).toBe(true);
    expect(unlocked.state.flags.databaseMetricsInspected).toBe(true);
    expect(unlocked.state.hypotheses).toContain("Database load is absorbing the misses");
  });

  it("reaches excellent containment by warming the cache and coalescing misses", () => {
    let state = start();
    state = act(state, "inspect-cache-metrics").state;
    state = act(state, "warm-cache").state;
    const result = act(state, "enable-request-coalescing");

    expect(result.accepted).toBe(true);
    expect(result.state.metrics.databaseConnections.value).toBeLessThan(90);
    expect(result.state.outcome).toBe("excellent-containment");
    expect(result.state.status).toBe("resolved");
    expect(result.state.score).toBeGreaterThanOrEqual(90);
  });

  it("makes traffic throttling an emergency containment", () => {
    const result = act(start(), "throttle-catalog-traffic");

    expect(result.state.outcome).toBe("emergency-containment");
    expect(result.state.status).toBe("resolved");
  });

  it("classifies database saturation as a major outage", () => {
    let state = start();
    for (const actionId of ["inspect-cache-metrics", "inspect-deployment", "inspect-database-metrics", "rollback-deployment"]) {
      state = act(state, actionId).state;
    }

    expect(state.metrics.databaseConnections.value).toBeGreaterThanOrEqual(100);
    expect(state.outcome).toBe("major-outage");
    expect(state.status).toBe("failed");
  });
});
