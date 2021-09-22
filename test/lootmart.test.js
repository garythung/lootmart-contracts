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

describe("Lootmart", function () {
  var loot;
  var registry;
  var adventurer;
  var lootmart;
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

    // Deploy Lootmart
    const Lootmart = await ethers.getContractFactory("Lootmart");
    lootmart = await Lootmart.deploy(
      loot.address, // Loot local address
      adventurer.address, // Adventurer local address
      "ipfs://QmVc4SFS3fHRb2biavZoQKfvxjFDmKK6DFRUPfrN1K7Gnz" // Lootmart items
    );
    await lootmart.deployed();

    // Set owner var
    owner = (await ethers.getSigners())[0];
    owner2 = (await ethers.getSigners())[1];
  });

  it("Should add Lootmart to registry", async function () {
    await registry.add1155Contract(lootmart.address);
    expect(await registry.isValidContract(lootmart.address)).to.be.true;
    expect(await registry.isValid1155Contract(lootmart.address)).to.be.true;
  });

  it("Should be able to claim Lootmart items standalone", async function () {
    const lootId = "5555";
    await loot.claim(lootId);

    // Lootmart balances for owner account before claim
    const balancesBefore = {};
    const ids = await lootmart.ids(lootId);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      balancesBefore[id] = await lootmart.balanceOf(owner.address, id);
    }

    // Lootmart balances for owner account after claim
    await lootmart.claimForLoot(lootId);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      expect(await lootmart.balanceOf(owner.address, id)).to.equal(
        balancesBefore[id].add(1)
      );
    }

    // Check that Lootmart has been claimed
    expect(await lootmart.claimedByTokenId(lootId)).to.equal(true);
  });

  it("Should be able to claim Lootmart items with an Adventurer", async function () {
    const lootId = "123";
    await loot.claim(lootId);

    const adventurerBalanceBefore = await adventurer.balanceOf(owner.address);

    // Lootmart balances for owner account before claim
    const balancesBefore = {};
    const ids = await lootmart.ids(lootId);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      balancesBefore[id] = await lootmart.balanceOf(owner.address, id);
    }

    // Lootmart balances for owner account after claim
    await lootmart.claimForLootWithAdventurer(lootId);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      expect(await lootmart.balanceOf(owner.address, id)).to.equal(
        balancesBefore[id].add(1)
      );
    }

    // Check that Lootmart has been claimed
    expect(await lootmart.claimedByTokenId(lootId)).to.equal(true);

    // Check that owner owns Adventurer
    expect(await adventurer.balanceOf(owner.address)).to.equal(
      adventurerBalanceBefore.add(1)
    );
  });

  it("Should not be able to equip unregistered contracts", async function () {
    const lootId = "3";
    await loot.claim(lootId);
    await lootmart.claimForLootWithAdventurer(lootId);
    const ids = await lootmart.ids(lootId);

    const tokenBalance = await adventurer.balanceOf(owner.address);
    const tokenId = await adventurer.tokenOfOwnerByIndex(
      owner.address,
      tokenBalance - 1
    );

    await registry.remove1155Contract(lootmart.address);
    await expect(adventurer.equip(tokenId, lootmart.address, ids[0])).to.be
      .reverted;
    await registry.add1155Contract(lootmart.address);
  });

  it("Should not be able to claim for a Loot twice", async function () {
    const lootId = "333";
    await loot.claim(lootId);
    await lootmart.claimForLoot(lootId);
    await expect(lootmart.claimForLoot(lootId)).to.be.reverted;
  });

  it("Should not be able to claim for a Loot with an adventurer twice", async function () {
    const lootId = "444";
    await loot.claim(lootId);
    await lootmart.claimForLootWithAdventurer(lootId);
    await expect(lootmart.claimForLootWithAdventurer(lootId)).to.be.reverted;
  });

  it("Should not be able to claim for a Loot you don't own", async function () {
    const lootId = "1";
    await expect(lootmart.claimForLoot(lootId)).to.be.reverted;
  });

  it("Should be able to equip a new item", async function () {
    const lootIdStandalone = "666";
    const lootIdAdventurer = "789";
    await loot.claim(lootIdStandalone);
    await loot.claim(lootIdAdventurer);
    await lootmart.claimForLoot(lootIdStandalone);
    await lootmart.claimForLootWithAdventurer(lootIdAdventurer);

    // get token id
    const tokenBalance = await adventurer.balanceOf(owner.address);
    const tokenId = await adventurer.tokenOfOwnerByIndex(
      owner.address,
      tokenBalance - 1
    );

    const lootmartIdsStandalone = await lootmart.ids(lootIdStandalone);
    const idToEquip =
      lootmartIdsStandalone[
        Math.floor(Math.random() * lootmartIdsStandalone.length)
      ];
    const itemType = await lootmart.itemTypeFor(idToEquip);

    // get balances of new item
    const newItemPrevBalanceAdventurer = await lootmart.balanceOf(
      adventurer.address,
      idToEquip
    );
    const newItemPrevBalanceOwner = await lootmart.balanceOf(
      owner.address,
      idToEquip
    );

    // Approve Adventurer to transfer Lootmart items
    await lootmart.setApprovalForAll(adventurer.address, true);

    // Equip item
    await adventurer.equip(tokenId, lootmart.address, idToEquip);
    const newItem = await adventurer.equipped(tokenId, itemType);
    expect(newItem.itemAddress).to.equal(lootmart.address);
    expect(newItem.id).to.equal(idToEquip);

    // Adventurer has 1 more of new item
    expect(await lootmart.balanceOf(adventurer.address, newItem.id)).to.equal(
      newItemPrevBalanceAdventurer.add(1)
    );
    // Owner has 1 less of old item
    expect(await lootmart.balanceOf(owner.address, newItem.id)).to.equal(
      newItemPrevBalanceOwner.sub(1)
    );
  });

  it("Should be able to unequip an item", async function () {
    const lootId = "888";
    await loot.claim(lootId);
    await lootmart.claimForLootWithAdventurer(lootId);

    const lootmartIdsStandalone = await lootmart.ids(lootId);
    const idToEquip =
      lootmartIdsStandalone[
        Math.floor(Math.random() * lootmartIdsStandalone.length)
      ];

    // get token id
    const tokenBalance = await adventurer.balanceOf(owner.address);
    const tokenId = await adventurer.tokenOfOwnerByIndex(
      owner.address,
      tokenBalance - 1
    );

    // equip item
    await adventurer.equip(tokenId, lootmart.address, idToEquip);
    const itemType = await lootmart.itemTypeFor(idToEquip);
    const current = await adventurer.equipped(tokenId, itemType);

    // get balances of old item
    const oldItemPrevBalanceAdventurer = await lootmart.balanceOf(
      adventurer.address,
      current.id
    );
    const oldItemPrevBalanceOwner = await lootmart.balanceOf(
      owner.address,
      current.id
    );

    // Equip item
    await adventurer.unequip(tokenId, itemType);

    // Adventurer has 1 less of old item
    expect(await lootmart.balanceOf(adventurer.address, current.id)).to.equal(
      oldItemPrevBalanceAdventurer.sub(1)
    );
    // Owner has 1 more of old item
    expect(await lootmart.balanceOf(owner.address, current.id)).to.equal(
      oldItemPrevBalanceOwner.add(1)
    );

    // Item slot no longer equipped
    const nullItem = await adventurer.equipped(tokenId, itemType);
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
