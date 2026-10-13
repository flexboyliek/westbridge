"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.whitelistService = void 0;
const logger_1 = require("../logger");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const WHITELIST_FILE = path.join(process.cwd(), 'whitelist.json');
class WhitelistService {
    userIds = new Set();
    async load() {
        try {
            if (fs.existsSync(WHITELIST_FILE)) {
                const data = fs.readFileSync(WHITELIST_FILE, 'utf-8');
                const parsed = JSON.parse(data);
                this.userIds = new Set(parsed.userIds || []);
                logger_1.logger.info(`Loaded ${this.userIds.size} whitelisted users`);
            }
            else {
                this.userIds = new Set();
                await this.save();
                logger_1.logger.info('Created new whitelist file');
            }
        }
        catch (error) {
            logger_1.logger.error(`Failed to load whitelist: ${error.message}`);
            this.userIds = new Set();
        }
    }
    async save() {
        try {
            const data = {
                userIds: Array.from(this.userIds),
            };
            fs.writeFileSync(WHITELIST_FILE, JSON.stringify(data, null, 2));
        }
        catch (error) {
            logger_1.logger.error(`Failed to save whitelist: ${error.message}`);
        }
    }
    isWhitelisted(userId) {
        return this.userIds.has(userId);
    }
    async addUser(userId) {
        if (this.userIds.has(userId)) {
            return false;
        }
        this.userIds.add(userId);
        await this.save();
        return true;
    }
    async removeUser(userId) {
        if (!this.userIds.has(userId)) {
            return false;
        }
        this.userIds.delete(userId);
        await this.save();
        return true;
    }
    getAllUsers() {
        return Array.from(this.userIds);
    }
}
exports.whitelistService = new WhitelistService();
