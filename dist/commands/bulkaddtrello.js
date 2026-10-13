"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkAddTrelloCommand = void 0;
exports.cacheBulkTrelloUsernames = cacheBulkTrelloUsernames;
exports.getBulkTrelloUsernames = getBulkTrelloUsernames;
exports.clearBulkTrelloUsernames = clearBulkTrelloUsernames;
exports.handleBulkAddTrelloCommand = handleBulkAddTrelloCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
const trello_service_1 = require("../services/trello.service");
// Cache for bulk Trello usernames
const bulkTrelloCache = new Map();
// Cleanup old cache entries every 30 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    const thirtyMinutesAgo = now - (30 * 60 * 1000);
    for (const [messageId, data] of bulkTrelloCache.entries()) {
        if (data.timestamp < thirtyMinutesAgo) {
            bulkTrelloCache.delete(messageId);
        }
    }
}, 30 * 60 * 1000); // Run every 30 minutes
function cacheBulkTrelloUsernames(messageId, usernames) {
    bulkTrelloCache.set(messageId, { usernames, timestamp: Date.now() });
}
function getBulkTrelloUsernames(messageId) {
    return bulkTrelloCache.get(messageId)?.usernames;
}
function clearBulkTrelloUsernames(messageId) {
    bulkTrelloCache.delete(messageId);
}
exports.bulkAddTrelloCommand = new discord_js_1.SlashCommandBuilder()
    .setName('bulkaddtrello')
    .setDescription('Add multiple staff members to a Trello list')
    .addStringOption((option) => option.setName('game')
    .setDescription('Game (ohthatschaos or dollhouse)')
    .setRequired(true)
    .addChoices({ name: 'OhThatsChaos', value: 'ohthatschaos' }, { name: 'Dollhouse Showdown', value: 'dollhouse' }))
    .addStringOption((option) => option.setName('usernames')
    .setDescription('Roblox usernames (separated by commas or newlines)')
    .setRequired(true));
async function handleBulkAddTrelloCommand(interaction) {
    // Check if user is allowed (by ID or role)
    const hasUserIdPermission = config_1.config.strikes.allowedUserIds.includes(interaction.user.id);
    const hasRolePermission = interaction.member &&
        'roles' in interaction.member &&
        interaction.member.roles.cache.some((role) => config_1.config.strikes.allowedRoleIds.includes(role.id));
    if (!hasUserIdPermission && !hasRolePermission) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
    }
    const game = interaction.options.getString('game', true);
    const usernamesInput = interaction.options.getString('usernames', true);
    await interaction.deferReply({ ephemeral: true });
    try {
        await trello_service_1.trelloService.initialize();
        const boardId = config_1.config.trello.boards[game];
        if (!boardId) {
            await interaction.editReply('Invalid game selected.');
            return;
        }
        const lists = await trello_service_1.trelloService.getBoardLists(boardId);
        if (lists.length === 0) {
            await interaction.editReply('No lists found in Trello board.');
            return;
        }
        // Parse usernames (split by comma or newline)
        const usernames = usernamesInput
            .split(/[\n,]+/)
            .map(u => u.trim())
            .filter(u => u.length > 0);
        if (usernames.length === 0) {
            await interaction.editReply('No valid usernames provided.');
            return;
        }
        if (usernames.length > 50) {
            await interaction.editReply('Too many usernames. Maximum 50 at a time.');
            return;
        }
        // Generate unique ID for this batch
        const batchId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        // Cache usernames with the message ID
        await interaction.editReply({ content: 'Loading...', components: [] });
        const replyMessage = await interaction.fetchReply();
        cacheBulkTrelloUsernames(replyMessage.id, usernames);
        // Create select menu with lists (using short custom ID)
        const selectMenu = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId(`bulkaddtrello:${batchId}`)
            .setPlaceholder('Select a Trello list')
            .addOptions(lists.slice(0, 25).map(list => ({
            label: list.name,
            value: list.id,
        })));
        const row = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
        await interaction.editReply({
            content: `Select a Trello list to add **${usernames.length}** usernames to:\n\n${usernames.slice(0, 10).join(', ')}${usernames.length > 10 ? '...' : ''}`,
            components: [row],
        });
    }
    catch (error) {
        logger_1.logger.error(`Bulk Add Trello command failed: ${error.message}`);
        await interaction.editReply(`Error: ${error.message}`);
    }
}
