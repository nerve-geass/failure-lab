import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, CircleDot, LockKeyhole, ShieldAlert } from "lucide-react";
import type { NodeStatus, Severity } from "@/domain/incident/types";

const statusStyles: Record<NodeStatus, { label: string; className: string; icon: typeof CircleDot }> = {
  healthy: { label: "Healthy", className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300", icon: CheckCircle2 },
  warning: { label: "Warning", className: "border-amber-300/30 bg-amber-300/10 text-amber-200", icon: AlertTriangle },
  critical: { label: "Critical", className: "border-red-400/30 bg-red-400/10 text-red-300", icon: ShieldAlert },
  isolated: { label: "Isolated", className: "border-cyan-300/30 bg-cyan-300/10 text-cyan-200", icon: LockKeyhole },
  recovering: { label: "Recovering", className: "border-blue-300/30 bg-blue-300/10 text-blue-200", icon: CircleDot },
};

const severityStyles: Record<Severity, string> = {
  info: "text-slate-400",
  warning: "text-amber-200",
  critical: "text-red-300",
  success: "text-emerald-300",
};

export function Panel({ children, className = "", as: Tag = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return <Tag className={`rounded-2xl border border-white/[0.08] bg-[#10151d]/90 shadow-[0_18px_60px_rgba(0,0,0,0.18)] ${className}`}>{children}</Tag>;
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <div className="mb-5 flex items-end justify-between gap-4"><div>{eyebrow && <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/70">{eyebrow}</p>}<h2 className="text-lg font-semibold tracking-tight text-slate-100">{title}</h2></div>{action}</div>;
}

export function StatusBadge({ status }: { status: NodeStatus }) {
  const config = statusStyles[status];
  const Icon = config.icon;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${config.className}`}><Icon size={12} aria-hidden="true" />{config.label}</span>;
}

export function SeverityText({ severity }: { severity: Severity }) { return <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${severityStyles[severity]}`}>{severity}</span>; }

export function PrimaryButton({ children, onClick, className = "", type = "button", disabled = false }: { children: ReactNode; onClick?: () => void; className?: string; type?: "button" | "submit"; disabled?: boolean }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center rounded-xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(103,232,249,0.16)] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}>{children}</button>;
}

export function SecondaryButton({ children, onClick, className = "", type = "button" }: { children: ReactNode; onClick?: () => void; className?: string; type?: "button" | "submit" }) {
  return <button type={type} onClick={onClick} className={`inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 ${className}`}>{children}</button>;
}

export function IconLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) { return <span className="inline-flex items-center gap-2 text-xs text-slate-400">{icon}{children}</span>; }
