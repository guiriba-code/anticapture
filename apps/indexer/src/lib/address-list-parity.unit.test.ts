import { readFileSync } from "node:fs";
import path from "node:path";

import { getAddress } from "viem";
import { describe, expect, it } from "vitest";

function sectionAddresses(source: string, exportName: string): Set<string> {
  const start = source.indexOf(`export const ${exportName}`);
  const next = source.indexOf("\nexport ", start + exportName.length);
  const body = source.slice(start, next === -1 ? undefined : next);
  return new Set(
    [...body.matchAll(/0x[a-fA-F0-9]{40}/g)].map((match) =>
      getAddress(match[0]),
    ),
  );
}

describe("treasury list parity", () => {
  it("keeps the API copy equal to the indexer copy", () => {
    const indexer = readFileSync(
      path.join(process.cwd(), "src/lib/constants.ts"),
      "utf8",
    );
    const api = readFileSync(
      path.join(process.cwd(), "../api/src/lib/constants.ts"),
      "utf8",
    );

    expect([...sectionAddresses(api, "TreasuryAddresses")].sort()).toEqual(
      [...sectionAddresses(indexer, "TreasuryAddresses")].sort(),
    );

    const apiLocked = sectionAddresses(api, "NonCirculatingAddresses");
    const indexerLocked = sectionAddresses(indexer, "NonCirculatingAddresses");
    // The API also hides the TORN governor from holder listings. The indexer
    // keeps that balance in its own TORN supply rule (N19), so the copies
    // are not collapsed into one module here.
    const tornGovernor = getAddress(
      "0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce",
    );
    apiLocked.delete(tornGovernor);
    expect([...apiLocked].sort()).toEqual([...indexerLocked].sort());
  });
});
