"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ButtonHandler = void 0;
const logger_1 = require("../logger");
const broadcast_dm_service_1 = require("../services/broadcast-dm.service");
const broadcast_dm_embeds_1 = require("../embeds/broadcast-dm.embeds");
const broadcast_dm_1 = require("../commands/broadcast-dm");
class ButtonHandler {
    client;
    constructor(client) {
        this.client = client;
    }
    async handle(interaction) {
        const customId = interaction.customId;
        if (customId.startsWith('broadcastdm:')) {
            await this.handleBroadcastDmButton(interaction, this.client);
            return;
        }
        logger_1.logger.info(`Button clicked: ${customId}`);
    }
    async handleBroadcastDmButton(interaction, client) {
        const action = interaction.customId.split(':')[1];
        const cached = (0, broadcast_dm_1.getBroadcastCache)(interaction.message.id);
        logger_1.logger.info(`Broadcast DM button clicked by ${interaction.user.tag}: ${action}`);
        if (!cached) {
            logger_1.logger.warn(`Broadcast DM preview expired for ${interaction.user.tag}`);
            await interaction.reply({ content: 'This preview expired. Run `/broadcastdm` again.', ephemeral: true });
            return;
        }
        if (action === 'cancel') {
            logger_1.logger.info(`Broadcast DM cancelled by ${interaction.user.tag}`);
            (0, broadcast_dm_1.deleteBroadcastCache)(interaction.message.id);
            await interaction.update({ content: 'Broadcast cancelled.', embeds: [], components: [], files: [] });
            return;
        }
        if (action !== 'confirm') {
            return;
        }
        if (broadcast_dm_service_1.broadcastDmService.isRunning) {
            logger_1.logger.warn(`Broadcast DM already running, denied for ${interaction.user.tag}`);
            await interaction.reply({ content: 'A broadcast is already running.', ephemeral: true });
            return;
        }
        logger_1.logger.info(`Broadcast DM confirmed by ${interaction.user.tag}. Title: "${cached.payload.title}"`);
        await interaction.deferUpdate();
        (0, broadcast_dm_1.deleteBroadcastCache)(interaction.message.id);
        await interaction.editReply({
            content: null,
            embeds: [
                (0, broadcast_dm_embeds_1.buildBroadcastDmProgressEmbed)({
                    total: 0,
                    sent: 0,
                    failed: 0,
                    skipped: 0,
                    currentMember: 'Loading members…',
                    etaMinutes: null,
                }),
            ],
            components: [],
            files: [],
        });
        try {
            const result = await broadcast_dm_service_1.broadcastDmService.run(client, cached.payload, cached.attachment, async (progress) => {
                await interaction.editReply({
                    embeds: [(0, broadcast_dm_embeds_1.buildBroadcastDmProgressEmbed)(progress)],
                });
            });
            logger_1.logger.info(`Broadcast DM completed by ${interaction.user.tag}. Sent: ${result.sent}, Failed: ${result.failed}, Skipped: ${result.skipped}`);
            // Notify owners of completion
            const ownerIds = ['882066901772152874', '1183977890866544645'];
            for (const ownerId of ownerIds) {
                try {
                    const user = await client.users.fetch(ownerId);
                    await user.send(`✅ **Broadcast DM Completed**\n\nUser: ${interaction.user.tag}\nTitle: ${cached.payload.title}\nSent: ${result.sent}\nFailed: ${result.failed}\nSkipped: ${result.skipped}\nDuration: ${Math.round(result.durationMs / 1000)}s`);
                }
                catch (error) {
                    logger_1.logger.warn(`Failed to notify owner ${ownerId}: ${error.message}`);
                }
            }
            await interaction.editReply({
                embeds: [(0, broadcast_dm_embeds_1.buildBroadcastDmCompleteEmbed)(result)],
            });
        }
        catch (error) {
            logger_1.logger.error(`Broadcast DM run failed for ${interaction.user.tag}: ${error.message}`);
            await interaction.editReply({
                content: `Broadcast failed: ${error.message}`,
                embeds: [],
            });
        }
    }
}
exports.ButtonHandler = ButtonHandler;
