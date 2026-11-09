import { sql } from "drizzle-orm";

import {
  Drizzle,
  daoMetricsDayBucket,
  feedEvent,
  proposalsOnchain,
  transfer,
  votesOnchain,
} from "@/database";

export interface HealthRepository {
  pingDatabase(): Promise<void>;
  getLastEventTimestamp(): Promise<number | null>;
  getSyncTimestamp(): Promise<number | null>;
}

export class HealthRepositoryImpl implements HealthRepository {
  constructor(private readonly db: Drizzle) {}

  async pingDatabase(): Promise<void> {
    await this.db.execute(sql`select 1`);
  }

  async getLastEventTimestamp(): Promise<number | null> {
    const rows = await Promise.all([
      this.db
        .select({ ts: sql<string | null>`max(${feedEvent.timestamp})` })
        .from(feedEvent),
      this.db
        .select({ ts: sql<string | null>`max(${votesOnchain.timestamp})` })
        .from(votesOnchain),
      this.db
        .select({ ts: sql<string | null>`max(${proposalsOnchain.timestamp})` })
        .from(proposalsOnchain),
      this.db
        .select({
          ts: sql<string | null>`max(${proposalsOnchain.queuedTimestamp})`,
        })
        .from(proposalsOnchain),
      this.db
        .select({
          ts: sql<string | null>`max(${proposalsOnchain.executedTimestamp})`,
        })
        .from(proposalsOnchain),
      this.db
        .select({
          ts: sql<string | null>`max(${daoMetricsDayBucket.lastUpdate})`,
        })
        .from(daoMetricsDayBucket),
      this.db
        .select({ ts: sql<string | null>`max(${transfer.timestamp})` })
        .from(transfer),
    ]);

    const values = rows
      .map((row) => row[0]?.ts)
      .filter((ts): ts is string => ts != null)
      .map(Number)
      .filter((value) => Number.isFinite(value));
    return values.length === 0 ? null : Math.max(...values);
  }

  /**
   * Ponder's sync cursor, when this database role can read it. A missing
   * schema or permission is "unknown", not a stall.
   */
  async getSyncTimestamp(): Promise<number | null> {
    try {
      const result = await this.db.execute(
        sql`select max(timestamp) as timestamp from ponder_sync.blocks`,
      );
      const rows = Array.isArray(result)
        ? result
        : (result as { rows?: { timestamp?: unknown }[] }).rows;
      const raw = rows?.[0]?.timestamp;
      if (raw == null || raw === "") return null;
      const value = Number(raw);
      return Number.isFinite(value) ? value : null;
    } catch {
      return null;
    }
  }
}
