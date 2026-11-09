import { describe, expect, it } from "vitest";

import {
  ACTIVITY_STALL_SECONDS,
  SYNC_STALL_SECONDS,
  assessIndexerFreshness,
} from "./freshness";

const NOW = 1_700_000_000;

describe("assessIndexerFreshness", () => {
  it("stays fresh when the chain is quiet but the sync cursor is current", () => {
    const report = assessIndexerFreshness({
      nowSeconds: NOW,
      lastActivityTimestamp: NOW - 6 * 60 * 60,
      syncTimestamp: NOW - 30,
    });

    expect(report.fresh).toBe(true);
    expect(report.lagSeconds).toBe(30);
  });

  it("does not call a DAO degraded after five quiet minutes", () => {
    const report = assessIndexerFreshness({
      nowSeconds: NOW,
      lastActivityTimestamp: NOW - 301,
      syncTimestamp: null,
    });

    expect(report.fresh).toBe(true);
    expect(report.lastEventTimestamp).toBe(NOW - 301);
  });

  it("reports a stall when activity is older than a day and no sync cursor exists", () => {
    const report = assessIndexerFreshness({
      nowSeconds: NOW,
      lastActivityTimestamp: NOW - ACTIVITY_STALL_SECONDS - 1,
      syncTimestamp: null,
    });

    expect(report.fresh).toBe(false);
  });

  it("reports a stall when the sync cursor itself is stale", () => {
    const report = assessIndexerFreshness({
      nowSeconds: NOW,
      lastActivityTimestamp: NOW,
      syncTimestamp: NOW - SYNC_STALL_SECONDS - 1,
    });

    expect(report.fresh).toBe(false);
    expect(report.lagSeconds).toBe(SYNC_STALL_SECONDS + 1);
  });
});
