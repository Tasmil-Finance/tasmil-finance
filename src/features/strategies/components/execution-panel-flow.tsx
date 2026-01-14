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
function ExecutionStepNode({ data }: { data: ExecutionStep }) {
  return (
    <Card className="min-w-[200px] border-primary/20 bg-card p-4 shadow-sm">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            Step {data.step}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {data.chain}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-sm">{data.protocol}</p>
          <p className="text-muted-foreground text-xs">{data.action}</p>
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
      data: step,
    }));

    const flowEdges: Edge[] = executionSteps.slice(0, -1).map((step, index) => ({
      id: `edge-${step.step}-${executionSteps[index + 1].step}`,
      source: `step-${step.step}`,
      target: `step-${executionSteps[index + 1].step}`,
      type: "smoothstep",
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "hsl(var(--primary))",
      },
      style: {
        stroke: "hsl(var(--primary))",
        strokeWidth: 2,
      },
    }));

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
          className="bg-muted/30"
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === "executionStep") {
                return "hsl(var(--primary))";
              }
              return "hsl(var(--muted-foreground))";
            }}
            className="bg-background"
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
