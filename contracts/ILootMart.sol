// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

// Any component stores need to have this function so that Adventurer can determine what
// type of item it is
interface ILootMart {
  function itemTypeFor(uint256 tokenId) external view returns (string memory);
}
