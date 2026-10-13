"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearApplicationsCommand = void 0;
exports.handleClearApplicationsCommand = handleClearApplicationsCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
exports.clearApplicationsCommand = new discord_js_1.SlashCommandBuilder()
    .setName('clearapplications')
    .setDescription('Delete all bot messages from the pending channel');
async function handleClearApplicationsCommand(interaction) {
    // Only allow bot owner to use this command
    if (interaction.user.id !== config_1.config.botOwnerId) {
        await interaction.reply({ content: 'Only the bot owner can use this command.', ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        const pendingChannel = await interaction.client.channels.fetch(config_1.config.staff.pendingChannelId);
        if (!pendingChannel || !pendingChannel.isTextBased() || pendingChannel.isDMBased()) {
            await interaction.editReply('Pending channel not found or is not text-based.');
            return;
        }
        await interaction.editReply('Fetching messages...');
        const messages = await pendingChannel.messages.fetch();
        const botMessages = messages.filter((m) => m.author.id === interaction.client.user?.id);
        if (botMessages.size === 0) {
            await interaction.editReply('No bot messages found in the channel.');
            return;
        }
        await interaction.editReply(`Deleting ${botMessages.size} messages...`);
        let deleted = 0;
        for (const message of botMessages.values()) {
            await message.delete();
            deleted++;
        }
        await interaction.editReply(`Deleted ${deleted} bot messages from the channel.`);
    }
    catch (error) {
        logger_1.logger.error(`Clear applications failed: ${error.message}`);
        await interaction.editReply(`Error: ${error.message}`);
    }
}
