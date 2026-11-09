import { ponder } from "ponder:registry";

import {
  updateProposalStatus,
  proposalCreated,
  voteCast,
} from "@/eventHandlers";
import { DaoIdEnum } from "@/lib/enums";
import { ProposalStatus } from "@/lib/constants";
import {
  alphaSupport,
  bravoSupport,
  voteWeightByChoice,
} from "@/lib/vote-support";

const OZ_GOVERNORS = ["GTCGovernor", "GTCGovernorCharlie"] as const;

export function GovernorIndexer(blockTime: number) {
  const daoId = DaoIdEnum.GTC;

  for (const contract of OZ_GOVERNORS) {
    ponder.on(
      `${contract}:VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)`,
      async ({ event, context }) => {
        await voteCast(context, daoId, {
          proposalId: event.args.proposalId.toString(),
          voter: event.args.voter,
          reason: event.args.reason,
          support: bravoSupport(event.args.support),
          timestamp: event.block.timestamp,
          txHash: event.transaction.hash,
          votingPower: event.args.weight,
          logIndex: event.log.logIndex,
        });
      },
    );

    ponder.on(`${contract}:VoteCastWithParams`, async ({ event, context }) => {
      const support = bravoSupport(event.args.support);
      await voteCast(context, daoId, {
        proposalId: event.args.proposalId.toString(),
        voter: event.args.voter,
        reason: event.args.reason,
        support,
        timestamp: event.block.timestamp,
        txHash: event.transaction.hash,
        votingPower: event.args.weight,
        logIndex: event.log.logIndex,
        weights: voteWeightByChoice({
          support,
          weight: event.args.weight,
          params: event.args.params,
        }),
      });
    });

    ponder.on(`${contract}:ProposalCreated`, async ({ event, context }) => {
      await proposalCreated(context, daoId, blockTime, {
        proposalId: event.args.proposalId.toString(),
        txHash: event.transaction.hash,
        proposer: event.args.proposer,
        targets: [...event.args.targets],
        values: [...event.args.values],
        signatures: [...event.args.signatures],
        calldatas: [...event.args.calldatas],
        startBlock: event.args.startBlock.toString(),
        endBlock: event.args.endBlock.toString(),
        description: event.args.description,
        timestamp: event.block.timestamp,
        blockNumber: event.block.number,
        logIndex: event.log.logIndex,
      });
    });

    ponder.on(`${contract}:ProposalCanceled`, async ({ event, context }) => {
      await updateProposalStatus(
        context,
        event.args.proposalId.toString(),
        ProposalStatus.CANCELED,
        event.block.timestamp,
        event.transaction.hash,
      );
    });

    ponder.on(`${contract}:ProposalExecuted`, async ({ event, context }) => {
      await updateProposalStatus(
        context,
        event.args.proposalId.toString(),
        ProposalStatus.EXECUTED,
        event.block.timestamp,
        event.transaction.hash,
      );
    });

    ponder.on(`${contract}:ProposalQueued`, async ({ event, context }) => {
      await updateProposalStatus(
        context,
        event.args.proposalId.toString(),
        ProposalStatus.QUEUED,
        event.block.timestamp,
        event.transaction.hash,
      );
    });
  }

  // GovernorAlpha emits VoteCast(address,uint256,bool,uint256). voter is not indexed.
  ponder.on(
    "GTCGovernor:VoteCast(address voter, uint256 proposalId, bool support, uint256 votes)",
    async ({ event, context }) => {
      await voteCast(context, daoId, {
        proposalId: event.args.proposalId.toString(),
        voter: event.args.voter,
        reason: "",
        support: alphaSupport(event.args.support),
        timestamp: event.block.timestamp,
        txHash: event.transaction.hash,
        votingPower: event.args.votes,
        logIndex: event.log.logIndex,
      });
    },
  );
}
