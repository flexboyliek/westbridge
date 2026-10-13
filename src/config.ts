import dotenv from 'dotenv';

dotenv.config();

export const config = {
  token: process.env.DISCORD_TOKEN || '',
  logPath: process.env.LOG_PATH || './logs/app.log',
  botOwnerId: process.env.BOT_OWNER_ID || '',
  guildId: process.env.GUILD_ID || '',
  
  // Google Sheets Configuration
  google: {
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || '1zrRCx3Z4z6-fsl1ymD5PFzrLufEoTb0nT8v4v-PFOyo',
    sheetGid: process.env.GOOGLE_SHEET_GID || '1549260101',
    credentialsPath: process.env.GOOGLE_CREDENTIALS_PATH || './google-credentials.json',
  },
  
  // Staff Application Channels
  staff: {
    pendingChannelId: process.env.STAFF_PENDING_CHANNEL_ID || '',
    approvedChannelId: process.env.STAFF_APPROVED_CHANNEL_ID || '',
    deniedChannelId: process.env.STAFF_DENIED_CHANNEL_ID || '',
    embedColor: '#5865F2',
    bannerUrl: process.env.STAFF_BANNER_URL || '',
  },
  
  // Announcement Channel
  announcement: {
    channelId: process.env.ANNOUNCEMENT_CHANNEL_ID || '',
  },
  
  // Polling Configuration
  polling: {
    intervalMs: 60000, // Check every 60 seconds (reduced from 10 to avoid rate limits)
  },
  
  // DM All Configuration
  dmall: {
    serverId: process.env.DMALL_SERVER_ID || '',
    cooldownMs: 5000, // 5 seconds between DMs (increased for safety)
  },

  broadcastDm: {
    guildIds: (
      process.env.BROADCAST_DM_GUILD_ID ||
      process.env.DMALL_SERVER_ID ||
      process.env.GUILD_ID ||
      ''
    ).split(',').map(id => id.trim()).filter(id => id),
    /** ~1.1s between sends balances speed vs Discord rate limits (override with BROADCAST_DM_DELAY_MS). */
    delayMs: parseInt(process.env.BROADCAST_DM_DELAY_MS || '1100', 10),
    progressEvery: parseInt(process.env.BROADCAST_DM_PROGRESS_EVERY || '12', 10),
    maxRetries: parseInt(process.env.BROADCAST_DM_MAX_RETRIES || '4', 10),
  },
  
  // Strikes Configuration
  strikes: {
    spreadsheetId: process.env.STRIKES_SPREADSHEET_ID || '',
    sheetGid: process.env.STRIKES_SHEET_GID || '',
    allowedUserIds: process.env.STRIKES_ALLOWED_IDS?.split(',') || [],
    allowedRoleIds: process.env.STRIKES_ALLOWED_ROLE_IDS?.split(',') || [],
    maxStrikes: 3,
  },
  
  // Trello Configuration
  trello: {
    apiKey: process.env.TRELLO_API_KEY || '',
    token: process.env.TRELLO_TOKEN || '',
    boards: {
      ohthatschaos: process.env.TRELLO_BOARD_CHAOS || 'y4f5qVKW',
      dollhouse: process.env.TRELLO_BOARD_DOLLHOUSE || '2iqNDQVn',
    },
  },

  // Ticket Configuration
  tickets: {
    supportChannelId: process.env.TICKET_SUPPORT_CHANNEL || '',
    transcriptsChannelId: process.env.TICKET_TRANSCRIPTS_CHANNEL || '',
    categoryId: process.env.TICKET_CATEGORY_ID || '',
    bannerUrl: process.env.TICKET_BANNER_URL || '',
    panelText: process.env.TICKET_PANEL_TEXT || '**Open a ticket!**\n\nWelcome to the Kelms Funeral Home Support System. Please select the correct category when opening a ticket so our team can assist you efficiently.\n\n**General Assistance**\nFor general questions, concerns, or inquiries.\n\n**Important Information**\n• Select the correct category when opening a ticket\n• Do not open multiple tickets for the same issue\n• Provide clear and complete information\n• Misuse of the system may result in your ticket being closed',
    staffRoles: process.env.TICKET_STAFF_ROLES?.split(',') || [],
    managementRoles: process.env.TICKET_MANAGEMENT_ROLES?.split(',') || [],
    busyMode: {
      enabled: process.env.TICKET_BUSY_MODE_ENABLED === 'true',
      threshold: parseInt(process.env.TICKET_BUSY_THRESHOLD || '10'),
      message: process.env.TICKET_BUSY_MESSAGE || '**Reduced Support Capacity**\n\nSupport operations are currently running at reduced capacity. We have successfully received your ticket, but please anticipate a longer response time than usual.\n\nOur team is working to address inquiries in the order they were received. We appreciate your patience during this period of high volume.',
    },
  },
};
