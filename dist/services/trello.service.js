"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trelloService = exports.TrelloService = void 0;
const logger_1 = require("../logger");
const config_1 = require("../config");
class TrelloService {
    initialized = false;
    async initialize() {
        if (this.initialized)
            return;
        this.initialized = true;
        logger_1.logger.info('Trello service initialized');
    }
    async requestTrello(method, path, extraQuery = '') {
        const apiKey = config_1.config.trello.apiKey;
        const token = config_1.config.trello.token;
        const query = `key=${apiKey}&token=${token}${extraQuery ? '&' + extraQuery : ''}`;
        const url = `https://api.trello.com/1${path}?${query}`;
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Accept': 'application/json',
                },
            });
            if (!response.ok) {
                logger_1.logger.error(`Trello request failed: ${response.status} ${response.statusText}`);
                return null;
            }
            const text = await response.text();
            if (!text)
                return true;
            return JSON.parse(text);
        }
        catch (error) {
            logger_1.logger.error(`Trello request error: ${error.message}`);
            return null;
        }
    }
    async getBoardLists(boardId) {
        const lists = await this.requestTrello('GET', `/boards/${boardId}/lists`, 'fields=name,closed&filter=open');
        return lists || [];
    }
    async getListCards(listId) {
        const cards = await this.requestTrello('GET', `/lists/${listId}/cards`, 'fields=name,desc,closed&filter=open');
        return cards || [];
    }
    normalizeRoleName(listName) {
        const name = listName.toLowerCase().trim();
        const roleAliases = {
            'hos': 'hos',
            'headofstaff': 'hos',
            'headstaff': 'hos',
            'eater': 'eater',
            'staff': 'staff',
            'stafftitle': 'staff',
            'hh': 'hh',
            'heavy': 'hh',
            'hitter': 'hh',
            'heavyhitter': 'hh',
            'cc': 'cc',
            'creator': 'cc',
            'contentcreator': 'cc',
            'hh2': 'hh2',
            'heaviesthitter': 'hh2',
            'heaviesthitters': 'hh2',
            'chaotichitter': 'hh2',
            'chaotichitters': 'hh2',
            'hom': 'hom',
            'headmanagement': 'hom',
            'headofmanagement': 'hom',
            'management': 'hom',
        };
        return roleAliases[name] || null;
    }
    isRemoveList(listName) {
        const name = listName.toLowerCase().trim();
        const removeAliases = ['remove', 'removetitle', 'removetitles', 'untitle', 'clear', 'cleartitle', 'cleartitles'];
        return removeAliases.includes(name);
    }
    extractUsernames(text) {
        const usernames = [];
        for (const line of text.split(/[\r\n]+/)) {
            const username = line.replace(/^[-*\d.\s]+/, '').trim();
            if (username && !username.startsWith('#')) {
                usernames.push(username);
            }
        }
        return usernames;
    }
    async getStaffData(boardId) {
        const lists = await this.getBoardLists(boardId);
        const roles = [];
        for (const list of lists) {
            const shouldRemove = this.isRemoveList(list.name);
            const roleName = this.normalizeRoleName(list.name);
            if (!roleName && !shouldRemove) {
                continue;
            }
            const cards = await this.getListCards(list.id);
            const usernames = [];
            for (const card of cards) {
                const cardTitle = card.name.trim();
                if (cardTitle && cardTitle !== '---') {
                    if (shouldRemove) {
                        usernames.push(cardTitle);
                    }
                    else {
                        usernames.push(cardTitle);
                    }
                }
                const descUsernames = this.extractUsernames(card.desc);
                usernames.push(...descUsernames);
            }
            if (usernames.length > 0) {
                roles.push({
                    roleName: shouldRemove ? 'remove' : (roleName || 'unknown'),
                    usernames,
                });
            }
        }
        return {
            boardId,
            roles,
        };
    }
    async createCard(listId, cardName, cardDesc = '') {
        const result = await this.requestTrello('POST', `/cards`, `idList=${listId}&name=${encodeURIComponent(cardName)}&desc=${encodeURIComponent(cardDesc)}`);
        return result !== null;
    }
    async deleteCard(cardId) {
        const result = await this.requestTrello('DELETE', `/cards/${cardId}`);
        return result !== null;
    }
    async findListByName(boardId, listName) {
        const lists = await this.getBoardLists(boardId);
        const targetList = lists.find(list => list.name.toLowerCase() === listName.toLowerCase());
        return targetList?.id || null;
    }
    async findCardByName(listId, cardName) {
        const cards = await this.getListCards(listId);
        const targetCard = cards.find(card => card.name.toLowerCase() === cardName.toLowerCase());
        return targetCard?.id || null;
    }
    async getAllBoardsData() {
        const data = new Map();
        for (const [gameName, boardId] of Object.entries(config_1.config.trello.boards)) {
            const staffData = await this.getStaffData(boardId);
            data.set(gameName, staffData);
            logger_1.logger.info(`Fetched ${staffData.roles.length} role lists from ${gameName}`);
        }
        return data;
    }
}
exports.TrelloService = TrelloService;
exports.trelloService = new TrelloService();
