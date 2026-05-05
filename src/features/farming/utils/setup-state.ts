import type { RiskPreset } from "@/features/account/types";

/** UI-level asset identifier for the farming setup wizard. */
export type Asset = "USDC" | "XLM";

/** Wizard mode: automatic allocation or manual market selection. */
export type Mode = "AUTO" | "CUSTOM";

export const STORAGE_KEY = "tasmil.setup.state";

export interface SetupState {
  step: 1 | 2 | 3 | 4;
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

export function loadSetupState(): SetupState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_STATE };
  try {
    const parsed = JSON.parse(raw) as Partial<SetupState>;
    return { ...DEFAULT_STATE, ...parsed };
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
