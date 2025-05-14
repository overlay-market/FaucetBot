const { SlashCommandBuilder } = require('@discordjs/builders');
const { BNB_URL, FROM_ADDRESS, infura, CONTRACT_ADDRESSES, PRIVATE_KEY } = require('../config.json');
const ethers = require('ethers');
const erc20Contract = require('../utils/erc20Contract.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!, configured provider, faucet balance and donation address.'),
    async execute(interaction) {
        const response = 'Information was requested. Waiting for the response.'

        await interaction.reply(response);

        try {
            const provider = new ethers.JsonRpcProvider(BNB_URL);
            const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
            const tokenContract = await erc20Contract(wallet, CONTRACT_ADDRESSES.bnb);
            const fromAddress = ethers.getAddress(FROM_ADDRESS);

            const rawBalance = await provider.getBalance(fromAddress);
            const rawTokenBalance = await tokenContract.balanceOf(fromAddress);
            
            const balance = ethers.formatEther(rawBalance);
            const tokenBalance = ethers.formatEther(rawTokenBalance);

            const balanceShort = balance.toString().slice(0, balance.toString().indexOf('.') + 3);
            const balanceTokenShort = tokenBalance.toString().slice(0, tokenBalance.toString().indexOf('.') + 3);

            let responseMessage = 'Pong! Provider: ';
            responseMessage += infura ? 'Infura' : 'Alchemy';
            responseMessage += '\n';
            responseMessage += `Current balance on BNB Testnet: ${balanceShort} BNB. Current OVL balance: ${balanceTokenShort}.\n`;
            responseMessage += `Donate: ${FROM_ADDRESS}`;

            return interaction.followUp({ content: responseMessage });
        } catch (error) {
            console.error(error);
            return interaction.followUp({ content: 'Error getting balance for BNB Testnet. Please check logs.' });
        }
    },
};