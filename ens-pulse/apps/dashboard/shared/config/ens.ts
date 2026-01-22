// ENS Protocol Configuration
export const ENS_CONFIG = {
  // Chain
  CHAIN_ID: 1,
  CHAIN_NAME: "Ethereum Mainnet",

  // Contract Addresses
  GOVERNOR: "0x323A76393544d5ecca80cd6ef2A560C6a395b7E3",
  TOKEN: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
  TIMELOCK: "0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7",
  REGISTRY: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
  RESOLVER: "0x4976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41",

  // Governor Settings
  VOTING_DELAY: 7200, // blocks (~1 day)
  VOTING_PERIOD: 50400, // blocks (~7 days)
  PROPOSAL_THRESHOLD: 100000n * 10n ** 18n, // 100k ENS
  QUORUM_NUMERATOR: 1, // 1% quorum

  // Token Info
  TOKEN_SYMBOL: "ENS",
  TOKEN_NAME: "Ethereum Name Service",
  TOKEN_DECIMALS: 18,
  TOTAL_SUPPLY: 100_000_000n * 10n ** 18n,

  // External Links
  LINKS: {
    TALLY: "https://tally.xyz/gov/ens",
    FORUM: "https://discuss.ens.domains",
    WEBSITE: "https://ens.domains",
    GITHUB: "https://github.com/ensdomains",
    TWITTER: "https://twitter.com/ensdomains",
    DISCORD: "https://chat.ens.domains",
    DOCS: "https://docs.ens.domains",
  },
} as const;

// Proposal Status
export type ProposalStatus =
  | "pending"
  | "active"
  | "canceled"
  | "defeated"
  | "succeeded"
  | "queued"
  | "expired"
  | "executed";

export const PROPOSAL_STATUS_COLORS: Record<ProposalStatus, string> = {
  pending: "warning",
  active: "info",
  canceled: "danger",
  defeated: "danger",
  succeeded: "success",
  queued: "warning",
  expired: "danger",
  executed: "success",
};

// Vote Types
export type VoteType = "for" | "against" | "abstain";

export const VOTE_TYPE_LABELS: Record<VoteType, string> = {
  for: "For",
  against: "Against",
  abstain: "Abstain",
};

export const VOTE_TYPE_COLORS: Record<VoteType, string> = {
  for: "success",
  against: "danger",
  abstain: "warning",
};
