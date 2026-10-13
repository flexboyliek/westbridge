"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportPanelCommand = void 0;
exports.handleSupportPanelCommand = handleSupportPanelCommand;
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const logger_1 = require("../logger");
exports.supportPanelCommand = new discord_js_1.SlashCommandBuilder()
    .setName('support-panel')
    .setDescription('Send the support ticket panel to the support channel');
async function handleSupportPanelCommand(interaction) {
    // Check if user has staff role
    const hasUserIdPermission = config_1.config.strikes.allowedUserIds.includes(interaction.user.id);
    const hasRolePermission = interaction.member &&
        'roles' in interaction.member &&
        interaction.member.roles.cache.some((role) => config_1.config.strikes.allowedRoleIds.includes(role.id));
    if (!hasUserIdPermission && !hasRolePermission) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    const supportChannel = await interaction.guild?.channels.fetch(config_1.config.tickets.supportChannelId);
    if (!supportChannel || !('send' in supportChannel)) {
        await interaction.editReply('Support channel not found.');
        return;
    }
    // Check if busy mode is active
    let isBusyMode = false;
    if (config_1.config.tickets.busyMode.enabled) {
        const guild = interaction.guild;
        if (guild) {
            const category = await guild.channels.fetch(config_1.config.tickets.categoryId);
            if (category) {
                const channels = await guild.channels.fetch();
                const ticketChannels = channels.filter((channel) => !!channel &&
                    !!channel.parentId &&
                    channel.parentId === config_1.config.tickets.categoryId &&
                    channel.type === 0 // GuildText
                );
                const openTicketCount = ticketChannels.size;
                isBusyMode = openTicketCount >= config_1.config.tickets.busyMode.threshold;
                logger_1.logger.info(`Ticket count: ${openTicketCount}, Busy mode: ${isBusyMode}`);
            }
        }
    }
    // Always show the normal support panel with ticket creation options
    // Add busy mode notice if active
    let description = config_1.config.tickets.panelText;
    if (isBusyMode) {
        description = `⚠️ **BUSY MODE ACTIVE**\n\n${config_1.config.tickets.busyMode.message}\n\n---\n\n${config_1.config.tickets.panelText}`;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(isBusyMode ? '⚠️ Support Tickets - Busy Mode' : '🎫 Support Tickets')
        .setDescription(description)
        .setColor(isBusyMode ? 0xFFA500 : 0x9B59B6) // Purple (0x9B59B6) for normal, orange for busy
        .setImage(config_1.config.tickets.bannerUrl)
        .setFooter({ text: 'BET+ Support System' })
        .setTimestamp();
    const selectMenu = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('support:menu')
        .setPlaceholder('Select support type')
        .addOptions(new discord_js_1.StringSelectMenuOptionBuilder()
        .setLabel('General Support')
        .setValue('general')
        .setDescription('General support and questions'), new discord_js_1.StringSelectMenuOptionBuilder()
        .setLabel('Content Creator')
        .setValue('creator')
        .setDescription('Content creator support'), new discord_js_1.StringSelectMenuOptionBuilder()
        .setLabel('Claim Your Rank')
        .setValue('claim')
        .setDescription('Claim your rank'));
    const row = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
    await supportChannel.send({ embeds: [embed], components: [row] });
    await interaction.editReply(isBusyMode ? 'Support panel sent with busy mode notice.' : 'Support panel sent successfully.');
}
