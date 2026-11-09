import { describe, expect, it } from "vitest";

import {
  gitcoinGovernorForProposal,
  gitcoinQuorumAddress,
} from "./proposal-governor";

const BRAVO = "0x9D4C63565D5618310271bF3F3c01b2954C1D1639";
const CHARLIE = "0xef41CbD211076E8b1901e214Bf751d404cf06638";

describe("gitcoinGovernorForProposal", () => {
  it("keeps Bravo and Alpha ids on the Bravo governor", () => {
    expect(gitcoinGovernorForProposal("66")).toBe("bravo");
    expect(gitcoinGovernorForProposal(null)).toBe("bravo");
    expect(gitcoinQuorumAddress("49", BRAVO, CHARLIE)).toBe(BRAVO);
  });

  it("routes an OpenZeppelin hash id to Governor Charlie", () => {
    const hashId = (1n << 128n).toString();
    expect(gitcoinGovernorForProposal(hashId)).toBe("charlie");
    expect(gitcoinQuorumAddress(hashId, BRAVO, CHARLIE)).toBe(CHARLIE);
  });
});
