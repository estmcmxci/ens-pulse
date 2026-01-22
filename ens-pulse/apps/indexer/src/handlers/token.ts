import { ponder } from "ponder:registry";
import * as schema from "ponder:schema";

const zeroAddress = "0x0000000000000000000000000000000000000000";

// Handle DelegateChanged events
ponder.on("ENSToken:DelegateChanged", async ({ event, context }) => {
  const { db } = context;

  // Upsert delegation record
  await db
    .insert(schema.delegation)
    .values({
      id: event.args.delegator,
      delegator: event.args.delegator,
      delegate: event.args.toDelegate,
      timestamp: event.block.timestamp,
      blockNumber: event.block.number,
    })
    .onConflictDoUpdate({
      delegate: event.args.toDelegate,
      timestamp: event.block.timestamp,
      blockNumber: event.block.number,
    });

  // Update delegate records
  if (event.args.toDelegate !== zeroAddress) {
    const existing = await db.find(schema.delegate, { id: event.args.toDelegate });

    if (existing) {
      await db
        .update(schema.delegate, { id: event.args.toDelegate })
        .set({
          delegatorsCount: existing.delegatorsCount + 1,
          lastActiveBlock: event.block.number,
        });
    } else {
      await db.insert(schema.delegate).values({
        id: event.args.toDelegate,
        address: event.args.toDelegate,
        votingPower: 0n,
        delegatorsCount: 1,
        votesCount: 0,
        proposalsCreated: 0,
        lastActiveBlock: event.block.number,
      });
    }
  }
});

// Handle DelegateVotesChanged events
ponder.on("ENSToken:DelegateVotesChanged", async ({ event, context }) => {
  const { db } = context;

  await db
    .insert(schema.delegate)
    .values({
      id: event.args.delegate,
      address: event.args.delegate,
      votingPower: event.args.newBalance,
      delegatorsCount: 0,
      votesCount: 0,
      proposalsCreated: 0,
      lastActiveBlock: event.block.number,
    })
    .onConflictDoUpdate({
      votingPower: event.args.newBalance,
      lastActiveBlock: event.block.number,
    });
});

// Transfer event handler removed for MVP performance
// Token balances can be added back later if needed
