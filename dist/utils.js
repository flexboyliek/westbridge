"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDirectory = ensureDirectory;
exports.getTimestamp = getTimestamp;
exports.acquireProcessLock = acquireProcessLock;
exports.truncateText = truncateText;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
function ensureDirectory(dirPath) {
    node_fs_1.default.mkdirSync(dirPath, { recursive: true });
}
function getTimestamp() {
    return new Date().toISOString();
}
const LOCK_MAX_AGE_MS = 2 * 60 * 1000;
function acquireProcessLock() {
    const lockPath = node_path_1.default.resolve(process.cwd(), 'data', '.bot.lock');
    ensureDirectory(node_path_1.default.dirname(lockPath));
    if (node_fs_1.default.existsSync(lockPath)) {
        const lockAge = Date.now() - node_fs_1.default.statSync(lockPath).mtimeMs;
        if (lockAge < LOCK_MAX_AGE_MS) {
            const existingPid = node_fs_1.default.readFileSync(lockPath, 'utf8').trim();
            throw new Error(`Bot is already running (PID ${existingPid}). Stop other instances before starting again.`);
        }
        node_fs_1.default.unlinkSync(lockPath);
    }
    node_fs_1.default.writeFileSync(lockPath, String(process.pid));
    const release = () => {
        if (node_fs_1.default.existsSync(lockPath)) {
            node_fs_1.default.unlinkSync(lockPath);
        }
    };
    process.on('exit', release);
    process.on('SIGINT', () => {
        release();
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        release();
        process.exit(0);
    });
}
function truncateText(value, max = 1024) {
    if (value.length <= max) {
        return value;
    }
    return `${value.slice(0, max - 3)}...`;
}
