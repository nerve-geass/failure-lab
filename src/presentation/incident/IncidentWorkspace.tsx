import { useState } from "react";
import { IncidentHeader } from "./IncidentHeader";
import { SystemMap } from "./SystemMap";
import { MetricsPanel } from "./MetricsPanel";
import { HypothesisPanel } from "./HypothesisPanel";
import { IncidentTimeline } from "./IncidentTimeline";
import { ActionPanel } from "./ActionPanel";
import { ConsequenceToast } from "./ConsequenceToast";

type WorkspaceTab = "map" | "timeline" | "signals";

export function IncidentWorkspace() {
  const [tab, setTab] = useState<WorkspaceTab>("timeline");
  return <div className="min-h-screen bg-[#080b10] text-slate-100"><IncidentHeader /><main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6"><div className="mb-4 flex gap-2 overflow-x-auto rounded-xl border border-white/[0.07] bg-white/[0.02] p-1 lg:hidden">{([['map', 'Topology'], ['timeline', 'Timeline'], ['signals', 'Signals & actions']] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setTab(id)} className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${tab === id ? "bg-cyan-300/10 text-cyan-200" : "text-slate-500 hover:text-slate-300"}`}>{label}</button>)}</div><div className="grid gap-5 lg:grid-cols-[minmax(240px,0.85fr)_minmax(360px,1.2fr)_minmax(300px,0.95fr)]"><div className={tab === "map" ? "block" : "hidden lg:block"}><SystemMap /></div><div className={tab === "timeline" ? "space-y-5" : "hidden lg:block lg:space-y-5"}><IncidentTimeline /><HypothesisPanel /></div><div className={tab === "signals" ? "space-y-5" : "hidden lg:block lg:space-y-5"}><MetricsPanel /><ActionPanel /></div></div></main><ConsequenceToast /></div>;
}
