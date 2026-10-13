"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationRepository = exports.ApplicationRepository = void 0;
const db_1 = require("./db");
const logger_1 = require("../logger");
function mapRow(row) {
    return {
        id: String(row[0]),
        discord_user_id: String(row[1]),
        discord_username: String(row[2]),
        roblox_username: String(row[3]),
        timezone: String(row[4]),
        daily_activity: Number(row[5]),
        previous_experience: String(row[6]),
        professionalism_answer: String(row[7]),
        ticket_management_answer: String(row[8]),
        banned_player_scenario: String(row[9]),
        exploiting_scenario: String(row[10]),
        permanent_punishment_answer: String(row[11]),
        status: row[12],
        reviewer_id: row[13] ? String(row[13]) : null,
        reviewer_username: row[14] ? String(row[14]) : null,
        reviewed_at: row[15] ? String(row[15]) : null,
        thread_id: row[16] ? String(row[16]) : null,
        pending_message_id: row[17] ? String(row[17]) : null,
        created_at: String(row[18]),
    };
}
function mapApplication(row) {
    return {
        id: row.id,
        discordUserId: row.discord_user_id,
        discordUsername: row.discord_username,
        robloxUsername: row.roblox_username,
        timezone: row.timezone,
        dailyActivity: row.daily_activity,
        previousExperience: row.previous_experience,
        professionalismAnswer: row.professionalism_answer,
        ticketManagementAnswer: row.ticket_management_answer,
        bannedPlayerScenario: row.banned_player_scenario,
        exploitingScenario: row.exploiting_scenario,
        permanentPunishmentAnswer: row.permanent_punishment_answer,
        status: row.status,
        reviewerId: row.reviewer_id,
        reviewerUsername: row.reviewer_username,
        reviewedAt: row.reviewed_at,
        threadId: row.thread_id,
        pendingMessageId: row.pending_message_id,
        createdAt: row.created_at,
    };
}
async function queryOne(sql, params = []) {
    const db = await (0, db_1.getDatabase)();
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const row = stmt.step() ? stmt.get() : null;
    stmt.free();
    return row;
}
class ApplicationRepository {
    async create(id, discordUserId, discordUsername, answers) {
        const db = await (0, db_1.getDatabase)();
        const createdAt = new Date().toISOString();
        db.run(`INSERT INTO applications (
        id, discord_user_id, discord_username,
        roblox_username, timezone, daily_activity,
        previous_experience, professionalism_answer,
        ticket_management_answer, banned_player_scenario,
        exploiting_scenario, permanent_punishment_answer,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`, [
            id,
            discordUserId,
            discordUsername,
            answers.robloxUsername,
            answers.timezone,
            answers.dailyActivity,
            answers.previousExperience,
            answers.professionalismAnswer,
            answers.ticketManagementAnswer,
            answers.bannedPlayerScenario,
            answers.exploitingScenario,
            answers.permanentPunishmentAnswer,
            createdAt,
        ]);
        (0, db_1.persistDatabase)();
        logger_1.logger.info(`Created application ${id} for user ${discordUserId}`);
        return (await this.findById(id));
    }
    async findById(id) {
        const row = await queryOne('SELECT * FROM applications WHERE id = ?', [id]);
        return row ? mapApplication(mapRow(row)) : null;
    }
    async findPendingByUserId(discordUserId) {
        const row = await queryOne(`SELECT * FROM applications
       WHERE discord_user_id = ? AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`, [discordUserId]);
        return row ? mapApplication(mapRow(row)) : null;
    }
    async setPendingMessageId(id, messageId) {
        const db = await (0, db_1.getDatabase)();
        db.run('UPDATE applications SET pending_message_id = ? WHERE id = ?', [messageId, id]);
        (0, db_1.persistDatabase)();
    }
    async setThreadId(id, threadId) {
        const db = await (0, db_1.getDatabase)();
        db.run('UPDATE applications SET thread_id = ? WHERE id = ?', [threadId, id]);
        (0, db_1.persistDatabase)();
        logger_1.logger.info(`Linked thread ${threadId} to application ${id}`);
    }
    async setReviewed(id, status, reviewerId, reviewerUsername) {
        const db = await (0, db_1.getDatabase)();
        db.run(`UPDATE applications
       SET status = ?, reviewer_id = ?, reviewer_username = ?, reviewed_at = ?
       WHERE id = ?`, [status, reviewerId, reviewerUsername, new Date().toISOString(), id]);
        (0, db_1.persistDatabase)();
    }
}
exports.ApplicationRepository = ApplicationRepository;
exports.applicationRepository = new ApplicationRepository();
