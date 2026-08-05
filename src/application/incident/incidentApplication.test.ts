import { describe, expect, it } from "vitest";
import { createInitialIncident } from "@/domain/incident/createInitialIncident";
import type { IncidentPersistence } from "@/infrastructure/persistence/incidentPersistence";
import { createIncidentApplication } from "./incidentApplication";
import { scenarioRegistry } from "@/domain/scenario/registry";
import { retryStormDefinition } from "@/domain/scenario/retry-storm/definition";

function memoryPersistence(): IncidentPersistence & { value: ReturnType<typeof createInitialIncident> | null } {
  return {
    value: null,
    load() { return this.value; },
    save(state) { this.value = state; },
    clear() { this.value = null; },
  };
}

describe("incident application", () => {
  it("starts, applies an action, and persists the new state", () => {
    const persistence = memoryPersistence();
    const application = createIncidentApplication(persistence, scenarioRegistry);

    const started = application.startIncident("retry-storm");
    const result = application.performIncidentAction(started, "inspect-deployment");

    expect(result.accepted).toBe(true);
    expect(result.state.currentMinute).toBe(2);
    expect(persistence.value?.completedActionIds).toContain("inspect-deployment");
  });

  it("restores a snapshot and resets it through restart", () => {
    const persistence = memoryPersistence();
    const application = createIncidentApplication(persistence, scenarioRegistry);
    const started = application.startIncident();
    application.performIncidentAction(started, "inspect-queue");

    expect(application.restoreIncident()?.currentMinute).toBe(1);
    expect(application.restartIncident().currentMinute).toBe(0);
    expect(persistence.value?.completedActionIds).toEqual([]);
  });

  it("migrates a legacy snapshot without scenarioId to Retry Storm", () => {
    const persistence = memoryPersistence();
    const legacy = createInitialIncident(retryStormDefinition) as Omit<ReturnType<typeof createInitialIncident>, "scenarioId"> & { scenarioId?: string };
    delete legacy.scenarioId;
    persistence.save(legacy as ReturnType<typeof createInitialIncident>);
    const application = createIncidentApplication(persistence, scenarioRegistry);

    expect(application.restoreIncident()?.scenarioId).toBe("retry-storm");
  });
});
