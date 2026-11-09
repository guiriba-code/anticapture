import { hexToBytes, type Hex } from "viem";

/**
 * OpenZeppelin fractional ballots use support 255 and pack the split in `params`.
 * A normal Bravo ballot is 0 (against), 1 (for) or 2 (abstain).
 */
export const FRACTIONAL_VOTE_SUPPORT = 255;

export type VoteWeights = {
  againstVotes: bigint;
  forVotes: bigint;
  abstainVotes: bigint;
};

/**
 * Bravo `VoteCast.support` is a uint8. It must stay a number: a boolean
 * coercion maps abstain (2) onto for (1).
 */
export function bravoSupport(support: number | bigint): number {
  return Number(support);
}

/** GovernorAlpha `VoteCast.support` is a bool: true is for, false is against. */
export function alphaSupport(support: boolean): 0 | 1 {
  return support ? 1 : 0;
}

/**
 * Splits a ballot into the three proposal counters.
 * Fractional params are `abi.encodePacked(uint128 against, uint128 for, uint128 abstain)`.
 * A malformed payload contributes nothing instead of throwing, so one bad log
 * cannot stall the indexer.
 */
export function voteWeightByChoice(input: {
  support: number;
  weight: bigint;
  params?: Hex;
}): VoteWeights {
  if (input.support === FRACTIONAL_VOTE_SUPPORT) {
    return decodeFractionalVotes(input.params);
  }

  return {
    againstVotes: input.support === 0 ? input.weight : 0n,
    forVotes: input.support === 1 ? input.weight : 0n,
    abstainVotes: input.support === 2 ? input.weight : 0n,
  };
}

export function decodeFractionalVotes(params: Hex | undefined): VoteWeights {
  const empty: VoteWeights = {
    againstVotes: 0n,
    forVotes: 0n,
    abstainVotes: 0n,
  };
  if (!params || params === "0x") return empty;

  const bytes = hexToBytes(params);
  if (bytes.length !== 48) return empty;

  return {
    againstVotes: readUint128(bytes, 0),
    forVotes: readUint128(bytes, 16),
    abstainVotes: readUint128(bytes, 32),
  };
}

export type StoredVoteKey = {
  votingPower: bigint;
  txHash: string;
  logIndex: number;
};

/**
 * A second ballot from the same voter on the same proposal must add weight.
 * Governor Charlie's fractional mode emits one event per partial vote, and
 * `votes_onchain` has one row per (voter, proposal). Replaying the same log
 * is ignored so a reorg backfill cannot double-count.
 */
export function accumulateCastVote(
  existing: StoredVoteKey | null,
  incoming: { votingPower: bigint; txHash: string; logIndex: number },
):
  | { action: "ignore"; votingPower: bigint }
  | { action: "insert" | "add"; votingPower: bigint } {
  if (
    existing &&
    existing.txHash === incoming.txHash &&
    existing.logIndex === incoming.logIndex
  ) {
    return { action: "ignore", votingPower: existing.votingPower };
  }

  if (!existing) {
    return { action: "insert", votingPower: incoming.votingPower };
  }

  return {
    action: "add",
    votingPower: existing.votingPower + incoming.votingPower,
  };
}

export function addProposalWeights(
  current: VoteWeights,
  weights: VoteWeights,
): VoteWeights {
  return {
    againstVotes: current.againstVotes + weights.againstVotes,
    forVotes: current.forVotes + weights.forVotes,
    abstainVotes: current.abstainVotes + weights.abstainVotes,
  };
}

function readUint128(bytes: Uint8Array, offset: number): bigint {
  let value = 0n;
  for (let i = 0; i < 16; i++) {
    value = (value << 8n) + BigInt(bytes[offset + i] ?? 0);
  }
  return value;
}
