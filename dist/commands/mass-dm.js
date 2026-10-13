"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.massDmCommand = void 0;
exports.handleMassDmCommand = handleMassDmCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
exports.massDmCommand = new discord_js_1.SlashCommandBuilder()
    .setName('mass-dm')
    .setDescription('Send a DM message to all server members')
    .addStringOption((option) => option
    .setName('message')
    .setDescription('The message to send (up to 4000 characters)')
    .setRequired(true)
    .setMaxLength(4000))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator);
async function handleMassDmCommand(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const message = interaction.options.getString('message', true);
    const guild = interaction.guild;
    if (!guild) {
        await interaction.editReply('This command can only be used in a server.');
        return;
    }
    // Only allow bot owner to use this command
    if (interaction.user.id !== config_1.config.botOwnerId) {
        await interaction.editReply('Only the bot owner can use this command.');
        return;
    }
    try {
        // Fetch all members using REST API with pagination
        await interaction.editReply('Fetching server members...');
        let members;
        try {
            // Use list() which uses REST API and is more reliable for large servers
            members = await guild.members.list({ limit: 1000 });
            // If more than 1000 members, fetch the rest
            if (members.size === 1000) {
                let lastMemberId = members.last()?.id;
                while (lastMemberId) {
                    const moreMembers = await guild.members.list({ limit: 1000, after: lastMemberId });
                    if (moreMembers.size === 0)
                        break;
                    members = members.concat(moreMembers);
                    lastMemberId = moreMembers.last()?.id;
                }
            }
        }
        catch (fetchError) {
            logger_1.logger.error(`Failed to fetch members: ${fetchError.message}`);
            await interaction.editReply(`Failed to fetch server members. Error: ${fetchError.message}`);
            return;
        }
        const memberCount = members.size;
        await interaction.editReply(`Starting to send DM to ${memberCount} members...\n(0/${memberCount})`);
        let successCount = 0;
        let failCount = 0;
        // Rate limit: Discord allows ~50 DMs per minute
        const delay = 1200; // 1.2 seconds between DMs
        for (const [_, member] of members) {
            if (member.user.bot) {
                continue; // Skip bots only
            }
            try {
                await member.send(message);
                successCount++;
                logger_1.logger.info(`DM sent to ${member.user.tag} (${member.user.id})`);
            }
            catch (error) {
                failCount++;
                logger_1.logger.warn(`Failed to DM ${member.user.tag} (${member.user.id}): ${error.message}`);
            }
            // Rate limiting delay
            await new Promise((resolve) => setTimeout(resolve, delay));
            // Update progress every 5 members
            if ((successCount + failCount) % 5 === 0) {
                await interaction.editReply(`Progress: (${successCount + failCount}/${memberCount})\nSuccess: ${successCount} | Failed: ${failCount}`);
            }
        }
        await interaction.editReply(`Mass DM complete!\n\nTotal: ${memberCount}\nSuccess: ${successCount}\nFailed: ${failCount}`);
    }
    catch (error) {
        logger_1.logger.error(`Mass DM failed: ${error.message}`);
        await interaction.editReply(`An error occurred: ${error.message}`);
    }
}
