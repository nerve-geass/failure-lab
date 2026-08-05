import { describe, expect, it } from "vitest";
import { createInitialIncident } from "@/domain/incident/createInitialIncident";
import { retryStormDefinition } from "@/domain/scenario/retry-storm/definition";
import { createLocalStorageIncidentPersistence } from "./localStorageIncidentPersistence";

describe("localStorage incident persistence", () => {
  it("round-trips a valid incident snapshot", () => {
    const persistence = createLocalStorageIncidentPersistence(window.localStorage);
    const state = createInitialIncident(retryStormDefinition);
    state.currentMinute = 4;

    persistence.save(state);

    expect(persistence.load()?.currentMinute).toBe(4);
  });

  it("ignores malformed storage and keeps the app recoverable", () => {
    window.localStorage.setItem("failure-lab:retry-storm:v1", "not-json");
    const persistence = createLocalStorageIncidentPersistence(window.localStorage);

    expect(persistence.load()).toBeNull();
  });
});
