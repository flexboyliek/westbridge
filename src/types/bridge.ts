export interface BridgeConfig {
  sourceGuildId: string;
  sourceChannelId: string;
  destinationGuildId: string;
  destinationChannelId: string;
}

export interface BridgeStatus {
  isRunning: boolean;
  sourceGuildId?: string;
  sourceChannelId?: string;
  destinationGuildId?: string;
  destinationChannelId?: string;
  sourceConnected: boolean;
  destinationConnected: boolean;
  activeSpeakers: number;
  error?: string;
}

export interface BridgeState {
  config: BridgeConfig | null;
  isRunning: boolean;
  sourceConnection: any;
  destinationConnection: any;
  receiver: any;
  audioPlayer: any;
  activeSpeakers: Map<string, any>;
}
