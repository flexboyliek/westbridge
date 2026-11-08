import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { logger } from '../logger';
import { config } from '../config';

export const muteCommand = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Mute a user in the server')
  .addUserOption((option) =>
    option.setName('user')
      .setDescription('The user to mute')
      .setRequired(true),
  )
  .addStringOption((option) =>
    option.setName('reason')
      .setDescription('Reason for the mute')
      .setRequired(false),
  );

export async function handleMuteCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.member) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  const member = interaction.member as any;
  if (!member.roles.cache.has(config.moderation.roleId)) {
    await interaction.reply({ content: 'You must have the Westbridge Moderation role to use this command.', ephemeral: true });
    return;
  }

  const targetUser = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') ?? 'No reason provided';

  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  if (targetUser.id === interaction.client.user?.id) {
    await interaction.reply({ content: 'I cannot mute myself.', ephemeral: true });
    return;
  }

  if (targetUser.id === interaction.user.id) {
    await interaction.reply({ content: 'You cannot mute yourself.', ephemeral: true });
    return;
  }

  try {
    await interaction.deferReply({ ephemeral: true });

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    
    if (!targetMember) {
      await interaction.editReply('This user is not in the server.');
      return;
    }

    if (!targetMember.moderatable) {
      await interaction.editReply('I cannot mute this user. They may have a higher role than me.');
      return;
    }

    await targetMember.timeout(28 * 24 * 60 * 60 * 1000, `${reason} | Muted by ${interaction.user.tag}`);

    logger.info(`User ${targetUser.tag} (${targetUser.id}) was muted by ${interaction.user.tag} (${interaction.user.id}) for: ${reason}`);
    
    await interaction.editReply(`Successfully muted ${targetUser.tag}. Reason: ${reason}`);
  } catch (error) {
    logger.error(`Mute command failed: ${(error as Error).message}`);
    await interaction.editReply(`Failed to mute user: ${(error as Error).message}`);
  }
}
