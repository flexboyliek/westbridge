import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { logger } from '../logger';

const MODERATION_ROLE_ID = '1569089572028026900';

export const unbanCommand = new SlashCommandBuilder()
  .setName('unban')
  .setDescription('Unban a user from the server')
  .addStringOption((option) =>
    option.setName('user_id')
      .setDescription('The user ID to unban')
      .setRequired(true),
  )
  .addStringOption((option) =>
    option.setName('reason')
      .setDescription('Reason for the unban')
      .setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function handleUnbanCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.member) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  const member = interaction.member as any;
  if (!member.roles.cache.has(MODERATION_ROLE_ID)) {
    await interaction.reply({ content: 'You must have the Westbridge Moderation role to use this command.', ephemeral: true });
    return;
  }

  const userId = interaction.options.getString('user_id', true);
  const reason = interaction.options.getString('reason') ?? 'No reason provided';

  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  try {
    await interaction.deferReply({ ephemeral: true });

    const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
    
    if (!ban) {
      await interaction.editReply('This user is not banned.');
      return;
    }

    await interaction.guild.bans.remove(userId, `${reason} | Unbanned by ${interaction.user.tag}`);

    logger.info(`User ${userId} was unbanned by ${interaction.user.tag} (${interaction.user.id}) for: ${reason}`);
    
    await interaction.editReply(`Successfully unbanned user ${userId}. Reason: ${reason}`);
  } catch (error) {
    logger.error(`Unban command failed: ${(error as Error).message}`);
    await interaction.editReply(`Failed to unban user: ${(error as Error).message}`);
  }
}
