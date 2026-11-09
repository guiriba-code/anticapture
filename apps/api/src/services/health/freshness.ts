/** Ponder sync cursor older than this matches the IndexerSyncStale alert. */
export const SYNC_STALL_SECONDS = 600;

/**
 * Without a sync cursor, quiet DAOs must not look stalled after five minutes.
 * A full day with no indexed activity is the fallback stall signal.
 */
export const ACTIVITY_STALL_SECONDS = 24 * 60 * 60;

export function assessIndexerFreshness(input: {
  nowSeconds: number;
  lastActivityTimestamp: number | null;
  syncTimestamp: number | null;
}): {
  lastEventTimestamp: number | null;
  lagSeconds: number | null;
  fresh: boolean;
} {
  const cursor = input.syncTimestamp ?? input.lastActivityTimestamp;
  if (cursor == null) {
    return { lastEventTimestamp: null, lagSeconds: null, fresh: false };
  }

  const lagSeconds = input.nowSeconds - cursor;
  const limit =
    input.syncTimestamp != null ? SYNC_STALL_SECONDS : ACTIVITY_STALL_SECONDS;

  return {
    lastEventTimestamp: cursor,
    lagSeconds,
    fresh: lagSeconds <= limit,
  };
}
