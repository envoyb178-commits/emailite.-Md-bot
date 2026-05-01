/* ============================================
   EMAILLITE BOT – Message Serialization Module
   Handles message parsing, downloads, media, admin checks, etc.
   ============================================ */

const {
    getContentType,
    downloadContentFromMessage,
    generateWAMessageFromContent,
    jidDecode,
    generateForwardMessageContent,
    jidNormalizedUser,
} = require('baileys');
const { fromBuffer } = require('file-type');
const {
    addExifToWebP,
    imageToWebP,
    videoToWebP,
    isUrl,
    getBuffer,
} = require('./emaillite-sticker-utils'); // adjust path as needed
const fs = require('fs');
const fetch = require('node-fetch');
const config = require('../config');
const path = require('path');

// Helper: sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Decode JID
const decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid) || jid.includes(':')) {
        try {
            const decoded = jidDecode ? jidDecode(jid) : null;
            if (decoded && decoded.user && decoded.server) {
                return decoded.user + '@' + decoded.server;
            }
            return jid;
        } catch {
            return jid;
        }
    }
    return jid;
};

// Download media from message
async function downloadMedia(message, savePath) {
    const mediaTypes = {
        imageMessage: 'image',
        videoMessage: 'video',
        stickerMessage: 'sticker',
        documentMessage: 'document',
        audioMessage: 'audio',
    };

    try {
        let type = Object.keys(message)[0];
        let msg = message;
        if (type === 'ephemeralMessage') {
            msg = message.ephemeralMessage.message;
            type = Object.keys(msg)[0];
        }
        if (type === 'viewOnceMessage') {
            msg = message.viewOnceMessage.message;
            type = Object.keys(msg)[0];
        }
        const stream = await downloadContentFromMessage(msg[type], mediaTypes[type]);
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        if (savePath) {
            await fs.promises.writeFile(savePath, buffer);
            return savePath;
        }
        return buffer;
    } catch (err) {
        console.error('Error downloading media:', err);
        throw err;
    }
}

// Check if user is admin in group
async function isAdmin(groupId, userId, sock) {
    const groupMetadata = await sock.groupMetadata(groupId);
    const participant = groupMetadata.participants.find((p) => p.id === userId);
    return participant?.admin === 'admin' || participant?.admin === 'superadmin';
}

