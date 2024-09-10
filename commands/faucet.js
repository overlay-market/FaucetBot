const { amount, infura, arbiscanUrl, movementExplorerUrl, beraExplorerUrl, AMOUNT_ETH } = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const sendViaInfura = require('../utils/sendViaInfura.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('faucet')
		.setDescription('Request testnet funds from the faucet')
		.addStringOption(option =>
			option.setName('chain')
				.setDescription('The chain to receive funds from ("arb" Arbitrum Sepolia, "move" Move Testnet, "bera" Bartio Testnet)')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('address')
				.setDescription('The address to request funds from the faucet')
				.setRequired(true)),
	async execute(interaction) {
		const address = interaction.options.get('address').value.trim();
		const chain = interaction.options.get('chain').value.trim().toLowerCase();

		const reply = infura ?
			'Request sent. Please check the link to see if it\'s mined.'
			:
			// TODO: Change this to "Please wait for it to be mined" once Alchemy Notify is set up.
			'Request sent to Alchemy. Please check the link to see if it\'s mined.';

		await interaction.reply(reply);

		try {
			let request;
			let tokenExplorerUrl = '';
			let ethExplorerUrl = '';
			let ethSymbol = '';
			let amountEth;

			if (chain === 'arb' || chain === 'move' || chain === 'bera') {
				switch (chain) {
					case 'arb':
						amountEth = AMOUNT_ETH.arb;
						break;
					case 'move':
						amountEth = AMOUNT_ETH.move
						break;
					case 'bera':
						amountEth = AMOUNT_ETH.bera
						break;
				}
				// Send the transaction and get the response
				request = await sendViaInfura(address, amount, amountEth, chain)

				const tokenTransactionHash = request.message;
				const ethTransactionHash = request.messageEth;

				if (request.status === 'success') {
					if (chain === 'move') {
						tokenExplorerUrl = `${movementExplorerUrl}${tokenTransactionHash}`;
						ethExplorerUrl = `${movementExplorerUrl}${ethTransactionHash}`;

						ethSymbol = 'MOVE';
					} else if (chain === 'bera') {
						tokenExplorerUrl = `${beraExplorerUrl}${tokenTransactionHash}`;
						ethExplorerUrl = `${beraExplorerUrl}${ethTransactionHash}`;

						ethSymbol = 'BERA';
					} else {
						tokenExplorerUrl = `${arbiscanUrl}${tokenTransactionHash}`;
						ethExplorerUrl = `${arbiscanUrl}${ethTransactionHash}`;

						ethSymbol = 'ETH';
					}
				}
			} else {
				throw new Error('Unsupported chain specified. Use `arb`, `move`, or `bera`.');
			}

			if (request.status === 'success') {
				if (chain === 'move') {
					const embed = new MessageEmbed()
						.setColor('#3BA55C')
						.setDescription(
							`Transaction: [View on Explorer](${tokenExplorerUrl})`

						);

					return interaction.followUp({ content: `Transaction for ${amount} OVL and ${amountEth} ${ethSymbol} created.`, embeds: [embed] });
				} else {
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
				}
			} else {
				throw new Error(`Failed to send funds. Error: ${request.message}`);
			}
		} catch (error) {
			console.error(error);
			throw new Error(`An error occurred: ${error.message}`);
		}
	},
};