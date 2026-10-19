import { Client, VoiceState, Guild } from 'discord.js';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnection,
  AudioPlayer,
  getVoiceConnection,
} from '@discordjs/voice';
import { logger } from '../logger';
import type { BridgeConfig, BridgeStatus, BridgeState } from '../types/bridge';

/**
 * IMPORTANT TECHNICAL LIMITATION:
 * 
 * Discord.js voice receiving (receiving audio from users) is NOT officially supported by Discord.
 * The @discordjs/voice library's VoiceReceiver functionality is experimental and may:
 * - Not work consistently across different Discord client versions
 * - Break without warning when Discord updates their voice protocol
 * - Have compatibility issues with certain audio formats
 * - Not handle encrypted voice traffic reliably
 * 
 * This implementation uses the experimental receiver functionality. It may fail or stop working
 * at any time due to Discord changes. This is a known limitation of Discord bot voice receiving.
 * 
 * For production use, consider using a dedicated voice bridge solution or official Discord
 * features when they become available.
 */

export class BridgeService {
  private state: BridgeState = {
    config: null,
    isRunning: false,
    sourceConnection: null,
    destinationConnection: null,
    receiver: null,
    audioPlayer: null,
    activeSpeakers: new Map(),
  };

  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  get isRunning(): boolean {
    return this.state.isRunning;
  }

  get status(): BridgeStatus {
    return {
      isRunning: this.state.isRunning,
      sourceGuildId: this.state.config?.sourceGuildId,
      sourceChannelId: this.state.config?.sourceChannelId,
      destinationGuildId: this.state.config?.destinationGuildId,
      destinationChannelId: this.state.config?.destinationChannelId,
      sourceConnected: !!this.state.sourceConnection,
      destinationConnected: !!this.state.destinationConnection,
      activeSpeakers: this.state.activeSpeakers.size,
      error: undefined,
    };
  }

  setConfig(config: BridgeConfig): void {
    this.state.config = config;
    logger.info(`Bridge config set: ${config.sourceGuildId}:${config.sourceChannelId} -> ${config.destinationGuildId}:${config.destinationChannelId}`);
  }

  getConfig(): BridgeConfig | null {
    return this.state.config;
  }

  async start(): Promise<void> {
    if (this.state.isRunning) {
      throw new Error('Bridge is already running');
    }

    if (!this.state.config) {
      throw new Error('Bridge configuration not set. Use /bridge setup first.');
    }

    const { sourceGuildId, sourceChannelId, destinationGuildId, destinationChannelId } = this.state.config;

    logger.info('Starting bridge...');

    try {
      // Validate channels exist and bot has permissions
      const sourceGuild = await this.client.guilds.fetch(sourceGuildId);
      const sourceChannel = await sourceGuild.channels.fetch(sourceChannelId);
      const destGuild = await this.client.guilds.fetch(destinationGuildId);
      const destChannel = await destGuild.channels.fetch(destinationChannelId);

      if (!sourceChannel || !sourceChannel.isVoiceBased()) {
        throw new Error('Source channel is not a voice channel');
      }
      if (!destChannel || !destChannel.isVoiceBased()) {
        throw new Error('Destination channel is not a voice channel');
      }

      // Check bot permissions
      const sourceMember = await sourceGuild.members.fetchMe();
      const destMember = await destGuild.members.fetchMe();

      if (!sourceMember.permissionsIn(sourceChannel).has('Connect')) {
        throw new Error('Bot does not have permission to connect to source channel');
      }
      if (!destMember.permissionsIn(destChannel).has('Connect')) {
        throw new Error('Bot does not have permission to connect to destination channel');
      }
      if (!destMember.permissionsIn(destChannel).has('Speak')) {
        throw new Error('Bot does not have permission to speak in destination channel');
      }

      // Connect to source voice channel
      logger.info(`Connecting to source channel: ${sourceChannelId}`);
      this.state.sourceConnection = joinVoiceChannel({
        channelId: sourceChannelId,
        guildId: sourceGuildId,
        adapterCreator: sourceGuild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: true,
      });

      // Connect to destination voice channel
      logger.info(`Connecting to destination channel: ${destinationChannelId}`);
      this.state.destinationConnection = joinVoiceChannel({
        channelId: destinationChannelId,
        guildId: destinationGuildId,
        adapterCreator: destGuild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: false,
      });

      // Create audio player for destination
      this.state.audioPlayer = createAudioPlayer();
      this.state.destinationConnection.subscribe(this.state.audioPlayer);

      // Set up voice receiver (experimental)
      // Note: VoiceReceiver is experimental and may not work reliably
      if (this.state.sourceConnection.receiver) {
        this.state.receiver = this.state.sourceConnection.receiver;
        
        // Subscribe to speaking users
        this.state.sourceConnection.on('speaking', (userId: string) => {
          this.handleUserSpeaking(userId);
        });

        this.state.sourceConnection.on('voiceStateUpdate', (oldState: VoiceState, newState: VoiceState) => {
          this.handleVoiceStateUpdate(oldState, newState);
        });
      }

      this.state.isRunning = true;
      logger.info('Bridge started successfully');
    } catch (error) {
      logger.error(`Failed to start bridge: ${(error as Error).message}`);
      await this.cleanup();
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.state.isRunning) {
      logger.warn('Bridge is not running');
      return;
    }

    logger.info('Stopping bridge...');
    await this.cleanup();
    this.state.isRunning = false;
    logger.info('Bridge stopped');
  }

