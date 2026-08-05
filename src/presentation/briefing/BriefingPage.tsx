import { motion } from "framer-motion";
import { ArrowRight, Check, Circle, Network, Target } from "lucide-react";
import type { ScenarioDefinition } from "@/domain/scenario/types";
import { fadeUp, stagger } from "../shared/motion";
import { Panel, PrimaryButton, SecondaryButton } from "../shared/ui";

export function BriefingPage({ scenario, onEnter, onBack }: { scenario: ScenarioDefinition; onEnter: () => void; onBack: () => void }) {
  const nodes = Object.values(scenario.nodes);
  const briefing = scenario.content.briefing;
  return <main className="min-h-screen bg-[#080b10] px-5 py-8 text-slate-100 sm:px-8 lg:px-12">
    <div className="mx-auto max-w-6xl">
      <header className="flex items-center justify-between border-b border-white/[0.08] pb-6"><span className="text-sm font-bold tracking-[0.16em] text-slate-200">FAILURE LAB</span><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Scenario briefing / 01</span></header>
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-8 pb-12 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
        <div>
          <motion.p variants={fadeUp} className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">{briefing.eyebrow}</motion.p>
          <motion.h1 variants={fadeUp} className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">{briefing.title}</motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-base leading-7 text-slate-400">{briefing.description}</motion.p>
          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap gap-3"><PrimaryButton onClick={onEnter} className="gap-3">Enter incident <ArrowRight size={17} /></PrimaryButton><SecondaryButton onClick={onBack}>Back to lab</SecondaryButton></motion.div>
        </div>
        <motion.div variants={fadeUp}><Panel className="p-6"><div className="mb-6 flex items-center gap-3"><div className="rounded-lg bg-cyan-300/10 p-2 text-cyan-200"><Network size={18} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">Architecture preview</p><p className="text-sm font-semibold text-slate-200">{scenario.title} system path</p></div></div><div className="space-y-2">{nodes.map((node, index) => <div key={node.id} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"><Circle size={9} className={node.id.includes("provider") ? "fill-amber-300 text-amber-300" : "fill-emerald-300 text-emerald-300"} /><span className="text-sm text-slate-300">{node.name}</span>{index < nodes.length - 1 && <span className="ml-auto text-[10px] text-slate-600">→</span>}</div>)}</div></Panel></motion.div>
      </motion.div>
      <div className="grid gap-5 border-t border-white/[0.08] pt-8 md:grid-cols-3"><Panel className="p-5"><Target size={18} className="mb-5 text-cyan-200" /><h2 className="font-semibold">Your objective</h2><p className="mt-2 text-sm leading-6 text-slate-400">{briefing.objective}</p></Panel><Panel className="p-5"><Check size={18} className="mb-5 text-emerald-300" /><h2 className="font-semibold">What you can do</h2><p className="mt-2 text-sm leading-6 text-slate-400">{briefing.capability}</p></Panel><Panel className="p-5"><Network size={18} className="mb-5 text-amber-200" /><h2 className="font-semibold">What you learn</h2><p className="mt-2 text-sm leading-6 text-slate-400">{briefing.learning}</p></Panel></div>
    </div>
  </main>;
}
