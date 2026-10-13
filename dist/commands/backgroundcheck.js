"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backgroundCheckCommand = void 0;
exports.handleBackgroundCheckCommand = handleBackgroundCheckCommand;
const discord_js_1 = require("discord.js");
const logger_1 = require("../logger");
const config_1 = require("../config");
const strikes_service_1 = require("../services/strikes.service");
exports.backgroundCheckCommand = new discord_js_1.SlashCommandBuilder()
    .setName('backgroundcheck')
    .setDescription('Run a background check on a staff applicant')
    .addStringOption((option) => option.setName('roblox_username')
    .setDescription('Roblox username to check')
    .setRequired(true))
    .addUserOption((option) => option.setName('discord_user')
    .setDescription('Discord user to check')
    .setRequired(true));
async function getRobloxUserInfo(username) {
    try {
        const searchResponse = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`);
        const searchData = await searchResponse.json();
        if (!searchData.data || searchData.data.length === 0) {
            return null;
        }
        const user = searchData.data.find((u) => u.name.toLowerCase() === username.toLowerCase());
        if (!user) {
            return null;
        }
        const userResponse = await fetch(`https://users.roblox.com/v1/users/${user.id}`);
        const userData = await userResponse.json();
        return {
            id: user.id,
            name: userData.name,
            displayName: userData.displayName,
            description: userData.description,
            created: userData.created,
            isBanned: userData.isBanned,
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch Roblox user: ' + error.message);
        return null;
    }
}
async function getRobloxGroups(userId) {
    try {
        const response = await fetch(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
        const data = await response.json();
        return data.data || [];
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch Roblox groups: ' + error.message);
        return [];
    }
}
function calculateRiskLevel(result) {
    let riskScore = 0;
    // Roblox account age (younger = higher risk)
    if (result.robloxAge && result.robloxAge < 30)
        riskScore += 3;
    else if (result.robloxAge && result.robloxAge < 90)
        riskScore += 2;
    else if (result.robloxAge && result.robloxAge < 180)
        riskScore += 1;
    // Discord account age
    if (result.discordAge && result.discordAge < 30)
        riskScore += 3;
    else if (result.discordAge && result.discordAge < 90)
        riskScore += 2;
    else if (result.discordAge && result.discordAge < 180)
        riskScore += 1;
    // Roblox banned
    if (result.robloxIsBanned)
        riskScore += 10;
    // Previous strikes
    if (result.strikes >= 3)
        riskScore += 10;
    else if (result.strikes >= 2)
        riskScore += 5;
    else if (result.strikes >= 1)
        riskScore += 2;
    // Warnings
    riskScore += result.warnings.length * 2;
    if (riskScore >= 10)
        return 'Critical';
    if (riskScore >= 7)
        return 'High';
    if (riskScore >= 4)
        return 'Medium';
    return 'Low';
}
async function handleBackgroundCheckCommand(interaction) {
    // Check if user is allowed (by ID or role)
    const hasUserIdPermission = config_1.config.strikes.allowedUserIds.includes(interaction.user.id);
    const hasRolePermission = interaction.member &&
        'roles' in interaction.member &&
        interaction.member.roles.cache.some((role) => config_1.config.strikes.allowedRoleIds.includes(role.id));
    if (!hasUserIdPermission && !hasRolePermission) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
    }
    const robloxUsername = interaction.options.getString('roblox_username', true);
    const discordUser = interaction.options.getUser('discord_user', true);
    await interaction.deferReply({ ephemeral: true });
    try {
        const result = {
            robloxUsername,
            discordId: discordUser.id,
            strikes: 0,
            riskLevel: 'Low',
            warnings: [],
        };
        // Get Roblox user info
        const robloxInfo = await getRobloxUserInfo(robloxUsername);
        if (robloxInfo) {
            result.robloxId = robloxInfo.id;
            result.robloxDisplayName = robloxInfo.displayName;
            result.robloxIsBanned = robloxInfo.isBanned;
            if (robloxInfo.created) {
                result.robloxAge = Math.floor((Date.now() - new Date(robloxInfo.created).getTime()) / (1000 * 60 * 60 * 24));
            }
            // Check for suspicious groups
            const groups = await getRobloxGroups(robloxInfo.id);
            const suspiciousGroups = groups.filter((g) => g.group.name.toLowerCase().includes('exploit') ||
                g.group.name.toLowerCase().includes('cheat') ||
                g.group.name.toLowerCase().includes('hack') ||
                g.group.name.toLowerCase().includes('bypass'));
            if (suspiciousGroups.length > 0) {
                result.warnings.push(`Member of suspicious groups: ${suspiciousGroups.map((g) => g.group.name).join(', ')}`);
            }
            // Check for Impact group (specific threat)
            const impactGroup = groups.find((g) => g.group.id === 35755965);
            if (impactGroup) {
                result.warnings.push(`⚠️ CRITICAL: Member of Impact group (ID: 35755965) - Known to cause issues`);
                result.riskLevel = 'Critical';
            }
        }
        else {
            result.warnings.push('Roblox account not found or invalid');
        }
        // Get Discord account age
        const discordUserObj = await interaction.client.users.fetch(discordUser.id);
        result.discordAge = Math.floor((Date.now() - discordUserObj.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        // Check strikes
        const staffMember = await strikes_service_1.strikesService.findStaffByDiscord(discordUser.username);
        result.strikes = staffMember?.strikes || 0;
        if (result.strikes > 0) {
            result.warnings.push(`Has ${result.strikes} previous strike(s)`);
        }
        // Calculate risk level
        result.riskLevel = calculateRiskLevel(result);
        // Build embed
        const riskColors = {
            'Low': 0x00FF00,
            'Medium': 0xFFFF00,
            'High': 0xFF9900,
            'Critical': 0xFF0000,
        };
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🔍 Background Check Report')
            .setColor(riskColors[result.riskLevel])
            .addFields({ name: '👤 Discord User', value: `<@${discordUser.id}>`, inline: true }, { name: '🆔 Discord ID', value: discordUser.id, inline: true }, { name: '📅 Discord Age', value: `${result.discordAge} days`, inline: true }, { name: '🎮 Roblox Username', value: robloxUsername, inline: true }, { name: '🏷️ Roblox Display', value: result.robloxDisplayName || 'N/A', inline: true }, { name: '📅 Roblox Age', value: result.robloxAge ? `${result.robloxAge} days` : 'N/A', inline: true }, { name: '⚠️ Roblox Banned', value: result.robloxIsBanned ? 'Yes' : 'No', inline: true }, { name: '🚨 Previous Strikes', value: result.strikes.toString(), inline: true }, { name: '📊 Risk Level', value: result.riskLevel, inline: true })
            .setTimestamp();
        if (result.warnings.length > 0) {
            embed.addFields({ name: '⚠️ Warnings', value: result.warnings.join('\n'), inline: false });
        }
        await interaction.editReply({ embeds: [embed] });
    }
    catch (error) {
        logger_1.logger.error(`Background check failed: ${error.message}`);
        await interaction.editReply(`Error: ${error.message}`);
    }
}
