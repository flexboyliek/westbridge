import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { config } from '../config';
import { whitelistService } from '../services/whitelist.service';

export const unwhitelistCommand = new SlashCommandBuilder()
  .setName('unwhitelist')
  .setDescription('Remove a user from the whitelist (owner only)')
  .addUserOption((option) =>
    option
      .setName('user')
      .setDescription('The user to unwhitelist')
      .setRequired(true),
  );

export async function handleUnwhitelistCommand(interaction: ChatInputCommandInteraction) {
  const allowedUserIds = ['882066901772152874', '1183977890866544645'];
  if (!allowedUserIds.includes(interaction.user.id)) {
    await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    return;
  }

  const targetUser = interaction.options.getUser('user');
  if (!targetUser) {
    await interaction.reply({ content: 'Invalid user.', ephemeral: true });
    return;
  }

  const removed = await whitelistService.removeUser(targetUser.id);
  
  if (removed) {
    await interaction.reply({
      content: `Successfully unwhitelisted ${targetUser.tag} (${targetUser.id})`,
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: `${targetUser.tag} is not whitelisted.`,
      ephemeral: true,
    });
  }
}
