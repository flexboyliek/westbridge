import { Client, DiscordAPIError, GuildMember, MessageCreateOptions } from 'discord.js';
import { config } from '../config';
import { logger } from '../logger';
import {
  buildBroadcastDmEmbed,
  buildBroadcastDmLinkRow,
} from '../embeds/broadcast-dm.embeds';
import type { BroadcastDmPayload, BroadcastDmProgress, BroadcastDmResult } from '../types/broadcast-dm';

export class BroadcastDmService {
  private running = false;

  get isRunning(): boolean {
    return this.running;
  }

  async run(
    client: Client,
    payload: BroadcastDmPayload,
    attachment: any,
    onProgress: (progress: BroadcastDmProgress) => Promise<void>,
  ): Promise<BroadcastDmResult> {
    if (this.running) {
      throw new Error('A broadcast is already running.');
    }

    this.running = true;
    const startedAt = Date.now();

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    try {
      const guildIds = config.broadcastDm.guildIds;
      if (!guildIds.length) {
        throw new Error('BROADCAST_DM_GUILD_IDS (or BROADCAST_DM_GUILD_ID / DMALL_SERVER_ID / GUILD_ID) is not configured.');
      }
      const guildId = guildIds[0];

      const guild = await client.guilds.fetch(guildId);
      await guild.members.fetch();

      const recipients = [...guild.members.cache.values()].filter((member) => !member.user.bot);
      const total = recipients.length;

      const embed = buildBroadcastDmEmbed(payload);
      const linkRow = buildBroadcastDmLinkRow(payload);
      const files = attachment ? [attachment] : undefined;
      const messagePayload: MessageCreateOptions = {
        embeds: [embed],
        components: linkRow ? [linkRow] : undefined,
        files,
      };

      let index = 0;

      const pushProgress = async (currentMember: string) => {
        const processed = sent + failed;
        const remaining = Math.max(0, total - processed);
        const elapsedMs = Date.now() - startedAt;
        const avgMsPerMember = processed > 0 ? elapsedMs / processed : config.broadcastDm.delayMs;
        const etaMinutes =
          processed === 0 ? null : Math.ceil((remaining * avgMsPerMember) / 60000);

        await onProgress({
          total,
          sent,
          failed,
          skipped,
          currentMember,
          etaMinutes,
        });
      };

      await pushProgress('Preparing send queue…');

      for (const member of recipients) {
        index++;
        const tag = member.user.tag;

        try {
          await this.sendWithRetry(member, messagePayload);
          sent++;
        } catch (error) {
          if (this.isDmClosedError(error)) {
            skipped++;
          } else {
            failed++;
            logger.warn(`Broadcast DM failed for ${tag}: ${(error as Error).message}`);
          }
        }

        const shouldUpdate =
          index === total ||
          index % config.broadcastDm.progressEvery === 0 ||
          index === 1;

        if (shouldUpdate) {
          await pushProgress(tag);
        }

        if (index < total) {
          await sleep(config.broadcastDm.delayMs);
        }
      }

      return {
        total,
        sent,
        failed,
        skipped,
        durationMs: Date.now() - startedAt,
      };
    } finally {
      this.running = false;
    }
  }

  private async sendWithRetry(member: GuildMember, payload: MessageCreateOptions): Promise<void> {
    const attempts = config.broadcastDm.maxRetries + 1;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        await member.send(payload);
        return;
      } catch (error) {
        if (this.isDmClosedError(error)) {
          throw error;
        }

        const waitMs = this.rateLimitWaitMs(error);
        if (waitMs !== null && attempt < attempts) {
          logger.warn(`Rate limited while DMing ${member.user.tag}, waiting ${waitMs}ms`);
          await sleep(waitMs);
          continue;
        }

        throw error;
      }
    }
  }

  private isDmClosedError(error: unknown): boolean {
    if (!(error instanceof DiscordAPIError)) {
      return false;
    }
    return error.code === 50007 || error.code === 50001;
  }

  private rateLimitWaitMs(error: unknown): number | null {
    if (!(error instanceof DiscordAPIError) || error.status !== 429) {
      return null;
    }

    const raw = error.rawError as { retry_after?: number } | undefined;
    const seconds = typeof raw?.retry_after === 'number' ? raw.retry_after : 5;

    return Math.ceil(seconds * 1000) + 300;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const broadcastDmService = new BroadcastDmService();
