"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = getDatabase;
exports.persistDatabase = persistDatabase;
const sql_js_1 = __importDefault(require("sql.js"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const config_1 = require("../config");
const utils_1 = require("../utils");
const logger_1 = require("../logger");
let db = null;
let dbPath = '';
async function getDatabase() {
    if (!db) {
        const SQL = await (0, sql_js_1.default)();
        dbPath = node_path_1.default.resolve(process.cwd(), config_1.config.databasePath);
        (0, utils_1.ensureDirectory)(node_path_1.default.dirname(dbPath));
        if (node_fs_1.default.existsSync(dbPath)) {
            db = new SQL.Database(node_fs_1.default.readFileSync(dbPath));
        }
        else {
            db = new SQL.Database();
        }
        initializeSchema(db);
        verifyDatabaseIntegrity(db);
        persistDatabase();
        logger_1.logger.info(`Database initialized at ${dbPath}`);
    }
    return db;
}
function initializeSchema(database) {
    database.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      discord_user_id TEXT NOT NULL,
      discord_username TEXT NOT NULL,
      roblox_username TEXT NOT NULL,
      timezone TEXT NOT NULL,
      daily_activity INTEGER NOT NULL,
      previous_experience TEXT NOT NULL,
      professionalism_answer TEXT NOT NULL,
      ticket_management_answer TEXT NOT NULL,
      banned_player_scenario TEXT NOT NULL,
      exploiting_scenario TEXT NOT NULL,
      permanent_punishment_answer TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      reviewer_id TEXT,
      reviewer_username TEXT,
      reviewed_at TEXT,
      thread_id TEXT,
      pending_message_id TEXT,
      created_at TEXT NOT NULL
    )
  `);
    database.run(`
    CREATE INDEX IF NOT EXISTS idx_applications_discord_user
      ON applications (discord_user_id)
  `);
    database.run(`
    CREATE INDEX IF NOT EXISTS idx_applications_status
      ON applications (status)
  `);
}
function verifyDatabaseIntegrity(database) {
    const result = database.exec('PRAGMA integrity_check');
    const status = result[0]?.values?.[0]?.[0];
    if (status !== 'ok') {
        logger_1.logger.error(`Database integrity check failed: ${status}`);
        if (dbPath && node_fs_1.default.existsSync(dbPath)) {
            const backupPath = `${dbPath}.backup-${Date.now()}`;
            node_fs_1.default.copyFileSync(dbPath, backupPath);
            logger_1.logger.warn(`Backup created at ${backupPath}. Existing applications were not deleted.`);
        }
        return;
    }
    const count = database.exec('SELECT COUNT(*) FROM applications')[0]?.values?.[0]?.[0] ?? 0;
    logger_1.logger.info(`Database integrity OK — ${count} application(s) on record.`);
}
function persistDatabase() {
    if (!db || !dbPath) {
        return;
    }
    const data = db.export();
    node_fs_1.default.writeFileSync(dbPath, Buffer.from(data));
}
