/**
 * Etherscan verification helper.
 */
import { run } from "hardhat";

async function main() {
  const address = process.env.CONTRACT_ADDRESS!;
  const constructorArgs: any[] = []; // fill if verifying specific contracts
  await run("verify:verify", { address, constructorArguments: constructorArgs });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

