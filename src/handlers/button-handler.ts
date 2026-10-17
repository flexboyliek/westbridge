import { ButtonInteraction, Client, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logger } from '../logger';
import { broadcastDmService } from '../services/broadcast-dm.service';
import { buildBroadcastDmEmbed, buildBroadcastDmProgressEmbed, buildBroadcastDmCompleteEmbed } from '../embeds/broadcast-dm.embeds';
import { getBroadcastCache, deleteBroadcastCache } from '../commands/broadcast-dm';
import { getApplicationDmCache, deleteApplicationDmCache } from '../commands/application-dm';

export class ButtonHandler {
  constructor(private client: Client) {}

  async handle(interaction: ButtonInteraction) {
    const customId = interaction.customId;

    if (customId.startsWith('broadcastdm:')) {
      await this.handleBroadcastDmButton(interaction, this.client);
      return;
    }

    if (customId.startsWith('applicationdm:')) {
      await this.handleApplicationDmButton(interaction, this.client);
      return;
    }

    logger.info(`Button clicked: ${customId}`);
  }

  private async handleBroadcastDmButton(interaction: ButtonInteraction, client: Client) {
    const action = interaction.customId.split(':')[1];
    const cached = getBroadcastCache(interaction.message.id);

    logger.info(`Broadcast DM button clicked by ${interaction.user.tag}: ${action}`);

    if (!cached) {
      logger.warn(`Broadcast DM preview expired for ${interaction.user.tag}`);
      await interaction.reply({ content: 'This preview expired. Run `/broadcastdm` again.', ephemeral: true });
      return;
    }

    if (action === 'cancel') {
      logger.info(`Broadcast DM cancelled by ${interaction.user.tag}`);
      deleteBroadcastCache(interaction.message.id);
      await interaction.update({ content: 'Broadcast cancelled.', embeds: [], components: [], files: [] });
      return;
    }

    if (action !== 'confirm') {
      return;
    }

    if (broadcastDmService.isRunning) {
      logger.warn(`Broadcast DM already running, denied for ${interaction.user.tag}`);
      await interaction.reply({ content: 'A broadcast is already running.', ephemeral: true });
      return;
    }

    logger.info(`Broadcast DM confirmed by ${interaction.user.tag}. Title: "${cached.payload.title}"`);
    await interaction.deferUpdate();
    deleteBroadcastCache(interaction.message.id);

    await interaction.editReply({
      content: null,
      embeds: [
        buildBroadcastDmProgressEmbed({
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
      const result = await broadcastDmService.run(client, cached.payload, cached.attachment, async (progress) => {
        await interaction.editReply({
          embeds: [buildBroadcastDmProgressEmbed(progress)],
        });
      });

      logger.info(`Broadcast DM completed by ${interaction.user.tag}. Sent: ${result.sent}, Failed: ${result.failed}, Skipped: ${result.skipped}`);
      
      // Notify owners of completion
      const ownerIds = ['882066901772152874', '1183977890866544645'];
      for (const ownerId of ownerIds) {
        try {
          const user = await client.users.fetch(ownerId);
          await user.send(`✅ **Broadcast DM Completed**\n\nUser: ${interaction.user.tag}\nTitle: ${cached.payload.title}\nSent: ${result.sent}\nFailed: ${result.failed}\nSkipped: ${result.skipped}\nDuration: ${Math.round(result.durationMs / 1000)}s`);
        } catch (error) {
          logger.warn(`Failed to notify owner ${ownerId}: ${(error as Error).message}`);
        }
      }

      await interaction.editReply({
        embeds: [buildBroadcastDmCompleteEmbed(result)],
      });
    } catch (error) {
      logger.error(`Broadcast DM run failed for ${interaction.user.tag}: ${(error as Error).message}`);
      await interaction.editReply({
        content: `Broadcast failed: ${(error as Error).message}`,
        embeds: [],
      });
    }
  }

  private async handleApplicationDmButton(interaction: ButtonInteraction, client: Client) {
    const action = interaction.customId.split(':')[1];
    const cached = getApplicationDmCache(interaction.user.id);

    if (!cached) {
      await interaction.reply({ content: 'This session expired. Run `/applicationdm` again.', ephemeral: true });
      return;
    }

    if (action === 'cancel') {
      deleteApplicationDmCache(interaction.user.id);
      await interaction.update({ content: 'Application DM cancelled.', embeds: [], components: [] });
      return;
    }

    if (action !== 'confirm') {
      return;
    }

    await interaction.deferUpdate();
    deleteApplicationDmCache(interaction.user.id);

    try {
      const recipient = await client.users.fetch(cached.recipientId);
      await recipient.send(cached.customMessage || '');

      logger.info(`Application DM sent by ${cached.staffName} to ${recipient.tag}. Type: ${cached.type}`);
      
      await interaction.editReply({
        content: `✅ Successfully sent DM to ${recipient.tag}!`,
        embeds: [],
        components: [],
      });
    } catch (error) {
      logger.error(`Application DM failed for ${cached.recipientId}: ${(error as Error).message}`);
      
      await interaction.editReply({
        content: `❌ Failed to send DM. The user may have DMs disabled or has blocked the bot.`,
        embeds: [],
        components: [],
      });
    }
  }
}
