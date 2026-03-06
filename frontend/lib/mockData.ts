export interface MitigationStep {
  id: string;
  action: string;
  status: "Planned" | "In Progress" | "Complete";
}

export interface RiskIntelligence {
  id: string;
  title: string;
  severity: number; // 1-5
  likelihood: number; // 1-5
  category: "Supply Chain" | "Regulatory" | "Geopolitical" | "Competition";
  synopsis: string;
  sourceUrl: string;
  sourceName: string;
  mitigationRoadmap: MitigationStep[];
  detectedAt: string;
}

export const MOCK_RISKS: RiskIntelligence[] = [
  {
    id: "1",
    title: "Lithium-Ion Battery Export Restrictions in South East Asia",
    severity: 5,
    likelihood: 4,
    category: "Regulatory",
    synopsis: "New regulatory framework proposed by regional authorities may delay supply of key battery components by up to 12 weeks for consumer electronics manufacturers.",
    sourceUrl: "https://example.com/news/1",
    sourceName: "Global Trade Daily",
    detectedAt: "2h ago",
    mitigationRoadmap: [
      { id: "m1", action: "Identify alternative suppliers in South America", status: "In Progress" },
      { id: "m2", action: "Negotiate advance purchase agreements", status: "Planned" },
      { id: "m3", action: "Review regional compliance documentation", status: "Planned" },
    ],
  },
  {
    id: "2",
    title: "Semiconductor Fab Labor Shortage in Taiwan",
    severity: 4,
    likelihood: 3,
    category: "Supply Chain",
    synopsis: "Labor disputes at major semiconductor fabrication plants could impact Q3 production cycles for premium smartphone chipsets.",
    sourceUrl: "https://example.com/news/2",
    sourceName: "Tech Quarterly",
    detectedAt: "5h ago",
    mitigationRoadmap: [
      { id: "m4", action: "Buffer stock of critical chipsets for next 6 months", status: "Complete" },
      { id: "m5", action: "Source secondary assembly partners", status: "Planned" },
    ],
  },
];
