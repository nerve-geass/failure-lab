import type { Connection, IncidentAction, IncidentEvent, IncidentState, Metric, NodeStatus, OutcomeId, SystemNode } from "@/domain/incident/types";

export type ScenarioContent = {
  startMinute: number;
  durationMinutes: number;
  difficulty: string;
  impact: { metricId: string; growingAt: number; highAt: number; severeFlag?: string };
  topologyNote: string;
  briefing: {
    eyebrow: string;
    title: string;
    description: string;
    objective: string;
    capability: string;
    learning: string;
  };
  report: {
    rootCauseTitle: string;
    rootCauseDescription: string;
    bestIntervention: string;
    missedOpportunities: { flag: string; label: string }[];
  };
  outcomeMessages: Partial<Record<OutcomeId, { eyebrow: string; title: string; body: string; tone: string }>>;
};

export type ScenarioActionEffect = {
  flags: Record<string, boolean>;
  hypotheses: string[];
  events: IncidentEvent[];
  message?: string;
};

export type ScenarioActionContext = {
  prerequisitesMet: boolean;
  missingPrerequisites: string[];
};

export type DerivedIncidentState = {
  metrics: Record<string, Metric>;
  nodeStatuses: Record<string, NodeStatus>;
};

export type ScenarioDefinition = {
  id: string;
  seed?: number;
  title: string;
  summary: string;
  nodes: Record<string, SystemNode>;
  connections: Connection[];
  actions: IncidentAction[];
  concepts: string[];
  content: ScenarioContent;
  prerequisitePolicy?: "hard" | "soft";
  createInitialState(): IncidentState;
  resolveAction(state: IncidentState, action: IncidentAction, context: ScenarioActionContext): ScenarioActionEffect;
  deriveState(state: IncidentState): DerivedIncidentState;
  calculateOutcome(state: IncidentState): OutcomeId | undefined;
  calculateScore(state: IncidentState): number;
};
