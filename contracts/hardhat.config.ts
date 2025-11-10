import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load .env from root directory
dotenv.config({ path: resolve(__dirname, "../.env") });
// Also try local .env if exists
dotenv.config({ path: resolve(__dirname, ".env") });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    fhenix: {
      url: process.env.NEXT_PUBLIC_RPC_URL || "https://api.testnet.fhenix.xyz",
      chainId: 42069,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    zama: {
      url: process.env.NEXT_PUBLIC_RPC_URL || "https://devnet.zama.ai/",
      chainId: 8009,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    zamaTestnet: {
      url: "https://testnet.zama.ai",
      chainId: 9000,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    fhenixNitrogen: {
      url: "https://api.nitrogen.fhenix.zone",
      chainId: 8008148,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    sepolia: {
      url: process.env.INFURA_API_KEY 
        ? `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
        : "https://ethereum-sepolia-rpc.publicnode.com",
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 120000,
      httpHeaders: {},
    },
  },
  etherscan: {
    apiKey: {
      fhenix: process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "fhenix",
        chainId: 42069,
        urls: {
          apiURL: "https://explorer.testnet.fhenix.xyz/api",
          browserURL: "https://explorer.testnet.fhenix.xyz",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;

