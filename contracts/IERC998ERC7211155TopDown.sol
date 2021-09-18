// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

interface IERC998ERC7211155TopDown is IERC721, IERC721Receiver, IERC1155Receiver {
    event ReceivedChild721(address indexed from, uint256 indexed toTokenId, address indexed childContract, uint256 childTokenId);
    event TransferChild721(uint256 indexed fromTokenId, address indexed to, address indexed childContract, uint256 childTokenId);

    event ReceivedChild1155(address indexed from, uint256 indexed toTokenId, address indexed childContract, uint256 childTokenId, uint256 amount);
    event TransferSingleChild1155(uint256 indexed fromTokenId, address indexed to, address indexed childContract, uint256 childTokenId, uint256 amount);
    event TransferBatchChild1155(uint256 indexed fromTokenId, address indexed to, address indexed childContract, uint256[] childTokenIds, uint256[] amounts);

    function child721ContractsFor(uint256 tokenId) external view returns (address[] memory childContracts);
    function child721IdsForOn(uint256 tokenId, address childContract) external view returns (uint256[] memory childIds);
    function child721Balance(uint256 tokenId, address childContract, uint256 childTokenId) external view returns(uint256);

    function childContractsFor(uint256 tokenId) external view returns (address[] memory childContracts);
    function childIdsForOn(uint256 tokenId, address childContract) external view returns (uint256[] memory childIds);
    function childBalance(uint256 tokenId, address childContract, uint256 childTokenId) external view returns(uint256);

    function safeTransferChild721From(uint256 fromTokenId, address to, address childContract, uint256 childTokenId, bytes calldata data) external;

    function safeTransferChild1155From(uint256 fromTokenId, address to, address childContract, uint256 childTokenId, uint256 amount, bytes calldata data) external;
    function safeBatchTransferChild1155From(uint256 fromTokenId, address to, address childContract, uint256[] calldata childTokenIds, uint256[] calldata amounts, bytes calldata data) external;
}
