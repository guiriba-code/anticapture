import { getAddress, zeroAddress, type Address } from "viem";

const DEAD = getAddress("0x000000000000000000000000000000000000dEaD");

/**
 * An ERC-721 burn lowers totalSupply(). Mints are Transfer from 0x0 and are
 * already counted by NounCreated, so a mint must not be applied again here.
 */
export function isNftBurnTransfer(from: Address, to: Address): boolean {
  const fromAddress = getAddress(from);
  const toAddress = getAddress(to);
  if (fromAddress === zeroAddress) return false;
  return toAddress === zeroAddress || toAddress === DEAD;
}
