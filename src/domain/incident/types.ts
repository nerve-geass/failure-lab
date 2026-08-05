export type NodeStatus = "healthy" | "warning" | "critical" | "isolated" | "recovering";
export type Severity = "info" | "warning" | "critical" | "success";
export type Trend = "up" | "down" | "flat";
export type IncidentStatus = "briefing" | "active" | "resolved" | "failed";
export type OutcomeId = "excellent-containment" | "partial-recovery" | "emergency-containment" | "major-outage";

export type SystemNode = {
  id: string;
  name: string;
  description: string;
};

export type Connection = { from: string; to: string };

export type Metric = {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: Trend;
  severity: Severity;
  explanation?: string;
};

export type IncidentEvent = {
  id: string;
  minute: number;
  title: string;
  description: string;
  severity: Severity;
  relatedNodeIds: string[];
};

export type IncidentAction = {
  id: string;
  title: string;
  description: string;
  consequence: string;
  actionPointCost: number;
  timeCostMinutes: number;
  prerequisites?: string[];
  prerequisiteMode?: "all" | "any";
  repeatable?: boolean;
};

export type IncidentFlags = {
  deploymentInspected: boolean;
  queueInspected: boolean;
  providerTracesInspected: boolean;
  rollbackApplied: boolean;
  retriesDisabled: boolean;
  circuitBreakerEnabled: boolean;
  workersScaled: boolean;
  queueRetentionIncreased: boolean;
  trafficPaused: boolean;
};

export type IncidentState = {
  scenarioId: string;
  currentMinute: number;
  actionPoints: number;
  flags: Record<string, boolean>;
  metrics: Record<string, Metric>;
  nodeStatuses: Record<string, NodeStatus>;
  completedActionIds: string[];
  hypotheses: string[];
  timeline: IncidentEvent[];
  status: IncidentStatus;
  outcome?: OutcomeId;
  score?: number;
};

export type RetryStormScenario = {
  id: string;
  title: string;
  nodes: Record<string, SystemNode>;
  connections: Connection[];
  actions: IncidentAction[];
  initialMetrics: Record<string, Metric>;
  initialStatuses: Record<string, NodeStatus>;
  initialEvent: IncidentEvent;
  concepts: string[];
};

export type IncidentActionResult = {
  state: IncidentState;
  action: IncidentAction;
  accepted: boolean;
  message: string;
};
