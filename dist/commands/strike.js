"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strikeCommand = void 0;
exports.handleStrikeCommand = handleStrikeCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
const strikes_service_1 = require("../services/strikes.service");
exports.strikeCommand = new discord_js_1.SlashCommandBuilder()
    .setName('strike')
    .setDescription('Issue a strike to a staff member')
    .addUserOption((option) => option.setName('user')
    .setDescription('The staff member to strike')
    .setRequired(true))
    .addStringOption((option) => option.setName('reason')
    .setDescription('Reason for the strike')
    .setRequired(true));
async function handleStrikeCommand(interaction) {
    // Check if user is allowed
    if (!config_1.config.strikes.allowedUserIds.includes(interaction.user.id)) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
    }
    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    await interaction.deferReply({ ephemeral: true });
    try {
        const result = await strikes_service_1.strikesService.addStrike(targetUser.username, reason);
        let message = `Strike issued to ${targetUser.username}. New strike count: ${result.newStrikeCount}/${config_1.config.strikes.maxStrikes}. Reason: ${reason}`;
        if (result.isFired) {
            message += `\n\n⚠️ **STAFF MEMBER HAS REACHED MAXIMUM STRIKES** ⚠️`;
            // Send DM to bot owner with confirmation buttons
            const botOwner = await interaction.client.users.fetch(config_1.config.botOwnerId);
            const embed = {
                title: '⚠️ Staff Member Reached 3 Strikes',
                description: `${targetUser.username} has reached the maximum strike count and should be fired.`,
                fields: [
                    { name: 'Staff Member', value: targetUser.username, inline: true },
                    { name: 'Position', value: result.staffMember.position, inline: true },
                    { name: 'Roblox Username', value: result.staffMember.robloxUsername, inline: true },
                    { name: 'Strike Count', value: `${result.newStrikeCount}/${config_1.config.strikes.maxStrikes}`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                ],
                color: 0xFF0000,
            };
            const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(`strike:fire:${targetUser.id}`)
                .setLabel('🔥 Fire & Remove')
                .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
                .setCustomId(`strike:keep:${targetUser.id}`)
                .setLabel('🛡️ Keep (Clear Strikes)')
                .setStyle(discord_js_1.ButtonStyle.Success));
            await botOwner.send({ embeds: [embed], components: [buttons] });
        }
        await interaction.editReply(message);
    }
    catch (error) {
        logger_1.logger.error(`Strike command failed: ${error.message}`);
        await interaction.editReply(`Error: ${error.message}`);
    }
}
