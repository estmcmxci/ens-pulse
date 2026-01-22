import { index, onchainTable, primaryKey } from "ponder";

// Governance Proposals
export const proposal = onchainTable(
  "proposal",
  (t) => ({
    id: t.text().primaryKey(),
    proposalId: t.bigint().notNull(),
    proposer: t.text().notNull(),
    targets: t.text().notNull(), // JSON array
    values: t.text().notNull(), // JSON array
    signatures: t.text().notNull(), // JSON array
    calldatas: t.text().notNull(), // JSON array
    startBlock: t.bigint().notNull(),
    endBlock: t.bigint().notNull(),
    description: t.text().notNull(),
    status: t.text().notNull(), // pending, active, canceled, defeated, succeeded, queued, expired, executed
    forVotes: t.bigint().notNull().default(0n),
    againstVotes: t.bigint().notNull().default(0n),
    abstainVotes: t.bigint().notNull().default(0n),
    eta: t.bigint(), // For queued proposals
    createdAt: t.bigint().notNull(),
    executedAt: t.bigint(),
    canceledAt: t.bigint(),
  }),
  (table) => ({
    proposerIdx: index().on(table.proposer),
    statusIdx: index().on(table.status),
    createdAtIdx: index().on(table.createdAt),
  })
);

// Individual Votes
export const vote = onchainTable(
  "vote",
  (t) => ({
    id: t.text().primaryKey(), // proposalId-voter
    proposalId: t.bigint().notNull(),
    voter: t.text().notNull(),
    support: t.integer().notNull(), // 0 = against, 1 = for, 2 = abstain
    weight: t.bigint().notNull(),
    reason: t.text(),
    blockNumber: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (table) => ({
    proposalIdx: index().on(table.proposalId),
    voterIdx: index().on(table.voter),
  })
);

// Delegate Information
export const delegate = onchainTable(
  "delegate",
  (t) => ({
    id: t.text().primaryKey(), // address
    address: t.text().notNull(),
    votingPower: t.bigint().notNull().default(0n),
    delegatorsCount: t.integer().notNull().default(0),
    votesCount: t.integer().notNull().default(0),
    proposalsCreated: t.integer().notNull().default(0),
    lastActiveBlock: t.bigint(),
  }),
  (table) => ({
    votingPowerIdx: index().on(table.votingPower),
    delegatorsIdx: index().on(table.delegatorsCount),
  })
);

// Delegation Records
export const delegation = onchainTable(
  "delegation",
  (t) => ({
    id: t.text().primaryKey(), // delegator address
    delegator: t.text().notNull(),
    delegate: t.text().notNull(),
    timestamp: t.bigint().notNull(),
    blockNumber: t.bigint().notNull(),
  }),
  (table) => ({
    delegatorIdx: index().on(table.delegator),
    delegateIdx: index().on(table.delegate),
  })
);

// Token Balances table removed for MVP performance
// Can be added back later by re-enabling Transfer event handler

// Treasury Snapshots (for historical context)
export const treasurySnapshot = onchainTable(
  "treasury_snapshot",
  (t) => ({
    id: t.text().primaryKey(), // timestamp-based
    timestamp: t.bigint().notNull(),
    blockNumber: t.bigint().notNull(),
    totalValueUsd: t.bigint().notNull(),
    ethBalance: t.bigint().notNull(),
    ensBalance: t.bigint().notNull(),
    usdcBalance: t.bigint().notNull(),
    ethPrice: t.bigint().notNull(),
    ensPrice: t.bigint().notNull(),
    eventLabel: t.text(), // "Term 5 Budget Approved", etc.
  }),
  (table) => ({
    timestampIdx: index().on(table.timestamp),
  })
);

// Proposal Context Snapshots
export const proposalContext = onchainTable(
  "proposal_context",
  (t) => ({
    id: t.text().primaryKey(), // proposalId
    proposalId: t.bigint().notNull(),
    createdBlock: t.bigint().notNull(),
    createdTimestamp: t.bigint().notNull(),
    createdEthPrice: t.bigint().notNull(),
    createdEnsPrice: t.bigint().notNull(),
    createdGasPrice: t.bigint().notNull(),
    createdTreasuryUsd: t.bigint().notNull(),
  }),
  (table) => ({
    proposalIdIdx: index().on(table.proposalId),
  })
);

// Newsletter Archive (for full-text search)
export const newsletterArchive = onchainTable(
  "newsletter_archive",
  (t) => ({
    id: t.text().primaryKey(),
    title: t.text().notNull(),
    date: t.bigint().notNull(),
    content: t.text().notNull(),
    url: t.text().notNull(),
    source: t.text().notNull(), // forum, paragraph, etc.
    proposalsMentioned: t.text(), // JSON array of proposal IDs
  }),
  (table) => ({
    dateIdx: index().on(table.date),
    sourceIdx: index().on(table.source),
  })
);
