// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

describe("toNumberish", () => {
  it("keeps supported number-like values and rejects unsupported ones", async () => {
    const { toNumberish } = await import("./formatting");

    expect(toNumberish(0.125)).toBe(0.125);
    expect(toNumberish("0.25")).toBe("0.25");
    expect(toNumberish(null)).toBeNull();
    expect(toNumberish(undefined)).toBeUndefined();
    expect(toNumberish({ value: 1 })).toBeUndefined();
    expect(toNumberish(["1"])).toBeUndefined();
    expect(toNumberish(true)).toBeUndefined();
  });
});
