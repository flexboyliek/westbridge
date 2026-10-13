"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewStrikesCommand = void 0;
exports.handleViewStrikesCommand = handleViewStrikesCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
const strikes_service_1 = require("../services/strikes.service");
exports.viewStrikesCommand = new discord_js_1.SlashCommandBuilder()
    .setName('viewstrikes')
    .setDescription('View all staff members and their strike counts');
async function handleViewStrikesCommand(interaction) {
    // Check if user is allowed
    if (!config_1.config.strikes.allowedUserIds.includes(interaction.user.id)) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        const staffMembers = await strikes_service_1.strikesService.getAllStaff();
        if (staffMembers.length === 0) {
            await interaction.editReply('No staff members found in the database.');
            return;
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('📋 Staff Strike Database')
            .setColor('#5865F2')
            .setTimestamp();
        const fields = staffMembers.map(member => ({
            name: `${member.discordUsername} (${member.robloxUsername})`,
            value: `Position: ${member.position}\nStrikes: ${member.strikes}/${config_1.config.strikes.maxStrikes}`,
            inline: false,
        }));
        // Discord has a limit of 25 fields per embed
        const chunkedFields = [];
        for (let i = 0; i < fields.length; i += 25) {
            chunkedFields.push(fields.slice(i, i + 25));
        }
        embed.addFields(chunkedFields[0]);
        await interaction.editReply({ embeds: [embed] });
    }
    catch (error) {
        logger_1.logger.error(`View strikes command failed: ${error.message}`);
        await interaction.editReply(`Error: ${error.message}`);
    }
}
