export const ENS_MULTISIGS = {
  // DAO Operational Contracts
  DAO_WALLET: "0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7",
  CONTROLLER: "0x253553366Da8546fC250F225fe3d25d0C782303b",
  LEGACY_CONTROLLER: "0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5",

  // Endowment
  ENDOWMENT: "0x4F2083f5fBede34C2714aFfb3105539775f7FE64",

  // Ecosystem Working Group
  ECOSYSTEM_1: "0x2686A8919Df194aA7673244549E68D42C1685d03",
  ECOSYSTEM_2: "0x6a016548310076285668e2378df70bd545396b5a",
  ECOSYSTEM_3: "0x536013c57DAF01D78e8a70cAd1B1abAda9411819",
  ECOSYSTEM_4: "0x9B9c249Be04dd433c7e8FbBF5E61E6741b89966D",
  ECOSYSTEM_5: "0x13aEe52C1C688d3554a15556c5353cb0c3696ea2",
  ECOSYSTEM_6: "0xBa0c461b22d918FB1F52fEF556310230d177D1F2",
  ECOSYSTEM_7: "0x9718ba71dC1284842fcE66dC3e34DFFC6C630074",

  // Meta-Governance Working Group
  METAGOV_1: "0x91c32893216dE3eA0a55ABb9851f581d4503d39b",
  METAGOV_2: "0x4f4cAdb8AF8F1d463240c2b93952D8a16688a818",
  METAGOV_3: "0x8f730f4aC5fd234df9993E0E317f07e44fb869C1",
  METAGOV_4: "0xB162Bf7A7fD64eF32b787719335d06B2780e31D1",

  // Public Goods Working Group
  PUBLIC_GOODS_1: "0xcD42b4c4D102cc22864e3A1341Bb0529c17fD87d",
  PUBLIC_GOODS_2: "0xebA76C907F02BA13064EDAD7876Fe51D9d856F62",
} as const;

export type MultisigKey = keyof typeof ENS_MULTISIGS;
export type MultisigAddress = (typeof ENS_MULTISIGS)[MultisigKey];

export interface MultisigInfo {
  key: MultisigKey;
  address: MultisigAddress;
  name: string;
  workingGroup: "DAO" | "Ecosystem" | "Metagov" | "Public Goods" | "Endowment";
  description: string;
  isMultisig: boolean; // Some contracts like Controller are not multisigs
  isPrimary?: boolean; // Primary wallets shown in the dashboard treasury widget
}

