import { Activity, RotateCcw, TimerReset, Zap } from "lucide-react";
import { useIncidentStore } from "@/application/incident/incidentStore";
import { SecondaryButton } from "../shared/ui";

function clockLabel(minute: number, startMinute: number) {
  const total = startMinute + minute;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function IncidentHeader() {
  const incident = useIncidentStore((state) => state.incident);
  const scenario = useIncidentStore((state) => state.scenario);
  const restart = useIncidentStore((state) => state.restart);
  const impactMetric = incident.metrics[scenario.content.impact.metricId];
  const impactValue = impactMetric?.value ?? 0;
  const severe = scenario.content.impact.severeFlag ? incident.flags[scenario.content.impact.severeFlag] : false;
  const impact = severe ? "Severe" : impactValue >= scenario.content.impact.highAt ? "High" : impactValue > scenario.content.impact.growingAt ? "Growing" : "Low";
  const impactClass = impact === "Severe" || impact === "High" ? "text-red-300" : impact === "Growing" ? "text-amber-200" : "text-emerald-300";
  return <header className="border-b border-white/[0.08] bg-[#0b0f15]/95 px-4 py-4 backdrop-blur sm:px-6"><div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl border border-red-300/20 bg-red-300/10 text-red-300"><Activity size={18} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-300/80">Active incident</p><h1 className="text-sm font-semibold text-slate-100 sm:text-base">{scenario.title}</h1></div></div><div className="flex flex-wrap items-center gap-3 sm:gap-6"><div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><TimerReset size={15} className="text-cyan-300" />{clockLabel(incident.currentMinute, scenario.content.startMinute)}</div><div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Zap size={15} className="text-amber-200" />{incident.actionPoints} <span className="hidden text-xs font-normal text-slate-500 sm:inline">action points</span></div><div className="hidden items-center gap-2 text-xs sm:flex"><span className="text-slate-500">Customer impact</span><span className={`font-bold ${impactClass}`}>{impact}</span></div><SecondaryButton onClick={restart} className="gap-2 px-3 py-2 text-xs"><RotateCcw size={13} /> Restart</SecondaryButton></div></div></header>;
}
