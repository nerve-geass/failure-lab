import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useIncidentStore } from "@/application/incident/incidentStore";
import { Panel, SectionHeading, SeverityText } from "../shared/ui";

const trendIcon = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus };
const formatValue = (value: number, unit: string) => `${value % 1 === 0 ? value : value.toFixed(1)} ${unit}`;

export function MetricsPanel() {
  const metrics = useIncidentStore((state) => state.incident.metrics);
  return <Panel className="p-5"><SectionHeading eyebrow="Signals" title="Operational metrics" /> <div className="space-y-1">{Object.values(metrics).map((metric) => { const TrendIcon = trendIcon[metric.trend]; return <div key={metric.id} className="rounded-xl border border-transparent px-3 py-3 transition hover:border-white/[0.07] hover:bg-white/[0.02]"><div className="flex items-center justify-between gap-3"><span className="text-xs text-slate-400">{metric.label}</span><SeverityText severity={metric.severity} /></div><div className="mt-1.5 flex items-end justify-between gap-3"><span className="text-lg font-semibold tracking-tight text-slate-100">{formatValue(metric.value, metric.unit)}</span><TrendIcon size={16} className={metric.trend === "up" ? "text-amber-200" : metric.trend === "down" ? "text-emerald-300" : "text-slate-600"} aria-label={`${metric.trend} trend`} /></div></div>; })}</div></Panel>;
}
