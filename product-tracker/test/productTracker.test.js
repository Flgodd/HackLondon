const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProductTracker", function () {
    let productTracker, owner, addr1, addr2;

    before(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy the contract
        const ProductTrackerFactory = await ethers.getContractFactory("ProductTracker");
        productTracker = await ProductTrackerFactory.deploy(owner.address);
        await productTracker.waitForDeployment();
    });

    it("Should mint a new product NFT and set metadata", async function () {
        const uri = "ipfs://example_product_metadata";
        const tx = await productTracker.safeMint(addr1.address, uri);
        await tx.wait();

        // Check ownership
        expect(await productTracker.ownerOf(0)).to.equal(addr1.address);

        // Check metadata using tokenURI (instead of getProductMetadata)
        expect(await productTracker.tokenURI(0)).to.equal(uri);
    });

    it("Should transfer ownership of the product", async function () {
        const tx = await productTracker.connect(addr1).transferProduct(addr2.address, 0);
        await tx.wait();

        // Check new ownership
        expect(await productTracker.ownerOf(0)).to.equal(addr2.address);
    });

    it("Should not allow unauthorized transfers", async function () {
        await expect(
            productTracker.connect(addr1).transferProduct(owner.address, 0)
        ).to.be.revertedWith("You are not the owner");
    });
});
