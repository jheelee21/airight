"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Factory, Box, Users, MapPin } from "lucide-react";
import { useCompanyStore } from "@/store/companyStore";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "name", title: "Company Profile", icon: <Factory className="w-4 h-4" /> },
  { id: "productLines", title: "Product Lines", icon: <Box className="w-4 h-4" /> },
  { id: "competitors", title: "Competitors", icon: <Users className="w-4 h-4" /> },
  { id: "regionalFocus", title: "Regional Focus", icon: <MapPin className="w-4 h-4" /> },
];

export default function OnboardingForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    productLines: [] as string[],
    competitors: [] as string[],
    regionalFocus: [] as string[],
  });
  const [inputValue, setInputValue] = useState("");
  const setContext = useCompanyStore((state) => state.setContext);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setContext(formData);
    }
  };

  const addItem = () => {
    if (!inputValue.trim()) return;
    const key = STEPS[currentStep].id as keyof typeof formData;
    if (Array.isArray(formData[key])) {
      setFormData({ ...formData, [key]: [...(formData[key] as string[]), inputValue.trim()] });
    }
    setInputValue("");
  };

  const removeItem = (item: string) => {
    const key = STEPS[currentStep].id as keyof typeof formData;
    if (Array.isArray(formData[key])) {
      setFormData({ ...formData, [key]: (formData[key] as string[]).filter((i) => i !== item) });
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-20">
      <div className="glass-panel p-8 rounded-2xl">
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-2">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                  idx <= currentStep 
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" 
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                )}
              >
                {idx < currentStep ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              {idx === currentStep && (
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 hidden sm:block">
                  {step.title}
                </span>
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">What is your company name?</h2>
                <p className="text-sm text-zinc-500">This helps our agents filter news specific to your entity.</p>
                <input
                  autoFocus
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Gigacore Energy"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}

            {currentStep > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {STEPS[currentStep].title}
                </h2>
                <p className="text-sm text-zinc-500">Add key items. Type and press enter.</p>
                
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addItem()}
                    placeholder="Type to add..."
                    className="flex-1 bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button onClick={addItem} className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 rounded-lg">
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 min-h-[40px]">
                  {(formData[STEPS[currentStep].id as keyof typeof formData] as string[] || []).map((item) => (
                    <span 
                      key={item} 
                      className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      {item}
                      <button onClick={() => removeItem(item)} className="hover:text-red-500">
                        <Check className="w-3 h-3 rotate-45" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-12 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <button
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(currentStep - 1)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 disabled:opacity-0 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-all"
          >
            {currentStep === STEPS.length - 1 ? "Finish" : "Next"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
