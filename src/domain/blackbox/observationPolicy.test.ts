import { describe, expect, it } from "vitest";
import { createObservationPolicy } from "./observationPolicy";

describe("Blackbox observation policies", () => {
  it("projects only allowed surfaces for each difficulty", () => {
    expect(createObservationPolicy("beginner").visibleSurfaces).toEqual(["dashboard", "alert-feed"]);
    expect(createObservationPolicy("blackbox").visibleSurfaces).toEqual(["endpoint", "service-console"]);
  });

  it("keeps advanced feedback non-guiding", () => {
    expect(createObservationPolicy("advanced")).toMatchObject({
      revealHints: false,
      allowTentativeActions: true,
      feedbackFidelity: "minimal",
    });
  });
});
