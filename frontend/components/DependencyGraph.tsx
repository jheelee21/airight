"use client";

import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  Position,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Factory, Warehouse, Cpu, Truck, HardHat } from 'lucide-react';
import { cn } from '@/lib/utils';

// Custom Node Types
const EntityNode = ({ data }: { data: any }) => {
  const category = data.category || 'supplier';
  const isOEM = category === 'oem';
  const isInternal = category === 'factory' || category === 'inventory';
  
  const icons: Record<string, React.ReactNode> = {
    factory: <Factory className="w-6 h-6" />,
    inventory: <Warehouse className="w-6 h-6" />,
    oem: <Cpu className="w-8 h-8" />,
    supplier: <Truck className="w-5 h-5" />
  };

  const nodeStyles: Record<string, { badge: string, iconCont: string, categoryText: string }> = {
    factory: { 
      badge: "bg-emerald-500", 
      iconCont: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400",
      categoryText: "text-emerald-500"
    },
    inventory: { 
      badge: "bg-amber-500", 
      iconCont: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400",
      categoryText: "text-amber-500"
    },
    oem: { 
      badge: "bg-pink-500", 
      iconCont: "bg-zinc-800 border-pink-500/50 text-pink-500",
      categoryText: "text-pink-400"
    },
    supplier: { 
      badge: "bg-blue-500", 
      iconCont: "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500",
      categoryText: "text-zinc-400"
    }
  };

  const style = nodeStyles[category] || nodeStyles.supplier;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-3 rounded-2xl border-4 transition-all duration-500 min-h-[120px] relative",
      isInternal ? "shadow-[0_20px_50px_rgba(16,185,129,0.1)] dark:shadow-[0_20px_50px_rgba(16,185,129,0.05)]" : "",
      data.hasRisk ? "ring-4 ring-offset-4 ring-red-500/50" : ""
    )}
    style={data.style}
    >
      <Handle type="target" position={Position.Left} className="!bg-zinc-400 !w-2 !h-2 border-none" />
      
      {/* Unity Badge for Internal Entities */}
      {isInternal && (
        <div className={cn("absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-black text-white uppercase tracking-widest shadow-lg whitespace-nowrap z-10", style.badge)}>
          Business Asset
        </div>
      )}

      <div className={cn("mb-2 p-3 rounded-xl border transition-colors", style.iconCont)}>
        {icons[category] || <HardHat className="w-5 h-5" />}
      </div>
      
      <div className="text-center">
        <div className={cn("text-[9px] font-black uppercase tracking-tighter mb-0.5", style.categoryText)}>
          {category}
        </div>
        <div className={cn(
          "text-xs font-bold leading-tight px-1",
          isOEM ? "text-white" : "text-zinc-900 dark:text-zinc-100"
        )}>
          {data.label}
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="!bg-zinc-400 !w-2 !h-2 border-none" />
    </div>
  );
};

const nodeTypes = {
  entity: EntityNode,
};

const initialNodes: Node[] = [
  { 
    id: '1', 
    type: 'entity',
    position: { x: 0, y: 100 }, 
    data: { 
      label: 'Primary Supplier (Lithium)', 
      category: 'supplier',
      style: { background: '#eff6ff', border: '3px solid #3b82f6', borderRadius: '24px', width: 160 }
    }
  },
  { 
    id: '2', 
    type: 'entity',
    position: { x: 400, y: 0 }, 
    data: { 
      label: 'Battery Assembly Plant', 
      category: 'factory',
      style: { background: '#fff', border: '3px solid #10b981', borderRadius: '24px', width: 200 }
    }
  },
  { 
    id: '3', 
    type: 'entity',
    position: { x: 400, y: 200 }, 
    data: { 
      label: 'Casing Manufacturer', 
      category: 'factory',
      style: { background: '#fff', border: '3px solid #10b981', borderRadius: '24px', width: 200 }
    }
  },
  { 
    id: '4', 
    type: 'entity',
    position: { x: 800, y: 100 }, 
    data: { 
      label: 'Final Assembly (OEM)', 
      category: 'oem',
      style: { background: '#09090b', color: '#fff', border: '3px solid #ec4899', borderRadius: '24px', width: 240 }
    }
  },
];

