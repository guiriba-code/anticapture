import { describe, expect, it } from "vitest";

import {
  accumulateCastVote,
  addProposalWeights,
  alphaSupport,
  bravoSupport,
  decodeFractionalVotes,
  voteWeightByChoice,
} from "./vote-support";

describe("bravoSupport", () => {
  it("keeps abstain (2) distinct from for (1)", () => {
    // `support ? 1 : 0` maps 2 to 1. The helper must not.
    expect(bravoSupport(2)).toBe(2);
    expect(bravoSupport(0)).toBe(0);
    expect(bravoSupport(1)).toBe(1);
  });
});

describe("alphaSupport", () => {
  it("maps the GovernorAlpha bool onto for and against", () => {
    expect(alphaSupport(true)).toBe(1);
    expect(alphaSupport(false)).toBe(0);
  });
});

describe("voteWeightByChoice", () => {
  it("assigns the whole weight to abstain when support is 2", () => {
    expect(
      voteWeightByChoice({ support: bravoSupport(2), weight: 1000n }),
    ).toEqual({
      againstVotes: 0n,
      forVotes: 0n,
      abstainVotes: 1000n,
    });
  });

  it("decodes a fractional ballot packed as three uint128s", () => {
    const against = 1n;
    const forVotes = 2n;
    const abstain = 3n;
    const params =
      `0x${uint128(against)}${uint128(forVotes)}${uint128(abstain)}` as const;

    expect(voteWeightByChoice({ support: 255, weight: 6n, params })).toEqual({
      againstVotes: against,
      forVotes,
      abstainVotes: abstain,
    });
    expect(decodeFractionalVotes("0x1234")).toEqual({
      againstVotes: 0n,
      forVotes: 0n,
      abstainVotes: 0n,
    });
  });
});

describe("accumulateCastVote", () => {
  it("adds a second partial vote from the same voter without a new ballot count", () => {
    const firstParams = packed(40n, 60n, 0n);
    const secondParams = packed(10n, 20n, 20n);
    const firstWeights = voteWeightByChoice({
      support: 255,
      weight: 100n,
      params: firstParams,
    });
    const secondWeights = voteWeightByChoice({
      support: 255,
      weight: 50n,
      params: secondParams,
    });

    const first = accumulateCastVote(null, {
      votingPower: 100n,
      txHash: "0xaaa",
      logIndex: 1,
    });
    expect(first.action).toBe("insert");

    const second = accumulateCastVote(
      { votingPower: first.votingPower, txHash: "0xaaa", logIndex: 1 },
      { votingPower: 50n, txHash: "0xbbb", logIndex: 2 },
    );
    expect(second).toEqual({ action: "add", votingPower: 150n });

    const replay = accumulateCastVote(
      { votingPower: second.votingPower, txHash: "0xbbb", logIndex: 2 },
      { votingPower: 50n, txHash: "0xbbb", logIndex: 2 },
    );
    expect(replay.action).toBe("ignore");

    const proposal = addProposalWeights(
      { againstVotes: 0n, forVotes: 0n, abstainVotes: 0n },
      firstWeights,
    );
    expect(addProposalWeights(proposal, secondWeights)).toEqual({
      againstVotes: 50n,
      forVotes: 80n,
      abstainVotes: 20n,
    });
  });
});

function packed(against: bigint, forVotes: bigint, abstain: bigint) {
  return `0x${uint128(against)}${uint128(forVotes)}${uint128(abstain)}` as const;
}

function uint128(value: bigint): string {
  return value.toString(16).padStart(32, "0");
}
