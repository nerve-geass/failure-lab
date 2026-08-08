import { createSeededRandom, randomInt } from "@/domain/scenario/generation/random";
import type { ObservationPolicy, SimulationState } from "./types";

export function createInitialSimulation(seed: number, _policy: ObservationPolicy): SimulationState {
  const random = createSeededRandom(seed);
  return {
    seed,
    minute: 0,
    actionPoints: 8,
    checkoutLatencyMs: randomInt(random, 900, 1300),
    checkoutErrorRate: Number((randomInt(random, 4, 9) / 100).toFixed(2)),
    catalogLatencyMs: randomInt(random, 280, 420),
    catalogAvailability: Number((randomInt(random, 96, 99) / 100).toFixed(2)),
    requestRate: randomInt(random, 3800, 4600),
    capacityHeadroom: randomInt(random, 18, 32),
    dependencyRestored: false,
    loadReduced: false,
    hiddenCause: "database saturation behind a degraded catalog dependency",
    status: "active",
    timeline: [{ id: "blackbox-started", source: "checkout", kind: "alert", title: "Checkout responses are slower than usual", value: "p95 elevated", severity: "warning" }],
  };
}
