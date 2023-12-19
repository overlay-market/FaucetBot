/* eslint-disable no-inline-comments */
const { INFURA_URL, PRIVATE_KEY, FROM_ADDRESS, maxFeePerGas: MAX_GAS, NETWORK } = require('../config.json');
const axios = require('axios');
const ethers = require('ethers');
const { default: Common, Chain, Hardfork } = require('@ethereumjs/common')
const { FeeMarketEIP1559Transaction } = require('@ethereumjs/tx');
const common = Common.custom({ chain: NETWORK, hardfork: Hardfork.London })
const erc20Contract = require('../utils/erc20Contract.js');

const provider = new ethers.JsonRpcProvider(INFURA_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

module.exports = async (toAddress, amount) => {
	console.log('Received new request from ', toAddress, 'for', amount)
	if (!PRIVATE_KEY || !FROM_ADDRESS || !INFURA_URL) {
		return { status: 'error', message: 'Missing environment variables, please ask human to set them up.' };
	}
	// eslint-disable-next-line no-async-promise-executor
	return new Promise(async (resolve, reject) => {
		const tokenContract = await erc20Contract(wallet)
		const balance = ethers.formatEther(await provider.getBalance(FROM_ADDRESS));
		const amountInWei = ethers.parseEther(amount);

		try {
			tx = await tokenContract.transfer(toAddress, amountInWei)
			console.log({tx})
			resolve({ status: 'success', message: tx.hash ?? '' });
		}
		catch (error) {
			console.log(error);
			return { status: 'error', message: 'Unable to make call to infura node. Please check logs.' };
		}
	})
}