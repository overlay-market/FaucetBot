const { SlashCommandBuilder } = require('@discordjs/builders');
const { ALCHEMY_URL, INFURA_URL, FROM_ADDRESS, infura, NETWORK } = require('../config.json');
const ethers = require('ethers');
const provider = new ethers.JsonRpcProvider(infura ? INFURA_URL : ALCHEMY_URL, NETWORK);
const erc20Contract = require('../utils/erc20Contract.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!, configured provider, faucet balance and donation address.'),
	async execute(interaction) {
		let balance;
		let tokenBalance;
		try {
			const tokenContract = await erc20Contract(provider)
			const fromAddress = ethers.getAddress(FROM_ADDRESS)
			const rawBalance = await provider.getBalance(fromAddress)
			const rawTokenBalance = await tokenContract.balanceOf(fromAddress)
			balance = ethers.formatEther(rawBalance);
			tokenBalance = ethers.formatEther(rawTokenBalance);
		}
		catch (e) {
			console.log(e);
			return interaction.reply('Error getting balance. Please check logs.');
		}

		const balanceShort = balance.toString().slice(0, balance.toString().indexOf('.') + 3);
		const balanceTokenShort = tokenBalance.toString().slice(0, tokenBalance.toString().indexOf('.') + 3);
		return interaction.reply(`Pong! Provider: ${infura ? 'Infura' : 'Alchemy'}. Current balance: ${balanceShort} ETH. Current ERC20 balance: ${balanceTokenShort} OVL. Please use /faucet to request funds.\nDonate: ${FROM_ADDRESS}`);
	},
};