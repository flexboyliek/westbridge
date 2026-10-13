"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dmallCommand = void 0;
exports.handleDmallCommand = handleDmallCommand;
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const modal_handler_1 = require("../handlers/modal-handler");
exports.dmallCommand = new discord_js_1.SlashCommandBuilder()
    .setName('dmall')
    .setDescription('Send a DM to all server members');
async function handleDmallCommand(interaction) {
    // Only allow specific user to use this command
    if (interaction.user.id !== '882066901772152874') {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
    }
    // Only allow in the configured server
    if (interaction.guildId !== config_1.config.dmall.serverId) {
        await interaction.reply({ content: 'This command can only be used in the configured server.', ephemeral: true });
        return;
    }
    const modal = (0, modal_handler_1.buildDMAllModal)();
    await interaction.showModal(modal);
}
