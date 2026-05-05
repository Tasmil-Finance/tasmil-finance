"use client";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

// Phase 1 stub. Replaced by <MarketsPage embed/> in Phase 3.
// biome-ignore lint/correctness/noUnusedFunctionParameters: API kept stable for Phase 3 swap
export function StepPoolPicker(_: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm text-white">Custom market picker — coming soon</p>
      <p className="mt-2 text-[11px] text-[#666] max-w-[280px]">
        Phase 3 will let you hand-pick protocols and pools for the agent.
      </p>
    </div>
  );
}