export const MULTISIG_INFO: MultisigInfo[] = [
  // DAO Operational Contracts
  {
    key: "DAO_WALLET",
    address: ENS_MULTISIGS.DAO_WALLET,
    name: "DAO Wallet",
    workingGroup: "DAO",
    description: "Stores DAO funds (ETH, ENS, USDC)",
    isMultisig: false, // Not a standard Safe - different contract type
    isPrimary: true,
  },
  {
    key: "CONTROLLER",
    address: ENS_MULTISIGS.CONTROLLER,
    name: "Controller",
    workingGroup: "DAO",
    description: "Collects ETH from .eth registrations",
    isMultisig: false,
  },
  {
    key: "LEGACY_CONTROLLER",
    address: ENS_MULTISIGS.LEGACY_CONTROLLER,
    name: "Legacy Controller",
    workingGroup: "DAO",
    description: "Legacy controller for .eth registrations",
    isMultisig: false,
  },

  // Endowment
  {
    key: "ENDOWMENT",
    address: ENS_MULTISIGS.ENDOWMENT,
    name: "Endowment",
    workingGroup: "Endowment",
    description: "Endowment invests DAO funds",
    isMultisig: false,
  },

  // Ecosystem Working Group
  {
    key: "ECOSYSTEM_1",
    address: ENS_MULTISIGS.ECOSYSTEM_1,
    name: "Ecosystem WG",
    workingGroup: "Ecosystem",
    description: "Ecosystem Working Group wallet",
    isMultisig: true,
    isPrimary: true,
  },
  {
    key: "ECOSYSTEM_2",
    address: ENS_MULTISIGS.ECOSYSTEM_2,
    name: "Ecosystem WG 2",
    workingGroup: "Ecosystem",
    description: "Ecosystem Working Group wallet",
    isMultisig: true,
  },
  {
    key: "ECOSYSTEM_3",
    address: ENS_MULTISIGS.ECOSYSTEM_3,
    name: "Ecosystem WG 3",
    workingGroup: "Ecosystem",
    description: "Ecosystem Working Group wallet",
    isMultisig: true,
  },
  {
    key: "ECOSYSTEM_4",
    address: ENS_MULTISIGS.ECOSYSTEM_4,
    name: "Ecosystem WG 4",
    workingGroup: "Ecosystem",
    description: "Ecosystem Working Group wallet",
    isMultisig: true,
  },
  {
    key: "ECOSYSTEM_5",
    address: ENS_MULTISIGS.ECOSYSTEM_5,
    name: "Ecosystem WG 5",
    workingGroup: "Ecosystem",
    description: "Ecosystem Working Group wallet",
    isMultisig: true,
  },
  {
    key: "ECOSYSTEM_6",
    address: ENS_MULTISIGS.ECOSYSTEM_6,
    name: "Ecosystem WG 6",
    workingGroup: "Ecosystem",
    description: "Ecosystem Working Group wallet",
    isMultisig: true,
  },
  {
    key: "ECOSYSTEM_7",
    address: ENS_MULTISIGS.ECOSYSTEM_7,
    name: "Ecosystem WG 7",
    workingGroup: "Ecosystem",
    description: "Ecosystem Working Group wallet",
    isMultisig: true,
  },

  // Meta-Governance Working Group
  {
    key: "METAGOV_1",
    address: ENS_MULTISIGS.METAGOV_1,
    name: "Metagov WG",
    workingGroup: "Metagov",
    description: "Meta-Governance Working Group wallet",
    isMultisig: true,
    isPrimary: true,
  },
  {
    key: "METAGOV_2",
    address: ENS_MULTISIGS.METAGOV_2,
    name: "Metagov WG 2",
    workingGroup: "Metagov",
    description: "Meta-Governance Working Group wallet",
    isMultisig: true,
  },
  {
    key: "METAGOV_3",
    address: ENS_MULTISIGS.METAGOV_3,
    name: "Metagov WG 3",
    workingGroup: "Metagov",
    description: "Meta-Governance Working Group wallet",
    isMultisig: true,
  },
  {
    key: "METAGOV_4",
    address: ENS_MULTISIGS.METAGOV_4,
    name: "Metagov WG 4",
    workingGroup: "Metagov",
    description: "Meta-Governance Working Group wallet",
    isMultisig: true,
  },

  // Public Goods Working Group
  {
    key: "PUBLIC_GOODS_1",
    address: ENS_MULTISIGS.PUBLIC_GOODS_1,
    name: "Public Goods WG",
    workingGroup: "Public Goods",
    description: "Public Goods Working Group wallet",
    isMultisig: true,
    isPrimary: true,
  },
  {
    key: "PUBLIC_GOODS_2",
    address: ENS_MULTISIGS.PUBLIC_GOODS_2,
    name: "Public Goods WG 2",
    workingGroup: "Public Goods",
    description: "Public Goods Working Group wallet",
    isMultisig: true,
  },
];

export function getMultisigInfo(address: string): MultisigInfo | undefined {
  return MULTISIG_INFO.find(
    (info) => info.address.toLowerCase() === address.toLowerCase()
  );
}

export function getMultisigsByWorkingGroup(
  workingGroup: MultisigInfo["workingGroup"]
): MultisigInfo[] {
  return MULTISIG_INFO.filter((info) => info.workingGroup === workingGroup);
}

export function getMultisigsOnly(): MultisigInfo[] {
  return MULTISIG_INFO.filter((info) => info.isMultisig);
}

export function getPrimaryWallets(): MultisigInfo[] {
  return MULTISIG_INFO.filter((info) => info.isPrimary);
}
