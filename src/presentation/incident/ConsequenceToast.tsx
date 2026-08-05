import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useIncidentStore } from "@/application/incident/incidentStore";

export function ConsequenceToast() { const toast = useIncidentStore((state) => state.toast); return <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-5 left-1/2 z-50 flex max-w-md -translate-x-1/2 items-start gap-3 rounded-xl border border-emerald-300/25 bg-[#11221d] px-4 py-3 shadow-2xl"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-300" /><p className="text-sm leading-5 text-emerald-50">{toast.message}</p></motion.div>}</AnimatePresence>; }
