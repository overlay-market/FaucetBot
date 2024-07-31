const { Client, Collection, Intents } = require('discord.js');
const { token, cooldown, approvedRoles } = require('./config.json');
const fs = require('fs');
const isAddress = require('./utils/address');
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] });

// Create Keyv instances for each supported chain
const keyvArb = new Keyv({
	store: new KeyvFile({
		filename: `keyv-data.json`, // File for Arbitrum Sepolia
	})
});

const keyvMove = new Keyv({
	store: new KeyvFile({
		filename: `keyv-data-move.json`, // File for Move chain
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

	let keyv;
	let address;

	// Rate limiting and cooldowns for faucet requests
	if (command.data.name === 'faucet') {
		address = interaction.options.getString('address').trim();
		const chain = interaction.options.getString('chain').toLowerCase();

		switch (chain) {
			case 'arb':
				keyv = keyvArb;
				break;
			case 'move':
				keyv = keyvMove;
				break;
			default:
				return interaction.reply('Unsupported chain specified. Use `arb` or `move`.');
		}

		if (!isAddress(address)) {
			return interaction.reply('Please enter a valid Ethereum Address');
		}

		// Check last transaction timestamp
		const lastTx = await keyv.get('lastTx');
		if (lastTx > Date.now() - 15000) {
			const timeLeft = 15000 - (Date.now() - lastTx);
			return interaction.reply(`Please wait 15 seconds between requests to prevent nonce issues. Try again in ${timeLeft / 1000}s.`);
		}

		// Check if user has requested before
		if (!approvedRoles.some(role => interaction.member.roles.cache.has(role))) {
			const lastRequested = await keyv.get(interaction.user.id);
			if (lastRequested) {
				return interaction.reply(`You can only request funds once.`);
			}
		}
	}

	try {
		await command.execute(interaction);

		if (command.data.name === 'faucet') {
			if (!approvedRoles.some(role => interaction.member.roles.cache.has(role))) {
				await keyv.set(interaction.user.id, address);
			}
			await keyv.set('lastTx', Date.now());
		}
	} catch (error) {
		console.error(error);
		await interaction.followUp({ content: error.message });
	}
});

client.login(token);
