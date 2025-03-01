// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ProductTracker is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Mapping to store product metadata off-chain (IPFS URI)
    mapping(uint256 => string) private _productMetadata;

    // Mapping to store token expiry timestamps (0 means no expiry)
    mapping(uint256 => uint256) private _expiryTimestamps;

    // Event logs for tracking activity
    event ProductMinted(uint256 tokenId, address owner, string metadataURI, uint256 expiry);
    event OwnershipTransferred(uint256 tokenId, address from, address to);
    event TokenBurned(uint256 tokenId);
    event ExpiryExtended(uint256 tokenId, uint256 newExpiry);

    constructor(address initialOwner)
        ERC721("ProductToken", "PTK")
        Ownable(initialOwner)
    {}

    // Original mint function - only owner can call (useful for admin operations)
    function safeMint(address to, string memory uri, uint256 expiryDuration) 
        public 
        onlyOwner 
        returns (uint256) 
    {
        uint256 tokenId = _nextTokenId++; // Increment token ID
        _safeMint(to, tokenId); // Mint NFT to recipient
        _setTokenURI(tokenId, uri); // Store metadata URI
        _productMetadata[tokenId] = uri; // Store in mapping
        
        // Set expiry timestamp (0 means no expiry)
        if (expiryDuration > 0) {
            _expiryTimestamps[tokenId] = block.timestamp + expiryDuration;
        } else {
            _expiryTimestamps[tokenId] = 0; // No expiry
        }

        emit ProductMinted(tokenId, to, uri, _expiryTimestamps[tokenId]); // Emit event
        return tokenId;
    }

    // New public mint function - anyone can call this
    function publicMint(string memory uri, uint256 expiryDuration) 
        public 
        returns (uint256) 
    {
        // Mint to the sender's address
        uint256 tokenId = _nextTokenId++; // Increment token ID
        _safeMint(msg.sender, tokenId); // Mint NFT to the caller
        _setTokenURI(tokenId, uri); // Store metadata URI
        _productMetadata[tokenId] = uri; // Store in mapping
        
        // Set expiry timestamp (0 means no expiry)
        if (expiryDuration > 0) {
            _expiryTimestamps[tokenId] = block.timestamp + expiryDuration;
        } else {
            _expiryTimestamps[tokenId] = 0; // No expiry
        }

        emit ProductMinted(tokenId, msg.sender, uri, _expiryTimestamps[tokenId]); // Emit event
        return tokenId;
    }

    // Function to check if an NFT is expired (returns false if expiry is 0)
    function isExpired(uint256 tokenId) public view returns (bool) {
        return _expiryTimestamps[tokenId] > 0 && block.timestamp >= _expiryTimestamps[tokenId];
    }

    // Function to transfer ownership of the product (only if not expired)
    function transferProduct(address to, uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "You are not the owner");
        require(!isExpired(tokenId), "Token has expired and cannot be transferred");
        
        _transfer(msg.sender, to, tokenId);
        emit OwnershipTransferred(tokenId, msg.sender, to);
    }

    // Retrieve the metadata URI for a product (from IPFS)
    function getProductMetadata(uint256 tokenId) public view returns (string memory) {
        return _productMetadata[tokenId];
    }

    // Retrieve the expiry timestamp for a product (0 means no expiry)
    function getExpiryTimestamp(uint256 tokenId) public view returns (uint256) {
        return _expiryTimestamps[tokenId];
    }

    // Helper function to check if a token exists (replacement for _exists)
    function _tokenExists(uint256 tokenId) internal view returns (bool) {
        try this.ownerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }

    // 🔥 Burn function: allows only owner or contract owner to burn expired NFTs
    function burnExpired(uint256 tokenId) public {
        require(isExpired(tokenId), "Token is not expired");
        require(ownerOf(tokenId) == msg.sender || msg.sender == owner(), "Only token owner or contract owner can burn");

        _burn(tokenId);
        delete _productMetadata[tokenId]; // Remove metadata
        delete _expiryTimestamps[tokenId]; // Remove expiry data

        emit TokenBurned(tokenId);
    }

    // 🔄 Extend expiry: allows current owner to renew NFT before it expires
    function extendExpiry(uint256 tokenId, uint256 renewalPeriod) public {
        require(ownerOf(tokenId) == msg.sender, "Only token owner can extend expiry");
        require(!isExpired(tokenId), "Cannot extend an expired token");
        require(_expiryTimestamps[tokenId] > 0, "Token has no expiry");

        _expiryTimestamps[tokenId] += renewalPeriod;
        emit ExpiryExtended(tokenId, _expiryTimestamps[tokenId]);
    }

    function burnAllExpired() public onlyOwner {
        for (uint256 tokenId = 0; tokenId < _nextTokenId; tokenId++) {
            try this.ownerOf(tokenId) returns (address) {
                if (isExpired(tokenId)) {
                    _burn(tokenId);
                    delete _productMetadata[tokenId];
                    delete _expiryTimestamps[tokenId];

                    emit TokenBurned(tokenId);
                }
            } catch {
                // Skip tokens that don't exist
                continue;
            }
        }
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

