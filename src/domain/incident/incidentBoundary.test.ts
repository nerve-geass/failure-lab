import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const genericIncidentModules = [
  "applyIncidentAction.ts",
  "createInitialIncident.ts",
];

describe("generic incident module boundaries", () => {
  it("do not import the concrete Retry Storm scenario", () => {
    for (const moduleName of genericIncidentModules) {
      const source = readFileSync(resolve(process.cwd(), "src/domain/incident", moduleName), "utf8");

      expect(source, moduleName).not.toMatch(/retryStorm|retry-storm/);
    }
  });
});
