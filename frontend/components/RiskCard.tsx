"use client";

import { motion } from "framer-motion";
import { ExternalLink, AlertTriangle, ShieldCheck, ArrowRight, Info } from "lucide-react";
import { RiskIntelligence, MitigationStep } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface RiskCardProps {
  risk: RiskIntelligence;
}

export default function RiskCard({ risk }: RiskCardProps) {
  const riskScore = risk.severity * risk.likelihood;
  
  const getSeverityStyle = (score: number) => {
    if (score >= 20) return "bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/50";
    if (score >= 10) return "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50";
    return "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900/50";
  };

  const getStatusIcon = (score: number) => {
    if (score >= 20) return <AlertTriangle className="w-4 h-4" />;
    if (score >= 10) return <ShieldCheck className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="risk-card p-6 rounded-2xl flex flex-col gap-4 overflow-hidden relative"
    >
      {/* Category Tag */}
      <div className="flex items-center justify-between">
        <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border border-zinc-200 dark:border-zinc-700">
          {risk.category}
        </span>
        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border", getSeverityStyle(riskScore))}>
          {getStatusIcon(riskScore)}
          Score: {riskScore}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 leading-tight mb-2">
          {risk.title}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3">
          {risk.synopsis}
        </p>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs py-3 border-y border-zinc-100 dark:border-zinc-800">
        <a 
          href={risk.sourceUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          {risk.sourceName} <ExternalLink className="w-3 h-3" />
        </a>
        <span className="text-zinc-400">{risk.detectedAt}</span>
      </div>

      {/* Mitigation Roadmap */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Mitigation Roadmap</h4>
        <div className="space-y-2">
          {risk.mitigationRoadmap.map((step) => (
            <MitigationItem key={step.id} step={step} />
          ))}
        </div>
      </div>

      <button className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all border border-zinc-200 dark:border-zinc-700">
        View Full Analysis 
      </button>
    </motion.div>
  );
}

function MitigationItem({ step }: { step: MitigationStep }) {
  const getStatusColor = (status: MitigationStep["status"]) => {
    switch (status) {
      case "Resolved": return "bg-emerald-500";
      case "In Progress": return "bg-blue-500";
      default: return "bg-zinc-300 dark:bg-zinc-600";
    }
  };

  return (
    <div className="flex items-center gap-3 group">
      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", getStatusColor(step.status))} />
      <span className="text-xs text-zinc-600 dark:text-zinc-400 flex-1 leading-snug">{step.action}</span>
      <ArrowRight className="w-3 h-3 text-zinc-300 dark:text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
