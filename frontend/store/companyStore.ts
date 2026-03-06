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
  businessId: number | null;
  setBusinessId: (id: number) => void;
  setContext: (context: CompanyContext) => void;
  updateContext: (businessId: number, context: CompanyContext) => Promise<void>;
  clearContext: () => void;
  risksVersion: number;
  triggerRisksRefresh: () => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      context: null,
      businessId: null,
      setBusinessId: (id) => set({ businessId: id }),
      setContext: (context) => set({ context }),
      updateContext: async (businessId, context) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/${businessId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: context.name,
            product_lines: context.productLines.join(","),
            competitors: context.competitors.join(","),
            regional_focus: context.regionalFocus.join(","),
          }),
        });
        if (response.ok) {
          set({ context, businessId });
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
