import { Activity, ArrowLeft, ArrowRight, Gauge, Terminal, TriangleAlert } from "lucide-react";
import type { BlackboxAction, BlackboxObservation, ObservationSurface, Signal } from "@/domain/blackbox/types";
import { Panel, PrimaryButton } from "../shared/ui";

export type BlackboxWorkspaceProps = {
  observation: BlackboxObservation;
  actions: BlackboxAction[];
  onAction: (action: BlackboxAction) => void;
  onExit?: () => void;
};

function SignalList({ signals }: { signals: Signal[] }) {
  return <div className="grid gap-2 sm:grid-cols-2">{signals.map((item) => <div key={item.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-slate-200">{item.title}</span><span className={`text-[10px] font-bold uppercase tracking-[0.14em] ${item.severity === "critical" ? "text-red-300" : item.severity === "success" ? "text-emerald-300" : "text-amber-200"}`}>{item.severity}</span></div>{item.value !== undefined && <p className="mt-2 font-mono text-sm text-cyan-100">{item.value}</p>}{item.explanation && <p className="mt-1 text-xs leading-5 text-slate-500">{item.explanation}</p>}</div>)}</div>;
}

function Surface({ surface }: { surface: ObservationSurface }) {
  if (surface.type === "dashboard") return <Panel className="p-5"><div className="mb-4 flex items-center gap-3"><Gauge size={17} className="text-cyan-200" /><h2 className="font-semibold text-slate-100">Checkout dashboard</h2></div><SignalList signals={surface.signals} /></Panel>;
  if (surface.type === "service-console") return <Panel className="p-5"><div className="mb-4 flex items-center gap-3"><Activity size={17} className="text-amber-200" /><h2 className="font-semibold text-slate-100">{surface.serviceId} service console</h2></div><SignalList signals={surface.signals} /></Panel>;
  if (surface.type === "endpoint") return <Panel className="p-5"><div className="mb-4 flex items-center gap-3"><Terminal size={17} className="text-cyan-200" /><h2 className="font-semibold text-slate-100">Endpoint response</h2></div><p className="font-mono text-xs text-slate-500">{surface.request}</p><p className="mt-3 rounded-xl border border-white/[0.07] bg-black/20 p-3 font-mono text-sm text-cyan-100">{surface.response}</p><div className="mt-3"><SignalList signals={surface.signals} /></div></Panel>;
  if (surface.type === "trace-explorer") return <Panel className="p-5"><div className="mb-4 flex items-center gap-3"><Activity size={17} className="text-violet-200" /><h2 className="font-semibold text-slate-100">Trace explorer</h2></div><SignalList signals={surface.traces} /></Panel>;
  return <Panel className="p-5"><div className="mb-4 flex items-center gap-3"><TriangleAlert size={17} className="text-red-300" /><h2 className="font-semibold text-slate-100">Alert feed</h2></div><SignalList signals={surface.alerts} /></Panel>;
}

function actionLabel(action: BlackboxAction): string {
  if (action.id === "probe-checkout") return "Probe checkout";
  if (action.id === "inspect-service") return "Inspect catalog dependency";
  if (action.id === "reduce-load") return "Reduce catalog request rate";
  return "Restore catalog dependency";
}

export function BlackboxWorkspace({ observation, actions, onAction, onExit }: BlackboxWorkspaceProps) {
  return <main className="min-h-screen bg-[#080b10] px-5 py-8 text-slate-100 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl"><header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/80">Blackbox target</p><h1 className="mt-2 text-2xl font-semibold">Checkout dependency under pressure</h1></div><div className="flex items-center gap-4 text-xs text-slate-400">{onExit && <button type="button" onClick={onExit} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 font-semibold text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-100"><ArrowLeft size={14} />Back to catalog</button>}<span>Minute {observation.currentMinute}</span><span>{observation.actionPoints} points</span><span className="uppercase tracking-[0.14em] text-amber-200">{observation.status}</span></div></header><div className="grid gap-5 pb-16 pt-8 lg:grid-cols-[1.2fr_0.8fr]"><section className="space-y-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Observable signals</p><p className="mt-2 text-sm leading-6 text-slate-400">The target will not explain itself. Form a hypothesis from what the interfaces reveal.</p></div>{observation.surfaces.map((surface, index) => <Surface key={`${surface.type}-${index}`} surface={surface} />)}</section><aside><Panel className="p-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Available probes</p><h2 className="mt-1 font-semibold text-slate-100">Choose an experiment</h2></div><ArrowRight size={16} className="text-cyan-200" /></div><div className="space-y-2">{actions.map((action) => <PrimaryButton key={action.id} onClick={() => onAction(action)} className="w-full justify-between gap-3 text-left">{actionLabel(action)}<ArrowRight size={15} /></PrimaryButton>)}</div></Panel><Panel className="mt-5 p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Recent observations</p><div className="mt-3 space-y-2">{observation.timeline.slice(0, 5).map((event) => <div key={event.id} className="border-l border-cyan-300/30 pl-3"><p className="text-xs font-semibold text-slate-300">{event.title}</p><p className="mt-1 text-[11px] text-slate-500">{event.value}</p></div>)}</div></Panel></aside></div></div></main>;
}
