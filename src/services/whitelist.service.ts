import { logger } from '../logger';
import * as fs from 'fs';
import * as path from 'path';

const WHITELIST_FILE = path.join(process.cwd(), 'whitelist.json');

interface WhitelistData {
  userIds: string[];
}

class WhitelistService {
  private userIds: Set<string> = new Set();

  async load(): Promise<void> {
    try {
      if (fs.existsSync(WHITELIST_FILE)) {
        const data = fs.readFileSync(WHITELIST_FILE, 'utf-8');
        const parsed: WhitelistData = JSON.parse(data);
        this.userIds = new Set(parsed.userIds || []);
        logger.info(`Loaded ${this.userIds.size} whitelisted users`);
      } else {
        this.userIds = new Set();
        await this.save();
        logger.info('Created new whitelist file');
      }
    } catch (error) {
      logger.error(`Failed to load whitelist: ${(error as Error).message}`);
      this.userIds = new Set();
    }
  }

  async save(): Promise<void> {
    try {
      const data: WhitelistData = {
        userIds: Array.from(this.userIds),
      };
      fs.writeFileSync(WHITELIST_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      logger.error(`Failed to save whitelist: ${(error as Error).message}`);
    }
  }

  isWhitelisted(userId: string): boolean {
    return this.userIds.has(userId);
  }

  async addUser(userId: string): Promise<boolean> {
    if (this.userIds.has(userId)) {
      return false;
    }
    this.userIds.add(userId);
    await this.save();
    return true;
  }

  async removeUser(userId: string): Promise<boolean> {
    if (!this.userIds.has(userId)) {
      return false;
    }
    this.userIds.delete(userId);
    await this.save();
    return true;
  }

  getAllUsers(): string[] {
    return Array.from(this.userIds);
  }
}

export const whitelistService = new WhitelistService();
