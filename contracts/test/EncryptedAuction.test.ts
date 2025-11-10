import { expect } from "chai";
import { ethers } from "hardhat";
import { EncryptedAuction } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("EncryptedAuction", function () {
  let auction: EncryptedAuction;
  let owner: SignerWithAddress;
  let seller: SignerWithAddress;
  let bidder1: SignerWithAddress;
  let bidder2: SignerWithAddress;

  // Mock encrypted value (in production, this would be from FHEVM)
  const mockEncryptedValue = ethers.hexlify(ethers.randomBytes(32));

  beforeEach(async function () {
    [owner, seller, bidder1, bidder2] = await ethers.getSigners();

    const EncryptedAuctionFactory = await ethers.getContractFactory("EncryptedAuction");
    auction = await EncryptedAuctionFactory.deploy();
    await auction.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await auction.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should set the right owner", async function () {
      expect(await auction.owner()).to.equal(owner.address);
    });
  });

  describe("Auction Creation", function () {
    it("Should create an auction", async function () {
      const tx = await auction.connect(seller).createAuction(
        "Test Item",
        "Test Description",
        "ipfs://test",
        mockEncryptedValue,
        86400 // 1 day
      );

      await expect(tx)
        .to.emit(auction, "AuctionCreated")
        .withArgs(1, seller.address, async (endTime: bigint) => {
          return endTime > BigInt(0);
        });

      const auctionDetails = await auction.getAuctionDetails(1);
      expect(auctionDetails.seller).to.equal(seller.address);
      expect(auctionDetails.itemName).to.equal("Test Item");
      expect(auctionDetails.status).to.equal(0); // Active
    });

    it("Should reject empty item name", async function () {
      await expect(
        auction.connect(seller).createAuction(
          "",
          "Description",
          "ipfs://test",
          mockEncryptedValue,
          86400
        )
      ).to.be.revertedWith("Item name required");
    });

    it("Should reject zero duration", async function () {
      await expect(
        auction.connect(seller).createAuction(
          "Item",
          "Description",
          "ipfs://test",
          mockEncryptedValue,
          0
        )
      ).to.be.revertedWith("Duration must be positive");
    });
  });

  describe("Bidding", function () {
    beforeEach(async function () {
      await auction.connect(seller).createAuction(
        "Test Item",
        "Description",
        "ipfs://test",
        mockEncryptedValue,
        86400
      );
    });

    it("Should accept a bid", async function () {
      const bidAmount = ethers.parseEther("1.0");
      const tx = await auction.connect(bidder1).submitBid(1, mockEncryptedValue, {
        value: bidAmount,
      });

      await expect(tx)
        .to.emit(auction, "BidSubmitted")
        .withArgs(1, bidder1.address, 0);

      const bids = await auction.getBids(1);
      expect(bids.length).to.equal(1);
      expect(bids[0].bidder).to.equal(bidder1.address);
    });

    it("Should reject bid from seller", async function () {
      await expect(
        auction.connect(seller).submitBid(1, mockEncryptedValue, {
          value: ethers.parseEther("1.0"),
        })
      ).to.be.revertedWith("Seller cannot bid");
    });

    it("Should reject zero value bid", async function () {
      await expect(
        auction.connect(bidder1).submitBid(1, mockEncryptedValue, {
          value: 0,
        })
      ).to.be.revertedWith("Bid must include payment");
    });
  });

  describe("Auction Cancellation", function () {
    beforeEach(async function () {
      await auction.connect(seller).createAuction(
        "Test Item",
        "Description",
        "ipfs://test",
        mockEncryptedValue,
        86400
      );
    });

    it("Should allow seller to cancel before bids", async function () {
      await auction.connect(seller).cancelAuction(1);
      const details = await auction.getAuctionDetails(1);
      expect(details.status).to.equal(2); // Cancelled
    });

    it("Should reject cancellation from non-seller", async function () {
      await expect(
        auction.connect(bidder1).cancelAuction(1)
      ).to.be.revertedWith("Only seller can cancel");
    });

    it("Should reject cancellation with existing bids", async function () {
      await auction.connect(bidder1).submitBid(1, mockEncryptedValue, {
        value: ethers.parseEther("1.0"),
      });

      await expect(
        auction.connect(seller).cancelAuction(1)
      ).to.be.revertedWith("Cannot cancel with bids");
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow owner to pause", async function () {
      await auction.pause();
      expect(await auction.paused()).to.be.true;
    });

    it("Should prevent operations when paused", async function () {
      await auction.pause();
      await expect(
        auction.connect(seller).createAuction(
          "Item",
          "Description",
          "ipfs://test",
          mockEncryptedValue,
          86400
        )
      ).to.be.revertedWithCustomError(auction, "EnforcedPause");
    });

    it("Should allow owner to unpause", async function () {
      await auction.pause();
      await auction.unpause();
      expect(await auction.paused()).to.be.false;
    });
  });
});

