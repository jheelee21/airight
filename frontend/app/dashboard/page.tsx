"use client";

import { useCompanyStore } from "@/store/companyStore";
import { useAuthStore } from "@/store/authStore";
import OnboardingForm from "@/components/OnboardingForm";
import RiskCard from "@/components/RiskCard";
import DependencyGraph from "@/components/DependencyGraph";
import { MOCK_RISKS } from "@/lib/mockData";
import { AlertCircle, TrendingUp, ShieldAlert, Globe, Filter, Search } from "lucide-react";
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

  useEffect(() => {
    if (user?.business_id) {
      fetch(`http://localhost:8000/api/business/${user.business_id}/risks`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            // Sort by priority (severity * probability) descending
            const sortedRisks = [...data].sort((a, b) => 
              (b.severity * b.probability) - (a.severity * a.probability)
            );
            setRisks(sortedRisks);
          }
        })
        .catch(err => console.error("Failed to fetch risks:", err));
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
        <StatCard icon={<ShieldAlert className="text-red-500" />} label="Critical Issues" value={criticalCount.toString()} />
        <StatCard icon={<AlertCircle className="text-amber-500" />} label="Medium Risks" value={mediumCount.toString()} />
        <StatCard icon={<TrendingUp className="text-blue-500" />} label="Market Trends" value="12" />
        <StatCard icon={<Globe className="text-zinc-500" />} label="Sources Scanned" value="142" />
      </div>

      {/* Risk Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {risks.map((risk: any) => (
          <RiskCard key={risk.id} risk={risk} />
        ))}
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
