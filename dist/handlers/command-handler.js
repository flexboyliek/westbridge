"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandHandler = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const logger_1 = require("../logger");
const broadcast_dm_1 = require("../commands/broadcast-dm");
const whitelist_1 = require("../commands/whitelist");
const unwhitelist_1 = require("../commands/unwhitelist");
const application_dm_1 = require("../commands/application-dm");
const ban_1 = require("../commands/ban");
const kick_1 = require("../commands/kick");
const timeout_1 = require("../commands/timeout");
const warn_1 = require("../commands/warn");
const mute_1 = require("../commands/mute");
const unmute_1 = require("../commands/unmute");
const unban_1 = require("../commands/unban");
const nickname_1 = require("../commands/nickname");
const roleadd_1 = require("../commands/roleadd");
const roleremove_1 = require("../commands/roleremove");
class CommandHandler {
    client;
    commands = new discord_js_1.Collection();
    constructor(client) {
        this.client = client;
        this.commands.set(broadcast_dm_1.broadcastDmCommand.name, broadcast_dm_1.handleBroadcastDmCommand);
        this.commands.set(whitelist_1.whitelistCommand.name, whitelist_1.handleWhitelistCommand);
        this.commands.set(unwhitelist_1.unwhitelistCommand.name, unwhitelist_1.handleUnwhitelistCommand);
        this.commands.set(application_dm_1.applicationDmCommand.name, application_dm_1.handleApplicationDmCommand);
        this.commands.set(ban_1.banCommand.name, ban_1.handleBanCommand);
        this.commands.set(kick_1.kickCommand.name, kick_1.handleKickCommand);
        this.commands.set(timeout_1.timeoutCommand.name, timeout_1.handleTimeoutCommand);
        this.commands.set(warn_1.warnCommand.name, warn_1.handleWarnCommand);
        this.commands.set(mute_1.muteCommand.name, mute_1.handleMuteCommand);
        this.commands.set(unmute_1.unmuteCommand.name, unmute_1.handleUnmuteCommand);
        this.commands.set(unban_1.unbanCommand.name, unban_1.handleUnbanCommand);
        this.commands.set(nickname_1.nicknameCommand.name, nickname_1.handleNicknameCommand);
        this.commands.set(roleadd_1.roleAddCommand.name, roleadd_1.handleRoleAddCommand);
        this.commands.set(roleremove_1.roleRemoveCommand.name, roleremove_1.handleRoleRemoveCommand);
    }
    async registerSlashCommands() {
        const rest = new discord_js_1.REST({ version: '10' }).setToken(config_1.config.token);
        const applicationId = this.client.application?.id;
        if (!applicationId) {
            throw new Error('Application ID unavailable during command registration.');
        }
        logger_1.logger.info(`Application ID: ${applicationId}`);
        console.log(`Application ID: ${applicationId}`);
        // Clear existing global commands first
        try {
            logger_1.logger.info('Clearing existing global commands...');
            console.log('Clearing existing global commands...');
            await Promise.race([
                rest.put(discord_js_1.Routes.applicationCommands(applicationId), { body: [] }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Clear commands timeout')), 10000))
            ]);
            logger_1.logger.info('Existing global commands cleared.');
            console.log('Existing global commands cleared.');
        }
        catch (error) {
            logger_1.logger.error(`Failed to clear existing global commands: ${error.message}`);
            console.error(`Failed to clear existing global commands: ${error.message}`);
        }
        const commandPayload = [
            broadcast_dm_1.broadcastDmCommand.toJSON(),
            whitelist_1.whitelistCommand.toJSON(),
            unwhitelist_1.unwhitelistCommand.toJSON(),
            application_dm_1.applicationDmCommand.toJSON(),
            ban_1.banCommand.toJSON(),
            kick_1.kickCommand.toJSON(),
            timeout_1.timeoutCommand.toJSON(),
            warn_1.warnCommand.toJSON(),
            mute_1.muteCommand.toJSON(),
            unmute_1.unmuteCommand.toJSON(),
            unban_1.unbanCommand.toJSON(),
            nickname_1.nicknameCommand.toJSON(),
            roleadd_1.roleAddCommand.toJSON(),
            roleremove_1.roleRemoveCommand.toJSON(),
        ];
        logger_1.logger.info(`Registering ${commandPayload.length} global commands...`);
        console.log(`Registering ${commandPayload.length} global commands...`);
        try {
            await Promise.race([
                rest.put(discord_js_1.Routes.applicationCommands(applicationId), { body: commandPayload }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Register commands timeout')), 15000))
            ]);
            logger_1.logger.info('Global commands registered successfully.');
            console.log('Global commands registered successfully.');
        }
        catch (error) {
            logger_1.logger.error(`Failed to register global commands: ${error.message}`);
            console.error(`Failed to register global commands: ${error.message}`);
            throw error;
        }
    }
    async handle(interaction) {
        const handler = this.commands.get(interaction.commandName);
        if (!handler) {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply({ content: 'Unknown command.', ephemeral: true });
            }
            return;
        }
        try {
            await handler(interaction);
        }
        catch (error) {
            logger_1.logger.error(`Command handler failed: ${error.message}`);
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply({ content: 'An error occurred while executing this command.', ephemeral: true });
            }
        }
    }
}
exports.CommandHandler = CommandHandler;
