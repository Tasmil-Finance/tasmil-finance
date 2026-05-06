import { formatAmount, scaleByDecimals, signedAmount } from "./format-amount";

const MINUS = "−";

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

  it("returns the input unchanged for NaN", () => {
    expect(scaleByDecimals("not-a-number", 7)).toBe("not-a-number");
  });
});

describe("formatAmount", () => {
  describe("zero", () => {
    it("returns '0'", () => {
      expect(formatAmount("0")).toBe("0");
    });
  });

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

    it("rounds sub-1 amounts at the 7th decimal", () => {
      expect(formatAmount("0.00012345")).toBe("0.0001235");
    });

    it("preserves minus sign for negative tiny values", () => {
      expect(formatAmount("-0.0000001")).toBe(`${MINUS}0.0000001`);
    });

    it("prefixes minus for negative sub-1", () => {
      expect(formatAmount("-0.00012345")).toBe(`${MINUS}0.0001235`);
    });
  });

  describe(">=1 values", () => {
    it("formats 1.2345 trimming trailing zeros", () => {
      expect(formatAmount("1.2345")).toBe("1.2345");
    });

    it("rounds to 4 fractional digits below 1000", () => {
      expect(formatAmount("12.345678")).toBe("12.3457");
    });

    it("strips trailing zeros", () => {
      expect(formatAmount("100.0000000")).toBe("100");
    });

    it("formats negatives with the MINUS char", () => {
      expect(formatAmount("-1.5")).toBe(`${MINUS}1.5`);
    });

    it("prefixes minus for negative integers >= 1", () => {
      expect(formatAmount("-12.5")).toBe(`${MINUS}12.5`);
    });
  });

  describe("thousands / millions", () => {
    it("formats 1500 as 1.50K", () => {
      expect(formatAmount("1500")).toBe("1.50K");
    });

    it("uses K suffix for non-round thousands", () => {
      expect(formatAmount("1234.56")).toBe("1.23K");
    });

    it("formats 1500000 as 1.50M", () => {
      expect(formatAmount("1500000")).toBe("1.50M");
    });

    it("uses M suffix for non-round millions", () => {
      expect(formatAmount("1234567.89")).toBe("1.23M");
    });

    it("prefixes minus for negative thousands", () => {
      expect(formatAmount("-1234.56")).toBe(`${MINUS}1.23K`);
    });

    it("prefixes minus for negative millions", () => {
      expect(formatAmount("-1234567.89")).toBe(`${MINUS}1.23M`);
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

  it("prefixes plus for credit integer values", () => {
    expect(signedAmount("123", true)).toBe("+123");
  });

  it("prefixes minus for debit integer values", () => {
    expect(signedAmount("123", false)).toBe(`${MINUS}123`);
  });
});
