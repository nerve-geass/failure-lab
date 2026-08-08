import type { BlackboxObservation, ObservationPolicy, ObservationSurface, Signal, SimulationState } from "./types";

function signal(id: string, source: string, kind: Signal["kind"], title: string, value: string | number, severity: Signal["severity"], explanation?: string): Signal {
  return { id, source, kind, title, value, severity, explanation };
}

export function projectObservation(state: SimulationState, policy: ObservationPolicy): BlackboxObservation {
  const dashboardSignals: Signal[] = [
    signal("checkout-latency", "checkout", "metric", "Checkout latency p95", state.checkoutLatencyMs, state.checkoutLatencyMs > 1600 ? "critical" : "warning", policy.revealHints ? "Customer requests are waiting on a downstream dependency." : undefined),
    signal("checkout-errors", "checkout", "metric", "Checkout error rate", `${Math.round(state.checkoutErrorRate * 100)}%`, state.checkoutErrorRate > 0.2 ? "critical" : "warning"),
  ];
  const serviceSignals: Signal[] = [
    signal("catalog-latency", "catalog", "metric", "Catalog response time", state.catalogLatencyMs, state.catalogLatencyMs > 500 ? "critical" : "warning"),
    signal("catalog-availability", "catalog", "metric", "Catalog availability", `${Math.round(state.catalogAvailability * 100)}%`, state.catalogAvailability < 0.95 ? "critical" : "warning"),
    signal("capacity-headroom", "checkout", "metric", "Capacity headroom", `${state.capacityHeadroom}%`, state.capacityHeadroom < 15 ? "critical" : "warning"),
  ];
  const endpointSignals: Signal[] = [
    signal("checkout-response", "checkout", "endpoint", "GET /checkout response", state.checkoutErrorRate > 0.2 ? "503 Service Unavailable" : "200 OK", state.checkoutErrorRate > 0.2 ? "critical" : "warning"),
  ];
  const alerts: Signal[] = state.timeline.filter((event) => event.kind === "alert");
  const surfaces: ObservationSurface[] = [];

  for (const surface of policy.visibleSurfaces) {
    if (surface === "dashboard") surfaces.push({ type: "dashboard", signals: dashboardSignals });
    if (surface === "service-console") surfaces.push({ type: "service-console", serviceId: "catalog", signals: serviceSignals });
    if (surface === "endpoint") surfaces.push({ type: "endpoint", request: "GET /checkout", response: String(endpointSignals[0].value), signals: endpointSignals });
    if (surface === "trace-explorer") surfaces.push({ type: "trace-explorer", traces: serviceSignals.slice(0, 2) });
    if (surface === "alert-feed") surfaces.push({ type: "alert-feed", alerts });
  }

  return { surfaces, timeline: [...state.timeline].reverse(), currentMinute: state.minute, actionPoints: state.actionPoints, status: state.status };
}
