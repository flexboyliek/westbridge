"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTrelloCommand = void 0;
exports.handleRemoveTrelloCommand = handleRemoveTrelloCommand;
exports.handleRemoveTrelloAutocomplete = handleRemoveTrelloAutocomplete;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
const trello_service_1 = require("../services/trello.service");
exports.removeTrelloCommand = new discord_js_1.SlashCommandBuilder()
    .setName('removetrello')
    .setDescription('Remove a staff member from a Trello list')
    .addStringOption((option) => option.setName('game')
    .setDescription('Game (ohthatschaos or dollhouse)')
    .setRequired(true)
    .addChoices({ name: 'OhThatsChaos', value: 'ohthatschaos' }, { name: 'Dollhouse Showdown', value: 'dollhouse' }))
    .addStringOption((option) => option.setName('list')
    .setDescription('Trello list name')
    .setRequired(true)
    .setAutocomplete(true))
    .addStringOption((option) => option.setName('username')
    .setDescription('Roblox username')
    .setRequired(true));
async function handleRemoveTrelloCommand(interaction) {
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
    const listName = interaction.options.getString('list', true);
    const username = interaction.options.getString('username', true);
    await interaction.deferReply({ ephemeral: true });
    try {
        await trello_service_1.trelloService.initialize();
        const boardId = config_1.config.trello.boards[game];
        if (!boardId) {
            await interaction.editReply('Invalid game selected.');
            return;
        }
        const listId = await trello_service_1.trelloService.findListByName(boardId, listName);
        if (!listId) {
            await interaction.editReply(`List "${listName}" not found in Trello board.`);
            return;
        }
        const cardId = await trello_service_1.trelloService.findCardByName(listId, username);
        if (!cardId) {
            await interaction.editReply(`User "${username}" not found in list "${listName}".`);
            return;
        }
        const success = await trello_service_1.trelloService.deleteCard(cardId);
        if (success) {
            await interaction.editReply(`Removed "${username}" from "${listName}" in ${game}.`);
        }
        else {
            await interaction.editReply('Failed to delete card in Trello.');
        }
    }
    catch (error) {
        logger_1.logger.error(`Remove Trello command failed: ${error.message}`);
        await interaction.editReply(`Error: ${error.message}`);
    }
}
async function handleRemoveTrelloAutocomplete(interaction) {
    const game = interaction.options.getString('game');
    if (!game) {
        await interaction.respond([]);
        return;
    }
    try {
        await trello_service_1.trelloService.initialize();
        const boardId = config_1.config.trello.boards[game];
        if (!boardId) {
            await interaction.respond([]);
            return;
        }
        const lists = await trello_service_1.trelloService.getBoardLists(boardId);
        const choices = lists.map(list => ({ name: list.name, value: list.name }));
        await interaction.respond(choices.slice(0, 25));
    }
    catch (error) {
        logger_1.logger.error(`Trello autocomplete failed: ${error.message}`);
        await interaction.respond([]);
    }
}
