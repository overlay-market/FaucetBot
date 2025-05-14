/* eslint-disable no-inline-comments */
const { BNB_URL, PRIVATE_KEY, FROM_ADDRESS, CONTRACT_ADDRESSES } = require('../config.json');
const ethers = require('ethers');
const erc20Contract = require('./erc20Contract.js');

module.exports = async (toAddress, amountToken, amountEth) => {
    console.log(`Received new request from ${toAddress} for ${amountToken} BNB Test Token and ${amountEth} BNB on BNB Testnet`);

    if (!PRIVATE_KEY || !BNB_URL || !FROM_ADDRESS) {
        return { status: 'error', message: 'Missing environment variables, please check BNB_URL, PRIVATE_KEY, and FROM_ADDRESS in config.json.' };
    }

    const networkUrl = BNB_URL;
    const contractAddress = CONTRACT_ADDRESSES.bnb;
    
    const provider = new ethers.JsonRpcProvider(networkUrl);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    return new Promise(async (resolve) => {
        try {
            const block = await provider.getBlock("latest");
            const baseFeePerGas = block.baseFeePerGas || ethers.parseUnits('1', 'gwei');
            const maxPriorityFeePerGas = baseFeePerGas + ethers.parseUnits('2', 'gwei');
            const maxFeePerGas = baseFeePerGas + maxPriorityFeePerGas;
            let nonce = await wallet.getNonce('latest');

            const amountTokenInWei = ethers.parseEther(amountToken);
            const amountEthInWei = ethers.parseEther(amountEth);

            // Initialize the token contract
            const tokenContract = await erc20Contract(wallet, contractAddress);

            console.log("Nonce for BNB Test Token transaction: ", nonce);
            // Transfer BNB Test tokens
            const txToken = await tokenContract.transfer(toAddress, amountTokenInWei, {
                maxPriorityFeePerGas,
                maxFeePerGas,
                nonce
            });

            let txEth;
            if (amountEthInWei > 0n) {
                // Fetch the latest block to get the base fee and set the max fee
                nonce++;

                console.log("Nonce for BNB transaction: ", nonce);
                txEth = await wallet.sendTransaction({
                    to: toAddress,
                    value: amountEthInWei,
                    maxPriorityFeePerGas,
                    maxFeePerGas,
                    nonce
                });
            }

            resolve({
                status: 'success',
                message: txToken.hash ?? '',
                messageEth: txEth ? txEth.hash : ''
            });
        } catch (error) {
            console.error(error);
            resolve({ status: 'error', message: `Transaction failed: ${error.message}` });
        }
    });
};