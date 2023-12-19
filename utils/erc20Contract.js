const { ALCHEMY_URL, INFURA_URL, FROM_ADDRESS, infura, NETWORK, tokenAddress } = require('../config.json');
const ethers = require('ethers');

module.exports = async (provider) => {
	const abi = [
        // Read-Only Functions
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)",
    
        // Authenticated Functions
        "function transfer(address to, uint amount) returns (bool)",
    
        // Events
        "event Transfer(address indexed from, address indexed to, uint amount)"
    ];
    return new ethers.Contract(tokenAddress, abi, provider)
}