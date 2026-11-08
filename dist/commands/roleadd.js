"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleAddCommand = void 0;
exports.handleRoleAddCommand = handleRoleAddCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const MODERATION_ROLE_ID = '1569089572028026900';
exports.roleAddCommand = new discord_js_1.SlashCommandBuilder()
    .setName('roleadd')
    .setDescription('Add a role to a user')
    .addUserOption((option) => option.setName('user')
    .setDescription('The user to add the role to')
    .setRequired(true))
    .addRoleOption((option) => option.setName('role')
    .setDescription('The role to add')
    .setRequired(true))
    .addStringOption((option) => option.setName('reason')
    .setDescription('Reason for adding the role')
    .setRequired(false))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageRoles);
async function handleRoleAddCommand(interaction) {
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
    const role = interaction.options.getRole('role', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    if (!interaction.guild) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    if (role.managed) {
        await interaction.reply({ content: 'I cannot add managed roles (bot roles, integration roles).', ephemeral: true });
        return;
    }
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
        await interaction.reply({ content: 'I cannot add roles that are higher than or equal to my highest role.', ephemeral: true });
        return;
    }
    try {
        await interaction.deferReply({ ephemeral: true });
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            await interaction.editReply('This user is not in the server.');
            return;
        }
        if (!targetMember.manageable) {
            await interaction.editReply('I cannot add roles to this user. They may have a higher role than me.');
            return;
        }
        if (targetMember.roles.cache.has(role.id)) {
            await interaction.editReply('This user already has this role.');
            return;
        }
        await targetMember.roles.add(role, `${reason} | Role added by ${interaction.user.tag}`);
        logger_1.logger.info(`Role ${role.name} (${role.id}) was added to ${targetUser.tag} (${targetUser.id}) by ${interaction.user.tag} (${interaction.user.id}) for: ${reason}`);
        await interaction.editReply(`Successfully added role ${role.name} to ${targetUser.tag}. Reason: ${reason}`);
    }
    catch (error) {
        logger_1.logger.error(`Role add command failed: ${error.message}`);
        await interaction.editReply(`Failed to add role: ${error.message}`);
    }
}
