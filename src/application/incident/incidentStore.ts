import { create } from "zustand";
import { createInitialIncident } from "@/domain/incident/createInitialIncident";
import type { IncidentState } from "@/domain/incident/types";
import { createIncidentApplication } from "./incidentApplication";
import { getScenario, scenarioRegistry } from "@/domain/scenario/registry";
import type { ScenarioDefinition } from "@/domain/scenario/types";
import { createLocalStorageIncidentPersistence } from "@/infrastructure/persistence/localStorageIncidentPersistence";
import type { IncidentPersistence } from "@/infrastructure/persistence/incidentPersistence";

export type AppScreen = "landing" | "briefing" | "incident" | "report";

type Toast = { message: string; tone: "info" | "success" | "warning" } | null;

export type IncidentStore = {
  screen: AppScreen;
  incident: IncidentState;
  scenario: ScenarioDefinition;
  selectedNodeId: string | null;
  pendingActionId: string | null;
  toast: Toast;
  startInvestigation: () => void;
  enterIncident: () => void;
  requestAction: (actionId: string) => void;
  confirmAction: () => void;
  cancelAction: () => void;
  restart: () => void;
  goToLanding: () => void;
  selectScenario: (scenarioId: string) => void;
  selectNode: (nodeId: string | null) => void;
  restore: () => void;
};

const defaultPersistence = (): IncidentPersistence => typeof window === "undefined"
  ? { load: () => null, save: () => undefined, clear: () => undefined }
  : createLocalStorageIncidentPersistence(window.localStorage);

export function createIncidentStore(persistence: IncidentPersistence = defaultPersistence()) {
  const application = createIncidentApplication(persistence, scenarioRegistry);
  const defaultScenario = getScenario(scenarioRegistry, "retry-storm");
  if (!defaultScenario) throw new Error("Retry Storm scenario is not registered.");
  return create<IncidentStore>((set, get) => ({
    screen: "landing",
    incident: createInitialIncident(defaultScenario),
    scenario: defaultScenario,
    selectedNodeId: null,
    pendingActionId: null,
    toast: null,
    startInvestigation: () => set({ screen: "briefing", incident: application.startIncident(get().scenario.id), toast: null }),
    enterIncident: () => set({ screen: "incident" }),
    requestAction: (actionId) => set({ pendingActionId: actionId }),
    confirmAction: () => {
      const actionId = get().pendingActionId;
      if (!actionId) return;
      const result = application.performIncidentAction(get().incident, actionId);
      set({
        incident: result.state,
        pendingActionId: null,
        toast: { message: result.message, tone: result.accepted ? "success" : "warning" },
        screen: result.state.status === "resolved" || result.state.status === "failed" ? "report" : get().screen,
      });
    },
    cancelAction: () => set({ pendingActionId: null }),
    restart: () => set({ screen: "briefing", incident: application.restartIncident(get().scenario.id), pendingActionId: null, selectedNodeId: null, toast: null }),
    goToLanding: () => set({ screen: "landing", pendingActionId: null, selectedNodeId: null, toast: null }),
    selectScenario: (scenarioId) => { const scenario = getScenario(scenarioRegistry, scenarioId); if (scenario) set({ scenario, incident: scenario.createInitialState(), screen: "briefing", toast: null }); },
    selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
    restore: () => {
      const restored = application.restoreIncident();
      if (restored) { const scenario = getScenario(scenarioRegistry, restored.scenarioId) ?? defaultScenario; set({ incident: restored, scenario, screen: restored.status === "resolved" || restored.status === "failed" ? "report" : "incident" }); }
    },
  }));
}

export const useIncidentStore = createIncidentStore();
