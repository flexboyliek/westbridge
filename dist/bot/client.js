"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotClient = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const logger_1 = require("../logger");
const button_handler_1 = require("../handlers/button-handler");
const command_handler_1 = require("../handlers/command-handler");
const application_dm_1 = require("../commands/application-dm");
const bridge_service_1 = require("../services/bridge.service");
class BotClient {
    client;
    commandHandler;
    buttonHandler;
    constructor() {
        this.client = new discord_js_1.Client({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.GuildMembers,
                discord_js_1.GatewayIntentBits.DirectMessages,
                discord_js_1.GatewayIntentBits.MessageContent,
                discord_js_1.GatewayIntentBits.GuildVoiceStates,
            ],
            partials: [discord_js_1.Partials.Channel, discord_js_1.Partials.Message],
        });
        this.commandHandler = new command_handler_1.CommandHandler(this.client);
        this.buttonHandler = new button_handler_1.ButtonHandler(this.client);
        this.setupEvents();
    }
    async start() {
        await this.client.login(config_1.config.token);
    }
    setupEvents() {
        this.client.once('ready', async () => {
            logger_1.logger.info(`Bot is online as ${this.client.user?.tag ?? 'unknown'}`);
            console.log(`Bot is online as ${this.client.user?.tag ?? 'unknown'}`);
            // Initialize bridge service with client
            (0, bridge_service_1.initializeBridgeService)(this.client);
            logger_1.logger.info(`Attempting to register slash commands...`);
            console.log(`Attempting to register slash commands...`);
            try {
                await this.commandHandler.registerSlashCommands();
                logger_1.logger.info(`Slash commands registered successfully.`);
                console.log(`Slash commands registered successfully.`);
            }
            catch (error) {
                logger_1.logger.error(`Failed to register slash commands: ${error.message}`);
                console.error(`Failed to register slash commands: ${error.message}`);
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
                if (interaction.isModalSubmit()) {
                    if (interaction.customId === 'applicationdm:custom') {
                        await (0, application_dm_1.handleApplicationDmModal)(interaction);
                        return;
                    }
                }
            }
            catch (error) {
                logger_1.logger.error(`Interaction failed: ${error.message}`);
            }
        });
    }
}
exports.BotClient = BotClient;
