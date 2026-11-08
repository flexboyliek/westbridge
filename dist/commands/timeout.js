"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeoutCommand = void 0;
exports.handleTimeoutCommand = handleTimeoutCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
exports.timeoutCommand = new discord_js_1.SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user for a specified duration')
    .addUserOption((option) => option.setName('user')
    .setDescription('The user to timeout')
    .setRequired(true))
    .addStringOption((option) => option.setName('duration')
    .setDescription('Duration (e.g., 10m, 1h, 1d)')
    .setRequired(true))
    .addStringOption((option) => option.setName('reason')
    .setDescription('Reason for the timeout')
    .setRequired(false));
async function handleTimeoutCommand(interaction) {
    if (!interaction.member) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    const member = interaction.member;
    if (!member.roles.cache.has(config_1.config.moderation.roleId)) {
        await interaction.reply({ content: 'You must have the Westbridge Moderation role to use this command.', ephemeral: true });
        return;
    }
    const targetUser = interaction.options.getUser('user', true);
    const durationStr = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    if (!interaction.guild) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    if (targetUser.id === interaction.client.user?.id) {
        await interaction.reply({ content: 'I cannot timeout myself.', ephemeral: true });
        return;
    }
    if (targetUser.id === interaction.user.id) {
        await interaction.reply({ content: 'You cannot timeout yourself.', ephemeral: true });
        return;
    }
    const durationMap = {
        's': 1000,
        'm': 60000,
        'h': 3600000,
        'd': 86400000,
    };
    const match = durationStr.match(/^(\d+)([smhd])$/i);
    if (!match) {
        await interaction.reply({ content: 'Invalid duration format. Use format like: 10m, 1h, 1d', ephemeral: true });
        return;
    }
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const durationMs = amount * durationMap[unit];
    if (durationMs > 28 * 24 * 60 * 60 * 1000) {
        await interaction.reply({ content: 'Duration cannot exceed 28 days.', ephemeral: true });
        return;
    }
    try {
        await interaction.deferReply({ ephemeral: true });
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            await interaction.editReply('This user is not in the server.');
            return;
        }
        if (!targetMember.moderatable) {
            await interaction.editReply('I cannot timeout this user. They may have a higher role than me.');
            return;
        }
        await targetMember.timeout(durationMs, `${reason} | Timed out by ${interaction.user.tag}`);
        logger_1.logger.info(`User ${targetUser.tag} (${targetUser.id}) was timed out by ${interaction.user.tag} (${interaction.user.id}) for ${durationStr}: ${reason}`);
        await interaction.editReply(`Successfully timed out ${targetUser.tag} for ${durationStr}. Reason: ${reason}`);
    }
    catch (error) {
        logger_1.logger.error(`Timeout command failed: ${error.message}`);
        await interaction.editReply(`Failed to timeout user: ${error.message}`);
    }
}
