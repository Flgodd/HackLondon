pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SerialNumberNFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    // Mapping from token ID to serial number
    mapping(uint256 => string) private _serialNumbers;
    
    // Mapping from serial number to token ID (for lookups)
    mapping(string => uint256) private _serialToTokenId;
    
    // Mapping from token ID to its ownership history
    mapping(uint256 => address[]) private _ownershipHistory;
    
    // Mapping from token ID to product details
    mapping(uint256 => ProductDetails) private _productDetails;
    
    // Product details struct
    struct ProductDetails {
        string name;
        string manufacturer;
        uint256 manufactureDate;
        string additionalInfo;
    }
    
    // Events
    event SerialNumberRegistered(uint256 indexed tokenId, string serialNumber, address owner);
    event OwnershipTransferred(uint256 indexed tokenId, string serialNumber, address from, address to, uint256 timestamp);
    
    constructor() ERC721("Serial Number Tracker", "SERIAL") {}
    
    /**
     * @dev Registers a new serial number as an NFT
     * @param recipient The address that will own the minted NFT
     * @param serialNumber The serial number of the physical item
     * @param tokenURI The URI pointing to the metadata for this NFT
     * @param name Product name
     * @param manufacturer Product manufacturer
     * @param manufactureDate Date of manufacture (unix timestamp)
     * @param additionalInfo Any other relevant product information
     * @return The ID of the newly minted NFT
     */
    function registerSerialNumber(
        address recipient, 
        string memory serialNumber, 
        string memory tokenURI,
        string memory name,
        string memory manufacturer,
        uint256 manufactureDate,
        string memory additionalInfo
    ) public returns (uint256) {
        require(_serialToTokenId[serialNumber] == 0, "Serial number already registered");
        
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);
        
        // Store serial number
        _serialNumbers[newItemId] = serialNumber;
        _serialToTokenId[serialNumber] = newItemId;
        
        // Store product details
        _productDetails[newItemId] = ProductDetails({
            name: name,
            manufacturer: manufacturer,
            manufactureDate: manufactureDate,
            additionalInfo: additionalInfo
        });
        
        // Initialize ownership history
        _ownershipHistory[newItemId].push(recipient);
        
        emit SerialNumberRegistered(newItemId, serialNumber, recipient);
        
        return newItemId;
    }
    
    /**
     * @dev Override the transferFrom function to record ownership history
     */
    function transferFrom(address from, address to, uint256 tokenId) public virtual override {
        super.transferFrom(from, to, tokenId);
        _ownershipHistory[tokenId].push(to);
        
        emit OwnershipTransferred(tokenId, _serialNumbers[tokenId], from, to, block.timestamp);
    }
    
    /**
     * @dev Override the safeTransferFrom function to record ownership history
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {
        super.safeTransferFrom(from, to, tokenId);
        _ownershipHistory[tokenId].push(to);
        
        emit OwnershipTransferred(tokenId, _serialNumbers[tokenId], from, to, block.timestamp);
    }
    
    /**
     * @dev Override the safeTransferFrom function with data to record ownership history
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public virtual override {
        super.safeTransferFrom(from, to, tokenId, data);
        _ownershipHistory[tokenId].push(to);
        
        emit OwnershipTransferred(tokenId, _serialNumbers[tokenId], from, to, block.timestamp);
    }
    
    /**
     * @dev Find a token ID by serial number
     * @param serialNumber The serial number to look up
     * @return The ID of the NFT associated with this serial number
     */
    function getTokenIdBySerial(string memory serialNumber) public view returns (uint256) {
        uint256 tokenId = _serialToTokenId[serialNumber];
        require(tokenId != 0, "Serial number not registered");
        return tokenId;
    }
    
    /**
     * @dev Get the serial number associated with a token
     * @param tokenId The ID of the NFT
     * @return The serial number
     */
    function getSerialNumber(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Query for nonexistent token");
        return _serialNumbers[tokenId];
    }
    
    /**
     * @dev Get the ownership history of a token
     * @param tokenId The ID of the NFT
     * @return Array of addresses representing the ownership history
     */
    function getOwnershipHistory(uint256 tokenId) public view returns (address[] memory) {
        require(_exists(tokenId), "Query for nonexistent token");
        return _ownershipHistory[tokenId];
    }
    
    /**
     * @dev Get the ownership history of an item by serial number
     * @param serialNumber The serial number to look up
     * @return Array of addresses representing the ownership history
     */
    function getOwnershipHistoryBySerial(string memory serialNumber) public view returns (address[] memory) {
        uint256 tokenId = getTokenIdBySerial(serialNumber);
        return getOwnershipHistory(tokenId);
    }
    
    /**
     * @dev Get product details by token ID
     * @param tokenId The ID of the NFT
     * @return Product details struct
     */
    function getProductDetails(uint256 tokenId) public view returns (ProductDetails memory) {
        require(_exists(tokenId), "Query for nonexistent token");
        return _productDetails[tokenId];
    }
    
    /**
     * @dev Get product details by serial number
     * @param serialNumber The serial number to look up
     * @return Product details struct
     */
    function getProductDetailsBySerial(string memory serialNumber) public view returns (ProductDetails memory) {
        uint256 tokenId = getTokenIdBySerial(serialNumber);
        return getProductDetails(tokenId);
    }
    
    /**
     * @dev Verify if a serial number is authentic and registered
     * @param serialNumber The serial number to verify
     * @return True if the serial number is registered
     */
    function verifySerialNumber(string memory serialNumber) public view returns (bool) {
        return _serialToTokenId[serialNumber] != 0;
    }
    
    /**
     * @dev Verify the current owner of a serial number
     * @param serialNumber The serial number to check
     * @return The current owner's address
     */
    function getCurrentOwnerBySerial(string memory serialNumber) public view returns (address) {
        uint256 tokenId = getTokenIdBySerial(serialNumber);
        return ownerOf(tokenId);
    }
}