// Main serialization function (adds helper methods to message object)
async function serialize(message, sock) {
    if (message.key) {
        message.id = message.key.id;
        message.fromMe = message.key.fromMe;
        message.isGroup = message.key.remoteJid.endsWith('@g.us');
        message.jid = message.isGroup ? message.key.remoteJid : message.key.remoteJid;
        message.user = decodeJid(sock.user && sock.user.id);
        message.sender = message.isGroup
            ? message.key.participant
            : message.fromMe
            ? sock.user.id
            : message.key.remoteJid;
        message.botNumber = (sock.user?.id || '').split(':')[0] + '@s.whatsapp.net';
        message.isBotAdmin = async (userId) => await isAdmin(message.jid, userId, sock);
        message.sudo = config.SUDO ? config.SUDO.split(',').map((n) => n.trim()) : [];
        message.isOwner = message.sudo.includes(message.sender?.split('@')[0]);
        message.isSudo = message.isOwner;
        message.prefix = config.HANDLERS === 'MULTI_HANDLERS' ? '' : config.HANDLERS;
    }

    if (message.message) {
        message.type = await getContentType(message.message);
        if (message.type === 'ephemeralMessage') {
            message.message = message.message.ephemeralMessage.message;
            const newType = Object.keys(message.message)[0];
            message.type = newType;
            if (newType === 'viewOnceMessage') {
                message.message = message.message.viewOnceMessage.message;
                message.type = await getContentType(message.message);
            }
        }
        if (message.type === 'viewOnceMessage') {
            message.message = message.message.viewOnceMessage.message;
            message.type = await getContentType(message.message);
        }

        // Mentioned JIDs
        try {
            message.mentionedJid =
                message.message[message.type]?.contextInfo?.mentionedJid || [];
        } catch {
            message.mentionedJid = [];
        }

        // Quoted message handling
        try {
            const ctxInfo = message.message[message.type]?.contextInfo;
            if (ctxInfo && ctxInfo.quotedMessage) {
                let quotedMsg = ctxInfo.quotedMessage;
                let quotedType = Object.keys(quotedMsg)[0];
                let quotedContent = quotedMsg[quotedType];
                if (quotedType === 'viewOnceMessageV2') {
                    quotedMsg = quotedMsg.viewOnceMessageV2.message;
                    quotedType = Object.keys(quotedMsg)[0];
                    quotedContent = quotedMsg[quotedType];
                } else if (quotedMsg.ephemeralMessage) {
                    quotedMsg = quotedMsg.ephemeralMessage.message;
                    quotedType = Object.keys(quotedMsg)[0];
                    quotedContent = quotedMsg[quotedType];
                }
                message.quoted = {
                    type: quotedType,
                    stanzaId: ctxInfo.stanzaId,
                    sender: ctxInfo.participant,
                    message: quotedMsg,
                    fromMe: ctxInfo.participant === sock.user.id,
                    mtype: quotedType,
                    text:
                        quotedContent?.text ||
                        quotedContent?.caption ||
                        quotedContent?.contentText ||
                        '',
                    key: {
                        id: ctxInfo.stanzaId,
                        fromMe: ctxInfo.participant === sock.user.id,
                        remoteJid: message.jid,
                    },
                    download: (savePath) => downloadMedia(quotedMsg, savePath),
                };
            } else {
                message.quoted = null;
            }
        } catch {
            message.quoted = null;
        }

        // Message body
        try {
            message.text =
                message.message.conversation ||
                message.message[message.type]?.text ||
                message.message[message.type]?.caption ||
                message.message[message.type]?.contentText ||
                (message.type === 'buttonsResponseMessage' &&
                    message.message.buttonsResponseMessage.selectedButtonId) ||
                '';
            message.body = message.text;
        } catch {
            message.body = '';
        }
    }

    // Helper: download and save media
    message.downloadAndSaveMedia = async (msg, fileName, useExtension = true) => {
        let mediaMsg = msg.message ? msg.message : msg;
        let mime = (msg.message || msg).mimetype || '';
        let type = msg.type
            ? msg.type.replace(/Message/gi, '')
            : mime.split('/')[0];
        const stream = await downloadContentFromMessage(mediaMsg, type);
        let buffer = Buffer.alloc(0);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        const fileInfo = await fromBuffer(buffer);
        const ext = fileInfo?.ext || 'bin';
        const finalPath = useExtension ? fileName + '.' + ext : fileName;
        await fs.promises.writeFile(finalPath, buffer);
        return finalPath;
    };

    // Uptime helpers
    message.runtime = async () => {
        let seconds = process.uptime();
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${days > 0 ? days + (days === 1 ? ' day, ' : ' days, ') : ''}${
            hours > 0 ? hours + (hours === 1 ? ' hour, ' : ' hours, ') : ''
        }${minutes > 0 ? minutes + (minutes === 1 ? ' minute, ' : ' minutes, ') : ''}${
            secs > 0 ? secs + (secs === 1 ? ' second' : ' seconds') : ''
        }`;
    };
    message.uptime = async () => {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // File / media helpers
    message.getFile = async (input, saveFile = false) => {
        let buffer;
        if (Buffer.isBuffer(input)) buffer = input;
        else if (/^data:.*?\/.*?;base64,/i.test(input))
            buffer = Buffer.from(input.split(',')[1], 'base64');
        else if (/^https?:\/\//.test(input))
            buffer = await getBuffer(input).then(async () => (await fetch(input)).buffer());
        else if (fs.existsSync(input)) buffer = fs.readFileSync(input);
        else if (typeof input === 'string') buffer = Buffer.from(input);
        else buffer = Buffer.alloc(0);

        if (!Buffer.isBuffer(buffer))
            throw new Error('Result is not a buffer');

        const fileInfo = await fromBuffer(buffer);
        let filename = null;
        if (saveFile && !filename)
            filename = path.join(__dirname, '../tmp/' + Date.now() + '.' + fileInfo.ext);
        if (saveFile) await fs.promises.writeFile(filename, buffer);
        return { res: null, filename, ...fileInfo, data: buffer };
    };

    message.sendFile = async (input, options = {}) => {
        const { data } = await message.getFile(input);
        const fileInfo = await fromBuffer(data);
        return sock.sendMessage(
            message.jid,
            { [fileInfo.mime.split('/')[0]]: data, ...options },
            options
        );
    };

    message.forward = async (jid, quotedMsg, options = {}) => {
        let forwardMsg = quotedMsg;
        if (options.viewOnce) {
            forwardMsg = forwardMsg?.viewOnceMessage?.message || forwardMsg;
            const type = Object.keys(forwardMsg)[0];
            delete forwardMsg[type]?.contextInfo;
            forwardMsg = { ...forwardMsg.viewOnceMessage?.message };
        }
        if (options.mentions)
            forwardMsg.mentions = options.mentions;
        const content = await generateForwardMessageContent(forwardMsg, false);
        let msgType = await getContentType(content);
        if (options.ptt) content[msgType].ptt = options.ptt;
        if (options.seconds) content[msgType].seconds = options.seconds;
        if (options.caption) content[msgType].caption = options.caption;
        if (options.contextInfo) content[msgType].contextInfo = options.contextInfo;
        if (options.mentionedJid)
            content[msgType].contextInfo.mentionedJid = options.mentionedJid;
        const waMsg = await generateWAMessageFromContent(jid, content, options);
        await sock.relayMessage(jid, waMsg.message, { messageId: waMsg.key.id });
        return waMsg;
    };

    message.reply = async (text) => {
        return sock.sendMessage(message.jid, { text }, { quoted: message });
    };

    message.react = async (emoji) => {
        return sock.sendMessage(message.jid, { react: { text: emoji, key: message.key } });
    };

    message.poll = async (name, options, selectableCount = 1) => {
        return sock.sendMessage(message.jid, {
            poll: { name, values: options, selectableCount },
        });
    };

    message.sendFromUrl = async (url, options = {}) => {
        const buffer = await getBuffer(url).then(async () => (await fetch(url)).buffer());
        const fileInfo = await fromBuffer(buffer);
        if (fileInfo.mime.split('/')[0] === 'audio') options.mimetype = 'audio/mpeg';
        return sock.sendMessage(
            message.jid,
            { [fileInfo.mime.split('/')[0]]: buffer, ...options },
            options
        );
    };

    message.send = async (jid, content, type = 'text', packInfo = { packname: 'Emaillite', author: 'Emaillite' }) => {
        switch (type.toLowerCase()) {
            case 'text':
                return sock.sendMessage(jid, { text: content, ...packInfo }, packInfo);
            case 'image':
                return sock.sendMessage(
                    jid,
                    { image: Buffer.isBuffer(content) ? content : await getBuffer(content), ...packInfo },
                    packInfo
                );
            case 'video':
                return sock.sendMessage(
                    jid,
                    { video: Buffer.isBuffer(content) ? content : await getBuffer(content), ...packInfo },
                    packInfo
                );
            case 'audio':
                return sock.sendMessage(
                    jid,
                    { audio: Buffer.isBuffer(content) ? content : await getBuffer(content), ...packInfo },
                    packInfo
                );
            case 'sticker':
                const { data } = await message.getFile(content);
                const stickerBuffer =
                    fileInfo.mime === 'image/webp'
                        ? await addExifToWebP(data, packInfo)
                        : fileInfo.mime.includes('video')
                        ? await videoToWebP(data, packInfo)
                        : fileInfo.mime.includes('image')
                        ? await imageToWebP(data, packInfo)
                        : null;
                if (!stickerBuffer) throw new Error('Unsupported media type');
                return sock.sendMessage(jid, { sticker: stickerBuffer, ...packInfo }, packInfo);
            default:
                throw new Error('Unsupported type');
        }
    };

    // Auto typing / presence
    if (config.ALWAYS_ONLINE) {
        sock.sendPresenceUpdate('available', message.jid);
    } else {
        sock.sendPresenceUpdate('unavailable', message.jid);
    }

    return message;
}

module.exports = {
    downloadMedia,
    isAdmin,
    serialize,
    decodeJid,
    sleep,
};