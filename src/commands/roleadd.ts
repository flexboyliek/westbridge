import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  Role,
} from 'discord.js';
import { logger } from '../logger';
import { config } from '../config';

export const roleAddCommand = new SlashCommandBuilder()
  .setName('roleadd')
  .setDescription('Add a role to a user')
  .addUserOption((option) =>
    option.setName('user')
      .setDescription('The user to add the role to')
      .setRequired(true),
  )
  .addRoleOption((option) =>
    option.setName('role')
      .setDescription('The role to add')
      .setRequired(true),
  )
  .addStringOption((option) =>
    option.setName('reason')
      .setDescription('Reason for adding the role')
      .setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

export async function handleRoleAddCommand(interaction: ChatInputCommandInteraction) {
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
  const role = interaction.options.getRole('role', true) as Role;
  const reason = interaction.options.getString('reason') ?? 'No reason provided';

  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  if (role.managed) {
    await interaction.reply({ content: 'I cannot add managed roles (bot roles, integration roles).', ephemeral: true });
    return;
  }

  if (role.position >= interaction.guild.members.me!.roles.highest.position) {
    await interaction.reply({ content: 'I cannot add roles that are higher than or equal to my highest role.', ephemeral: true });
    return;
  }

  try {
    await interaction.deferReply({ ephemeral: true });

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    
    if (!targetMember) {
      await interaction.editReply('This user is not in the server.');
      return;
    }

    if (!targetMember.manageable) {
      await interaction.editReply('I cannot add roles to this user. They may have a higher role than me.');
      return;
    }

    if (targetMember.roles.cache.has(role.id)) {
      await interaction.editReply('This user already has this role.');
      return;
    }

    await targetMember.roles.add(role, `${reason} | Role added by ${interaction.user.tag}`);

    logger.info(`Role ${role.name} (${role.id}) was added to ${targetUser.tag} (${targetUser.id}) by ${interaction.user.tag} (${interaction.user.id}) for: ${reason}`);
    
    await interaction.editReply(`Successfully added role ${role.name} to ${targetUser.tag}. Reason: ${reason}`);
  } catch (error) {
    logger.error(`Role add command failed: ${(error as Error).message}`);
    await interaction.editReply(`Failed to add role: ${(error as Error).message}`);
  }
}
