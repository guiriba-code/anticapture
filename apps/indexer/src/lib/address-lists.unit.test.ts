import { getAddress } from "viem";
import { describe, expect, it } from "vitest";

import { DaoIdEnum } from "@/lib/enums";

import { CEXAddresses, DEXAddresses, LendingAddresses } from "./constants";

function duplicateAddresses(
  lists: Record<string, Record<string, string>>,
): string[] {
  const found: string[] = [];
  for (const [dao, labels] of Object.entries(lists)) {
    const seen = new Map<string, string>();
    for (const [label, address] of Object.entries(labels)) {
      const normalized = getAddress(address);
      const previous = seen.get(normalized);
      if (previous) {
        found.push(`${dao} ${normalized} (${previous}, ${label})`);
      } else {
        seen.set(normalized, label);
      }
    }
  }
  return found;
}

describe("address lists", () => {
  it("keeps each CEX, DEX and lending address once per DAO", () => {
    // GTC CEX labels are on hold until a verified holder CSV arrives.
    const { [DaoIdEnum.GTC]: _gtcCex, ...cexWithoutGtc } = CEXAddresses;
    expect(duplicateAddresses(cexWithoutGtc)).toEqual([]);
    expect(duplicateAddresses(DEXAddresses)).toEqual([]);
    expect(duplicateAddresses(LendingAddresses)).toEqual([]);
  });
});
