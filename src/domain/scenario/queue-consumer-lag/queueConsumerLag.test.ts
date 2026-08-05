import { describe, expect, it } from "vitest";
import { applyIncidentAction } from "@/domain/incident/incidentEngine";
import { queueConsumerLagDefinition } from "./definition";

const start = () => queueConsumerLagDefinition.createInitialState();
const act = (state: ReturnType<typeof start>, actionId: string) => applyIncidentAction(state, queueConsumerLagDefinition, actionId);

describe("Queue Consumer Lag scenario", () => {
  it("starts at 11:03 with lag and queue pressure visible", () => {
    const state = start();

    expect(state.scenarioId).toBe("queue-consumer-lag");
    expect(state.currentMinute).toBe(0);
    expect(state.actionPoints).toBe(6);
    expect(state.metrics.queueDepth.value).toBe(4200);
    expect(state.metrics.consumerLag.value).toBe(38);
    expect(state.metrics.consumerThroughput.value).toBe(5200);
    expect(Object.keys(queueConsumerLagDefinition.nodes)).toHaveLength(7);
  });

  it("requires signal inspection before scaling consumers", () => {
    const locked = act(start(), "scale-consumers");
    const inspected = act(start(), "inspect-queue");
    const unlocked = act(inspected.state, "scale-consumers");

    expect(locked.accepted).toBe(false);
    expect(unlocked.accepted).toBe(true);
    expect(unlocked.state.flags.consumersScaled).toBe(true);
  });

  it("reaches excellent containment through scaling and backpressure", () => {
    let state = start();
    for (const actionId of ["inspect-queue", "inspect-consumers", "scale-consumers"]) state = act(state, actionId).state;
    const result = act(state, "apply-backpressure");

    expect(result.state.metrics.queueDepth.value).toBeLessThan(12000);
    expect(result.state.outcome).toBe("excellent-containment");
    expect(result.state.status).toBe("resolved");
    expect(result.state.score).toBeGreaterThanOrEqual(90);
  });

  it("makes replaying the retry queue during lag worsen pressure", () => {
    const inspected = act(start(), "inspect-queue");
    const replayed = act(inspected.state, "replay-retry-queue");

    expect(replayed.accepted).toBe(true);
    expect(replayed.state.metrics.queueDepth.value).toBeGreaterThan(inspected.state.metrics.queueDepth.value);
    expect(replayed.state.flags.retryQueueReplayed).toBe(true);
  });

  it("classifies pausing producers as emergency containment", () => {
    const result = act(start(), "pause-producers");

    expect(result.state.outcome).toBe("emergency-containment");
    expect(result.state.status).toBe("resolved");
  });

  it("classifies an overloaded queue as a major outage", () => {
    let state = start();
    for (const actionId of ["inspect-queue", "replay-retry-queue", "inspect-consumers", "increase-batch-size"]) state = act(state, actionId).state;

    expect(state.metrics.queueDepth.value).toBeGreaterThanOrEqual(20000);
    expect(state.outcome).toBe("major-outage");
    expect(state.status).toBe("failed");
  });
});
