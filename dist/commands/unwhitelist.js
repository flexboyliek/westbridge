"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unwhitelistCommand = void 0;
exports.handleUnwhitelistCommand = handleUnwhitelistCommand;
const discord_js_1 = require("discord.js");
const whitelist_service_1 = require("../services/whitelist.service");
exports.unwhitelistCommand = new discord_js_1.SlashCommandBuilder()
    .setName('unwhitelist')
    .setDescription('Remove a user from the whitelist (owner only)')
    .addUserOption((option) => option
    .setName('user')
    .setDescription('The user to unwhitelist')
    .setRequired(true));
async function handleUnwhitelistCommand(interaction) {
    const allowedUserIds = ['882066901772152874', '1183977890866544645'];
    if (!allowedUserIds.includes(interaction.user.id)) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
    }
    const targetUser = interaction.options.getUser('user');
    if (!targetUser) {
        await interaction.reply({ content: 'Invalid user.', ephemeral: true });
        return;
    }
    const removed = await whitelist_service_1.whitelistService.removeUser(targetUser.id);
    if (removed) {
        await interaction.reply({
            content: `Successfully unwhitelisted ${targetUser.tag} (${targetUser.id})`,
            ephemeral: true,
        });
    }
    else {
        await interaction.reply({
            content: `${targetUser.tag} is not whitelisted.`,
            ephemeral: true,
        });
    }
}
