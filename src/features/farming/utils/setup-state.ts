import type { RiskPreset } from "@/features/account/types";

export type Asset = "USDC" | "XLM";
export type Mode = "AUTO" | "CUSTOM";

export const STORAGE_KEY = "tasmil.setup.state";

export type SetupStep = 1 | 2 | 3 | 4 | 5;

export interface SetupState {
  step: SetupStep;
  asset: Asset;
  mode: Mode;
  preset: RiskPreset;
  customMarkets: string[];
}

const DEFAULT_STATE: SetupState = {
  step: 1,
  asset: "USDC",
  mode: "AUTO",
  preset: "Balanced",
  customMarkets: [],
};

function normalizeStep(value: unknown): SetupStep {
  if (value === 1 || value === 2 || value === 3 || value === 4 || value === 5) {
    return value;
  }
  return 1;
}

export function loadSetupState(): SetupState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_STATE };
  try {
    const parsed = JSON.parse(raw) as Partial<SetupState>;
    return { ...DEFAULT_STATE, ...parsed, step: normalizeStep(parsed.step) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveSetupState(state: SetupState): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearSetupState(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}
