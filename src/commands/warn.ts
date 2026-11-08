import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { logger } from '../logger';

const MODERATION_ROLE_ID = '1569089572028026900';

const warnings = new Map<string, number>();

export const warnCommand = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('Warn a user')
  .addUserOption((option) =>
    option.setName('user')
      .setDescription('The user to warn')
      .setRequired(true),
  )
  .addStringOption((option) =>
    option.setName('reason')
      .setDescription('Reason for the warning')
      .setRequired(true),
  );

export async function handleWarnCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.member) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  const member = interaction.member as any;
  if (!member.roles.cache.has(MODERATION_ROLE_ID)) {
    await interaction.reply({ content: 'You must have the Westbridge Moderation role to use this command.', ephemeral: true });
    return;
  }

  const targetUser = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason', true);

  if (targetUser.id === interaction.client.user?.id) {
    await interaction.reply({ content: 'I cannot warn myself.', ephemeral: true });
    return;
  }

  if (targetUser.id === interaction.user.id) {
    await interaction.reply({ content: 'You cannot warn yourself.', ephemeral: true });
    return;
  }

  try {
    await interaction.deferReply({ ephemeral: true });

    const currentWarnings = warnings.get(targetUser.id) ?? 0;
    warnings.set(targetUser.id, currentWarnings + 1);

    logger.info(`User ${targetUser.tag} (${targetUser.id}) was warned by ${interaction.user.tag} (${interaction.user.id}) for: ${reason} (Total warnings: ${currentWarnings + 1})`);
    
    await interaction.editReply(`Successfully warned ${targetUser.tag}. Reason: ${reason}\nTotal warnings: ${currentWarnings + 1}`);

    if (interaction.guild) {
      try {
        await targetUser.send({
          content: `You have been warned in ${interaction.guild.name}.\nReason: ${reason}\nTotal warnings: ${currentWarnings + 1}`,
        }).catch(() => {
          logger.info(`Could not DM ${targetUser.tag} about warning`);
        });
      } catch (error) {
        logger.info(`Could not DM ${targetUser.tag} about warning`);
      }
    }
  } catch (error) {
    logger.error(`Warn command failed: ${(error as Error).message}`);
    await interaction.editReply(`Failed to warn user: ${(error as Error).message}`);
  }
}

export function getWarnings(userId: string): number {
  return warnings.get(userId) ?? 0;
}

export function clearWarnings(userId: string): void {
  warnings.delete(userId);
}
