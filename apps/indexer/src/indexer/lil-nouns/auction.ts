import { ponder } from "ponder:registry";
import { tokenPrice } from "ponder:schema";

export function LilNounsAuctionIndexer() {
  // The primary key is the settlement's block timestamp, not the UTC day.
  // A second settlement in the same block replaces that row instead of
  // throwing, which would stall the indexer.
  ponder.on(`LilNounsAuction:AuctionSettled`, async ({ event, context }) => {
    await context.db
      .insert(tokenPrice)
      .values({
        price: event.args.amount,
        timestamp: event.block.timestamp,
      })
      .onConflictDoUpdate({
        price: event.args.amount,
      });
  });
}
