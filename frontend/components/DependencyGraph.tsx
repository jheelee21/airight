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
import { Factory, Warehouse, Cpu, Truck, HardHat, AlertTriangle } from 'lucide-react';
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

  const nodeStyles: Record<string, { badge: string, iconCont: string, categoryText: string, border: string, bg: string }> = {
    factory: { 
      badge: "bg-amber-500", 
      iconCont: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400",
      categoryText: "text-amber-500",
      border: "border-amber-400",
      bg: "bg-white dark:bg-zinc-950"
    },
    inventory: { 
      badge: "bg-amber-500", 
      iconCont: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400",
      categoryText: "text-amber-500",
      border: "border-amber-400",
      bg: "bg-white dark:bg-zinc-950"
    },
    oem: { 
      badge: "bg-zinc-900 dark:bg-white", 
      iconCont: "bg-zinc-900 border-zinc-700 text-white",
      categoryText: "text-zinc-400",
      border: "border-zinc-900 dark:border-zinc-100",
      bg: "bg-zinc-900 text-white"
    },
    supplier: { 
      badge: "bg-zinc-500", 
      iconCont: "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500",
      categoryText: "text-zinc-400",
      border: "border-zinc-300 dark:border-zinc-700",
      bg: "bg-zinc-50 dark:bg-zinc-900"
    }
  };

  const nodeStyle = nodeStyles[category] || nodeStyles.supplier;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-500 min-h-[120px] relative w-full h-full bg-white dark:bg-zinc-950",
      nodeStyle.border,
      isInternal ? "shadow-xl ring-2 ring-emerald-500/10 border-8" : "border-4",
      data.hasRisk ? "ring-8 ring-offset-4 ring-red-500/50" : ""
    )}
    >
      {/* Risk Indicator Icon */}
      {data.hasRisk && (
        <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1.5 shadow-xl animate-bounce z-20">
          <AlertTriangle className="w-4 h-4 text-white" />
        </div>
      )}
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
        className="!bg-zinc-400 !w-3 !h-3 border-2 border-white dark:border-zinc-950" 
      />
      
      {/* Unity Badge for Internal Entities */}
      {isInternal && (
        <div className={cn("absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg whitespace-nowrap z-10", nodeStyle.badge)}>
          Business Asset
        </div>
      )}

      <div className={cn("mb-2 p-3 rounded-xl border transition-colors", nodeStyle.iconCont)}>
        {icons[category] || <HardHat className="w-5 h-5" />}
      </div>
      
      <div className="text-center">
        <div className={cn("text-[9px] font-black uppercase tracking-tighter mb-0.5", nodeStyle.categoryText)}>
          {category}
        </div>
        <div className={cn(
          "text-xs font-bold leading-tight px-1",
          isOEM ? "text-white" : "text-zinc-900 dark:text-zinc-100"
        )}>
          {data.label}
        </div>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
        className="!bg-zinc-400 !w-3 !h-3 border-2 border-white dark:border-zinc-950" 
      />
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
    position: { x: 300, y: 0 }, 
    data: { 
      label: 'Primary Supplier (Lithium)', 
      category: 'supplier',
    }
  },
  { 
    id: '2', 
    type: 'entity',
    position: { x: 0, y: 300 }, 
    data: { 
      label: 'Battery Assembly Plant', 
      category: 'factory',
    }
  },
  { 
    id: '3', 
    type: 'entity',
    position: { x: 600, y: 300 }, 
    data: { 
      label: 'Casing Manufacturer', 
      category: 'factory',
    }
  },
  { 
    id: '4', 
    type: 'entity',
    position: { x: 300, y: 600 }, 
    data: { 
      label: 'Final Assembly (OEM)', 
      category: 'oem',
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
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/${businessId}/graph`).then(res => res.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/${businessId}/risks`).then(res => res.json())
      ])
        .then(([graphData, riskData]) => {
          if (graphData.nodes && graphData.nodes.length > 0) {
            // Layout constants
            const tierY: Record<string, number> = {
              'supplier': 0,
              'inventory': 300,
              'factory': 300,
              'oem': 600
            };

            const categoryColors: Record<string, string> = {
              'supplier': '#94a3b8', // gray/slate
              'inventory': '#f59e0b', // amber
              'factory': '#f59e0b',  // amber
              'oem': '#09090b'       // black
            };

            // Track how many nodes in each y-position for X-offset
            const yCounts: Record<number, number> = {};

            // Filtering logic for edges:
            // 1. Edges with risks (entity or route)
            // 2. Edges leading to OEM
            // Reachability analysis to OEM
            const oemNodes = graphData.nodes.filter((n: any) => n.category === 'oem');
            const oemNodeIds = new Set<string>(oemNodes.map((n: any) => n.id.toString()));
            
            // Build reverse adjacency list
            const revAdj: Record<string, string[]> = {};
            graphData.edges.forEach((e: any) => {
              const target = e.end_entity_id.toString();
              const source = e.start_entity_id.toString();
              if (!revAdj[target]) revAdj[target] = [];
              revAdj[target].push(source);
            });

            // BFS from OEM nodes backwards
            const reachableToOEM = new Set<string>(oemNodeIds);
            const queue: string[] = Array.from(oemNodeIds);
            while (queue.length > 0) {
              const curr: string = queue.shift()!;
              const sources = revAdj[curr] || [];
              sources.forEach((src: string) => {
                if (!reachableToOEM.has(src)) {
                  reachableToOEM.add(src);
                  queue.push(src);
                }
              });
            }

            // Filter edges and nodes
            const reachableEdges = graphData.edges.filter((e: any) => 
              reachableToOEM.has(e.start_entity_id.toString()) && 
              reachableToOEM.has(e.end_entity_id.toString())
            );

            // Mapping for focus effect
            const entityToRiskMap: Record<string, string> = {};
            const routeToRiskMap: Record<string, string> = {};
            
            riskData.forEach((r: any) => {
              if (r.target_type === 'entity') {
                entityToRiskMap[r.target_id.toString()] = r.id.toString();
              } else if (r.target_type === 'route') {
                routeToRiskMap[r.target_id.toString()] = r.id.toString();
              }
            });

            // Risky IDs (for highlighting)
            const riskyEntityIds = new Set(Object.keys(entityToRiskMap));
            const riskyRouteIds = new Set(Object.keys(routeToRiskMap));

            // Nodes associated with risks in the reachable set
            const associatedRiskyNodeIds = new Set(riskyEntityIds);
            reachableEdges.forEach((e: any) => {
              if (riskyRouteIds.has(e.id.toString())) {
                associatedRiskyNodeIds.add(e.start_entity_id.toString());
                associatedRiskyNodeIds.add(e.end_entity_id.toString());
              }
            });

            const apiNodes = graphData.nodes
              .filter((n: any) => reachableToOEM.has(n.id.toString()))
              .map((n: any) => {
                const category = n.category || 'supplier';
                const y = tierY[category] ?? 0;
                
                if (yCounts[y] === undefined) yCounts[y] = 0;
                const x = yCounts[y] * 300;
                yCounts[y]++;

                const isInternal = category === 'factory' || category === 'inventory';
                const hasRisk = associatedRiskyNodeIds.has(n.id.toString());

                return {
                  id: n.id.toString(),
                  type: 'entity',
                  position: { x, y },
                  data: { 
                    label: n.name, 
                    category: category,
                    hasRisk: hasRisk,
                    riskId: entityToRiskMap[n.id.toString()]
                  }
                };
              });

            const apiEdges = reachableEdges.map((e: any) => {
              const hasRisk = riskyRouteIds.has(e.id.toString());
              const color = hasRisk ? '#ef4444' : '#d4d4d8'; // zinc-300 for better visibility in light mode
              return {
                id: `e${e.id}`,
                source: e.start_entity_id.toString(),
                target: e.end_entity_id.toString(),
                label: e.name,
                animated: true,
                style: { 
                  stroke: color, 
                  strokeWidth: hasRisk ? 4 : 2,
                  opacity: 1 
                },
                markerEnd: { type: MarkerType.ArrowClosed, color: color },
                labelStyle: { fontSize: '10px', fill: hasRisk ? '#ef4444' : '#71717a', fontWeight: '700', opacity: hasRisk ? 1 : 0.8 },
                labelBgStyle: { fill: '#fff', fillOpacity: 0.9 },
                labelBgPadding: [6, 4],
                labelBgBorderRadius: 4,
                data: {
                  riskId: routeToRiskMap[e.id.toString()]
                }
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
          const riskId = node.data.riskId;
          if (riskId) {
            const element = document.getElementById(`risk-${riskId}`);
            if (element) {
              window.scrollTo({
                top: element.getBoundingClientRect().top + window.scrollY - 150,
                behavior: 'smooth'
              });
              
              element.classList.add('ring-4', 'ring-blue-500', 'ring-offset-8', 'z-50', 'scale-[1.02]');
              setTimeout(() => {
                element.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-8', 'z-50', 'scale-[1.02]');
              }, 3000);
            }
          }
        }}
        onEdgeClick={(_, edge) => {
          const riskId = edge.data?.riskId;
          if (riskId) {
            const element = document.getElementById(`risk-${riskId}`);
            if (element) {
              window.scrollTo({
                top: element.getBoundingClientRect().top + window.scrollY - 150,
                behavior: 'smooth'
              });
              
              element.classList.add('ring-4', 'ring-blue-500', 'ring-offset-8', 'z-50', 'scale-[1.02]');
              setTimeout(() => {
                element.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-8', 'z-50', 'scale-[1.02]');
              }, 3000);
            }
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
