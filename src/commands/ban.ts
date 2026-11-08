import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { logger } from '../logger';
import { config } from '../config';

export const banCommand = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Ban a user from the server')
  .addUserOption((option) =>
    option.setName('user')
      .setDescription('The user to ban')
      .setRequired(true),
  )
  .addStringOption((option) =>
    option.setName('reason')
      .setDescription('Reason for the ban')
      .setRequired(false),
  )
  .addIntegerOption((option) =>
    option.setName('delete_days')
      .setDescription('Delete messages from the past X days (0-7)')
      .setRequired(false)
      .setMinValue(0)
      .setMaxValue(7),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function handleBanCommand(interaction: ChatInputCommandInteraction) {
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
  const deleteDays = interaction.options.getInteger('delete_days') ?? 0;

  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  if (targetUser.id === interaction.client.user?.id) {
    await interaction.reply({ content: 'I cannot ban myself.', ephemeral: true });
    return;
  }

  if (targetUser.id === interaction.user.id) {
    await interaction.reply({ content: 'You cannot ban yourself.', ephemeral: true });
    return;
  }

  try {
    await interaction.deferReply({ ephemeral: true });

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    
    if (targetMember) {
      if (!targetMember.bannable) {
        await interaction.editReply('I cannot ban this user. They may have a higher role than me.');
        return;
      }
    }

    await interaction.guild.bans.create(targetUser.id, {
      reason: `${reason} | Banned by ${interaction.user.tag}`,
      deleteMessageDays: deleteDays,
    });

    logger.info(`User ${targetUser.tag} (${targetUser.id}) was banned by ${interaction.user.tag} (${interaction.user.id}) for: ${reason}`);
    
    await interaction.editReply(`Successfully banned ${targetUser.tag} for: ${reason}`);
  } catch (error) {
    logger.error(`Ban command failed: ${(error as Error).message}`);
    await interaction.editReply(`Failed to ban user: ${(error as Error).message}`);
  }
}
