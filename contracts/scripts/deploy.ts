import { ethers } from "hardhat";

async function main() {
  const MyERC20 = await ethers.getContractFactory("MyERC20");
  const myERC20 = await MyERC20.deploy();
  await myERC20.deployed();
  const BuyMyRoom = await ethers.getContractFactory("BuyMyRoom");
  const buyMyRoom = await BuyMyRoom.deploy(myERC20.address, 100);
  await buyMyRoom.deployed();
  const Trade = await ethers.getContractFactory("Trade");
  const trade = await Trade.deploy(myERC20.address);
  await trade.deployed();


  console.log(`BuyMyRoom deployed to ${buyMyRoom.address}`);
  console.log(`Points deployed to ${myERC20.address}`);
  console.log(`Trade deployed to ${trade.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});