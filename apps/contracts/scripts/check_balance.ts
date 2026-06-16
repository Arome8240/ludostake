import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Deployer:', deployer.address);
  console.log('CELO balance:', ethers.formatEther(balance), 'CELO');
}

main().catch(console.error);
