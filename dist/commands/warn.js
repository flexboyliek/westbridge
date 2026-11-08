"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warnCommand = void 0;
exports.handleWarnCommand = handleWarnCommand;
exports.getWarnings = getWarnings;
exports.clearWarnings = clearWarnings;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
const warnings = new Map();
exports.warnCommand = new discord_js_1.SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption((option) => option.setName('user')
    .setDescription('The user to warn')
    .setRequired(true))
    .addStringOption((option) => option.setName('reason')
    .setDescription('Reason for the warning')
    .setRequired(true));
async function handleWarnCommand(interaction) {
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
    const reason = interaction.options.getString('reason', true);
    if (targetUser.id === interaction.client.user?.id) {
        await interaction.reply({ content: 'I cannot warn myself.', ephemeral: true });
        return;
    }
    if (targetUser.id === interaction.user.id) {
        await interaction.reply({ content: 'You cannot warn yourself.', ephemeral: true });
        return;
    }
    try {
        await interaction.deferReply({ ephemeral: true });
        const currentWarnings = warnings.get(targetUser.id) ?? 0;
        warnings.set(targetUser.id, currentWarnings + 1);
        logger_1.logger.info(`User ${targetUser.tag} (${targetUser.id}) was warned by ${interaction.user.tag} (${interaction.user.id}) for: ${reason} (Total warnings: ${currentWarnings + 1})`);
        await interaction.editReply(`Successfully warned ${targetUser.tag}. Reason: ${reason}\nTotal warnings: ${currentWarnings + 1}`);
        if (interaction.guild) {
            try {
                await targetUser.send({
                    content: `You have been warned in ${interaction.guild.name}.\nReason: ${reason}\nTotal warnings: ${currentWarnings + 1}`,
                }).catch(() => {
                    logger_1.logger.info(`Could not DM ${targetUser.tag} about warning`);
                });
            }
            catch (error) {
                logger_1.logger.info(`Could not DM ${targetUser.tag} about warning`);
            }
        }
    }
    catch (error) {
        logger_1.logger.error(`Warn command failed: ${error.message}`);
        await interaction.editReply(`Failed to warn user: ${error.message}`);
    }
}
function getWarnings(userId) {
    return warnings.get(userId) ?? 0;
}
function clearWarnings(userId) {
    warnings.delete(userId);
}
