const ethers = require('ethers');

module.exports = async (wallet, contractAddress) => {
  const abi = [
    // Authenticated Functions
    "function distributeTokensAndEth(address recipient, uint256 tokenAmount, uint256 ethAmount)",
  ];

  return new ethers.Contract(contractAddress, abi, wallet);
};
