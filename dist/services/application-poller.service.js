"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationPollerService = void 0;
const logger_1 = require("../logger");
const config_1 = require("../config");
const google_sheets_service_1 = require("./google-sheets.service");
const staff_application_embeds_1 = require("../embeds/staff-application.embeds");
class ApplicationPollerService {
    client;
    importedRows = new Set();
    pollInterval = null;
    isRunning = false;
    constructor(client) {
        this.client = client;
    }
    async start() {
        if (this.isRunning) {
            logger_1.logger.warn('Application poller is already running');
            return;
        }
        try {
            await google_sheets_service_1.googleSheetsService.initialize();
            this.isRunning = true;
            // Initial load of existing applications
            await this.loadExistingApplications();
            // Start polling
            this.pollInterval = setInterval(() => {
                this.pollForNewApplications();
            }, config_1.config.polling.intervalMs);
            logger_1.logger.info('Application poller started');
        }
        catch (error) {
            logger_1.logger.error(`Failed to start application poller: ${error.message}`);
            this.isRunning = false;
            throw error;
        }
    }
    stop() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.isRunning = false;
        logger_1.logger.info('Application poller stopped');
    }
    async loadExistingApplications() {
        try {
            const applications = await google_sheets_service_1.googleSheetsService.getApplications();
            for (const app of applications) {
                this.importedRows.add(app.rowNumber);
            }
            logger_1.logger.info(`Loaded ${this.importedRows.size} existing applications`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to load existing applications: ${error.message}`);
        }
    }
    async pollForNewApplications() {
        try {
            const applications = await google_sheets_service_1.googleSheetsService.getApplications();
            for (const app of applications) {
                if (!this.importedRows.has(app.rowNumber)) {
                    await this.sendApplicationToPending(app);
                    this.importedRows.add(app.rowNumber);
                    logger_1.logger.info(`New application #${app.rowNumber} imported for ${app.discordUsername}`);
                }
            }
        }
        catch (error) {
            logger_1.logger.error(`Error polling for new applications: ${error.message}`);
        }
    }
    async sendApplicationToPending(application) {
        try {
            const pendingChannel = await this.client.channels.fetch(config_1.config.staff.pendingChannelId);
            if (!pendingChannel || !pendingChannel.isTextBased() || pendingChannel.isDMBased()) {
                logger_1.logger.error('Pending channel not found or is not text-based');
                return;
            }
            const embed = (0, staff_application_embeds_1.buildPendingApplicationEmbed)(application);
            const buttons = (0, staff_application_embeds_1.buildApplicationButtons)(application.rowNumber);
            await pendingChannel.send({ embeds: [embed], components: [buttons] });
        }
        catch (error) {
            logger_1.logger.error(`Failed to send application #${application.rowNumber} to pending channel: ${error.message}`);
        }
    }
    markAsImported(rowNumber) {
        this.importedRows.add(rowNumber);
    }
    isImported(rowNumber) {
        return this.importedRows.has(rowNumber);
    }
}
exports.ApplicationPollerService = ApplicationPollerService;
