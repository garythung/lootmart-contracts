// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const LootMart = await hre.ethers.getContractFactory("LootMart");
  const lootMart = await LootMart.deploy(
    "0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7", // Loot contract address
    "ipfs://QmPrreb5WiFDtp56WZe1okrRcw9Cv7QxdVvfWbKRgjhM4C" // LootMart testnet items
  );
  await lootMart.deployed();
  console.log("LootMart deployed to:", lootMart.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
