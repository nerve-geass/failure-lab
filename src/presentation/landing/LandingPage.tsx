import { motion } from "framer-motion";
import { ArrowRight, Clock3, Layers3, Radio, ShieldCheck, Sparkles } from "lucide-react";
import type { IncidentState } from "@/domain/incident/types";
import type { ScenarioDefinition } from "@/domain/scenario/types";
import { fadeUp, stagger } from "../shared/motion";
import { IconLabel, Panel, PrimaryButton } from "../shared/ui";
import { ContinueInvestigationCard } from "./ContinueInvestigationCard";
import { ScenarioCatalog } from "./ScenarioCatalog";

export function LandingPage({ incident, hasSavedIncident, scenario, onStart, onResume, onAbandon, onSelectScenario, onSelectBlackbox }: { incident: IncidentState; hasSavedIncident: boolean; scenario: ScenarioDefinition; onStart: () => void; onResume: () => void; onAbandon: () => void; onSelectScenario: (scenarioId: string) => void; onSelectBlackbox: () => void }) {
  return <main className="relative min-h-screen overflow-hidden bg-[#080b10] px-5 py-8 text-slate-100 sm:px-8 lg:px-12">
    <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(103,232,249,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,0.04)_1px,transparent_1px)] [background-size:52px_52px]" />
    <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-cyan-300/10 blur-[120px]" />
    <div className="relative mx-auto max-w-6xl">
      <header className="flex items-center justify-between border-b border-white/[0.08] pb-6"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200"><Radio size={18} /></div><span className="text-sm font-bold tracking-[0.16em] text-slate-200">FAILURE LAB</span></div><span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Interactive reliability training</span></header>
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-12 pb-16 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20 lg:pt-28">
        <div><motion.p variants={fadeUp} className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200"><Sparkles size={12} /> Learn through the incident</motion.p><motion.h1 variants={fadeUp} className="max-w-2xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">Train your instincts.<br /><span className="text-cyan-200">Learn from failure.</span></motion.h1><motion.p variants={fadeUp} className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">Failure Lab turns production incidents into short, playable investigations. Read the signals, choose your intervention, and learn what would have changed the outcome.</motion.p><motion.div variants={fadeUp} className="mt-9"><PrimaryButton onClick={onStart} className="gap-3">Start investigation <ArrowRight size={17} /></PrimaryButton></motion.div></div>
        <motion.div variants={fadeUp}><Panel className="relative overflow-hidden p-6 sm:p-8"><div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-red-400/10 blur-3xl" /><div className="relative"><div className="mb-8 flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-300/80">Available incident / 01</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">{scenario.title}</h2></div><div className="rounded-xl border border-red-300/20 bg-red-300/10 p-3 text-red-300"><ShieldCheck size={22} /></div></div><p className="max-w-md text-sm leading-6 text-slate-400">{scenario.summary}</p><div className="mt-8 grid grid-cols-2 gap-3 border-y border-white/[0.08] py-5"><IconLabel icon={<Clock3 size={15} className="text-cyan-300" />}>{scenario.content.durationMinutes} minutes</IconLabel><IconLabel icon={<Layers3 size={15} className="text-amber-200" />}>{scenario.content.difficulty}</IconLabel></div><div className="mt-5 flex flex-wrap gap-2">{scenario.concepts.slice(0, 5).map((concept) => <span key={concept} className="rounded-full border border-white/[0.08] px-2.5 py-1.5 text-[10px] text-slate-400">{concept}</span>)}</div></div></Panel></motion.div>
      </motion.div>
      {hasSavedIncident && <div className="mb-16"><ContinueInvestigationCard incident={incident} scenario={scenario} onResume={onResume} onAbandon={onAbandon} onStart={onStart} /></div>}
      <ScenarioCatalog onSelectScenario={onSelectScenario} onSelectBlackbox={onSelectBlackbox} />
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] py-6 text-[10px] uppercase tracking-[0.16em] text-slate-600"><span>One scenario · deterministic outcomes</span><span>Built for calm decisions under pressure</span></footer>
    </div>
  </main>;
}
