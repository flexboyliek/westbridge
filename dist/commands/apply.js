"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyCommand = void 0;
exports.handleApplyCommand = handleApplyCommand;
exports.handleTestModeButton = handleTestModeButton;
const application_repository_1 = require("../database/application.repository");
const application_embeds_1 = require("../embeds/application.embeds");
const config_1 = require("../config");
const discord_js_1 = require("discord.js");
exports.applyCommand = {
    name: 'apply',
    description: 'Start the Chaos Staff Intern Application (sent to your DMs).',
};
async function handleApplyCommand(interaction, dmSessionHandler, applicationService) {
    await interaction.deferReply({ ephemeral: true });
    const isBotOwner = interaction.user.id === config_1.config.botOwnerId;
    if (!isBotOwner) {
        const existing = await application_repository_1.applicationRepository.findPendingByUserId(interaction.user.id);
        if (existing) {
            await interaction.editReply(`You already have a pending application (**${existing.id}**). Please wait for management to review it.`);
            return;
        }
    }
    if (dmSessionHandler.hasActiveSession(interaction.user.id)) {
        await interaction.editReply('You already have an application in progress. Check your DMs.');
        return;
    }
    if (isBotOwner) {
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('test_mode:yes')
            .setLabel('Test Mode (Skip Questions)')
            .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
            .setCustomId('test_mode:no')
            .setLabel('Normal Mode (Answer Questions)')
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        await interaction.editReply({
            content: 'You are the bot owner. Would you like to use **Test Mode** to skip questions?',
            components: [row],
        });
        return;
    }
    try {
        const dmChannel = await interaction.user.createDM();
        await dmChannel.send({ embeds: [(0, application_embeds_1.buildDmWelcomeEmbed)()] });
        dmSessionHandler.startSession(interaction.user.id, interaction.user.tag);
        await interaction.editReply('Your application has started. Check your **DMs** to continue.');
    }
    catch {
        await interaction.editReply('I could not DM you. Please enable DMs from server members and try again.');
    }
}
async function handleTestModeButton(interaction, dmSessionHandler, applicationService) {
    await interaction.deferReply({ ephemeral: true });
    if (interaction.customId === 'test_mode:yes') {
        const testAnswers = {
            robloxUsername: 'TestUser123',
            timezone: 'EST (UTC-5)',
            dailyActivity: 10,
            previousExperience: 'Test - Previous moderation experience',
            professionalismAnswer: 'Test - Professionalism is important because...',
            ticketManagementAnswer: 'Test - I would manage tickets by...',
            bannedPlayerScenario: 'Test - I would handle this by...',
            exploitingScenario: 'Test - Step 1, Step 2, Step 3...',
            permanentPunishmentAnswer: 'Test - Permanent punishment should be used when...',
        };
        try {
            const application = await applicationService.submitApplication(interaction.user.id, interaction.user.tag, testAnswers);
            await interaction.editReply(`Test application submitted successfully! ID: **${application.id}**`);
        }
        catch (error) {
            await interaction.editReply(`Failed to submit test application: ${error.message}`);
        }
        return;
    }
    if (interaction.customId === 'test_mode:no') {
        try {
            const dmChannel = await interaction.user.createDM();
            await dmChannel.send({ embeds: [(0, application_embeds_1.buildDmWelcomeEmbed)()] });
            dmSessionHandler.startSession(interaction.user.id, interaction.user.tag);
            await interaction.editReply('Your application has started. Check your **DMs** to continue.');
        }
        catch {
            await interaction.editReply('I could not DM you. Please enable DMs from server members and try again.');
        }
    }
}
