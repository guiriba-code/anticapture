import { getAddress } from "viem";
import { describe, expect, it } from "vitest";

import { DaoIdEnum } from "@/lib/enums";

import {
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  TreasuryAddresses,
} from "./constants";

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

  it("keeps bridges, investors and other DAOs out of the GTC treasury", () => {
    const treasury = Object.values(TreasuryAddresses[DaoIdEnum.GTC]).map(
      (address) => getAddress(address),
    );
    const thirdParties = [
      "0xe527BbDE3654E9ba824f9B72DFF495eEe60fD366",
      "0xa3A7B6F88361F48403514059F1F16C8E78d60EeC",
      "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1",
      "0x8dA8f82d2BbDd896822de723F55D6EdF416130ba",
      "0x7aD3d9819B06E800F8A65f3440D599A23D6A0BDf",
    ].map((address) => getAddress(address));

    for (const address of thirdParties) {
      expect(treasury).not.toContain(address);
    }
  });
});
