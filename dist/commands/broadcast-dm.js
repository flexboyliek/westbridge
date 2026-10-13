"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastDmCommand = void 0;
exports.handleBroadcastDmCommand = handleBroadcastDmCommand;
exports.getBroadcastCache = getBroadcastCache;
exports.deleteBroadcastCache = deleteBroadcastCache;
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const whitelist_service_1 = require("../services/whitelist.service");
const broadcast_dm_embeds_1 = require("../embeds/broadcast-dm.embeds");
const broadcastCache = new Map();
exports.broadcastDmCommand = new discord_js_1.SlashCommandBuilder()
    .setName('broadcastdm')
    .setDescription('Send a rich embed DM to every member in the server (whitelist only)')
    .addStringOption((option) => option.setName('title').setDescription('The title of the message').setRequired(true))
    .addStringOption((option) => option.setName('body').setDescription('The message body').setRequired(true))
    .addAttachmentOption((option) => option.setName('image').setDescription('Image or video file to attach').setRequired(false))
    .addStringOption((option) => option.setName('color').setDescription('Embed color (hex)').setRequired(false))
    .addStringOption((option) => option.setName('link').setDescription('Link URL for a button').setRequired(false));
async function handleBroadcastDmCommand(interaction) {
    const allowedUserIds = ['882066901772152874', '1183977890866544645'];
    if (!allowedUserIds.includes(interaction.user.id) && !whitelist_service_1.whitelistService.isWhitelisted(interaction.user.id)) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
    }
    const guildIds = config_1.config.broadcastDm.guildIds;
    if (!guildIds.length || !guildIds.includes(interaction.guildId || '')) {
        await interaction.reply({
            content: 'Use this command in a configured broadcast server.',
            ephemeral: true,
        });
        return;
    }
    const title = interaction.options.getString('title');
    const body = interaction.options.getString('body');
    const attachment = interaction.options.getAttachment('image');
    const color = interaction.options.getString('color');
    const link = interaction.options.getString('link');
    if (!title || !body) {
        await interaction.reply({ content: 'Title and body are required.', ephemeral: true });
        return;
    }
    const payload = {
        title,
        body,
        color: color || '#2a336a',
    };
    const embed = (0, broadcast_dm_embeds_1.buildBroadcastDmEmbed)(payload);
    const files = attachment ? [attachment] : [];
    const confirmRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('broadcastdm:confirm')
        .setLabel('Send to all members')
        .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
        .setCustomId('broadcastdm:cancel')
        .setLabel('Cancel')
        .setStyle(discord_js_1.ButtonStyle.Danger));
    const reply = await interaction.reply({
        content: `Preview of your broadcast to ${interaction.guild?.memberCount} members. Confirm to send.`,
        embeds: [embed],
        files,
        components: [confirmRow],
        ephemeral: true,
        fetchReply: true,
    });
    if (reply && 'id' in reply) {
        broadcastCache.set(reply.id, { payload, attachment });
    }
}
function getBroadcastCache(messageId) {
    return broadcastCache.get(messageId);
}
function deleteBroadcastCache(messageId) {
    broadcastCache.delete(messageId);
}
