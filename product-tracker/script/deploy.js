const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const ProductTracker = await hre.ethers.getContractFactory("ProductTracker");
  const productTracker = await ProductTracker.deploy(deployer.address);

  await productTracker.waitForDeployment();
  
  const address = await productTracker.getAddress();
  console.log("ProductTracker deployed to:", address);
  console.log("Owner address:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });