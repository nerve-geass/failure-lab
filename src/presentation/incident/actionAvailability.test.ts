import { describe, expect, it } from "vitest";
import type { IncidentAction } from "@/domain/incident/types";
import { getActionAvailability } from "./actionAvailability";

const actions: IncidentAction[] = [
  { id: "inspect-cache", title: "Inspect cache metrics", description: "", consequence: "", actionPointCost: 1, timeCostMinutes: 1 },
  { id: "warm-cache", title: "Warm the cache", description: "", consequence: "", actionPointCost: 1, timeCostMinutes: 2, prerequisites: ["inspect-cache", "inspect-deployment"], prerequisiteMode: "any" },
  { id: "inspect-deployment", title: "Inspect recent deployment", description: "", consequence: "", actionPointCost: 1, timeCostMinutes: 1 },
  { id: "throttle", title: "Throttle traffic", description: "", consequence: "", actionPointCost: 2, timeCostMinutes: 1 },
];

describe("action availability explanations", () => {
  it("explains which signal can unlock a prerequisite action", () => {
    expect(getActionAvailability(actions[1], actions, [], 6)).toEqual({ available: false, reason: "Requires: Inspect cache metrics or Inspect recent deployment" });
  });

  it("explains when an action is already complete", () => {
    expect(getActionAvailability(actions[0], actions, ["inspect-cache"], 6)).toEqual({ available: false, reason: "Action already completed" });
  });

  it("explains when the investigation budget is insufficient", () => {
    expect(getActionAvailability(actions[3], actions, [], 1)).toEqual({ available: false, reason: "Requires 2 action points" });
  });

  it("returns no reason for an available action", () => {
    expect(getActionAvailability(actions[0], actions, [], 6)).toEqual({ available: true });
  });

  it("keeps prerequisite actions available under a soft policy", () => {
    expect(getActionAvailability(actions[1], actions, [], 6, "soft")).toEqual({ available: true });
  });
});
