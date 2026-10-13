import {
  Client,
  GatewayIntentBits,
  Partials,
} from 'discord.js';
import { config } from '../config';
import { logger } from '../logger';
import { ButtonHandler } from '../handlers/button-handler';
import { CommandHandler } from '../handlers/command-handler';

export class BotClient {
  readonly client: Client;
  private readonly commandHandler: CommandHandler;
  private readonly buttonHandler: ButtonHandler;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Channel, Partials.Message],
    });

    this.commandHandler = new CommandHandler(this.client);
    this.buttonHandler = new ButtonHandler(this.client);

    this.setupEvents();
  }

  async start() {
    await this.client.login(config.token);
  }

  private setupEvents() {
    this.client.once('ready', async () => {
      logger.info(`Bot is online as ${this.client.user?.tag ?? 'unknown'}`);
      console.log(`Bot is online as ${this.client.user?.tag ?? 'unknown'}`);
      logger.info(`Attempting to register slash commands...`);
      console.log(`Attempting to register slash commands...`);
      try {
        await this.commandHandler.registerSlashCommands();
        logger.info(`Slash commands registered successfully.`);
        console.log(`Slash commands registered successfully.`);
      } catch (error) {
        logger.error(`Failed to register slash commands: ${(error as Error).message}`);
        console.error(`Failed to register slash commands: ${(error as Error).message}`);
      }
    });

    this.client.on('interactionCreate', async (interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          await this.commandHandler.handle(interaction);
          return;
        }

        if (interaction.isButton()) {
          await this.buttonHandler.handle(interaction);
          return;
        }
      } catch (error) {
        logger.error(`Interaction failed: ${(error as Error).message}`);
      }
    });
  }
}
