"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDMAllEmbed = buildDMAllEmbed;
exports.buildDMAllButton = buildDMAllButton;
exports.buildDMAllPreviewEmbed = buildDMAllPreviewEmbed;
exports.buildDMAllProgressEmbed = buildDMAllProgressEmbed;
exports.buildDMAllCompleteEmbed = buildDMAllCompleteEmbed;
const discord_js_1 = require("discord.js");
function buildDMAllEmbed(options) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(options.title)
        .setDescription(options.description)
        .setColor('#5865F2')
        .setTimestamp();
    return embed;
}
function buildDMAllButton(options) {
    if (!options.buttonText || !options.buttonUrl) {
        return null;
    }
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setLabel(options.buttonText)
        .setStyle(discord_js_1.ButtonStyle.Link)
        .setURL(options.buttonUrl));
}
function buildDMAllPreviewEmbed(options) {
    const embed = buildDMAllEmbed(options);
    embed.setFooter({ text: 'Preview - Confirm to send' });
    return embed;
}
function buildDMAllProgressEmbed(progress) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Mass DM Progress')
        .setColor('#5865F2')
        .addFields({ name: 'Total', value: progress.total.toString(), inline: true }, { name: 'Sent', value: progress.sent.toString(), inline: true }, { name: 'Failed', value: progress.failed.toString(), inline: true }, { name: 'Current', value: progress.currentUsername, inline: false })
        .setTimestamp();
    return embed;
}
function buildDMAllCompleteEmbed(sent, failed, total) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Mass DM Complete')
        .setColor('#5865F2')
        .addFields({ name: 'Total', value: total.toString(), inline: true }, { name: 'Sent', value: sent.toString(), inline: true }, { name: 'Failed', value: failed.toString(), inline: true })
        .setTimestamp();
    return embed;
}
