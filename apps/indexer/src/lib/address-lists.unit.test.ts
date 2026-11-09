import { getAddress } from "viem";
import { describe, expect, it } from "vitest";

import { DaoIdEnum } from "@/lib/enums";

import {
  BurningAddresses,
  CEXAddresses,
  CONTRACT_ADDRESSES,
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
    expect(duplicateAddresses(CEXAddresses)).toEqual([]);
    expect(duplicateAddresses(DEXAddresses)).toEqual([]);
    expect(duplicateAddresses(LendingAddresses)).toEqual([]);
  });

  it("labels the Nansen-confirmed GTC exchange wallets", () => {
    const gtc = CEXAddresses[DaoIdEnum.GTC];
    const byAddress = new Map(
      Object.entries(gtc).map(([label, address]) => [
        getAddress(address),
        label,
      ]),
    );

    expect(byAddress.get("0x74be0CF1c9972C00ed4EF290e0E5BCFd18873f13")).toBe(
      "Bithumb",
    );
    expect(byAddress.get("0x14D7Cee42D4643f0C767A1D504d9cA24C890f86c")).toBe(
      "Upbit",
    );
    expect(
      byAddress.has(getAddress("0x42c7df3f6bfe02eb61c0c2bd2d73c69eec6023cd")),
    ).toBe(false);
    expect(
      byAddress.has(getAddress("0x4da8853217d0d5b59e8fcde36d1bebb0a1932a14")),
    ).toBe(false);
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

  it("does not count a COMP lending market as treasury as well", () => {
    const treasury = new Set(
      Object.values(TreasuryAddresses[DaoIdEnum.COMP]).map((address) =>
        getAddress(address),
      ),
    );
    for (const address of Object.values(LendingAddresses[DaoIdEnum.COMP])) {
      expect(treasury.has(getAddress(address))).toBe(false);
    }
  });

  it("uses the indexed token as the burn TokenContract for AAVE and ARB", () => {
    expect(getAddress(BurningAddresses[DaoIdEnum.AAVE].TokenContract)).toBe(
      getAddress(CONTRACT_ADDRESSES[DaoIdEnum.AAVE].aave.address),
    );
    expect(getAddress(BurningAddresses[DaoIdEnum.ARB].TokenContract)).toBe(
      getAddress(CONTRACT_ADDRESSES[DaoIdEnum.ARB].token.address),
    );
  });

  it("uses the timelock returned by the Fluid governor", () => {
    expect(getAddress(TreasuryAddresses[DaoIdEnum.FLUID].InstaTimelock!)).toBe(
      "0x2386DC45AdDed673317eF068992F19421B481F4c",
    );
  });
});
