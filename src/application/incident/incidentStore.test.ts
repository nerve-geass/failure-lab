import { describe, expect, it } from "vitest";
import { createIncidentStore } from "./incidentStore";
import type { IncidentState } from "@/domain/incident/types";
import type { IncidentPersistence } from "@/infrastructure/persistence/incidentPersistence";

function memoryPersistence(): IncidentPersistence & { value: IncidentState | null } {
  return {
    value: null,
    load() { return this.value; },
    save(state) { this.value = state; },
    clear() { this.value = null; },
  };
}

describe("incident store catalog transitions", () => {
  it("restores a saved incident while keeping the catalog visible", () => {
    const persistence = memoryPersistence();
    const store = createIncidentStore(persistence);
    store.getState().startInvestigation();

    const restoredStore = createIncidentStore(persistence);
    restoredStore.getState().restore();

    expect(restoredStore.getState().screen).toBe("landing");
    expect(restoredStore.getState().hasSavedIncident).toBe(true);
  });

  it("selects a scenario and starts it through briefing", () => {
    const persistence = memoryPersistence();
    const store = createIncidentStore(persistence);
    store.getState().selectScenario("cache-stampede");

    expect(store.getState().screen).toBe("briefing");
    expect(store.getState().scenario.id).toBe("cache-stampede");
    expect(store.getState().hasSavedIncident).toBe(false);
    expect(persistence.load()).toBeNull();
  });

  it("returns to the catalog with no saved snapshot after abandonment", () => {
    const persistence = memoryPersistence();
    const store = createIncidentStore(persistence);
    store.getState().startInvestigation();
    store.getState().abandonInvestigation();

    expect(store.getState().screen).toBe("landing");
    expect(store.getState().hasSavedIncident).toBe(false);
    expect(persistence.load()).toBeNull();
  });
});
