"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBroadcastDmEmbed = buildBroadcastDmEmbed;
exports.buildBroadcastDmLinkRow = buildBroadcastDmLinkRow;
exports.buildBroadcastDmPreviewEmbed = buildBroadcastDmPreviewEmbed;
exports.buildBroadcastDmProgressEmbed = buildBroadcastDmProgressEmbed;
exports.buildBroadcastDmCompleteEmbed = buildBroadcastDmCompleteEmbed;
const discord_js_1 = require("discord.js");
function buildBroadcastDmEmbed(payload) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(payload.title)
        .setDescription(payload.body)
        .setColor((payload.color || '#2a336a'))
        .setTimestamp();
    if (payload.author) {
        embed.setAuthor({ name: payload.author });
    }
    if (payload.footer) {
        embed.setFooter({ text: payload.footer });
    }
    if (payload.thumbnailUrl) {
        embed.setThumbnail(payload.thumbnailUrl);
    }
    if (payload.imageUrl) {
        embed.setImage(payload.imageUrl);
    }
    return embed;
}
function buildBroadcastDmLinkRow(payload) {
    const linkUrl = payload.videoUrl || payload.linkUrl;
    const linkLabel = payload.videoUrl ? 'Watch Video' : payload.linkLabel;
    if (!linkLabel || !linkUrl) {
        return null;
    }
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setLabel(linkLabel).setStyle(discord_js_1.ButtonStyle.Link).setURL(linkUrl));
}
function buildBroadcastDmPreviewEmbed(payload) {
    return buildBroadcastDmEmbed(payload).setFooter({ text: 'Preview — confirm to send to all members' });
}
function buildBroadcastDmProgressEmbed(progress) {
    const processed = progress.sent + progress.failed;
    const eta = progress.etaMinutes === null
        ? 'Calculating…'
        : progress.etaMinutes <= 1
            ? 'Under 1 min'
            : `~${progress.etaMinutes} min`;
    return new discord_js_1.EmbedBuilder()
        .setTitle('Broadcast DM in progress')
        .setColor('#5865F2')
        .addFields({ name: 'Target members', value: String(progress.total), inline: true }, { name: 'Sent', value: String(progress.sent), inline: true }, { name: 'Failed', value: String(progress.failed), inline: true }, { name: 'Processed', value: `${processed} / ${progress.total}`, inline: true }, { name: 'ETA', value: eta, inline: true }, { name: 'Last member', value: progress.currentMember || '—', inline: false })
        .setTimestamp();
}
function buildBroadcastDmCompleteEmbed(result) {
    const minutes = Math.max(1, Math.round(result.durationMs / 60000));
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Broadcast DM finished')
        .setColor('#57F287')
        .addFields({ name: 'Targeted', value: String(result.total), inline: true }, { name: 'Delivered', value: String(result.sent), inline: true }, { name: 'Failed', value: String(result.failed), inline: true }, { name: 'Duration', value: `~${minutes} min`, inline: true })
        .setTimestamp();
    if (result.skipped > 0) {
        embed.addFields({ name: 'DMs closed', value: String(result.skipped), inline: true });
    }
    return embed;
}
