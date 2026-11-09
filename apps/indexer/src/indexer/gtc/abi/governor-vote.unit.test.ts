import { describe, expect, it } from "vitest";

import { GovernorAbi } from "./governor";

describe("GTC governor ABI", () => {
  it("declares the GovernorAlpha VoteCast(address,uint256,bool,uint256) event", () => {
    const events = GovernorAbi.filter((item) => item.type === "event");
    const alpha = events.find(
      (item) =>
        item.name === "VoteCast" &&
        item.inputs.some((input) => input.type === "bool"),
    );

    expect(alpha?.inputs.map((input) => input.type)).toEqual([
      "address",
      "uint256",
      "bool",
      "uint256",
    ]);
    expect(alpha?.inputs[0]).toMatchObject({ name: "voter", indexed: false });
  });
});
