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
		const focusedValue = interaction.options.getFocused();
		const query = interaction.options.getString('username');

		const dictResult = await request(`https://api.github.com/search/users?q=${query}&per_page=3`, {
			headers: { 'User-Agent': 'request' },
		});

		const list = await dictResult.body.json();
		try {
			const choices = (list.items).map(x => x.login);
			const filtered = choices.filter(choice => choice.startsWith(focusedValue));
			await interaction.respond(
				filtered.map(choice => ({ name: choice, value: choice })),
			);
		} catch {
			return;
		}

	},
	async execute(interaction) {
		const query = interaction.options.getString('username');
		const dictResult = await request(`https://api.github.com/users/${query}`, {
			headers: { 'User-Agent': 'request' },
		});

		const user = await dictResult.body.json();

		await interaction.reply(`username: ${user.login}\navatar: ${user.avatar_url}`);
	},
};
