"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dmallService = exports.DMAllService = void 0;
const logger_1 = require("../logger");
const config_1 = require("../config");
const dmall_embeds_1 = require("../embeds/dmall.embeds");
class DMAllService {
    abortController = null;
    isRunning = false;
    async sendMassDM(client, options, progressChannel) {
        if (this.isRunning) {
            throw new Error('Mass DM is already running');
        }
        this.isRunning = true;
        this.abortController = new AbortController();
        let sent = 0;
        let failed = 0;
        try {
            const guild = await client.guilds.fetch(config_1.config.dmall.serverId);
            logger_1.logger.info(`Fetching members from guild ${guild.name}...`);
            // Fetch all members
            const members = await guild.members.fetch();
            const totalMembers = members.size;
            logger_1.logger.info(`Fetched ${totalMembers} members. Starting mass DM...`);
            const embed = (0, dmall_embeds_1.buildDMAllEmbed)(options);
            const button = (0, dmall_embeds_1.buildDMAllButton)(options);
            for (const [_, member] of members) {
                if (this.abortController.signal.aborted) {
                    logger_1.logger.info('Mass DM aborted');
                    break;
                }
                // Skip bots
                if (member.user.bot) {
                    logger_1.logger.info(`Skipping bot ${member.user.tag}`);
                    continue;
                }
                try {
                    await member.send({
                        embeds: [embed],
                        components: button ? [button] : undefined,
                    });
                    sent++;
                    logger_1.logger.info(`DM sent to ${member.user.tag} (${sent}/${totalMembers})`);
                }
                catch (error) {
                    failed++;
                    logger_1.logger.error(`Failed to DM ${member.user.tag}: ${error.message}`);
                }
                // Rate limiting
                if (sent + failed < totalMembers) {
                    await this.sleep(config_1.config.dmall.cooldownMs);
                }
            }
            logger_1.logger.info(`Mass DM complete: ${sent} sent, ${failed} failed`);
            return { sent, failed };
        }
        catch (error) {
            logger_1.logger.error(`Mass DM failed: ${error.message}`);
            throw error;
        }
        finally {
            this.isRunning = false;
            this.abortController = null;
        }
    }
    abort() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }
    isActive() {
        return this.isRunning;
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.DMAllService = DMAllService;
exports.dmallService = new DMAllService();
