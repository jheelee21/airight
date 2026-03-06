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
} from 'reactflow';
import 'reactflow/dist/style.css';

const nodeTypes = {}; // Custom node types can be added here

const initialNodes: Node[] = [
  { 
    id: '1', 
    position: { x: 0, y: 100 }, 
    data: { label: 'Primary Supplier (Lithium)' },
    style: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }
  },
  { 
    id: '2', 
    position: { x: 250, y: 0 }, 
    data: { label: 'Battery Assembly Plant' },
    style: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }
  },
  { 
    id: '3', 
    position: { x: 250, y: 200 }, 
    data: { label: 'Casing Manufacturer' },
    style: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }
  },
  { 
    id: '4', 
    position: { x: 500, y: 100 }, 
    data: { label: 'Final Assembly (OEM)' },
    style: { background: '#18181b', color: '#fff', border: '1px solid #27272a', borderRadius: '8px', padding: '10px' }
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
      fetch(`http://localhost:8000/api/business/${businessId}/graph`)
        .then(res => res.json())
        .then(data => {
          if (data.nodes && data.nodes.length > 0) {
            // Layout constants
            const tierX: Record<string, number> = {
              'tier-3': 0,
              'tier-2': 300,
              'tier-1': 600,
              'oem': 900
            };

            const tierColors: Record<string, string> = {
              'tier-3': '#3b82f6', // blue
              'tier-2': '#f59e0b', // amber
              'tier-1': '#10b981', // emerald
              'oem': '#18181b'    // zinc/black
            };

            // Track how many nodes in each tier for Y-offset
            const tierCounts: Record<string, number> = {};

            const apiNodes = data.nodes.map((n: any) => {
              const category = n.category || 'oem';
              const x = tierX[category] ?? 900;
              
              if (!tierCounts[category]) tierCounts[category] = 0;
              const y = tierCounts[category] * 120;
              tierCounts[category]++;

              return {
                id: n.id.toString(),
                position: { x, y },
                data: { label: n.name, category: n.category },
                sourcePosition: Position.Right,
                targetPosition: Position.Left,
                style: { 
                  background: category === 'oem' ? '#18181b' : '#f8fafc', 
                  color: category === 'oem' ? '#fff' : '#18181b',
                  border: `2px solid ${tierColors[category] || '#e2e8f0'}`, 
                  borderRadius: '12px', 
                  padding: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  width: 160,
                  textAlign: 'center',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }
              };
            });

            const apiEdges = data.edges.map((e: any) => ({
              id: `e${e.id}`,
              source: e.start_entity_id.toString(),
              target: e.end_entity_id.toString(),
              label: e.name,
              animated: true,
              style: { stroke: '#94a3b8', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
              labelStyle: { fontSize: '10px', fill: '#64748b', fontWeight: '500' },
              labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
              labelBgPadding: [4, 2],
              labelBgBorderRadius: 4,
            }));

            setNodes(apiNodes);
            setEdges(apiEdges);
          }
        })
        .catch(err => console.error("Failed to fetch graph:", err));
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
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
