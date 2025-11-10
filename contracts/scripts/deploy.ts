import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Deploying EncryptedAuction contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const EncryptedAuction = await ethers.getContractFactory("EncryptedAuction");
  const auction = await EncryptedAuction.deploy();

  await auction.waitForDeployment();
  const address = await auction.getAddress();

  console.log("EncryptedAuction deployed to:", address);
  console.log("Contract owner:", await auction.owner());

  // Save deployment info
  console.log("\n=== Deployment Info ===");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Contract Address:", address);
  console.log("Deployer:", deployer.address);
  console.log("\nAdd to .env:");
  console.log(`NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

