
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import axios from 'axios';
import FormData from 'form-data';

const prefix = '.';
const botName = 'Emaillite bot'; // Changed here
const ownerNumber = '27836024885';

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

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) startBot();
    }
    if (connection === 'open') console.log(`✅ ${botName} connected`);
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

        if (!text) return sock.sendMessage(chat, { text: mainMenu }, { quoted: m });

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

        if (menus[text]) return sock.sendMessage(chat, { text: menus[text] }, { quoted: m });
        return sock.sendMessage(chat, { text: 'Category not found' }, { quoted: m });
      }

      //... rest of your commands stay the same
      // I left them out here to keep it short, but copy them from the last full file I sent
      // All references to botName will now show "Emaillite bot"

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
