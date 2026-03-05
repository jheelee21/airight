"use client";

import { useCompanyStore } from "@/store/companyStore";
import OnboardingForm from "@/components/OnboardingForm";
import RiskCard from "@/components/RiskCard";
import { MOCK_RISKS } from "@/lib/mockData";
import { AlertCircle, TrendingUp, ShieldAlert, Globe, Filter, Search } from "lucide-react";

export default function DashboardPage() {
  const context = useCompanyStore((state) => state.context);

  if (!context) {
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

  const criticalCount = MOCK_RISKS.filter(r => (r.severity * r.likelihood) >= 20).length;
  const mediumCount = MOCK_RISKS.filter(r => (r.severity * r.likelihood) >= 10 && (r.severity * r.likelihood) < 20).length;

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
          <button className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<ShieldAlert className="text-red-500" />} label="Critical Issues" value={criticalCount.toString()} />
        <StatCard icon={<AlertCircle className="text-amber-500" />} label="Medium Risks" value={mediumCount.toString()} />
        <StatCard icon={<TrendingUp className="text-blue-500" />} label="Market Trends" value="12" />
        <StatCard icon={<Globe className="text-zinc-500" />} label="Sources Scanned" value="142" />
      </div>

      {/* Risk Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {MOCK_RISKS.map((risk) => (
          <RiskCard key={risk.id} risk={risk} />
        ))}
        
        {/* Placeholder Loading State or Empty State Indicator */}
        <div className="lg:col-span-1 rounded-2xl border-2 border-dashed border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center p-8 opacity-40">
          <div className="w-10 h-10 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin mb-4" />
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">Autonomous Scanning...</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="risk-card p-5 rounded-2xl">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{value}</div>
    </div>
  );
}
