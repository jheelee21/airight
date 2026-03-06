"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, User, Mail, Lock, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    business_name: "",
    admin_name: "",
    admin_email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleNext = () => {
    if (step === 1 && !formData.business_name) {
      setError("Business name is required");
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const handleBack = () => {
    setError("");
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to login after successful registration
        router.push("/login?registered=true");
      } else {
        setError(data.detail || "Registration failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
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
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Create your account</h1>
          <p className="text-zinc-500 text-sm mt-2">Start monitoring your supply chain in minutes</p>
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
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Company Information</label>
                  <div className="relative group">
                    <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                    <input 
                      type="text"
                      placeholder="Business Name"
                      value={formData.business_name}
                      onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all text-sm"
                      required
                    />
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleNext}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl transition-all text-sm group"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Admin Details</label>
                  
                  <div className="relative group">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                    <input 
                      type="text"
                      placeholder="Full Name"
                      value={formData.admin_name}
                      onChange={(e) => setFormData({...formData, admin_name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all text-sm"
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
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all text-sm"
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
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all text-sm"
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
                    disabled={isLoading}
                    className="flex-[2] flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl transition-all text-sm disabled:opacity-50"
                  >
                    {isLoading ? "Creating..." : "Complete Setup"}
                  </button>
                </div>
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
