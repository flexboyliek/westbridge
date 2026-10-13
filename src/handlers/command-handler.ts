import {
  ChatInputCommandInteraction,
  Client,
  Collection,
  REST,
  Routes,
} from 'discord.js';
import { config } from '../config';
import { logger } from '../logger';
import { broadcastDmCommand, handleBroadcastDmCommand } from '../commands/broadcast-dm';
import { whitelistCommand, handleWhitelistCommand } from '../commands/whitelist';
import { unwhitelistCommand, handleUnwhitelistCommand } from '../commands/unwhitelist';

type CommandHandlerFn = (
  interaction: ChatInputCommandInteraction,
) => Promise<void>;

export class CommandHandler {
  private readonly commands = new Collection<string, CommandHandlerFn>();

  constructor(private readonly client: Client) {
    this.commands.set(broadcastDmCommand.name, handleBroadcastDmCommand);
    this.commands.set(whitelistCommand.name, handleWhitelistCommand);
    this.commands.set(unwhitelistCommand.name, handleUnwhitelistCommand);
  }

  async registerSlashCommands() {
    const rest = new REST({ version: '10' }).setToken(config.token);
    const applicationId = this.client.application?.id;

    if (!applicationId) {
      throw new Error('Application ID unavailable during command registration.');
    }

    logger.info(`Application ID: ${applicationId}`);
    console.log(`Application ID: ${applicationId}`);

    // Clear existing global commands first
    try {
      logger.info('Clearing existing global commands...');
      console.log('Clearing existing global commands...');
      await Promise.race([
        rest.put(Routes.applicationCommands(applicationId), { body: [] }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Clear commands timeout')), 10000))
      ]);
      logger.info('Existing global commands cleared.');
      console.log('Existing global commands cleared.');
    } catch (error) {
      logger.error(`Failed to clear existing global commands: ${(error as Error).message}`);
      console.error(`Failed to clear existing global commands: ${(error as Error).message}`);
    }

    const commandPayload: any[] = [
      broadcastDmCommand.toJSON(),
      whitelistCommand.toJSON(),
      unwhitelistCommand.toJSON(),
    ];

    logger.info(`Registering ${commandPayload.length} global commands...`);
    console.log(`Registering ${commandPayload.length} global commands...`);

    try {
      await Promise.race([
        rest.put(Routes.applicationCommands(applicationId), { body: commandPayload }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Register commands timeout')), 15000))
      ]);
      logger.info('Global commands registered successfully.');
      console.log('Global commands registered successfully.');
    } catch (error) {
      logger.error(`Failed to register global commands: ${(error as Error).message}`);
      console.error(`Failed to register global commands: ${(error as Error).message}`);
      throw error;
    }
  }

  async handle(interaction: ChatInputCommandInteraction) {
    const handler = this.commands.get(interaction.commandName);
    if (!handler) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply({ content: 'Unknown command.', ephemeral: true });
      }
      return;
    }

    try {
      await handler(interaction);
    } catch (error) {
      logger.error(`Command handler failed: ${(error as Error).message}`);
      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply({ content: 'An error occurred while executing this command.', ephemeral: true });
      }
    }
  }
}
