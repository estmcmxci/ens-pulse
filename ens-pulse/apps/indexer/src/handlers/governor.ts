import { ponder } from "ponder:registry";
import * as schema from "ponder:schema";

// Handle ProposalCreated events
ponder.on("ENSGovernor:ProposalCreated", async ({ event, context }) => {
  const { db } = context;
  const proposalIdStr = event.args.proposalId.toString();

  await db.insert(schema.proposal).values({
    id: proposalIdStr,
    proposalId: event.args.proposalId,
    proposer: event.args.proposer,
    targets: JSON.stringify(event.args.targets),
    values: JSON.stringify(event.args.values.map((v) => v.toString())),
    signatures: JSON.stringify(event.args.signatures),
    calldatas: JSON.stringify(event.args.calldatas),
    startBlock: event.args.startBlock,
    endBlock: event.args.endBlock,
    description: event.args.description,
    status: "pending",
    forVotes: 0n,
    againstVotes: 0n,
    abstainVotes: 0n,
    createdAt: event.block.timestamp,
  });

  // Create context snapshot for the proposal
  await db.insert(schema.proposalContext).values({
    id: proposalIdStr,
    proposalId: event.args.proposalId,
    createdBlock: event.block.number,
    createdTimestamp: event.block.timestamp,
    createdEthPrice: 0n,
    createdEnsPrice: 0n,
    createdGasPrice: 0n,
    createdTreasuryUsd: 0n,
  });
});

// Handle VoteCast events
ponder.on("ENSGovernor:VoteCast", async ({ event, context }) => {
  const { db } = context;
  const voteId = `${event.args.proposalId}-${event.args.voter}`;
  const proposalIdStr = event.args.proposalId.toString();

  // Create vote record
  await db.insert(schema.vote).values({
    id: voteId,
    proposalId: event.args.proposalId,
    voter: event.args.voter,
    support: event.args.support,
    weight: event.args.weight,
    reason: event.args.reason || null,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
  });

  // Update proposal vote counts based on support type
  const existingProposal = await db.find(schema.proposal, { id: proposalIdStr });
  if (existingProposal) {
    if (event.args.support === 0) {
      await db
        .update(schema.proposal, { id: proposalIdStr })
        .set({
          againstVotes: existingProposal.againstVotes + event.args.weight,
        });
    } else if (event.args.support === 1) {
      await db
        .update(schema.proposal, { id: proposalIdStr })
        .set({
          forVotes: existingProposal.forVotes + event.args.weight,
        });
    } else if (event.args.support === 2) {
      await db
        .update(schema.proposal, { id: proposalIdStr })
        .set({
          abstainVotes: existingProposal.abstainVotes + event.args.weight,
        });
    }
  }

  // Update delegate stats
  const existingDelegate = await db.find(schema.delegate, { id: event.args.voter });
  if (existingDelegate) {
    await db
      .update(schema.delegate, { id: event.args.voter })
      .set({
        votesCount: existingDelegate.votesCount + 1,
        lastActiveBlock: event.block.number,
      });
  } else {
    await db.insert(schema.delegate).values({
      id: event.args.voter,
      address: event.args.voter,
      votingPower: 0n,
      delegatorsCount: 0,
      votesCount: 1,
      proposalsCreated: 0,
      lastActiveBlock: event.block.number,
    });
  }
});

// Handle ProposalQueued events
ponder.on("ENSGovernor:ProposalQueued", async ({ event, context }) => {
  const { db } = context;
  await db
    .update(schema.proposal, { id: event.args.proposalId.toString() })
    .set({
      status: "queued",
      eta: event.args.eta,
    });
});

// Handle ProposalExecuted events
ponder.on("ENSGovernor:ProposalExecuted", async ({ event, context }) => {
  const { db } = context;
  await db
    .update(schema.proposal, { id: event.args.proposalId.toString() })
    .set({
      status: "executed",
      executedAt: event.block.timestamp,
    });
});

// Handle ProposalCanceled events
ponder.on("ENSGovernor:ProposalCanceled", async ({ event, context }) => {
  const { db } = context;
  await db
    .update(schema.proposal, { id: event.args.proposalId.toString() })
    .set({
      status: "canceled",
      canceledAt: event.block.timestamp,
    });
});
