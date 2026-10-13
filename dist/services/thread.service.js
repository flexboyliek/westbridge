"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildReviewButtons = buildReviewButtons;
exports.canReviewApplication = canReviewApplication;
exports.createDiscussionThread = createDiscussionThread;
const application_repository_1 = require("../database/application.repository");
const application_embeds_1 = require("../embeds/application.embeds");
const logger_1 = require("../logger");
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
function buildReviewButtons(application) {
    const hasThread = Boolean(application.threadId);
    const discussStyle = hasThread ? discord_js_1.ButtonStyle.Secondary : discord_js_1.ButtonStyle.Primary;
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`app:discuss:${application.id}`)
        .setLabel('Discuss Application')
        .setEmoji('📝')
        .setStyle(discussStyle)
        .setDisabled(hasThread), new discord_js_1.ButtonBuilder()
        .setCustomId(`app:approve:${application.id}`)
        .setLabel('Approve')
        .setEmoji('✅')
        .setStyle(discord_js_1.ButtonStyle.Success)
        .setDisabled(!hasThread), new discord_js_1.ButtonBuilder()
        .setCustomId(`app:deny:${application.id}`)
        .setLabel('Deny')
        .setEmoji('❌')
        .setStyle(discord_js_1.ButtonStyle.Danger)
        .setDisabled(!hasThread));
}
function canReviewApplication(interaction) {
    if (!interaction.guild || interaction.guild.id !== config_1.config.staffServerId) {
        return false;
    }
    if (interaction.channelId !== config_1.config.pendingChannelId) {
        return false;
    }
    const member = interaction.member;
    if (!member || typeof member.permissions === 'string') {
        return false;
    }
    return member.permissions.has(discord_js_1.PermissionFlagsBits.ViewChannel);
}
async function createDiscussionThread(message, application) {
    if (application.threadId) {
        return application.threadId;
    }
    const parentChannel = message.channel;
    if (!parentChannel.isTextBased() || parentChannel.isDMBased()) {
        throw new Error('Cannot create a discussion thread outside a text channel.');
    }
    if (parentChannel.parentId !== config_1.config.applicationCategoryId) {
        logger_1.logger.warn(`Pending channel is not under the configured application category (${config_1.config.applicationCategoryId}).`);
    }
    const thread = await message.startThread({
        name: `Discuss • ${application.robloxUsername} • ${application.id}`,
        autoArchiveDuration: discord_js_1.ThreadAutoArchiveDuration.OneWeek,
        reason: `Staff discussion for application ${application.id}`,
    });
    await thread.send({
        content: '**Staff Discussion Thread**\nReview the applicant below before making a final decision.',
        embeds: [(0, application_embeds_1.buildThreadIntroEmbed)(application)],
    });
    await application_repository_1.applicationRepository.setThreadId(application.id, thread.id);
    logger_1.logger.info(`Discussion thread ${thread.id} created for application ${application.id}`);
    return thread.id;
}
