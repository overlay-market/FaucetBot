const { amount, infura, arbiscanUrl, movementExplorerUrl, AMOUNT_ETH } = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const sendViaInfura = require('../utils/sendViaInfura.js');
const getMoveHash = require('../utils/getMoveHash.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('faucet')
		.setDescription('Request testnet funds from the faucet')
		.addStringOption(option =>
			option.setName('chain')
				.setDescription('The chain to receive funds from ("arb" for Arbitrum Sepolia, "move" for Move Testnet)')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('address')
				.setDescription('The address to request funds from the faucet')
				.setRequired(true)),
	async execute(interaction) {
		const address = interaction.options.get('address').value.trim();
		const chain = interaction.options.get('chain').value.trim().toLowerCase();

		const reply = infura ?
			'Request sent to Infura. Please check the link to see if it\'s mined.'
			:
			// TODO: Change this to "Please wait for it to be mined" once Alchemy Notify is set up.
			'Request sent to Alchemy. Please check the link to see if it\'s mined.';

		await interaction.reply(reply);

		try {
			let request;
			let tokenTransactionHash = '';
			let ethTransactionHash = '';
			let tokenExplorerUrl = '';
			let ethExplorerUrl = '';
			let ethSymbol = '';
			let amountEth;

			if (chain === 'arb' || chain === 'move') {
				switch (chain) {
					case 'arb':
						amountEth = AMOUNT_ETH.arb;
						break;
					case 'move':
						amountEth = AMOUNT_ETH.move
						break;
				}
				// Send the transaction and get the response
				request = await sendViaInfura(address, amount, amountEth, chain)

				if (request.status === 'success') {
					if (chain === 'move') {
						tokenTransactionHash = await getMoveHash(request.message);
						tokenExplorerUrl = `${movementExplorerUrl}${tokenTransactionHash}`;

						ethTransactionHash = await getMoveHash(request.messageEth);
						ethExplorerUrl = `${movementExplorerUrl}${ethTransactionHash}`;

						ethSymbol = 'MOVE';
					} else {
						tokenTransactionHash = request.message;
						tokenExplorerUrl = `${arbiscanUrl}${tokenTransactionHash}`;

						ethTransactionHash = request.messageEth;
						ethExplorerUrl = `${arbiscanUrl}${ethTransactionHash}`;

						ethSymbol = 'ETH';
					}
				}
			} else {
				throw new Error('Unsupported chain specified. Use `arb` or `move`.');
			}

			if (request.status === 'success') {
				const embed = new MessageEmbed()
					.setColor('#3BA55C')
					.setDescription(
						`Token Transaction: [View on Explorer](${tokenExplorerUrl})`

					);

				const embedEth = new MessageEmbed()
					.setColor('#3BA55C')
					.setDescription(
						`${ethSymbol} Transaction: [View on Explorer](${ethExplorerUrl})`
					);

				return interaction.followUp({ content: `Transaction for ${amount} OVL and ${amountEth} ${ethSymbol} created.`, embeds: [embed, embedEth] });
			} else {
				throw new Error(`Failed to send funds. Error: ${request.message}`);
			}
		} catch (error) {
			console.error(error);
			throw new Error(`An error occurred: ${error.message}`);
		}
	},
};