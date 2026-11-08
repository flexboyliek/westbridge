"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unbanCommand = void 0;
exports.handleUnbanCommand = handleUnbanCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const MODERATION_ROLE_ID = '1569089572028026900';
exports.unbanCommand = new discord_js_1.SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server')
    .addStringOption((option) => option.setName('user_id')
    .setDescription('The user ID to unban')
    .setRequired(true))
    .addStringOption((option) => option.setName('reason')
    .setDescription('Reason for the unban')
    .setRequired(false))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.BanMembers);
async function handleUnbanCommand(interaction) {
    if (!interaction.member) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    const member = interaction.member;
    if (!member.roles.cache.has(MODERATION_ROLE_ID)) {
        await interaction.reply({ content: 'You must have the Westbridge Moderation role to use this command.', ephemeral: true });
        return;
    }
    const userId = interaction.options.getString('user_id', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    if (!interaction.guild) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    try {
        await interaction.deferReply({ ephemeral: true });
        const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
        if (!ban) {
            await interaction.editReply('This user is not banned.');
            return;
        }
        await interaction.guild.bans.remove(userId, `${reason} | Unbanned by ${interaction.user.tag}`);
        logger_1.logger.info(`User ${userId} was unbanned by ${interaction.user.tag} (${interaction.user.id}) for: ${reason}`);
        await interaction.editReply(`Successfully unbanned user ${userId}. Reason: ${reason}`);
    }
    catch (error) {
        logger_1.logger.error(`Unban command failed: ${error.message}`);
        await interaction.editReply(`Failed to unban user: ${error.message}`);
    }
}
