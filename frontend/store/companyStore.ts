import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CompanyContext {
  name: string;
  description: string;
}

interface CompanyState {
  context: CompanyContext | null;
  businessId: number | null;
  setBusinessId: (id: number) => void;
  setContext: (context: CompanyContext) => void;
  updateContext: (businessId: number, context: CompanyContext) => Promise<void>;
  clearContext: () => void;
  risksVersion: number;
  triggerRisksRefresh: () => void;
  isRefreshing: boolean;
  refreshIntelligence: (businessId: number) => Promise<void>;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set, get) => ({
      context: null,
      businessId: null,
      isRefreshing: false,
      setBusinessId: (id) => set({ businessId: id }),
      setContext: (context) => set({ context }),
      updateContext: async (businessId, context) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/${businessId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: context.name,
            description: context.description,
          }),
        });
        if (response.ok) {
          set({ context, businessId });
        }
      },
      refreshIntelligence: async (businessId) => {
        set({ isRefreshing: true });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agent/flow`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ business_id: businessId }),
          });
          if (response.ok) {
            set((state) => ({ risksVersion: state.risksVersion + 1 }));
          }
        } finally {
          set({ isRefreshing: false });
        }
      },
      clearContext: () => set({ context: null, businessId: null }),
      risksVersion: 0,
      triggerRisksRefresh: () => set((state) => ({ risksVersion: state.risksVersion + 1 })),
    }),
    {
      name: "company-storage",
    }
  )
);
