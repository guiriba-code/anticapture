import type { Address } from "viem";

/**
 * Bravo and Alpha proposal ids are small integers. Governor Charlie is an
 * OpenZeppelin governor, so its ids are `hashProposal` values. Those hashes
 * do not collide with Bravo ids, so a 64-bit cutoff selects the contract
 * for `quorum` / `state` without a stored governor column.
 */
export const GITCOIN_CHARLIE_PROPOSAL_ID_MIN = 1n << 64n;

export function gitcoinGovernorForProposal(
  proposalId: string | null,
): "bravo" | "charlie" {
  if (proposalId == null || proposalId === "") return "bravo";

  let id: bigint;
  try {
    id = BigInt(proposalId);
  } catch {
    return "bravo";
  }

  return id >= GITCOIN_CHARLIE_PROPOSAL_ID_MIN ? "charlie" : "bravo";
}

export function gitcoinQuorumAddress(
  proposalId: string | null,
  bravo: Address,
  charlie: Address,
): Address {
  return gitcoinGovernorForProposal(proposalId) === "charlie" ? charlie : bravo;
}
