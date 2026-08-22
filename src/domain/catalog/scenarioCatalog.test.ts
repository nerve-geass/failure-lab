import { describe, expect, it } from "vitest";
import { scenarioCatalog } from "./scenarioCatalog";

describe("learning scenario catalog", () => {
  it("contains ten scenarios in a deliberate learning order", () => {
    expect(scenarioCatalog).toHaveLength(10);
    expect(scenarioCatalog.map((scenario) => scenario.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(scenarioCatalog[0].id).toBe("retry-storm");
    expect(scenarioCatalog[0].status).toBe("available");
  });

  it("keeps advanced scenarios dependent on earlier concepts", () => {
    const distributedIncident = scenarioCatalog.find((scenario) => scenario.id === "distributed-incident");

    expect(distributedIncident?.difficulty).toBe("Advanced");
    expect(distributedIncident?.prerequisites).toEqual(["retry-storm", "cascading-failure"]);
    expect(distributedIncident?.concepts).toContain("incident command");
  });

  it("marks only implemented scenarios as available", () => {
    expect(scenarioCatalog.filter((scenario) => scenario.status === "available").map((scenario) => scenario.id)).toEqual(["retry-storm", "cache-stampede", "queue-consumer-lag", "connection-pool-exhaustion", "bad-deployment"]);
    expect(scenarioCatalog.filter((scenario) => scenario.status === "planned")).toHaveLength(5);
  });
});
