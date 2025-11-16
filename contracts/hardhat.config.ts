/**
 * Hardhat configuration for Private Whale-Safe Swapper contracts.
 * - Supports dotenv for env vars
 * - Gas reporter, solidity-coverage
 * - Optional FHE precompile address config via env for future integration
 */
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import * as dotenv from "dotenv";

dotenv.config();

const chainId = Number(process.env.CHAIN_ID || 31337);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 500
      }
    }
  },
  networks: {
    hardhat: {
      chainId
    },
    localhost: {
      chainId,
      url: "http://127.0.0.1:8545"
    }
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: process.env.CMC_API_KEY || "",
    showTimeSpent: true
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || ""
  }
};

export default config;

