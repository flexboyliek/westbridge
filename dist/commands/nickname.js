"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nicknameCommand = void 0;
exports.handleNicknameCommand = handleNicknameCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
exports.nicknameCommand = new discord_js_1.SlashCommandBuilder()
    .setName('nickname')
    .setDescription('Change a user\'s nickname')
    .addUserOption((option) => option.setName('user')
    .setDescription('The user to rename')
    .setRequired(true))
    .addStringOption((option) => option.setName('nickname')
    .setDescription('The new nickname')
    .setRequired(true));
async function handleNicknameCommand(interaction) {
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
    const nickname = interaction.options.getString('nickname', true);
    if (!interaction.guild) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    if (targetUser.id === interaction.client.user?.id) {
        await interaction.reply({ content: 'I cannot change my own nickname.', ephemeral: true });
        return;
    }
    if (nickname.length > 32) {
        await interaction.reply({ content: 'Nickname must be 32 characters or less.', ephemeral: true });
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
            await interaction.editReply('I cannot change this user\'s nickname. They may have a higher role than me.');
            return;
        }
        await targetMember.setNickname(nickname, `Nickname changed by ${interaction.user.tag}`);
        logger_1.logger.info(`User ${targetUser.tag} (${targetUser.id}) nickname was changed to "${nickname}" by ${interaction.user.tag} (${interaction.user.id})`);
        await interaction.editReply(`Successfully changed ${targetUser.tag}'s nickname to "${nickname}"`);
    }
    catch (error) {
        logger_1.logger.error(`Nickname command failed: ${error.message}`);
        await interaction.editReply(`Failed to change nickname: ${error.message}`);
    }
}
