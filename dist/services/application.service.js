"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationService = void 0;
const config_1 = require("../config");
const application_repository_1 = require("../database/application.repository");
const application_embeds_1 = require("../embeds/application.embeds");
const logger_1 = require("../logger");
const application_id_1 = require("../utils/application-id");
const thread_service_1 = require("./thread.service");
class ApplicationService {
    client;
    constructor(client) {
        this.client = client;
    }
    async submitApplication(discordUserId, discordUsername, answers) {
        if (discordUserId !== config_1.config.botOwnerId) {
            const existing = await application_repository_1.applicationRepository.findPendingByUserId(discordUserId);
            if (existing) {
                throw new Error(`You already have a pending application (**${existing.id}**). Please wait for management to review it.`);
            }
        }
        const application = await application_repository_1.applicationRepository.create((0, application_id_1.generateApplicationId)(), discordUserId, discordUsername, answers);
        const pendingChannel = await this.client.channels.fetch(config_1.config.pendingChannelId);
        if (!pendingChannel || !pendingChannel.isTextBased() || pendingChannel.isDMBased()) {
            throw new Error('Pending review channel is unavailable.');
        }
        const message = await pendingChannel.send({
            embeds: [(0, application_embeds_1.buildPendingEmbed)(application)],
            components: [(0, thread_service_1.buildReviewButtons)(application)],
        });
        await application_repository_1.applicationRepository.setPendingMessageId(application.id, message.id);
        logger_1.logger.info(`Application ${application.id} submitted by ${discordUsername}`);
        return application;
    }
    async refreshPendingMessage(applicationId) {
        const application = await application_repository_1.applicationRepository.findById(applicationId);
        if (!application?.pendingMessageId) {
            return;
        }
        const channel = await this.client.channels.fetch(config_1.config.pendingChannelId);
        if (!channel?.isTextBased() || channel.isDMBased()) {
            return;
        }
        const message = await channel.messages.fetch(application.pendingMessageId).catch(() => null);
        if (!message) {
            return;
        }
        const updated = await application_repository_1.applicationRepository.findById(applicationId);
        if (!updated) {
            return;
        }
        await message.edit({
            embeds: [(0, application_embeds_1.buildPendingEmbed)(updated)],
            components: [(0, thread_service_1.buildReviewButtons)(updated)],
        });
    }
    async approveApplication(applicationId, reviewerId, reviewerUsername) {
        const application = await application_repository_1.applicationRepository.findById(applicationId);
        if (!application || application.status !== 'pending') {
            throw new Error('Application not found or already reviewed.');
        }
        if (!application.threadId) {
            throw new Error('A discussion thread must be created before approval.');
        }
        await application_repository_1.applicationRepository.setReviewed(applicationId, 'approved', reviewerId, reviewerUsername);
        const reviewed = await application_repository_1.applicationRepository.findById(applicationId);
        if (!reviewed) {
            throw new Error('Failed to retrieve updated application.');
        }
        await this.removePendingMessage(application);
        await this.sendToChannel(config_1.config.approvedChannelId, (0, application_embeds_1.buildApprovedEmbed)(reviewed));
        logger_1.logger.info(`Application ${applicationId} approved by ${reviewerUsername}`);
        return reviewed;
    }
    async denyApplication(applicationId, reviewerId, reviewerUsername) {
        const application = await application_repository_1.applicationRepository.findById(applicationId);
        if (!application || application.status !== 'pending') {
            throw new Error('Application not found or already reviewed.');
        }
        if (!application.threadId) {
            throw new Error('A discussion thread must be created before denial.');
        }
        await application_repository_1.applicationRepository.setReviewed(applicationId, 'denied', reviewerId, reviewerUsername);
        const reviewed = await application_repository_1.applicationRepository.findById(applicationId);
        if (!reviewed) {
            throw new Error('Failed to retrieve updated application.');
        }
        await this.removePendingMessage(application);
        await this.sendToChannel(config_1.config.deniedChannelId, (0, application_embeds_1.buildDeniedEmbed)(reviewed));
        logger_1.logger.info(`Application ${applicationId} denied by ${reviewerUsername}`);
        return reviewed;
    }
    async removePendingMessage(application) {
        if (!application.pendingMessageId) {
            return;
        }
        const channel = await this.client.channels.fetch(config_1.config.pendingChannelId);
        if (!channel?.isTextBased() || channel.isDMBased()) {
            return;
        }
        const message = await channel.messages.fetch(application.pendingMessageId).catch(() => null);
        await message?.delete().catch(() => undefined);
    }
    async sendToChannel(channelId, embed) {
        const channel = await this.client.channels.fetch(channelId);
        if (!channel?.isTextBased() || channel.isDMBased()) {
            throw new Error(`Channel ${channelId} is unavailable.`);
        }
        await channel.send({ embeds: [embed] });
    }
}
exports.ApplicationService = ApplicationService;
