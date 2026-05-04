import { formatAmount, signedAmount, scaleByDecimals } from "./format-amount";

describe("scaleByDecimals", () => {
  it("scales raw 7-decimal stroops to a human string", () => {
    expect(scaleByDecimals("12345678", 7)).toBe("1.2345678");
  });

  it("scales 6-decimal tokens correctly", () => {
    expect(scaleByDecimals("1500000", 6)).toBe("1.5");
  });

  it("handles zero", () => {
    expect(scaleByDecimals("0", 7)).toBe("0");
  });

  it("preserves precision for very large amounts", () => {
    expect(scaleByDecimals("123456789012345", 7)).toBe("12345678.9012345");
  });
});

describe("formatAmount", () => {
  it("uses K suffix for thousands", () => {
    expect(formatAmount("1234.56")).toBe("1.23K");
  });

  it("uses M suffix for millions", () => {
    expect(formatAmount("1234567.89")).toBe("1.23M");
  });

  it("shows up to 4 fractional digits below 1000", () => {
    expect(formatAmount("12.345678")).toBe("12.3457");
  });

  it("uses precision 4 for sub-1 amounts", () => {
    expect(formatAmount("0.00012345")).toBe("0.0001235");
  });

  it("strips trailing zeros", () => {
    expect(formatAmount("100.0000000")).toBe("100");
  });

  it("never returns NaN", () => {
    expect(formatAmount("not-a-number")).toBe("not-a-number");
  });
});

describe("signedAmount", () => {
  it("prefixes minus for debits", () => {
    expect(signedAmount("123", false)).toBe("−123");
  });

  it("prefixes plus for credits", () => {
    expect(signedAmount("123", true)).toBe("+123");
  });
});
