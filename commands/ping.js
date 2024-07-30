const { SlashCommandBuilder } = require('@discordjs/builders');
const { INFURA_URL, FROM_ADDRESS, infura, CONTRACT_ADDRESSES, MOVE_URL, PRIVATE_KEY } = require('../config.json');
const ethers = require('ethers');
const erc20Contract = require('../utils/erc20Contract.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!, configured provider, faucet balance and donation address.'),
	async execute(interaction) {
		const networks = {
			arb: {
				contractAddress: CONTRACT_ADDRESSES.arb,
				provider: new ethers.JsonRpcProvider(INFURA_URL),
				symbol: 'ETH'
			},
			move: {
				contractAddress: CONTRACT_ADDRESSES.move,
				provider: new ethers.JsonRpcProvider(MOVE_URL),
				symbol: 'MOVE'
			}
		};

		let responseMessage = 'Pong! Provider: ';
		responseMessage += infura ? 'Infura' : 'Alchemy';
		responseMessage += '\n';

		for (const [chain, { provider, contractAddress, symbol }] of Object.entries(networks)) {
			let balance, tokenBalance;
			try {
				const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
				const tokenContract = await erc20Contract(wallet, contractAddress);
				const fromAddress = ethers.getAddress(FROM_ADDRESS);
				const rawBalance = await provider.getBalance(fromAddress);
				const rawTokenBalance = await tokenContract.balanceOf(fromAddress);
				balance = ethers.formatEther(rawBalance);
				tokenBalance = ethers.formatEther(rawTokenBalance);

				const balanceShort = balance.toString().slice(0, balance.toString().indexOf('.') + 3);
				const balanceTokenShort = tokenBalance.toString().slice(0, tokenBalance.toString().indexOf('.') + 3);

				responseMessage += `Current balance on ${chain.toUpperCase()}: ${balanceShort} ${symbol}. Current ERC20 balance: ${balanceTokenShort} OVL.\n`;
			} catch (e) {
				console.error(e);
				responseMessage += `Error getting balance for ${chain.toUpperCase()}. Please check logs.\n`;
			}
		}

		responseMessage += `Donate: ${FROM_ADDRESS}`;
		return interaction.reply(responseMessage);
	},
};
