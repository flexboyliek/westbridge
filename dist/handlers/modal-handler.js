"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDMAllModal = buildDMAllModal;
exports.parseDMAllModal = parseDMAllModal;
exports.buildEmbedModal = buildEmbedModal;
exports.buildTicketReasonModal = buildTicketReasonModal;
exports.buildCloseReasonModal = buildCloseReasonModal;
const discord_js_1 = require("discord.js");
function buildDMAllModal() {
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId('dmall:modal')
        .setTitle('Mass DM');
    const titleInput = new discord_js_1.TextInputBuilder()
        .setCustomId('title')
        .setLabel('Title')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setPlaceholder('Enter the message title')
        .setRequired(true);
    const descriptionInput = new discord_js_1.TextInputBuilder()
        .setCustomId('description')
        .setLabel('Description')
        .setStyle(discord_js_1.TextInputStyle.Paragraph)
        .setPlaceholder('Enter the message content')
        .setRequired(true);
    const buttonTextInput = new discord_js_1.TextInputBuilder()
        .setCustomId('buttonText')
        .setLabel('Button Text (optional)')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setPlaceholder('e.g., Click Here')
        .setRequired(false);
    const buttonUrlInput = new discord_js_1.TextInputBuilder()
        .setCustomId('buttonUrl')
        .setLabel('Button URL (optional)')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setPlaceholder('https://example.com')
        .setRequired(false);
    const firstActionRow = new discord_js_1.ActionRowBuilder().addComponents(titleInput);
    const secondActionRow = new discord_js_1.ActionRowBuilder().addComponents(descriptionInput);
    const thirdActionRow = new discord_js_1.ActionRowBuilder().addComponents(buttonTextInput);
    const fourthActionRow = new discord_js_1.ActionRowBuilder().addComponents(buttonUrlInput);
    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);
    return modal;
}
function parseDMAllModal(interaction) {
    const title = interaction.fields.getTextInputValue('title');
    const description = interaction.fields.getTextInputValue('description');
    const buttonText = interaction.fields.getTextInputValue('buttonText') || undefined;
    const buttonUrl = interaction.fields.getTextInputValue('buttonUrl') || undefined;
    return {
        title,
        description,
        buttonText,
        buttonUrl,
    };
}
function buildEmbedModal(channelId) {
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId(`embed:send:${channelId}`)
        .setTitle('Send Embed');
    const contentInput = new discord_js_1.TextInputBuilder()
        .setCustomId('embed_content')
        .setLabel('Message Contents (JSON)')
        .setStyle(discord_js_1.TextInputStyle.Paragraph)
        .setPlaceholder('Enter your embed/component JSON here...')
        .setRequired(true);
    const contentRow = new discord_js_1.ActionRowBuilder().addComponents(contentInput);
    modal.addComponents(contentRow);
    return modal;
}
function buildTicketReasonModal(type, label) {
    return new discord_js_1.ModalBuilder()
        .setCustomId(`support:ticketreason:${type}`)
        .setTitle(`${label} Ticket`)
        .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Reason for opening ticket')
        .setStyle(discord_js_1.TextInputStyle.Paragraph)
        .setPlaceholder('Please describe your issue or request...')
        .setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
        .setCustomId('robloxUsername')
        .setLabel('Roblox Username')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setPlaceholder('Your Roblox username')
        .setRequired(true)));
}
function buildCloseReasonModal() {
    return new discord_js_1.ModalBuilder()
        .setCustomId('support:close:reason')
        .setTitle('Close Ticket')
        .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
        .setCustomId('closeReason')
        .setLabel('Reason for closing ticket')
        .setStyle(discord_js_1.TextInputStyle.Paragraph)
        .setPlaceholder('Please explain why this ticket is being closed...')
        .setRequired(true)));
}
