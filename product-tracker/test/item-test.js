const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai");
const { ethers } = require("hardhat");

describe("Item", function () {

    async function deployItem() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const ProductTracker = await ethers.getContractFactory("ProductTracker");
        const item = await ProductTracker.deploy(owner.address);    
        await item.waitForDeployment();;
        const mintTx = await item.safeMint(owner.address, 'https://item-example/item-id-1.json');
        await mintTx.wait();
        return {item, owner, addr1, addr2};
    }
    it("Should mint a token", async function () {
        const {item, owner} = await loadFixture(deployItem);
        expect(await item.balanceOf(owner.address)).to.equal(1);
    });
    it("Should set owner", async function () {
        const {item, owner} = await loadFixture(deployItem);
        expect(await item.ownerOf(0)).to.equal(owner.address);
    });
    it("Should set tokenURI", async function () {
        const {item, owner} = await loadFixture(deployItem);
        expect(await item.tokenURI(0)).to.equal('https://item-example/item-id-1.json');
    });
    it("Should transfer token", async function () {
        const {item, owner, addr1} = await loadFixture(deployItem);
        const transferTx = await item.safeTransferFrom(owner.address, addr1.address, 0);
        await transferTx.wait();
        expect(await item.ownerOf(0)).to.equal(addr1.address);
    });
    it("Should not transfer token if not owner", async function () {
        const {item, owner, addr1} = await loadFixture(deployItem);
        await expect(item.connect(addr1).safeTransferFrom(owner.address, addr1.address, 0)).to.be.reverted;
    });

})