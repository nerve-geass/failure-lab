import type { RetryStormScenario } from "../incident/types";
import { metricIds, nodeIds } from "../incident/constants";

const metric = (id: string, label: string, value: number, unit: string, severity: "info" | "warning" | "critical" | "success", explanation: string) => ({
  id, label, value, unit, trend: "flat" as const, severity, explanation,
});

export const retryStormScenario: RetryStormScenario = {
  id: "retry-storm",
  title: "Retry Storm",
  nodes: {
    [nodeIds.webCheckout]: { id: nodeIds.webCheckout, name: "Web Checkout", description: "Customer-facing checkout flow." },
    [nodeIds.checkoutApi]: { id: nodeIds.checkoutApi, name: "Checkout API", description: "Coordinates order and payment requests." },
    [nodeIds.paymentOrchestrator]: { id: nodeIds.paymentOrchestrator, name: "Payment Orchestrator", description: "Handles provider calls and retry policy." },
    [nodeIds.paymentProvider]: { id: nodeIds.paymentProvider, name: "Payment Provider", description: "External dependency returning intermittent timeouts." },
    [nodeIds.eventQueue]: { id: nodeIds.eventQueue, name: "Event Queue", description: "Buffers payment and order events." },
    [nodeIds.orderService]: { id: nodeIds.orderService, name: "Order Service", description: "Persists and advances customer orders." },
    [nodeIds.database]: { id: nodeIds.database, name: "Database", description: "Shared order and checkout persistence." },
  },
  connections: [
    { from: nodeIds.webCheckout, to: nodeIds.checkoutApi },
    { from: nodeIds.checkoutApi, to: nodeIds.paymentOrchestrator },
    { from: nodeIds.paymentOrchestrator, to: nodeIds.paymentProvider },
    { from: nodeIds.paymentOrchestrator, to: nodeIds.eventQueue },
    { from: nodeIds.eventQueue, to: nodeIds.orderService },
    { from: nodeIds.orderService, to: nodeIds.database },
  ],
  initialMetrics: {
    [metricIds.paymentSuccessRate]: metric(metricIds.paymentSuccessRate, "Payment success rate", 94, "%", "warning", "Failures are rising, but the service still looks superficially healthy."),
    [metricIds.checkoutLatency]: metric(metricIds.checkoutLatency, "Checkout latency p95", 1.8, "s", "warning", "Latency is above the normal checkout target."),
    [metricIds.paymentCpu]: metric(metricIds.paymentCpu, "Payment CPU", 43, "%", "info", "CPU is not the limiting resource."),
    [metricIds.paymentMemory]: metric(metricIds.paymentMemory, "Payment memory", 51, "%", "info", "Memory remains within a normal range."),
    [metricIds.queueDepth]: metric(metricIds.queueDepth, "Queue depth", 1240, "messages", "warning", "The queue is growing and consumers may be falling behind."),
    [metricIds.providerTimeoutRate]: metric(metricIds.providerTimeoutRate, "Provider timeout rate", 6, "%", "warning", "The downstream provider is intermittently timing out."),
    [metricIds.retryRate]: metric(metricIds.retryRate, "Retry rate", 320, "/min", "warning", "Retries are amplifying traffic toward the provider."),
    [metricIds.openConnections]: metric(metricIds.openConnections, "Open payment connections", 68, "%", "warning", "Connection pool pressure is the leading infrastructure risk."),
  },
  initialStatuses: {
    [nodeIds.webCheckout]: "healthy",
    [nodeIds.checkoutApi]: "warning",
    [nodeIds.paymentOrchestrator]: "warning",
    [nodeIds.paymentProvider]: "warning",
    [nodeIds.eventQueue]: "warning",
    [nodeIds.orderService]: "healthy",
    [nodeIds.database]: "healthy",
  },
  initialEvent: {
    id: "incident-started",
    minute: 0,
    title: "Payment failures begin to rise",
    description: "Checkout reports intermittent payment failures while CPU and memory remain normal.",
    severity: "warning",
    relatedNodeIds: [nodeIds.paymentOrchestrator, nodeIds.paymentProvider],
  },
  actions: [
    { id: "inspect-deployment", title: "Inspect recent deployment", description: "Check whether the latest release changed request behavior.", consequence: "The latest release changed retry defaults for new instances.", actionPointCost: 1, timeCostMinutes: 2 },
    { id: "inspect-queue", title: "Inspect queue metrics", description: "Check whether consumers can keep up with incoming work.", consequence: "Queue growth is accelerating faster than consumers can drain it.", actionPointCost: 1, timeCostMinutes: 1 },
    { id: "inspect-provider-traces", title: "Inspect provider traces", description: "Trace payment calls into the external provider.", consequence: "Intermittent provider timeouts confirm downstream instability.", actionPointCost: 1, timeCostMinutes: 2, prerequisites: ["inspect-deployment", "inspect-queue"], prerequisiteMode: "any" },
    { id: "rollback-deployment", title: "Rollback deployment", description: "Restore the previous retry configuration for new instances.", consequence: "New instances stop inheriting the aggressive retry defaults, but in-flight retries remain.", actionPointCost: 1, timeCostMinutes: 4, prerequisites: ["inspect-deployment"] },
    { id: "disable-retries", title: "Disable automatic retries", description: "Stop multiplying traffic while accepting fast payment failures.", consequence: "Generated traffic drops sharply and the connection pool can recover.", actionPointCost: 1, timeCostMinutes: 2 },
    { id: "enable-circuit-breaker", title: "Enable circuit breaker", description: "Isolate the unstable provider and fail affected payments quickly.", consequence: "The provider is isolated and the rest of checkout is protected.", actionPointCost: 1, timeCostMinutes: 2 },
    { id: "scale-workers", title: "Scale payment workers", description: "Increase payment throughput to process more queued work.", consequence: "Throughput rises briefly, but retries create even more downstream pressure.", actionPointCost: 1, timeCostMinutes: 3 },
    { id: "increase-queue-retention", title: "Increase queue retention", description: "Keep messages longer while the incident is investigated.", consequence: "Messages are retained longer, but retry amplification continues.", actionPointCost: 1, timeCostMinutes: 2 },
    { id: "pause-checkout", title: "Pause checkout traffic", description: "Stop most customer traffic as an emergency containment measure.", consequence: "Infrastructure stabilizes at the cost of severe business impact.", actionPointCost: 2, timeCostMinutes: 1 },
  ],
  concepts: ["Retry amplification", "Exponential backoff", "Jitter", "Queue saturation", "Connection pool exhaustion", "Circuit breakers", "Blast radius", "Mitigation before diagnosis"],
};
