import { 
  ChatInputCommandInteraction, 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder
} from 'discord.js';
import { config } from '../config';
import { whitelistService } from '../services/whitelist.service';
import { logger } from '../logger';

const dmCache = new Map<string, { 
  type: string; 
  recipientId: string; 
  customMessage?: string;
  staffId: string;
  staffName: string;
}>();

export const applicationDmCommand = new SlashCommandBuilder()
  .setName('applicationdm')
  .setDescription('Send application notifications to members (staff only)')
  .addStringOption((option) =>
    option.setName('type')
      .setDescription('Type of notification to send')
      .setRequired(true)
      .addChoices(
        { name: 'Application Being Reviewed', value: 'review' },
        { name: 'Check Your Email', value: 'email' },
        { name: 'Custom Message', value: 'custom' },
      ),
  )
  .addUserOption((option) =>
    option.setName('recipient')
      .setDescription('The member to send the notification to')
      .setRequired(true),
  );

export async function handleApplicationDmCommand(interaction: ChatInputCommandInteraction) {
  const allowedUserIds = ['882066901772152874', '1183977890866544645'];
  if (!allowedUserIds.includes(interaction.user.id) && !whitelistService.isWhitelisted(interaction.user.id)) {
    await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    return;
  }

  const type = interaction.options.getString('type');
  const recipient = interaction.options.getUser('recipient');

  if (!type || !recipient) {
    await interaction.reply({ content: 'Type and recipient are required.', ephemeral: true });
    return;
  }

  if (recipient.bot) {
    await interaction.reply({ content: 'Cannot send DMs to bots.', ephemeral: true });
    return;
  }

  if (type === 'custom') {
    const modal = new ModalBuilder()
      .setCustomId('applicationdm:custom')
      .setTitle('Custom Application Message')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('message')
            .setLabel('Your custom message')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(4000),
        ),
      );

    dmCache.set(interaction.user.id, { type, recipientId: recipient.id, staffId: interaction.user.id, staffName: interaction.user.tag });
    await interaction.showModal(modal);
    return;
  }

  const messages: Record<string, string> = {
    review: '**Application Update**\n\nHello! We wanted to let you know that your application is currently being reviewed by our team. Please remain patient while we complete the review process.\n\nThank you for your interest in joining our team!',
    email: '**Westbridge Innovation Academy — Application Received**\n\nGreetings!\n\nThank you for submitting your application to Westbridge Innovation Academy! We are pleased to confirm that **your application has been received** and is currently awaiting review.\n\nOur administration team will be reaching out with a response soon. In the meantime, please **check your website mainbox and dashboard regularly** for updates, notifications, and any additional information regarding your application.\n\nWe appreciate your interest in joining the Westbridge Lions family and thank you for your patience throughout the hiring process!\n\nSincerely,\n**Westbridge Innovation Academy Administration 🦁**',
  };

  const message = messages[type];
  dmCache.set(interaction.user.id, { type, recipientId: recipient.id, customMessage: message, staffId: interaction.user.id, staffName: interaction.user.tag });

  const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('applicationdm:confirm')
      .setLabel('Confirm & Send')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('applicationdm:cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger),
  );

  await interaction.reply({
    content: `Are you sure you want to send this message to ${recipient}?`,
    embeds: [{
      title: 'Message Preview',
      description: message,
      color: 0x5865F2,
    }],
    components: [confirmRow],
    ephemeral: true,
  });
}

export async function handleApplicationDmModal(interaction: any) {
  const cached = dmCache.get(interaction.user.id);
  
  if (!cached) {
    await interaction.reply({ content: 'Session expired. Run `/applicationdm` again.', ephemeral: true });
    return;
  }

  const customMessage = interaction.fields.getTextInputValue('message');
  cached.customMessage = customMessage;
  dmCache.set(interaction.user.id, cached);

  const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('applicationdm:confirm')
      .setLabel('Confirm & Send')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('applicationdm:cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger),
  );

  await interaction.reply({
    content: `Are you sure you want to send this custom message?`,
    embeds: [{
      title: 'Custom Message Preview',
      description: customMessage,
      color: 0x5865F2,
    }],
    components: [confirmRow],
    ephemeral: true,
  });
}

export function getApplicationDmCache(userId: string) {
  return dmCache.get(userId);
}

export function deleteApplicationDmCache(userId: string) {
  dmCache.delete(userId);
}
