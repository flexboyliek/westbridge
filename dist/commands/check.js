"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCommand = void 0;
exports.handleCheckCommand = handleCheckCommand;
const discord_js_1 = require("discord.js");
const ticket_activity_service_1 = require("../services/ticket-activity.service");
const config_1 = require("../config");
exports.checkCommand = new discord_js_1.SlashCommandBuilder()
    .setName('check')
    .setDescription('Check staff ticket activity for inactivity tracking')
    .addUserOption(option => option.setName('user')
    .setDescription('Check a specific user\'s activity (optional)')
    .setRequired(false))
    .addBooleanOption(option => option.setName('all')
    .setDescription('Show all staff activity (optional)')
    .setRequired(false));
async function handleCheckCommand(interaction) {
    await interaction.deferReply();
    try {
        const targetUser = interaction.options.getUser('user');
        const showAll = interaction.options.getBoolean('all') || false;
        // Check if user is bot owner or has management role
        const isBotOwner = interaction.user.id === config_1.config.botOwnerId;
        const hasManagementRole = interaction.member &&
            'roles' in interaction.member &&
            interaction.member.roles.cache.some((role) => config_1.config.tickets.managementRoles.includes(role.id));
        if (!isBotOwner && !hasManagementRole) {
            await interaction.editReply('You do not have permission to check staff activity.');
            return;
        }
        if (targetUser) {
            // Show specific user's activity
            const activity = ticket_activity_service_1.ticketActivityService.getUserActivity(targetUser.id);
            if (!activity) {
                await interaction.editReply(`${targetUser.username} has no ticket activity recorded.`);
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`📊 ${targetUser.username}'s Ticket Activity`)
                .addFields({ name: '🎫 Tickets Claimed', value: activity.ticketsClaimed.toString(), inline: true }, { name: '✅ Tickets Closed', value: activity.ticketsClosed.toString(), inline: true }, { name: '📊 Total Handled', value: (activity.ticketsClaimed + activity.ticketsClosed).toString(), inline: true }, { name: '🕐 Last Activity', value: new Date(activity.lastActivity).toLocaleString(), inline: true }, { name: '⏱️ Avg Response Time', value: activity.responseCount > 0 ? `${activity.averageResponseTime} min` : 'N/A', inline: true })
                .setColor(0x5865F2)
                .setTimestamp();
            // Show recent history (last 10 entries)
            if (activity.history.length > 0) {
                const recentHistory = activity.history.slice(-10).reverse();
                const historyText = recentHistory.map(entry => {
                    const date = new Date(entry.timestamp).toLocaleString();
                    const ticketInfo = entry.ticketId ? ` (${entry.ticketId})` : '';
                    const responseInfo = entry.responseTime ? ` | ⏱️ ${entry.responseTime}min` : '';
                    return `${entry.action.toUpperCase()}: ${date}${ticketInfo}${responseInfo}`;
                }).join('\n');
                embed.addFields({ name: '📜 Recent Activity', value: historyText || 'No recent activity' });
            }
            await interaction.editReply({ embeds: [embed] });
        }
        else if (showAll) {
            // Show all staff activity
            const allActivity = ticket_activity_service_1.ticketActivityService.getActivityData();
            if (allActivity.length === 0) {
                await interaction.editReply('No ticket activity recorded yet.');
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('📊 All Staff Ticket Activity')
                .setDescription('Sorted by total tickets handled')
                .setColor(0x5865F2)
                .setTimestamp();
            const activityText = allActivity.map((activity, index) => {
                const total = activity.ticketsClaimed + activity.ticketsClosed;
                const lastActive = new Date(activity.lastActivity).toLocaleDateString();
                return `${index + 1}. **${activity.username}** - ${total} tickets (${activity.ticketsClaimed} claimed, ${activity.ticketsClosed} closed) - Last: ${lastActive}`;
            }).join('\n');
            // Discord has a 4096 character limit for embed fields
            if (activityText.length > 4000) {
                embed.addFields({ name: 'Activity', value: activityText.slice(0, 4000) + '\n... (truncated)' });
            }
            else {
                embed.addFields({ name: 'Activity', value: activityText });
            }
            await interaction.editReply({ embeds: [embed] });
        }
        else {
            // Show top 10 staff by activity
            const topActivity = ticket_activity_service_1.ticketActivityService.getActivityData().slice(0, 10);
            if (topActivity.length === 0) {
                await interaction.editReply('No ticket activity recorded yet.');
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('📊 Top 10 Staff by Ticket Activity')
                .setDescription('Sorted by total tickets handled')
                .setColor(0x5865F2)
                .setTimestamp();
            const activityText = topActivity.map((activity, index) => {
                const total = activity.ticketsClaimed + activity.ticketsClosed;
                const lastActive = new Date(activity.lastActivity).toLocaleDateString();
                return `${index + 1}. **${activity.username}** - ${total} tickets (${activity.ticketsClaimed} claimed, ${activity.ticketsClosed} closed) - Last: ${lastActive}`;
            }).join('\n');
            embed.addFields({ name: 'Activity', value: activityText });
            await interaction.editReply({ embeds: [embed] });
        }
    }
    catch (error) {
        console.error('Check command error:', error);
        console.error('Error stack:', error.stack);
        await interaction.editReply(`An error occurred while checking activity: ${error.message}`);
    }
}
