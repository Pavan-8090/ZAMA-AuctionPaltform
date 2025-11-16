/**
 * Deploy script for WhaleSafeRouter and mocks.
 * - Deploys FHEVerifierMock and a dummy exchange adapter (MockExchange)
 * - Deploys WhaleSafeRouter with admin as deployer
 */
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const SimpleExchangeAdapter = await ethers.getContractFactory("SimpleExchangeAdapter");
  const adapter = await SimpleExchangeAdapter.deploy();
  await adapter.waitForDeployment();
  console.log("SimpleExchangeAdapter:", await adapter.getAddress());

  const WhaleSafeRouter = await ethers.getContractFactory("WhaleSafeRouter");
  const router = await WhaleSafeRouter.deploy(deployer.address, await adapter.getAddress());
  await router.waitForDeployment();
  console.log("WhaleSafeRouter:", await router.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

