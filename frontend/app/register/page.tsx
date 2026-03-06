"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, User, Mail, Lock, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    admin_name: "",
    admin_email: "",
    password: "",
    business_name: "",
    business_description: "",
  });
  const [error, setError] = useState("");
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const [agentEvents, setAgentEvents] = useState<string[]>([]);
  const router = useRouter();

  const handleNext = () => {
    if (step === 1 && (!formData.admin_name || !formData.admin_email || !formData.password)) {
      setError("Please fill in all admin details");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleBack = () => {
    setError("");
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      handleNext();
      return;
    }

    setIsAgentLoading(true);
    setError("");
    setAgentEvents(["Initializing AI agents...", "Analyzing supply chain description..."]);

    try {
      // 1. Call Agent Flow
      const agentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agent/flow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          company_description: formData.business_description 
        }),
      });

      const agentData = await agentResponse.json();
      
      if (!agentResponse.ok || !agentData.business_id) {
        throw new Error(agentData.detail || "AI Agent failed to analyze supply chain. Please try a more detailed description.");
      }

      setAgentEvents(prev => [...prev, "Analysis complete! Finalizing account..."]);

      // 2. Register User with the returned business_id
      const registerResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_name: formData.admin_name,
          admin_email: formData.admin_email,
          password: formData.password,
          business_id: agentData.business_id
        }),
      });

      const registerData = await registerResponse.json();

      if (registerResponse.ok) {
        router.push("/login?registered=true");
      } else {
        setError(registerData.detail || "Account creation failed after analysis.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsAgentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 mb-4">
            <CheckCircle2 className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            {step === 1 ? "Create your account" : "Business Profile"}
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            {step === 1 ? "Start monitoring your supply chain in minutes" : "Tell us about your organization"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Admin Details</label>
                  
                  <div className="relative group">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                    <input 
                      type="text"
                      placeholder="Full Name"
                      value={formData.admin_name}
                      onChange={(e) => setFormData({...formData, admin_name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-100/50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all text-sm text-zinc-900 placeholder:text-zinc-500"
                      required
                    />
                  </div>

                  <div className="relative group mt-3">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                    <input 
                      type="email"
                      placeholder="Email Address"
                      value={formData.admin_email}
                      onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-100/50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all text-sm text-zinc-900 placeholder:text-zinc-500"
                      required
                    />
                  </div>

                  <div className="relative group mt-3">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                    <input 
                      type="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-100/50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all text-sm text-zinc-900 placeholder:text-zinc-500"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleNext}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl transition-all text-sm mt-6"
                >
                  Continue to Business Setup
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {isAgentLoading ? (
                  <div className="py-8 space-y-6 text-center">
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 border-4 border-zinc-100 rounded-full" />
                      <motion.div 
                        className="absolute inset-0 border-4 border-zinc-900 rounded-full border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-bold text-zinc-900">AI Agents at Work</h3>
                      <div className="h-20 overflow-hidden relative">
                         <div className="space-y-2">
                           {agentEvents.slice(-2).map((event, i) => (
                             <motion.p 
                               key={i}
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               className="text-xs text-zinc-500"
                             >
                               {event}
                             </motion.p>
                           ))}
                         </div>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">
                      Estimated time: 30-45 seconds
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Business Details</label>
                      
                      <div className="relative group">
                        <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                        <input 
                          type="text"
                          placeholder="Business Name"
                          value={formData.business_name}
                          onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 bg-zinc-100/50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all text-sm text-zinc-900 placeholder:text-zinc-500"
                          required
                        />
                      </div>

                      <div className="mt-3">
                        <textarea 
                          rows={6}
                          placeholder="Describe your supply chain (e.g., We source lithium from Australia, assemble batteries in China, and distribute globally...)"
                          value={formData.business_description}
                          onChange={(e) => setFormData({...formData, business_description: e.target.value})}
                          className="w-full px-4 py-3 bg-zinc-100/50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all text-sm text-zinc-900 placeholder:text-zinc-500 resize-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button 
                        type="button"
                        onClick={handleBack}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold rounded-2xl transition-all text-sm"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </button>
                      <button 
                        type="submit"
                        className="flex-[2] flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl transition-all text-sm"
                      >
                        Analyze & Create Account
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <div className="mt-8 text-center border-t border-zinc-100 pt-6">
          <p className="text-zinc-500 text-sm">
            Already registered?{" "}
            <Link href="/login" className="text-zinc-900 font-bold hover:underline decoration-zinc-900 decoration-2 underline-offset-4">
              Sign in here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
