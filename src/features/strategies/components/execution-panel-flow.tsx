"use client";

import {
  Background,
  ConnectionMode,
  Controls,
  type Edge,
  MarkerType,
  MiniMap,
  type Node,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { useMemo } from "react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import type { ExecutionStep } from "../types";

interface ExecutionPanelFlowProps {
  executionSteps: ExecutionStep[];
  className?: string;
}

// Custom node component for execution steps
function ExecutionStepNode({ data }: { data: Record<string, unknown> }) {
  const step = data as unknown as ExecutionStep;

  return (
    <Card className="min-w-[220px] border-zinc-700 bg-zinc-800/90 p-4 shadow-lg backdrop-blur-sm">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="border-zinc-600 bg-zinc-700/50 text-xs text-zinc-300">
            Step {step.step}
          </Badge>
          <Badge variant="secondary" className="border-zinc-600 bg-zinc-700 text-xs text-zinc-200">
            {step.chain}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-sm text-white">{step.protocol}</p>
          <p className="text-xs text-zinc-400">{step.action}</p>
        </div>
        {/* Token indicators */}
        <div className="flex items-center gap-2 pt-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20">
            <span className="text-[10px] text-blue-400">$</span>
          </div>
          <span className="text-xs text-zinc-500">→</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
            <span className="text-[10px] text-emerald-400">$</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

const nodeTypes = {
  executionStep: ExecutionStepNode,
};

export function ExecutionPanelFlow({ executionSteps, className }: ExecutionPanelFlowProps) {
  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node[] = executionSteps.map((step, index) => ({
      id: `step-${step.step}`,
      type: "executionStep",
      position: {
        x: 250,
        y: index * 180,
      },
      data: step as unknown as Record<string, unknown>,
    }));

    const flowEdges: Edge[] = [];
    for (let i = 0; i < executionSteps.length - 1; i++) {
      const step = executionSteps[i];
      const nextStep = executionSteps[i + 1];
      if (step && nextStep) {
        flowEdges.push({
          id: `edge-${step.step}-${nextStep.step}`,
          source: `step-${step.step}`,
          target: `step-${nextStep.step}`,
          type: "smoothstep",
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#6366f1",
          },
          style: {
            stroke: "#6366f1",
            strokeWidth: 2,
          },
        });
      }
    }

    return { nodes: flowNodes, edges: flowEdges };
  }, [executionSteps]);

  return (
    <div className={cn("h-[600px] w-full", className)}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="rounded-lg bg-zinc-950"
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          minZoom={0.5}
          maxZoom={1.5}
        >
          <Background color="#27272a" gap={16} size={1} className="bg-zinc-950" />
          <Controls className="border-zinc-700 bg-zinc-800" />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === "executionStep") {
                return "#3f3f46";
              }
              return "#52525b";
            }}
            className="border-zinc-700 bg-zinc-900"
            maskColor="rgba(0, 0, 0, 0.6)"
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
