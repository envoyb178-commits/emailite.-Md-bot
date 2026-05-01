const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('EMAILLITE MD BOT is running'));
app.get('/ping', (req, res) => res.send('pong'));
app.listen(PORT, () => console.log(`✅ Web server online on port ${PORT}`));

console.log('🚀 BOOTING EMAILLITE MD...');

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// HARD-CODED CONFIG - NO config.js NEEDED
const config = {
  owner: "EMAILLITE",
  ownerNumber: "263716491962",
  botName: "EMAILLITE MD",
  version: "6.0.0",
  prefix: ".",
  mode: "public",
  sessionDir: "./session"
};

console.log('✅ Config loaded');

process.on('uncaughtException', (err) => console.error('❌ Uncaught:', err));
process.on('unhandledRejection', (err) => console.error('❌ Rejection:', err));
process.setMaxListeners(0);

// FORCE DELETE SESSION EVERY TIME - GUARANTEES PAIRING CODE
console.log('🗑️ Deleting session to force pairing...');
if (fs.existsSync(config.sessionDir)) {
  fs.rmSync(config.sessionDir, { recursive: true, force: true });
}
fs.mkdirSync(config.sessionDir, { recursive: true });
console.log('✅ Session cleared');

// Global variables
const { owner, ownerNumber, botName, version, prefix, mode, sessionDir } = config;
global.config = config;
global.commands = {};
global.categories = {};

// YOUR NUMBER
const PAIR_NUMBER = "263716491962";
console.log(`📱 Pair number: ${PAIR_NUMBER}`);

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

// Main bot start function
async function start() {
  console.log('🚀 Starting WhatsApp connection...');
  
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version: baileysVersion } = await fetchLatestBaileysVersion();
  console.log(`📦 Baileys version: ${baileysVersion}`);

  const sock = makeWASocket({
    version: baileysVersion,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.macOS("Safari"),
  });

  // PAIRING CODE - RUNS IMMEDIATELY
  console.log('🔥 Checking if pairing needed...');
  if (!sock.authState.creds.registered) {
    console.log('🔥 NOT REGISTERED - REQUESTING CODE NOW...');
    setTimeout(async () => {
      try {
        let phoneNumber = PAIR_NUMBER.replace(/[^0-9]/g, "");
        console.log(`🔥 Requesting pairing code for: +${phoneNumber}`);
        const code = await sock.requestPairingCode(phoneNumber);
        const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
        console.log(`\n`);
        console.log(`🔥🔥🔥🔥🔥🔥🔥`);
        console.log(`🔗 PAIRING CODE: ${formattedCode}`);
        console.log(`🔗 For number: +${phoneNumber}`);
        console.log(`🔥🔥🔥🔥🔥`);
        console.log(`\n👆 WhatsApp > Linked Devices > Link with phone number > Enter code`);
        console.log(`\n`);
      } catch (e) {
        console.error("❌ FAILED TO GET PAIRING CODE:", e);
      }
    }, 1000);
  } else {
    console.log('✅ Already registered - no pairing needed');
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === "connecting") {
      console.log('⏳ Connecting to WhatsApp...');
    }
    
    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log(`❌ Disconnected. Code: ${code}`);
      console.log('🔄 Restarting in 5 seconds...');
      setTimeout(() => start(), 5000);
    } else if (connection === "open") {
      console.log(`✅ ${botName} ONLINE as ${sock.user?.id}`);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type!== "notify") return;
    const m = messages[0];
    if (!m?.message || m.key.fromMe) return;

    const jid = m.key.remoteJid;
    const msg = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";
    
    if (!msg.startsWith(prefix)) return;

    const args = msg.slice(prefix.length).trim().split(/\s+/);
    const cmdName = args[0].toLowerCase();
    
    const command = global.commands[cmdName];
    if (command) {
      try {
        await command.run(m, { sock, jid, args, cmd: cmdName, prefix, config });
      } catch (e) {
        console.error(`[ERROR] ${cmdName}:`, e);
      }
    }
  });
}

console.log('🎯 Calling start function...');
start().catch((e) => {
  console.error("❌ Fatal error:", e);
  process.exit(1);
});
