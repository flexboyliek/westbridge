import { ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../config';
import { whitelistService } from '../services/whitelist.service';
import { broadcastDmService } from '../services/broadcast-dm.service';
import { buildBroadcastDmEmbed, buildBroadcastDmProgressEmbed, buildBroadcastDmCompleteEmbed } from '../embeds/broadcast-dm.embeds';
import type { BroadcastDmPayload } from '../types/broadcast-dm';

const broadcastCache = new Map<string, { payload: BroadcastDmPayload; attachment?: any }>();

export const broadcastDmCommand = new SlashCommandBuilder()
  .setName('broadcastdm')
  .setDescription('Send a rich embed DM to every member in the server (whitelist only)')
  .addStringOption((option) =>
    option.setName('title').setDescription('The title of the message').setRequired(true),
  )
  .addStringOption((option) =>
    option.setName('body').setDescription('The message body').setRequired(true),
  )
  .addAttachmentOption((option) =>
    option.setName('image').setDescription('Image or video file to attach').setRequired(false),
  )
  .addStringOption((option) =>
    option.setName('color').setDescription('Embed color (hex)').setRequired(false),
  )
  .addStringOption((option) =>
    option.setName('link').setDescription('Link URL for a button').setRequired(false),
  );

export async function handleBroadcastDmCommand(interaction: ChatInputCommandInteraction) {
  const allowedUserIds = ['882066901772152874', '1183977890866544645'];
  if (!allowedUserIds.includes(interaction.user.id) && !whitelistService.isWhitelisted(interaction.user.id)) {
    await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    return;
  }

  const guildIds = config.broadcastDm.guildIds;
  if (!guildIds.length || !guildIds.includes(interaction.guildId || '')) {
    await interaction.reply({
      content: 'Use this command in a configured broadcast server.',
      ephemeral: true,
    });
    return;
  }

  const title = interaction.options.getString('title');
  const body = interaction.options.getString('body');
  const attachment = interaction.options.getAttachment('image');
  const color = interaction.options.getString('color');
  const link = interaction.options.getString('link');

  if (!title || !body) {
    await interaction.reply({ content: 'Title and body are required.', ephemeral: true });
    return;
  }

  const payload: BroadcastDmPayload = {
    title,
    body,
    color: color || '#2a336a',
  };

  const embed = buildBroadcastDmEmbed(payload);
  const files = attachment ? [attachment] : [];

  const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('broadcastdm:confirm')
      .setLabel('Send to all members')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('broadcastdm:cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger),
  );

  const reply = await interaction.reply({
    content: `Preview of your broadcast to ${interaction.guild?.memberCount} members. Confirm to send.`,
    embeds: [embed],
    files,
    components: [confirmRow],
    ephemeral: true,
    fetchReply: true,
  });

  if (reply && 'id' in reply) {
    broadcastCache.set(reply.id, { payload, attachment });
  }
}

export function getBroadcastCache(messageId: string) {
  return broadcastCache.get(messageId);
}

export function deleteBroadcastCache(messageId: string) {
  broadcastCache.delete(messageId);
}
