import { ChevronRight, Database, Globe2, Layers3, Network, Server, ShieldAlert, Waypoints } from "lucide-react";
import { useIncidentStore } from "@/application/incident/incidentStore";
import type { NodeStatus } from "@/domain/incident/types";
import { Panel, SectionHeading, StatusBadge } from "../shared/ui";

const iconByNode: Record<string, typeof Globe2> = { "web-checkout": Globe2, "checkout-api": Server, "payment-orchestrator": Waypoints, "payment-provider": ShieldAlert, "event-queue": Layers3, "order-service": Network, database: Database };

export function SystemMap() {
  const incident = useIncidentStore((state) => state.incident);
  const scenario = useIncidentStore((state) => state.scenario);
  const selectedNodeId = useIncidentStore((state) => state.selectedNodeId);
  const selectNode = useIncidentStore((state) => state.selectNode);
  const nodeEntries = Object.values(scenario.nodes);
  const selected = selectedNodeId ? scenario.nodes[selectedNodeId] : null;
  return <Panel className="p-5"><SectionHeading eyebrow="Topology" title="System map" action={<span className="text-[10px] uppercase tracking-[0.15em] text-slate-600">Live</span>} /><div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#0a0e14] p-3"><div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(103,232,249,0.16)_1px,transparent_1px)] [background-size:18px_18px]" /><div className="relative grid gap-2 sm:grid-cols-2">{nodeEntries.map((node) => { const Icon = iconByNode[node.id] ?? Server; const status = incident.nodeStatuses[node.id] as NodeStatus; const isSelected = selectedNodeId === node.id; const stressed = status === "warning" || status === "critical"; return <button key={node.id} type="button" onClick={() => selectNode(isSelected ? null : node.id)} aria-label={`Inspect ${node.name}`} className={`group flex min-h-[82px] flex-col justify-between rounded-xl border p-3 text-left transition ${isSelected ? "border-cyan-300/60 bg-cyan-300/10" : "border-white/[0.08] bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]"}`}><div className="flex items-start justify-between gap-2"><div className={`rounded-lg p-1.5 ${stressed ? "bg-amber-300/10 text-amber-200" : "bg-white/[0.06] text-slate-400"}`}><Icon size={15} /></div><StatusBadge status={status} /></div><div className="mt-3 flex items-center justify-between"><span className="text-xs font-semibold text-slate-200">{node.name}</span><ChevronRight size={14} className="text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-cyan-200" /></div></button>; })}</div>{selected && <div className="relative mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-cyan-100">{selected.name}</p><p className="mt-1 text-xs leading-5 text-slate-400">{selected.description}</p></div><Network size={18} className="text-cyan-200" /></div></div>}</div><div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" />Connections pulse as retry traffic rises</div></Panel>;
}
