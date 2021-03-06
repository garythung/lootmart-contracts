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
  const lootmart = await Lootmart.deploy(
    loot.address, // Loot local address
    adventurer.address, // Adventurer local address
    "ipfs://QmSqyit6qoK5x4XWN3mv6YjrSp1sPpsqa6T7gMTcWQG32h" // Lootmart items
  );
  await lootmart.deployed();
  console.log("Lootmart deployed to:", lootmart.address);

  // Add lootmart to registry
  await registry.add1155Contract(lootmart.address);

  await loot.claim("1");
  await loot.claim("2");
  await lootmart.claimForLootWithAdventurer("1");
  await lootmart.setApprovalForAll(adventurer.address, true);
  const ids = await lootmart.ids("1");
  // for (let i = 0; i < ids.length; i++) {
  //   const id = ids[i];
  //   if (id % 2 === 0) {
  //     continue;
  //   }
  //   await adventurer.equip("0", lootmart.address, id);
  // }
  // await adventurer.equip("0", lootmart.address, ids[3]);
  // await adventurer.equip("0", lootmart.address, ids[4]);
  // await adventurer.equip("0", lootmart.address, ids[7]);
  console.log(await adventurer.tokenURI("0"));
  console.log(await lootmart.tokenURI(ids[0]));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
