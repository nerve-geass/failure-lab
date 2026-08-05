import { Lightbulb } from "lucide-react";
import { useIncidentStore } from "@/application/incident/incidentStore";
import { Panel, SectionHeading } from "../shared/ui";

export function HypothesisPanel() { const hypotheses = useIncidentStore((state) => state.incident.hypotheses); return <Panel className="p-5"><SectionHeading eyebrow="Working theory" title="Hypotheses" />{hypotheses.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm leading-6 text-slate-500">No confirmed hypotheses yet. Follow the signals before committing to a story.</div> : <div className="space-y-2">{hypotheses.map((hypothesis) => <div key={hypothesis} className="flex gap-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] p-3"><Lightbulb size={16} className="mt-0.5 shrink-0 text-cyan-200" /><span className="text-sm text-slate-300">{hypothesis}</span></div>)}</div>}</Panel>; }
