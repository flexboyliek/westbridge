"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importApplicationsCommand = void 0;
exports.handleImportApplicationsCommand = handleImportApplicationsCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
const google_sheets_service_1 = require("../services/google-sheets.service");
const staff_application_embeds_1 = require("../embeds/staff-application.embeds");
exports.importApplicationsCommand = new discord_js_1.SlashCommandBuilder()
    .setName('importapplications')
    .setDescription('Import all existing applications from Google Sheets');
async function handleImportApplicationsCommand(interaction) {
    // Only allow bot owner to use this command
    if (interaction.user.id !== config_1.config.botOwnerId) {
        await interaction.reply({ content: 'Only the bot owner can use this command.', ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        await interaction.editReply('Fetching applications from Google Sheets...');
        const applications = await google_sheets_service_1.googleSheetsService.getApplications();
        if (applications.length === 0) {
            await interaction.editReply('No applications found in Google Sheets.');
            return;
        }
        const pendingChannel = await interaction.client.channels.fetch(config_1.config.staff.pendingChannelId);
        if (!pendingChannel || !pendingChannel.isTextBased() || pendingChannel.isDMBased()) {
            await interaction.editReply('Pending channel not found or is not text-based.');
            return;
        }
        let imported = 0;
        let failed = 0;
        for (const application of applications) {
            try {
                const embed = (0, staff_application_embeds_1.buildPendingApplicationEmbed)(application);
                const buttons = (0, staff_application_embeds_1.buildApplicationButtons)(application.rowNumber);
                await pendingChannel.send({ embeds: [embed], components: [buttons] });
                imported++;
                logger_1.logger.info(`Imported application #${application.rowNumber} for ${application.discordUsername}`);
            }
            catch (error) {
                failed++;
                logger_1.logger.error(`Failed to import application #${application.rowNumber}: ${error.message}`);
            }
        }
        await interaction.editReply(`Import complete!\n\nImported: ${imported}\nFailed: ${failed}\nTotal: ${applications.length}`);
    }
    catch (error) {
        logger_1.logger.error(`Import applications failed: ${error.message}`);
        await interaction.editReply(`Error: ${error.message}`);
    }
}
