import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CompanyContext {
  name: string;
  productLines: string[];
  competitors: string[];
  regionalFocus: string[];
}

interface CompanyState {
  context: CompanyContext | null;
  setContext: (context: CompanyContext) => void;
  clearContext: () => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      context: null,
      setContext: (context) => set({ context }),
      clearContext: () => set({ context: null }),
    }),
    {
      name: "company-storage",
    }
  )
);
