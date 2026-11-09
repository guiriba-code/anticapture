/** Chart level for a daily token metric. Prefer the UTC close. */
export function tokenMetricLevel(item: {
  high: string | number;
  close?: string | number | null;
}): string {
  return String(item.close ?? item.high);
}
