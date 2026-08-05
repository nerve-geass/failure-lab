import type { IncidentState } from "@/domain/incident/types";
import type { IncidentPersistence } from "./incidentPersistence";

export const INCIDENT_STORAGE_KEY = "failure-lab:retry-storm:v1";

function isIncidentState(value: unknown): value is IncidentState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<IncidentState>;
  return typeof candidate.currentMinute === "number"
    && typeof candidate.actionPoints === "number"
    && typeof candidate.status === "string"
    && Array.isArray(candidate.completedActionIds)
    && typeof candidate.flags === "object"
    && candidate.flags !== null;
}

export function createLocalStorageIncidentPersistence(storage: Storage): IncidentPersistence {
  return {
    load() {
      try {
        const raw = storage.getItem(INCIDENT_STORAGE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return isIncidentState(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    save(state) {
      try { storage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(state)); } catch { /* persistence is best effort */ }
    },
    clear() {
      try { storage.removeItem(INCIDENT_STORAGE_KEY); } catch { /* persistence is best effort */ }
    },
  };
}
