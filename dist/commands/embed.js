"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedCommand = void 0;
exports.handleEmbedCommand = handleEmbedCommand;
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const modal_handler_1 = require("../handlers/modal-handler");
exports.embedCommand = new discord_js_1.SlashCommandBuilder()
    .setName('embed')
    .setDescription('Send an embed message')
    .addChannelOption((option) => option
    .setName('channel')
    .setDescription('Channel to send the embed to')
    .addChannelTypes(discord_js_1.ChannelType.GuildText)
    .setRequired(false));
async function handleEmbedCommand(interaction) {
    // Check if user has admin role
    const hasUserIdPermission = config_1.config.strikes.allowedUserIds.includes(interaction.user.id);
    const hasRolePermission = interaction.member &&
        'roles' in interaction.member &&
        interaction.member.roles.cache.some((role) => config_1.config.strikes.allowedRoleIds.includes(role.id));
    if (!hasUserIdPermission && !hasRolePermission) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
    }
    const channel = interaction.options.getChannel('channel');
    const channelId = channel?.id || 'current';
    const modal = (0, modal_handler_1.buildEmbedModal)(channelId);
    await interaction.showModal(modal);
}
