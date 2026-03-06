"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useCompanyStore, type CompanyContext } from "@/store/companyStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "business", title: "Business Profile" },
];

export default function OnboardingForm() {
  const [formData, setFormData] = useState<CompanyContext>({
    name: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useAuthStore((state: any) => state.user);
  const updateContext = useCompanyStore((state) => state.updateContext);

  const handleFinish = async () => {
    if (!user?.business_id) return;
    setIsSubmitting(true);
    try {
      await updateContext(user.business_id, formData);
    } catch (error) {
      console.error("Onboarding failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-20">
      <div className="glass-panel p-8 rounded-2xl space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Complete Your Profile</h2>
          <p className="text-sm text-zinc-500 mt-2">Tell us about your business to get started.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Business Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Gigacore Energy"
              className="w-full bg-zinc-100/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500/20 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Business Description
            </label>
            <textarea
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your business operations, supply chain structure, and key objectives..."
              className="w-full bg-zinc-100/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500/20 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleFinish}
          disabled={isSubmitting || !formData.name || !formData.description}
          className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Complete Setup"}
        </button>
      </div>
    </div>
  );
}
