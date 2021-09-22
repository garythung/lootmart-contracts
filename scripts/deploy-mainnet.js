// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

const LOOT_MAINNET_ADDRESS = "0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7";

async function main() {
  // Deploy AdventurerRegistry
  const AdventurerRegistry = await hre.ethers.getContractFactory(
    "AdventurerRegistry"
  );
  const registry = await AdventurerRegistry.deploy();
  await registry.deployed();
  console.log("AdventurerRegistry deployed to:", registry.address);

  // Deploy Adventurer
  const Adventurer = await hre.ethers.getContractFactory("Adventurer");
  const adventurer = await Adventurer.deploy(
    registry.address // registry address
  );
  await adventurer.deployed();
  console.log("Adventurer deployed to:", adventurer.address);

  // Deploy Lootmart
  const Lootmart = await hre.ethers.getContractFactory("Lootmart");
  const lootmart = await Lootmart.deploy(
    LOOT_MAINNET_ADDRESS,
    adventurer.address, // Adventurer local address
    "ipfs://QmSqyit6qoK5x4XWN3mv6YjrSp1sPpsqa6T7gMTcWQG32h" // Lootmart items
  );
  await lootmart.deployed();
  console.log("Lootmart deployed to:", lootmart.address);

  // Add lootmart to registry
  await registry.add1155Contract(lootmart.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
