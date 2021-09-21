const { expect } = require("chai");
const { ethers } = require("hardhat");

const ITEM_TYPES = [
  "weapon",
  "chest",
  "head",
  "waist",
  "foot",
  "hand",
  "neck",
  "ring",
];

describe("LootMart", function () {
  var loot;
  var registry;
  var adventurer;
  var lootMart;
  var owner;
  var owner2;

  before(async function () {
    const Loot = await ethers.getContractFactory("Loot");
    loot = await Loot.deploy();
    await loot.deployed();

    const AdventurerRegistry = await ethers.getContractFactory(
      "AdventurerRegistry"
    );
    registry = await AdventurerRegistry.deploy();
    await registry.deployed();

    // Deploy Adventurer
    const Adventurer = await ethers.getContractFactory("Adventurer");
    adventurer = await Adventurer.deploy(
      registry.address // registry address
    );
    await adventurer.deployed();

    // Deploy LootMart
    const LootMart = await ethers.getContractFactory("LootMart");
    lootMart = await LootMart.deploy(
      loot.address, // Loot local address
      adventurer.address, // Adventurer local address
      "ipfs://QmVc4SFS3fHRb2biavZoQKfvxjFDmKK6DFRUPfrN1K7Gnz" // LootMart items
    );
    await lootMart.deployed();

    // Set owner var
    owner = (await ethers.getSigners())[0];
    owner2 = (await ethers.getSigners())[1];
  });

  it("Should add LootMart to registry", async function () {
    await registry.add1155Contract(lootMart.address);
    expect(await registry.isValidContract(lootMart.address)).to.be.true;
    expect(await registry.isValid1155Contract(lootMart.address)).to.be.true;
  });

  it("Should be able to claim LootMart items standalone", async function () {
    const lootId = "5555";
    await loot.claim(lootId);

    // LootMart balances for owner account before claim
    const balancesBefore = {};
    const ids = await lootMart.ids(lootId);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      balancesBefore[id] = await lootMart.balanceOf(owner.address, id);
    }

    // LootMart balances for owner account after claim
    await lootMart.claimForLoot(lootId);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      expect(await lootMart.balanceOf(owner.address, id)).to.equal(
        balancesBefore[id].add(1)
      );
    }

    // Check that LootMart has been claimed
    expect(await lootMart.claimedByTokenId(lootId)).to.equal(true);
  });

  it("Should be able to claim LootMart items with an Adventurer", async function () {
    const lootId = "123";
    await loot.claim(lootId);

    // LootMart balances for Adventurer contract before claim
    const balancesBefore = {};
    const ids = await lootMart.ids(lootId);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      balancesBefore[id] = await lootMart.balanceOf(adventurer.address, id);
    }

    // Adventurer balances for Adventurer contract
    const adventurerBalanceBefore = await adventurer.balanceOf(owner.address);
    await lootMart.claimForLootWithAdventurer(lootId);
    expect(await adventurer.balanceOf(owner.address)).to.equal(
      adventurerBalanceBefore.add(1)
    );

    // LootMart balances for Adventurer contract after claim
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      expect(await lootMart.balanceOf(adventurer.address, id)).to.equal(
        balancesBefore[id].add(1)
      );
    }

    // Check that LootMart has been claimed
    expect(await lootMart.claimedByTokenId(lootId)).to.equal(true);
  });

  it("Should not be able to equip unregistered contracts", async function () {
    const lootId = "3";
    await loot.claim(lootId);
    await registry.remove1155Contract(lootMart.address);
    await expect(lootMart.claimForLootWithAdventurer(lootId)).to.be.reverted;
    await registry.add1155Contract(lootMart.address);
  });

  it("Should not be able to claim for a Loot twice", async function () {
    const lootId = "333";
    await loot.claim(lootId);
    await lootMart.claimForLoot(lootId);
    await expect(lootMart.claimForLoot(lootId)).to.be.reverted;
  });

  it("Should not be able to claim for a Loot with an adventurer twice", async function () {
    const lootId = "444";
    await loot.claim(lootId);
    await lootMart.claimForLootWithAdventurer(lootId);
    await expect(lootMart.claimForLootWithAdventurer(lootId)).to.be.reverted;
  });

  it("Should not be able to claim for a Loot you don't own", async function () {
    const lootId = "1";
    await expect(lootMart.claimForLoot(lootId)).to.be.reverted;
  });

  it("Should be able to equip a new item", async function () {
    const lootIdStandalone = "666";
    const lootIdAdventurer = "789";
    await loot.claim(lootIdStandalone);
    await loot.claim(lootIdAdventurer);
    await lootMart.claimForLoot(lootIdStandalone);
    await lootMart.claimForLootWithAdventurer(lootIdAdventurer);

    // get token id
    const tokenBalance = await adventurer.balanceOf(owner.address);
    const tokenId = await adventurer.tokenOfOwnerByIndex(
      owner.address,
      tokenBalance - 1
    );

    const lootMartIdsStandalone = await lootMart.ids(lootIdStandalone);
    const idToEquip =
      lootMartIdsStandalone[
        Math.floor(Math.random() * lootMartIdsStandalone.length)
      ];
    const itemType = await lootMart.itemTypeFor(idToEquip);
    const oldItem = await adventurer.equipped(tokenId, itemType);

    // get balances of old item
    const oldItemPrevBalanceAdventurer = await lootMart.balanceOf(
      adventurer.address,
      oldItem.id
    );
    const oldItemPrevBalanceOwner = await lootMart.balanceOf(
      owner.address,
      oldItem.id
    );

    // get balances of new item
    const newItemPrevBalanceAdventurer = await lootMart.balanceOf(
      adventurer.address,
      idToEquip
    );
    const newItemPrevBalanceOwner = await lootMart.balanceOf(
      owner.address,
      idToEquip
    );

    // Equip item
    await lootMart.setApprovalForAll(adventurer.address, true);
    await adventurer.equip(tokenId, lootMart.address, idToEquip);
    const newItem = await adventurer.equipped(tokenId, itemType);
    expect(newItem.itemAddress).to.equal(lootMart.address);
    expect(newItem.id).to.equal(idToEquip);

    // Adventurer has 1 less of old item
    expect(await lootMart.balanceOf(adventurer.address, oldItem.id)).to.equal(
      oldItemPrevBalanceAdventurer.sub(1)
    );
    // Owner has 1 more of old item
    expect(await lootMart.balanceOf(owner.address, oldItem.id)).to.equal(
      oldItemPrevBalanceOwner.add(1)
    );

    // Adventurer has 1 more of new item
    expect(await lootMart.balanceOf(adventurer.address, newItem.id)).to.equal(
      newItemPrevBalanceAdventurer.add(1)
    );
    // Owner has 1 less of old item
    expect(await lootMart.balanceOf(owner.address, newItem.id)).to.equal(
      newItemPrevBalanceOwner.sub(1)
    );
  });

  it("Should be able to unequip an item", async function () {
    const lootId = "888";
    await loot.claim(lootId);
    await lootMart.claimForLootWithAdventurer(lootId);

    // get token id
    const tokenBalance = await adventurer.balanceOf(owner.address);
    const tokenId = await adventurer.tokenOfOwnerByIndex(
      owner.address,
      tokenBalance - 1
    );

    const itemTypeToUnequip =
      ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
    const oldItem = await adventurer.equipped(tokenId, itemTypeToUnequip);

    // get balances of old item
    const oldItemPrevBalanceAdventurer = await lootMart.balanceOf(
      adventurer.address,
      oldItem.id
    );
    const oldItemPrevBalanceOwner = await lootMart.balanceOf(
      owner.address,
      oldItem.id
    );

    // Equip item
    await adventurer.unequip(tokenId, itemTypeToUnequip);

    // Adventurer has 1 less of old item
    expect(await lootMart.balanceOf(adventurer.address, oldItem.id)).to.equal(
      oldItemPrevBalanceAdventurer.sub(1)
    );
    // Owner has 1 more of old item
    expect(await lootMart.balanceOf(owner.address, oldItem.id)).to.equal(
      oldItemPrevBalanceOwner.add(1)
    );

    // Item slot no longer equipped
    const nullItem = await adventurer.equipped(tokenId, itemTypeToUnequip);
    expect(nullItem.itemAddress).to.equal(ethers.constants.AddressZero);
    expect(nullItem.id).to.equal(0);
  });

  it("Should be able to transfer your Adventurer", async function () {
    const ownerBalanceBefore = await adventurer.balanceOf(owner.address);
    const tokenId = await adventurer.tokenOfOwnerByIndex(
      owner.address,
      ownerBalanceBefore - 1
    );

    const owner2BalanceBefore = await adventurer.balanceOf(owner2.address);
    await adventurer["safeTransferFrom(address,address,uint256)"](
      owner.address,
      owner2.address,
      tokenId
    );
    expect(await adventurer.balanceOf(owner.address)).to.equal(
      ownerBalanceBefore.sub(1)
    );
    expect(await adventurer.balanceOf(owner2.address)).to.equal(
      owner2BalanceBefore.add(1)
    );
  });
});
