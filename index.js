const { Client, Collection, Intents } = require('discord.js');
const { token, approvedRoles, CHAIN_COOLDOWN } = require('./config.json');
const fs = require('fs');
const isAddress = require('./utils/address');
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] });

// Create Keyv instance for BNB chain
const keyv = new Keyv({
    store: new KeyvFile({
        filename: `keyv-data-bnb.json`, // File for BNB chain
    })
});

// Command and event handling
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    let address;
    const cooldown = CHAIN_COOLDOWN.bnb || 15000; // Default to 15 seconds if not set

    // Rate limiting and cooldowns for faucet requests
    if (command.data.name === 'faucet') {
        address = interaction.options.getString('address').trim();

        if (!isAddress(address)) {
            return interaction.reply('Please enter a valid Ethereum Address');
        }

        // Check if user has requested before
        if (!approvedRoles.some(role => interaction.member.roles.cache.has(role))) {
            const lastRequested = await keyv.get(interaction.user.id);
            if (lastRequested) {
                return interaction.reply(`You can only request funds once.`);
            }
        }

        // Check last transaction timestamp
        const lastTx = await keyv.get('lastTx');
        if (lastTx + cooldown > Date.now()) {
            const timeLeft = cooldown - (Date.now() - lastTx);
            return interaction.reply(`Please wait ${cooldown / 1000} seconds between requests to prevent nonce issues. Try again in ${timeLeft / 1000}s.`);
        }
    }

    try {
        if (command.data.name === 'faucet') {
            await keyv.set('lastTx', Date.now());
        }

        await command.execute(interaction);

        if (command.data.name === 'faucet') {
            if (!approvedRoles.some(role => interaction.member.roles.cache.has(role))) {
                await keyv.set(interaction.user.id, address);
            }
        }
    } catch (error) {
        console.error(error);
        await interaction.followUp({ content: error.message });
    }
});

client.login(token);