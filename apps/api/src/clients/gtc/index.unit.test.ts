import { describe, expect, it } from "vitest";
import type {
  Abi,
  Address,
  ContractFunctionArgs,
  ContractFunctionName,
} from "viem";
import type {
  ReadContractParameters,
  ReadContractReturnType,
} from "viem/actions";

import { GTCClient } from "./index";

const BRAVO = "0x9D4C63565D5618310271bF3F3c01b2954C1D1639" as Address;
const CHARLIE = "0xef41CbD211076E8b1901e214Bf751d404cf06638" as Address;

const CHARLIE_PARAMETERS = {
  votingDelay: 14400n,
  votingPeriod: 40320n,
  proposalThreshold: 150_000n * 10n ** 18n,
} as const;

class RecordingGtc extends GTCClient {
  readonly calls: { functionName: string; address: Address }[] = [];

  constructor() {
    super({} as never, BRAVO, CHARLIE);
  }

  protected override async readContract<
    const TAbi extends Abi,
    TFunctionName extends ContractFunctionName<TAbi, "pure" | "view">,
    TArgs extends ContractFunctionArgs<TAbi, "pure" | "view", TFunctionName>,
  >(
    params: ReadContractParameters<TAbi, TFunctionName, TArgs>,
  ): Promise<ReadContractReturnType<TAbi, TFunctionName, TArgs>> {
    const functionName = String(params.functionName);
    if (!(functionName in CHARLIE_PARAMETERS) || params.address === undefined) {
      throw new Error(`unexpected ${functionName}`);
    }
    this.calls.push({ functionName, address: params.address });
    return CHARLIE_PARAMETERS[
      functionName as keyof typeof CHARLIE_PARAMETERS
    ] as ReadContractReturnType<TAbi, TFunctionName, TArgs>;
  }
}

describe("GTC governance parameters", () => {
  it("reads votingDelay, votingPeriod and proposalThreshold from Charlie", async () => {
    const client = new RecordingGtc();

    expect(await client.getVotingDelay()).toBe(14400n);
    expect(await client.getVotingPeriod()).toBe(40320n);
    expect(await client.getProposalThreshold()).toBe(150_000n * 10n ** 18n);
    expect(client.calls.map((call) => call.address)).toEqual([
      CHARLIE,
      CHARLIE,
      CHARLIE,
    ]);

    expect(await client.getVotingDelay()).toBe(14400n);
    expect(client.calls).toHaveLength(3);
  });
});
