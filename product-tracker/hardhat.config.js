require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Optional: Add your private key and network API keys in a .env file
// Example: PRIVATE_KEY=your_private_key
// Example: INFURA_API_KEY=your_infura_api_key


module.exports = {
  solidity: "0.8.22",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
      // No need to specify accounts for localhost - it will use the default ones
    },
    sepolia: {
      url: process.env.INFURA_API_KEY ? 
        `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}` : "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};
