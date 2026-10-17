"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationDmCommand = void 0;
exports.handleApplicationDmCommand = handleApplicationDmCommand;
exports.handleApplicationDmModal = handleApplicationDmModal;
exports.getApplicationDmCache = getApplicationDmCache;
exports.deleteApplicationDmCache = deleteApplicationDmCache;
const discord_js_1 = require("discord.js");
const whitelist_service_1 = require("../services/whitelist.service");
const dmCache = new Map();
exports.applicationDmCommand = new discord_js_1.SlashCommandBuilder()
    .setName('applicationdm')
    .setDescription('Send application notifications to members (staff only)')
    .addStringOption((option) => option.setName('type')
    .setDescription('Type of notification to send')
    .setRequired(true)
    .addChoices({ name: 'Application Being Reviewed', value: 'review' }, { name: 'Check Your Email', value: 'email' }, { name: 'Custom Message', value: 'custom' }))
    .addUserOption((option) => option.setName('recipient')
    .setDescription('The member to send the notification to')
    .setRequired(true));
async function handleApplicationDmCommand(interaction) {
    const allowedUserIds = ['882066901772152874', '1183977890866544645'];
    if (!allowedUserIds.includes(interaction.user.id) && !whitelist_service_1.whitelistService.isWhitelisted(interaction.user.id)) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
    }
    const type = interaction.options.getString('type');
    const recipient = interaction.options.getUser('recipient');
    if (!type || !recipient) {
        await interaction.reply({ content: 'Type and recipient are required.', ephemeral: true });
        return;
    }
    if (recipient.bot) {
        await interaction.reply({ content: 'Cannot send DMs to bots.', ephemeral: true });
        return;
    }
    if (type === 'custom') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('applicationdm:custom')
            .setTitle('Custom Application Message')
            .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
            .setCustomId('message')
            .setLabel('Your custom message')
            .setStyle(discord_js_1.TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(4000)));
        dmCache.set(interaction.user.id, { type, recipientId: recipient.id, staffId: interaction.user.id, staffName: interaction.user.tag });
        await interaction.showModal(modal);
        return;
    }
    const messages = {
        review: '**Application Update**\n\nHello! We wanted to let you know that your application is currently being reviewed by our team. Please remain patient while we complete the review process.\n\nThank you for your interest in joining our team!',
        email: '**Important Application Update**\n\nHello! Please check the email address you provided with your application. You should have received an important message from our team.\n\nPlease review your email as soon as possible.',
    };
    const message = messages[type];
    dmCache.set(interaction.user.id, { type, recipientId: recipient.id, customMessage: message, staffId: interaction.user.id, staffName: interaction.user.tag });
    const confirmRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('applicationdm:confirm')
        .setLabel('Confirm & Send')
        .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
        .setCustomId('applicationdm:cancel')
        .setLabel('Cancel')
        .setStyle(discord_js_1.ButtonStyle.Danger));
    await interaction.reply({
        content: `Are you sure you want to send this message to ${recipient}?`,
        embeds: [{
                title: 'Message Preview',
                description: message,
                color: 0x5865F2,
            }],
        components: [confirmRow],
        ephemeral: true,
    });
}
async function handleApplicationDmModal(interaction) {
    const cached = dmCache.get(interaction.user.id);
    if (!cached) {
        await interaction.reply({ content: 'Session expired. Run `/applicationdm` again.', ephemeral: true });
        return;
    }
    const customMessage = interaction.fields.getTextInputValue('message');
    cached.customMessage = customMessage;
    dmCache.set(interaction.user.id, cached);
    const confirmRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('applicationdm:confirm')
        .setLabel('Confirm & Send')
        .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
        .setCustomId('applicationdm:cancel')
        .setLabel('Cancel')
        .setStyle(discord_js_1.ButtonStyle.Danger));
    await interaction.reply({
        content: `Are you sure you want to send this custom message?`,
        embeds: [{
                title: 'Custom Message Preview',
                description: customMessage,
                color: 0x5865F2,
            }],
        components: [confirmRow],
        ephemeral: true,
    });
}
function getApplicationDmCache(userId) {
    return dmCache.get(userId);
}
function deleteApplicationDmCache(userId) {
    dmCache.delete(userId);
}
