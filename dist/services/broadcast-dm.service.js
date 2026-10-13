"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastDmService = exports.BroadcastDmService = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const logger_1 = require("../logger");
const broadcast_dm_embeds_1 = require("../embeds/broadcast-dm.embeds");
const OWNER_IDS = ['882066901772152874', '1183977890866544645'];
async function notifyOwners(client, message) {
    for (const ownerId of OWNER_IDS) {
        try {
            const user = await client.users.fetch(ownerId);
            await user.send(message);
        }
        catch (error) {
            logger_1.logger.warn(`Failed to notify owner ${ownerId}: ${error.message}`);
        }
    }
}
class BroadcastDmService {
    running = false;
    get isRunning() {
        return this.running;
    }
    async run(client, payload, attachment, onProgress) {
        if (this.running) {
            throw new Error('A broadcast is already running.');
        }
        this.running = true;
        const startedAt = Date.now();
        let sent = 0;
        let failed = 0;
        let skipped = 0;
        try {
            const guildIds = config_1.config.broadcastDm.guildIds;
            if (!guildIds.length) {
                throw new Error('BROADCAST_DM_GUILD_IDS (or BROADCAST_DM_GUILD_ID / DMALL_SERVER_ID / GUILD_ID) is not configured.');
            }
            const guildId = guildIds[0];
            const guild = await client.guilds.fetch(guildId);
            await guild.members.fetch();
            const recipients = [...guild.members.cache.values()].filter((member) => !member.user.bot);
            const total = recipients.length;
            const embed = (0, broadcast_dm_embeds_1.buildBroadcastDmEmbed)(payload);
            const linkRow = (0, broadcast_dm_embeds_1.buildBroadcastDmLinkRow)(payload);
            const files = attachment ? [attachment] : undefined;
            const messagePayload = {
                embeds: [embed],
                components: linkRow ? [linkRow] : undefined,
                files,
            };
            let index = 0;
            const pushProgress = async (currentMember) => {
                const processed = sent + failed;
                const remaining = Math.max(0, total - processed);
                const elapsedMs = Date.now() - startedAt;
                const avgMsPerMember = processed > 0 ? elapsedMs / processed : config_1.config.broadcastDm.delayMs;
                const etaMinutes = processed === 0 ? null : Math.ceil((remaining * avgMsPerMember) / 60000);
                await onProgress({
                    total,
                    sent,
                    failed,
                    skipped,
                    currentMember,
                    etaMinutes,
                });
            };
            await pushProgress('Preparing send queue…');
            for (const member of recipients) {
                index++;
                const tag = member.user.tag;
                try {
                    await this.sendWithRetry(member, messagePayload);
                    sent++;
                    logger_1.logger.info(`Broadcast DM sent to ${tag} (${sent}/${total})`);
                }
                catch (error) {
                    if (this.isDmClosedError(error)) {
                        skipped++;
                        logger_1.logger.warn(`Broadcast DM skipped for ${tag} (DMs closed)`);
                    }
                    else {
                        failed++;
                        logger_1.logger.warn(`Broadcast DM failed for ${tag}: ${error.message}`);
                    }
                }
                const shouldUpdate = index === total ||
                    index % config_1.config.broadcastDm.progressEvery === 0 ||
                    index === 1;
                if (shouldUpdate) {
                    await pushProgress(tag);
                }
                if (index < total) {
                    await sleep(config_1.config.broadcastDm.delayMs);
                }
            }
            return {
                total,
                sent,
                failed,
                skipped,
                durationMs: Date.now() - startedAt,
            };
        }
        finally {
            this.running = false;
        }
    }
    async sendWithRetry(member, payload) {
        const attempts = config_1.config.broadcastDm.maxRetries + 1;
        for (let attempt = 1; attempt <= attempts; attempt++) {
            try {
                await member.send(payload);
                return;
            }
            catch (error) {
                if (this.isDmClosedError(error)) {
                    throw error;
                }
                const waitMs = this.rateLimitWaitMs(error);
                if (waitMs !== null && attempt < attempts) {
                    logger_1.logger.warn(`Rate limited while DMing ${member.user.tag}, waiting ${waitMs}ms`);
                    await sleep(waitMs);
                    continue;
                }
                throw error;
            }
        }
    }
    isDmClosedError(error) {
        if (!(error instanceof discord_js_1.DiscordAPIError)) {
            return false;
        }
        return error.code === 50007 || error.code === 50001;
    }
    rateLimitWaitMs(error) {
        if (!(error instanceof discord_js_1.DiscordAPIError) || error.status !== 429) {
            return null;
        }
        const raw = error.rawError;
        const seconds = typeof raw?.retry_after === 'number' ? raw.retry_after : 5;
        return Math.ceil(seconds * 1000) + 300;
    }
}
exports.BroadcastDmService = BroadcastDmService;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.broadcastDmService = new BroadcastDmService();
