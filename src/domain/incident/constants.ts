export const INCIDENT_START_MINUTE = 0;
export const INITIAL_ACTION_POINTS = 6;

export const metricIds = {
  paymentSuccessRate: "paymentSuccessRate",
  checkoutLatency: "checkoutLatency",
  paymentCpu: "paymentCpu",
  paymentMemory: "paymentMemory",
  queueDepth: "queueDepth",
  providerTimeoutRate: "providerTimeoutRate",
  retryRate: "retryRate",
  openConnections: "openConnections",
} as const;

export const nodeIds = {
  webCheckout: "web-checkout",
  checkoutApi: "checkout-api",
  paymentOrchestrator: "payment-orchestrator",
  paymentProvider: "payment-provider",
  eventQueue: "event-queue",
  orderService: "order-service",
  database: "database",
} as const;
