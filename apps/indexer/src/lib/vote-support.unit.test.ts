import { describe, expect, it } from "vitest";

import {
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

function uint128(value: bigint): string {
  return value.toString(16).padStart(32, "0");
}
