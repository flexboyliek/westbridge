"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strikesService = exports.StrikesService = void 0;
const googleapis_1 = require("googleapis");
const logger_1 = require("../logger");
const config_1 = require("../config");
class StrikesService {
    sheets;
    initialized = false;
    async initialize() {
        if (this.initialized)
            return;
        try {
            const auth = new googleapis_1.google.auth.GoogleAuth({
                keyFile: config_1.config.google.credentialsPath,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            this.sheets = googleapis_1.google.sheets({ version: 'v4', auth });
            this.initialized = true;
            logger_1.logger.info('Google Sheets (Strikes) initialized');
        }
        catch (error) {
            logger_1.logger.error(`Failed to initialize Google Sheets (Strikes): ${error.message}`);
            throw error;
        }
    }
    async getAllStaff() {
        if (!this.initialized) {
            await this.initialize();
        }
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: config_1.config.strikes.spreadsheetId,
                range: `A:E`,
            });
            const rows = response.data.values;
            if (!rows || rows.length === 0) {
                return [];
            }
            // Skip header row (row 1)
            const staffMembers = [];
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0)
                    continue;
                staffMembers.push({
                    rowNumber: i + 1,
                    position: row[1] || '', // Column B
                    robloxUsername: row[2] || '', // Column C
                    discordUsername: row[3] || '', // Column D
                    strikes: parseInt(row[4] || '0', 10), // Column E
                });
            }
            return staffMembers;
        }
        catch (error) {
            logger_1.logger.error(`Failed to fetch staff from Google Sheets: ${error.message}`);
            throw error;
        }
    }
    async findStaffByDiscord(discordUsername) {
        const staffMembers = await this.getAllStaff();
        return staffMembers.find(s => s.discordUsername.toLowerCase() === discordUsername.toLowerCase()) || null;
    }
    async findStaffByRoblox(robloxUsername) {
        const staffMembers = await this.getAllStaff();
        return staffMembers.find(s => s.robloxUsername.toLowerCase() === robloxUsername.toLowerCase()) || null;
    }
    async addStrike(discordUsername, reason) {
        if (!this.initialized) {
            await this.initialize();
        }
        const staffMember = await this.findStaffByDiscord(discordUsername);
        if (!staffMember) {
            throw new Error(`Staff member not found: ${discordUsername}`);
        }
        const newStrikeCount = staffMember.strikes + 1;
        const isFired = newStrikeCount >= config_1.config.strikes.maxStrikes;
        // Update the strike count in Google Sheets
        await this.sheets.spreadsheets.values.update({
            spreadsheetId: config_1.config.strikes.spreadsheetId,
            range: `E${staffMember.rowNumber}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[newStrikeCount.toString()]],
            },
        });
        logger_1.logger.info(`Strike added to ${discordUsername}. New count: ${newStrikeCount}`);
        return {
            staffMember,
            newStrikeCount,
            reason,
            isFired,
        };
    }
    async addStaff(position, robloxUsername, discordUsername) {
        if (!this.initialized) {
            await this.initialize();
        }
        // Check if staff member already exists
        const existing = await this.findStaffByDiscord(discordUsername);
        if (existing) {
            throw new Error(`Staff member already exists: ${discordUsername}`);
        }
        // Get current row count
        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: config_1.config.strikes.spreadsheetId,
            range: `A:E`,
        });
        const rows = response.data.values || [];
        const newRowNumber = rows.length + 1;
        // Add new staff member
        await this.sheets.spreadsheets.values.append({
            spreadsheetId: config_1.config.strikes.spreadsheetId,
            range: `A:E`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [['', position, robloxUsername, discordUsername, '0']],
            },
        });
        logger_1.logger.info(`Staff member added: ${discordUsername} (${robloxUsername})`);
        return {
            rowNumber: newRowNumber,
            position,
            robloxUsername,
            discordUsername,
            strikes: 0,
        };
    }
    async removeStaff(discordUsername) {
        if (!this.initialized) {
            await this.initialize();
        }
        const staffMember = await this.findStaffByDiscord(discordUsername);
        if (!staffMember) {
            throw new Error(`Staff member not found: ${discordUsername}`);
        }
        // Delete the row
        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: config_1.config.strikes.spreadsheetId,
            requestBody: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: 0,
                                dimension: 'ROWS',
                                startIndex: staffMember.rowNumber - 1,
                                endIndex: staffMember.rowNumber,
                            },
                        },
                    },
                ],
            },
        });
        logger_1.logger.info(`Staff member removed: ${discordUsername}`);
    }
    async clearStrikes(discordUsername) {
        if (!this.initialized) {
            await this.initialize();
        }
        const staffMember = await this.findStaffByDiscord(discordUsername);
        if (!staffMember) {
            throw new Error(`Staff member not found: ${discordUsername}`);
        }
        // Reset strikes to 0
        await this.sheets.spreadsheets.values.update({
            spreadsheetId: config_1.config.strikes.spreadsheetId,
            range: `E${staffMember.rowNumber}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [['0']],
            },
        });
        logger_1.logger.info(`Strikes cleared for ${discordUsername}`);
    }
}
exports.StrikesService = StrikesService;
exports.strikesService = new StrikesService();
