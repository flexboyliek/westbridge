"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleRemoveCommand = void 0;
exports.handleRoleRemoveCommand = handleRoleRemoveCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
exports.roleRemoveCommand = new discord_js_1.SlashCommandBuilder()
    .setName('roleremove')
    .setDescription('Remove a role from a user')
    .addUserOption((option) => option.setName('user')
    .setDescription('The user to remove the role from')
    .setRequired(true))
    .addRoleOption((option) => option.setName('role')
    .setDescription('The role to remove')
    .setRequired(true))
    .addStringOption((option) => option.setName('reason')
    .setDescription('Reason for removing the role')
    .setRequired(false));
async function handleRoleRemoveCommand(interaction) {
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
    const role = interaction.options.getRole('role', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    if (!interaction.guild) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    if (role.managed) {
        await interaction.reply({ content: 'I cannot remove managed roles (bot roles, integration roles).', ephemeral: true });
        return;
    }
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
        await interaction.reply({ content: 'I cannot remove roles that are higher than or equal to my highest role.', ephemeral: true });
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
            await interaction.editReply('I cannot remove roles from this user. They may have a higher role than me.');
            return;
        }
        if (!targetMember.roles.cache.has(role.id)) {
            await interaction.editReply('This user does not have this role.');
            return;
        }
        await targetMember.roles.remove(role, `${reason} | Role removed by ${interaction.user.tag}`);
        logger_1.logger.info(`Role ${role.name} (${role.id}) was removed from ${targetUser.tag} (${targetUser.id}) by ${interaction.user.tag} (${interaction.user.id}) for: ${reason}`);
        await interaction.editReply(`Successfully removed role ${role.name} from ${targetUser.tag}. Reason: ${reason}`);
    }
    catch (error) {
        logger_1.logger.error(`Role remove command failed: ${error.message}`);
        await interaction.editReply(`Failed to remove role: ${error.message}`);
    }
}
