"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DMAllLoggerService = void 0;
const logger_1 = require("../logger");
const config_1 = require("../config");
const dmall_embeds_1 = require("../embeds/dmall.embeds");
class DMAllLoggerService {
    client;
    constructor(client) {
        this.client = client;
    }
    async log(entry) {
        try {
            const logChannel = await this.client.channels.fetch(config_1.config.dmall.logChannelId);
            if (!logChannel || !logChannel.isTextBased() || logChannel.isDMBased()) {
                logger_1.logger.error('Log channel not found or is not text-based');
                return;
            }
            const embed = (0, dmall_embeds_1.buildLogEmbed)(entry);
            await logChannel.send({ embeds: [embed] });
            logger_1.logger.info(`DM All operation logged by ${entry.initiatorTag}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to log DM All operation: ${error.message}`);
        }
    }
}
exports.DMAllLoggerService = DMAllLoggerService;
