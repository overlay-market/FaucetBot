const { amount, bnbExplorerUrl, AMOUNT_ETH } = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const sendViaInfura = require('../utils/sendViaInfura.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('faucet')
        .setDescription('Request BNB Testnet funds from the faucet')
        .addStringOption(option =>
            option.setName('address')
                .setDescription('The address to request funds from the faucet')
                .setRequired(true)),
    async execute(interaction) {
        const address = interaction.options.get('address').value.trim();

        const reply = 'Request sent. Please check the link to see if it\'s mined.';

        await interaction.reply(reply);

        try {
            const amountEth = AMOUNT_ETH.bnb || '0'; // Default if not set
            const request = await sendViaInfura(address, amount, amountEth);

            if (request.status === 'success') {
                const tokenTransactionHash = request.message;
                const ethTransactionHash = request.messageEth;
                
                const tokenExplorerUrl = `${bnbExplorerUrl}${tokenTransactionHash}`;
                
                // Create embeds array to hold all embeds
                const embeds = [];
                
                // Always add token transaction embed
                const tokenEmbed = new MessageEmbed()
                    .setColor('#3BA55C')
                    .setDescription(
                        `Token Transaction: [View on Explorer](${tokenExplorerUrl})`
                    );
                embeds.push(tokenEmbed);
                
                // Only add ETH transaction embed if AMOUNT_ETH is not 0
                let responseMessage = `Transaction for ${amount} OVL`;
                
                if (parseFloat(amountEth) > 0 && ethTransactionHash) {
                    const ethExplorerUrl = `${bnbExplorerUrl}${ethTransactionHash}`;
                    const embedEth = new MessageEmbed()
                        .setColor('#3BA55C')
                        .setDescription(
                            `BNB Transaction: [View on Explorer](${ethExplorerUrl})`
                        );
                    embeds.push(embedEth);
                    responseMessage += ` and ${amountEth} BNB`;
                }
                
                responseMessage += " created.";
                return interaction.followUp({ content: responseMessage, embeds: embeds });
            } else {
                throw new Error(`Failed to send funds. Error: ${request.message}`);
            }
        } catch (error) {
            console.error(error);
            throw new Error(`An error occurred: ${error.message}`);
        }
    },
};