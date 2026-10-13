"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketActivityService = exports.TicketActivityService = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const ACTIVITY_FILE = path_1.default.join(process.cwd(), 'data', 'ticket-activity.json');
class TicketActivityService {
    activityData = new Map();
    async loadActivityData() {
        try {
            // Ensure data directory exists
            await fs_1.promises.mkdir(path_1.default.dirname(ACTIVITY_FILE), { recursive: true });
            const data = await fs_1.promises.readFile(ACTIVITY_FILE, 'utf-8');
            const parsed = JSON.parse(data);
            this.activityData = new Map(Object.entries(parsed));
        }
        catch (error) {
            // File doesn't exist yet, start with empty data
            this.activityData = new Map();
        }
    }
    async saveActivityData() {
        const data = Object.fromEntries(this.activityData);
        await fs_1.promises.mkdir(path_1.default.dirname(ACTIVITY_FILE), { recursive: true });
        await fs_1.promises.writeFile(ACTIVITY_FILE, JSON.stringify(data, null, 2));
    }
    async recordClaim(userId, username, ticketId, ticketCreatedAt) {
        const existing = this.activityData.get(userId) || {
            userId,
            username,
            ticketsClaimed: 0,
            ticketsClosed: 0,
            lastActivity: new Date().toISOString(),
            history: [],
            averageResponseTime: 0,
            totalResponseTime: 0,
            responseCount: 0,
        };
        existing.ticketsClaimed++;
        existing.lastActivity = new Date().toISOString();
        // Calculate response time if ticket creation time is provided
        let responseTime;
        if (ticketCreatedAt) {
            const createdTime = new Date(ticketCreatedAt).getTime();
            const claimTime = new Date().getTime();
            responseTime = Math.round((claimTime - createdTime) / (1000 * 60)); // Convert to minutes
            existing.totalResponseTime += responseTime;
            existing.responseCount++;
            existing.averageResponseTime = Math.round(existing.totalResponseTime / existing.responseCount);
        }
        existing.history.push({
            action: 'claim',
            timestamp: new Date().toISOString(),
            ticketId,
            responseTime,
        });
        // Keep only last 50 history entries to prevent file bloat
        if (existing.history.length > 50) {
            existing.history = existing.history.slice(-50);
        }
        this.activityData.set(userId, existing);
        await this.saveActivityData();
    }
    async recordClose(userId, username, ticketId) {
        const existing = this.activityData.get(userId) || {
            userId,
            username,
            ticketsClaimed: 0,
            ticketsClosed: 0,
            lastActivity: new Date().toISOString(),
            history: [],
            averageResponseTime: 0,
            totalResponseTime: 0,
            responseCount: 0,
        };
        existing.ticketsClosed++;
        existing.lastActivity = new Date().toISOString();
        existing.history.push({
            action: 'close',
            timestamp: new Date().toISOString(),
            ticketId,
        });
        // Keep only last 50 history entries to prevent file bloat
        if (existing.history.length > 50) {
            existing.history = existing.history.slice(-50);
        }
        this.activityData.set(userId, existing);
        await this.saveActivityData();
    }
    getActivityData() {
        return Array.from(this.activityData.values()).sort((a, b) => {
            // Sort by total tickets handled (claimed + closed)
            const aTotal = a.ticketsClaimed + a.ticketsClosed;
            const bTotal = b.ticketsClaimed + b.ticketsClosed;
            return bTotal - aTotal;
        });
    }
    getUserActivity(userId) {
        return this.activityData.get(userId);
    }
}
exports.TicketActivityService = TicketActivityService;
exports.ticketActivityService = new TicketActivityService();
