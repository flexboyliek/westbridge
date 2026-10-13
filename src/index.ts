import { config } from './config';
import { logger } from './logger';
import { BotClient } from './bot/client';
import { acquireProcessLock } from './utils';
import { whitelistService } from './services/whitelist.service';

async function main() {
  if (!config.token) {
    throw new Error('DISCORD_TOKEN is required.');
  }

  acquireProcessLock();

  // Load whitelist data
  await whitelistService.load();
  logger.info('Whitelist data loaded.');

  const bot = new BotClient();
  logger.info('Bot initialization started.');
  await bot.start();

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    console.log(`Received ${signal}, shutting down gracefully...`);
    
    try {
      // Destroy Discord client
      bot.client.destroy();
      logger.info('Discord client destroyed.');
      
      process.exit(0);
    } catch (error) {
      logger.error(`Error during shutdown: ${(error as Error).message}`);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  logger.error(`Startup failure: ${(error as Error).message}`);
  console.error(error);
  process.exit(1);
});
