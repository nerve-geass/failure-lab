import { describe, expect, it } from "vitest";
import { applyIncidentAction, createInitialIncident } from "@/domain/incident/incidentEngine";
import { memoryLeakDefinition } from "./definition";

const runActions = (ids: string[]) => ids.reduce((state, id) => applyIncidentAction(state, memoryLeakDefinition, id).state, createInitialIncident(memoryLeakDefinition));

describe("Memory Leak scenario", () => {
  it("starts with normal traffic and rising heap pressure", () => {
    const state = memoryLeakDefinition.createInitialState();
    expect(state.metrics.heapUsed.value).toBeGreaterThan(50);
    expect(state.metrics.heapGrowthRate.value).toBeGreaterThan(0);
    expect(state.metrics.requestRate.value).toBeGreaterThan(0);
    expect(state.timeline[0].title).toMatch(/heap|memory|growth/i);
  });

  it("offers profiling, restart, and traffic controls", () => {
    expect(memoryLeakDefinition.actions.map((action) => action.id)).toEqual(expect.arrayContaining(["inspect-memory-metrics", "inspect-heap-profile", "restart-workers", "limit-cache", "shed-traffic"]));
  });

  it("shows heap growth after inspecting memory metrics", () => {
    const state = runActions(["inspect-memory-metrics"]);
    expect(state.hypotheses).toContain("Post-GC heap continues to grow");
    expect(state.timeline.at(-1)?.title).toMatch(/heap|GC|memory/i);
  });

  it("reveals retained objects through heap profiling", () => {
    const state = runActions(["inspect-memory-metrics", "inspect-heap-profile"]);
    expect(state.hypotheses).toContain("A retained cache path is leaking memory");
  });

  it("makes cache limiting a safe containment path", () => {
    const initialHeap = memoryLeakDefinition.createInitialState().metrics.heapUsed.value;
    const state = runActions(["inspect-memory-metrics", "limit-cache", "advance-time"]);
    expect(state.status).toBe("resolved");
    expect(state.metrics.heapUsed.value).toBeLessThan(initialHeap + 15);
  });

  it("makes restart recover memory but lose in-flight work", () => {
    const initialHeap = memoryLeakDefinition.createInitialState().metrics.heapUsed.value;
    const state = runActions(["restart-workers"]);
    expect(state.flags.workersRestarted).toBe(true);
    expect(state.metrics.heapUsed.value).toBeLessThan(initialHeap);
    expect(state.timeline.at(-1)?.description).toMatch(/work|request/i);
  });

  it("makes added memory a temporary recovery rather than a root-cause fix", () => {
    const state = runActions(["increase-memory", "advance-time", "advance-time"]);
    expect(state.status).not.toBe("resolved");
    expect(state.metrics.heapGrowthRate.value).toBeGreaterThan(0);
  });
});
