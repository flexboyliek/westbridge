"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessageCommand = void 0;
exports.handleDeleteMessageCommand = handleDeleteMessageCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
exports.deleteMessageCommand = new discord_js_1.SlashCommandBuilder()
    .setName('deletemessage')
    .setDescription('Delete a specific message by ID')
    .addStringOption((option) => option.setName('messageid')
    .setDescription('The ID of the message to delete')
    .setRequired(true));
async function handleDeleteMessageCommand(interaction) {
    // Only allow bot owner to use this command
    if (interaction.user.id !== config_1.config.botOwnerId) {
        await interaction.reply({ content: 'Only the bot owner can use this command.', ephemeral: true });
        return;
    }
    const messageId = interaction.options.getString('messageid', true);
    await interaction.deferReply({ ephemeral: true });
    try {
        const channel = interaction.channel;
        if (!channel || !channel.isTextBased() || channel.isDMBased()) {
            await interaction.editReply('This command can only be used in text channels.');
            return;
        }
        const message = await channel.messages.fetch(messageId);
        if (!message) {
            await interaction.editReply('Message not found.');
            return;
        }
        await message.delete();
        await interaction.editReply('Message deleted successfully.');
    }
    catch (error) {
        logger_1.logger.error(`Delete message failed: ${error.message}`);
        await interaction.editReply(`Error: ${error.message}`);
    }
}
