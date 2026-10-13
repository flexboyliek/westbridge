"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectMenuHandler = void 0;
const config_1 = require("../config");
const logger_1 = require("../logger");
const modal_handler_1 = require("../handlers/modal-handler");
const trello_service_1 = require("../services/trello.service");
const bulkaddtrello_1 = require("../commands/bulkaddtrello");
class SelectMenuHandler {
    client;
    constructor(client) {
        this.client = client;
    }
    async handle(interaction) {
        const customId = interaction.customId;
        // Handle support ticket menu
        if (customId === 'support:menu') {
            await this.handleSupportMenu(interaction);
            return;
        }
        // Handle Trello list selection
        if (customId.startsWith('addtrello:')) {
            await this.handleAddTrelloSelect(interaction);
            return;
        }
        // Handle bulk Trello list selection
        if (customId.startsWith('bulkaddtrello:')) {
            await this.handleBulkAddTrelloSelect(interaction);
            return;
        }
        logger_1.logger.info(`Select menu used: ${customId}`);
    }
    async handleSupportMenu(interaction) {
        const type = interaction.values[0];
        const typeLabels = {
            general: 'General Support',
            creator: 'Content Creator',
            claim: 'Claim Your Rank',
        };
        const label = typeLabels[type] || 'Support';
        // Check if user already has an open ticket of this type
        const guild = interaction.guild;
        if (guild) {
            const channels = await guild.channels.fetch();
            const existingTicket = channels.find((channel) => !!channel &&
                !!channel.parentId &&
                channel.parentId === config_1.config.tickets.categoryId &&
                channel.type === 0 && // GuildText
                channel.name === `🔴-${type}-${interaction.user.username}`);
            if (existingTicket) {
                await interaction.reply({
                    content: `You already have an open **${label}** ticket: <#${existingTicket.id}>`,
                    ephemeral: true,
                });
                return;
            }
        }
        // Check if busy mode is active and show warning
        if (config_1.config.tickets.busyMode.enabled) {
            const guild = interaction.guild;
            if (guild) {
                const channels = await guild.channels.fetch();
                const ticketChannels = channels.filter((channel) => !!channel &&
                    !!channel.parentId &&
                    channel.parentId === config_1.config.tickets.categoryId &&
                    channel.type === 0 // GuildText
                );
                const openTicketCount = ticketChannels.size;
                if (openTicketCount >= config_1.config.tickets.busyMode.threshold) {
                    await interaction.reply({
                        content: `⚠️ **Busy Mode Active**\n\n${config_1.config.tickets.busyMode.message}\n\nYou can still proceed if your issue is urgent.`,
                        ephemeral: true,
                    });
                    // Don't return - let them proceed
                }
            }
        }
        // Check if user already has an open ticket of this type
        // Since we're not using a database, we'll skip this check for now
        // In a real system, you'd check the database here
        const modal = (0, modal_handler_1.buildTicketReasonModal)(type, label);
        await interaction.showModal(modal);
    }
    async handleAddTrelloSelect(interaction) {
        try {
            const customIdParts = interaction.customId.split(':');
            const game = customIdParts[1];
            const username = customIdParts[2];
            const listId = interaction.values[0];
            await interaction.deferReply({ ephemeral: true });
            await trello_service_1.trelloService.initialize();
            // Check if card already exists
            const existingCardId = await trello_service_1.trelloService.findCardByName(listId, username);
            if (existingCardId) {
                await interaction.editReply(`User "${username}" already exists in this list.`);
                return;
            }
            const success = await trello_service_1.trelloService.createCard(listId, username);
            if (success) {
                await interaction.editReply(`Added "${username}" to the selected list in ${game}.`);
            }
            else {
                await interaction.editReply('Failed to create card in Trello.');
            }
        }
        catch (error) {
            logger_1.logger.error(`Trello select menu failed: ${error.message}`);
            await interaction.editReply(`Error: ${error.message}`);
        }
    }
    async handleBulkAddTrelloSelect(interaction) {
        try {
            const customIdParts = interaction.customId.split(':');
            const game = customIdParts[1];
            const listId = interaction.values[0];
            await interaction.deferReply({ ephemeral: true });
            await trello_service_1.trelloService.initialize();
            // Get usernames from cache using the message ID
            const usernames = (0, bulkaddtrello_1.getBulkTrelloUsernames)(interaction.message.id);
            if (!usernames || usernames.length === 0) {
                await interaction.editReply('Usernames not found. Please try the command again.');
                return;
            }
            let added = 0;
            let skipped = 0;
            let failed = 0;
            const results = [];
            for (const username of usernames) {
                try {
                    // Check if card already exists
                    const existingCardId = await trello_service_1.trelloService.findCardByName(listId, username);
                    if (existingCardId) {
                        skipped++;
                        results.push(`⏭️ ${username} - already exists`);
                        continue;
                    }
                    const success = await trello_service_1.trelloService.createCard(listId, username);
                    if (success) {
                        added++;
                        results.push(`✅ ${username} - added`);
                    }
                    else {
                        failed++;
                        results.push(`❌ ${username} - failed to add`);
                    }
                }
                catch (error) {
                    failed++;
                    results.push(`❌ ${username} - error: ${error.message}`);
                }
            }
            // Clear cache after processing
            (0, bulkaddtrello_1.clearBulkTrelloUsernames)(interaction.message.id);
            const summary = `**Bulk Add Results for ${game}**\n\n✅ Added: ${added}\n⏭️ Skipped: ${skipped}\n❌ Failed: ${failed}\n\n${results.slice(0, 20).join('\n')}${results.length > 20 ? '\n...' : ''}`;
            await interaction.editReply(summary);
        }
        catch (error) {
            logger_1.logger.error(`Bulk Trello select menu failed: ${error.message}`);
            await interaction.editReply(`Error: ${error.message}`);
        }
    }
}
exports.SelectMenuHandler = SelectMenuHandler;
