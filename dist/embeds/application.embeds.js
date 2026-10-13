"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPendingEmbed = buildPendingEmbed;
exports.buildApprovedEmbed = buildApprovedEmbed;
exports.buildDeniedEmbed = buildDeniedEmbed;
exports.buildThreadIntroEmbed = buildThreadIntroEmbed;
exports.buildDmWelcomeEmbed = buildDmWelcomeEmbed;
exports.buildDmCompleteEmbed = buildDmCompleteEmbed;
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const utils_1 = require("../utils");
const BRAND_COLOR = 0x1a1a2e;
const PENDING_COLOR = 0xf1c40f;
const APPROVED_COLOR = 0x57f287;
const DENIED_COLOR = 0xed4245;
function baseEmbed(application, color, statusLabel) {
    return new discord_js_1.EmbedBuilder()
        .setColor(color)
        .setTitle('Chaos Staff Intern Application')
        .setDescription('**Human Resources — Staff Recruitment**\nReview the applicant information below.')
        .setImage(config_1.config.applicationBannerUrl)
        .addFields({
        name: 'Applicant Information',
        inline: false,
        value: (0, utils_1.truncateText)([
            `**Discord:** ${application.discordUsername} (\`${application.discordUserId}\`)`,
            `**Roblox:** ${application.robloxUsername}`,
            `**Timezone:** ${application.timezone}`,
            `**Daily Activity:** ${application.dailyActivity}/10`,
        ].join('\n'), 1024),
    }, {
        name: 'Staff Experience',
        inline: false,
        value: (0, utils_1.truncateText)(application.previousExperience),
    }, {
        name: 'Professionalism',
        inline: false,
        value: (0, utils_1.truncateText)(application.professionalismAnswer),
    }, {
        name: 'Ticket Handling',
        inline: false,
        value: (0, utils_1.truncateText)(application.ticketManagementAnswer),
    }, {
        name: 'Banned Player Scenario',
        inline: false,
        value: (0, utils_1.truncateText)(application.bannedPlayerScenario),
    }, {
        name: 'Exploit Scenario',
        inline: false,
        value: (0, utils_1.truncateText)(application.exploitingScenario),
    }, {
        name: 'Permanent Punishment',
        inline: false,
        value: (0, utils_1.truncateText)(application.permanentPunishmentAnswer),
    }, {
        name: 'Status',
        inline: false,
        value: (0, utils_1.truncateText)(statusLabel, 256),
    })
        .setFooter({ text: `Application ID: ${application.id}` })
        .setTimestamp(new Date(application.createdAt));
}
function buildPendingEmbed(application) {
    const threadNote = application.threadId
        ? '✅ Discussion thread created — ready for review'
        : '⚠️ A discussion thread must be created before approval or denial';
    return baseEmbed(application, PENDING_COLOR, `⏳ **Pending Review**\n${threadNote}`);
}
function buildApprovedEmbed(application) {
    return new discord_js_1.EmbedBuilder()
        .setColor(APPROVED_COLOR)
        .setTitle('✅ Staff Intern Application Approved')
        .setImage(config_1.config.applicationBannerUrl)
        .setDescription('This application has been approved by management.')
        .addFields({ name: 'Discord Username', value: (0, utils_1.truncateText)(application.discordUsername, 256), inline: true }, { name: 'Roblox Username', value: (0, utils_1.truncateText)(application.robloxUsername, 256), inline: true }, { name: 'Timezone', value: (0, utils_1.truncateText)(application.timezone, 256), inline: true }, {
        name: 'Approved By',
        value: (0, utils_1.truncateText)(application.reviewerUsername ?? 'Unknown', 256),
        inline: true,
    }, {
        name: 'Approval Date',
        value: application.reviewedAt
            ? `<t:${Math.floor(new Date(application.reviewedAt).getTime() / 1000)}:F>`
            : 'Unknown',
        inline: true,
    }, { name: 'Application ID', value: application.id, inline: true })
        .setFooter({ text: 'Chaos Staff Recruitment' })
        .setTimestamp();
}
function buildDeniedEmbed(application) {
    return new discord_js_1.EmbedBuilder()
        .setColor(DENIED_COLOR)
        .setTitle('❌ Staff Intern Application Denied')
        .setImage(config_1.config.applicationBannerUrl)
        .setDescription('This application has been denied by management.')
        .addFields({ name: 'Discord Username', value: (0, utils_1.truncateText)(application.discordUsername, 256), inline: true }, { name: 'Roblox Username', value: (0, utils_1.truncateText)(application.robloxUsername, 256), inline: true }, { name: 'Timezone', value: (0, utils_1.truncateText)(application.timezone, 256), inline: true }, {
        name: 'Denied By',
        value: (0, utils_1.truncateText)(application.reviewerUsername ?? 'Unknown', 256),
        inline: true,
    }, {
        name: 'Denial Date',
        value: application.reviewedAt
            ? `<t:${Math.floor(new Date(application.reviewedAt).getTime() / 1000)}:F>`
            : 'Unknown',
        inline: true,
    }, { name: 'Application ID', value: application.id, inline: true })
        .setFooter({ text: 'Chaos Staff Recruitment' })
        .setTimestamp();
}
function buildThreadIntroEmbed(application) {
    return baseEmbed(application, BRAND_COLOR, '📝 **Under Discussion**');
}
function buildDmWelcomeEmbed() {
    return new discord_js_1.EmbedBuilder()
        .setColor(BRAND_COLOR)
        .setTitle('Chaos Staff Intern Application')
        .setDescription([
        'Welcome to the **Chaos Staff Intern Application**.',
        '',
        'You will be asked **9 questions** about your experience, professionalism, and moderation knowledge.',
        '',
        'Your Discord username and ID will be collected automatically.',
        '',
        'Reply to each question in this DM. You have **30 minutes** to complete the application.',
        '',
        'Type `cancel` at any time to stop.',
    ].join('\n'))
        .setImage(config_1.config.applicationBannerUrl)
        .setFooter({ text: 'Chaos Staff Recruitment' })
        .setTimestamp();
}
function buildDmCompleteEmbed(applicationId) {
    return new discord_js_1.EmbedBuilder()
        .setColor(APPROVED_COLOR)
        .setTitle('Application Submitted')
        .setDescription('Your Staff Intern Application has been submitted successfully and sent to management for review.')
        .addFields({ name: 'Application ID', value: applicationId })
        .setFooter({ text: 'Chaos Staff Recruitment' })
        .setTimestamp();
}
