import { expect } from "chai";
import { ethers } from "hardhat";

describe("WhaleSafeRouter", () => {
  it("submitEncryptedOrder emits event and stores order", async () => {
    const [admin, user] = await ethers.getSigners();
    const SimpleExchangeAdapter = await ethers.getContractFactory("SimpleExchangeAdapter");
    const ex = await SimpleExchangeAdapter.deploy();
    await ex.waitForDeployment();
    const WhaleSafeRouter = await ethers.getContractFactory("WhaleSafeRouter");
    const router = await WhaleSafeRouter.deploy(admin.address, await ex.getAddress());
    await router.waitForDeployment();

    const ct = ethers.getBytes(ethers.id("ct"));
    const md = ethers.getBytes(ethers.id("md"));
    await expect(router.connect(user).submitEncryptedOrder(ethers.ZeroAddress, ethers.ZeroAddress, ct, md)).to.be.revertedWith("tokens");

    const TestToken = await ethers.getContractFactory("TestToken");
    const t = await TestToken.deploy("A", "A");
    await t.waitForDeployment();
    await (await t.mint(user.address, ethers.parseEther("10"))).wait();
    const tx = await router.connect(user).submitEncryptedOrder(await t.getAddress(), await t.getAddress(), ct, md);
    await expect(tx).to.emit(router, "EncryptedOrderSubmitted");

    const order = await router.getOrder(1);
    expect(order.submitter).to.eq(user.address);
    expect(order.status).to.eq(1);
  });

  it("only relayer can execute", async () => {
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
    await (await t.mint(user.address, ethers.parseEther("10"))).wait();
    await router.connect(user).submitEncryptedOrder(await t.getAddress(), await t.getAddress(), "0x11", "0x22");
    await t.connect(user).approve(await router.getAddress(), ethers.parseEther("10"));

    await expect(
      router.connect(user).executeEncryptedSwap(1, "0x", ethers.parseEther("1"), 0, 0, 0)
    ).to.be.revertedWithCustomError(router, "AccessControlUnauthorizedAccount").withArgs(user.address, RELAYER_ROLE);
  });

  it("cancelOrder by signer prevents execution", async () => {
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
    await (await t.mint(user.address, ethers.parseEther("10"))).wait();
    await router.connect(user).submitEncryptedOrder(await t.getAddress(), await t.getAddress(), "0x11", "0x22");
    const order = await router.getOrder(1);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const domain = {
      name: "WhaleSafeRouter",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await router.getAddress()
    };
    const types = {
      CancelOrder: [
        { name: "submitter", type: "address" },
        { name: "orderId", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" }
      ]
    };
    const message = {
      submitter: user.address,
      orderId: 1,
      nonce: order.nonce,
      deadline
    };
    const signature = await user.signTypedData(domain, types, message);
    await router.cancelOrder(1, order.nonce, deadline, signature);
    const after = await router.getOrder(1);
    expect(after.status).to.eq(2);
    await t.connect(user).approve(await router.getAddress(), ethers.parseEther("10"));
    await expect(
      router.connect(relayer).executeEncryptedSwap(1, "0x", ethers.parseEther("1"), 0, 0, 0)
    ).to.be.revertedWith("bad status");
  });

  it("pausability blocks submit", async () => {
    const [admin, user] = await ethers.getSigners();
    const SimpleExchangeAdapter = await ethers.getContractFactory("SimpleExchangeAdapter");
    const ex = await SimpleExchangeAdapter.deploy();
    await ex.waitForDeployment();
    const WhaleSafeRouter = await ethers.getContractFactory("WhaleSafeRouter");
    const router = await WhaleSafeRouter.deploy(admin.address, await ex.getAddress());
    await router.waitForDeployment();
    await router.connect(admin).pause();
    const TestToken = await ethers.getContractFactory("TestToken");
    const t = await TestToken.deploy("A", "A");
    await t.waitForDeployment();
    await (await t.mint(user.address, 1n)).wait();
    await expect(router.connect(user).submitEncryptedOrder(await t.getAddress(), await t.getAddress(), "0x", "0x")).to.be.revertedWith("ciphertext");
  });
});

