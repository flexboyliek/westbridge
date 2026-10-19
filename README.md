# Westbridge Discord Bot

A comprehensive Discord bot built with TypeScript and discord.js v14 for server management and support.

## Features

### Ticket System
- `/support-panel` - Send support ticket panel to support channel
- Ticket types: General Support, Content Creator, Claim Your Rank
- Roblox username integration (fetches user info from Roblox API)
- Claim ticket button for staff
- Close ticket with HTML transcript generation
- Staff and management role permissions
- Red-themed embeds with custom styling

### Staff Applications
- `/apply` - Submit staff applications
- `/approve-application` - Approve applications (staff only)
- `/deny-application` - Deny applications (staff only)
- `/clear-applications` - Clear pending applications
- `/import-applications` - Import applications from Google Sheets
- Google Sheets integration for application storage

### Strikes System
- `/strike` - Issue strikes to users (staff only)
- `/viewstrikes` - View user strikes
- Google Sheets integration for strike tracking
- Configurable strike limits

### Trello Integration
- `/addtrello` - Add Trello board configuration
- `/removetrello` - Remove Trello board configuration
- Trello API integration for task management

### Mass DM
- `/dmall` - Send DM to all server members (owner only)
- Rate limiting to avoid Discord API limits
- Progress tracking and success/failure reporting

### Other Commands
- `/announcement` - Send announcements to announcement channel
- `/embed` - Create custom embeds from JSON
- `/dm-user` - DM a specific user
- `/delete-message` - Delete bot messages
- `/addstaff` - Add staff member (staff only)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create or update `.env`:

```env
DISCORD_TOKEN=your_bot_token
BOT_OWNER_ID=your_discord_user_id
LOG_PATH=./logs/app.log

# Google Sheets
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEET_GID=your_sheet_gid
GOOGLE_CREDENTIALS_PATH=./google-credentials.json

# Staff Application Channels
STAFF_PENDING_CHANNEL_ID=pending_channel_id
STAFF_APPROVED_CHANNEL_ID=approved_channel_id
STAFF_DENIED_CHANNEL_ID=denied_channel_id
STAFF_BANNER_URL=banner_image_url

# Announcement Channel
ANNOUNCEMENT_CHANNEL_ID=announcement_channel_id

# DM All / Broadcast DM
DMALL_SERVER_ID=your_server_id
BROADCAST_DM_GUILD_ID=your_server_id

# Strikes
STRIKES_SPREADSHEET_ID=strikes_spreadsheet_id
STRIKES_SHEET_GID=strikes_sheet_gid
STRIKES_ALLOWED_IDS=user_id1,user_id2
STRIKES_ALLOWED_ROLE_IDS=role_id1,role_id2

# Trello
TRELLO_API_KEY=your_trello_api_key
TRELLO_TOKEN=your_trello_token
TRELLO_BOARD_CHAOS=chaos_board_id
TRELLO_BOARD_DOLLHOUSE=dollhouse_board_id

# Ticket System
TICKET_SUPPORT_CHANNEL=support_channel_id
TICKET_TRANSCRIPTS_CHANNEL=transcripts_channel_id
TICKET_CATEGORY_ID=ticket_category_id
TICKET_BANNER_URL=ticket_banner_url
TICKET_PANEL_TEXT=panel_text
TICKET_STAFF_ROLES=staff_role_id1,staff_role_id2
TICKET_MANAGEMENT_ROLES=management_role_id1,management_role_id2
TICKET_BUSY_MODE_ENABLED=true
TICKET_BUSY_THRESHOLD=10
TICKET_BUSY_MESSAGE=busy_mode_message
```

### 3. Enable Discord intents

In the [Discord Developer Portal](https://discord.com/developers/applications), enable:

- **Message Content Intent** (required for DM functionality)
- **Server Members Intent** (required for fetching members)

### 4. Bot permissions

The bot needs:

- Send Messages
- Use Slash Commands
- Read Messages/View Channels
- Manage Channels (for ticket system)
- Manage Roles (for staff applications)
- Manage Messages (for moderation)

### 5. Run locally

```bash
npm run build
npm start
```

Development with auto-reload:

```bash
npm run dev
```

## Deployment

### GitHub Setup

1. Create a new repository on GitHub
2. Initialize git in your project:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/kelms-funeral-home-bot.git
   git push -u origin main
   ```

### Sparked Hosting Setup

1. Upload your bot files to Sparked Hosting via FTP or Git
2. Set the startup command to:
   ```
   npm run build && npm start
   ```
3. Add environment variables in the Sparked Hosting control panel
4. Restart the bot

**Important:** The `.env` file is excluded from git (see `.gitignore`). You'll need to manually add environment variables in Sparked Hosting's control panel.

## Project structure

```
src/
├── index.ts                     Entry point
├── config.ts                    Configuration settings
├── logger.ts                    Logging utility
├── utils.ts                    Utility functions
├── bot/
│   └── client.ts                Discord client and event wiring
├── commands/
│   ├── support-panel.ts         Support panel command
│   ├── apply.ts                 Staff application command
│   ├── strike.ts                Strike command
│   ├── dmall.ts                 Mass DM command
│   ├── announcement.ts          Announcement command
│   ├── embed.ts                 Embed command
│   └── ...                      Other commands
├── handlers/
│   ├── command-handler.ts       Slash command routing
│   ├── button-handler.ts        Button interaction handling
│   ├── modal-handler.ts         Modal handling
│   └── select-menu-handler.ts   Select menu handling
├── services/
│   ├── google-sheets.service.ts  Google Sheets integration
│   ├── trello.service.ts        Trello integration
│   ├── strikes.service.ts       Strikes system
│   ├── dmall.service.ts         Mass DM service
│   └── application-poller.service.ts Application polling
├── types/
│   ├── strikes.ts               Strike types
│   ├── trello.ts                Trello types
│   └── dmall.ts                 Mass DM types
└── embeds/
    ├── staff-application.embeds.ts Staff application embeds
    └── dmall.embeds.ts          Mass DM embeds
```

## Commands

### Ticket Commands

#### /support-panel
Send the support ticket panel to the support channel (staff only).

**Features:**
- Creates ticket panel with banner image
- Users can select ticket type
- Opens modal for reason and Roblox username
- Creates private ticket channel with staff access

### Staff Application Commands

#### /apply
Submit a staff application.

#### /approve-application
Approve a staff application (staff only).

#### /deny-application
Deny a staff application (staff only).

### Strike Commands

#### /strike
Issue a strike to a user (staff only).

**Usage:** `/strike user: @user reason: reason`

#### /viewstrikes
View a user's strike count.

**Usage:** `/viewstrikes user: @user`

### Mass DM

#### /dmall
Send a DM message to all server members (owner only).

**Usage:** `/dmall message: Your message here`

**Features:**
- Rate limited (1.2 seconds per DM)
- Skips bots
- Shows progress updates
- Reports success/failure count

### Other Commands

#### /announcement
Send an announcement to the announcement channel.

#### /embed
Create a custom embed from JSON (staff only).

#### /dm-user
Send a DM to a specific user (staff only).

## Dependencies

- discord.js v14
- discord-html-transcripts
- googleapis
- dotenv
- typescript

## License

MIT
