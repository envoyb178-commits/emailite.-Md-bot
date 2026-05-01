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
const qrcode = require('qrcode-terminal');
const os = require('os');
const config = require('./config');

// Process handlers
process.on('uncaughtException', (err) => console.error('❌ Uncaught:', err));
process.on('unhandledRejection', (err) => console.error('❌ Rejection:', err));
process.setMaxListeners(0);

// Session cleanup
if (fs.existsSync(config.sessionDir) && fs.readdirSync(config.sessionDir).length < 2) {
  fs.rmSync(config.sessionDir, { recursive: true, force: true });
}
if (!fs.existsSync(config.sessionDir)) fs.mkdirSync(config.sessionDir, { recursive: true });

// Global variables
const { owner, ownerNumber, botName, version, prefix, mode, sessionDir } = config;
global.config = config;
global.commands = {};
global.categories = {};

// YOUR NUMBER FOR AUTO-PAIRING
const PAIR_NUMBER = process.env.PAIR_NUMBER || "263716491962";

// LOAD PLUGINS - ONLY ONE
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
          if (data.category && !global.categories[data.category]) {
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

// CALL loadPlugins HERE
loadPlugins();

// Utility functions
const getRuntime = () => {
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    return `${h}h ${m}m`;
};

const getRamUsed = () => `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`;
const getRamTotal = () => `${(os.totalmem() / 1024 / 1024).toFixed(2)} GB`;

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

global.allMenu = () => `╔══════════════════════════════════════════════════════════╗
║ 🔥 *${botName.toUpperCase()} - ${Object.keys(global.commands).length}+ COMMANDS* 🔥
╚══════════════════════════════════════════════════════════╝

╔═══ *MAIN* ═══╗
║.menu
║.allmenu
║.ping
║.alive
║.owner
║.uptime
║.system
║.jid
╚══════════════╝

╔═══ *AI* ═══╗
║.ai
║.gpt
║.gemini
║.claude
║.chatai
║.imagine
║.img
║.chatbot
╚════════════╝

╔═══ *LOGO* ═══╗
║.logo
║.logochrome
║.logofire
║.logogold
║.logosilver
║.logoshadow
║.logoglitch
║.logo3d
║.logocartoon
║.logoneon
║.blackpink
║.marvel
║.harrypotter
║.wolf
║.matrix
║.gradient
║.pornhub
║.love
║.shadow
║.magma
║.toxic
║.rainbow
║.blood
╚══════════════╝

╔═══ *DOWNLOAD* ═══╗
║.song
║.play
║.music
║.lyrics
║.ytsearch
║.ytmp3
║.ytmp4
║.yt
║.video
║.tiktok
║.tt
║.ig
║.insta
║.fb
║.twitter
║.threads
║.spotify
║.gimg
║.pinterest
║.ringtone
║.apk
║.mf
║.mediafire
║.ss
╚══════════════════╝

╔═══ *OWNER* ═══╗
║.mode
║.autostatus
║.anticall
║.autodl
║.setpp
║.setbotbio
║.clearsession
║.cleartmp
║.block
║.unblock
║.broadcast
║.getpp
║.device
║.sessionid
║.restart
╚═══════════════╝

╔═══ *GROUP* ═══╗
║.ban
║.unban
║.promote
║.demote
║.kick
║.mute
║.unmute
║.add
║.kickall
║.leavegc
║.leave
║.setname
║.gname
║.setdesc
║.gdesc
║.revoke
║.tagall
║.tag
║.hidetag
║.tagadmins
║.staff
║.groupinfo
║.ginfo
║.invite
║.glock
║.gunlock
║.joinrequests
║.gpp
║.removegpp
║.join
║.creategroup
║.gjids
╚═══════════════╝

╔═══ *SECURITY* ═══╗
║.antilink
║.antitag
║.antibadword
║.antidelete
║.slowmode
║.lockgroup
║.unlockgroup
║.warn
║.warnings
║.delete
║.antispam
╚══════════════════╝

╔═══ *PC GAMES* ═══╗
║.pcgames
║.gta5
║.minecraft
║.valorant
║.pubg
║.fifa
║.callofduty
║.cyberpunk
║.reddead
║.pcexo
╚══════════════════╝

╔═══ *ANDROID APK* ═══╗
║.modapk
║.netflix
║.youtube
║.whatsapp
║.instagram
║.capcut
║.lightroom
╚═════════════════════╝

╔═══ *EDUCATION* ═══╗
║.subjects
║.maths
║.english
║.science
║.shona
║.history
║.geography
║.commerce
║.biology
║.chemistry
║.physics
║.pastpapers
║.syllabus
╚═══════════════════╝

╔═══ *TOOLS* ═══╗
║.sticker
║.s
║.take
║.photo
║.qr
║.shorturl
║.weather
║.translate
║.tts
║.calc
║.password
║.hash
║.base64
║.timestamp
║.reminder
║.savecontact
║.vv2
║.crypto
║.currency
║.saveweb
║.terminal
║.card
║.qimg
║.groupstatus
║.attp
║.gitstalk
║.ipfinder
║.whois
║.trim
║.find
║.image
║.mp3
╚═══════════════╝

╔═══ *AUDIO* ═══╗
║.karaoke
║.reverb
║.bass
║.nightcore
║.slow
║.fast
║.robot
║.echo
╚═══════════════╝

╔═══ *FUN* ═══╗
║.trivia
║.truth
║.dare
║.8ball
║.dice
║.coin
║.random
║.ship
║.simp
║.meme
║.joke
║.quote
║.compliment
║.insult
║.flirt
║.roast
║.riddle
║.goodnight
║.roseday
║.wiki
║.count
║.reverse
║.palindrome
║.fun
║.kill
║.boom
║.report
╚═════════════╝

╔═══ *NEWS* ═══╗
║.news
║.cricket
║.livecric
║.football
║.sports
╚══════════════╝

╔═══ *SETTINGS* ═══╗
║.setting
║.mybot
║.reset
║.deleteme
║.addreply
║.addimgreply
║.delreply
║.listreply
║.pair
║.active
║.npm
║.getdp
╚══════════════════╝

╔══════════════════════════════════════════════════════════╗
║ 📊 Total: ${Object.keys(global.commands).length}+ Commands | Prefix:.
║ 🤖 ${botName} v${version}
╚══════════════════════════════════════════════════════════╝`;

// Main bot start function
async function start() {
  console.log('🚀 Starting EMAILLITE MD...');
  
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version: baileysVersion } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version: baileysVersion,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.macOS("Safari"),
    keepAliveIntervalMs: 10000,
    markOnlineOnConnect: true,
  });

  // AUTO PAIRING FOR YOUR NUMBER 263716491962
  setTimeout(async () => {
    try {
      if (!sock.authState.creds.registered) {
        let phoneNumber = PAIR_NUMBER.replace(/[^0-9]/g, "");
        console.log(`🔥 Requesting pairing code for: +${phoneNumber}`);
        const code = await sock.requestPairingCode(phoneNumber);
        const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
        console.log(`\n🔥🔥 PAIRING CODE 🔥🔥🔥\n🔗 Code for +${phoneNumber}: ${formattedCode}\n🔥🔥🔥 PAIRING CODE 🔥🔥🔥\n`);
      }
    } catch (e) {
      console.error("❌ Failed to get pairing code:", e.message);
    }
  }, 3000);

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (u) => {
    const { connection, lastDisconnect } = u;
    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log(`❌ Disconnected. Code: ${code}`);
      if (code === DisconnectReason.loggedOut || code === 401 || code === 428) {
        if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log("Session invalid. Restarting for new pairing...");
        setTimeout(() => start(), 5000);
      } else {
        setTimeout(() => start(), 3000);
      }
    } else if (connection === "open") {
      console.log(`✅ ${botName} ONLINE as ${sock.user?.id}`);
      const ownerJid = PAIR_NUMBER.replace(/[^0-9]/g, "") + '@s.whatsapp.net';
      await sock.sendMessage(ownerJid, { text: `✅ ${botName} Connected!\n\n${Object.keys(global.commands).length}+ Commands Ready\nPrefix: ${prefix}` });
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    const m = messages[0];
    if (!m?.message) return;

    const jid = m.key.remoteJid;
    const pushName = m.pushName || "User";
    const msg = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";
    const isGroup = jid?.endsWith('@g.us');
    const isOwner = (m.key.participant || jid)?.includes(ownerNumber?.replace(/[^0-9]/g, ""));
    
    if (!msg || !msg.startsWith(prefix)) return;

    const args = msg.slice(prefix.length).trim().split(/\s+/);
    const cmdName = args[0].toLowerCase();
    const q = args.slice(1).join(' ');
    
    const command = global.commands[cmdName];
    if (command) {
      try {
        if (command.owner && !isOwner) return await sock.sendMessage(jid, { text: `❌ Owner only command` }, { quoted: m });
        if (command.group && !isGroup) return await sock.sendMessage(jid, { text: `❌ This command only works in groups` }, { quoted: m });
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
