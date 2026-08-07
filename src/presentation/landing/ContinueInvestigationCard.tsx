import { ArrowRight, Flag, RotateCcw, X } from "lucide-react";
import type { IncidentState } from "@/domain/incident/types";
import type { ScenarioDefinition } from "@/domain/scenario/types";
import { Panel, PrimaryButton, SecondaryButton } from "../shared/ui";

export function ContinueInvestigationCard({ incident, scenario, onResume, onAbandon, onStart }: { incident: IncidentState; scenario: ScenarioDefinition; onResume: () => void; onAbandon: () => void; onStart: () => void }) {
  const complete = incident.status === "resolved" || incident.status === "failed";

  return <Panel className="border-cyan-300/20 bg-cyan-300/[0.04] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/80">{complete ? "Investigation complete" : "Investigation in progress"}</p><h2 className="mt-2 text-xl font-semibold text-slate-100">{scenario.title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{complete ? "Review the decisions and signals that shaped this outcome." : "Your incident is waiting. Pick up where you left off and keep reasoning under pressure."}</p></div><div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200"><Flag size={20} /></div></div><div className="mt-5 flex flex-wrap gap-3"><PrimaryButton onClick={onResume} className="gap-2">{complete ? "Review report" : "Resume investigation"}<ArrowRight size={16} /></PrimaryButton>{!complete && <SecondaryButton onClick={onAbandon} className="gap-2"><X size={15} />Abandon and choose another</SecondaryButton>}{complete && <SecondaryButton onClick={onStart} className="gap-2"><RotateCcw size={15} />Start another investigation</SecondaryButton>}</div></Panel>;
}
