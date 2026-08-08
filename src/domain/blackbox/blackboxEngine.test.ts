import { describe, expect, it } from "vitest";
import { applyBlackboxAction, createBlackboxSession, observe } from "./blackboxEngine";
import { createObservationPolicy } from "./observationPolicy";

describe("Blackbox engine", () => {
  it("recreates the same observations from the same seed", () => {
    const first = createBlackboxSession(42, createObservationPolicy("intermediate"));
    const second = createBlackboxSession(42, createObservationPolicy("intermediate"));

    expect(observe(first)).toEqual(observe(second));
  });

  it("does not expose hidden cause through observations", () => {
    const session = createBlackboxSession(42, createObservationPolicy("blackbox"));
    const observation = observe(session);

    expect(JSON.stringify(observation)).not.toContain("hiddenCause");
    expect(JSON.stringify(observation)).not.toContain("database saturation");
  });

  it("returns observable consequences after an action", () => {
    const session = createBlackboxSession(42, createObservationPolicy("intermediate"));
    const result = applyBlackboxAction(session, { id: "probe-checkout", input: "GET /checkout" });

    expect(result.accepted).toBe(true);
    expect(result.observation.surfaces.length).toBeGreaterThan(0);
    expect(result.observation.timeline[0].title).toMatch(/checkout/i);
  });
});
