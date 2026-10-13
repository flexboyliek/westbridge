"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APPLICATION_QUESTIONS = void 0;
exports.APPLICATION_QUESTIONS = [
    {
        key: 'robloxUsername',
        prompt: '**Question 1 of 9 — Roblox Username**\nPlease enter your Roblox username.',
        validate: (value) => (value.length < 2 ? 'Please enter a valid Roblox username.' : null),
    },
    {
        key: 'timezone',
        prompt: '**Question 2 of 9 — Timezone**\nWhat is your timezone?\n\nExamples:\n• EST (UTC-5)\n• CST (UTC-6)\n• PST (UTC-8)\n• GMT',
        validate: (value) => (value.length < 2 ? 'Please enter your timezone.' : null),
    },
    {
        key: 'dailyActivity',
        prompt: '**Question 3 of 9 — Daily Activity**\nOn a scale of **1–10**, how active are you daily?\n\n`1` = rarely online · `10` = very active',
        validate: (value) => {
            const rating = Number.parseInt(value, 10);
            if (Number.isNaN(rating) || rating < 1 || rating > 10) {
                return 'Please enter a number between 1 and 10.';
            }
            return null;
        },
    },
    {
        key: 'previousExperience',
        prompt: '**Question 4 of 9 — Staff Experience**\nDo you have previous moderation or staff experience?\nIf yes, explain your experience. If not, reply with `None`.',
        validate: (value) => (value.length < 2 ? 'Please provide an answer or reply with `None`.' : null),
    },
    {
        key: 'professionalismAnswer',
        prompt: '**Question 5 of 9 — Professionalism**\nWhy is professionalism important when representing Chaos staff?',
        validate: (value) => (value.length < 20 ? 'Please provide a more detailed answer (at least 20 characters).' : null),
    },
    {
        key: 'ticketManagementAnswer',
        prompt: '**Question 6 of 9 — Ticket Handling**\nHow would you manage multiple tickets at once while maintaining quality support?',
        validate: (value) => (value.length < 20 ? 'Please provide a more detailed answer (at least 20 characters).' : null),
    },
    {
        key: 'bannedPlayerScenario',
        prompt: '**Question 7 of 9 — Moderation Scenario**\nA player is permanently banned and aggressively argues in tickets demanding an unban. How would you handle this?',
        validate: (value) => (value.length < 20 ? 'Please provide a more detailed answer (at least 20 characters).' : null),
    },
    {
        key: 'exploitingScenario',
        prompt: '**Question 8 of 9 — Exploit Scenario**\nA player is exploiting during a fight. Explain your response step-by-step.',
        validate: (value) => (value.length < 20 ? 'Please provide a more detailed answer (at least 20 characters).' : null),
    },
    {
        key: 'permanentPunishmentAnswer',
        prompt: '**Question 9 of 9 — Permanent Punishment**\nWhen should permanent punishment be used?',
        validate: (value) => (value.length < 20 ? 'Please provide a more detailed answer (at least 20 characters).' : null),
    },
];
