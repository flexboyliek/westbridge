"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.robloxService = exports.RobloxService = void 0;
const logger_1 = require("../logger");
const config_1 = require("../config");
class RobloxService {
    async sendToGame(gameName, staffData) {
        if (!config_1.config.roblox.enabled) {
            logger_1.logger.info('Roblox integration disabled, skipping send');
            return false;
        }
        const gameConfig = config_1.config.roblox.games[gameName];
        if (!gameConfig || !gameConfig.webhookUrl) {
            logger_1.logger.warn(`No webhook URL configured for ${gameName}`);
            return false;
        }
        try {
            const payload = {
                source: 'discord-bot',
                boardId: staffData.boardId,
                roles: staffData.roles,
                timestamp: new Date().toISOString(),
            };
            const response = await fetch(gameConfig.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                logger_1.logger.error(`Roblox webhook failed: ${response.status} ${response.statusText}`);
                return false;
            }
            logger_1.logger.info(`Sent staff data to ${gameName}: ${staffData.roles.length} roles`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Roblox webhook error: ${error.message}`);
            return false;
        }
    }
    async sendToAllGames(staffDataMap) {
        for (const [gameName, staffData] of staffDataMap) {
            await this.sendToGame(gameName, staffData);
        }
    }
}
exports.RobloxService = RobloxService;
exports.robloxService = new RobloxService();
