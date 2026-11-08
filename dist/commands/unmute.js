"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unmuteCommand = void 0;
exports.handleUnmuteCommand = handleUnmuteCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const MODERATION_ROLE_ID = '1569089572028026900';
exports.unmuteCommand = new discord_js_1.SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a user in the server')
    .addUserOption((option) => option.setName('user')
    .setDescription('The user to unmute')
    .setRequired(true))
    .addStringOption((option) => option.setName('reason')
    .setDescription('Reason for the unmute')
    .setRequired(false))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers);
async function handleUnmuteCommand(interaction) {
    if (!interaction.member) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    const member = interaction.member;
    if (!member.roles.cache.has(MODERATION_ROLE_ID)) {
        await interaction.reply({ content: 'You must have the Westbridge Moderation role to use this command.', ephemeral: true });
        return;
    }
    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    if (!interaction.guild) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
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
            await interaction.editReply('I cannot unmute this user. They may have a higher role than me.');
            return;
        }
        await targetMember.timeout(null, `${reason} | Unmuted by ${interaction.user.tag}`);
        logger_1.logger.info(`User ${targetUser.tag} (${targetUser.id}) was unmuted by ${interaction.user.tag} (${interaction.user.id}) for: ${reason}`);
        await interaction.editReply(`Successfully unmuted ${targetUser.tag}. Reason: ${reason}`);
    }
    catch (error) {
        logger_1.logger.error(`Unmute command failed: ${error.message}`);
        await interaction.editReply(`Failed to unmute user: ${error.message}`);
    }
}
