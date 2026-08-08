import type { Severity } from "@/domain/incident/types";
import type { ScenarioSeed } from "@/domain/scenario/generation/types";

export type BlackboxDifficulty = "beginner" | "intermediate" | "advanced" | "blackbox";

export type ObservationSurfaceType = "dashboard" | "service-console" | "endpoint" | "trace-explorer" | "alert-feed";

export type Signal = {
  id: string;
  source: string;
  kind: "metric" | "alert" | "trace" | "endpoint" | "ui";
  title: string;
  value?: string | number;
  severity: Severity;
  explanation?: string;
};

export type ObservationSurface =
  | { type: "dashboard"; signals: Signal[] }
  | { type: "service-console"; serviceId: string; signals: Signal[] }
  | { type: "endpoint"; request: string; response: string; signals: Signal[] }
  | { type: "trace-explorer"; traces: Signal[] }
  | { type: "alert-feed"; alerts: Signal[] };

export type ObservationPolicy = {
  difficulty: BlackboxDifficulty;
  visibleSurfaces: ObservationSurfaceType[];
  revealHints: boolean;
  allowTentativeActions: boolean;
  feedbackFidelity: "explicit" | "partial" | "minimal";
};

export type BlackboxObservation = {
  surfaces: ObservationSurface[];
  timeline: Signal[];
  currentMinute: number;
  actionPoints: number;
  status: "active" | "contained" | "failed";
};

export type BlackboxAction = {
  id: "probe-checkout" | "inspect-service" | "reduce-load" | "restore-dependency";
  input: string;
};

export type BlackboxActionResult = {
  accepted: boolean;
  observation: BlackboxObservation;
  message: string;
};

export type SimulationState = {
  seed: ScenarioSeed;
  minute: number;
  actionPoints: number;
  checkoutLatencyMs: number;
  checkoutErrorRate: number;
  catalogLatencyMs: number;
  catalogAvailability: number;
  requestRate: number;
  capacityHeadroom: number;
  dependencyRestored: boolean;
  loadReduced: boolean;
  hiddenCause: string;
  status: "active" | "contained" | "failed";
  timeline: Signal[];
};
