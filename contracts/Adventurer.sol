// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "./ERC998TopDown.sol";
import "./IERC998TopDown.sol";
import "./ILootMart.sol";
import "hardhat/console.sol";

interface IRegistry {
  function isValid721Contract(address _contract) external view returns (bool);
  function isValid1155Contract(address _contract) external view returns (bool);
  function isValidItemType(string memory _itemType) external view returns (bool);
}

contract Adventurer is ERC721Enumerable, ERC998TopDown, Ownable, ReentrancyGuard {
  using ERC165Checker for address;

  struct Item {
    address itemAddress;
    uint256 id;
  }

  // What does adventurer 1 have equipped?
  // equipped[token Id] = { "head": { itemAddress: "0xAbc", tokenId: 1 } }
  mapping(uint256 => mapping(string => Item)) public equipped;

  bytes4 internal constant ERC_721_INTERFACE = 0x80ac58cd;
  bytes4 internal constant ERC_1155_INTERFACE = 0xd9b67a26;

  IRegistry internal registry;

  constructor(address _registry) ERC998TopDown("Adventurer", "AVTR") {
    registry = IRegistry(_registry);
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable, ERC721) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  /**
   * @dev Ensure caller affecting an adventurer is authorized.
   */
  function requireAuthorized(address owner, address operator) internal view {
    require(
      owner == operator || isApprovedForAll(owner, operator),
      "ERC998: caller is not owner nor approved"
    );
  }

  // MINTING //

  function mint() external {
    _safeMint(_msgSender(), totalSupply());
  }

  function mintToAccount(address _account) external {
    _safeMint(_account, totalSupply());
  }

  // EQUIPPING/UNEQUIPPING //

  /**
   * @dev Execute a series of equips followed by a series of unequips.
   *
   * NOTE: This may be inefficient. Clients should reduce the changes down to the simplest set.
   * For example, imagine an Adventurer with a head equipped. Calling bulkChanges with a new
   * head to equip and a head unequip will result in the Adventurer having no head equipped.
   */
  function bulkChanges(uint256 tokenId, address[] memory equipItemAddresses, uint256[] memory equipItemIds, string[] memory unequipItemTypes) external {
    address operator = _msgSender();
    address owner = ownerOf(tokenId);
    requireAuthorized(owner, operator);

    // Execute equips
    for (uint256 i = 0; i < equipItemAddresses.length; i++) {
      // this will trigger onERC[721|1155]Received
      _transferItemIn(tokenId, operator, equipItemAddresses[i], equipItemIds[i]);
    }

    // Execute unequips
    for (uint256 i = 0; i < unequipItemTypes.length; i++) {
      _unequip(tokenId, unequipItemTypes[i]);
    }
  }

  /**
   * @dev Equip an item.
   *
   * NOTE: Authorization is not checked here. It's handled in the receiver callback.
   */
  function equip(uint256 tokenId, address itemAddress, uint256 itemId) external {
    address operator = _msgSender();

    // this will trigger onERC[721|1155]Received
    _transferItemIn(tokenId, operator, itemAddress, itemId);
  }

  /**
   * @dev Equip a list of items.
   *
   * NOTE: Authorization is not checked here. It's handled in the receiver callback.
   */
  function equipBulk(uint256 tokenId, address[] memory itemAddresses, uint256[] memory itemIds) external {
    address operator = _msgSender();

    for (uint256 i = 0; i < itemAddresses.length; i++) {
      // this will trigger onERC[721|1155]Received
      _transferItemIn(tokenId, operator, itemAddresses[i], itemIds[i]);
    }
  }

  /**
   * @dev Unequip an item.
   */
  function unequip(uint256 tokenId, string memory itemType) external {
    address operator = _msgSender();
    address owner = ownerOf(tokenId);
    requireAuthorized(owner, operator);

    _unequip(tokenId, itemType);
  }

  /**
   * @dev Unequip a list of items.
   */
  function unequipBulk(uint256 tokenId, string[] memory itemTypes) external {
    address operator = _msgSender();
    address owner = ownerOf(tokenId);
    requireAuthorized(owner, operator);

    for (uint256 i = 0; i < itemTypes.length; i++) {
      _unequip(tokenId, itemTypes[i]);
    }
  }

  // LOGIC //

  /**
   * @dev Execute transfer from component contract to this contract.
   */
  function _transferItemIn(uint256 _tokenId, address _operator, address _itemAddress, uint256 _itemId) internal {
    if (_itemAddress.supportsInterface(ERC_721_INTERFACE)) {
      IERC721(_itemAddress).safeTransferFrom(_operator, address(this), _itemId, toBytes(_tokenId));
    } else if (_itemAddress.supportsInterface(ERC_1155_INTERFACE)) {
      IERC1155(_itemAddress).safeTransferFrom(_operator, address(this), _itemId, 1, toBytes(_tokenId));
    } else {
      require(false, "Item does not support ERC-721 or ERC-1155");
    }
  }

  /**
   * @dev Execute transfer of a child out.
   */
  function _transferItemOut(uint256 _tokenId, address _owner, address _itemAddress, uint256 _itemId) internal {
    if (child721Balance(_tokenId, _itemAddress, _itemId) == 1) {
      safeTransferChild721From(_tokenId, _owner, _itemAddress, _itemId, "");
    } else if (child1155Balance(_tokenId, _itemAddress, _itemId) >= 1) {
      safeTransferChild1155From(_tokenId, _owner, _itemAddress, _itemId, 1, "");
    }
  }

  /**
   * @dev This marks a new item as equipped. This will send back whatever is currently equipped.
   * It does not handle the transferring the new item in.
   */
  function _equip(uint256 tokenId, address itemAddress, uint256 itemId) internal {
    string memory itemType = ILootMart(itemAddress).itemTypeFor(itemId);
    require(registry.isValidItemType(itemType), "Invalid item type");

    // Get current item
    Item memory item = equipped[tokenId][itemType];
    address currentItemAddress = item.itemAddress;
    uint256 currentItemId = item.id;

    // Equip the new item
    equipped[tokenId][itemType] = Item({ itemAddress: itemAddress, id: itemId });

    // Send back old item
    if (currentItemAddress != address(0)) {
      _transferItemOut(tokenId, ownerOf(tokenId), currentItemAddress, currentItemId);
    }
  }

  /**
   * @dev Logic for unequipping an item. Will mark the slot as unequipped and send back
   * what's currently equipped.
   */
  function _unequip(uint256 tokenId, string memory itemType) internal {
    // Get current item
    Item memory item = equipped[tokenId][itemType];
    address currentItemAddress = item.itemAddress;
    uint256 currentItemId = item.id;

    // Mark item unequipped
    delete equipped[tokenId][itemType];

    // Send back old item
    _transferItemOut(tokenId, ownerOf(tokenId), currentItemAddress, currentItemId);
  }

  // CALLBACKS //

  /**
   * @dev Handle equipping new items. Updates underlying structure of 998.
   */
  function onERC721Received(address operator, address from, uint256 id, bytes memory data) public override returns (bytes4) {
    require(registry.isValid721Contract(msg.sender), "Registry: item contract must be in the registry");
    require(data.length == 32, "ERC998: data must contain the unique uint256 tokenId to transfer the child token to");

    uint256 _receiverTokenId;
    uint256 _index = msg.data.length - 32;
    assembly {_receiverTokenId := calldataload(_index)}

    // Sender of item to Adventurer must be authorized
    address owner = ownerOf(_receiverTokenId);
    requireAuthorized(owner, operator);

    _equip(_receiverTokenId, msg.sender, id);
    _receiveChild721(_receiverTokenId, msg.sender, id);
    emit ReceivedChild721(from, _receiverTokenId, msg.sender, id);

    return IERC721Receiver.onERC721Received.selector;
  }

  /**
   * @dev Handle equipping new items. Updates underlying structure of 998.
   */
  function onERC1155Received(address operator, address from, uint256 id, uint256 amount, bytes memory data) public override returns (bytes4) {
    require(registry.isValid1155Contract(msg.sender), "Registry: item contract must be in the registry");
    require(data.length == 32, "ERC998: data must contain the unique uint256 tokenId to transfer the child token to");

    uint256 _receiverTokenId;
    uint256 _index = msg.data.length - 32;
    assembly {_receiverTokenId := calldataload(_index)}

    // Sender of item to Adventurer must be authorized
    address owner = ownerOf(_receiverTokenId);
    requireAuthorized(owner, operator);

    _equip(_receiverTokenId, msg.sender, id);
    _receiveChild1155(_receiverTokenId, msg.sender, id, amount);
    emit ReceivedChild1155(from, _receiverTokenId, msg.sender, id, amount);

    return IERC1155Receiver.onERC1155Received.selector;
  }

  /**
   * @dev Handle equipping new items. Updates underlying structure of 998.
   */
  function onERC1155BatchReceived(address operator, address from, uint256[] memory ids, uint256[] memory values, bytes memory data) public override returns (bytes4) {
    require(registry.isValid1155Contract(msg.sender), "Registry: item contract must be in the registry");
    require(data.length == 32, "ERC998: data must contain the unique uint256 tokenId to transfer the child token to");
    require(ids.length == values.length, "ERC1155: ids and values length mismatch");

    uint256 _receiverTokenId;
    uint256 _index = msg.data.length - 32;
    assembly {_receiverTokenId := calldataload(_index)}

    // Sender of item to Adventurer must be authorized
    address owner = ownerOf(_receiverTokenId);
    requireAuthorized(owner, operator);

    for (uint256 i = 0; i < ids.length; i++) {
      _equip(_receiverTokenId, msg.sender, ids[i]);
      _receiveChild1155(_receiverTokenId, msg.sender, ids[i], values[i]);
      emit ReceivedChild1155(from, _receiverTokenId, msg.sender, ids[i], values[i]);
    }

    return IERC1155Receiver.onERC1155BatchReceived.selector;
  }

  function _beforeChild721Transfer(
    address operator,
    uint256 fromTokenId,
    address to,
    address childContract,
    uint256[] memory ids,
    bytes memory data
  ) internal override virtual {

  }

  function _beforeChild1155Transfer(
      address operator,
      uint256 fromTokenId,
      address to,
      address childContract,
      uint256[] memory ids,
      uint256[] memory amounts,
      bytes memory data
  ) internal override virtual {

  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenId);
  }

  // HELPERS //

  /**
   * @dev Convert uint to bytes.
   */
  function toBytes(uint256 x) internal pure returns (bytes memory b) {
    b = new bytes(32);
    assembly { mstore(add(b, 32), x) }
  }
}
