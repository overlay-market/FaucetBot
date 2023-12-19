const { Client, Collection, Intents } = require('discord.js');
const { token, cooldown, approvedRoles } = require('./config.json');
const fs = require('fs');
const isAddress = require('./utils/address');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file')
const keyv = new Keyv({
	store: new KeyvFile({
	  filename: `keyv-data.json`, // the file path to store the data
	})
  })

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
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	// Rate limiting and cooldowns for faucet requests
	if (command.data.name === 'faucet') {
		const address = interaction.options.get('address').value.trim();

		if (!isAddress(address)) {
			return interaction.reply('Please enter a valid Ethereum Address');
		}

		// If the last transaction was less than 15 seconds ago, disallow to prevent nonce reuse (no concurrent transactions ATM)
		const lastTx = await keyv.get('lastTx');
		if (lastTx > Date.now() - 15000) {
			const timeLeft = 15000 - (Date.now() - lastTx);
			return interaction.reply(`Please wait 15 seconds between requests to prevent nonce issues. Try again in ${timeLeft / 1000}s.`);
		}

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
			// If not an approved role, set the last requested time
			if (!approvedRoles.some(role => interaction.member.roles.cache.has(role))) {
				await keyv.set(interaction.user.id, interaction.options.get('address').value.trim());
			}
			await keyv.set('lastTx', Date.now());
		}
	}
	catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(token);