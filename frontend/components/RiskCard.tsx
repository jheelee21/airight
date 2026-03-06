"use client";

import { motion } from "framer-motion";
import { ExternalLink, AlertTriangle, ShieldCheck, ArrowRight, Info } from "lucide-react";
import { RiskIntelligence, MitigationStep } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import RiskDetailModal from "@/components/RiskDetailModal";

import { useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCompanyStore } from "@/store/companyStore";

interface RiskCardProps {
  risk: RiskIntelligence;
}

export default function RiskCard({ risk, news = [], graphData = { nodes: [], edges: [] } }: { risk: any; news?: any[]; graphData?: { nodes: any[]; edges: any[] } }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const riskScore = Math.round((risk.severity * risk.probability) * 100);
  
  const getSeverityStyle = (score: number) => {
    if (score >= 30) return "bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/50";
    if (score >= 15) return "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50";
    return "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900/50";
  };

  const getStatusIcon = (score: number) => {
    if (score >= 30) return <AlertTriangle className="w-4 h-4" />;
    if (score >= 15) return <ShieldCheck className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  };

  const displayTitle =
    risk.title?.trim() ||
    risk.description?.split(".")[0]?.trim() ||
    "Unnamed Risk";
  const rawDesc = risk.description || "";
  const displaySynopsis = rawDesc.startsWith(displayTitle)
    ? rawDesc.slice(displayTitle.length).replace(/^[:\s]+/, "").trim()
    : rawDesc;

  return (
    <motion.div
      id={`risk-${risk.id}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="risk-card p-6 rounded-2xl flex flex-col gap-4 overflow-hidden relative border border-zinc-200 dark:border-zinc-800"
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
          {displayTitle}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3">
          {displaySynopsis}
        </p>
      </div>

      {/* Action Items */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Action Items</h4>
          <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
            {risk.actions?.length || 0} Total
          </span>
        </div>
        <div className="space-y-3">
          {risk.actions && risk.actions.length > 0 ? (
            risk.actions.map((action: any) => (
              <MitigationItem key={action.id} step={{ id: action.id, action: action.description, status: action.implementation_status }} />
            ))
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 italic bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <ShieldCheck className="w-3.5 h-3.5 opacity-50" />
              No immediate actions requiring attention.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}