  private async cleanup(): Promise<void> {
    // Stop audio player
    if (this.state.audioPlayer) {
      this.state.audioPlayer.stop();
      this.state.audioPlayer = null;
    }

    // Disconnect from source
    if (this.state.sourceConnection) {
      this.state.sourceConnection.disconnect();
      this.state.sourceConnection.destroy();
      this.state.sourceConnection = null;
    }

    // Disconnect from destination
    if (this.state.destinationConnection) {
      this.state.destinationConnection.disconnect();
      this.state.destinationConnection.destroy();
      this.state.destinationConnection = null;
    }

    // Clear active speakers
    this.state.activeSpeakers.clear();
    this.state.receiver = null;
  }

  private handleUserSpeaking(userId: string): void {
    if (!this.state.isRunning || !this.state.receiver) return;

    logger.info(`User ${userId} started speaking`);

    // Subscribe to user's audio stream (experimental)
    try {
      const opusStream = this.state.receiver.subscribe(userId, 'opus');
      
      if (opusStream && !this.state.activeSpeakers.has(userId)) {
        this.state.activeSpeakers.set(userId, opusStream);
        
        opusStream.on('data', (chunk: Buffer) => {
          this.handleAudioChunk(chunk, userId);
        });

        opusStream.on('error', (error: Error) => {
          logger.error(`Audio stream error for user ${userId}: ${error.message}`);
          this.state.activeSpeakers.delete(userId);
        });

        opusStream.on('end', () => {
          logger.info(`Audio stream ended for user ${userId}`);
          this.state.activeSpeakers.delete(userId);
        });
      }
    } catch (error) {
      logger.error(`Failed to subscribe to user ${userId} audio: ${(error as Error).message}`);
    }
  }

  private handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): void {
    // Clean up streams for users who leave the channel
    if (!newState.channel && oldState.channelId === this.state.config?.sourceChannelId) {
      const userId = newState.id;
      const stream = this.state.activeSpeakers.get(userId);
      if (stream) {
        stream.destroy();
        this.state.activeSpeakers.delete(userId);
        logger.info(`Cleaned up audio stream for user ${userId} who left the channel`);
      }
    }
  }

  private handleAudioChunk(chunk: Buffer, userId: string): void {
    if (!this.state.isRunning || !this.state.audioPlayer) return;

    // IMPORTANT TECHNICAL LIMITATION:
    // 
    // This implementation has significant limitations due to Discord's voice architecture:
    // - Cannot properly mix multiple speakers simultaneously
    // - Opus packets from Discord cannot be directly played without conversion
    // - No proper audio format conversion (Opus -> PCM -> Opus) is implemented
    // - Audio timing and synchronization are not handled
    // - This will likely NOT produce usable audio in practice
    //
    // For a working voice bridge, you would need:
    // 1. Opus decoder to convert incoming packets to PCM
    // 2. Audio mixer to handle multiple speakers
    // 3. PCM to Opus encoder for output
    // 4. Proper buffering and synchronization
    // 5. Complex stream management
    //
    // This is a structural implementation that demonstrates the architecture,
    // but the actual audio forwarding requires significant additional work
    // and external audio processing libraries.
    
    // For now, we log the chunk receipt but do not attempt to play it
    // because the format conversion is not implemented.
    logger.info(`Received audio chunk from ${userId}, size: ${chunk.length} bytes`);
  }
}

export const bridgeService = new BridgeService(null as any);

export function initializeBridgeService(client: Client) {
  (bridgeService as any).client = client;
}
