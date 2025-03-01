// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ProductTracker is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Event logs for tracking activity
    event ProductMinted(uint256 tokenId, address owner, string metadataURI);
    event OwnershipTransferred(uint256 tokenId, address from, address to);

    constructor(address initialOwner)
        ERC721("ProductToken", "PTK")
        Ownable(initialOwner)
    {}

    // Function to mint an NFT representing a product
    function safeMint(address to, string memory uri) 
        public 
        onlyOwner 
        returns (uint256) 
    {
        uint256 tokenId = _nextTokenId++; // Increment token ID
        _safeMint(to, tokenId); // Mint NFT to recipient
        _setTokenURI(tokenId, uri); // Store metadata URI

        emit ProductMinted(tokenId, to, uri); // Emit event for transparency
        return tokenId;
    }

    // Function to transfer ownership of the product
    function transferProduct(address to, uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "You are not the owner");
        _transfer(msg.sender, to, tokenId);
        
        emit OwnershipTransferred(tokenId, msg.sender, to); // Emit event
    }

    // Overrides required by Solidity for ERC721URIStorage
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
