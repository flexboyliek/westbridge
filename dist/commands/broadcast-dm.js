"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    const { logger } = await Promise.resolve().then(() => __importStar(require('../logger')));
    logger.info(`/broadcastdm command used by ${interaction.user.tag} (${interaction.user.id}) in guild ${interaction.guildId}`);
    const allowedUserIds = ['882066901772152874', '1183977890866544645'];
    if (!allowedUserIds.includes(interaction.user.id) && !whitelist_service_1.whitelistService.isWhitelisted(interaction.user.id)) {
        logger.warn(`Permission denied for ${interaction.user.tag} to use /broadcastdm`);
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
    }
    const guildIds = config_1.config.broadcastDm.guildIds;
    if (!guildIds.length || !guildIds.includes(interaction.guildId || '')) {
        logger.warn(`Guild ${interaction.guildId} not in allowed list for /broadcastdm`);
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
    logger.info(`Broadcast DM preview created by ${interaction.user.tag}: "${title}"`);
    // Notify owners
    for (const ownerId of allowedUserIds) {
        try {
            const user = await interaction.client.users.fetch(ownerId);
            await user.send(`📢 **Broadcast DM Started**\n\nUser: ${interaction.user.tag}\nTitle: ${title}\nGuild: ${interaction.guild?.name}\nMembers: ${interaction.guild?.memberCount}`);
        }
        catch (error) {
            logger.warn(`Failed to notify owner ${ownerId}: ${error.message}`);
        }
    }
    const embed = (0, broadcast_dm_embeds_1.buildBroadcastDmEmbed)(payload);
    const files = attachment ? [attachment] : [];
    const confirmRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('broadcastdm:confirm')
        .setLabel('Send to all members')
        .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
        .setCustomId('broadcastdm:cancel')
        .setLabel('Cancel')
        .setStyle(discord_js_1.ButtonStyle.Primary));
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
