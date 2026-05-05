"use client";

import { useCallback, useEffect, useState } from "react";
import { usePresets } from "@/features/account/hooks/use-account-api";
import { useStellarBalances } from "@/features/account/hooks/use-stellar-balance";
import { useFarmingActions } from "@/features/farming/hooks/use-farming-actions";
import { useWalletStore } from "@/store/use-wallet";
import {
  type SetupState,
  clearSetupState,
  loadSetupState,
  saveSetupState,
} from "../../utils/setup-state";
import { SetupShell } from "./setup-shell";
import { StepConnect } from "./step-connect";
import { StepCreateAccount } from "./step-create-account";
import { StepDeposit } from "./step-deposit";
import { StepDone } from "./step-done";
import { StepStrategy } from "./step-strategy";

export function SetupPage() {
  const { account } = useWalletStore();
  const publicKey = account ?? "";

  const [state, setState] = useState<SetupState>(() => loadSetupState());
  useEffect(() => saveSetupState(state), [state]);
  useEffect(() => {
    if (state.step === 5) clearSetupState();
  }, [state.step]);

  const balances = useStellarBalances(publicKey);
  const presets = usePresets(state.asset);
  const actions = useFarmingActions(publicKey);

  const set = useCallback(
    (patch: Partial<SetupState>) => setState((prev) => ({ ...prev, ...patch })),
    []
  );

  const advance = useCallback(
    () => set({ step: Math.min(state.step + 1, 5) as SetupState["step"] }),
    [state.step, set]
  );
  const back = () => set({ step: Math.max(state.step - 1, 1) as SetupState["step"] });

  const selectedPresetData = presets.data?.find((p) => p.name === state.preset);
  const reviewApy = selectedPresetData?.estimatedApy ?? 0;
  const poolCount = selectedPresetData?.poolCount ?? 0;
  const balanceForAsset =
    state.asset === "USDC" ? (balances.data?.usdc ?? 0) : (balances.data?.xlm ?? 0);

  const handleFund = useCallback(
    async (amount: number, asset: "USDC" | "XLM") => {
      const ok = await actions.fund(amount, asset);
      if (ok) advance();
    },
    [actions, advance]
  );

  if (state.step === 1) {
    return <StepConnect onConnected={() => set({ step: 2 })} />;
  }

  if (state.step === 2) {
    return (
      <StepStrategy
        mode={state.mode}
        onSelect={(mode) => {
          set({ mode });
          advance();
        }}
        onBack={back}
      />
    );
  }

  if (state.step === 3) {
    return (
      <StepCreateAccount
        publicKey={publicKey}
        preset={state.preset}
        onComplete={advance}
        onBack={back}
      />
    );
  }

  if (state.step === 4) {
    return (
      <SetupShell
        currentStep={4}
        totalSteps={5}
        ctaLabel="Continue"
        onCta={advance}
        onBack={back}
        hideCta
      >
        <StepDeposit
          asset={state.asset}
          preset={state.preset}
          estimatedApy={reviewApy}
          poolCount={poolCount}
          balance={balanceForAsset}
          isFunding={actions.isPending}
          onFund={handleFund}
        />
      </SetupShell>
    );
  }

  // step 5
  return (
    <SetupShell currentStep={5} totalSteps={5} ctaLabel="Done" onCta={() => {}} hideCta>
      <StepDone />
    </SetupShell>
  );
}
