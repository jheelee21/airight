"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Mail, Lock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch("http://localhost:8000/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const userData = await response.json();
      login(userData);
      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-zinc-950 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center">
          <div className="w-12 h-12 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center mb-6">
            <Shield className="text-white dark:text-zinc-900 w-6 h-6" />
          </div>
          
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
            Welcome to Airight
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 text-center">
            AI-driven Risk Intelligence for <br/>Consumer Electronics Supply Chain
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-500 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin or email@company.com"
                  className="w-full bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-500 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all mt-4",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {isLoading ? "Signing in..." : "Continue"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-zinc-100 dark:border-zinc-800 pt-6">
            <p className="text-zinc-500 text-sm">
              Don't have an account?{" "}
              <Link href="/register" className="inline-block px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 ml-2">
                Create one now
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 w-full text-center">
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
              v0.1.0-alpha · SECURE ACCESS
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
