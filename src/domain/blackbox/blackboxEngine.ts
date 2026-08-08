import type { BlackboxAction, BlackboxActionResult, BlackboxObservation, ObservationPolicy, SimulationState } from "./types";
import { createInitialSimulation } from "./seededSimulation";
import { projectObservation } from "./observationProjector";

export type BlackboxSession = { state: SimulationState; policy: ObservationPolicy };

export const blackboxActions: BlackboxAction[] = [
  { id: "probe-checkout", input: "GET /checkout" },
  { id: "inspect-service", input: "inspect catalog dependency" },
  { id: "reduce-load", input: "reduce catalog request rate" },
  { id: "restore-dependency", input: "restore catalog dependency" },
];

export function createBlackboxSession(seed: number, policy: ObservationPolicy): BlackboxSession {
  return { state: createInitialSimulation(seed, policy), policy };
}

export function observe(session: BlackboxSession): BlackboxObservation {
  return projectObservation(session.state, session.policy);
}

export function applyBlackboxAction(session: BlackboxSession, action: BlackboxAction): BlackboxActionResult {
  const state = session.state;
  const next = { ...state, timeline: [...state.timeline] };
  let accepted = true;
  let message = "The target returned a new signal.";

  if (state.status !== "active") return { accepted: false, observation: observe(session), message: "The target is no longer active." };
  const actionPointCost = action.id === "reduce-load" || action.id === "restore-dependency" ? 2 : 1;
  if (state.actionPoints < actionPointCost) return { accepted: false, observation: observe(session), message: "Not enough action points remain." };

  next.actionPoints -= actionPointCost;
  next.minute += action.id === "inspect-service" ? 2 : 1;

  if (action.id === "probe-checkout") {
    message = "The endpoint confirms elevated latency and intermittent failures.";
    next.timeline.push({ id: `probe-${next.minute}`, source: "checkout", kind: "endpoint", title: "Checkout probe completed", value: `${Math.round(next.checkoutLatencyMs)}ms / ${Math.round(next.checkoutErrorRate * 100)}% errors`, severity: "warning" });
  }
  if (action.id === "inspect-service") {
    message = "The catalog dependency is responding slowly.";
    next.timeline.push({ id: `inspect-${next.minute}`, source: "catalog", kind: "ui", title: "Catalog dependency inspected", value: `${next.catalogLatencyMs}ms`, severity: "warning" });
  }
  if (action.id === "reduce-load") {
    next.loadReduced = true;
    next.requestRate = Math.round(next.requestRate * 0.6);
    next.checkoutLatencyMs = Math.max(700, next.checkoutLatencyMs - 240);
    next.checkoutErrorRate = Math.max(0.03, next.checkoutErrorRate - 0.04);
    message = "Traffic was reduced; customer availability is lower, but pressure is easing.";
    next.timeline.push({ id: `load-${next.minute}`, source: "checkout", kind: "alert", title: "Traffic reduction is visible to customers", value: `${next.requestRate}/min`, severity: "warning" });
  }
  if (action.id === "restore-dependency") {
    const hasEvidence = state.timeline.some((event) => event.id.startsWith("inspect-"));
    if (!hasEvidence && !session.policy.allowTentativeActions) {
      accepted = false;
      next.actionPoints = state.actionPoints;
      next.minute = state.minute;
      message = "The control requires a relevant service observation first.";
    } else if (!hasEvidence) {
      message = "The restore attempt had no effect on the target.";
      next.timeline.push({ id: `restore-miss-${next.minute}`, source: "catalog", kind: "endpoint", title: "Dependency restore attempt completed", value: "no change", severity: "warning" });
    } else {
      next.dependencyRestored = true;
      next.catalogLatencyMs = 120;
      next.catalogAvailability = 0.999;
      next.checkoutLatencyMs = 620;
      next.checkoutErrorRate = 0.01;
      next.capacityHeadroom = Math.min(82, next.capacityHeadroom + 42);
      next.status = "contained";
      message = "The dependency recovered and checkout is returning to normal.";
      next.timeline.push({ id: `restore-${next.minute}`, source: "catalog", kind: "alert", title: "Dependency health recovered", value: "stable", severity: "success" });
    }
  }

  if (accepted && next.status === "active") {
    next.checkoutLatencyMs += next.loadReduced ? 20 : 80;
    next.checkoutErrorRate = Math.min(0.9, next.checkoutErrorRate + (next.loadReduced ? 0.01 : 0.04));
    next.catalogLatencyMs += next.loadReduced ? 10 : 55;
    next.catalogAvailability = Math.max(0.55, next.catalogAvailability - (next.loadReduced ? 0.005 : 0.012));
    next.capacityHeadroom = Math.max(2, next.capacityHeadroom - (next.loadReduced ? 1 : 5));
    if (next.minute >= 9 || next.capacityHeadroom <= 2) {
      next.status = "failed";
      next.timeline.push({ id: `failure-${next.minute}`, source: "checkout", kind: "alert", title: "Checkout capacity is exhausted", value: "customer impact severe", severity: "critical" });
      message = "The target degraded beyond safe recovery.";
    }
  }

  session.state = next;
  return { accepted, observation: observe(session), message };
}
