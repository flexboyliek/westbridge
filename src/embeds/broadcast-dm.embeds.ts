import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import type { BroadcastDmPayload, BroadcastDmProgress } from '../types/broadcast-dm';

export function buildBroadcastDmEmbed(payload: BroadcastDmPayload): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(payload.title)
    .setDescription(payload.body)
    .setColor((payload.color || '#2a336a') as any)
    .setTimestamp();

  if (payload.author) {
    embed.setAuthor({ name: payload.author });
  }

  if (payload.footer) {
    embed.setFooter({ text: payload.footer });
  }

  if (payload.thumbnailUrl) {
    embed.setThumbnail(payload.thumbnailUrl);
  }

  if (payload.imageUrl) {
    embed.setImage(payload.imageUrl);
  }

  return embed;
}

export function buildBroadcastDmLinkRow(payload: BroadcastDmPayload): ActionRowBuilder<ButtonBuilder> | null {
  const linkUrl = payload.videoUrl || payload.linkUrl;
  const linkLabel = payload.videoUrl ? 'Watch Video' : payload.linkLabel;

  if (!linkLabel || !linkUrl) {
    return null;
  }

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setLabel(linkLabel).setStyle(ButtonStyle.Link).setURL(linkUrl),
  );
}

export function buildBroadcastDmPreviewEmbed(payload: BroadcastDmPayload): EmbedBuilder {
  return buildBroadcastDmEmbed(payload).setFooter({ text: 'Preview — confirm to send to all members' });
}

export function buildBroadcastDmProgressEmbed(progress: BroadcastDmProgress): EmbedBuilder {
  const processed = progress.sent + progress.failed;
  const eta =
    progress.etaMinutes === null
      ? 'Calculating…'
      : progress.etaMinutes <= 1
        ? 'Under 1 min'
        : `~${progress.etaMinutes} min`;

  return new EmbedBuilder()
    .setTitle('Broadcast DM in progress')
    .setColor('#5865F2')
    .addFields(
      { name: 'Target members', value: String(progress.total), inline: true },
      { name: 'Sent', value: String(progress.sent), inline: true },
      { name: 'Failed', value: String(progress.failed), inline: true },
      { name: 'Processed', value: `${processed} / ${progress.total}`, inline: true },
      { name: 'ETA', value: eta, inline: true },
      { name: 'Last member', value: progress.currentMember || '—', inline: false },
    )
    .setTimestamp();
}

export function buildBroadcastDmCompleteEmbed(result: import('../types/broadcast-dm').BroadcastDmResult): EmbedBuilder {
  const minutes = Math.max(1, Math.round(result.durationMs / 60000));

  const embed = new EmbedBuilder()
    .setTitle('Broadcast DM finished')
    .setColor('#57F287')
    .addFields(
      { name: 'Targeted', value: String(result.total), inline: true },
      { name: 'Delivered', value: String(result.sent), inline: true },
      { name: 'Failed', value: String(result.failed), inline: true },
      { name: 'Duration', value: `~${minutes} min`, inline: true },
    )
    .setTimestamp();

  if (result.skipped > 0) {
    embed.addFields({ name: 'DMs closed', value: String(result.skipped), inline: true });
  }

  return embed;
}
