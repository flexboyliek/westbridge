import { ButtonInteraction, Client, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logger } from '../logger';
import { broadcastDmService } from '../services/broadcast-dm.service';
import { buildBroadcastDmEmbed, buildBroadcastDmProgressEmbed, buildBroadcastDmCompleteEmbed } from '../embeds/broadcast-dm.embeds';
import { getBroadcastCache, deleteBroadcastCache } from '../commands/broadcast-dm';

export class ButtonHandler {
  constructor(private client: Client) {}

  async handle(interaction: ButtonInteraction) {
    const customId = interaction.customId;

    if (customId.startsWith('broadcastdm:')) {
      await this.handleBroadcastDmButton(interaction, this.client);
      return;
    }

    logger.info(`Button clicked: ${customId}`);
  }

  private async handleBroadcastDmButton(interaction: ButtonInteraction, client: Client) {
    const action = interaction.customId.split(':')[1];
    const cached = getBroadcastCache(interaction.message.id);

    if (!cached) {
      await interaction.reply({ content: 'This preview expired. Run `/broadcastdm` again.', ephemeral: true });
      return;
    }

    if (action === 'cancel') {
      deleteBroadcastCache(interaction.message.id);
      await interaction.update({ content: 'Broadcast cancelled.', embeds: [], components: [], files: [] });
      return;
    }

    if (action !== 'confirm') {
      return;
    }

    if (broadcastDmService.isRunning) {
      await interaction.reply({ content: 'A broadcast is already running.', ephemeral: true });
      return;
    }

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

      await interaction.editReply({
        embeds: [buildBroadcastDmCompleteEmbed(result)],
      });
    } catch (error) {
      logger.error(`Broadcast DM run failed: ${(error as Error).message}`);
      await interaction.editReply({
        content: `Broadcast failed: ${(error as Error).message}`,
        embeds: [],
      });
    }
  }
}
