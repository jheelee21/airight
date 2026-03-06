"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, ShieldCheck, MapPin, Truck, Factory, Warehouse, Cpu, ExternalLink, Info } from "lucide-react";
import { MitigationStep } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { useCompanyStore } from "@/store/companyStore";

interface RiskDetailModalProps {
  risk: any;
  news: any[];
  graphData: { nodes: any[]; edges: any[] };
  onClose: () => void;
}

export default function RiskDetailModal({ risk, news, graphData, onClose }: RiskDetailModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const riskScore = Math.round((risk.severity * risk.probability) * 100);

  const getSeverityStyle = (score: number) => {
    if (score >= 30) return { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-200 dark:border-red-900/50", bar: "bg-red-500" };
    if (score >= 15) return { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-200 dark:border-amber-900/50", bar: "bg-amber-500" };
    return { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-200 dark:border-blue-900/50", bar: "bg-blue-500" };
  };

  const style = getSeverityStyle(riskScore);

  // Resolve affected node from graph data
  const targetNode = risk.target_type === "entity"
    ? graphData.nodes.find((n: any) => n.id === risk.target_id || n.id?.toString() === risk.target_id?.toString())
    : null;

  const targetEdge = risk.target_type === "route"
    ? graphData.edges.find((e: any) => e.id === risk.target_id || e.id?.toString() === risk.target_id?.toString())
    : null;

  // Resolve edge entity names
  let routeStartName = "";
  let routeEndName = "";
  if (targetEdge) {
    const startNode = graphData.nodes.find((n: any) => n.id?.toString() === targetEdge.start_entity_id?.toString());
    const endNode = graphData.nodes.find((n: any) => n.id?.toString() === targetEdge.end_entity_id?.toString());
    routeStartName = startNode?.name || `Entity ${targetEdge.start_entity_id}`;
    routeEndName = endNode?.name || `Entity ${targetEdge.end_entity_id}`;
  }

  // Related news (by risk_id)
  const relatedNews = news.filter((n: any) => n.risk_id === risk.id);

  const categoryIcons: Record<string, React.ReactNode> = {
    factory: <Factory className="w-5 h-5" />,
    inventory: <Warehouse className="w-5 h-5" />,
    oem: <Cpu className="w-5 h-5" />,
    supplier: <Truck className="w-5 h-5" />,
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={backdropRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                {risk.category}
              </span>
              <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border", style.bg, style.text, style.border)}>
                {riskScore >= 30 ? <AlertTriangle className="w-3.5 h-3.5" /> : riskScore >= 15 ? <ShieldCheck className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
                Score: {riskScore}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column (2/3) — Full Analysis */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight mb-3">
                    {risk.description.split('.')[0]}
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {risk.description}
                  </p>
                </div>

                {/* Severity & Probability Bars */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Severity</span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{Math.round(risk.severity * 100)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", style.bar)} style={{ width: `${risk.severity * 100}%` }} />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Probability</span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{Math.round(risk.probability * 100)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", style.bar)} style={{ width: `${risk.probability * 100}%` }} />
                    </div>
                  </div>
                </div>

                {/* Action Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Mitigation Actions</h3>
                    <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                      {risk.actions?.length || 0} Total
                    </span>
                  </div>
                  <div className="space-y-2">
                    {risk.actions && risk.actions.length > 0 ? (
                      risk.actions.map((action: any) => (
                        <ModalActionItem key={action.id} action={action} />
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 italic bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                        <ShieldCheck className="w-3.5 h-3.5 opacity-50" />
                        No mitigation actions defined yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (1/3) — Context */}
              <div className="space-y-6">
                {/* Affected Node/Route */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
                    Affected {risk.target_type === "entity" ? "Node" : "Route"}
                  </h3>

                  {risk.target_type === "entity" && targetNode ? (
                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-600">
                          {categoryIcons[targetNode.category] || <Factory className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{targetNode.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{targetNode.category}</p>
                        </div>
                      </div>
                      {targetNode.location && (
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {targetNode.location}
                        </div>
                      )}
                      {targetNode.description && (
                        <p className="text-xs text-zinc-500 leading-relaxed">{targetNode.description}</p>
                      )}
                    </div>
                  ) : risk.target_type === "route" && targetEdge ? (
                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-blue-500" />
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{targetEdge.name || "Supply Route"}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{routeStartName}</span>
                        <span className="text-zinc-300 dark:text-zinc-600">→</span>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{routeEndName}</span>
                      </div>
                      {targetEdge.description && (
                        <p className="text-xs text-zinc-500 leading-relaxed">{targetEdge.description}</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 italic">
                      Target information unavailable.
                    </div>
                  )}
                </div>

                {/* Related News */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Related News</h3>
                  {relatedNews.length > 0 ? (
                    <div className="space-y-3">
                      {relatedNews.map((item: any) => (
                        <a
                          key={item.id}
                          href={item.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all bg-white dark:bg-zinc-900/50 group"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 transition-colors leading-tight flex-1">
                              {item.title}
                            </h4>
                            {item.url && <ExternalLink className="w-3 h-3 text-zinc-300 group-hover:text-blue-500 shrink-0 ml-2 mt-0.5" />}
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                            {item.content}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-1.5 font-medium">
                            {item.source} · {new Date(item.published_at).toLocaleDateString()}
                          </p>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 italic">
                      No news articles linked to this risk.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Modal-specific action item (read-only display with status toggle)
function ModalActionItem({ action }: { action: any }) {
  const [status, setStatus] = useState(action.implementation_status || "Planned");
  const isUpdatingRef = useRef(false);
  const triggerRisksRefresh = useCompanyStore((state: any) => state.triggerRisksRefresh);

  const getStatusConfig = (currentStatus: string) => {
    const s = currentStatus.toLowerCase();
    if (s === "complete" || s === "resolved") {
      return { text: "text-emerald-600 dark:text-emerald-400", label: "Complete", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-500" };
    }
    if (s === "doing" || s === "in progress") {
      return { text: "text-blue-600 dark:text-blue-400", label: "In Progress", bg: "bg-blue-500/10 border-blue-500/20", dot: "bg-blue-500" };
    }
    return { text: "text-zinc-500 dark:text-zinc-400", label: "Planned", bg: "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700", dot: "bg-zinc-400" };
  };

  const handleToggle = async () => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;

    const previousStatus = status;
    const s = previousStatus.toLowerCase();
    let nextStatus = "Planned";
    if (s === "planned") nextStatus = "In Progress";
    else if (s === "doing" || s === "in progress") nextStatus = "Complete";
    else if (s === "complete" || s === "resolved") nextStatus = "Planned";

    setStatus(nextStatus);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/action/${action.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ implementation_status: nextStatus }),
      });
      if (!response.ok) throw new Error("Failed");
      triggerRisksRefresh();
    } catch {
      setStatus(previousStatus);
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const config = getStatusConfig(status);

  return (
    <div
      className="flex items-start gap-3 group cursor-pointer p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-all"
      onClick={handleToggle}
    >
      <div className={cn("mt-1 w-2 h-2 rounded-full shrink-0", config.dot)} />
      <div className="flex-1">
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-snug group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
          {action.description}
        </p>
        {action.action_type && (
          <p className="text-[10px] text-zinc-400 mt-0.5 uppercase tracking-wider">{action.action_type}</p>
        )}
      </div>
      <div className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm border shrink-0 transition-all group-active:scale-95", config.bg, config.text)}>
        {config.label}
      </div>
    </div>
  );
}
