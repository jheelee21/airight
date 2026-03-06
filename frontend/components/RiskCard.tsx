"use client";

import { motion } from "framer-motion";
import { ExternalLink, AlertTriangle, ShieldCheck, ArrowRight, Info } from "lucide-react";
import { RiskIntelligence, MitigationStep } from "@/lib/mockData";
import { cn } from "@/lib/utils";

import { useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCompanyStore } from "@/store/companyStore";

interface RiskCardProps {
  risk: RiskIntelligence;
}

export default function RiskCard({ risk }: { risk: any }) {
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

  // Map backend risk to UI (adding fallback dummy data for fields not in DB yet)
  const displayTitle = risk.description.split('.')[0]; // Use first sentence as title
  const displaySynopsis = risk.description;

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

      <button className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all border border-zinc-200 dark:border-zinc-700">
        View Full Analysis 
      </button>
    </motion.div>
  );
}

function MitigationItem({ step }: { step: MitigationStep }) {
  const [status, setStatus] = useState(step.status);
  const isUpdatingRef = useRef(false);
  const triggerRisksRefresh = useCompanyStore((state: any) => state.triggerRisksRefresh);

  const getStatusConfig = (currentStatus: string) => {
    const s = currentStatus.toLowerCase();
    if (s === "complete" || s === "resolved") {
      return { 
        text: "text-emerald-600 dark:text-emerald-400", 
        label: "Complete",
        bg: "bg-emerald-500/10 border-emerald-500/20"
      };
    }
    if (s === "doing" || s === "in progress") {
      return { 
        text: "text-blue-600 dark:text-blue-400", 
        label: "In Progress",
        bg: "bg-blue-500/10 border-blue-500/20"
      };
    }
    return { 
      text: "text-zinc-500 dark:text-zinc-400", 
      label: "Planned",
      bg: "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
    };
  };

  const handleToggle = async () => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    
    // Capture current status before optimistic update for rollback
    const previousStatus = status;

    // Cycle: Planned -> In Progress -> Complete -> Planned
    const s = previousStatus.toLowerCase();
    let nextStatus: string = "Planned";
    if (s === "planned") nextStatus = "In Progress";
    else if (s === "doing" || s === "in progress") nextStatus = "Complete";
    else if (s === "complete" || s === "resolved") nextStatus = "Planned";

    // Optimistic update
    setStatus(nextStatus as MitigationStep["status"]);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/action/${step.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ implementation_status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }
      
      // Global refresh trigger
      triggerRisksRefresh();
    } catch (error) {
      console.error("Status update failed:", error);
      // Revert to captured previous status (not stale closure)
      setStatus(previousStatus);
      alert("Failed to sync status with server.");
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const config = getStatusConfig(status);

  return (
    <div 
      className={cn(
        "flex flex-col gap-1.5 group cursor-pointer p-2 -m-2 rounded-xl border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-all",
        isUpdatingRef.current && "opacity-60 grayscale cursor-wait"
      )}
      onClick={handleToggle}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.1)] transition-colors duration-500", config.text.replace('text-', 'bg-'))} />
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex-1 leading-snug group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
          {step.action}
        </span>
        <div className={cn("text-[10px] font-bold uppercase w-20 text-center py-0.5 rounded-sm transition-all transform group-active:scale-95 border", config.bg, config.text)}>
          {config.label}
        </div>
      </div>
    </div>
  );
}
