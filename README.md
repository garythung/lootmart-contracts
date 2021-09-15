# <h1 align="center"> LootMart </h1>

**Unbundle your Loot into components**

LootMart is an ERC-1155 contract that allows you to claim individual components from your Loot. Each ERC1155's token image points to a piece of art stored on IPFS.

Mint your components by calling `claimForLoot(uint256 tokenId)`, `claimAllForOwner()`, or `claimForTokenIds(uint256[] memory tokenIds)`.

## Building and testing

1. `npm i`
2. Set up a `.env` file with a `ALCHEMY_MAINNET_URL` which is an Alchemy node for [forking mainnet](https://hardhat.org/hardhat-network/guides/mainnet-forking.html).
3. `npx hardhat compile`
4. `npx hardhat node`
5. `npm run deploy`. This step will deploy the LootMart contract to your local network. The console will return the address of the LootMart contract.

### Security Notes

* In order to improve gas efficiency, OZ's ERC1155.sol was patched to expose the `_balances`
mapping. We use that to do a batch mint inside `open`.
* Dom's original [LootComponents](https://twitter.com/dhof/status/1432403895008088064) was modified
to be cheaper to use, since it did a lot of redundant `SLOAD`s in hot code paths.

### Credits

LootMart is a fork of [LootLoose](https://github.com/gakonst/lootloose). Credit to [@gakonst](https://twitter.com/gakonst) for that.

### Disclaimer

_These smart contracts are being provided as is. No guarantee, representation or warranty is being made, express or implied, as to the safety or correctness of the user interface or the smart contracts. They have not been audited and as such there can be no assurance they will work as intended, and users may experience delays, failures, errors, omissions, loss of transmitted information or loss of funds. Paradigm is not liable for any of the foregoing. Users should proceed with caution and use at their own risk._
