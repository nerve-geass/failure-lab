import type { IncidentState } from "@/domain/incident/types";

export interface IncidentPersistence {
  load(): IncidentState | null;
  save(state: IncidentState): void;
  clear(): void;
}
