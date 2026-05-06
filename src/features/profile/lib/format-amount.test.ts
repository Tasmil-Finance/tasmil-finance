import { formatAmount, scaleByDecimals, signedAmount } from "./format-amount";

const MINUS = "−";

describe("formatAmount", () => {
  describe("sub-1 values (regression: no scientific notation)", () => {
    it("formats 1e-7 as plain decimal", () => {
      expect(formatAmount("0.0000001")).toBe("0.0000001");
    });

    it("formats 9e-7 as plain decimal", () => {
      expect(formatAmount("0.0000009")).toBe("0.0000009");
    });

    it("formats 1e-6 as plain decimal and trims trailing zeros", () => {
      expect(formatAmount("0.000001")).toBe("0.000001");
    });

    it("formats 0.5 as plain decimal", () => {
      expect(formatAmount("0.5")).toBe("0.5");
    });

    it("preserves minus sign for negative tiny values", () => {
      expect(formatAmount("-0.0000001")).toBe(`${MINUS}0.0000001`);
    });
  });

  describe("zero", () => {
    it("returns '0'", () => {
      expect(formatAmount("0")).toBe("0");
    });
  });

  describe(">=1 values (unchanged behavior)", () => {
    it("formats 1.2345 trimming trailing zeros", () => {
      expect(formatAmount("1.2345")).toBe("1.2345");
    });

    it("formats negatives with the MINUS char", () => {
      expect(formatAmount("-1.5")).toBe(`${MINUS}1.5`);
    });
  });

  describe("thousands / millions (unchanged behavior)", () => {
    it("formats 1500 as 1.50K", () => {
      expect(formatAmount("1500")).toBe("1.50K");
    });

    it("formats 1500000 as 1.50M", () => {
      expect(formatAmount("1500000")).toBe("1.50M");
    });
  });

  describe("invalid input", () => {
    it("returns the original string for non-numeric input", () => {
      expect(formatAmount("not-a-number")).toBe("not-a-number");
    });
  });
});

describe("signedAmount", () => {
  it("prepends + for credit", () => {
    expect(signedAmount("1.5", true)).toBe("+1.5");
  });

  it("prepends MINUS for debit", () => {
    expect(signedAmount("1.5", false)).toBe(`${MINUS}1.5`);
  });
});

describe("scaleByDecimals", () => {
  it("shifts a stroop string to XLM decimal", () => {
    expect(scaleByDecimals("10000000", 7)).toBe("1");
  });

  it("returns the input unchanged for NaN", () => {
    expect(scaleByDecimals("not-a-number", 7)).toBe("not-a-number");
  });
});
