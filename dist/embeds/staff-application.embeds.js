"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPendingApplicationEmbed = buildPendingApplicationEmbed;
exports.buildApprovedApplicationEmbed = buildApprovedApplicationEmbed;
exports.buildDeniedApplicationEmbed = buildDeniedApplicationEmbed;
exports.buildApplicationButtons = buildApplicationButtons;
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
function buildPendingApplicationEmbed(application) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('📋 STAFF APPLICATION')
        .setColor(config_1.config.staff.embedColor)
        .addFields({ name: '🎮 Roblox Username', value: application.robloxUsername || 'N/A', inline: false }, { name: '👤 Discord Username', value: application.discordUsername || 'N/A', inline: false }, { name: '🌎 Timezone', value: application.timezone || 'N/A', inline: true }, { name: '⭐ Daily Activity', value: application.dailyActivity || 'N/A', inline: true }, { name: '🛡 Previous Staff Experience', value: application.previousExperience || 'N/A', inline: false }, { name: '💬 Professionalism', value: application.professionalism || 'N/A', inline: false }, { name: '🎫 Ticket Handling', value: application.ticketHandling || 'N/A', inline: false }, { name: '⚖ Permanent Ban Scenario', value: application.permanentBanScenario || 'N/A', inline: false }, { name: '⚔ Exploiting Scenario', value: application.exploitingScenario || 'N/A', inline: false }, { name: '🚫 Permanent Punishment', value: application.permanentPunishment || 'N/A', inline: false }, { name: 'Status', value: '🟡 Pending Review', inline: false }, { name: 'Application #', value: application.rowNumber.toString(), inline: true }, { name: 'Submitted', value: application.timestamp?.toLocaleString() || 'Unknown', inline: true });
    if (config_1.config.staff.bannerUrl) {
        embed.setImage(config_1.config.staff.bannerUrl);
    }
    embed.setTimestamp();
    return embed;
}
function buildApprovedApplicationEmbed(application, approvedBy) {
    const embed = buildPendingApplicationEmbed(application);
    // Update status field
    const statusField = embed.data.fields?.find(f => f.name === 'Status');
    if (statusField) {
        statusField.value = '🟢 Approved';
    }
    // Add approval info
    embed.addFields({ name: 'Approved By', value: approvedBy, inline: true }, { name: 'Approved Date', value: new Date().toLocaleString(), inline: true });
    return embed;
}
function buildDeniedApplicationEmbed(application, deniedBy) {
    const embed = buildPendingApplicationEmbed(application);
    // Update status field
    const statusField = embed.data.fields?.find(f => f.name === 'Status');
    if (statusField) {
        statusField.value = '🔴 Denied';
    }
    // Add denial info
    embed.addFields({ name: 'Denied By', value: deniedBy, inline: true }, { name: 'Denied Date', value: new Date().toLocaleString(), inline: true });
    return embed;
}
function buildApplicationButtons(rowNumber) {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`staff:approve:${rowNumber}`)
        .setLabel('✅ Approve')
        .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
        .setCustomId(`staff:deny:${rowNumber}`)
        .setLabel('❌ Deny')
        .setStyle(discord_js_1.ButtonStyle.Danger));
}
