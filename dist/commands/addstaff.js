"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addStaffCommand = void 0;
exports.handleAddStaffCommand = handleAddStaffCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
const strikes_service_1 = require("../services/strikes.service");
exports.addStaffCommand = new discord_js_1.SlashCommandBuilder()
    .setName('addstaff')
    .setDescription('Add a new staff member to the database')
    .addStringOption((option) => option.setName('position')
    .setDescription('Staff position/title')
    .setRequired(true))
    .addStringOption((option) => option.setName('robloxusername')
    .setDescription('Roblox username')
    .setRequired(true))
    .addStringOption((option) => option.setName('discordusername')
    .setDescription('Discord username')
    .setRequired(true));
async function handleAddStaffCommand(interaction) {
    // Check if user is allowed
    if (!config_1.config.strikes.allowedUserIds.includes(interaction.user.id)) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
    }
    const position = interaction.options.getString('position', true);
    const robloxUsername = interaction.options.getString('robloxusername', true);
    const discordUsername = interaction.options.getString('discordusername', true);
    await interaction.deferReply({ ephemeral: true });
    try {
        const staffMember = await strikes_service_1.strikesService.addStaff(position, robloxUsername, discordUsername);
        await interaction.editReply(`Staff member added: ${discordUsername} (${robloxUsername}) as ${position}`);
    }
    catch (error) {
        logger_1.logger.error(`Add staff command failed: ${error.message}`);
        await interaction.editReply(`Error: ${error.message}`);
    }
}
