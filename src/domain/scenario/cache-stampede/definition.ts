import type { ScenarioDefinition } from "../types";
import { calculateCacheStampedeScore } from "./calculateScore";
import { actions, connections, initialEvent, initialMetrics, initialStatuses, nodes } from "./data";
import { calculateCacheStampedeOutcome } from "./calculateOutcome";
import { deriveCacheStampedeState, resolveCacheStampedeAction } from "./rules";

const initialFlags = { cacheMetricsInspected: false, deploymentInspected: false, databaseMetricsInspected: false, cacheWarmed: false, requestCoalescingEnabled: false, trafficThrottled: false, rollbackApplied: false };

export const cacheStampedeDefinition: ScenarioDefinition = {
  id: "cache-stampede",
  title: "Cache Stampede",
  summary: "A popular cache key expires and a wave of requests hits the database at once.",
  nodes,
  connections,
  actions,
  concepts: ["TTL", "Cache warming", "Request coalescing", "Database load", "Backpressure", "Graceful degradation"],
  content: {
    startMinute: 34,
    durationMinutes: 8,
    difficulty: "Beginner",
    impact: { metricId: "databaseConnections", growingAt: 75, highAt: 90, severeFlag: "trafficThrottled" },
    topologyNote: "Database connections pulse as cache misses multiply",
    briefing: { eyebrow: "Incident briefing", title: "One expired key becomes a database flood.", description: "At 10:16, a popular product key expires after a deployment. Cache misses arrive together, and the database begins absorbing work it was never meant to handle.", objective: "Break the miss amplification loop before shared database capacity is exhausted.", capability: "Inspect cache and database signals, restore hot data, and protect the dependency.", learning: "Why TTL coordination, cache warming, and request coalescing prevent a small expiry from becoming an outage." },
    report: { rootCauseTitle: "Synchronized cache misses", rootCauseDescription: "A high-traffic key expired after a TTL change. Requests missed together and independently refilled the same key, multiplying database reads and consuming shared connections.", bestIntervention: "Before database connections exceed 90%", missedOpportunities: [{ flag: "cacheWarmed", label: "Warm the cache" }, { flag: "requestCoalescingEnabled", label: "Enable request coalescing" }, { flag: "cacheMetricsInspected", label: "Inspect cache metrics" }] },
    outcomeMessages: {
      "excellent-containment": { eyebrow: "Excellent containment", title: "The stampede was stopped.", body: "You repopulated the hot key and ensured concurrent misses shared one refill, protecting the database.", tone: "text-emerald-300" },
      "partial-recovery": { eyebrow: "Partial recovery", title: "The pressure was reduced, not eliminated.", body: "You slowed the database load, but concurrent cache misses remained a risk.", tone: "text-amber-200" },
      "emergency-containment": { eyebrow: "Emergency containment", title: "The database survived at a customer cost.", body: "Traffic throttling protected shared capacity while making the catalog less available.", tone: "text-amber-200" },
      "major-outage": { eyebrow: "Major outage", title: "The stampede completed.", body: "The cache miss burst exhausted database capacity and spread latency through checkout.", tone: "text-red-300" },
    },
  },
  createInitialState: () => ({ scenarioId: "cache-stampede", currentMinute: 0, actionPoints: 6, flags: { ...initialFlags }, metrics: structuredClone(initialMetrics), nodeStatuses: { ...initialStatuses }, completedActionIds: [], hypotheses: [], timeline: [structuredClone(initialEvent)], status: "active" }),
  resolveAction: resolveCacheStampedeAction,
  deriveState: deriveCacheStampedeState,
  calculateOutcome: calculateCacheStampedeOutcome,
  calculateScore: calculateCacheStampedeScore,
};
