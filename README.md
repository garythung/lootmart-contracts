# <h1 align="center"> Lootmart </h1>

**Unbundle your Loot into components**

Lootmart is an ERC-1155 contract that allows you to claim individual components from your Loot. Each ERC1155's token image points to a piece of art stored on IPFS.

Mint your components by calling `claimForLoot(uint256 tokenId)`, `claimAllForOwner()`, or `claimForTokenIds(uint256[] memory tokenIds)`. You can mint an `Adventurer` as well by calling `claimForLootWithAdventurer(uint256 tokenId)` (and same with the other 2 claim functions `WithAdventurer` appended). This will mint you an Adventurer with your Lootmart set equipped.

## Adventurer

The Adventurer is a composable NFT inspired by the [ERC-998](https://eips.ethereum.org/EIPS/eip-998) standard. There is an AdventurerRegistry paired with the Adventurer that specifies which 721 and 1155 contracts are valid to equip the Adventurer with, as well as valid item types.

To equip items, you must approve the Adventurer contract to transfer your items for that contract. Then, call `equip` with the item details. `equip` will unequip the existing item in the slot and send it back to you if there is one, and then equip the new one.

To unequip items, call `unequip` with the item type. The Adventurer contract will send you back the item.

## Building

1. `npm i`
2. Set up a `.env` file with a `ALCHEMY_MAINNET_URL` which is an Alchemy node for [forking mainnet](https://hardhat.org/hardhat-network/guides/mainnet-forking.html).
3. `npx hardhat compile`
4. `npx hardhat node`
5. `npm run deploy`. This step will deploy the Lootmart contract to your local network. The console will return the address of the Lootmart contract.

### Security Notes

* In order to improve gas efficiency, OZ's ERC1155.sol was patched to expose the `_balances`
mapping. We use that to do a batch mint inside `open`.
* Dom's original [LootComponents](https://twitter.com/dhof/status/1432403895008088064) was modified
to be cheaper to use, since it did a lot of redundant `SLOAD`s in hot code paths.

### Credits

Lootmart is a fork of [LootLoose](https://github.com/gakonst/lootloose). Credit to [@gakonst](https://twitter.com/gakonst) for that.

### Disclaimer

_These smart contracts are being provided as is. No guarantee, representation or warranty is being made, express or implied, as to the safety or correctness of the user interface or the smart contracts. They have not been audited and as such there can be no assurance they will work as intended, and users may experience delays, failures, errors, omissions, loss of transmitted information or loss of funds. Paradigm is not liable for any of the foregoing. Users should proceed with caution and use at their own risk._
