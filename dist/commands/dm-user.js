"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dmUserCommand = void 0;
exports.handleDmUserCommand = handleDmUserCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
exports.dmUserCommand = new discord_js_1.SlashCommandBuilder()
    .setName('dmuser')
    .setDescription('Send a direct message to a user')
    .addUserOption((option) => option.setName('user')
    .setDescription('The user to DM')
    .setRequired(true))
    .addStringOption((option) => option.setName('message')
    .setDescription('The message to send')
    .setRequired(true));
async function handleDmUserCommand(interaction) {
    // Only allow bot owner to use this command
    if (interaction.user.id !== config_1.config.botOwnerId) {
        await interaction.reply({ content: 'Only the bot owner can use this command.', ephemeral: true });
        return;
    }
    const targetUser = interaction.options.getUser('user', true);
    const message = interaction.options.getString('message', true);
    await interaction.deferReply({ ephemeral: true });
    try {
        await targetUser.send(message);
        await interaction.editReply(`Message sent to ${targetUser.tag}.`);
    }
    catch (error) {
        logger_1.logger.error(`DM user failed: ${error.message}`);
        await interaction.editReply(`Failed to send message. The user may have DMs disabled or blocked the bot.`);
    }
}
