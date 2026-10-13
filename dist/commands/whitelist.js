"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whitelistCommand = void 0;
exports.handleWhitelistCommand = handleWhitelistCommand;
const discord_js_1 = require("discord.js");
const whitelist_service_1 = require("../services/whitelist.service");
exports.whitelistCommand = new discord_js_1.SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Add a user to the whitelist (owner only)')
    .addUserOption((option) => option
    .setName('user')
    .setDescription('The user to whitelist')
    .setRequired(true));
async function handleWhitelistCommand(interaction) {
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
    const added = await whitelist_service_1.whitelistService.addUser(targetUser.id);
    if (added) {
        await interaction.reply({
            content: `Successfully whitelisted ${targetUser.tag} (${targetUser.id})`,
            ephemeral: true,
        });
    }
    else {
        await interaction.reply({
            content: `${targetUser.tag} is already whitelisted.`,
            ephemeral: true,
        });
    }
}
