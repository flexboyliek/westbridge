"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kickCommand = void 0;
exports.handleKickCommand = handleKickCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const MODERATION_ROLE_ID = '1569089572028026900';
exports.kickCommand = new discord_js_1.SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption((option) => option.setName('user')
    .setDescription('The user to kick')
    .setRequired(true))
    .addStringOption((option) => option.setName('reason')
    .setDescription('Reason for the kick')
    .setRequired(false))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.KickMembers);
async function handleKickCommand(interaction) {
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
    if (targetUser.id === interaction.client.user?.id) {
        await interaction.reply({ content: 'I cannot kick myself.', ephemeral: true });
        return;
    }
    if (targetUser.id === interaction.user.id) {
        await interaction.reply({ content: 'You cannot kick yourself.', ephemeral: true });
        return;
    }
    try {
        await interaction.deferReply({ ephemeral: true });
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            await interaction.editReply('This user is not in the server.');
            return;
        }
        if (!targetMember.kickable) {
            await interaction.editReply('I cannot kick this user. They may have a higher role than me.');
            return;
        }
        await targetMember.kick(`${reason} | Kicked by ${interaction.user.tag}`);
        logger_1.logger.info(`User ${targetUser.tag} (${targetUser.id}) was kicked by ${interaction.user.tag} (${interaction.user.id}) for: ${reason}`);
        await interaction.editReply(`Successfully kicked ${targetUser.tag} for: ${reason}`);
    }
    catch (error) {
        logger_1.logger.error(`Kick command failed: ${error.message}`);
        await interaction.editReply(`Failed to kick user: ${error.message}`);
    }
}
