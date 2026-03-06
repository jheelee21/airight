"use client";

import { useCompanyStore } from "@/store/companyStore";
import { useAuthStore } from "@/store/authStore";

import RiskCard from "@/components/RiskCard";
import DependencyGraph from "@/components/DependencyGraph";

import { AlertCircle, TrendingUp, ShieldAlert, Globe, Filter, Search, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function DashboardPage() {
  const { context, setContext, refreshIntelligence, isRefreshing } = useCompanyStore();
  const user = useAuthStore((state: any) => state.user);
  const [isLoading, setIsLoading] = useState(!context && !!user);

  useEffect(() => {
    if (user?.business_id && !context) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/${user.business_id}`)
        .then(res => res.json())
        .then(data => {
          if (data.name) {
            setContext({
              name: data.name,
              description: data.description || "",
            });
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [user?.business_id, context, setContext]);

  const risksVersion = useCompanyStore((state: any) => state.risksVersion);
  const [risks, setRisks] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    if (user?.business_id) {
      // Fetch risks
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/${user.business_id}/risks`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const sortedRisks = [...data].sort((a, b) => 
              (b.severity * b.probability) - (a.severity * a.probability)
            );
            setRisks(sortedRisks);
          }
        })
        .catch(err => console.error("Failed to fetch risks:", err));

      // Fetch news
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/${user.business_id}/news`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setNews(data);
          }
        })
        .catch(err => console.error("Failed to fetch news:", err));
    }
  }, [user?.business_id, risksVersion]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }



  const criticalCount = risks.filter((r: any) => (r.severity * r.probability) >= 0.25).length;
  const mediumCount = risks.filter((r: any) => (r.severity * r.probability) >= 0.1 && (r.severity * r.probability) < 0.25).length;

  // Compute Overload Rate: % of actions that are NOT complete
  const overloadRate = useMemo(() => {
    const allActions = risks.flatMap((r: any) => r.actions || []);
    if (allActions.length === 0) return 0;
    const incompleteCount = allActions.filter(
      (a: any) => a.implementation_status?.toLowerCase() !== "complete" && a.implementation_status?.toLowerCase() !== "resolved"
    ).length;
    return Math.round((incompleteCount / allActions.length) * 100);
  }, [risks]);

  // Compute Supply Chain Health from average risk score
  const supplyChainHealth = useMemo(() => {
    if (risks.length === 0) return { label: "No Data", color: "text-zinc-400" };
    const avgRisk = risks.reduce((sum: number, r: any) => sum + (r.severity * r.probability), 0) / risks.length;
    if (avgRisk < 0.10) return { label: "Excellent", color: "text-emerald-500" };
    if (avgRisk < 0.20) return { label: "Stable", color: "text-emerald-500" };
    if (avgRisk < 0.35) return { label: "At Risk", color: "text-amber-500" };
    return { label: "Critical", color: "text-red-500" };
  }, [risks]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Risk Intelligence Feed
          </h1>
          <p className="text-zinc-500 text-sm">
            Monitoring risks for <span className="font-medium text-zinc-900 dark:text-zinc-100">{context?.name || "your business"}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => user?.business_id && refreshIntelligence(user.business_id)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isRefreshing ? (
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-3 h-3" />
            )}
            {isRefreshing ? "Analyzing..." : "Refresh Intelligence"}
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Agents Active</span>
          </div>
        </div>
      </div>

      {/* Dependency Graph Section */}
      <div className="w-full">
        <DependencyGraph businessId={user?.business_id} />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<ShieldAlert className="text-red-500" />} 
          label="Critical Issues" 
          value={criticalCount.toString()} 
          tooltip="High-impact risks requiring immediate executive intervention."
        />
        <StatCard 
          icon={<AlertCircle className="text-amber-500" />} 
          label="Medium Risks" 
          value={mediumCount.toString()} 
          tooltip="Moderate risks monitored by operational teams for mitigation."
        />
        <StatCard 
          icon={<Zap className={overloadRate >= 70 ? "text-red-500" : overloadRate >= 40 ? "text-amber-500" : "text-emerald-500"} />} 
          label="Overload Rate" 
          value={`${overloadRate}%`} 
          tooltip="Percentage of unresolved mitigation actions across all risks."
        />
        <StatCard 
          icon={<Globe className={supplyChainHealth.color} />} 
          label="Supply Chain Health" 
          value={supplyChainHealth.label} 
          tooltip="Aggregate health derived from average risk severity across the supply chain."
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Feed - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            Intelligence Feed
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {risks.map((risk: any) => (
              <RiskCard key={risk.id} risk={risk} />
            ))}
          </div>
        </div>

        {/* Sidebar - Right Column (1/3) */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
              Relevant News
            </h2>
            <div className="space-y-4">
              {news.length > 0 ? (
                news.map((item: any) => (
                  <NewsCard 
                    key={item.id}
                    title={item.title} 
                    summary={item.content} 
                    url={item.url}
                    time={new Date(item.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  />
                ))
              ) : (
                <p className="text-xs text-zinc-500 italic">Scanning for relevant updates...</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
              Company Abstract
            </h2>
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Operating high-utilization assembly routes for Pixel 9 Pro. Current focus on diversification of battery suppliers to reduce sub-assembly bottleneck at South Korean facilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewsCard({ title, summary, time, url }: { title: string, summary: string, time: string, url?: string }) {
  const content = (
    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all bg-white dark:bg-zinc-950 group">
      <div className="flex justify-between items-start mb-1">
        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 transition-colors">{title}</h4>
        <span className="text-[10px] text-zinc-400 font-medium">{time}</span>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{summary}</p>
    </div>
  );

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block outline-none">
        {content}
      </a>
    );
  }

  return content;
}

function StatCard({ icon, label, value, description, tooltip }: { icon: React.ReactNode, label: string, value: string, description?: string, tooltip?: string }) {
  return (
    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col gap-1 relative group cursor-help">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium text-zinc-500">{label}</span>
      </div>
      <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{value}</div>
      {description && <div className="text-[10px] text-zinc-400 mt-1">{description}</div>}
      
      {/* Tooltip */}
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-zinc-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center shadow-2xl border border-white/10 backdrop-blur-sm">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-zinc-900" />
        </div>
      )}
    </div>
  );
}
