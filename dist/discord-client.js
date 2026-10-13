"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotClient = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("./config");
const logger_1 = require("./logger");
class BotClient {
    client;
    constructor() {
        this.client = new discord_js_1.Client({
            intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages],
            partials: [discord_js_1.Partials.Channel],
        });
        this.setupEvents();
    }
    async start() {
        await this.client.login(config_1.config.token);
    }
    setupEvents() {
        this.client.once('ready', async () => {
            logger_1.logger.info(`Bot is online as ${this.client.user?.tag ?? 'unknown'}`);
            console.log(`Bot is online as ${this.client.user?.tag ?? 'unknown'}`);
            await this.clearCommands();
        });
        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand()) {
                return;
            }
            // Add slash command handlers here.
        });
    }
    async clearCommands() {
        const applicationId = this.client.application?.id;
        if (!applicationId) {
            return;
        }
        const rest = new discord_js_1.REST({ version: '10' }).setToken(config_1.config.token);
        const existingCommands = (await rest.get(discord_js_1.Routes.applicationCommands(applicationId)));
        await Promise.all(existingCommands.map((command) => rest.delete(discord_js_1.Routes.applicationCommand(applicationId, command.id))));
        logger_1.logger.info('Cleared old slash commands.');
    }
}
exports.BotClient = BotClient;
