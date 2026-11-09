type MetricLevel = string | number | bigint;

/** Chart level for a daily token metric. Prefer the UTC close. */
export const tokenMetricLevel = (item: {
  high: MetricLevel;
  close?: MetricLevel | null;
}): string => String(item.close ?? item.high);
