import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import axios from 'axios';
import FormData from 'form-data';

const prefix = '.';
const botName = 'Emaillite bot';
const ownerNumber = '27836024885';
const menuImage = 'https://files.catbox.moe/abc123.jpg'; // Replace with your image URL

const db = {
  antilink: false,
  antispam: false,
  warn: {},
  mute: false,
  sudo: [ownerNumber]
};

const API = {
  ai: 'https://api.akuari.my.id/ai/gpt?query=',
  img: 'https://api.akuari.my.id/ai/txt2img?prompt=',
  ytmp3: 'https://api.cobain.xyz/api/ytmp3?url=',
  ytmp4: 'https://api.cobain.xyz/api/ytmp4?url=',
  ytsearch: 'https://api.cobain.xyz/api/ytsearch?query=',
  remini: 'https://api.akuari.my.id/tools/remini?url=',
  removebg: 'https://api.akuari.my.id/tools/removebg?url=',
  crypto: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd'
};

function isAdmin(participants, user) {
  const admin = participants.find(p => p.id === user);
  return admin && (admin.admin === 'admin' || admin.admin === 'superadmin');
}

function isSudo(sender) {
  return db.sudo.includes(sender.split('@')[0]);
}

async function uploadTo0x0(buffer, filename = 'image.jpg') {
  const form = new FormData();
  form.append('file', buffer, filename);
  const { data } = await axios.post('https://0x0.st', form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity
  });
  return data.trim();
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    keepAliveIntervalMs: 30000,
    printQRInTerminal: false
  });

  if (!sock.authState.creds.registered) {
    const code = await sock.requestPairingCode(ownerNumber);
    console.log(`\n✅ Pairing Code for ${ownerNumber}: ${code}\n`);
  }

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) startBot();
    }
    if (connection === 'open') {
      console.log(`✅ ${botName} connected`);
      // Send startup image to owner
      await sock.sendMessage(ownerNumber + '@s.whatsapp.net', {
        image: { url: menuImage },
        caption: `✅ *${botName}* is online\nPrefix: ${prefix}\nType ${prefix}menu`
      }).catch(() => {});
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
    if (!body.startsWith(prefix)) return;

    const [cmd,...args] = body.slice(prefix.length).trim().split(/ +/);
    const text = args.join(' ');
    const chat = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    const senderNum = sender.split('@')[0];
    const isGroup = chat.endsWith('@g.us');
    const metadata = isGroup? await sock.groupMetadata(chat).catch(() => null) : null;
    const participants = metadata? metadata.participants : [];
    const isAdminUser = isGroup? isAdmin(participants, sender) : false;

    try {
      if (cmd === 'menu') {
        const mainMenu = `┌─❖ *${botName}* ❖
│ Online 24/7 | v4.0.0
└─────────────┈⳹

╭─❖ *CATEGORIES* ❖
│.menu group
│.menu anti
│.menu ai
│.menu img
│.menu music
│.menu tools
│.menu owner
╰─────────────

Type.menu [category] to view commands`;

        const menus = {
          group: `╭─❖ *GROUP MENU* ❖
│.antilink
│.kick
│.addmember
│.promote
│.demote
│.setname
│.setdesc
│.members
│.lockgroup
│.unlockgroup
│.tagall
│.everyone
│.opengroup
│.closegroup
│.leavegc
│.invitelink
│.revokelink
╰─────────────`,
          anti: `╭─❖ *ANTI MENU* ❖
│.antilink
│.mute
│.unmute
╰─────────────`,
          ai: `╭─❖ *AI MENU* ❖
│.ai
│.chat
│.deepseek
│.copilot
╰─────────────`,
          img: `╭─❖ *AI IMAGE MENU* ❖
│.img
│.logo
╰─────────────`,
          music: `╭─❖ *MUSIC MENU* ❖
│.play
│.song
│.play2
│.video
│.ytmp3
│.ytmp4
╰─────────────`,
          tools: `╭─❖ *TOOLS MENU* ❖
│.hdimg
│.removebg
│.crypto
╰─────────────`,
          owner: `╭─❖ *OWNER MENU* ❖
│.broadcastall
│.setsudo
│.delsudo
╰─────────────`
        };

        if (!text) {
          return sock.sendMessage(chat, { image: { url: menuImage }, caption: mainMenu }, { quoted: m });
        }
        if (menus[text]) {
          return sock.sendMessage(chat, { image: { url: menuImage }, caption: menus[text] }, { quoted: m });
        }
        return sock.sendMessage(chat, { text: 'Category not found' }, { quoted: m });
      }

      if (cmd === 'ai' || cmd === 'chat' || cmd === 'copilot') {
        if (!text) return sock.sendMessage(chat, { text: `Usage: ${prefix}${cmd} hello` }, { quoted: m });
        const { data } = await axios.get(API.ai + encodeURIComponent(text));
        return sock.sendMessage(chat, { text: data.respon || data.result }, { quoted: m });
      }

      if (cmd === 'deepseek') {
        if (!text) return sock.sendMessage(chat, { text: `Usage: ${prefix}deepseek hello` }, { quoted: m });
        const { data } = await axios.get(API.ai + encodeURIComponent(text) + '&model=deepseek');
        return sock.sendMessage(chat, { text: data.respon || data.result }, { quoted: m });
      }

      if (cmd === 'img') {
        if (!text) return sock.sendMessage(chat, { text: `Usage: ${prefix}img cyberpunk city` }, { quoted: m });
        const { data } = await axios.get(API.img + encodeURIComponent(text));
        return sock.sendMessage(chat, { image: { url: data.result }, caption: text }, { quoted: m });
      }

      if (cmd === 'logo') {
        if (!text) return sock.sendMessage(chat, { text: `Usage: ${prefix}logo Emaillite bot` }, { quoted: m });
        const { data } = await axios.get(API.img + encodeURIComponent('logo design ' + text));
        return sock.sendMessage(chat, { image: { url: data.result } }, { quoted: m });
      }

      if (['play', 'song', 'play2'].includes(cmd)) {
        if (!text) return sock.sendMessage(chat, { text: `Usage: ${prefix}${cmd} faded` }, { quoted: m });
        let url = text;
        if (!text.startsWith('http')) {
          const search = await axios.get(API.ytsearch + encodeURIComponent(text));
          if (!search.data?.result?.[0]?.url) return sock.sendMessage(chat, { text: 'Song not found' }, { quoted: m });
          url = search.data.result[0].url;
        }
        const { data } = await axios.get(API.ytmp3 + encodeURIComponent(url));
        if (!data.status) return sock.sendMessage(chat, { text: 'Failed to download' }, { quoted: m });
        return sock.sendMessage(chat, { audio: { url: data.data.url }, mimetype: 'audio/mpeg', fileName: data.data.title + '.mp3' }, { quoted: m });
      }

      if (cmd === 'video') {
        if (!text) return sock.sendMessage(chat, { text: `Usage: ${prefix}video [yt link]` }, { quoted: m });
        const { data } = await axios.get(API.ytmp4 + encodeURIComponent(text));
        return sock.sendMessage(chat, { video: { url: data.data.url }, caption: data.data.title }, { quoted: m });
      }

      if (cmd === 'ytmp3') {
        if (!text) return sock.sendMessage(chat, { text: `Usage: ${prefix}ytmp3 [yt link]` }, { quoted: m });
        const { data } = await axios.get(API.ytmp3 + encodeURIComponent(text));
        return sock.sendMessage(chat, { audio: { url: data.data.url }, mimetype: 'audio/mpeg' }, { quoted: m });
      }

      if (cmd === 'ytmp4') {
        if (!text) return sock.sendMessage(chat, { text: `Usage: ${prefix}ytmp4 [yt link]` }, { quoted: m });
        const { data } = await axios.get(API.ytmp4 + encodeURIComponent(text));
        return sock.sendMessage(chat, { video: { url: data.data.url }, caption: data.data.title }, { quoted: m });
      }

      if (cmd === 'hdimg') {
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.imageMessage) return sock.sendMessage(chat, { text: 'Reply to an image' }, { quoted: m });
        const media = await sock.downloadMediaMessage(quoted);
        const url = await uploadTo0x0(media, 'hd.jpg');
        const { data } = await axios.get(API.remini + encodeURIComponent(url));
        return sock.sendMessage(chat, { image: { url: data.result } }, { quoted: m });
      }

      if (cmd === 'removebg') {
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.imageMessage) return sock.sendMessage(chat, { text: 'Reply to an image' }, { quoted: m });
        const media = await sock.downloadMediaMessage(quoted);
        const url = await uploadTo0x0(media, 'bg.jpg');
        const { data } = await axios.get(API.removebg + encodeURIComponent(url));
        return sock.sendMessage(chat, { image: { url: data.result } }, { quoted: m });
      }

      if (cmd === 'crypto') {
        const { data } = await axios.get(API.crypto);
        const msg = `💰 Crypto Prices\nBTC: $${data.bitcoin.usd}\nETH: $${data.ethereum.usd}\nSOL: $${data.solana.usd}`;
        return sock.sendMessage(chat, { text: msg }, { quoted: m });
      }

      if (cmd === 'antilink') {
        if (!isAdminUser) return sock.sendMessage(chat, { text: 'Admin only' }, { quoted: m });
        db.antilink = args[0] === 'on';
        return sock.sendMessage(chat, { text: `Antilink ${args[0]}` }, { quoted: m });
      }

      if (cmd === 'kick') {
        if (!isGroup ||!isAdminUser) return sock.sendMessage(chat, { text: 'Admin only' }, { quoted: m });
        const target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return sock.sendMessage(chat, { text: 'Tag someone to kick' }, { quoted: m });
        await sock.groupParticipantsUpdate(chat, [target], 'remove');
        return sock.sendMessage(chat, { text: 'User kicked' }, { quoted: m });
      }

      if (cmd === 'addmember') {
        if (!isGroup ||!isAdminUser) return sock.sendMessage(chat, { text: 'Admin only' }, { quoted: m });
        await sock.groupParticipantsUpdate(chat, [args[0] + '@s.whatsapp.net'], 'add');
        return sock.sendMessage(chat, { text: 'User added' }, { quoted: m });
      }

      if (cmd === 'promote') {
        if (!isGroup ||!isAdminUser) return sock.sendMessage(chat, { text: 'Admin only' }, { quoted: m });
        const target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        await sock.groupParticipantsUpdate(chat, [target], 'promote');
        return sock.sendMessage(chat, { text: 'Promoted' }, { quoted: m });
      }

      if (cmd === 'demote') {
        if (!isGroup ||!isAdminUser) return sock.sendMessage(chat, { text: 'Admin only' }, { quoted: m });
        const target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        await sock.groupParticipantsUpdate(chat, [target], 'demote');
        return sock.sendMessage(chat, { text: 'Demoted' }, { quoted: m });
      }

      if (cmd === 'setname') {
        if (!isGroup ||!isAdminUser) return sock.sendMessage(chat, { text: 'Admin only' }, { quoted: m });
        await sock.groupUpdateSubject(chat, text);
        return sock.sendMessage(chat, { text: 'Group name updated' }, { quoted: m });
      }

      if (cmd === 'setdesc') {
        if (!isGroup ||!isAdminUser) return sock.sendMessage(chat, { text: 'Admin only' }, { quoted: m });
        await sock.groupUpdateDescription(chat, text);
        return sock.sendMessage(chat, { text: 'Group desc updated' }, { quoted: m });
      }

      if (cmd === 'members') {
        if (!isGroup) return sock.sendMessage(chat, { text: 'Group only' }, { quoted: m });
        const list = participants.map(p => '@' + p.id.split('@')[0]).join('\n');
        return sock.sendMessage(chat, { text: `Members:\n${list}`, mentions: participants.map(p => p.id) }, { quoted: m });
      }

      if (cmd === 'lockgroup') {
        if (!isGroup ||!isAdminUser) return sock.sendMessage(chat, { text: 'Admin only' }, { quoted: m });
        await sock.groupSettingUpdate(chat, 'announcement');
        return sock.sendMessage(chat, { text: 'Group locked' }, { quoted: m });
      }

      if (cmd === 'unlockgroup') {
        if (!isGroup ||!isAdminUser) return sock.sendMessage(chat, { text: 'Admin only' }, { quoted: m });
        await sock.groupSettingUpdate(chat, 'not_announcement');
        return sock.sendMessage(chat, { text: 'Group unlocked' }, { quoted: m });
      }

      if (cmd === 'tagall' || cmd === 'everyone') {
        if (!isGroup ||!isAdminUser) return sock.sendMessage(chat, { text: 'Admin only' }, { quoted: m });
        return sock.sendMessage(chat, { text: text || 'Everyone', mentions: participants.map(p => p.id) });
      }

      if (cmd === 'opengroup') {
        if (!isGroup ||!isAdminUser) return sock.sendMessage(chat, { text: 'Admin only' }, { quoted: m });
        await sock.groupSettingUpdate(chat, 'not_announcement');
        return sock.sendMessage(chat, { text: 'Group opened' }, { quoted: m });
      }

      if (cmd === 'closegroup') {
        if (!isGroup ||!isAdminUser) return sock.sendMessage(chat, { text: 'Admin only' }, { quoted: m });
        await sock.groupSettingUpdate(chat, 'announcement');
        return sock.sendMessage(chat, { text: 'Group closed' }, { quoted: m });
      }

      if (cmd === 'leavegc') {
        if (!isGroup) return sock.sendMessage(chat, { text: 'Group only' }, { quoted: m });
        await sock.groupLeave(chat);
        return sock.sendMessage(chat, { text: 'Left group' }, { quoted: m });
      }

      if (cmd === 'invitelink') {
        if (!isGroup) return sock.sendMessage(chat, { text: 'Group only' }, { quoted: m });
        const code = await sock.groupInviteCode(chat);
        return sock.sendMessage(chat, { text: `https://chat.whatsapp.com/${code}` }, { quoted: m });
      }

      if (cmd === 'revokelink') {
        if (!isGroup ||!isAdminUser) return sock.sendMessage(chat, { text: 'Admin only' }, { quoted: m });
        await sock.groupRevokeInvite(chat);
        return sock.sendMessage(chat, { text: 'Link revoked' }, { quoted: m });
      }

      if (cmd === 'mute') {
        if (!isGroup ||!isAdminUser) return sock.sendMessage(chat, { text: 'Admin only' }, { quoted: m });
        db.mute = true;
        return sock.sendMessage(chat, { text: 'Group muted' }, { quoted: m });
      }

      if (cmd === 'unmute') {
        if (!isGroup ||!isAdminUser) return sock.sendMessage(chat, { text: 'Admin only' }, { quoted: m });
        db.mute = false;
        return sock.sendMessage(chat, { text: 'Group unmuted' }, { quoted: m });
      }

      if (cmd === 'broadcastall') {
        if (!isSudo(senderNum)) return sock.sendMessage(chat, { text: 'Owner only' }, { quoted: m });
        for (let id of Object.keys(sock.chats)) {
          if (id.endsWith('@s.whatsapp.net')) await sock.sendMessage(id, { text: `[BROADCAST]\n${text}` });
        }
        return sock.sendMessage(chat, { text: 'Broadcast sent' }, { quoted: m });
      }

      if (cmd === 'setsudo') {
        if (senderNum!== ownerNumber) return sock.sendMessage(chat, { text: 'Owner only' }, { quoted: m });
        db.sudo.push(args[0]);
        return sock.sendMessage(chat, { text: 'Sudo added' }, { quoted: m });
      }

      if (cmd === 'delsudo') {
        if (senderNum!== ownerNumber) return sock.sendMessage(chat, { text: 'Owner only' }, { quoted: m });
        db.sudo = db.sudo.filter(n => n!== args[0]);
        return sock.sendMessage(chat, { text: 'Sudo removed' }, { quoted: m });
      }

      if (cmd === 'ping') {
        return sock.sendMessage(chat, { text: `✅ ${botName} is online` }, { quoted: m });
      }

    } catch (err) {
      console.log(err);
      sock.sendMessage(chat, { text: '❌ Error occurred' }, { quoted: m });
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message ||!m.key.remoteJid.endsWith('@g.us')) return;
    const chat = m.key.remoteJid;
    if (!db.antilink) return;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
    const metadata = await sock.groupMetadata(chat);
    if (text.includes('http') &&!isAdmin(metadata.participants, m.key.participant)) {
      await sock.sendMessage(chat, { delete: m.key });
      sock.sendMessage(chat, { text: '🚫 Links not allowed' });
    }
  });
}

startBot();
