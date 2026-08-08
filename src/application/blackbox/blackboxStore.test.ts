import { describe, expect, it } from "vitest";
import { createBlackboxStore } from "./blackboxStore";

describe("blackbox store", () => {
  it("starts with public signals and no hidden cause", () => {
    const store = createBlackboxStore(42, "intermediate");

    expect(store.getState().observation.surfaces.length).toBeGreaterThan(0);
    expect(JSON.stringify(store.getState().observation)).not.toContain("hiddenCause");
  });

  it("applies actions and exposes their observable consequences", () => {
    const store = createBlackboxStore(42, "intermediate");
    store.getState().performAction("probe-checkout");

    expect(store.getState().observation.currentMinute).toBe(1);
    expect(store.getState().observation.timeline[0].title).toBe("Checkout probe completed");
  });
});
