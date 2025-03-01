const hre = require("hardhat");

async function main() {
  // Replace with your deployed contract address
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  const [owner, recipient] = await hre.ethers.getSigners();
  console.log("Testing with owner account:", owner.address);
  console.log("Testing with recipient account:", recipient.address);
  
  // Connect to the deployed contract
  const ProductTracker = await hre.ethers.getContractFactory("ProductTracker");
  const productTracker = await ProductTracker.attach(CONTRACT_ADDRESS);
  
  // ---------- TEST 1: Mint a product NFT with no expiry ----------
  console.log("\n1. Minting a product NFT with no expiry...");
  try {
    const mintTx1 = await productTracker.safeMint(
      owner.address, 
      "ipfs://QmExample1", 
      0 // No expiry
    );
    await mintTx1.wait();
    const tokenId1 = 0; // First token ID
    console.log(`✅ Minted token ID ${tokenId1} with no expiry`);
    
    // Check ownership
    const ownerOf1 = await productTracker.ownerOf(tokenId1);
    console.log(`✅ Owner of token ${tokenId1}: ${ownerOf1}`);
    
    // Check metadata
    const metadata = await productTracker.getProductMetadata(tokenId1);
    console.log(`✅ Metadata URI: ${metadata}`);
  } catch (error) {
    console.error("❌ Error in Test 1:", error.message);
  }
  
  // ---------- TEST 2: Mint a product NFT with expiry (1 hour from now) ----------
  console.log("\n2. Minting a product NFT with 1 hour expiry...");
  try {
    const oneHour = 60 * 60;
    const mintTx2 = await productTracker.safeMint(
      recipient.address, 
      "ipfs://QmExample2", 
      oneHour
    );
    await mintTx2.wait();
    const tokenId2 = 1; // Second token ID
    console.log(`✅ Minted token ID ${tokenId2} with 1 hour expiry`);
    
    // Check expiry
    const expiry = await productTracker.getExpiryTimestamp(tokenId2);
    console.log(`✅ Token ${tokenId2} expires at timestamp: ${expiry}`);
    
    const isExpired = await productTracker.isExpired(tokenId2);
    console.log(`✅ Token ${tokenId2} is expired: ${isExpired}`);
  } catch (error) {
    console.error("❌ Error in Test 2:", error.message);
  }
  
  // ---------- TEST 3: Transfer ownership of token 1 ----------
  console.log("\n3. Transferring token ownership...");
  try {
    const transferTx = await productTracker.transferProduct(recipient.address, 0);
    await transferTx.wait();
    const newOwner = await productTracker.ownerOf(0);
    console.log(`✅ New owner of token 0: ${newOwner}`);
  } catch (error) {
    console.error("❌ Error in Test 3:", error.message);
  }
  
  // ---------- TEST 4: Extend expiry ----------
  console.log("\n4. Extending expiry of token...");
  try {
    const recipientContract = productTracker.connect(recipient);
    const tokenId = 1;
    const oneDay = 60 * 60 * 24;
    
    const currentExpiry = await productTracker.getExpiryTimestamp(tokenId);
    console.log(`Current expiry for token ${tokenId}: ${currentExpiry}`);
    
    const extendTx = await recipientContract.extendExpiry(tokenId, oneDay);
    await extendTx.wait();
    
    const newExpiry = await productTracker.getExpiryTimestamp(tokenId);
    console.log(`✅ Token ${tokenId} new expiry: ${newExpiry}`);
    console.log(`✅ Extended by ${oneDay} seconds`);
  } catch (error) {
    console.error("❌ Error in Test 4:", error.message);
  }
  
  console.log("\nTests completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });