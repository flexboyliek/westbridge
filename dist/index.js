"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const logger_1 = require("./logger");
const client_1 = require("./bot/client");
const utils_1 = require("./utils");
const whitelist_service_1 = require("./services/whitelist.service");
async function main() {
    if (!config_1.config.token) {
        throw new Error('DISCORD_TOKEN is required.');
    }
    (0, utils_1.acquireProcessLock)();
    // Load whitelist data
    await whitelist_service_1.whitelistService.load();
    logger_1.logger.info('Whitelist data loaded.');
    const bot = new client_1.BotClient();
    logger_1.logger.info('Bot initialization started.');
    await bot.start();
    // Graceful shutdown handlers
    const shutdown = async (signal) => {
        logger_1.logger.info(`Received ${signal}, shutting down gracefully...`);
        console.log(`Received ${signal}, shutting down gracefully...`);
        try {
            // Destroy Discord client
            bot.client.destroy();
            logger_1.logger.info('Discord client destroyed.');
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error(`Error during shutdown: ${error.message}`);
            process.exit(1);
        }
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
main().catch((error) => {
    logger_1.logger.error(`Startup failure: ${error.message}`);
    console.error(error);
    process.exit(1);
});
