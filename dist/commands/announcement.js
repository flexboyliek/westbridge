"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.announcementCommand = void 0;
exports.handleAnnouncementCommand = handleAnnouncementCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
exports.announcementCommand = new discord_js_1.SlashCommandBuilder()
    .setName('announcement')
    .setDescription('Send an announcement to the announcement channel')
    .addStringOption((option) => option.setName('title')
    .setDescription('The title of the announcement')
    .setRequired(true))
    .addStringOption((option) => option.setName('description')
    .setDescription('The main content of the announcement')
    .setRequired(true))
    .addStringOption((option) => option.setName('content')
    .setDescription('Additional content (like list of names)')
    .setRequired(false))
    .addBooleanOption((option) => option.setName('pingeveryone')
    .setDescription('Whether to ping @everyone')
    .setRequired(false));
async function handleAnnouncementCommand(interaction) {
    // Only allow bot owner to use this command
    if (interaction.user.id !== config_1.config.botOwnerId) {
        await interaction.reply({ content: 'Only the bot owner can use this command.', ephemeral: true });
        return;
    }
    const title = interaction.options.getString('title', true);
    const description = interaction.options.getString('description', true);
    const content = interaction.options.getString('content');
    const pingEveryone = interaction.options.getBoolean('pingeveryone') ?? false;
    if (!config_1.config.announcement.channelId) {
        await interaction.reply({ content: 'Announcement channel not configured.', ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        const announcementChannel = await interaction.client.channels.fetch(config_1.config.announcement.channelId);
        if (!announcementChannel || !announcementChannel.isTextBased() || announcementChannel.isDMBased()) {
            await interaction.editReply('Announcement channel not found or is not text-based.');
            return;
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor('#5865F2')
            .setTimestamp()
            .setFooter({ text: `Announced by ${interaction.user.tag}` });
        if (content) {
            embed.addFields({ name: 'Details', value: content });
        }
        const messageContent = pingEveryone ? '@everyone' : '';
        await announcementChannel.send({ content: messageContent, embeds: [embed] });
        await interaction.editReply('Announcement sent successfully.');
    }
    catch (error) {
        logger_1.logger.error(`Announcement failed: ${error.message}`);
        await interaction.editReply(`Error: ${error.message}`);
    }
}
