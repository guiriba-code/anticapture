import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { DaoIdEnum } from "@/lib/enums";

import { CONTRACT_ADDRESSES } from "./constants";

const CHARLIE = "0xef41CbD211076E8b1901e214Bf751d404cf06638";

describe("GTC Governor Charlie", () => {
  it("records the live governor and its deployment block", () => {
    expect(CONTRACT_ADDRESSES[DaoIdEnum.GTC].governorCharlie).toEqual({
      address: CHARLIE,
      startBlock: 25776742,
    });
  });

  it("is a separate Ponder contract so the Bravo address set is unchanged", () => {
    const config = readFileSync(
      path.join(process.cwd(), "config/gitcoin.config.ts"),
      "utf8",
    );

    expect(config).toContain("GTCGovernorCharlie");
    expect(config).toContain("governorCharlie.address");
    expect(config).toContain("governorCharlie.startBlock");
  });
});
