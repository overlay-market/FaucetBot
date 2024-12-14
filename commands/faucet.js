const { amount, infura, beraExplorerUrl, AMOUNT_ETH } = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
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
        const chain = 'bera';

        const reply = infura ?
            'Request sent. Please check the link to see if it\'s mined.'
            :
            'Request sent to Alchemy. Please check the link to see if it\'s mined.';

        await interaction.reply(reply);

        try {
            const amountEth = AMOUNT_ETH.bera;
            const request = await sendViaInfura(address, amount, amountEth, chain);

            if (request.status === 'success') {
                const tokenTransactionHash = request.message;
                const ethTransactionHash = request.messageEth;
                
                const tokenExplorerUrl = `${beraExplorerUrl}${tokenTransactionHash}`;
                const ethExplorerUrl = `${beraExplorerUrl}${ethTransactionHash}`;

                const embed = new MessageEmbed()
                    .setColor('#3BA55C')
                    .setDescription(
                        `Token Transaction: [View on Explorer](${tokenExplorerUrl})`
                    );

                const embedEth = new MessageEmbed()
                    .setColor('#3BA55C')
                    .setDescription(
                        `BERA Transaction: [View on Explorer](${ethExplorerUrl})`
                    );

                return interaction.followUp({ content: `Transaction for ${amount} OVL and ${amountEth} BERA created.`, embeds: [embed, embedEth] });
            } else {
                throw new Error(`Failed to send funds. Error: ${request.message}`);
            }
        } catch (error) {
            console.error(error);
            throw new Error(`An error occurred: ${error.message}`);
        }
    },
};