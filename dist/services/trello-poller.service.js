"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrelloPollerService = void 0;
const logger_1 = require("../logger");
const config_1 = require("../config");
const trello_service_1 = require("./trello.service");
const roblox_service_1 = require("./roblox.service");
class TrelloPollerService {
    isRunning = false;
    interval = null;
    async start() {
        if (this.isRunning) {
            logger_1.logger.warn('Trello poller already running');
            return;
        }
        this.isRunning = true;
        logger_1.logger.info('Starting Trello poller...');
        await this.poll(); // Initial poll
        this.interval = setInterval(async () => {
            await this.poll();
        }, config_1.config.trello.pollIntervalMs);
        logger_1.logger.info(`Trello poller started (interval: ${config_1.config.trello.pollIntervalMs}ms)`);
    }
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isRunning = false;
        logger_1.logger.info('Trello poller stopped');
    }
    async poll() {
        try {
            logger_1.logger.info('Polling Trello boards...');
            await trello_service_1.trelloService.initialize();
            const staffDataMap = await trello_service_1.trelloService.getAllBoardsData();
            if (config_1.config.roblox.enabled) {
                await roblox_service_1.robloxService.sendToAllGames(staffDataMap);
            }
            else {
                logger_1.logger.info('Roblox integration disabled, skipping send');
            }
            logger_1.logger.info('Trello poll complete');
        }
        catch (error) {
            logger_1.logger.error(`Trello poll error: ${error.message}`);
        }
    }
}
exports.TrelloPollerService = TrelloPollerService;
