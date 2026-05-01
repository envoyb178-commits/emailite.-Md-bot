const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('EMAILLITE MD BOT is running'));
app.get('/ping', (req, res) => res.send('pong'));

app.listen(PORT, () => console.log(`✅ Web server online on port ${PORT}`));

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const config = require('./config');

process.on('uncaughtException', (err) => console.error('❌ Uncaught:', err));
process.on('unhandledRejection', (err) => console.error('❌ Rejection:', err));
process.setMaxListeners(0);

// FORCE DELETE OLD SESSION TO GET NEW PAIRING CODE
if (fs.existsSync(config.sessionDir)) {
  console.log('🗑️ Deleting old session to force new pairing...');
  fs.rmSync(config.sessionDir, { recursive: true, force: true });
}
fs.mkdirSync(config.sessionDir, { recursive: true });

// Global variables
const { owner, ownerNumber, botName, version, prefix, mode, sessionDir } = config;
global.config = config;
global.commands = {};
global.categories = {};

// YOUR NUMBER FOR AUTO-PAIRING
const PAIR_NUMBER = process.env.PAIR_NUMBER || "263777283870";

// LOAD PLUGINS
const loadPlugins = () => {
  global.commands = {};
  global.categories = {};
  const pluginDir = path.join(__dirname, 'plugins');
  
  if (!fs.existsSync(pluginDir)) {
    console.error(`❌ Plugin directory not found: ${pluginDir}`);
    return;
  }
  
  const pluginFiles = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));
  console.log(`📁 Found ${pluginFiles.length} plugin files`);
  
  pluginFiles.forEach(file => {
    try {
      const plugin = require(path.join(pluginDir, file));
      if (plugin.commands) {
        Object.entries(plugin.commands).forEach(([name, data]) => {
          global.commands[name] = {...data, file };
          if (data.category &&!global.categories[data.category]) {
            global.categories[data.category] = [];
          }
          if (data.category) {
            global.categories[data.category].push(name);
          }
        });
      }
    } catch (e) {
      console.error(`❌ Error loading plugin ${file}:`, e.message);
    }
  });
  console.log(`✅ Loaded ${Object.keys(global.commands).length} commands`);
};

loadPlugins();

// Utility functions
const getRuntime = () => {
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    return `${h}h ${m}m`;
};

const getRamUsed = () => `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`;
const getRamTotal = () => `${(os.totalmem() / 1024).toFixed(2)} GB`;

// Menu builders
global.buildMenu = (user = "User") => `╔══════════════════════════════════════════════════════════╗
║ 🔥 *${botName.toUpperCase()} - COMMAND MENU* 🔥
║ 👑 Owner: ${owner} | 📞 ${ownerNumber}
╚══════════════════════════════════════════════════════════╝
╭═══ ━ ━ ━ • ━ ━ ═══
│ ╭─────────────···
│ │ ➪ ᴏᴡɴᴇʀ : ${owner}
│ │ ➪ ᴜsᴇʀ : ${user}
│ │ ➪ ᴘʟᴜɢɪɴs : ${Object.keys(global.commands).length}+
│ │ ➪ ʀᴜɴᴛɪᴍᴇ : ${getRuntime()}
│ │ ➪ ᴍᴏᴅᴇ : ${mode}
│ │ ➪ ᴘʀᴇғɪx : ${prefix}
│ ╰─────────────···
╰═══ ━ ━ • ━ ━ ═══

Type ${prefix}allmenu for all commands

© ＥＭＡＩＬＩＴＥ ＭＤ`;

async function start() {
  console.log('🚀 Starting EMAILLITE MD...');
  console.log(`📱 Pair number set to: ${PAIR_NUMBER}`);
  
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version: baileysVersion } = await fetchLatestBaileysVersion();
  console.log(`📦 Baileys version: ${baileysVersion}`);

  const sock = makeWASocket({
    version: baileysVersion,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.macOS("Safari"),
    keepAliveIntervalMs: 10000,
    markOnlineOnConnect: true,
  });

  // FIXED PAIRING CODE - WAITS FOR SOCKET READY
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'connecting') {
      console.log('⏳ Connecting to WhatsApp...');
    }
    
    // REQUEST PAIRING CODE WHEN NOT REGISTERED
    if (!sock.authState.creds.registered && connection === 'connecting') {
      setTimeout(async () => {
        try {
          let phoneNumber = PAIR_NUMBER.replace(/[^0-9]/g, "");
          console.log(`🔥 Requesting pairing code for: +${phoneNumber}`);
          const code = await sock.requestPairingCode(phoneNumber);
          const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
          console.log(`\n🔥🔥 PAIRING CODE 🔥🔥🔥`);
          console.log(`🔗 Code for +${phoneNumber}: ${formattedCode}`);
          console.log(`🔥🔥🔥 PAIRING CODE 🔥🔥🔥\n`);
          console.log(`👆 Enter this code in WhatsApp > Linked Devices > Link with phone number`);
        } catch (e) {
          console.error("❌ Failed to get pairing code:", e.message);
        }
      }, 2000);
    }
    
    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log(`❌ Disconnected. Code: ${code}`);
      if (code === DisconnectReason.loggedOut || code === 401 || code === 428) {
        if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log("Session invalid. Restarting for new pairing...");
        setTimeout(() => start(), 5000);
      } else {
        console.log('🔄 Reconnecting...');
        setTimeout(() => start(), 3000);
      }
    } else if (connection === "open") {
      console.log(`✅ ${botName} ONLINE as ${sock.user?.id}`);
      const ownerJid = PAIR_NUMBER.replace(/[^0-9]/g, "") + '@s.whatsapp.net';
      await sock.sendMessage(ownerJid, { text: `✅ ${botName} Connected!\n\n${Object.keys(global.commands).length}+ Commands Ready\nPrefix: ${prefix}` });
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type!== "notify") return;
    const m = messages[0];
    if (!m?.message) return;

    const jid = m.key.remoteJid;
    const pushName = m.pushName || "User";
    const msg = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";
    const isGroup = jid?.endsWith('@g.us');
    const isOwner = (m.key.participant || jid)?.includes(ownerNumber?.replace(/[^0-9]/g, ""));
    
    if (!msg ||!msg.startsWith(prefix)) return;

    const args = msg.slice(prefix.length).trim().split(/\s+/);
    const cmdName = args[0].toLowerCase();
    const q = args.slice(1).join(' ');
    
    const command = global.commands[cmdName];
    if (command) {
      try {
        if (command.owner &&!isOwner) return await sock.sendMessage(jid, { text: `❌ Owner only command` }, { quoted: m });
        if (command.group &&!isGroup) return await sock.sendMessage(jid, { text: `❌ This command only works in groups` }, { quoted: m });
        await command.run(m, { sock, jid, pushName, q, isGroup, args, cmd: cmdName, prefix, config, getRuntime, getRamUsed, getRamTotal, isOwner });
      } catch (e) {
        console.error(`[ERROR] ${cmdName}:`, e);
        await sock.sendMessage(jid, { text: `❌ Error: ${e.message}` }, { quoted: m });
      }
    }
  });
}

start().catch((e) => {
  console.error("❌ Fatal error:", e);
  process.exit(1);
});
