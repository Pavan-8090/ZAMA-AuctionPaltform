import { expect } from "chai";
import { ethers } from "hardhat";

describe("EncryptedFlow (MOCK_FHE)", () => {
  it("submit -> relayer -> execute -> SwapExecuted observed", async () => {
    const [admin, user, relayer] = await ethers.getSigners();
    const SimpleExchangeAdapter = await ethers.getContractFactory("SimpleExchangeAdapter");
    const ex = await SimpleExchangeAdapter.deploy();
    await ex.waitForDeployment();
    const WhaleSafeRouter = await ethers.getContractFactory("WhaleSafeRouter");
    const router = await WhaleSafeRouter.deploy(admin.address, await ex.getAddress());
    await router.waitForDeployment();
    const RELAYER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RELAYER_ROLE"));
    await router.connect(admin).grantRole(RELAYER_ROLE, relayer.address);

    const TestToken = await ethers.getContractFactory("TestToken");
    const t = await TestToken.deploy("A", "A");
    await t.waitForDeployment();
    await (await t.mint(user.address, ethers.parseEther("100"))).wait();

    await t.connect(user).approve(await router.getAddress(), ethers.parseEther("50"));
    const ct = ethers.getBytes(ethers.id("mock ct"));
    const md = ethers.getBytes(ethers.id("mock md"));
    const tx = await router.connect(user).submitEncryptedOrder(await t.getAddress(), await t.getAddress(), ct, md);
    const rc = await tx.wait();
    const ev = rc?.logs.find((l) => (l as any).fragment?.name === "EncryptedOrderSubmitted") as any;
    const orderId = ev?.args?.[0] ?? 1n;

    const filter = router.filters.SwapExecuted(orderId);
    const amountIn = ethers.parseEther("10");
    const minOut = ethers.parseEther("9");
    const publicAmountOut = amountIn;
    const publicPrice = ethers.parseUnits("1", 18);
    await expect(router.connect(relayer).executeEncryptedSwap(orderId, "0x", amountIn, minOut, publicAmountOut, publicPrice))
      .to.emit(router, "SwapExecuted");

    const order = await router.getOrder(orderId);
    expect(order.status).to.eq(3);
  });
});

