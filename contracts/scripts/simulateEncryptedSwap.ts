/**
 * Simulate an end-to-end encrypted swap in MOCK_FHE mode.
 * - Deploys ERC20 mock, mints to user
 * - Submits encrypted order
 * - Executes via relayer signer
 */
import { ethers } from "hardhat";

async function main() {
  const [deployer, user, relayer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address, "User:", user.address, "Relayer:", relayer.address);

  const TestToken = await ethers.getContractFactory("TestToken");
  const token = await TestToken.deploy("TestToken", "TEST");
  await token.waitForDeployment();
  await (await token.mint(user.address, ethers.parseEther("1000"))).wait();

  const SimpleExchangeAdapter = await ethers.getContractFactory("SimpleExchangeAdapter");
  const adapter = await SimpleExchangeAdapter.deploy();
  await adapter.waitForDeployment();

  const WhaleSafeRouter = await ethers.getContractFactory("WhaleSafeRouter");
  const router = await WhaleSafeRouter.deploy(deployer.address, await adapter.getAddress());
  await router.waitForDeployment();
  // grant relayer role
  const RELAYER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RELAYER_ROLE"));
  await router.connect(deployer).grantRole(RELAYER_ROLE, relayer.address);

  // Approvals
  await token.connect(user).approve(await router.getAddress(), ethers.parseEther("100"));

  // Submit encrypted order (ciphertext mock bytes)
  const ciphertext = ethers.getBytes(ethers.id("ciphertext:42"));
  const metadata = ethers.getBytes(ethers.id("meta:slippage5bps"));
  const tx = await router.connect(user).submitEncryptedOrder(await token.getAddress(), await token.getAddress(), ciphertext, metadata);
  const rc = await tx.wait();
  const ev = rc?.logs.find((l) => (l as any).fragment?.name === "EncryptedOrderSubmitted") as any;
  const orderId = ev?.args?.[0] ?? 1n;
  console.log("Submitted orderId:", orderId.toString());

  // Execute (mock) - amountIn = 10, minOut=9
  const amountIn = ethers.parseEther("10");
  const minOut = ethers.parseEther("9");
  const publicAmountOut = amountIn;
  const publicPrice = ethers.parseUnits("1", 18);
  await router.connect(relayer).executeEncryptedSwap(orderId, "0x", amountIn, minOut, publicAmountOut, publicPrice);
  console.log("Executed order:", orderId.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

