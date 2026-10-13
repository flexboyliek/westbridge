"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const config_1 = require("./config");
const utils_1 = require("./utils");
class Logger {
    logFilePath;
    constructor(logFilePath = config_1.config.logPath) {
        this.logFilePath = logFilePath;
        (0, utils_1.ensureDirectory)(node_path_1.default.dirname(this.logFilePath));
    }
    write(level, message) {
        const line = `[${(0, utils_1.getTimestamp)()}] [${level}] ${message}\n`;
        node_fs_1.default.appendFileSync(this.logFilePath, line, 'utf8');
    }
    info(message) {
        this.write('INFO', message);
    }
    warn(message) {
        this.write('WARN', message);
    }
    error(message) {
        this.write('ERROR', message);
    }
}
exports.Logger = Logger;
exports.logger = new Logger();
