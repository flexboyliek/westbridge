"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.banCommand = void 0;
exports.handleBanCommand = handleBanCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
exports.banCommand = new discord_js_1.SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption((option) => option.setName('user')
    .setDescription('The user to ban')
    .setRequired(true))
    .addStringOption((option) => option.setName('reason')
    .setDescription('Reason for the ban')
    .setRequired(false))
    .addIntegerOption((option) => option.setName('delete_days')
    .setDescription('Delete messages from the past X days (0-7)')
    .setRequired(false)
    .setMinValue(0)
    .setMaxValue(7))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.BanMembers);
async function handleBanCommand(interaction) {
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
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') ?? 0;
    if (!interaction.guild) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    if (targetUser.id === interaction.client.user?.id) {
        await interaction.reply({ content: 'I cannot ban myself.', ephemeral: true });
        return;
    }
    if (targetUser.id === interaction.user.id) {
        await interaction.reply({ content: 'You cannot ban yourself.', ephemeral: true });
        return;
    }
    try {
        await interaction.deferReply({ ephemeral: true });
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (targetMember) {
            if (!targetMember.bannable) {
                await interaction.editReply('I cannot ban this user. They may have a higher role than me.');
                return;
            }
        }
        await interaction.guild.bans.create(targetUser.id, {
            reason: `${reason} | Banned by ${interaction.user.tag}`,
            deleteMessageDays: deleteDays,
        });
        logger_1.logger.info(`User ${targetUser.tag} (${targetUser.id}) was banned by ${interaction.user.tag} (${interaction.user.id}) for: ${reason}`);
        await interaction.editReply(`Successfully banned ${targetUser.tag} for: ${reason}`);
    }
    catch (error) {
        logger_1.logger.error(`Ban command failed: ${error.message}`);
        await interaction.editReply(`Failed to ban user: ${error.message}`);
    }
}
