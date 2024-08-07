const { amount, amountEth, infura, arbiscanUrl } = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const sendViaAlchemy = require('../utils/sendViaAlchemy.js');
const sendViaInfura = require('../utils/sendViaInfura.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('faucet')
		.setDescription('Request testnet funds from the faucet')
		.addStringOption(option =>
			option.setName('address')
				.setDescription('The address to request funds from the faucet')
				.setRequired(true)),
	async execute(interaction) {
		const address = interaction.options.get('address').value.trim();

		const reply = infura ?
			'Request sent to Infura. Please check the link to see if it\'s mined.'
			:
			// TODO: Change this to "Please wait for it to be mined" once Alchemy Notify is set up.
			'Request sent to Alchemy. Please check the link to see if it\'s mined.';

		await	interaction.reply(reply);

		const request = infura ? await sendViaInfura(address, amount, amountEth) : await sendViaAlchemy(address, amount);

		if (request.status === 'success') {
			const embed = new MessageEmbed()
				.setColor('#3BA55C')
				.setDescription(`[View on Arbiscan](${arbiscanUrl}${request.message})`);
			const embedEth = new MessageEmbed()
				.setColor('#3BA55C')
				.setDescription(`[View on Arbiscan](${arbiscanUrl}${request.messageEth})`);
			return interaction.followUp({ content: `Transaction for ${amount} OVL and ${amountEth} Eth created.`, embeds: [embed, embedEth] });
		}
		else {
			return interaction.followUp(`Failed to send funds. Error: ${request.message}`);
		}
	},
};