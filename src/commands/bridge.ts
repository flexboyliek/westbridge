import { 
  ChatInputCommandInteraction, 
  SlashCommandBuilder, 
  SlashCommandSubcommandBuilder,
  ChannelType,
  PermissionFlagsBits
} from 'discord.js';
import { bridgeService } from '../services/bridge.service';
import { whitelistService } from '../services/whitelist.service';
import { logger } from '../logger';
import type { BridgeConfig } from '../types/bridge';

const allowedUserIds = ['882066901772152874', '1183977890866544645'];

export const bridgeCommand = new SlashCommandBuilder()
  .setName('bridge')
  .setDescription('Manage the one-way voice bridge')
  .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
    subcommand
      .setName('setup')
      .setDescription('Configure the source and destination voice channels')
      .addChannelOption((option) =>
        option
          .setName('source_channel')
          .setDescription('The source voice channel (Server 1)')
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildVoice),
      )
      .addChannelOption((option) =>
        option
          .setName('destination_channel')
          .setDescription('The destination voice channel (Server 2)')
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildVoice),
      ),
  )
  .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
    subcommand
      .setName('start')
      .setDescription('Start the voice bridge'),
  )
  .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
    subcommand
      .setName('stop')
      .setDescription('Stop the voice bridge'),
  )
  .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
    subcommand
      .setName('status')
      .setDescription('Check the bridge status'),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function handleBridgeCommand(interaction: ChatInputCommandInteraction) {
  // Permission check
  if (!allowedUserIds.includes(interaction.user.id) && !whitelistService.isWhitelisted(interaction.user.id)) {
    await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    return;
  }

  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'setup':
      await handleSetup(interaction);
      break;
    case 'start':
      await handleStart(interaction);
      break;
    case 'stop':
      await handleStop(interaction);
      break;
    case 'status':
      await handleStatus(interaction);
      break;
  }
}

async function handleSetup(interaction: ChatInputCommandInteraction) {
  const sourceChannel = interaction.options.getChannel('source_channel', true);
  const destinationChannel = interaction.options.getChannel('destination_channel', true);

  // Type guard to ensure these are guild voice channels
  if (sourceChannel.type !== ChannelType.GuildVoice || destinationChannel.type !== ChannelType.GuildVoice) {
    await interaction.reply({ content: 'Both channels must be voice channels.', ephemeral: true });
    return;
  }

  // Cast to VoiceChannel after type check
  const sourceVoiceChannel = sourceChannel as any;
  const destVoiceChannel = destinationChannel as any;

  if (!sourceVoiceChannel.guildId || !destVoiceChannel.guildId) {
    await interaction.reply({ content: 'Invalid channel data.', ephemeral: true });
    return;
  }

  if (sourceVoiceChannel.guildId === destVoiceChannel.guildId) {
    await interaction.reply({ content: 'Source and destination channels must be in different servers.', ephemeral: true });
    return;
  }

  // Check bot permissions
  const sourceGuild = await interaction.client.guilds.fetch(sourceVoiceChannel.guildId);
  const destGuild = await interaction.client.guilds.fetch(destVoiceChannel.guildId);
  
  const sourceMember = await sourceGuild.members.fetchMe();
  const destMember = await destGuild.members.fetchMe();

  const sourceChannelObj = await sourceGuild.channels.fetch(sourceVoiceChannel.id);
  const destChannelObj = await destGuild.channels.fetch(destVoiceChannel.id);

  if (!sourceChannelObj || !sourceChannelObj.isVoiceBased()) {
    await interaction.reply({ content: 'Source channel is not accessible or not a voice channel.', ephemeral: true });
    return;
  }

  if (!destChannelObj || !destChannelObj.isVoiceBased()) {
    await interaction.reply({ content: 'Destination channel is not accessible or not a voice channel.', ephemeral: true });
    return;
  }

  if (!sourceMember.permissionsIn(sourceChannelObj).has('Connect')) {
    await interaction.reply({ content: 'Bot does not have permission to connect to the source channel.', ephemeral: true });
    return;
  }

  if (!destMember.permissionsIn(destChannelObj).has('Connect')) {
    await interaction.reply({ content: 'Bot does not have permission to connect to the destination channel.', ephemeral: true });
    return;
  }

  if (!destMember.permissionsIn(destChannelObj).has('Speak')) {
    await interaction.reply({ content: 'Bot does not have permission to speak in the destination channel.', ephemeral: true });
    return;
  }

  const config: BridgeConfig = {
    sourceGuildId: sourceVoiceChannel.guildId,
    sourceChannelId: sourceVoiceChannel.id,
    destinationGuildId: destVoiceChannel.guildId,
    destinationChannelId: destVoiceChannel.id,
  };

  bridgeService.setConfig(config);

  await interaction.reply({
    content: `✅ Bridge configured!\n\n**Source:** ${sourceChannelObj.name} (${sourceGuild.name})\n**Destination:** ${destChannelObj.name} (${destGuild.name})\n\nUse \`/bridge start\` to begin the bridge.`,
    ephemeral: true,
  });

  logger.info(`Bridge configured by ${interaction.user.tag}: ${sourceVoiceChannel.guildId}:${sourceVoiceChannel.id} -> ${destVoiceChannel.guildId}:${destVoiceChannel.id}`);
}

async function handleStart(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    await bridgeService.start();
    
    const config = bridgeService.getConfig();
    await interaction.editReply({
      content: `✅ Bridge started!\n\n**Source:** ${config?.sourceChannelId}\n**Destination:** ${config?.destinationChannelId}\n\nAudio from the source channel will now be relayed to the destination channel.`,
    });

    logger.info(`Bridge started by ${interaction.user.tag}`);
  } catch (error) {
    await interaction.editReply({
      content: `❌ Failed to start bridge: ${(error as Error).message}`,
    });
  }
}

async function handleStop(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    await bridgeService.stop();
    
    await interaction.editReply({
      content: '✅ Bridge stopped.',
    });

    logger.info(`Bridge stopped by ${interaction.user.tag}`);
  } catch (error) {
    await interaction.editReply({
      content: `❌ Failed to stop bridge: ${(error as Error).message}`,
    });
  }
}

async function handleStatus(interaction: ChatInputCommandInteraction) {
  const status = bridgeService.status;
  const config = bridgeService.getConfig();

  let statusText = `**Running:** ${status.isRunning ? '✅ Yes' : '❌ No'}\n\n`;
  
  if (config) {
    statusText += `**Source Guild:** ${config.sourceGuildId}\n`;
    statusText += `**Source Channel:** ${config.sourceChannelId}\n`;
    statusText += `**Destination Guild:** ${config.destinationGuildId}\n`;
    statusText += `**Destination Channel:** ${config.destinationChannelId}\n\n`;
  } else {
    statusText += `**Configuration:** Not set (use \`/bridge setup\`)\n\n`;
  }

  statusText += `**Source Connected:** ${status.sourceConnected ? '✅' : '❌'}\n`;
  statusText += `**Destination Connected:** ${status.destinationConnected ? '✅' : '❌'}\n`;
  statusText += `**Active Speakers:** ${status.activeSpeakers}\n`;

  if (status.error) {
    statusText += `\n**Error:** ${status.error}`;
  }

  await interaction.reply({
    content: statusText,
    ephemeral: true,
  });
}
