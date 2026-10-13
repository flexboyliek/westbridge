"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleSheetsService = exports.GoogleSheetsService = void 0;
const googleapis_1 = require("googleapis");
const logger_1 = require("../logger");
const config_1 = require("../config");
const node_fs_1 = __importDefault(require("node:fs"));
class GoogleSheetsService {
    sheets;
    initialized = false;
    async initialize() {
        try {
            const credentials = JSON.parse(node_fs_1.default.readFileSync(config_1.config.google.credentialsPath, 'utf8'));
            const auth = new googleapis_1.google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });
            this.sheets = googleapis_1.google.sheets({ version: 'v4', auth });
            this.initialized = true;
            logger_1.logger.info('Google Sheets API initialized');
        }
        catch (error) {
            logger_1.logger.error(`Failed to initialize Google Sheets API: ${error.message}`);
            throw error;
        }
    }
    async getApplications() {
        if (!this.initialized) {
            await this.initialize();
        }
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: config_1.config.google.spreadsheetId,
                range: `Form Responses 1!A:L`,
            });
            const rows = response.data.values;
            if (!rows || rows.length === 0) {
                return [];
            }
            // Skip header row (row 1)
            const applications = [];
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0)
                    continue;
                applications.push({
                    rowNumber: i + 1,
                    robloxUsername: row[2] || '', // Column C
                    discordUsername: row[3] || '', // Column D
                    timezone: row[4] || '', // Column E
                    dailyActivity: row[5] || '', // Column F
                    previousExperience: row[6] || '', // Column G
                    professionalism: row[7] || '', // Column H
                    ticketHandling: row[8] || '', // Column I
                    permanentBanScenario: row[9] || '', // Column J
                    exploitingScenario: row[10] || '', // Column K
                    permanentPunishment: row[11] || '', // Column L
                    timestamp: row[0] ? new Date(row[0]) : undefined, // Column A
                });
            }
            return applications;
        }
        catch (error) {
            logger_1.logger.error(`Failed to fetch applications from Google Sheets: ${error.message}`);
            throw error;
        }
    }
    async getApplicationByRow(rowNumber) {
        const applications = await this.getApplications();
        return applications.find((app) => app.rowNumber === rowNumber) || null;
    }
}
exports.GoogleSheetsService = GoogleSheetsService;
exports.googleSheetsService = new GoogleSheetsService();
