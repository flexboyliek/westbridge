"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTrelloCommand = void 0;
exports.handleAddTrelloCommand = handleAddTrelloCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
const trello_service_1 = require("../services/trello.service");
exports.addTrelloCommand = new discord_js_1.SlashCommandBuilder()
    .setName('addtrello')
    .setDescription('Add a staff member to a Trello list')
    .addStringOption((option) => option.setName('game')
    .setDescription('Game (ohthatschaos or dollhouse)')
    .setRequired(true)
    .addChoices({ name: 'OhThatsChaos', value: 'ohthatschaos' }, { name: 'Dollhouse Showdown', value: 'dollhouse' }))
    .addStringOption((option) => option.setName('username')
    .setDescription('Roblox username')
    .setRequired(true));
async function handleAddTrelloCommand(interaction) {
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
    const username = interaction.options.getString('username', true);
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
        // Create select menu with lists
        const selectMenu = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId(`addtrello:${game}:${username}`)
            .setPlaceholder('Select a Trello list')
            .addOptions(lists.slice(0, 25).map(list => ({
            label: list.name,
            value: list.id,
        })));
        const row = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
        await interaction.editReply({
            content: `Select a Trello list to add **${username}** to:`,
            components: [row],
        });
    }
    catch (error) {
        logger_1.logger.error(`Add Trello command failed: ${error.message}`);
        await interaction.editReply(`Error: ${error.message}`);
    }
}
