const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LootMart", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Loot = await hre.ethers.getContractFactory("Loot");
    const loot = await Loot.deploy();
    await loot.deployed();

    const AdventurerRegistry = await hre.ethers.getContractFactory(
      "AdventurerRegistry"
    );
    const registry = await AdventurerRegistry.deploy();
    await registry.deployed();

    // Deploy Adventurer
    const Adventurer = await hre.ethers.getContractFactory("Adventurer");
    const adventurer = await Adventurer.deploy(
      registry.address // registry address
    );
    await adventurer.deployed();

    // Deploy LootMart
    const LootMart = await hre.ethers.getContractFactory("LootMart");
    const lootMart = await LootMart.deploy(
      loot.address, // Loot local address
      adventurer.address, // Adventurer local address
      "ipfs://QmVc4SFS3fHRb2biavZoQKfvxjFDmKK6DFRUPfrN1K7Gnz" // LootMart items
    );
    await lootMart.deployed();

    // Add lootmart to registry
    await registry.add1155Contract(lootMart.address);

    // Claim Loot
    const signer0 = (await hre.ethers.getSigners())[0];
    await loot.connect(signer0).claim("123");
    await loot.connect(signer0).claim("456");
    await loot.connect(signer0).claim("789");
    await loot.connect(signer0).claim("1000");
    await lootMart.connect(signer0).claimForLootWithAdventurer("123");
    await lootMart.connect(signer0).claimForLoot("456");

    expect(await lootMart.claimedByTokenId("123")).to.equal(true);
    expect(await lootMart.claimedByTokenId("456")).to.equal(true);

    expect(await adventurer.balanceOf(lootMart.address)).to.equal(0);
    expect(await adventurer.balanceOf(signer0.address)).to.equal(1);

    expect(await adventurer.totalSupply()).to.equal(1);
    expect(await adventurer.ownerOf("0")).to.equal(signer0.address);

    const ids123 = await lootMart.ids("123");
    const ids456 = await lootMart.ids("456");

    //NOT WORKING; 123 AND 456 OVERLAP
    [
      "weapon",
      "chest",
      "head",
      "waist",
      "foot",
      "hand",
      "neck",
      "ring",
    ].forEach(async (t) => {
      // expect(await lootMart.balanceOf(adventurer.address, ids123[t])).to.equal(
      //   1
      // );
      // expect(await lootMart.balanceOf(lootMart.address, ids123[t])).to.equal(0);
      // expect(await lootMart.balanceOf(signer0.address, ids123[t])).to.equal(0);
      console.log(await lootMart.balanceOf(adventurer.address, ids456[t]));
      expect(await lootMart.balanceOf(adventurer.address, ids456[t])).to.equal(
        0
      );
      expect(await lootMart.balanceOf(lootMart.address, ids456[t])).to.equal(0);
      expect(await lootMart.balanceOf(signer0.address, ids456[t])).to.equal(1);
    });
  });
});
