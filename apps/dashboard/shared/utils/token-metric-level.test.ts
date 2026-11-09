import { tokenMetricLevel } from "@/shared/utils/token-metric-level";

describe("tokenMetricLevel", () => {
  test("prefers a bigint close over a bigint high", () => {
    expect(tokenMetricLevel({ high: 41n, close: 30n })).toBe("30");
  });

  test("falls back to high when close is null or missing", () => {
    expect(tokenMetricLevel({ high: 10n, close: null })).toBe("10");
    expect(tokenMetricLevel({ high: "8" })).toBe("8");
  });
});
