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

  // Deploy Loot
  const Loot = await hre.ethers.getContractFactory("Loot");
  const loot = await Loot.deploy();
  await loot.deployed();
  console.log("Loot deployed to:", loot.address);

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
  const lootMart = await Lootmart.deploy(
    // "0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7", // Loot mainnet address
    loot.address, // Loot local address
    adventurer.address, // Adventurer local address
    "ipfs://QmUXVGz1QbzGbTHLw7gZL9YTQF4fXGK8DiyGmBWx6KkKUU" // Lootmart items
  );
  await lootMart.deployed();
  console.log("Lootmart deployed to:", lootMart.address);

  // Add lootmart to registry
  await registry.add1155Contract(lootMart.address);

  // Claim Loot
  // const signer0 = (await hre.ethers.getSigners())[0]; // this gives you signing power to the account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  // const liveLoot = await hre.ethers.getContractAt(
  //   "Loot",
  //   loot.address,
  //   signer0
  // );

  // await liveLoot.claim("123");
  // await liveLoot.claim("456");
  // await liveLoot.claim("789");
  // await liveLoot.claim("1000");
  // await lootMart.claimForLootWithAdventurer("123");
  // await lootMart.claimForLoot("456");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
