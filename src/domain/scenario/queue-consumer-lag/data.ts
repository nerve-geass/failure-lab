import type { IncidentAction, IncidentEvent, Metric, NodeStatus, SystemNode } from "@/domain/incident/types";

export const metricIds = { queueDepth: "queueDepth", consumerLag: "consumerLag", consumerThroughput: "consumerThroughput", producerRate: "producerRate", retryQueueDepth: "retryQueueDepth", databaseLatency: "databaseLatency" } as const;
export const nodeIds = { webCheckout: "web-checkout", eventQueue: "event-queue", consumerGroup: "consumer-group", retryQueue: "retry-queue", orderService: "order-service", database: "database", producer: "event-producer" } as const;
const metric = (id: string, label: string, value: number, unit: string, severity: Metric["severity"], explanation: string): Metric => ({ id, label, value, unit, trend: "flat", severity, explanation });

export const initialMetrics: Record<string, Metric> = {
  [metricIds.queueDepth]: metric(metricIds.queueDepth, "Queue depth", 4200, "messages", "warning", "Messages are arriving faster than consumers can drain them."),
  [metricIds.consumerLag]: metric(metricIds.consumerLag, "Consumer lag", 38, "s", "warning", "The oldest message is already waiting behind newer work."),
  [metricIds.consumerThroughput]: metric(metricIds.consumerThroughput, "Consumer throughput", 5200, "/min", "warning", "A recent change reduced processing throughput."),
  [metricIds.producerRate]: metric(metricIds.producerRate, "Producer rate", 5600, "/min", "info", "Producers are publishing at a normal rate."),
  [metricIds.retryQueueDepth]: metric(metricIds.retryQueueDepth, "Retry queue", 380, "messages", "info", "Replay is safe only after the primary queue is under control."),
  [metricIds.databaseLatency]: metric(metricIds.databaseLatency, "Database latency", 220, "ms", "warning", "Consumers are spending longer on each database write."),
};

export const nodes: Record<string, SystemNode> = {
  [nodeIds.webCheckout]: { id: nodeIds.webCheckout, name: "Web Checkout", description: "Customer-facing order flow." },
  [nodeIds.eventQueue]: { id: nodeIds.eventQueue, name: "Event Queue", description: "Buffers order events before processing." },
  [nodeIds.consumerGroup]: { id: nodeIds.consumerGroup, name: "Consumer Group", description: "Workers process queued events into orders." },
  [nodeIds.retryQueue]: { id: nodeIds.retryQueue, name: "Retry Queue", description: "Holds events that failed processing." },
  [nodeIds.orderService]: { id: nodeIds.orderService, name: "Order Service", description: "Applies event changes to customer orders." },
  [nodeIds.database]: { id: nodeIds.database, name: "Database", description: "Stores order and event state." },
  [nodeIds.producer]: { id: nodeIds.producer, name: "Event Producer", description: "Publishes order events at the edge of the system." },
};

export const connections = [
  { from: nodeIds.webCheckout, to: nodeIds.producer },
  { from: nodeIds.producer, to: nodeIds.eventQueue },
  { from: nodeIds.eventQueue, to: nodeIds.consumerGroup },
  { from: nodeIds.consumerGroup, to: nodeIds.orderService },
  { from: nodeIds.consumerGroup, to: nodeIds.retryQueue },
  { from: nodeIds.orderService, to: nodeIds.database },
];

export const actions: IncidentAction[] = [
  { id: "inspect-queue", title: "Inspect queue metrics", description: "Measure queue depth, arrival rate, and oldest message age.", consequence: "Queue depth is accelerating while producer traffic remains steady.", actionPointCost: 1, timeCostMinutes: 1 },
  { id: "inspect-consumers", title: "Inspect consumer metrics", description: "Compare consumer throughput, lag, and processing time.", consequence: "Consumer throughput dropped after a deployment and lag is compounding.", actionPointCost: 1, timeCostMinutes: 2, prerequisites: ["inspect-queue"] },
  { id: "inspect-deployment", title: "Inspect recent deployment", description: "Check whether worker behavior changed recently.", consequence: "A batching change increased processing time for each event.", actionPointCost: 1, timeCostMinutes: 2 },
  { id: "scale-consumers", title: "Scale consumers", description: "Add workers to increase queue processing throughput.", consequence: "Additional consumers begin draining the primary queue.", actionPointCost: 1, timeCostMinutes: 3, prerequisites: ["inspect-queue", "inspect-consumers"], prerequisiteMode: "any" },
  { id: "apply-backpressure", title: "Apply backpressure", description: "Slow producers until consumers regain headroom.", consequence: "Producer traffic is reduced to a rate the consumer group can sustain.", actionPointCost: 1, timeCostMinutes: 2, prerequisites: ["inspect-queue", "inspect-consumers"], prerequisiteMode: "any" },
  { id: "increase-batch-size", title: "Increase batch size", description: "Process more messages per consumer fetch.", consequence: "Larger batches increase database contention while lag is already high.", actionPointCost: 1, timeCostMinutes: 2, prerequisites: ["inspect-consumers"] },
  { id: "replay-retry-queue", title: "Replay retry queue", description: "Return failed events to the primary queue.", consequence: "Replay adds work to an already saturated queue.", actionPointCost: 1, timeCostMinutes: 2, prerequisites: ["inspect-queue"] },
  { id: "pause-producers", title: "Pause producers", description: "Stop new events as an emergency containment measure.", consequence: "The queue is protected at the cost of delayed order updates.", actionPointCost: 2, timeCostMinutes: 1 },
];

export const initialStatuses: Record<string, NodeStatus> = { [nodeIds.webCheckout]: "healthy", [nodeIds.eventQueue]: "critical", [nodeIds.consumerGroup]: "warning", [nodeIds.retryQueue]: "warning", [nodeIds.orderService]: "warning", [nodeIds.database]: "warning", [nodeIds.producer]: "healthy" };
export const initialEvent: IncidentEvent = { id: "queue-lag-started", minute: 0, title: "Consumer lag begins to rise", description: "Order events arrive at a normal rate, but the consumer group processes fewer messages per minute.", severity: "warning", relatedNodeIds: [nodeIds.eventQueue, nodeIds.consumerGroup] };
