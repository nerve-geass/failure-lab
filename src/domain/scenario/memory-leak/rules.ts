import type { IncidentAction, IncidentState } from "@/domain/incident/types";
import type { DerivedIncidentState, ScenarioActionEffect } from "../types";
import { deriveMemoryLeakMetrics } from "./deriveMetrics";
import { deriveMemoryLeakNodeStatuses } from "./deriveNodeStatuses";
import { deriveMemoryLeakTimelineEvents } from "./deriveTimelineEvents";
const flagByAction: Record<string, string> = { "inspect-memory-metrics": "memoryInspected", "inspect-heap-profile": "profileInspected", "limit-cache": "cacheLimited", "restart-workers": "workersRestarted", "shed-traffic": "trafficShed", "increase-memory": "memoryIncreased" };
const hypothesisByAction: Record<string, string> = { "inspect-memory-metrics": "Post-GC heap continues to grow", "inspect-heap-profile": "A retained cache path is leaking memory" };
export function resolveMemoryLeakAction(state: IncidentState, action: IncidentAction): ScenarioActionEffect { const flag = flagByAction[action.id]; const flags = flag ? { [flag]: true } : {}; const next = { ...state, flags: { ...state.flags, ...flags } }; return { flags, hypotheses: hypothesisByAction[action.id] ? [hypothesisByAction[action.id]] : [], events: deriveMemoryLeakTimelineEvents({ ...next, metrics: deriveMemoryLeakMetrics(next) }, action), message: action.consequence }; }
export function deriveMemoryLeakState(state: IncidentState): DerivedIncidentState { const metrics = deriveMemoryLeakMetrics(state); return { metrics, nodeStatuses: deriveMemoryLeakNodeStatuses({ ...state, metrics }) }; }