const initialEdges: Edge[] = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2', 
    label: 'Refined Lithium',
    animated: true,
    style: { stroke: '#3b82f6' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
  },
  { 
    id: 'e1-3', 
    source: '1', 
    target: '3', 
    label: 'Raw Materials',
    style: { stroke: '#94a3b8' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
  },
  { 
    id: 'e2-4', 
    source: '2', 
    target: '4', 
    label: 'Battery Packs',
    style: { stroke: '#3b82f6' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
  },
  { 
    id: 'e3-4', 
    source: '3', 
    target: '4', 
    label: 'Finished Casings',
    style: { stroke: '#94a3b8' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
  },
];

interface DependencyGraphProps {
  businessId?: number;
}

export default function DependencyGraph({ businessId }: DependencyGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    if (businessId) {
      // Fetch both graph and risks to perform filtering
      Promise.all([
        fetch(`http://localhost:8000/api/business/${businessId}/graph`).then(res => res.json()),
        fetch(`http://localhost:8000/api/business/${businessId}/risks`).then(res => res.json())
      ])
        .then(([graphData, riskData]) => {
          if (graphData.nodes && graphData.nodes.length > 0) {
            // Layout constants
            const tierX: Record<string, number> = {
              'supplier': 0,
              'inventory': 400,
              'factory': 400,
              'oem': 800
            };

            const categoryColors: Record<string, string> = {
              'supplier': '#3b82f6', // blue
              'inventory': '#f59e0b', // amber
              'factory': '#10b981',  // emerald
              'oem': '#ec4899'       // pink
            };

            // Track how many nodes in each x-position for Y-offset
            const xCounts: Record<number, number> = {};

            // Filtering logic for edges:
            // 1. Edges with risks (entity or route)
            // 2. Edges leading to OEM
            const riskyEntityIds = new Set(riskData.filter((r: any) => r.target_type === 'entity').map((r: any) => r.target_id.toString()));
            const riskyRouteIds = new Set(riskData.filter((r: any) => r.target_type === 'route').map((r: any) => r.target_id.toString()));
            const oemNodeIds = new Set(graphData.nodes.filter((n: any) => n.category === 'oem').map((n: any) => n.id.toString()));

            const filteredEdges = graphData.edges
              .filter((e: any) => {
                const isToOEM = oemNodeIds.has(e.end_entity_id.toString());
                const isFromOEM = oemNodeIds.has(e.start_entity_id.toString());
                const hasRouteRisk = riskyRouteIds.has(e.id.toString());
                const hasEntityRisk = riskyEntityIds.has(e.start_entity_id.toString()) || riskyEntityIds.has(e.end_entity_id.toString());
                
                return isToOEM || isFromOEM || hasRouteRisk || hasEntityRisk;
              });

            // IDs of nodes that have at least one edge after filtering
            const connectedNodeIds = new Set();
            filteredEdges.forEach((e: any) => {
              connectedNodeIds.add(e.start_entity_id.toString());
              connectedNodeIds.add(e.end_entity_id.toString());
            });

            // Nodes that are associated with a risk (directly or via a risky edge)
            const associatedRiskyNodeIds = new Set(riskyEntityIds);
            filteredEdges.forEach((e: any) => {
              if (riskyRouteIds.has(e.id.toString())) {
                associatedRiskyNodeIds.add(e.start_entity_id.toString());
                associatedRiskyNodeIds.add(e.end_entity_id.toString());
              }
            });

            const apiNodes = graphData.nodes
              .filter((n: any) => connectedNodeIds.has(n.id.toString()))
              .map((n: any) => {
                const category = n.category || 'supplier';
                const x = tierX[category] ?? 0;
                
                if (xCounts[x] === undefined) xCounts[x] = 0;
                const y = xCounts[x] * 160;
                xCounts[x]++;

                const isInternal = category === 'factory' || category === 'inventory';
                const isOEM = category === 'oem';
                const hasRisk = associatedRiskyNodeIds.has(n.id.toString());

                return {
                  id: n.id.toString(),
                  type: 'entity',
                  position: { x, y },
                  data: { 
                    label: n.name, 
                    category: category,
                    hasRisk: hasRisk,
                    style: {
                      background: isOEM ? '#09090b' : (isInternal ? '#fff' : '#eff6ff'), 
                      color: isOEM ? '#fff' : '#09090b',
                      border: `3px solid ${categoryColors[category] || '#e2e8f0'}`, 
                      borderRadius: '24px', 
                      width: isOEM ? 240 : (isInternal ? 200 : 160),
                      opacity: hasRisk ? 1 : 0.6,
                      filter: hasRisk ? 'none' : 'grayscale(0.3)',
                    }
                  }
                };
              });

            const apiEdges = filteredEdges.map((e: any) => {
              const hasRisk = riskyRouteIds.has(e.id.toString());
              return {
                id: `e${e.id}`,
                source: e.start_entity_id.toString(),
                target: e.end_entity_id.toString(),
                label: e.name,
                animated: true,
                style: { 
                  stroke: hasRisk ? '#ef4444' : 'whitesmoke', 
                  strokeWidth: hasRisk ? 4 : 2,
                  opacity: 1 
                },
                markerEnd: { type: MarkerType.ArrowClosed, color: hasRisk ? '#ef4444' : 'whitesmoke' },
                labelStyle: { fontSize: '10px', fill: hasRisk ? '#b91c1c' : '#64748b', fontWeight: '700', opacity: hasRisk ? 1 : 0.5 },
                labelBgStyle: { fill: '#fff', fillOpacity: 0.9 },
                labelBgPadding: [6, 4],
                labelBgBorderRadius: 4,
              };
            });

            setNodes(apiNodes);
            setEdges(apiEdges);
          }
        })
        .catch(err => console.error("Failed to fetch graph data:", err));
    }
  }, [businessId, setNodes, setEdges]);

  return (
    <div className="h-[400px] w-full glass-panel rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Supply Chain Dependency Graph</h3>
        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Real-time Visualization</span>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => {
          const element = document.getElementById(`risk-${node.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
            }, 2000);
          }
        }}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
