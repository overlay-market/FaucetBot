const { amount, amountEth, infura, arbiscanUrl, movementExplorerUrl } = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const sendViaAlchemy = require('../utils/sendViaAlchemy.js');
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
		const chain = interaction.options.get('chain').value.trim();

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
			let ethSign = '';

			if (chain === 'arb' || chain === 'move') {
				// Send the transaction and get the response
				request = await sendViaInfura(address, amount, amountEth, chain)

				if (request.status === 'success') {
					if (chain === 'move') {
						tokenTransactionHash = await getMoveHash(request.message);
						tokenExplorerUrl = `${movementExplorerUrl}${tokenTransactionHash}`;

						ethTransactionHash = await getMoveHash(request.messageEth);
						ethExplorerUrl = `${movementExplorerUrl}${ethTransactionHash}`;

						ethSign = 'MOVE';
					} else {
						tokenTransactionHash = request.message;
						tokenExplorerUrl = `${arbiscanUrl}${tokenTransactionHash}`;

						ethTransactionHash = request.messageEth;
						ethExplorerUrl = `${arbiscanUrl}${ethTransactionHash}`;

						ethSign = 'ETH';
					}
				}
			} else {
				return interaction.followUp('Unsupported chain specified.');
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
						`ETH Transaction: [View on Explorer](${ethExplorerUrl})`
					);

				return interaction.followUp({ content: `Transaction for ${amount} OVL and ${amountEth} ${ethSign} created.`, embeds: [embed, embedEth] });
			} else {
				return interaction.followUp(`Failed to send funds. Error: ${request.message}`);
			}
		} catch (error) {
			console.error(error);
			return interaction.followUp(`An error occurred: ${error.message}`);
		}
	},
};