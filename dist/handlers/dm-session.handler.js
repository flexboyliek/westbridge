"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DmSessionHandler = void 0;
const questions_1 = require("../constants/questions");
const config_1 = require("../config");
const application_embeds_1 = require("../embeds/application.embeds");
const logger_1 = require("../logger");
class DmSessionHandler {
    client;
    applicationService;
    sessions = new Map();
    noSessionNotices = new Map();
    constructor(client, applicationService) {
        this.client = client;
        this.applicationService = applicationService;
    }
    hasActiveSession(userId) {
        return this.sessions.has(userId);
    }
    startSession(userId, discordUsername) {
        this.clearSession(userId);
        const timeout = setTimeout(() => {
            void this.expireSession(userId);
        }, config_1.config.dmSessionTimeoutMs);
        this.sessions.set(userId, {
            userId,
            discordUsername,
            step: 0,
            answers: {},
            startedAt: new Date(),
            timeout,
        });
        void this.sendCurrentQuestion(userId);
    }
    async handleDirectMessage(message) {
        if (message.author.bot || !message.channel.isDMBased()) {
            return;
        }
        const session = this.sessions.get(message.author.id);
        if (!session) {
            await this.notifyMissingSession(message);
            return;
        }
        const content = message.content.trim();
        if (!content) {
            return;
        }
        if (content.toLowerCase() === 'cancel') {
            this.clearSession(message.author.id);
            await message.reply('Your application has been cancelled.');
            return;
        }
        const question = questions_1.APPLICATION_QUESTIONS[session.step];
        const validationError = question.validate?.(content) ?? null;
        if (validationError) {
            await message.reply(validationError);
            return;
        }
        if (question.key === 'dailyActivity') {
            session.answers.dailyActivity = Number.parseInt(content, 10);
        }
        else {
            session.answers[question.key] = content;
        }
        session.step += 1;
        if (session.step >= questions_1.APPLICATION_QUESTIONS.length) {
            await this.completeSession(message, session);
            return;
        }
        await this.sendCurrentQuestion(message.author.id);
    }
    async notifyMissingSession(message) {
        const lastNotice = this.noSessionNotices.get(message.author.id) ?? 0;
        if (Date.now() - lastNotice < 60_000) {
            return;
        }
        this.noSessionNotices.set(message.author.id, Date.now());
        await message.reply('You do not have an active application session. Run `/apply` in the server to start one.');
    }
    async sendCurrentQuestion(userId) {
        const session = this.sessions.get(userId);
        if (!session) {
            return;
        }
        const question = questions_1.APPLICATION_QUESTIONS[session.step];
        const user = await this.client.users.fetch(userId);
        await user.send(question.prompt);
    }
    async completeSession(message, session) {
        const answers = session.answers;
        let application;
        try {
            application = await this.applicationService.submitApplication(session.userId, session.discordUsername, answers);
        }
        catch (error) {
            logger_1.logger.error(`Failed to submit application: ${error.message}`);
            await message.reply(`Your application could not be submitted: ${error.message}`);
            this.clearSession(session.userId);
            return;
        }
        try {
            await message.reply({ embeds: [(0, application_embeds_1.buildDmCompleteEmbed)(application.id)] });
        }
        catch (error) {
            logger_1.logger.error(`Application saved but confirmation DM failed: ${error.message}`);
            await message.reply(`Your application was submitted successfully. Application ID: **${application.id}**`);
        }
        logger_1.logger.info(`DM application completed for ${session.discordUsername} (${application.id})`);
        this.clearSession(session.userId);
    }
    async expireSession(userId) {
        if (!this.sessions.has(userId)) {
            return;
        }
        this.clearSession(userId);
        try {
            const user = await this.client.users.fetch(userId);
            await user.send('Your application session expired due to inactivity. Run `/apply` to start again.');
        }
        catch {
            // User DMs may be closed.
        }
    }
    clearSession(userId) {
        const session = this.sessions.get(userId);
        if (session) {
            clearTimeout(session.timeout);
            this.sessions.delete(userId);
        }
    }
}
exports.DmSessionHandler = DmSessionHandler;
