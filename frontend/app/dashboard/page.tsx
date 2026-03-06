"use client";

import { useCompanyStore } from "@/store/companyStore";
import { useAuthStore } from "@/store/authStore";
import OnboardingForm from "@/components/OnboardingForm";
import RiskCard from "@/components/RiskCard";
import DependencyGraph from "@/components/DependencyGraph";
import { MOCK_RISKS } from "@/lib/mockData";
import { AlertCircle, TrendingUp, ShieldAlert, Globe, Filter, Search, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const context = useCompanyStore((state: any) => state.context);
  const setContext = useCompanyStore((state: any) => state.setContext);
  const user = useAuthStore((state: any) => state.user);
  const [isLoading, setIsLoading] = useState(!context && !!user);

  useEffect(() => {
    if (user?.business_id && !context) {
      fetch(`http://localhost:8000/api/business/${user.business_id}`)
        .then(res => res.json())
        .then(data => {
          if (data.name) {
            setContext({
              name: data.name,
              productLines: data.product_lines ? data.product_lines.split(",") : [],
              competitors: data.competitors ? data.competitors.split(",") : [],
              regionalFocus: data.regional_focus ? data.regional_focus.split(",") : [],
            });
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [user?.business_id, context, setContext]);

  const [risks, setRisks] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    if (user?.business_id) {
      // Fetch risks
      fetch(`http://localhost:8000/api/business/${user.business_id}/risks`)
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
      fetch(`http://localhost:8000/api/business/${user.business_id}/news`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setNews(data);
          }
        })
        .catch(err => console.error("Failed to fetch news:", err));
    }
  }, [user?.business_id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  // Show onboarding if business information is not populated
  const isProfileComplete = context && context.name && context.productLines.length > 0;

  if (!isProfileComplete) {
    return (
      <div className="p-8">
        <div className="max-w-xl mx-auto text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
            Intelligence Configuration
          </h1>
          <p className="text-zinc-500">
            Define your company profile to activate the autonomous risk scanning agents.
          </p>
        </div>
        <OnboardingForm />
      </div>
    );
  }

  const criticalCount = risks.filter((r: any) => (r.severity * r.probability) >= 0.25).length;
  const mediumCount = risks.filter((r: any) => (r.severity * r.probability) >= 0.1 && (r.severity * r.probability) < 0.25).length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Risk Intelligence Feed
          </h1>
          <p className="text-zinc-500 text-sm">
            Monitoring risks for <span className="font-medium text-zinc-900 dark:text-zinc-100">{context.name}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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
          icon={<Zap className="text-amber-500" />} 
          label="Overload Rate" 
          value="84%" 
          tooltip="Current utilization of the most constrained facility in the supply chain."
        />
        <StatCard 
          icon={<Globe className="text-emerald-500" />} 
          label="Supply Chain Health" 
          value="Stable" 
          tooltip="Aggregate score of all active routes and entity stability."
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

function NewsCard({ title, summary, time }: { title: string, summary: string, time: string }) {
  return (
    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors bg-white dark:bg-zinc-950">
      <div className="flex justify-between items-start mb-1">
        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{title}</h4>
        <span className="text-[10px] text-zinc-400 font-medium">{time}</span>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{summary}</p>
    </div>
  );
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
