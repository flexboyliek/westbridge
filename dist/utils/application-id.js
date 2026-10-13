"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateApplicationId = generateApplicationId;
const node_crypto_1 = require("node:crypto");
function generateApplicationId() {
    return `APP-${(0, node_crypto_1.randomBytes)(3).toString('hex').toUpperCase()}`;
}
