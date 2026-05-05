import {
  type SetupState,
  STORAGE_KEY,
  loadSetupState,
  saveSetupState,
  clearSetupState,
} from "./setup-state";

describe("setup-state", () => {
  beforeEach(() => sessionStorage.clear());

  it("returns defaults when nothing is stored", () => {
    expect(loadSetupState()).toEqual<SetupState>({
      step: 1,
      asset: "USDC",
      mode: "AUTO",
      preset: "Balanced",
      customMarkets: [],
    });
  });

  it("round-trips a saved state", () => {
    const next: SetupState = {
      step: 3,
      asset: "XLM",
      mode: "CUSTOM",
      preset: "Aggressive",
      customMarkets: ["blend", "soroswap"],
    };
    saveSetupState(next);
    expect(loadSetupState()).toEqual(next);
  });

  it("clears the stored state", () => {
    saveSetupState({ ...loadSetupState(), step: 2 });
    clearSetupState();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("falls back to defaults when JSON is malformed", () => {
    sessionStorage.setItem(STORAGE_KEY, "not-json");
    expect(loadSetupState().step).toBe(1);
  });
});
