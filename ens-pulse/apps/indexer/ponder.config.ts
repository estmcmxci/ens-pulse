import { createConfig } from "ponder";

// ENS Governor Contract ABI (relevant events)
const governorAbi = [
  {
    type: "event",
    name: "ProposalCreated",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: false },
      { name: "proposer", type: "address", indexed: false },
      { name: "targets", type: "address[]", indexed: false },
      { name: "values", type: "uint256[]", indexed: false },
      { name: "signatures", type: "string[]", indexed: false },
      { name: "calldatas", type: "bytes[]", indexed: false },
      { name: "startBlock", type: "uint256", indexed: false },
      { name: "endBlock", type: "uint256", indexed: false },
      { name: "description", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ProposalCanceled",
    inputs: [{ name: "proposalId", type: "uint256", indexed: false }],
  },
  {
    type: "event",
    name: "ProposalExecuted",
    inputs: [{ name: "proposalId", type: "uint256", indexed: false }],
  },
  {
    type: "event",
    name: "ProposalQueued",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: false },
      { name: "eta", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "VoteCast",
    inputs: [
      { name: "voter", type: "address", indexed: true },
      { name: "proposalId", type: "uint256", indexed: false },
      { name: "support", type: "uint8", indexed: false },
      { name: "weight", type: "uint256", indexed: false },
      { name: "reason", type: "string", indexed: false },
    ],
  },
] as const;

// ENS Token ABI (delegation events only - Transfer removed for MVP performance)
const tokenAbi = [
  {
    type: "event",
    name: "DelegateChanged",
    inputs: [
      { name: "delegator", type: "address", indexed: true },
      { name: "fromDelegate", type: "address", indexed: true },
      { name: "toDelegate", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "DelegateVotesChanged",
    inputs: [
      { name: "delegate", type: "address", indexed: true },
      { name: "previousBalance", type: "uint256", indexed: false },
      { name: "newBalance", type: "uint256", indexed: false },
    ],
  },
] as const;

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc: process.env.PONDER_RPC_URL_1,
      maxRequestsPerSecond: 25, // Alchemy free tier (~25-30 req/s)
    },
  },
  contracts: {
    ENSGovernor: {
      chain: "mainnet",
      abi: governorAbi,
      address: "0x323A76393544d5ecca80cd6ef2A560C6a395b7E3",
      startBlock: 21480000, // ~2 weeks ago
    },
    ENSToken: {
      chain: "mainnet",
      abi: tokenAbi,
      address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
      startBlock: 21480000, // ~2 weeks ago
    },
  },
});
