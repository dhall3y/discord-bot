const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { request } = require('undici');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('github')
		.setDescription('provide information about the github user.')
		.addStringOption(option =>
			option.setName('username')
				.setDescription('github username that you want info on')
				.setRequired(true)
				.setAutocomplete(true)),
	async autocomplete(interaction) {
		const query = interaction.options.getFocused();

		if (!query) {
			interaction.respond();
			return;
		}
		const dictResult = await request(`https://api.github.com/search/users?q=${query}&per_page=100`, {
			headers: { 'User-Agent': 'request' },
		});

		const list = await dictResult.body.json();
		try {
			// take json and order logins from user query
			const filtered = (list.items).filter(choice => choice.login.startsWith(query));
			// send first 3 user login
			await interaction.respond(
				filtered.slice(0, 3).map(choice => ({ name: choice.login, value: choice.login })),
			);
		}
		catch (error) {
			console.error(error);
		}

	},
	async execute(interaction) {
		const query = interaction.options.getString('username');
		const dictResult = await request(`https://api.github.com/users/${query}`, {
			headers: { 'User-Agent': 'request' },
		});

		const eventRes = await request(`https://api.github.com/users/${query}/events?per_page=1`, {
			headers: { 'User-Agent': 'request' },
		});

		const lastEvent = await eventRes.body.json();
		const user = await dictResult.body.json();

		const embedResponse = new EmbedBuilder()
			.setAuthor({ name: '🟢  last activity: today', url: user.html_url })
			.setThumbnail(user.avatar_url)
			.setTitle(user.name)
			.setDescription(user.bio);

		if (user.name == null) {
			embedResponse.setTitle(user.login);
		}

		if (typeof lastEvent[0] === 'undefined') {
			embedResponse.setAuthor({ name: '🟢 last activity: +90 days', url: user.html_url });
			await interaction.reply({ embeds: [embedResponse] });
		}

		const lastEventLocalTime = new Date(lastEvent[0].created_at).toDateString().split(' ').slice(1).join(' ');
		const today = new Date().toDateString().split(' ').slice(1).join(' ');

		if (today !== lastEventLocalTime) {
			embedResponse.setAuthor({ name: `🟢  last activity: ${lastEventLocalTime}`, url: user.html_url });
		}

		await interaction.reply({ embeds: [embedResponse] });
	},
};
